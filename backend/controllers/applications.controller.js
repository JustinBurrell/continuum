const mongoose = require('mongoose');
const Application = require('../models/Application');
const posthog = require('../lib/posthog');
const { getOrSet, invalidatePattern } = require('../lib/cache');

// ============================================================
// APPLICATIONS CONTROLLER
// Purpose: Handle business logic for job application tracking endpoints
// Used by: routes/applications.routes.js
// Endpoints: createApplication, getApplications, updateApplication,
//            getDashboard, addContact, addReminder, deleteApplication
// ============================================================

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ----------------------------------------
// POST /api/applications
// Purpose: Create a new job application entry
// Body: { company (required), position (required), location?, jobUrl?,
//         status?, appliedAt?, deadlineDate?, notes?, resumeUsed? }
// ----------------------------------------
exports.createApplication = async (req, res) => {
    const {
        company,
        position,
        location,
        salary,
        jobUrl,
        status,
        appliedAt,
        deadlineDate,
        notes,
        resumeUsed,
    } = req.body;

    if (!company || !position) {
        return res.status(400).json({ success: false, error: 'company and position are required' });
    }

    const application = await Application.create({
        userId: req.user._id,
        company,
        position,
        location,
        salary,
        jobUrl,
        status,
        appliedAt,
        deadlineDate,
        notes,
        resumeUsed: resumeUsed || null,
    });

    await invalidatePattern(`applications:${req.user._id.toString()}`).catch(() => {});

    res.status(201).json({ success: true, application });
};

// ----------------------------------------
// GET /api/applications
// Purpose: List the authenticated user's applications with optional filters
// Query params: status, search (matches company or position)
// Sorted newest first
// ----------------------------------------
exports.getApplications = async (req, res) => {
    const { status, search } = req.query;

    const filter = {
        userId: req.user._id,
        deletedAt: null,
    };

    if (status) filter.status = status;

    if (search) {
        const regex = new RegExp(escapeRegex(search.trim().slice(0, 200)), 'i');
        filter.$or = [
            { company: regex },
            { position: regex },
        ];
    }

    const cacheKey = `applications:${req.user._id.toString()}:${search || ''}:${status || ''}`;
    const fetchApps = () => Application.find(filter).sort({ createdAt: -1 });

    const applications = search
        ? await fetchApps()
        : await getOrSet(cacheKey, 120, fetchApps);

    res.status(200).json({ success: true, applications });
};

// ----------------------------------------
// PUT /api/applications/:id
// Purpose: Update top-level fields on an application
// ----------------------------------------
exports.updateApplication = async (req, res) => {
    const {
        company,
        position,
        location,
        salary,
        jobUrl,
        status,
        appliedAt,
        interviewDates,
        offerReceivedAt,
        deadlineDate,
        notes,
        resumeUsed,
    } = req.body;

    const application = await Application.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, deletedAt: null },
        {
            company,
            position,
            location,
            salary,
            jobUrl,
            status,
            appliedAt,
            interviewDates,
            offerReceivedAt,
            deadlineDate,
            notes,
            resumeUsed,
        },
        { new: true, runValidators: true }
    );

    if (!application) {
        return res.status(404).json({ success: false, error: 'Application not found' });
    }

    await invalidatePattern(`applications:${req.user._id.toString()}`).catch(() => {});

    res.status(200).json({ success: true, application });
};

// ----------------------------------------
// GET /api/applications/dashboard
// Purpose: Return pipeline summary — count of applications grouped by status
// Response: { total, pipeline: { draft, applied, interview, offer, rejected, withdrawn } }
// ----------------------------------------
exports.getDashboard = async (req, res) => {
    // Explicitly cast to ObjectId — aggregate $match does not auto-cast types
    const userId = new mongoose.Types.ObjectId(req.user._id.toString());
    const counts = await Application.aggregate([
        { $match: { userId, deletedAt: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Build a flat object with 0 defaults for every status
    const pipeline = {
        draft: 0,
        applied: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
        withdrawn: 0,
    };

    let total = 0;
    for (const { _id, count } of counts) {
        pipeline[_id] = count;
        total += count;
    }

    res.status(200).json({ success: true, total, pipeline });
};

// ----------------------------------------
// POST /api/applications/:id/contacts
// Purpose: Add a networking contact to an application
// Body: { name, role?, email?, linkedIn?, lastContactDate?, notes? }
// ----------------------------------------
exports.addContact = async (req, res) => {
    const { name, role, email, linkedIn, lastContactDate, notes } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, error: 'name is required' });
    }

    const application = await Application.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, deletedAt: null },
        {
            $push: {
                contacts: { name, role, email, linkedIn, lastContactDate, notes },
            },
        },
        { new: true }
    );

    if (!application) {
        return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const newContact = application.contacts[application.contacts.length - 1];
    res.status(201).json({ success: true, contact: newContact, application });
};

// ----------------------------------------
// POST /api/applications/:id/reminders
// Purpose: Add a follow-up reminder to an application
// Body: { date (required), description? }
// ----------------------------------------
exports.addReminder = async (req, res) => {
    const { date, description } = req.body;

    if (!date) {
        return res.status(400).json({ success: false, error: 'date is required' });
    }

    const application = await Application.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, deletedAt: null },
        {
            $push: {
                followUpReminders: { date, description, completed: false },
            },
        },
        { new: true }
    );

    if (!application) {
        return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const newReminder = application.followUpReminders[application.followUpReminders.length - 1];
    res.status(201).json({ success: true, reminder: newReminder, application });
};

// ----------------------------------------
// GET /api/applications/:id
// ----------------------------------------
exports.getApplicationById = async (req, res) => {
    const application = await Application.findOne({ _id: req.params.id, userId: req.user._id });
    if (!application) {
        return res.status(404).json({ success: false, error: 'Application not found' });
    }
    res.status(200).json({ success: true, application });
};

// ----------------------------------------
// DELETE /api/applications/:id/contacts/:contactId
// ----------------------------------------
exports.deleteContact = async (req, res) => {
    const application = await Application.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { $pull: { contacts: { _id: req.params.contactId } } },
        { new: true }
    );
    if (!application) {
        return res.status(404).json({ success: false, error: 'Application not found' });
    }
    res.status(200).json({ success: true, application });
};

// ----------------------------------------
// DELETE /api/applications/:id/reminders/:reminderId
// ----------------------------------------
exports.deleteReminder = async (req, res) => {
    const application = await Application.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { $pull: { followUpReminders: { _id: req.params.reminderId } } },
        { new: true }
    );
    if (!application) {
        return res.status(404).json({ success: false, error: 'Application not found' });
    }
    res.status(200).json({ success: true, application });
};

// ----------------------------------------
// DELETE /api/applications/:id
// Purpose: Permanently delete an application (owner only, hard delete)
// ----------------------------------------
exports.deleteApplication = async (req, res) => {
    const application = await Application.findById(req.params.id);
    if (!application) {
        return res.status(404).json({ success: false, error: 'Application not found' });
    }
    if (application.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    await Application.deleteOne({ _id: req.params.id });
    await invalidatePattern(`applications:${req.user._id.toString()}`).catch(() => {});
    res.status(200).json({ success: true, message: 'Application deleted' });
};

const Application = require('../models/Application');

// ============================================================
// APPLICATIONS CONTROLLER
// Purpose: Handle business logic for job application tracking endpoints
// Used by: routes/applications.routes.js
// Endpoints: createApplication, getApplications, updateApplication,
//            getDashboard, addContact, addReminder
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

    const applications = await Application.find(filter)
        .sort({ createdAt: -1 });

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

    res.status(200).json({ success: true, application });
};

// ----------------------------------------
// GET /api/applications/dashboard
// Purpose: Return pipeline summary — count of applications grouped by status
// Response: { total, pipeline: { draft, applied, interview, offer, rejected, withdrawn } }
// ----------------------------------------
exports.getDashboard = async (req, res) => {
    const counts = await Application.aggregate([
        { $match: { userId: req.user._id, deletedAt: null } },
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

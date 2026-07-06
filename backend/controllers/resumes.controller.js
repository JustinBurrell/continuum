const Resume = require('../models/Resume');
const cloudinary = require('../config/cloudinary');
const groqService = require('../services/groq.service');
const posthog = require('../lib/posthog');
const { parseOfficeFile } = require('../services/fileParser.service');

// ============================================================
// RESUMES CONTROLLER
// Purpose: Handle business logic for resume upload and AI feedback endpoints
// Used by: routes/resumes.routes.js
// Endpoints: uploadResume, getResumes, generateFeedback, getFeedback
// ============================================================

// ----------------------------------------
// Helper: uploadBufferToCloudinary
// Purpose: Upload an in-memory buffer to Cloudinary
// Used instead of stream pipe because multer memoryStorage gives us a buffer, not a stream
// ----------------------------------------
const uploadBufferToCloudinary = (buffer, fileName) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'continuum/resumes',
                public_id: fileName.replace(/\.[^.]+$/, ''), // strip extension
                resource_type: 'raw',
                type: 'upload',
                format: 'pdf',
                overwrite: false, // each upload is a new version
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

// ----------------------------------------
// POST /api/resumes/upload
// Purpose: Upload a resume PDF — parse text with pdf-parse, upload file to Cloudinary,
//          save Resume doc with extractedText cached for instant AI feedback later
// Body: multipart/form-data — field name: "resume"
// Optional body fields: version, targetRole
// ----------------------------------------
exports.uploadResume = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'A PDF file is required' });
    }

    const { version, targetRole } = req.body;

    // Extract plain text from PDF buffer — cached so AI feedback is instant later
    const extractedText = await parseOfficeFile(req.file.buffer, 'application/pdf');

    // Upload to Cloudinary
    const cloudinaryResult = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);

    const resume = await Resume.create({
        userId: req.user._id,
        fileName: req.file.originalname,
        fileUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        version: version || null,
        targetRole: targetRole || null,
        extractedText,
        uploadedAt: new Date(),
    });

    // Return resume without extractedText (select: false keeps it out of the response)
    const resumeResponse = await Resume.findById(resume._id);
    res.status(201).json({ success: true, resume: resumeResponse });
};

// ----------------------------------------
// GET /api/resumes/:id/download
// Purpose: Generate a signed Cloudinary URL for secure PDF download
// Solves 401: raw Cloudinary URLs require a signed token for direct browser access
// ----------------------------------------
exports.downloadResume = async (req, res) => {
    const resume = await Resume.findOne({ _id: req.params.id, deletedAt: null });
    if (!resume) {
        return res.status(404).json({ success: false, error: 'Resume not found' });
    }
    if (resume.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const baseName = resume.fileName.replace(/\.pdf$/i, '');
    const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const downloadUrl = resume.fileUrl.replace('/upload/', `/upload/fl_attachment:${safeName}/`);
    res.status(200).json({ success: true, downloadUrl });
};

// ----------------------------------------
// GET /api/resumes
// Purpose: List the authenticated user's resumes, newest first
// Note: extractedText has select: false — not returned here (large field, only needed for AI)
// ----------------------------------------
exports.getResumes = async (req, res) => {
    const { search } = req.query;
    const filter = { userId: req.user._id, deletedAt: null };

    if (search) {
        const regex = { $regex: search, $options: 'i' };
        filter.$or = [
            { fileName: regex },
            { version: regex },
            { targetRole: regex },
        ];
    }

    const resumes = await Resume.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, resumes });
};

// ----------------------------------------
// POST /api/resumes/:id/feedback
// Purpose: Generate AI feedback for a resume using Groq
//   - Re-fetches resume with +extractedText (select: false by default)
//   - Calls Groq with the cached text
//   - Pushes new feedback entry onto resume.feedback[]
// ----------------------------------------
exports.generateFeedback = async (req, res) => {
    // Re-fetch with extractedText — select: false means normal findById won't include it
    const resume = await Resume.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    }).select('+extractedText');

    if (!resume) {
        return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    if (!resume.extractedText || resume.extractedText.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'No extracted text available for this resume' });
    }

    // Cooldown: prevent regeneration within 1 hour
    if (resume.feedback && resume.feedback.length > 0) {
        const lastFeedback = resume.feedback[resume.feedback.length - 1];
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        if (lastFeedback.generatedAt && new Date(lastFeedback.generatedAt).getTime() > oneHourAgo) {
            return res.status(429).json({ success: false, error: 'Wait 1 hour before regenerating feedback' });
        }
    }

    const result = await groqService.generateResumeFeedback(resume.extractedText, req.user._id);

    const updated = await Resume.findByIdAndUpdate(
        resume._id,
        {
            $push: {
                feedback: {
                    overallScore: result.overallScore,
                    strengths: result.strengths,
                    improvements: result.improvements,
                    sections: result.sections,
                    keywordOptimization: result.keywordOptimization,
                    model: result.model,
                    generatedAt: new Date(),
                },
            },
        },
        { new: true }
    );

    posthog.capture(req.user, 'resume_feedback_generated', { platform: 'web', resume_id: resume._id.toString() });

    res.status(200).json({ success: true, feedback: updated.feedback[updated.feedback.length - 1], resume: updated });
};

// ----------------------------------------
// DELETE /api/resumes/:id
// Purpose: Soft-delete a resume and remove the file from Cloudinary.
// Feedback is embedded on the Resume document so it is implicitly deleted with it.
// ----------------------------------------
exports.deleteResume = async (req, res) => {
    const resume = await Resume.findOne({ _id: req.params.id, deletedAt: null });

    if (!resume) {
        return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    if (resume.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Remove file from Cloudinary so storage isn't wasted
    if (resume.publicId) {
        try {
            await cloudinary.uploader.destroy(resume.publicId, { resource_type: 'raw' });
        } catch (_) { /* non-blocking — soft-delete still proceeds */ }
    }

    resume.deletedAt = new Date();
    await resume.save();

    res.status(200).json({ success: true, message: 'Resume deleted' });
};

// ----------------------------------------
// GET /api/resumes/:id/feedback
// Purpose: Return all feedback entries for a resume
// ----------------------------------------
exports.getFeedback = async (req, res) => {
    const resume = await Resume.findOne({ _id: req.params.id, deletedAt: null });

    if (!resume) {
        return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    if (resume.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.status(200).json({ success: true, feedback: resume.feedback });
};

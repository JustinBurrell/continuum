const { PDFParse } = require('pdf-parse');
const Resume = require('../models/Resume');
const cloudinary = require('../config/cloudinary');
const groqService = require('../services/groq.service');

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
                type: 'authenticated', // private — requires signed URL for access
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
    const parser = new PDFParse({ data: req.file.buffer });
    const pdfData = await parser.getText();
    await parser.destroy();
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Could not extract text from PDF — ensure the file is not scanned/image-only' });
    }

    // Upload to Cloudinary
    const cloudinaryResult = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);

    const resume = await Resume.create({
        userId: req.user._id,
        fileName: req.file.originalname,
        fileUrl: cloudinaryResult.secure_url,
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
    const resume = await Resume.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    });
    if (!resume) {
        return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Extract delivery type and public_id from the stored URL.
    // Old uploads: /raw/upload/   → type: 'upload'
    // New uploads: /raw/authenticated/ → type: 'authenticated'
    // URL format: https://res.cloudinary.com/{cloud}/raw/{type}/v{n}/{folder}/{name}.pdf
    const typeMatch = resume.fileUrl.match(/\/raw\/(upload|authenticated)\//i);
    const deliveryType = typeMatch ? typeMatch[1] : 'upload';

    const match = resume.fileUrl.match(/\/raw\/(?:upload|authenticated)\/(v\d+\/)?(.+?)(?:\.pdf)?$/i);
    if (!match) {
        return res.status(500).json({ success: false, error: 'Invalid file URL format' });
    }
    // Decode URL-encoded characters (e.g. spaces: %20 → ' ') before passing to Cloudinary SDK
    const publicId = decodeURIComponent(match[2]);

    // private_download_url generates a signed API-level download URL (not CDN).
    // Pass the correct delivery type so Cloudinary finds the right asset.
    const downloadUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
        resource_type: 'raw',
        type: deliveryType,
        expires_at: Math.floor(Date.now() / 1000) + 600,
        attachment: false, // open in browser (PDF viewer); set true to force file save
    });

    res.json({ success: true, downloadUrl });
};

// ----------------------------------------
// GET /api/resumes
// Purpose: List the authenticated user's resumes, newest first
// Note: extractedText has select: false — not returned here (large field, only needed for AI)
// ----------------------------------------
exports.getResumes = async (req, res) => {
    const resumes = await Resume.find({
        userId: req.user._id,
        deletedAt: null,
    }).sort({ createdAt: -1 });

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

    const result = await groqService.generateResumeFeedback(resume.extractedText);

    // Push new feedback entry onto the embedded array
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

    res.status(200).json({ success: true, feedback: updated.feedback[updated.feedback.length - 1], resume: updated });
};

// ----------------------------------------
// GET /api/resumes/:id/feedback
// Purpose: Return all feedback entries for a resume
// ----------------------------------------
exports.getFeedback = async (req, res) => {
    const resume = await Resume.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    });

    if (!resume) {
        return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    res.status(200).json({ success: true, feedback: resume.feedback });
};

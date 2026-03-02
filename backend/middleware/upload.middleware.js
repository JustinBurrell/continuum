const multer = require('multer');

// ============================================================
// UPLOAD MIDDLEWARE
// Purpose: Configure multer for in-memory file uploads
// Used by: routes/resumes.routes.js (resume PDF uploads)
// Strategy: memoryStorage — file buffer available as req.file.buffer
//           for immediate piping to Cloudinary and parsing with pdf-parse
// ============================================================

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
});

module.exports = upload;

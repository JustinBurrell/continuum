const multer = require('multer');

// ============================================================
// UPLOAD IMAGE MIDDLEWARE
// Purpose: Configure multer for in-memory image uploads
// Used by: routes/auth.routes.js (profile picture uploads)
// Strategy: memoryStorage — file buffer available as req.file.buffer
//           for immediate piping to Cloudinary
// ============================================================

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
};

const uploadImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
});

module.exports = uploadImage;

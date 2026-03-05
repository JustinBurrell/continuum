const cloudinary = require('cloudinary').v2;

// ============================================================
// CLOUDINARY CONFIG
// Purpose: Initialize and export the Cloudinary client
// Used by: controllers that upload files (note PDFs, resume PDFs)
// Folder structure:
//   continuum/notes/            — Google Doc PDF exports
//   continuum/resumes/          — Resume uploads
//   continuum/profiles/{userId} — Profile avatars (public_id: avatar, overwrite: true)
// ============================================================

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;

// ============================================================
// GOOGLE CONTROLLER
// Purpose: Handle business logic for Google Drive API endpoints
// Used by: routes/google.routes.js
//
// NOTE: listFiles was removed as part of the drive.file scope migration.
// Drive-wide file listing (drive.files.list) requires drive.readonly scope and is
// incompatible with drive.file (user-selected-file access only).
// File selection now happens client-side via Google Picker.
// Import and refresh continue to work via notes.controller.js using stored googleDocId.
// ============================================================

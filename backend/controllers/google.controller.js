const getGoogleDriveClient = require('../config/googleDrive');

// ============================================================
// GOOGLE CONTROLLER
// Purpose: Handle business logic for Google Drive API endpoints
// Used by: routes/google.routes.js
// Endpoints: listFiles
// ============================================================

// ----------------------------------------
// GET /api/google/files
// Purpose: List the authenticated user's Google Docs files from Drive
// ----------------------------------------
exports.listFiles = async (req, res) => {
    // User must have a linked Google account to call Drive
    if (!req.user.googleId) {
        return res.status(403).json({ success: false, error: 'Google account not linked' });
    }

    // Build an authenticated Drive client, refreshing the access token if needed
    const drive = await getGoogleDriveClient(req.user);

    // Query Drive for Google Docs only — mimeType filter excludes Sheets, Slides, etc.
    // fields specifies exactly what data to return (keeps response lean)
    const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.document' and trashed=false",
        fields: 'files(id, name, modifiedTime, webViewLink)',
        orderBy: 'modifiedTime desc',
        pageSize: 50,
    });

    res.status(200).json({ success: true, files: response.data.files });
};

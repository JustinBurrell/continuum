const getGoogleDriveClient = require('../config/googleDrive');
const User = require('../models/User');
const { decrypt } = require('../lib/tokenCrypto');

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

// ----------------------------------------
// GET /api/google/token
// Purpose: Return the user's current Google access token for use by the Google Picker
// The Picker runs in the browser and needs a valid OAuth access token to show the user's files.
// Token is auto-refreshed via getGoogleDriveClient before being returned.
// ----------------------------------------
exports.getAccessToken = async (req, res) => {
    if (!req.user.googleId) {
        return res.status(403).json({ success: false, error: 'Google account not linked' });
    }

    // Trigger auto-refresh if token is expired, then read fresh value from DB
    await getGoogleDriveClient(req.user);
    const userWithToken = await User.findById(req.user._id).select('+googleAccessToken');
    const accessToken = decrypt(userWithToken.googleAccessToken);

    res.status(200).json({ success: true, accessToken });
};

const { google } = require('googleapis');
const User = require('../models/User');

// ============================================================
// GOOGLE DRIVE CLIENT
// Purpose: Build an authenticated Google Drive API client for a given user
// Used by: controllers that need to call the Drive or Docs API
// Flow: load user's stored tokens → set credentials → refresh if expired → return client
// ============================================================

// ----------------------------------------
// getGoogleDriveClient
// Purpose: Return an authenticated Drive client using the user's stored OAuth tokens
//          Automatically refreshes the access token if it has expired
// @param {Object} user - Mongoose user document (must have googleAccessToken, googleRefreshToken)
// @returns {drive} - Authenticated Google Drive API client
// ----------------------------------------
const getGoogleDriveClient = async (user) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL
    );

    // Load the user's stored tokens into the client
    oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
    });

    // If the access token is expired (or within 5 min of expiry), refresh it
    const isExpired = !user.googleTokenExpiry || user.googleTokenExpiry <= new Date(Date.now() + 5 * 60 * 1000);

    if (isExpired && user.googleRefreshToken) {
        // Ask Google for a new access token using the refresh token
        const { credentials } = await oauth2Client.refreshAccessToken();

        // Save the new token back to the user so the next request doesn't refresh again
        await User.findByIdAndUpdate(user._id, {
            googleAccessToken: credentials.access_token,
            googleTokenExpiry: new Date(credentials.expiry_date),
        });

        // Apply the fresh token to the client
        oauth2Client.setCredentials(credentials);
    }

    return google.drive({ version: 'v3', auth: oauth2Client });
};

module.exports = getGoogleDriveClient;

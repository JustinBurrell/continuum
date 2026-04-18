const { google } = require('googleapis');
const User = require('../models/User');
const { encrypt, decrypt } = require('../lib/tokenCrypto');

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

    // googleAccessToken and googleRefreshToken have select: false — re-fetch with those fields explicitly
    const userWithTokens = await User.findById(user._id).select('+googleAccessToken +googleRefreshToken +googleTokenExpiry');

    // Decrypt tokens before use — they are stored AES-256-GCM encrypted at rest
    oauth2Client.setCredentials({
        access_token: decrypt(userWithTokens.googleAccessToken),
        refresh_token: decrypt(userWithTokens.googleRefreshToken),
    });

    // If the access token is expired (or within 5 min of expiry), refresh it
    const tokenExpiry = userWithTokens.googleTokenExpiry || user.googleTokenExpiry;
    const isExpired = !tokenExpiry || tokenExpiry <= new Date(Date.now() + 5 * 60 * 1000);

    if (isExpired && userWithTokens.googleRefreshToken) {
        // Ask Google for a new access token using the refresh token
        const { credentials } = await oauth2Client.refreshAccessToken();

        // Save the refreshed token encrypted — same at-rest protection as initial storage
        await User.findByIdAndUpdate(user._id, {
            googleAccessToken: encrypt(credentials.access_token),
            googleTokenExpiry: new Date(credentials.expiry_date),
        });

        // Apply the fresh token to the client
        oauth2Client.setCredentials(credentials);
    }

    return google.drive({ version: 'v3', auth: oauth2Client });
};

module.exports = getGoogleDriveClient;

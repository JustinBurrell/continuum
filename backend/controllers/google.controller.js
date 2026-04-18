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

// ----------------------------------------
// GET /api/google/picker-page
// Purpose: Serve an HTML page that loads the Google Picker for Android WebView
//          The Picker is pre-configured with the user's decrypted access token so no
//          additional OAuth flow is needed inside the WebView.
//          Android injects a JavascriptInterface ("AndroidPicker") before loading this page;
//          on file selection the page calls AndroidPicker.onFilePicked(id, name, url).
// ----------------------------------------
exports.getPickerPage = async (req, res) => {
    if (!req.user.googleId) {
        return res.status(403).send('<p>Google account not linked</p>');
    }

    // Auto-refresh token if expired, then read the fresh decrypted value
    await getGoogleDriveClient(req.user);
    const userWithToken = await User.findById(req.user._id).select('+googleAccessToken');
    const accessToken = decrypt(userWithToken.googleAccessToken);

    const apiKey = process.env.GOOGLE_PICKER_API_KEY;
    const appId  = process.env.GOOGLE_APP_ID;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; height: 100vh; display: flex; align-items: center; justify-content: center; }
    .status { color: #fff; font-family: sans-serif; font-size: 15px; opacity: 0.7; }
  </style>
</head>
<body>
  <p class="status" id="status">Loading…</p>
  <script>
    function loadPicker() {
      gapi.load('picker', function () {
        document.getElementById('status').style.display = 'none';
        new google.picker.PickerBuilder()
          .setOAuthToken('${accessToken}')
          .setDeveloperKey('${apiKey}')
          .setAppId('${appId}')
          .addView(
            new google.picker.DocsView()
              .setMimeTypes('application/vnd.google-apps.document')
          )
          .setCallback(function (data) {
            if (data.action === google.picker.Action.PICKED) {
              var doc = data.docs[0];
              var url = doc.url || ('https://docs.google.com/document/d/' + doc.id + '/edit');
              if (window.AndroidPicker) AndroidPicker.onFilePicked(doc.id, doc.name, url);
            } else if (data.action === google.picker.Action.CANCEL) {
              if (window.AndroidPicker) AndroidPicker.onPickerCancelled();
            }
          })
          .build()
          .setVisible(true);
      });
    }
  </script>
  <script src="https://apis.google.com/js/api.js?onload=loadPicker"></script>
</body>
</html>`;

    // No caching — token is short-lived
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
};

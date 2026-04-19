const jwt = require('jsonwebtoken');
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
      // Load both 'auth' and 'picker' — the auth module lets us call
      // gapi.auth.setToken() to establish a gapi session from the server-side
      // token without needing Google cookies or a sign-in popup.
      // Without this, the Picker shows "Can't access your Google account"
      // in a WebView because there is no Google session in the WebView context.
      gapi.load('auth:picker', function () {
        gapi.auth.setToken({ access_token: '${accessToken}' });
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

// ----------------------------------------
// GET /api/google/picker-page-cct
// Purpose: Serve Google Picker HTML for Android Chrome Custom Tabs (CCT).
//          CCT cannot set custom request headers, so the app JWT is verified
//          inline from ?token= query param.
//
// Auth strategy: Google Identity Services (GIS) initTokenClient running inside
// Chrome. GIS uses Chrome's existing Google account session to obtain a fresh
// OAuth token — this is what satisfies the Picker's browser-session check.
// The backend access token is NOT embedded in the HTML; GIS acquires one
// directly in the browser, eliminating token exposure in the URL and bypassing
// the "Can't access your Google account" error caused by a missing browser session.
//
// On file selection the page redirects to continuum://drive-pick?id=...&name=...&url=...
// which the app receives as a deep link and uses to trigger the import flow.
// ----------------------------------------
exports.getPickerPageCCT = async (req, res) => {
    const rawToken = req.query.token;
    if (!rawToken) {
        return res.status(401).send('<p>Authentication required</p>');
    }

    let decoded;
    try {
        decoded = jwt.verify(rawToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
        return res.status(401).send('<p>Invalid or expired token</p>');
    }

    const user = await User.findById(decoded.userId).select('+googleId');
    if (!user || !user.googleId) {
        return res.status(403).send('<p>Google account not linked</p>');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const apiKey   = process.env.GOOGLE_PICKER_API_KEY;
    const appId    = process.env.GOOGLE_APP_ID;

    // GIS + Picker integration pattern (standard Google recommendation):
    //   1. Load GIS script  → onGisLoad()  sets up the token client
    //   2. Load gapi script → gapiLoaded() calls gapi.load('picker', ...)
    //   3. Once BOTH are ready → maybeStart() requests a token via GIS
    //   4. GIS silently uses Chrome's Google session (or shows sign-in if absent)
    //   5. Token callback → buildPicker(token) → Picker opens
    //   6. User picks a file → redirect to continuum://drive-pick deep link
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
    var CLIENT_ID = '${clientId}';
    var API_KEY   = '${apiKey}';
    var APP_ID    = '${appId}';

    var tokenClient;
    var pickerInited = false;
    var gisInited    = false;

    // Called when gapi.js finishes loading
    function gapiLoaded() {
      gapi.load('picker', function () {
        pickerInited = true;
        maybeStart();
      });
    }

    // Called when the GIS script finishes loading
    function onGisLoad() {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: function (response) {
          if (response.access_token) {
            buildPicker(response.access_token);
          }
        }
      });
      gisInited = true;
      maybeStart();
    }

    // Start only after both libraries are ready
    function maybeStart() {
      if (!pickerInited || !gisInited) return;
      document.getElementById('status').style.display = 'none';
      // prompt: '' → silent if Chrome already has this Google account signed in;
      // GIS will show a sign-in/consent UI automatically when needed.
      tokenClient.requestAccessToken({ prompt: '' });
    }

    function buildPicker(token) {
      new google.picker.PickerBuilder()
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY)
        .setAppId(APP_ID)
        .addView(
          new google.picker.DocsView()
            .setMimeTypes('application/vnd.google-apps.document')
        )
        .setCallback(function (data) {
          if (data.action === google.picker.Action.PICKED) {
            var doc = data.docs[0];
            var url = doc.url || ('https://docs.google.com/document/d/' + doc.id + '/edit');
            window.location.href = 'continuum://drive-pick'
              + '?id='   + encodeURIComponent(doc.id)
              + '&name=' + encodeURIComponent(doc.name)
              + '&url='  + encodeURIComponent(url);
          }
        })
        .build()
        .setVisible(true);
    }
  </script>
  <!-- GIS must load before gapi so onGisLoad fires first in most cases;
       both scripts are async so maybeStart() guards against race conditions. -->
  <script src="https://accounts.google.com/gsi/client" onload="onGisLoad()" async defer></script>
  <script src="https://apis.google.com/js/api.js?onload=gapiLoaded" async defer></script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
};

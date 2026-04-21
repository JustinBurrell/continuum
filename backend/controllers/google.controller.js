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

    // No caching — token is short-lived.
    // Override Helmet's cross-origin isolation headers: the Google Picker uses
    // cross-origin auth iframes that COOP same-origin blocks, causing
    // "Can't access your Google account".
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
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
// Auth strategy: GIS initTokenClient with hint=userEmail.
//   GIS requests a fresh drive.file token for the specific Google account
//   linked in the app (identified by user.email / hint). This decouples the
//   Picker from Chrome's default signed-in account — if Chrome has that
//   account it proceeds silently; if not, GIS shows a sign-in dialog for
//   exactly that email.
//
//   Requirement: the backend HTTPS origin must be registered as an
//   "Authorized JavaScript origin" in Google Cloud Console
//   (APIs & Services → Credentials → OAuth 2.0 Client ID).
//   GIS does not work from unregistered or HTTP origins — on the local
//   emulator (http://10.0.2.2) it will fail silently; use the URL paste
//   fallback in the app for local development.
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

    const user = await User.findById(decoded.userId).select('+googleId +googleTokenExpiry');
    if (!user || !user.googleId) {
        return res.status(403).send('<p>Google account not linked</p>');
    }

    const apiKey    = process.env.GOOGLE_PICKER_API_KEY;
    const appId     = process.env.GOOGLE_APP_ID;
    const clientId  = process.env.GOOGLE_CLIENT_ID;
    const userEmail = user.email; // linked Google account — passed as GIS hint

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a1a; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
    .status { color: #fff; font-family: sans-serif; font-size: 15px; opacity: 0.7; text-align: center; padding: 0 24px; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="spinner" id="spinner"></div>
  <p class="status" id="status">Opening Google Picker…</p>
  <script>
    // GIS (Google Identity Services) initTokenClient approach:
    // - hint forces auth for the specific Google account linked in the app
    // - requestAccessToken({ prompt: '' }) tries silent first; shows sign-in UI only if needed
    // - Requires the backend HTTPS origin to be registered in Google Cloud Console
    var tokenClient;
    var pickerReady = false;
    var tokenClientReady = false;

    function onGapiLoaded() {
      gapi.load('picker', function () {
        pickerReady = true;
        openPickerIfReady();
      });
    }

    function onGisLoaded() {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '${clientId}',
        scope: 'https://www.googleapis.com/auth/drive.file',
        hint: '${userEmail}',
        callback: function (tokenResponse) {
          if (tokenResponse.error) {
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('status').textContent =
              'Sign-in failed. Return to the app and paste a Google Doc link instead.';
            return;
          }
          openPicker(tokenResponse.access_token);
        }
      });
      tokenClientReady = true;
      openPickerIfReady();
    }

    function openPickerIfReady() {
      if (pickerReady && tokenClientReady) {
        tokenClient.requestAccessToken({ prompt: 'select_account' });
      }
    }

    function openPicker(accessToken) {
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('status').style.display = 'none';
      new google.picker.PickerBuilder()
        .setOAuthToken(accessToken)
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
  <script src="https://apis.google.com/js/api.js?onload=onGapiLoaded"></script>
  <script src="https://accounts.google.com/gsi/client" onload="onGisLoaded()" async defer></script>
</body>
</html>`;

    // Override Helmet's cross-origin isolation headers: the Google Picker uses
    // cross-origin auth iframes that COOP same-origin blocks.
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
};

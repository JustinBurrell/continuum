const router = require('express').Router();

const OG_IMAGE = 'https://usecontinuum.dev/og-image.png';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.continuum.android';

function buildSharePage(title, description, canonicalUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title} | Continuum</title>
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${OG_IMAGE}">
</head>
<body>
  <p>Opening Continuum…</p>
  <p><a href="${PLAY_STORE}">Download Continuum on Google Play</a></p>
  <script>
    // Android App Links intercepts the URL before this page renders.
    // This JS runs only when the app is not installed — redirect to Play Store.
    setTimeout(function () {
      window.location.href = '${PLAY_STORE}';
    }, 1500);
  </script>
</body>
</html>`;
}

// GET /share/note/:id
// Returns an HTML page with Open Graph meta tags for shared note link previews.
// No auth required — crawlers (iMessage, Slack) need to read these unauthenticated.
router.get('/note/:id', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(buildSharePage(
    'Note shared on Continuum',
    'Open in the Continuum app to read this note.',
    `https://usecontinuum.dev/share/note/${req.params.id}`
  ));
});

// GET /share/user/:id
// Returns an HTML page for user profile / friend request link previews.
router.get('/user/:id', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(buildSharePage(
    'Connect on Continuum',
    'View this profile and connect on Continuum.',
    `https://usecontinuum.dev/share/user/${req.params.id}`
  ));
});

// GET /share/task/:id
// Returns an HTML page for shared task link previews.
router.get('/task/:id', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(buildSharePage(
    'Task on Continuum',
    'Open in the Continuum app to view this task.',
    `https://usecontinuum.dev/share/task/${req.params.id}`
  ));
});

module.exports = router;

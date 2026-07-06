/**
 * ensure-chrome.js
 *
 * npm postinstall hook: makes sure Puppeteer's Chromium is present in
 * PUPPETEER_CACHE_DIR. Render preview services build with a plain
 * `npm install` and reuse cached node_modules, which skips Puppeteer's
 * own install hook, so the browser must be installed explicitly.
 * `puppeteer browsers install` is idempotent and honors PUPPETEER_CACHE_DIR.
 *
 * Set PUPPETEER_SKIP_DOWNLOAD=1 to skip (used by the Playwright CI job,
 * which never generates PDFs).
 */
const { execSync } = require('child_process');

if (process.env.PUPPETEER_SKIP_DOWNLOAD) {
  console.log('ensure-chrome: PUPPETEER_SKIP_DOWNLOAD set, skipping Chromium install');
  process.exit(0);
}

try {
  execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
} catch (err) {
  // Do not fail the whole install: local dev and most CI paths do not
  // need Chromium immediately, and the PDF health route will surface
  // a missing browser clearly at runtime.
  console.warn('ensure-chrome: Chromium install failed:', err.message);
}

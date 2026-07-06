#!/usr/bin/env bash
# render-build.sh
#
# Build script for Render (rootDir: backend, so /opt/render/project/src IS
# this backend/ directory). PUPPETEER_CACHE_DIR points inside the project
# tree, which Render persists from build to runtime, so Chromium installed
# at build time is available to the app at runtime. Preview services build
# with a plain `npm install`, so the actual Chromium install lives in the
# npm postinstall hook (scripts/ensure-chrome.js); this script exists for
# services whose build command is configurable and simply makes the install
# explicit.
set -o errexit

npm install

PUPPETEER_CACHE_DIR=${PUPPETEER_CACHE_DIR:-/opt/render/project/src/.cache/puppeteer}
PROJECT_CACHE_DIR=/opt/render/project/src/.cache/puppeteer

# Restore a Chrome binary cached from a previous build when the runtime
# cache dir differs from the in-project cache dir.
if [[ "$PUPPETEER_CACHE_DIR" != "$PROJECT_CACHE_DIR" && -d $PROJECT_CACHE_DIR/chrome ]]; then
  echo "...Restoring Puppeteer Chrome from build cache"
  mkdir -p $PUPPETEER_CACHE_DIR
  cp -R $PROJECT_CACHE_DIR/chrome $PUPPETEER_CACHE_DIR
fi

# Ensure Chrome is present at $PUPPETEER_CACHE_DIR. No-op download if the
# restore above (or the postinstall hook) already provided a matching version.
npx puppeteer browsers install chrome

# Persist the Chrome binary under the project tree so it survives into the
# next build's cache (no-op when the paths are the same).
if [[ "$PUPPETEER_CACHE_DIR" != "$PROJECT_CACHE_DIR" ]]; then
  echo "...Saving Puppeteer Chrome to build cache"
  mkdir -p $PROJECT_CACHE_DIR
  cp -R $PUPPETEER_CACHE_DIR/chrome $PROJECT_CACHE_DIR
fi

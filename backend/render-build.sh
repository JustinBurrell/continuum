#!/usr/bin/env bash
# render-build.sh
#
# Build script for Render (rootDir: backend, so /opt/render/project/src IS
# this backend/ directory). Puppeteer downloads its Chrome binary to
# $PUPPETEER_CACHE_DIR at build time; that path lives outside the project
# tree, so a fresh build container will not have it. Render does persist
# everything under the project directory between builds ("build cache"),
# so we mirror the Chrome binary in and out of a folder under the project
# tree to avoid re-downloading it on every deploy, while still guaranteeing
# it exists at $PUPPETEER_CACHE_DIR for the app at runtime.
set -o errexit

npm install

PUPPETEER_CACHE_DIR=${PUPPETEER_CACHE_DIR:-/opt/render/.cache/puppeteer}
PROJECT_CACHE_DIR=/opt/render/project/src/.cache/puppeteer

# Restore a Chrome binary cached from a previous build, if there is one,
# so the install step below can skip re-downloading it.
if [[ -d $PROJECT_CACHE_DIR/chrome ]]; then
  echo "...Restoring Puppeteer Chrome from build cache"
  mkdir -p $PUPPETEER_CACHE_DIR
  cp -R $PROJECT_CACHE_DIR/chrome $PUPPETEER_CACHE_DIR
fi

# Ensure Chrome is present at $PUPPETEER_CACHE_DIR. No-op download if the
# restore above already provided a matching version.
npx puppeteer browsers install chrome

# Persist the Chrome binary under the project tree so it survives into the
# next build's cache.
echo "...Saving Puppeteer Chrome to build cache"
mkdir -p $PROJECT_CACHE_DIR
cp -R $PUPPETEER_CACHE_DIR/chrome $PROJECT_CACHE_DIR

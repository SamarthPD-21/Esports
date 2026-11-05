#!/usr/bin/env sh
# Builds on first start, once the database is up: the build prerenders pages
# from it, so they open with the demo tournament rather than placeholders.
set -eu
cd /app
if [ ! -f .next/BUILD_ID ]; then
  echo "Building the site (first start only)..."
  npx next build
fi
exec npx next start -p 3000

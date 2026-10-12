#!/bin/bash
# Build React app and place artifacts at repo root for GitHub Pages (main branch root).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/app"
npm run build
cd "$ROOT"
# Replace only SPA artifacts; never touch data/ or publish.sh
rm -rf assets
cp -f app/dist/index.html ./index.html
cp -R app/dist/assets ./assets
# Keep any other vite emit (favicon etc.) if present
for f in app/dist/*; do
  base="$(basename "$f")"
  case "$base" in
    index.html|assets) ;;
    *)
      if [ -f "$f" ]; then cp -f "$f" "./$base"; fi
      ;;
  esac
done
touch .nojekyll
echo "built -> $ROOT/index.html + assets/"

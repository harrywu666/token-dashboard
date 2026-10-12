#!/bin/bash
# Build React app and place artifacts at repo root for GitHub Pages (main branch root).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Version stamp for client auto-reload (git short hash, else timestamp)
V="$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)"
# Include build time so consecutive builds without new commits still bump
V="${V}-$(date +%H%M%S)"
printf '{"v":"%s"}\n' "$V" > "$ROOT/app/public/version.json"
printf '{"v":"%s"}\n' "$V" > "$ROOT/version.json"
echo "version $V"

cd "$ROOT/app"
npm run build
cd "$ROOT"
# Replace only SPA artifacts; never touch data/ or publish.sh
rm -rf assets
cp -f app/dist/index.html ./index.html
cp -R app/dist/assets ./assets
# Keep any other vite emit (favicon, version.json, etc.) if present
for f in app/dist/*; do
  base="$(basename "$f")"
  case "$base" in
    index.html|assets) ;;
    *)
      if [ -f "$f" ]; then cp -f "$f" "./$base"; fi
      ;;
  esac
done
# Ensure version.json at root (Vite also copies from public/)
cp -f "$ROOT/app/public/version.json" "$ROOT/version.json"
touch .nojekyll
echo "built -> $ROOT/index.html + assets/ + version.json ($V)"

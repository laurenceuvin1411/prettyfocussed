#!/usr/bin/env bash
# Copy the source page in, commit and push. GitHub Pages redeploys on push.
set -euo pipefail
cd "$(dirname "$0")"
cp ../site/home.html index.html
git add -A
git commit -m "${1:-Update site}" || { echo "nothing to commit"; exit 0; }
git push
echo "pushed — https://prettyfocussed.com updates in ~1 min"

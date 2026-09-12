#!/usr/bin/env bash
# Copy the source pages in, commit and push. GitHub Pages redeploys on push.
set -euo pipefail
cd "$(dirname "$0")"
cp ../site/index.html index.html
# The Read, served at both /read and /read.html. While LIST_OPEN is false it
# does not ask for an address and does not promise an inbox; flipping the flag
# restores both. See the block under the #email listener in read.html.
cp ../site/read.html read.html
mkdir -p read
cp ../site/read.html read/index.html
# The plan, served at both /plan and /plan.html
cp ../site/plan.html plan.html
mkdir -p plan
cp ../site/plan.html plan/index.html
# The finished plan, at its own address. Same file: it reads the route and
# renders the result instead of the assessment.
mkdir -p your-next-30-days
cp ../site/plan.html your-next-30-days/index.html
# The founding offer, served at both /founding and /founding.html. Stripe sends
# her back to /founding/?paid=1 after payment; the same file renders that state.
cp ../site/founding.html founding.html
mkdir -p founding
cp ../site/founding.html founding/index.html
# The podcast page, and /reset — the one-word address spoken in every episode.
cp ../site/podcast.html podcast.html
mkdir -p reset
cp ../site/reset/index.html reset/index.html
git add -A
git commit -m "${1:-Update site}" || { echo "nothing to commit"; exit 0; }
git push
echo "pushed — https://prettyfocussed.com updates in ~1 min"

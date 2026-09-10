#!/usr/bin/env bash
# Copy the source pages in, commit and push. GitHub Pages redeploys on push.
set -euo pipefail
cd "$(dirname "$0")"
cp ../site/index.html index.html
# The Read — HELD BACK, 10 Sep. Its LIST_OPEN is false, so the subscribe call is
# skipped, but the form still asks for an address and the caption under it still
# says the plan "lands in your inbox as well. One note on day 30." Nothing is
# sent and nothing is stored, so that sentence is a promise the page cannot keep.
# Fix the copy for the closed state (or stop asking for the address while it is
# closed), then uncomment these four lines.
# cp ../site/read.html read.html
# mkdir -p read
# cp ../site/read.html read/index.html
# The plan, served at both /plan and /plan.html
cp ../site/plan.html plan.html
mkdir -p plan
cp ../site/plan.html plan/index.html
# The finished plan, at its own address. Same file: it reads the route and
# renders the result instead of the assessment.
mkdir -p your-next-30-days
cp ../site/plan.html your-next-30-days/index.html
# The podcast page, and /reset — the one-word address spoken in every episode.
cp ../site/podcast.html podcast.html
mkdir -p reset
cp ../site/reset/index.html reset/index.html
git add -A
git commit -m "${1:-Update site}" || { echo "nothing to commit"; exit 0; }
git push
echo "pushed — https://prettyfocussed.com updates in ~1 min"

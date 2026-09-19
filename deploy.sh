#!/usr/bin/env bash
# Copy the source pages in, commit and push. GitHub Pages redeploys on push.
set -euo pipefail
cd "$(dirname "$0")"
# The Pretty Focussed Plan (rebuilt 19 Sep 2026). One page is the landing,
# the three questions and the plan. It reads the route: / is the landing,
# /plan/ starts the questions, /your-plan/#... renders a saved plan.
cp ../site/index.html index.html
mkdir -p assets
cp ../site/assets/* assets/
mkdir -p your-plan
cp ../site/index.html your-plan/index.html
# The Read, served at both /read and /read.html. While LIST_OPEN is false it
# does not ask for an address and does not promise an inbox; flipping the flag
# restores both. See the block under the #email listener in read.html.
cp ../site/read.html read.html
mkdir -p read
cp ../site/read.html read/index.html
# /plan now starts the new three questions.
cp ../site/index.html plan.html
mkdir -p plan
cp ../site/index.html plan/index.html
# The old 30-day assessment result stays at its address, because plan emails
# already sent link to /your-next-30-days/#... Nothing new links here.
mkdir -p your-next-30-days
cp ../site/legacy-plan.html your-next-30-days/index.html
# The founding offer, served at both /founding and /founding.html. Stripe sends
# her back to /founding/?paid=1 after payment; the same file renders that state.
cp ../site/founding.html founding.html
mkdir -p founding
cp ../site/founding.html founding/index.html
# The waiting list on its own, served at both /waitlist and /waitlist.html. One
# field, one button; the address to say out loud in a story or a podcast.
cp ../site/waitlist.html waitlist.html
mkdir -p waitlist
cp ../site/waitlist.html waitlist/index.html
# The podcast page, and /reset — the one-word address spoken in every episode.
cp ../site/podcast.html podcast.html
mkdir -p reset
cp ../site/reset/index.html reset/index.html
git add -A
git commit -m "${1:-Update site}" || { echo "nothing to commit"; exit 0; }
git push
echo "pushed — https://prettyfocussed.com updates in ~1 min"

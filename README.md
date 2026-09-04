# Pretty Focussed — website

The public site for Pretty Focussed, served by GitHub Pages at https://prettyfocussed.com

## Editing

`index.html` is a single self-contained file. The source of truth is
`../site/home.html`; run `./deploy.sh` from this folder to copy it here,
commit and push. GitHub Pages redeploys on push to `main`.

Design tokens and the rules the page follows are in `../brand/` and
`../design-system/`. Read `../CLAUDE.md` before changing anything visual.

## Domains

`prettyfocussed.com` is canonical (set by the `CNAME` file — GitHub Pages
allows exactly one custom domain per repository). `prettyfocussed.app` and
`prettyfocussed.be` are 301-forwarded to it at the registrar.

# Research: ZeeSpire Footer Credit Across Four Sites

## Repository inventory

- `historicalyearbook-frontend`: 28 static HTML pages. Every page contains the
  legacy `Created by ZeeSpire.com` fragment. Clean `main`; `origin` is Synology
  and `upstream` is GitHub.
- `galdc-site`: 14 static HTML pages. Thirteen pages contain `ZeeSpire Software
  2025`; the standalone `404.html` has no credit. Clean `main`; `origin` is
  Synology and `upstream` is GitHub.
- `gal-old-frontend`: 79 static HTML pages. Every page contains the legacy
  Romanian Gabriel Voicu credit. Clean `main`; `origin` is Synology and
  `upstream` is GitHub.
- `suoc-site`: 16 generated static HTML routes. The legacy Gabriel Voicu credit
  is owned by `scripts/capture-site.mjs`, `content/manifest.json`, and
  `scripts/build-site.mjs`. This directory currently has no Git metadata and no
  corresponding GitHub or Synology repository was found.

## Decision

Use one exact credit on every HTML page:

`Created and maintained by <a href="https://zeespire.com" target="_blank" rel="noopener noreferrer">ZeeSpire Software Solutions</a>.`

Preserve all surrounding footer text and styling. Update SUOC at the generator
and manifest sources, then regenerate its committed HTML. Add portable
`node:test` checks to each repository and avoid third-party dependencies.

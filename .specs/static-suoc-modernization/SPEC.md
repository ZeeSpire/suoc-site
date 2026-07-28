---
id: static-suoc-modernization
title: Static SUOC Website Modernization
status: complete
created: 2026-07-26
updated: 2026-07-27
priority: high
tags: [static-html, redesign, content-parity, file-url]
---

# Static SUOC Website Modernization

## Overview

Rebuild the public SUOC WordPress site as a modern, self-contained static
website that opens directly from `index.html` without a server or runtime build
step. Preserve all visible content and functionality except the hidden `admin`
author archive, which the user explicitly removed. The visual system adapts the
current Ovidius University identity—royal blue, deep navy, cool gray, IBM Plex
Sans, a faceted identity header, uppercase navigation, and square information
surfaces—to SUOC's longer archival content.

The implementation has 12 tasks across three feature phases and follows a
strict red-green-refactor cycle for every pair.

## Acceptance Criteria

- [x] Double-clicking `index.html` opens the complete site via `file://` with no
  server, install, or build command.
- [x] The artifact contains exactly 16 content routes: seven pages, seven
  posts, and the Evenimente and Noutăți category archives.
- [x] No `admin` author page, author archive link, or author-route artifact is
  present.
- [x] The primary navigation preserves the current eight labels and order:
  Start, Despre noi, Obiective, Conducere, Afilieri, Evenimente, Legislație,
  Contact.
- [x] All visible Romanian wording, titles, dates, categories, names, link
  labels, accordion labels, contact details, and footer text match the current
  SUOC site.
- [x] All 15 Start-page disclosures remain available and keyboard operable.
- [x] All 159 full-size post images and 158 rendered thumbnails are stored
  locally and appear in their original posts and category archives.
- [x] All 28 visible site-owned documents are stored locally and linked from
  their original content locations.
- [x] The 160 unique third-party URLs remain external links, while no visible
  SUOC-owned image or document depends on the production domain at runtime.
- [x] Local search finds matching pages/posts for `vouchere`, `doctorat`, and
  `Crăciun` without using `fetch()` or a server.
- [x] The design uses the Ovidius reference palette, IBM Plex Sans, faceted
  identity header, royal-blue navigation, square information surfaces, and
  responsive mobile menu without copying unrelated university content.
- [x] At 390, 768, and 1440 pixels every route has no horizontal overflow and
  retains readable content hierarchy.
- [x] Gallery enhancement supports pointer use, keyboard focus, Escape close,
  focus return, next/previous controls, and direct full-image links when
  JavaScript is disabled.
- [x] Pages use semantic landmarks/headings, visible focus, useful generated
  image alt text, lazy-loaded gallery thumbnails, reduced-motion handling, and
  print-safe content.
- [x] All offline content, filesystem, browser-interaction, and responsive tests
  pass with zero console or page errors.

## Architecture

```text
WordPress snapshot (authoring only, frozen locally)
                   |
                   v
      content/source.json + manifest.json
                   |
                   v
          scripts/build-site.mjs
                   |
        +----------+-----------+
        |                      |
        v                      v
  16 explicit HTML files   search-index.js
        |                      |
        +----------+-----------+
                   |
                   v
      local CSS + classic JS + fonts + media
                   |
                   v
          Direct browser `file://` use
```

Generated HTML is committed output. The capture/build scripts are never
required for viewing the site.

## Output Structure

```text
index.html
despre-noi.html
obiective.html
conducere.html
afilieri.html
legislatie.html
contact.html
evenimente.html
noutati.html
articole/
  spectacol-craciun-2014.html
  sejur-profesori-2013.html
  masa-festiva-8-martie-2013.html
  serbare-craciun-copii-2013.html
  ziua-unirii-2013.html
  cotizatie-2012.html
  campanie-lavinia-2012.html
assets/
  css/site.css
  fonts/ibm-plex-sans.woff2
  images/brand/bannerbg.png
  media/full/
  media/thumbs/
  documents/
  js/site.js
  js/search-index.js
content/
  source.json
  manifest.json
scripts/
  capture-site.mjs
  build-site.mjs
tests/
```

## Content Rules

- Treat the saved WordPress JSON snapshot as the editorial source of truth.
- Preserve visible text exactly; only strip WordPress/plugin wrapper markup.
- Preserve empty post bodies where the title or image is the content.
- Category archives preserve the current newest-first order and full post
  bodies/galleries.
- Normalize only site-owned `http`/`https` references to local paths.
- Preserve third-party hrefs exactly after decoding HTML entities.
- Do not add the word “Arhivă,” new calls to action, summaries, or marketing
  copy.
- Do not generate comments UI, because comments are closed and empty.
- Do not generate or link an author archive.

## Visual System

| Role | Token |
|------|-------|
| Primary | `#003399` |
| Primary hover/deep field | `#000066` |
| Main text | `#2A2C59` |
| Heading ink | `#192A3D` |
| Muted slate | `#3A4F66` |
| Cool gray | `#F2F5F7` |
| Light surface | `#FAFBFC` |
| Border | `#E1E8ED` |
| Accent | `#6699FF` |
| Typography | locally bundled IBM Plex Sans with system sans-serif fallback |
| Content width | `min(90vw, 1290px)` |
| Reading width | approximately 72 characters |
| Desktop section rhythm | 60 pixels |

The header uses the original SUOC identity banner as a contained mark over a
new CSS faceted blue-violet field. The navigation is a solid royal-blue strip
with compact uppercase labels. Long content remains on white reading surfaces;
documents and key navigation surfaces use square blue cards. Decoration is
limited to the identity header so the archival content remains legible.

## Testing Architecture

### Test Framework and Tools

| Tool | Choice | Version | Purpose |
|------|--------|---------|---------|
| Test runner | Node.js `node:test` | bundled Node 26 | Offline content and filesystem assertions |
| Browser automation | Playwright API | bundled workspace version | Direct `file://` interaction and responsive checks |
| Browser | Installed Google Chrome | current local installation | Headless rendering without a web server |
| HTML inspection | Browser DOM plus Node utilities | native | Semantic and link validation |

### Isolation Strategy

| Layer | Approach | Services |
|-------|----------|----------|
| Content parity | Frozen local snapshot and manifest | None |
| Filesystem links | Resolve absolute paths locally | None |
| Browser flows | Fresh browser context per test file | Local `file://` files only |
| External URLs | Compare href strings to manifest; never request them | None |

Tests make no network calls. The capture script may access the live site only
when explicitly run during authoring.

### Coverage Targets

| Metric | Target |
|--------|--------|
| Route coverage | 16/16 HTML routes |
| Local asset coverage | 100% of referenced files |
| Content inventory coverage | 100% of manifest entries |
| Critical interaction coverage | 100% of menu, disclosure, search, and gallery flows |
| Responsive coverage | 390, 768, and 1440 pixels on all route templates |

### Test Commands

| Command | Purpose |
|---------|---------|
| `NODE_PATH=/Users/gabrielvoicu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/gabrielvoicu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/*.test.mjs` | Run the complete offline suite |

## Library Choices

| Need | Choice | Alternatives | Rationale |
|------|--------|--------------|-----------|
| Runtime UI | Native HTML/CSS/classic JavaScript | React, Vue, Web Components | Smallest direct-`file://` solution with progressive fallback |
| Disclosures | Native `<details>/<summary>` | Custom accordion library | Keyboard support and no dependency |
| Gallery modal | Native `<dialog>` enhanced by local JS | Colorbox, external lightbox | Accessible browser primitive with direct-link fallback |
| Search data | Classic-script global | Local JSON fetched at runtime | Avoids opaque `file://` origin restrictions |
| Typography | Local IBM Plex Sans | Google Fonts request, system-only stack | Matches the Ovidius design while remaining offline |
| Testing | Native Node test plus bundled Playwright | Vitest, Jest, Cypress | No package install or project runtime dependency |

## Phase 1: Content Archive and Static Routes [completed]

- [x] [TEST-SUOC-01] Create `tests/content-archive.test.mjs` to assert the
  frozen manifest contains the exact 16-route inventory, 15 disclosure labels,
  seven post titles/dates/categories, 159 full images, 158 thumbnails, 28
  visible documents, current navigation/footer/contact strings, 160 unique
  external URLs, and no author route; resolve all referenced archived paths
  locally without network access.
- [x] [IMPL-SUOC-02] Add `scripts/capture-site.mjs`, `content/source.json`, and
  `content/manifest.json`; capture the seven pages and seven posts, download
  only visible site-owned media/documents plus the SUOC banner, record external
  hrefs, and exclude all author/archive-admin and orphaned-media records. ->
  satisfies [TEST-SUOC-01]
- [x] [TEST-SUOC-03] Create `tests/page-parity.test.mjs` to assert all 16 HTML
  outputs exist with UTF-8 and `lang="ro"`, exact titles and normalized visible
  text signatures, route-specific dates/categories, the eight-item navigation,
  footer/contact content, explicit `.html` links, and no `admin` or comments UI.
- [x] [IMPL-SUOC-04] Add `scripts/build-site.mjs` and generate the 16 semantic
  HTML outputs with landmarks, headings, disclosures, full category contents,
  locally rewritten site-owned URLs, preserved third-party hrefs, and repeated
  file-safe header/footer markup. -> satisfies [TEST-SUOC-03]

## Phase 2: Ovidius Visual System and Media Surfaces [completed]

- [x] [TEST-SUOC-05] Create `tests/visual-system.test.mjs` using Playwright on
  direct `file://` URLs to assert the reference color/font tokens, faceted SUOC
  header, royal-blue desktop navigation, compact mobile menu, readable content
  width, visible focus, and no horizontal overflow at 390, 768, and 1440 pixels.
- [x] [IMPL-SUOC-06] Add `assets/css/site.css`, the local IBM Plex Sans font,
  the SUOC banner treatment, desktop/mobile navigation styling, responsive
  editorial layouts, print rules, and reduced-motion handling matching the
  approved Ovidius-derived visual system. -> satisfies [TEST-SUOC-05]
- [x] [TEST-SUOC-07] Create `tests/content-surfaces.test.mjs` to assert the 28
  document links use local document cards, all five event galleries and the
  fundraiser image use the correct thumbnail/full-image pairs, thumbnails are
  lazy-loaded with generated contextual alt text, and all full images remain
  normal links when JavaScript is absent.
- [x] [IMPL-SUOC-08] Extend `scripts/build-site.mjs` and `assets/css/site.css`
  with square document cards, chronological archive groupings, responsive
  gallery grids, native dialog markup, contextual image labels, and quiet
  reading surfaces for the long Start archive. -> satisfies [TEST-SUOC-07]

## Phase 3: File-Safe Search, Interaction, and Closure [completed]

- [x] [TEST-SUOC-09] Create `tests/interactions.test.mjs` to open
  `file://.../index.html` and verify mobile-menu focus/state, all 15 native
  disclosures, search results for `vouchere`, `doctorat`, and `Crăciun`, gallery
  open/next/previous/Escape/focus-return behavior, reduced-motion preference,
  and zero console/page errors.
- [x] [IMPL-SUOC-10] Add `assets/js/site.js` and generated
  `assets/js/search-index.js` as deferred classic scripts; implement only the
  mobile menu, local search, active navigation, and accessible dialog gallery
  enhancement with progressive fallbacks. -> satisfies [TEST-SUOC-09]
- [x] [TEST-SUOC-11] Create `tests/full-audit.test.mjs` to crawl every HTML,
  CSS, and JavaScript reference; assert every local target exists, every visible
  SUOC-owned URL is local, external hrefs match the manifest, all 16 routes work
  with JavaScript enabled and disabled, and the full parity/interaction suite is
  green without network access.
- [x] [IMPL-SUOC-12] Correct any final build/link/accessibility discrepancies,
  regenerate all committed HTML and the search index, and add `README.md` with
  the single required viewing instruction: open `index.html`. -> satisfies
  [TEST-SUOC-11]

---

## Resume Context

> COMPLETE — all 12 tasks and every acceptance criterion are finished. The
> regenerated 16-route artifact opens from `index.html`, and the final offline
> suite passes 16/16 with JavaScript enabled and disabled and no HTTP requests.

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-26 | Deliver committed multi-page static HTML with authoring-only capture/build scripts | Direct `file://` use is mandatory; generated files improve parity without imposing runtime tooling |
| 2026-07-26 | Exclude the `admin` author archive | Explicit user correction overrides canonical sitemap parity |
| 2026-07-26 | Preserve all other visible content exactly | The request is visual modernization only |
| 2026-07-26 | Exclude 10 unlinked Media API records | They are not part of the visible site and the user asked to keep the visible site the same |
| 2026-07-26 | Preserve third-party URLs as links | Matches current behavior and avoids unauthorized third-party mirroring |
| 2026-07-26 | Adapt the current Ovidius visual system | Explicit user-supplied design reference |
| 2026-07-26 | Use native runtime features and classic scripts | Avoids server, dependency, and opaque-file-origin failures |
| 2026-07-27 | Phase 1 review found all route/content tasks coherent with the manifest | Two offline tests pass; route count, admin exclusion, navigation order, and normalized source text meet their acceptance criteria |
| 2026-07-27 | Phase 2 review found the visual and media layers coherent with direct file use | Eight tests pass; 390/768/1440 layouts, 28 document cards, 159 full links, 158 thumbnails, and visual screenshots meet the phase criteria |
| 2026-07-27 | Phase 3 closure confirms the implementation is complete | Sixteen tests pass; all local targets, 160 external URLs, required interactions, and both JavaScript modes were audited offline |

## TDD Log

| Task | Red | Green | Refactor |
|------|-----|-------|----------|
| [TEST-SUOC-01] | `node --test tests/content-archive.test.mjs`: 1 test, 1 failed — `content/manifest.json must exist` | — | — |
| [IMPL-SUOC-02] | — | `node --test tests/content-archive.test.mjs`: 1 passed, 0 failed | Removed unused imports and clarified the downloaded-asset count; 1/1 remained green |
| [TEST-SUOC-03] | `node --test tests/page-parity.test.mjs`: 1 test, 1 failed — `Missing route output: index.html` | — | — |
| [IMPL-SUOC-04] | — | `node --test tests/page-parity.test.mjs`: 1 passed, 0 failed | No additional refactor needed; combined Phase 1 suite remained 2/2 green |
| [TEST-SUOC-05] | `node --test tests/visual-system.test.mjs`: 3 tests, 3 failed — missing local font/styles, missing Ovidius tokens, and 390px overflow | — | — |
| [IMPL-SUOC-06] | — | `node --test tests/visual-system.test.mjs`: 3 passed, 0 failed | Visual review at 1440px and 390px confirmed a restrained white reading surface beneath the faceted identity header; complete suite remained 5/5 green |
| [TEST-SUOC-07] | `node --test tests/content-surfaces.test.mjs`: 3 tests, 3 failed — missing document cards, gallery metadata/contextual labels, and archive year metadata | — | — |
| [IMPL-SUOC-08] | — | `node --test tests/content-surfaces.test.mjs`: 3 passed, 0 failed | Visual review confirmed dense galleries remain scannable and document links are distinct; complete suite remained 8/8 green |
| [TEST-SUOC-09] | `node --test tests/interactions.test.mjs`: 5 tests, 3 failed — missing mobile state script, local search UI, and lightbox enhancement; native disclosures and reduced motion passed | — | — |
| [IMPL-SUOC-10] | — | `node --test tests/interactions.test.mjs`: 5 passed, 0 failed | Kept all enhancements in one dependency-free classic script and generated one static index; complete suite remained 13/13 green |
| [TEST-SUOC-11] | `node --test tests/full-audit.test.mjs`: 3 tests, 1 failed — all reference/browser audits passed; only `README.md` was missing | — | — |
| [IMPL-SUOC-12] | — | Full `node --test tests/*.test.mjs`: 16 passed, 0 failed | Regenerated all outputs, added the one-line viewing README, and visually reviewed final desktop and mobile renders |

## Deviations

| Task | Spec Said | Actually Did | Why |
|------|-----------|--------------|-----|

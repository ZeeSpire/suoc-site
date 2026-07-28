---
id: zeespire-footer-credit
title: ZeeSpire Footer Credit Across Four Sites
status: active
created: 2026-07-28
updated: 2026-07-28
priority: high
tags: [static-html, footer, multi-repository, publishing]
---

# ZeeSpire Footer Credit Across Four Sites

## Overview

Apply one canonical ZeeSpire Software Solutions credit to every HTML page in
the Historical Yearbook, current GALDC, old GAL, and SUOC static sites. Preserve
each site's surrounding footer and visual treatment, verify the result with
dependency-free tests, commit each repository independently, and push every
configured remote.

The implementation has 52 tasks across eighteen feature phases.

## Acceptance Criteria

- [x] Every one of the 28 Historical Yearbook HTML pages has the canonical
  credit and none retains `Created by ZeeSpire.com`.
- [x] Every one of the 14 GALDC HTML pages, including `404.html`, has the
  canonical credit and none retains `ZeeSpire Software 2025`.
- [x] Every one of the 79 old GAL HTML pages has the canonical credit and none
  retains the Gabriel Voicu mail credit.
- [x] Every one of the 18 SUOC routes has the canonical credit, and the capture
  script, manifest, and builder regenerate the same result.
- [x] The company link is exactly `https://zeespire.com`, opens in a new tab,
  and includes `rel="noopener noreferrer"` on every page.
- [x] Relevant checks pass in all four directories.
- [x] At desktop widths every SUOC primary-navigation item has the same top,
  bottom, and height; the active Start item no longer sits above its siblings.
- [x] A one-image SUOC gallery uses the existing full-resolution image in a
  bounded single-image layout instead of stretching its 150 px thumbnail
  across the reading column; the image still opens in the lightbox.
- [x] The SUOC header uses the exact local official UOC emblem over original,
  text-free generated artwork; it remains legible and overflow-free at desktop
  and mobile widths without making any network request.
- [x] Start presents the existing four content groups through a local section
  index and preserves all 15 disclosures and 22 local document links.
- [x] Evenimente presents all five posts and three year groups as compact event
  cards without archive accordions; each card links to its existing individual
  page, where all 151 gallery items remain available.
- [x] Legislație presents all six local documents as a responsive document
  library with visible file formats and preserved link targets.
- [x] Start presents all 22 local document links as light, clearly labelled
  file actions rather than heavy solid-blue buttons, without changing targets.
- [x] The long OUG 9/2017 personal-nedidactic note lives on one new local
  information page, while Start presents a concise internal action to it and
  preserves both original legal-source links.
- [x] The OUG 17/2017 note about functions absent from the salary table lives
  on one complete local information page, while Start presents one concise
  internal action and no longer interrupts the surrounding list with the full
  quotation.
- [x] On the OUG 17/2017 information page, the legal source is a normal inline
  underlined link rather than a card or `LINK` button; its URL, new-tab
  behavior, and surrounding quotation remain unchanged.
- [x] Every outbound website link on Start outside the 2017 news group retains
  its original target but uses restrained native-link presentation with no
  card or `LINK` badge; local documents and internal `DETALII` actions remain
  cards.
- [x] All twelve 2017 news entries are clear action surfaces: single-target
  entries and the link-only MCV report pair use full-width buttons, while
  links embedded in explanatory prose remain inline and all original
  destinations remain intact.
- [x] All 134 top-level entries across the six `Noutăți` year groups use one
  consistent system: 107 single-link buttons, seven link-only multi-action
  rows, 15 grouped/contextual panels, and five non-clickable `INFO` panels;
  no top-level entry has a leading icon or list-marker dot.
- [x] All 42 links inside the 15 genuinely contextual `Noutăți` panels render
  as ordinary inline underlined text, while all 16 links in the seven
  link-only multi-action rows render as full action buttons; the 2017 MCV pair
  matches `Bugetul de stat 2017` without changing text or destinations.
- [x] All 15 text-plus-link contextual panels and all five non-clickable
  information panels carry the same right-aligned `INFO` label without
  covering prose or inline links; the 2015 CNAFS panel is the reference case.
- [x] Alegeri, Sinteză acțiuni S.U.O.C., and Utile use the same Start action
  system as Noutăți: 25 preserved single-destination links render as labelled
  full-width actions, the two link-free convocators render as `INFO` panels,
  all nine disclosures and eight Utile entries remain intact, and no transformed
  list item retains a marker dot.
- [x] The four-link Start section selector uses a deliberate editorial-card
  layout related to Legislație: two columns on desktop, one column on mobile,
  a strong top rule, clear section label and navigation cue, while preserving
  all four labels and fragment targets.
- [x] Every Legislație document card matches the 9rem rendered height of the
  Start section cards at desktop and mobile widths, without clipping titles,
  format labels, or document targets.
- [ ] GitHub Actions deploys the static repository root to GitHub Pages on
  pushes to `main` and manual dispatch, using the current official Pages
  actions, least-privilege token permissions, and deployment concurrency.
- [ ] The repository records `sindicat.univ-ovidius.ro` as its only custom
  domain and ignores macOS metadata while retaining direct `file://` use.
- [ ] Each Git repository has one scoped commit pushed to every configured
  remote; SUOC's missing repository/remotes are resolved explicitly rather
  than guessed.

## Testing Architecture

Use Node's built-in `node:test` runner in each static repository. Tests scan
HTML files from the local filesystem only and make no network requests.

## Phase 1: Canonical Credits [complete]

- [x] [TEST-ZFC-01] Add `tests/footer-credit.test.mjs` to
  `historicalyearbook-frontend`; assert all 28 HTML pages contain the exact
  credit/link attributes and no legacy credit.
- [x] [IMPL-ZFC-02] Replace only the legacy credit fragment in all 28 Historical
  Yearbook HTML pages. -> satisfies [TEST-ZFC-01]
- [x] [TEST-ZFC-03] Add `tests/footer-credit.test.mjs` to `galdc-site`; assert
  all 14 HTML pages contain the exact credit/link attributes and no dated
  legacy credit.
- [x] [IMPL-ZFC-04] Replace the 13 existing GALDC credits and add the same
  styled footer credit to `404.html`. -> satisfies [TEST-ZFC-03]
- [x] [TEST-ZFC-05] Add `tests/footer-credit.test.mjs` to `gal-old-frontend`;
  assert all 79 HTML pages contain the exact credit/link attributes and no
  Gabriel Voicu footer mail link.
- [x] [IMPL-ZFC-06] Replace only the footer credit in all 79 old GAL HTML pages.
  -> satisfies [TEST-ZFC-05]
- [x] [TEST-ZFC-07] Add `tests/footer-credit.test.mjs` and update SUOC's existing
  footer expectations; assert all 16 routes and the generator sources use the
  canonical credit.
- [x] [IMPL-ZFC-08] Update SUOC capture/manifest/builder sources, regenerate all
  16 routes, and run the full offline suite. -> satisfies [TEST-ZFC-07]

## Phase 2: SUOC Visual Corrections [complete]

- [x] [TEST-ZFC-09] Extend `tests/visual-system.test.mjs` with a desktop
  geometry assertion that all eight primary-navigation links share the same
  top, bottom, and height within one pixel.
- [x] [IMPL-ZFC-10] Scope the archival list-spacing rule to source content so
  it cannot offset navigation list items; visually verify desktop/mobile. ->
  satisfies [TEST-ZFC-09]
- [x] [TEST-ZFC-11] Extend `tests/visual-system.test.mjs` for the last gallery
  on `articole/sejur-profesori-2013.html`; assert it has one item, uses the
  full-resolution asset as its displayed image, remains bounded, and preserves
  the lightbox link.
- [x] [IMPL-ZFC-12] Mark converted one-image WordPress galleries as single,
  display their existing full-resolution asset, regenerate the routes, visually
  verify the example, and rerun all four repositories' checks. -> satisfies
  [TEST-ZFC-11]

## Phase 3: Generated SUOC Identity Banner [completed]

- [x] [TEST-ZFC-13] Extend SUOC's archive and browser checks to require a local
  official UOC logo, local generated banner artwork, semantic live SUOC title,
  responsive bounds, and zero network requests.
- [x] [IMPL-ZFC-14] Preserve the exact official UOC header emblem locally,
  integrate it over the generated Ovidius/Constanța artwork, update the
  capture/manifest/builder sources, rebuild and visually verify desktop/mobile,
  and rerun all checks. -> satisfies [TEST-ZFC-13]

## Phase 4: Featured Page Layouts [complete]

- [x] [TEST-ZFC-15] Add `tests/featured-pages.test.mjs` assertions for Start's
  four-section index, preserved disclosure/document counts, desktop dossier
  grid, single-column mobile layout, and direct `file://` rendering.
- [x] [IMPL-ZFC-16] Add a Start-specific build transform and page classes in
  `scripts/build-site.mjs`, then style the section index and dossier rows in
  `assets/css/site.css`. -> satisfies [TEST-ZFC-15]
- [x] [TEST-ZFC-17] Extend `tests/featured-pages.test.mjs` for five compact
  event cards across three year groups, five local cover images, 151 preserved
  gallery items inside native disclosures, direct article links, and a bounded
  collapsed archive height.
- [x] [IMPL-ZFC-18] Add an Evenimente-specific archive-card renderer with year
  rails, local covers, direct article links, and native full-content
  disclosures; keep individual post pages unchanged. -> satisfies
  [TEST-ZFC-17]
- [x] [TEST-ZFC-19] Extend `tests/featured-pages.test.mjs` for six legislation
  library entries, preserved local targets, visible PDF/DOCX formats, a
  two-column desktop grid, and a single-column mobile grid.
- [x] [IMPL-ZFC-20] Add Legislație-specific document metadata and page classes
  in `scripts/build-site.mjs`, then style the responsive document library in
  `assets/css/site.css`; rebuild and run the complete offline suite. ->
  satisfies [TEST-ZFC-19]

## Phase 5: Featured Page Refinement [complete]

- [x] [TEST-ZFC-21] Revise `tests/featured-pages.test.mjs` for an accordion-free
  Evenimente index with five explicit article actions and verify all 151
  gallery items remain available across the five existing individual pages.
- [x] [IMPL-ZFC-22] Remove archive disclosures from `eventArchiveCard()` in
  `scripts/build-site.mjs`, add a clear individual-page action, and simplify
  the obsolete disclosure CSS. -> satisfies [TEST-ZFC-21]
- [x] [TEST-ZFC-23] Extend `tests/featured-pages.test.mjs` for 22 Start document
  actions with local targets, file-format metadata, light surfaces, and
  responsive bounds.
- [x] [IMPL-ZFC-24] Add document-format metadata in `decorateDocumentLinks()`
  and restyle Start-scoped document cards in `assets/css/site.css`; rebuild
  and visually verify desktop/mobile. -> satisfies [TEST-ZFC-23]

## Phase 6: Start Link Organization [complete]

- [x] [TEST-ZFC-25] Extend archive, parity, and browser tests for a seventeenth
  derived route containing the complete OUG 9/2017 note and its two original
  sources, plus one concise Start action to that page.
- [x] [IMPL-ZFC-26] Add the derived route to `content/manifest.json`; split the
  identified note from Start at build time in `scripts/build-site.mjs`, render
  it as `informatii/oug-9-2017-personal-nedidactic.html`, and update search
  indexing and route-count expectations. -> satisfies [TEST-ZFC-25]
- [x] [TEST-ZFC-27] Extend `tests/featured-pages.test.mjs` for all remaining
  Start outbound links and the two derived-page sources to carry `LINK`
  metadata, preserve their URLs, and render as light responsive actions.
- [x] [IMPL-ZFC-28] Add external-link metadata in `rewriteContent()` and style
  Start/note outbound actions in `assets/css/site.css`; rebuild and visually
  verify desktop/mobile. -> satisfies [TEST-ZFC-27]

## Phase 7: Second Legal Note Extraction [completed]

- [x] [TEST-ZFC-29] Extend archive, parity, and browser tests for an eighteenth
  derived route containing the complete OUG 17/2017 function-assimilation note
  and original legal source, plus one concise Start action.
- [x] [IMPL-ZFC-30] Generalize the Start-note build transform in
  `scripts/build-site.mjs`, add `informatii/oug-17-2017-asimilare-functii.html`
  to capture and manifest sources, update search indexing and route counts,
  then rebuild and visually verify desktop/mobile. -> satisfies [TEST-ZFC-29]

## Phase 8: OUG 17 Source-Link Restraint [completed]

- [x] [TEST-ZFC-31] Revise `tests/featured-pages.test.mjs` to require the OUG
  17/2017 derived-page source to remain a normal inline underlined anchor with
  its exact URL and attributes, while the Start `DETALII` action is unchanged.
- [x] [IMPL-ZFC-32] Add a derived-route rendering option in
  `scripts/build-site.mjs` that skips external-card decoration only for
  `oug-17-2017-asimilare-functii`, rebuild, and visually verify the page at
  desktop/mobile widths. -> satisfies [TEST-ZFC-31]

## Phase 9: Start External-Link Restraint [completed]

- [x] [TEST-ZFC-33] Revise `tests/featured-pages.test.mjs` to derive every
  remaining Start external URL from the frozen source and require matching
  native links without external-card metadata or `LINK` badges, while all 22
  document cards and both internal note actions remain unchanged.
- [x] [IMPL-ZFC-34] Disable external-card decoration only in Start's
  `rewriteContent()` call, rebuild, and visually review expanded Noutăți plus
  Utile at desktop/mobile widths. -> satisfies [TEST-ZFC-33]

## Phase 10: 2017 News Actions [completed]

- [x] [TEST-ZFC-35] Revise `tests/featured-pages.test.mjs` to require all
  twelve 2017 news list items to be action surfaces, with nine single-target
  buttons, three multi-target grouped panels, eleven external buttons, three
  local-document buttons, and two internal `DETALII` buttons; all Start
  website links outside that group must remain native.
- [x] [IMPL-ZFC-36] Add a 2017-only Start action transform in
  `scripts/build-site.mjs`, style full-width and grouped actions in
  `assets/css/site.css`, rebuild, and visually verify desktop/mobile without
  changing source text or destinations. -> satisfies [TEST-ZFC-35]

## Phase 11: Complete Noutăți Action Index [completed]

- [x] [TEST-ZFC-37] Extend `tests/featured-pages.test.mjs` to require action
  wrappers for 2017–2012 with exactly 134 top-level rows, 165 preserved links,
  106 single-link buttons, 23 grouped panels, and five `INFO` panels; require
  no leading icon or marker on any top-level row and keep all external Start
  links outside `Noutăți` native.
- [x] [IMPL-ZFC-38] Generalize the Start year transform in
  `scripts/build-site.mjs` to process direct list entries without flattening
  nested legal lists, apply the icon-free action system in
  `assets/css/site.css`, rebuild, and visually verify 2016 plus the nested 2014
  content at desktop/mobile widths. -> satisfies [TEST-ZFC-37]

## Phase 12: Contextual Link Restraint [completed]

- [x] [TEST-ZFC-39] Revise `tests/featured-pages.test.mjs` to require all 59
  links inside the 23 grouped/contextual `Noutăți` panels to render as plain
  inline underlined links without button decoration or a format badge; cover
  the cited 2013 Legea 221/2008 row and keep all 106 single-target buttons.
- [x] [IMPL-ZFC-40] Restyle only grouped/contextual action links in
  `assets/css/site.css`, rebuild, and visually verify the cited 2013 row plus
  representative 2014 content at desktop/mobile widths. -> satisfies
  [TEST-ZFC-39]

## Phase 13: Link-Only Multi-Action Rows [completed]

- [x] [TEST-ZFC-41] Revise `tests/featured-pages.test.mjs` to distinguish
  punctuation-only link groups from genuine contextual prose: require seven
  multi-action rows with 16 full action links, 107 single-link buttons, and 15
  contextual panels with 42 inline links; explicitly cover the 2017 MCV pair
  beside `Bugetul de stat 2017`.
- [x] [IMPL-ZFC-42] Refine `structureStartYearActions()` in
  `scripts/build-site.mjs` to classify link-only rows by their non-link text,
  remove presentation-only separators from those rows, style their links as
  stacked full actions in `assets/css/site.css`, rebuild, and visually verify
  the cited 2017 row at desktop/mobile widths. -> satisfies [TEST-ZFC-41]

## Phase 14: Contextual Information Labels [completed]

- [x] [TEST-ZFC-43] Extend `tests/featured-pages.test.mjs` to require all 15
  contextual text-plus-link panels and all five no-link information panels to
  expose an `INFO` label with reserved right-side space; explicitly cover the
  2015 CNAFS panel at 390 px and 1440 px.
- [x] [IMPL-ZFC-44] Generalize the existing `INFO` pseudo-label rule in
  `assets/css/site.css` from no-link panels to contextual panels, rebuild, and
  visually verify the CNAFS panel at desktop/mobile widths without changing
  inline-link presentation. -> satisfies [TEST-ZFC-43]

## Phase 15: Complete Start Action System [completed]

- [x] [TEST-ZFC-45] Extend `tests/featured-pages.test.mjs` to require the same
  generated action structure in Alegeri, Sinteză acțiuni S.U.O.C., and Utile:
  27 entries total, 25 single-destination actions, two `INFO` panels, nine
  preserved disclosures, eight preserved Utile links, no list markers, and
  unchanged targets at 390 px and 1440 px.
- [x] [IMPL-ZFC-46] Extract the existing Noutăți item classifier in
  `scripts/build-site.mjs`, reuse it for the 14 Sinteză and eight Utile list
  rows, transform the five Alegeri disclosure bodies, reuse the established
  CSS action system, rebuild, and visually verify all three sections at
  desktop/mobile widths. -> satisfies [TEST-ZFC-45]

## Phase 16: Start Section Navigation Cards [completed]

- [x] [TEST-ZFC-47] Extend `tests/featured-pages.test.mjs` to require the Start
  section selector to render as a two-column editorial-card grid at 1440 px and
  a one-column grid at 390 px, with a strong top rule, `SECȚIUNE` utility label,
  downward navigation cue, and the four unchanged fragment destinations.
- [x] [IMPL-ZFC-48] Restyle `.start-index` in `assets/css/site.css` as a
  responsive editorial navigation-card grid related to the Legislație visual
  language, without changing generated markup or content. -> satisfies [TEST-ZFC-47]

## Phase 17: Matched Legislation Card Height [completed]

- [x] [TEST-ZFC-49] Extend the Legislație browser test in
  `tests/featured-pages.test.mjs` to compare all six document-card heights with
  a Start navigation card at 390 px and 1440 px, while retaining content,
  target, responsive-grid, and overflow assertions.
- [x] [IMPL-ZFC-50] Reduce `.legislation-entry.document-card` in
  `assets/css/site.css` from 10.5rem to the Start card's 9rem minimum height,
  preserving document-card layout and content. -> satisfies [TEST-ZFC-49]

## Phase 18: GitHub Pages and Custom-Domain Readiness [completed]

- [x] [TEST-ZFC-51] Add `tests/deployment-config.test.mjs` to require a
  `main`/manual GitHub Pages workflow with official checkout/configure/upload/
  deploy actions, required Pages permissions and concurrency, an exact custom
  domain file, and `.DS_Store` exclusions.
- [x] [IMPL-ZFC-52] Add `.github/workflows/pages.yml`, `CNAME`, and `.gitignore`
  with the tested static-root deployment and domain configuration, then run the
  complete offline suite. -> satisfies [TEST-ZFC-51]

---

## Resume Context

> All 52 implementation tasks are complete and the local suite passes 28 tests.
> Initialize `main`, create the absent NAS bare repository at
> `/volume1/git/zeespire/suoc-site.git`, push to GitHub and NAS, enable Pages in
> workflow mode, configure the custom domain, and verify the deployment. Keep
> the current WordPress DNS record unchanged until the deliberate cutover.

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-28 | Use one exact English company credit across all four sites | The user requested one company identity and URL across the portfolio |
| 2026-07-28 | Test every HTML output, not only entry pages | Static exports repeat footer markup per page and can drift independently |
| 2026-07-28 | Update SUOC's generator sources before generated HTML | Prevents the credit from reverting on the next build |
| 2026-07-28 | Use the existing full asset for a one-image thumbnail gallery | Avoids enlarging a 150 px thumbnail while retaining the original content and lightbox behavior |
| 2026-07-28 | Overlay the exact official UOC asset over generated artwork | Keeps the institutional emblem and lettering faithful while allowing original visual art direction |
| 2026-07-28 | Use build-time, route-specific presentation transforms | Preserves the frozen source HTML and search content while giving Start, Evenimente, and Legislație layouts suited to their actual information types |
| 2026-07-28 | Keep event media on existing individual pages instead of archive accordions | The user asked for one page per event and a simpler accordion-free event index |
| 2026-07-28 | Split only the explicitly cited OUG 9/2017 note into a derived local page | The user identified that exact long text; moving unrelated historical entries would expand scope and fragment the archive |
| 2026-07-28 | Extract the separately identified OUG 17/2017 function-assimilation note as a second derived page | A full-width external action embedded inside the quotation harms reading flow; a concise local action keeps Start scannable without deleting content |
| 2026-07-28 | Keep the OUG 17/2017 source as a plain link on its short information page | The dedicated page already provides context, so a second card-like action adds visual weight without improving navigation |
| 2026-07-28 | Return all remaining Start website URLs to native-link presentation | Card styling interrupts sentences and makes the archive visually noisy; PDFs/DOCX and internal detail navigation still benefit from explicit action cards |
| 2026-07-28 | Treat each 2017 news row as an action surface, with grouped controls for multi-source entries | The user explicitly selected these twelve entries; grouping their multiple destinations avoids inserting full-width buttons into sentences while keeping every source accessible |
| 2026-07-28 | Apply the icon-free action system to every Noutăți year, not only 2017 | The user explicitly identified untouched 2016 entries and requested the whole index; right-side type labels communicate the action without local-only icons or top-level marker dots |
| 2026-07-28 | Render the five source entries without any URL as `INFO` panels | A non-clickable information panel is honest and accessible; inventing a dead button or an unsupported destination would be misleading |
| 2026-07-28 | Reserve button treatment for rows whose entire content has one destination | Links embedded in explanatory text are references, so inline underlined treatment preserves reading flow while the outer panel keeps related context together |
| 2026-07-28 | Treat rows made entirely of links and punctuation as action lists | The 2017 MCV pair contains no prose context; each destination should therefore have the same visual affordance as the adjacent single-link budget action |
| 2026-07-28 | Label text-plus-link panels as `INFO` | These rows primarily communicate context and contain reference links; sharing the existing information label clarifies their role without turning embedded links back into buttons |
| 2026-07-28 | Reuse the Noutăți action taxonomy across all four Start sections | Alegeri, Sinteză, and Utile contain the same information types; a shared generated classifier provides consistent affordances without changing section hierarchy, disclosure behavior, or content |
| 2026-07-28 | Relate the Start selector to Legislație without copying document semantics | A two-column editorial-card grid creates visual cohesion, while `SECȚIUNE` and a downward cue correctly describe in-page navigation rather than downloadable files |
| 2026-07-28 | Match Legislație to Start by height only | The user requested equal box size; retaining Legislație numbering and file-format metadata preserves its distinct document-library semantics |

## TDD Log

| Task | Red | Green | Refactor |
|------|-----|-------|----------|
| [TEST-ZFC-01] | `node --test tests/footer-credit.test.mjs`: 1 test, 1 failed — `archives/index.html is missing the canonical credit` | — | — |
| [IMPL-ZFC-02] | — | `node --test tests/footer-credit.test.mjs`: 1 passed, 0 failed | Removed pre-existing mixed space/tab indentation on the 28 changed footer lines; test and `git diff --check` remained green |
| [TEST-ZFC-03] | `node --test tests/footer-credit.test.mjs`: 1 test, 1 failed — `404.html is missing the canonical credit` | — | — |
| [IMPL-ZFC-04] | — | `node --test tests/footer-credit.test.mjs`: 1 passed, 0 failed | No further refactor needed; `git diff --check` and the repeated test remained green |
| [TEST-ZFC-05] | `node --test tests/footer-credit.test.mjs`: 1 test, 1 failed — `404.html is missing the canonical credit` | — | — |
| [IMPL-ZFC-06] | — | `node --test tests/footer-credit.test.mjs`: 1 passed, 0 failed | No further refactor needed; `git diff --check` and the repeated test remained green |
| [TEST-ZFC-07] | SUOC `node --test tests/footer-credit.test.mjs tests/content-archive.test.mjs`: 2 tests, 2 failed — manifest still contains the Gabriel Voicu credit | — | — |
| [IMPL-ZFC-08] | — | Focused footer/archive tests: 2 passed, 0 failed; full SUOC suite: 17 passed, 0 failed | No implementation refactor needed; the complete suite remained green |
| [TEST-ZFC-09] | Focused desktop visual test: 1 failed — navigation tops differ by 6.875 px | — | — |
| [IMPL-ZFC-10] | — | Focused desktop visual test: 1 passed, 0 failed; all eight links render at equal 64 px height | Scoped the adjacent-list selector without changing source-content spacing; screenshot and repeated geometry inspection remained green |
| [TEST-ZFC-11] | Focused one-image gallery test: 1 failed — the last gallery only has class `gallery` | — | — |
| [IMPL-ZFC-12] | — | Focused gallery test: 1 passed, 0 failed; full SUOC suite: 18 passed, 0 failed; three sibling footer suites: 3 passed, 0 failed | Promoted one-image galleries to the full asset, preserved the source aspect ratio, retained thumbnail provenance, and visually confirmed the 1000×1414 example at 480×679 px |
| [TEST-ZFC-13] | Archive test: 1 failed — identity manifest is absent; focused banner browser test: 1 failed — official logo element count is zero | — | — |
| [IMPL-ZFC-14] | — | Focused archive/banner tests: 2 passed, 0 failed; full SUOC suite: 19 passed, 0 failed; desktop 1290×400 and mobile 390×293 screenshots have no overflow or network requests | Corrected the artwork stacking order exposed by visual review; retained the original generated image and exact official logo bytes |
| [TEST-ZFC-15] | `node --test tests/featured-pages.test.mjs`: 1 failed — Start-specific page class count is zero | — | — |
| [IMPL-ZFC-16] | — | Focused featured-page test: 1 passed, 0 failed at 390 px and 1440 px | Renamed the generated index collection to `indexLinks`; rebuilt and reran green after desktop/mobile visual review |
| [TEST-ZFC-17] | Focused Evenimente test: 1 failed — event archive layout class count is zero | — | — |
| [IMPL-ZFC-18] | — | Featured-page suite: 2 passed, 0 failed; Evenimente measures 2270 px desktop and 3093 px mobile with zero overflow | Removed duplicate event-route lookup; rebuilt and reran green after confirming all five covers and three year rails visually |
| [TEST-ZFC-19] | Focused Legislație test: 1 failed — legislation page class count is zero | — | — |
| [IMPL-ZFC-20] | — | Focused Legislație test: 1 passed, 0 failed; full SUOC suite: 22 passed, 0 failed; library renders as 2 columns desktop and 1 column mobile with zero overflow or network requests | Moved decorative Start numbers to CSS-generated content so normalized source text remains contiguous, and kept the reading-width assertion on a representative article-width page; focused and full suites remained green |
| [TEST-ZFC-21] | Focused Evenimente test: 1 failed — five archive disclosures remain instead of zero | — | — |
| [IMPL-ZFC-22] | — | Focused Evenimente and page-parity tests: 2 passed, 0 failed; five individual pages retain 151 gallery items | Removed obsolete archive-disclosure markup and CSS, renamed the cover-only rewritten content variable, and reran the focused tests green |
| [TEST-ZFC-23] | Focused Start test: 1 failed — all 22 document links lack file-format metadata | — | — |
| [IMPL-ZFC-24] | — | Focused featured-page suite: 3 passed, 0 failed; full SUOC suite: 22 passed, 0 failed; desktop/mobile screenshots have zero overflow or network requests | Extracted shared `documentFormat()`, retained Legislație parity, and stabilized the existing lazy single-gallery test by waiting for its image to load before measuring |
| [TEST-ZFC-25] | Four focused tests failed — derived route missing, route count 16 instead of 17, and Start has no note action | — | — |
| [IMPL-ZFC-26] | — | Four focused archive, footer, parity, and browser tests passed; the builder generated 17 file-safe routes | Kept the captured Start source immutable, split only the identified list item at build time, and indexed the moved note solely on its derived route |
| [TEST-ZFC-27] | Focused browser test failed — zero of 166 remaining Start outbound links carry external-action metadata | — | — |
| [IMPL-ZFC-28] | — | Focused Start/note tests: 2 passed, 0 failed; full SUOC suite: 18 passed, 0 failed; 166 Start and two note targets preserved at 390 px and 1440 px | Kept external-link decoration in the shared build transform while scoping the light action presentation to Start and the derived note; visual review confirmed readable desktop/mobile layouts without overflow |
| [TEST-ZFC-29] | Five focused tests failed — eighteenth route missing, Start has no second note action, and 166 outbound actions remain instead of 165 | — | — |
| [IMPL-ZFC-30] | — | Focused route/note suite: 5 passed, 0 failed; full SUOC suite: 25 passed, 0 failed; builder generated 18 file-safe routes | Replaced the one-note constants with two declarative note definitions and one shared extractor; repeated focused tests remained green after desktop/mobile visual review |
| [TEST-ZFC-31] | Focused browser test failed — OUG 17/2017 source still carries `data-external-card` instead of remaining a plain link | — | — |
| [IMPL-ZFC-32] | — | Focused browser test: 1 passed, 0 failed; full SUOC suite: 25 passed, 0 failed | Added one explicit `externalLinkCards` rendering option and disabled it only for the requested route; repeated test and 390/1225 px visual review confirmed the source is an inline underlined link |
| [TEST-ZFC-33] | Focused browser test failed — Start external URLs still carry external-card metadata instead of native-link presentation | — | — |
| [IMPL-ZFC-34] | — | Focused browser test: 1 passed, 0 failed; full SUOC suite: 25 passed, 0 failed | Disabled external cards only for Start; repeated test and 390/1225 px visual review confirmed native links, 22 file cards, two `DETALII` cards, and no overflow |
| [TEST-ZFC-35] | Focused browser test: 1 failed — expected one 2017 action group, received zero | — | — |
| [IMPL-ZFC-36] | — | Focused browser test: 1 passed, 0 failed; full SUOC suite: 25 passed, 0 failed | Added one text wrapper per action after mobile review so long emphasized legal labels wrap normally; 390/1225 px checks confirmed 12 rows, 16 links, and zero overflow |
| [TEST-ZFC-37] | Focused browser test: 1 failed — expected six Noutăți action groups, received one | — | — |
| [IMPL-ZFC-38] | — | Focused browser test: 1 passed, 0 failed; full SUOC suite: 25 passed, 0 failed | Replaced flat regex handling with balanced direct-list traversal so four nested 2014 legal lists retain their numbering; 390/1225 px review confirmed icon-free 2016 actions, grouped 2014 sources, five INFO panels, and zero overflow |
| [TEST-ZFC-39] | Focused browser test: 1 failed — all 59 grouped/contextual links still compute to button-like `inline-flex` instead of ordinary `inline` text | — | — |
| [IMPL-ZFC-40] | — | Focused browser test: 1 passed, 0 failed; full SUOC suite: 25 passed, 0 failed | Reset only grouped links to inline underlined typography; 390/1225 px review confirmed the cited 2013 row and a 2014 multi-source row remain readable with zero overflow |
| [TEST-ZFC-41] | Focused browser test: 1 failed — 2017 still has three contextual groups instead of two contextual groups plus one link-only action row | — | — |
| [IMPL-ZFC-42] | — | Focused behavior/parity tests: 2 passed, 0 failed; full SUOC suite: 25 passed, 0 failed | Classified punctuation-only rows generically, retained separators in visually hidden source spans after parity caught their removal, and confirmed the 2017 pair matches the budget action at 390/1225 px with zero overflow |
| [TEST-ZFC-43] | Focused browser test: 1 failed — the 15 contextual panels do not expose the required `INFO` pseudo-label | — | — |
| [IMPL-ZFC-44] | — | Focused browser test: 1 passed, 0 failed; full SUOC suite: 25 passed, 0 failed | Shared the existing pseudo-label and reserved right-side space across both information-panel kinds; 390/1225 px CNAFS review confirmed two inline links, visible `INFO`, and zero overflow |
| [TEST-ZFC-45] | Focused browser test: 1 failed — Alegeri exposes zero generated action entries instead of five | — | — |
| [IMPL-ZFC-46] | — | Focused action-system test: 1 passed, 0 failed; page parity: 1 passed, 0 failed; full SUOC suite: 26 passed, 0 failed | Extracted one shared classifier, retained the established CSS classes, corrected two obsolete test locators for the generalized markup, and visually confirmed Alegeri, Sinteză, and Utile at 390/1225 px with zero overflow |
| [TEST-ZFC-47] | Focused browser test: 1 failed — mobile Start selector exposes two columns instead of one | — | — |
| [IMPL-ZFC-48] | — | Focused browser test: 1 passed, 0 failed; full SUOC suite: 27 passed, 0 failed | Kept the existing markup and targets, replaced the numbered strip with responsive navigation cards, and visually verified equal 144 px cards at 390/1225 px with zero overflow and accessible hover contrast |
| [TEST-ZFC-49] | Focused browser test: 1 failed — all six Legislație cards render at 168 px instead of matching the 144 px Start card | — | — |
| [IMPL-ZFC-50] | — | Focused browser test: 1 passed, 0 failed; full SUOC suite: 27 passed, 0 failed | Reduced one minimum-height declaration from 10.5rem to 9rem; no refactor was needed, and 390/1225 px screenshots confirmed six equal 144 px cards with readable titles and zero overflow |
| [TEST-ZFC-51] | `node --test tests/deployment-config.test.mjs`: 1 failed — `.github/workflows/pages.yml` is absent | — | — |
| [IMPL-ZFC-52] | — | Focused deployment test: 1 passed, 0 failed; full SUOC suite: 28 passed, 0 failed; workflow YAML parsed successfully | Added the smallest static-root Pages workflow plus exact domain and metadata exclusions; no refactor was needed |

## Deviations

| Task | Spec Said | Actually Did | Why |
|------|-----------|--------------|-----|
| [IMPL-ZFC-08] | Manifest external-link parity includes editorial source links | Excluded the canonical ZeeSpire footer URL from the editorial-link set | The new company link is site chrome, not captured page content |
| [IMPL-ZFC-12] | Finish all publishing in the gallery task | Pushed the three existing repositories to both remotes and moved SUOC publishing to the banner task | SUOC has no Git repository or configured remote to publish yet |
| [IMPL-ZFC-14] | Finish SUOC publishing in the banner task | Completed and verified the banner locally; kept publishing as an unchecked acceptance criterion | Creating GitHub and Synology repositories requires an explicit visibility/destination choice |

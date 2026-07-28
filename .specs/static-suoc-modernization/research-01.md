# Research 01 — Static SUOC Modernization

Date: 2026-07-26

## Request

Rebuild <https://sindicat.univ-ovidius.ro/> locally as a more modern website,
preserving the current pages and content without requiring a web server.

## Workspace

- Project directory was empty at the start of the work.
- There is no project-specific `AGENTS.md`, package manifest, test setup, active
  spec, existing source code, or `.openai/hosting.json`.
- The implementation can therefore choose a minimal static architecture without
  migration constraints.

## Live source of truth

- CMS: WordPress 6.8.6.
- Canonical sitemap: <https://sindicat.univ-ovidius.ro/wp-sitemap.xml>.
- Pages API:
  <https://sindicat.univ-ovidius.ro/wp-json/wp/v2/pages?per_page=100>.
- Posts API:
  <https://sindicat.univ-ovidius.ro/wp-json/wp/v2/posts?per_page=100>.
- Media API contains 196 records over two 100-item pages:
  <https://sindicat.univ-ovidius.ro/wp-json/wp/v2/media?per_page=100&page=1>.
- The live snapshot was inspected in a desktop browser and at 390 × 844 pixels.
  Its fixed 768-pixel layout overflows horizontally on mobile.

## Page and feature inventory

The canonical sitemap exposes 17 human-facing routes:

1. Seven pages: Start, Despre noi, Obiective, Conducere, Afilieri, Legislație,
   and Contact.
2. Seven posts: five Evenimente posts and two Noutăți posts.
3. Two category archives: Evenimente and Noutăți.
4. One author archive: admin.

The global navigation contains eight entries in this order: Start, Despre noi,
Obiective, Conducere, Afilieri, Evenimente, Legislație, Contact.

The live Start page contains 4,017 words and four sections:

- Alegeri.
- Noutati.
- Sinteză acțiuni S.U.O.C.
- Utile.

It has 15 accordion labels:

1. Candidaturi depuse pentru AG 30.06.2022.
2. Convocator 23.06.2022.
3. Rezultat alegeri.
4. Convocator 09.11.2016.
5. Convocator 02.11.2016.
6. 2017.
7. 2016.
8. 2015.
9. 2014.
10. 2013.
11. 2012.
12. Protest guvern.
13. Decontare navetă.
14. Spor doctorat.
15. Vouchere vacanță.

The other pages contain:

- Despre noi: the union's founding, role, independence, membership, collective
  bargaining, and member protections.
- Obiective: the full list of union objectives.
- Conducere: the three governing bodies and five named executive roles.
- Afilieri: two Alma Mater affiliation statements and links.
- Legislație: six visible legal/member-document downloads.
- Contact: Str. Ion Vodă nr. 58, sala P03 and
  `suoc@sindicat.univ-ovidius.ro`. There is no contact form.

The repeated footer reads: “Site creat si administrat de Gabriel Voicu. Email:
gabrielvoicu@univ-ovidius.ro”.

## Post inventory

| Date | Category | Content |
|------|----------|---------|
| 2014-12-24 | Evenimente | Christmas show, 85-photo gallery |
| 2013-06-27 | Noutăți | Seven-day accommodation article, text plus 8 images/documents |
| 2013-04-01 | Evenimente | 8 March event, 40-photo gallery |
| 2013-01-26 | Evenimente | Children's Christmas event, 11-photo gallery |
| 2013-01-25 | Evenimente | Union Day meeting, 14-photo gallery |
| 2012-12-01 | Noutăți | The title contains the complete 1% membership-fee notice; body is empty |
| 2012-11-07 | Evenimente | Fundraising notice whose detail is in one 480 × 720 flyer image |

All comments and pings are closed, there are zero comments, and no post has a
featured image. The old “Add Your Comments” UI is therefore not meaningful
content.

## Site-owned assets

- 196 Media API originals: 165 JPEG, 27 PDF, 2 DOC, and 2 DOCX.
- 159 images are referenced by post content.
- Existing gallery markup uses 158 `-150x150` thumbnails and links them to the
  full-size originals.
- 28 site-owned documents are visibly referenced, including `statut.pdf`.
- 10 Media API originals are not linked by current content. Keeping them under
  an archive subtree is the safest interpretation of strict archival parity.
- The 196 originals plus `statut.pdf` and the branded header image currently
  return HTTP 200 and total approximately 67.11 MiB.
- The old brand header is
  <https://sindicat.univ-ovidius.ro/wp-content/themes/accord-10/images/bannerbg.png>.
  It contains the SUOC name and the Ovidius seal. The modern design should retain
  this identity without retaining the obsolete raster banner layout.

## External-link inventory and risk

- The content contains 160 unique third-party URLs across 42 domains.
- 137 of those URLs use plain HTTP.
- A browser-like check on 2026-07-26 found only 61 final HTTP 200 responses.
  The remainder include timeouts, DNS/TLS failures, redirects, 403, 404, 500,
  and 503 responses.
- Exact third-party hrefs should be retained for content fidelity, but copying
  third-party resources into the local artifact is a separate archival and
  licensing scope.

## Direct `file://` constraints

Modern browsers usually treat `file://` origins as opaque, so runtime `fetch()`
of a sibling JSON file can fail due to same-origin restrictions. Source:
<https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy>.

Consequences:

- Use explicit `.html` links rather than server-dependent clean URLs.
- Use classic local JavaScript files, not ES modules.
- Store the search index in a classic script global or inline it; do not fetch
  local JSON at runtime.
- Do not fetch shared HTML fragments at runtime.
- Replace WordPress search with local client-side search.
- Replace Shortcodes Ultimate accordions with native `<details>/<summary>`.
  Native details widgets are broadly available and keyboard operable:
  <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details>.
- Replace jQuery Colorbox with a small local lightbox using native `<dialog>`
  and keep each full image as the progressive-fallback href. Native dialogs
  provide focus and Escape behavior:
  <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog>.
- Keep all content available without JavaScript; JavaScript should enhance
  navigation, search, and the gallery experience.

## Architecture comparison

| Option | Result |
|--------|--------|
| Flat multi-page HTML, local CSS/classic JS/assets | Recommended: direct `file://`, accessible, auditable, no runtime tooling |
| Single-page hash router | Reject: hides archival content behind JavaScript and weakens direct links |
| Framework or static-site generator runtime | Reject: adds build/base-path/router risks without user value |
| Automated WordPress mirror | Reject: preserves obsolete layout and broken WordPress/plugin dependencies |

Recommended output:

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
autor-admin.html
articole/
  <seven short, explicit HTML filenames>
assets/
  css/site.css
  js/site.js
  js/search-index.js
  images/
  documents/
  archive/
tests/
```

The committed output must be directly openable; any generation script is
authoring-only and cannot be required to view the site.

## Design direction

Subject: an independent university employees' union in Constanța. Audience:
current and prospective SUOC members. Primary job: make official information,
rights, documents, and the historical record easy to find.

Proposed tokens:

- Ovidius ink `#102D45`: primary text and institutional authority.
- Harbor blue `#1E5B85`: navigation and interactive states.
- Patinated bronze `#A97832`: restrained classical accent tied to the seal.
- Sea glass `#DCEBF0`: quiet section backgrounds.
- Archive paper `#F7F6F2`: reading surface.
- White `#FFFFFF`: cards and contrast.
- Display role: a locally bundled humanist serif.
- Body and utility roles: a locally bundled highly legible sans serif.

Layout: a responsive editorial/institutional frame with a readable text measure,
a visible horizontal desktop navigation, an explicit mobile menu, document
cards, chronological archive groupings, and responsive gallery grids.

Signature: a modern line interpretation of the Ovidius seal/Constanța horizon
in the header, paired with the original SUOC name. It should be the one bold
element; the content surfaces remain quiet.

This direction was checked against the common generic cream/serif marketing
template. The revised choice grounds the accent, header linework, and archive
structure in SUOC's existing blue seal, coastal location, and documentary role
rather than treating the site as a promotional landing page.

Motion is limited to menu, disclosure, focus, and lightbox transitions.
`prefers-reduced-motion` removes nonessential animation:
<https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion>.

## Testing architecture

No external network requests are allowed in tests.

1. Content parity test:
   - seven page titles and seven post titles;
   - post dates and categories;
   - 15 home accordion labels;
   - normalized visible-text fingerprints/counts;
   - nav order, contact strings, and footer;
   - 159 full images, 158 thumbnail references, and 28 visible documents.
2. Filesystem link crawler:
   - every local `href`, `src`, font, document, thumbnail, and full image exists;
   - no site-owned production URL remains as a runtime dependency;
   - external hrefs are retained in a manifest/report.
3. Browser smoke tests opened from an absolute `file://` URL:
   - traverse every HTML document;
   - toggle accordions;
   - search known Romanian terms;
   - open and close gallery images by pointer and keyboard;
   - verify no console or page errors.
4. Responsive/accessibility checks at mobile, tablet, and desktop widths:
   - no horizontal overflow;
   - visible keyboard focus;
   - semantic headings and landmarks;
   - dialog focus return and Escape;
   - reduced motion;
   - content and full-image links remain available with JavaScript disabled.

## Principal decisions still requiring user confirmation

1. Whether strict local completeness includes all 10 orphaned site-owned media
   files in addition to every visible file.
2. Whether third-party links should remain references or be separately archived.
3. Whether to visually label the 2012–2022 material as historical/archive
   content without changing its wording.
4. Approval of the proposed Ovidius blue, sea-glass, and bronze design direction.

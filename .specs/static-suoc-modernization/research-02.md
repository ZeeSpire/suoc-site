# Research 02 — Ovidius Visual Reference and Final Scope

Date: 2026-07-26

## User decisions

- The hidden WordPress `admin` author archive is excluded.
- Every other visible page, post, category archive, text block, date, link,
  image, and document remains.
- The work is a visual modernization, not an editorial rewrite.
- The design reference is <https://www.univ-ovidius.ro/>.

## Reference-site inspection

The current Ovidius University home page was inspected at its normal desktop
viewport and at 390 × 844 pixels.

Observed design tokens from the live CSS and rendered page:

| Role | Value |
|------|-------|
| Primary blue | `#003399` |
| Deep navy / hover | `#000066` |
| Main text | `#2A2C59` |
| Heading ink | `#192A3D` |
| Muted slate | `#3A4F66` |
| Cool page gray | `#F2F5F7` |
| Light surface | `#FAFBFC` |
| Border gray | `#E1E8ED` |
| Accent blue | `#6699FF` |
| Font variable | `IBM Plex Sans`, then system sans-serif |
| Desktop content width | maximum 1290 pixels within a 90vw container |
| Standard vertical section spacing | 60 pixels |

The reference header uses a faceted blue-violet image field, a large white
university identity mark, and a solid royal-blue navigation strip. Navigation
is uppercase and compact. Content is organized in square blue panels with
white type and narrow white gaps. Border radii and shadows are minimal.

At 390 pixels the reference collapses to a 125-pixel identity header and a
single hamburger control, with no horizontal overflow.

## SUOC adaptation

The result should be visibly related to the university site without pretending
to be the university's main site:

- Use the same primary blue, deep navy, cool gray, white, and IBM Plex Sans
  typography.
- Place the existing SUOC identity banner on a new faceted blue-violet header
  field so the union name and Ovidius seal remain exact and recognizable.
- Use a solid `#003399` navigation strip with uppercase labels, an active-page
  state, and a compact mobile menu.
- Use square or nearly square information surfaces, thin white/gray divisions,
  and restrained shadows.
- Use blue panels for document and key-action surfaces, but keep long Romanian
  archive text on white with a readable line length. Copying the reference's
  dense panel treatment onto 4,000 words would reduce usability.
- Use the reference's 60-pixel desktop section rhythm and reduce it
  proportionally on small screens.
- Do not add stock photography or new marketing copy.

This replaces the initial bronze/serif exploration in `research-01.md`. The
change follows the user's explicit institutional reference and is more faithful
to the Ovidius brand.

## Final route inventory

The local artifact contains 16 explicit HTML files:

1. Start.
2. Despre noi.
3. Obiective.
4. Conducere.
5. Afilieri.
6. Legislație.
7. Contact.
8. Evenimente category archive.
9. Noutăți category archive.
10. Spectacol de Crăciun 2014.
11. Sejur de 7 zile pentru profesori 2013.
12. Masă festivă de 8 Martie 2013.
13. Serbare de Crăciun pentru copii 2013.
14. Întâlnirea de Ziua Unirii 2013.
15. Cotizație SUOC 2012.
16. Campania pentru Broască Lavinia 2012.

There is no author page, author route, or primary-navigation entry for `admin`.

## Final asset boundary

- Vendor the 159 full-size post images and the 158 rendered thumbnails.
- Vendor the 28 visible site-owned documents.
- Vendor the current SUOC identity banner.
- Exclude the 10 unlinked Media API records.
- Convert every visible site-owned `http` or `https` URL to a relative local
  path.
- Preserve the 160 unique third-party URLs as external hrefs.
- Bundle IBM Plex Sans locally so the visual system does not depend on the
  network.

## Tooling feasibility

- The bundled Node.js runtime is available.
- Plain `node:test` provides the test runner without installing dependencies.
- The bundled `playwright` package is available for development tests.
- Playwright can launch the installed Google Chrome executable at
  `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
- Runtime code uses only HTML, CSS, and classic JavaScript. No package install,
  web server, or build command is required to view the completed site.

## Final verification emphasis

- Compare all 16 route contents against an offline snapshot of the WordPress
  pages/posts.
- Assert that no author archive is generated or linked.
- Assert that every local link and media reference resolves under `file://`.
- Exercise search, accordions, mobile navigation, and galleries under
  `file://` in Chrome.
- Test 390, 768, and 1440 pixel viewports for horizontal overflow.
- Inspect the finished desktop and mobile pages visually against the reference
  site's palette, header hierarchy, navigation treatment, and spacing.

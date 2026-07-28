# Interview 01 — Static SUOC Modernization

Date: 2026-07-26

## Findings presented

The current site is not only eight menu pages. Full parity covers 17
human-facing routes, a long home archive, 15 accordions, seven posts, two
category archives, an author archive, 159 gallery images, 158 thumbnails, and
28 visible site-owned documents. All site-owned material is currently
available and the complete original-media archive is approximately 67 MiB.

The current fixed-width layout overflows at a 390-pixel mobile viewport.
WordPress search, plugin accordions, and the Colorbox gallery cannot work as-is
from `file://`; the proposed static equivalents are a local search index,
native details disclosures, and a local accessible lightbox.

## Current assumptions

- Romanian wording, historical dates, names, typos, and document titles remain
  unchanged in this phase.
- Every canonical page, post, and archive route gets an explicit local HTML
  file.
- All visible site-owned documents and images are copied locally.
- Third-party resources remain external links unless explicitly brought into a
  separate archival scope.
- The finished site must work by double-clicking `index.html`, including search
  and gallery interactions, without a server or build command.

## Questions

1. Does “nothing should be missing” mean all site-owned content should be local
   while the 160 third-party URLs remain external links, or do you also want a
   best-effort offline copy of third-party documents?
2. Should the 10 unlinked/orphaned site-owned media files also be included in an
   `assets/archive/` folder? The recommended choice is yes; the full archive is
   still only about 67 MiB.
3. Should historical notices remain visually neutral, or should the interface
   clearly label the 2012–2022 material as “Arhivă” so an old fundraising notice
   or event cannot be mistaken for current information?
4. Is the proposed visual direction acceptable: Ovidius navy and harbor blue,
   a restrained bronze accent, a modernized seal/horizon header, and
   institutional serif/sans typography with no stock photography?
5. Should the old author archive (“admin”) remain a visible page for strict
   sitemap parity, even though it is not in the current menu? The recommended
   choice is yes, linked from article metadata rather than the primary menu.

## Rough approach awaiting confirmation

Build 17 explicit HTML documents plus local CSS, classic JavaScript, search
index, fonts, images, documents, and tests. Preserve full text and link targets;
improve only hierarchy, responsive behavior, accessibility, search, and gallery
presentation. Verify the artifact from an absolute `file://` URL with no
network dependency for any site-owned content.

## User response

Received 2026-07-26:

- Remove the hidden `admin` author archive completely.
- Preserve the rest of the visible site and content.
- Modernize the presentation only; do not rewrite or relabel the content.
- Base the visual direction on <https://www.univ-ovidius.ro/>.

Resolved implementation interpretation:

- Build 16 local HTML routes: seven pages, seven posts, and two category
  archives.
- Keep the current eight-item primary navigation in the same order.
- Keep third-party references as external links, matching current behavior.
- Vendor every visible site-owned asset, but do not include the 10 unlinked
  Media API records.
- Do not add a new “Arhivă” label; retain the existing dates and headings.

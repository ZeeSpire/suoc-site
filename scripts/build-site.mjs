import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [manifest, source] = await Promise.all([
  readJson('content/manifest.json'),
  readJson('content/source.json'),
]);

const sourceToLocalAsset = new Map(
  [
    ...manifest.media.full,
    ...manifest.media.thumbnails,
    ...manifest.documents,
    manifest.brand,
  ].map((entry) => [normalizeSiteUrl(entry.sourceUrl), entry.localPath]),
);
const sourceToRoute = new Map(
  manifest.routes
    .filter((route) => route.sourceUrl)
    .map((route) => [normalizeRouteUrl(route.sourceUrl), route.file]),
);

const startNoteDefinitions = [
  {
    routeId: 'oug-9-2017-personal-nedidactic',
    title: 'Majorarea cu 15% a salariilor personalului nedidactic (2017)',
    phrases: ['Articolul 3^4', 'Începând cu luna ianuarie 2017 salariile de bază'],
  },
  {
    routeId: 'oug-17-2017-asimilare-functii',
    title: 'Asimilarea funcțiilor pentru salarizare (OUG 17/2017)',
    phrases: ['Functiile care nu se regasesc in prezentul tabel'],
  },
];

const startNewsYearDefinitions = [
  { year: '2017', rows: 12, links: 16, single: 9, actions: 1, group: 2, info: 0 },
  { year: '2016', rows: 15, links: 16, single: 14, actions: 1, group: 0, info: 0 },
  { year: '2015', rows: 35, links: 43, single: 30, actions: 2, group: 2, info: 1 },
  { year: '2014', rows: 58, links: 72, single: 44, actions: 2, group: 9, info: 3 },
  { year: '2013', rows: 13, links: 18, single: 10, actions: 1, group: 2, info: 0 },
  { year: '2012', rows: 1, links: 0, single: 0, actions: 0, group: 0, info: 1 },
];

const startSectionActionDefinitions = [
  {
    id: 'start-alegeri', mode: 'disclosures', rows: 5, links: 3,
    single: 3, actions: 0, group: 0, info: 2,
  },
  {
    id: 'start-sinteza-actiuni-s-u-o-c', mode: 'lists', rows: 14, links: 14,
    single: 14, actions: 0, group: 0, info: 0,
  },
  {
    id: 'start-utile', mode: 'lists', rows: 8, links: 8,
    single: 8, actions: 0, group: 0, info: 0,
  },
];

async function readJson(file) {
  return JSON.parse(await readFile(resolve(projectRoot, file), 'utf8'));
}

function decodeEntities(value) {
  const named = {
    amp: '&', apos: "'", gt: '>', hellip: '…', laquo: '«', ldquo: '“',
    lsquo: '‘', lt: '<', mdash: '—', nbsp: '\u00a0', ndash: '–', quot: '"',
    raquo: '»', rdquo: '”', rsquo: '’', bdquo: '„',
  };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code) => {
    if (code[0] !== '#') return named[code.toLowerCase()] ?? entity;
    const radix = code[1]?.toLowerCase() === 'x' ? 16 : 10;
    const digits = radix === 16 ? code.slice(2) : code.slice(1);
    return String.fromCodePoint(Number.parseInt(digits, radix));
  });
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function normalizeSiteUrl(value) {
  const parsed = new URL(decodeEntities(value), manifest.sourceOrigin);
  if (parsed.hostname === 'sindicat.univ-ovidius.ro') parsed.protocol = 'https:';
  parsed.hash = '';
  return parsed.href;
}

function normalizeRouteUrl(value) {
  const parsed = new URL(normalizeSiteUrl(value));
  parsed.search = '';
  parsed.hash = '';
  const normalizedPath = parsed.pathname === '/' ? '/' : `${parsed.pathname.replace(/\/+$/, '')}/`;
  return `${parsed.origin}${normalizedPath}`;
}

function localHref(fromFile, toFile) {
  return relative(dirname(resolve(projectRoot, fromFile)), resolve(projectRoot, toFile))
    .replaceAll('\\', '/') || './';
}

function rewriteAttribute(html, attribute, outputFile, mapper) {
  const expression = new RegExp(`${attribute}=(["'])([^"']+)\\1`, 'gi');
  return html.replace(expression, (match, quote, rawValue) => {
    const mapped = mapper(rawValue, outputFile);
    return mapped === null ? '' : `${attribute}=${quote}${escapeHtml(mapped)}${quote}`;
  });
}

function getHtmlAttribute(tag, name) {
  const match = tag.match(new RegExp(`${name}=(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match ? match[1] ?? match[2] : null;
}

function setHtmlAttribute(tag, name, value) {
  const expression = new RegExp(`\\s${name}=(?:"[^"]*"|'[^']*')`, 'i');
  const attribute = ` ${name}="${escapeHtml(value)}"`;
  if (expression.test(tag)) return tag.replace(expression, attribute);
  return tag.replace(/\s*\/?>$/, `${attribute}>`);
}

function addHtmlClass(tag, className) {
  const current = getHtmlAttribute(tag, 'class');
  const classes = new Set([...(current?.split(/\s+/) ?? []), className]);
  return setHtmlAttribute(tag, 'class', [...classes].filter(Boolean).join(' '));
}

function documentFormat(href) {
  return href?.match(/\.([a-z0-9]+)(?:[?#]|$)/i)?.[1]?.toUpperCase() ?? null;
}

function mapHref(rawValue, outputFile) {
  const decoded = decodeEntities(rawValue.trim());
  if (/^(?:#|mailto:|tel:|javascript:)/i.test(decoded)) return decoded;
  let parsed;
  try {
    parsed = new URL(decoded, manifest.sourceOrigin);
  } catch {
    return decoded;
  }
  if (parsed.hostname !== 'sindicat.univ-ovidius.ro') return decoded;

  const assetPath = sourceToLocalAsset.get(normalizeSiteUrl(decoded));
  if (assetPath) return localHref(outputFile, assetPath);

  const routePath = sourceToRoute.get(normalizeRouteUrl(decoded));
  if (routePath) return localHref(outputFile, routePath);
  if (parsed.pathname === '/') return localHref(outputFile, 'index.html');
  return decoded;
}

function mapSource(rawValue, outputFile) {
  const decoded = decodeEntities(rawValue.trim());
  let parsed;
  try {
    parsed = new URL(decoded, manifest.sourceOrigin);
  } catch {
    return decoded;
  }
  if (parsed.hostname !== 'sindicat.univ-ovidius.ro') return decoded;
  const assetPath = sourceToLocalAsset.get(normalizeSiteUrl(decoded));
  return assetPath ? localHref(outputFile, assetPath) : null;
}

function findClosingTag(html, openingIndex, tagName) {
  const tagExpression = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
  tagExpression.lastIndex = openingIndex;
  let depth = 0;
  let match;
  while ((match = tagExpression.exec(html))) {
    if (new RegExp(`^<${tagName}\\b`, 'i').test(match[0])) depth += 1;
    else depth -= 1;
    if (depth === 0) return { start: match.index, end: tagExpression.lastIndex };
  }
  throw new Error(`Unbalanced ${tagName} markup`);
}

function findClosingDiv(html, openingIndex) {
  return findClosingTag(html, openingIndex, 'div');
}

function convertDisclosures(html) {
  const spoilerStartExpression = /<div\s+class="su-spoiler\b[^>]*>/i;
  let output = '';
  let rest = html;
  while (spoilerStartExpression.test(rest)) {
    const match = rest.match(spoilerStartExpression);
    output += rest.slice(0, match.index);
    const outerStart = match.index;
    const outerClose = findClosingDiv(rest, outerStart);
    const spoilerHtml = rest.slice(outerStart, outerClose.end);
    const titleMatch = spoilerHtml.match(
      /<div\s+class="su-spoiler-title"[^>]*>([\s\S]*?)<\/div>/i,
    );
    const contentOpening = spoilerHtml.match(/<div\s+class="su-spoiler-content\b[^>]*>/i);
    if (!titleMatch || !contentOpening) throw new Error('Incomplete WordPress disclosure markup');
    const contentOpenIndex = contentOpening.index;
    const contentStart = contentOpenIndex + contentOpening[0].length;
    const contentClose = findClosingDiv(spoilerHtml, contentOpenIndex);
    const label = stripTags(titleMatch[1]);
    const content = spoilerHtml.slice(contentStart, contentClose.start);
    output += `<details class="disclosure"><summary>${escapeHtml(label)}</summary><div class="disclosure__content">${content}</div></details>`;
    rest = rest.slice(outerClose.end);
  }
  output += rest;
  return output
    .replace(/<div\s+class="su-accordion[^>]*>/gi, '<div class="disclosure-list">')
    .replace(/<span\s+class="su-spoiler-icon"[^>]*><\/span>/gi, '');
}

function displayFullImageInSingleGallery(contents) {
  const anchor = contents.match(/<a\b[^>]*data-gallery-item[^>]*>/i)?.[0];
  const image = contents.match(/<img\b[^>]*data-gallery-image[^>]*>/i)?.[0];
  const href = anchor && getHtmlAttribute(anchor, 'href');
  const source = image && getHtmlAttribute(image, 'src');
  if (!image || !href || !source || !/(?:^|\/)assets\/media\/thumbs\//i.test(source)) {
    return contents;
  }

  const fullImage = setHtmlAttribute(
    setHtmlAttribute(image, 'data-gallery-thumbnail', source),
    'src',
    href,
  );
  return contents.replace(image, fullImage);
}

function convertGalleryWrappers(html) {
  const galleryStartExpression = /<div\b[^>]*\bid=(?:"gallery-[^"]+"|'gallery-[^']+')[^>]*>/i;
  let output = '';
  let rest = html;
  while (galleryStartExpression.test(rest)) {
    const match = rest.match(galleryStartExpression);
    output += rest.slice(0, match.index);
    const galleryClose = findClosingDiv(rest, match.index);
    let contents = rest
      .slice(match.index + match[0].length, galleryClose.start)
      .replace(/<\/?(?:dl|dt)\b[^>]*>/gi, '')
      .replace(/<br\s*\/?>/gi, '');
    const single = (contents.match(/data-gallery-item/g) ?? []).length === 1;
    if (single) contents = displayFullImageInSingleGallery(contents);
    output += `<div class="gallery${single ? ' gallery--single' : ''}" data-gallery="" data-gallery-surface="">${contents}</div>`;
    rest = rest.slice(galleryClose.end);
  }
  return output + rest;
}

function decorateDocumentLinks(html) {
  return html.replace(/<a\b[^>]*>/gi, (tag) => {
    const href = getHtmlAttribute(tag, 'href');
    if (!href || !/(?:^|\/)assets\/documents\//i.test(href)) return tag;
    const format = documentFormat(href);
    let documentLink = setHtmlAttribute(addHtmlClass(tag, 'document-card'), 'data-document-card', '');
    if (format) {
      documentLink = setHtmlAttribute(documentLink, 'data-document-format', format);
    }
    return documentLink;
  });
}

function decorateExternalLinks(html) {
  return html.replace(/<a\b[^>]*>/gi, (tag) => {
    const href = getHtmlAttribute(tag, 'href');
    if (!href || !/^https?:\/\//i.test(href)) return tag;

    let externalLink = addHtmlClass(tag, 'external-card');
    externalLink = setHtmlAttribute(externalLink, 'data-external-card', '');
    return setHtmlAttribute(externalLink, 'data-external-label', 'LINK');
  });
}

function externalActionLabel(href) {
  const format = documentFormat(href);
  return ['DOC', 'DOCX', 'PDF', 'XLS', 'XLSX'].includes(format) ? format : 'LINK';
}

function transformDirectListItems(listHtml, transformer) {
  const openingTag = listHtml.match(/^<(?:ul|ol)\b[^>]*>/i)?.[0];
  if (!openingTag) throw new Error('Missing news-list opening tag');

  let cursor = openingTag.length;
  let output = openingTag;
  const itemExpression = /<li\b[^>]*>/gi;
  itemExpression.lastIndex = cursor;
  let match;
  while ((match = itemExpression.exec(listHtml))) {
    output += listHtml.slice(cursor, match.index);
    const closingTag = findClosingTag(listHtml, match.index, 'li');
    output += transformer(listHtml.slice(match.index, closingTag.end));
    cursor = closingTag.end;
    itemExpression.lastIndex = cursor;
  }
  return output + listHtml.slice(cursor);
}

function transformDirectLists(html, transformer) {
  let cursor = 0;
  let output = '';
  const listExpression = /<(ul|ol)\b[^>]*>/gi;
  let match;
  while ((match = listExpression.exec(html))) {
    output += html.slice(cursor, match.index);
    const closingTag = findClosingTag(html, match.index, match[1]);
    let listHtml = transformDirectListItems(
      html.slice(match.index, closingTag.end),
      transformer,
    );
    const openingTag = listHtml.match(/^<(?:ul|ol)\b[^>]*>/i)?.[0];
    let actionListTag = addHtmlClass(openingTag, 'start-year-action-list');
    actionListTag = setHtmlAttribute(actionListTag, 'data-start-action-list', '');
    actionListTag = setHtmlAttribute(actionListTag, 'data-start-year-action-list', '');
    listHtml = listHtml.replace(openingTag, actionListTag);
    output += listHtml;
    cursor = closingTag.end;
    listExpression.lastIndex = cursor;
  }
  return output + html.slice(cursor);
}

function structureStartAction(openingTag, sourceContents, closingTag) {
  const sourceLinks = [...sourceContents.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)];
  const links = sourceLinks.length;
  const nonLinkText = stripTags(
    sourceContents.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, ''),
  );
  const linkOnlyRow = links > 0 && !/[\p{L}\p{N}]/u.test(nonLinkText);
  const kind = links === 0
    ? 'info'
    : linkOnlyRow
      ? links === 1 ? 'single' : 'actions'
      : 'group';
  const decoratedContents = sourceContents
    .replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (anchor) => {
      const tag = anchor.match(/^<a\b[^>]*>/i)?.[0];
      if (!tag) return anchor;
      const linkText = anchor.slice(tag.length, -4);
      let actionLink = addHtmlClass(tag, 'start-year-action__link');
      actionLink = setHtmlAttribute(actionLink, 'data-start-action-link', '');
      actionLink = setHtmlAttribute(actionLink, 'data-start-year-action-link', '');
      const href = getHtmlAttribute(actionLink, 'href');
      if (href && /^https?:\/\//i.test(href)) {
        actionLink = addHtmlClass(actionLink, 'external-card');
        actionLink = setHtmlAttribute(actionLink, 'data-external-card', '');
        actionLink = setHtmlAttribute(
          actionLink,
          'data-external-label',
          externalActionLabel(href),
        );
      } else if (href
        && !/^(?:#|mailto:|tel:|javascript:)/i.test(href)
        && getHtmlAttribute(actionLink, 'data-document-card') === null
        && getHtmlAttribute(actionLink, 'data-start-note-link') === null) {
        actionLink = addHtmlClass(actionLink, 'internal-card');
        actionLink = setHtmlAttribute(actionLink, 'data-link-label', 'DETALII');
        actionLink = setHtmlAttribute(actionLink, 'data-internal-link', '');
      }
      return `${actionLink}<span class="start-year-action__text">${linkText}</span></a>`;
    });
  let contents = decoratedContents;
  if (linkOnlyRow) {
    const decoratedLinks = [
      ...decoratedContents.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi),
    ];
    const parts = [];
    let sourceCursor = 0;
    sourceLinks.forEach((sourceLink, index) => {
      const separator = stripTags(
        sourceContents.slice(sourceCursor, sourceLink.index),
      );
      if (separator) {
        parts.push(
          `<span class="visually-hidden" aria-hidden="true">${escapeHtml(separator)}</span>`,
        );
      }
      parts.push(decoratedLinks[index][0]);
      sourceCursor = sourceLink.index + sourceLink[0].length;
    });
    const trailingSeparator = stripTags(sourceContents.slice(sourceCursor));
    if (trailingSeparator) {
      parts.push(
        `<span class="visually-hidden" aria-hidden="true">${escapeHtml(trailingSeparator)}</span>`,
      );
    }
    contents = parts.join('');
  }

  let actionTag = addHtmlClass(openingTag, 'start-year-action');
  actionTag = setHtmlAttribute(actionTag, 'data-start-action', '');
  actionTag = setHtmlAttribute(actionTag, 'data-start-year-action', '');
  actionTag = setHtmlAttribute(actionTag, 'data-start-action-kind', kind);
  return {
    html: `${actionTag}${contents}${closingTag}`,
    kind,
    links,
  };
}

function structureStartYearActions(html, definition) {
  const disclosureExpression = new RegExp(
    `<details class="disclosure"><summary>${definition.year}</summary><div class="disclosure__content">`,
    'i',
  );
  const matches = [...html.matchAll(new RegExp(disclosureExpression.source, 'gi'))];
  if (matches.length !== 1) {
    throw new Error(`Expected one ${definition.year} Start disclosure, received ${matches.length}`);
  }

  const disclosureStart = matches[0].index;
  const contentStart = disclosureStart + matches[0][0].length;
  const contentOpening = matches[0][0].lastIndexOf('<div');
  const contentClose = findClosingDiv(html, disclosureStart + contentOpening);
  const counts = { rows: 0, links: 0, single: 0, actions: 0, group: 0, info: 0 };
  const actionLists = transformDirectLists(
    html.slice(contentStart, contentClose.start),
    (listItem) => {
      const openingTag = listItem.match(/^<li\b[^>]*>/i)?.[0];
      if (!openingTag) return listItem;
      const action = structureStartAction(
        openingTag,
        listItem.slice(openingTag.length, -5),
        '</li>',
      );
      counts.rows += 1;
      counts.links += action.links;
      counts[action.kind] += 1;
      return action.html;
    },
  );

  if (Object.entries(counts).some(([key, value]) => value !== definition[key])) {
    throw new Error(
      `Unexpected ${definition.year} Start action inventory: ${JSON.stringify(counts)}`,
    );
  }
  const wrapper = `<div class="start-year-actions" data-start-year-actions="${definition.year}">${actionLists}</div>`;
  return `${html.slice(0, contentStart)}${wrapper}${html.slice(contentClose.start)}`;
}

function structureStartNewsActions(html) {
  return startNewsYearDefinitions.reduce(
    (content, definition) => structureStartYearActions(content, definition),
    html,
  );
}

function assertStartActionInventory(counts, definition) {
  if (Object.entries(counts).some(([key, value]) => value !== definition[key])) {
    throw new Error(
      `Unexpected ${definition.id} Start action inventory: ${JSON.stringify(counts)}`,
    );
  }
}

function transformStartSection(html, definition, transformer) {
  const expression = new RegExp(
    `<section\\b[^>]*\\bid="${definition.id}"[^>]*>`,
    'gi',
  );
  const matches = [...html.matchAll(expression)];
  if (matches.length !== 1) {
    throw new Error(`Expected one ${definition.id} Start section, received ${matches.length}`);
  }
  const sectionClose = findClosingTag(html, matches[0].index, 'section');
  const sectionHtml = html.slice(matches[0].index, sectionClose.end);
  return `${html.slice(0, matches[0].index)}${transformer(sectionHtml)}${html.slice(sectionClose.end)}`;
}

function transformDisclosureContents(html, transformer) {
  const expression = /<div class="disclosure__content">/gi;
  let cursor = 0;
  let output = '';
  let match;
  while ((match = expression.exec(html))) {
    const contentClose = findClosingDiv(html, match.index);
    const contentStart = match.index + match[0].length;
    output += html.slice(cursor, contentStart);
    output += transformer(html.slice(contentStart, contentClose.start));
    output += html.slice(contentClose.start, contentClose.end);
    cursor = contentClose.end;
    expression.lastIndex = cursor;
  }
  return output + html.slice(cursor);
}

function structureStartListSectionActions(sectionHtml, definition) {
  const counts = { rows: 0, links: 0, single: 0, actions: 0, group: 0, info: 0 };
  const output = transformDirectLists(sectionHtml, (listItem) => {
    const openingTag = listItem.match(/^<li\b[^>]*>/i)?.[0];
    if (!openingTag) return listItem;
    const action = structureStartAction(
      openingTag,
      listItem.slice(openingTag.length, -5),
      '</li>',
    );
    counts.rows += 1;
    counts.links += action.links;
    counts[action.kind] += 1;
    return action.html;
  });
  assertStartActionInventory(counts, definition);
  return output;
}

function structureStartDisclosureSectionActions(sectionHtml, definition) {
  const counts = { rows: 0, links: 0, single: 0, actions: 0, group: 0, info: 0 };
  const output = transformDisclosureContents(sectionHtml, (contents) => {
    const action = structureStartAction('<div>', contents, '</div>');
    counts.rows += 1;
    counts.links += action.links;
    counts[action.kind] += 1;
    return action.html;
  });
  assertStartActionInventory(counts, definition);
  return output;
}

function structureStartSectionActions(html) {
  return startSectionActionDefinitions.reduce(
    (content, definition) => transformStartSection(
      content,
      definition,
      (sectionHtml) => definition.mode === 'disclosures'
        ? structureStartDisclosureSectionActions(sectionHtml, definition)
        : structureStartListSectionActions(sectionHtml, definition),
    ),
    html,
  );
}

function decorateGalleryMedia(html, contextTitle) {
  let imageIndex = 0;
  let output = html.replace(/<a\b[^>]*>\s*<img\b[^>]*>\s*<\/a>/gi, (match) => {
    let anchor = match.match(/^<a\b[^>]*>/i)?.[0];
    let image = match.match(/<img\b[^>]*>/i)?.[0];
    const href = anchor && getHtmlAttribute(anchor, 'href');
    if (!anchor || !image || !href || !/(?:^|\/)assets\/media\/full\//i.test(href)) return match;

    imageIndex += 1;
    anchor = setHtmlAttribute(addHtmlClass(anchor, 'gallery__item'), 'data-gallery-item', '');
    image = setHtmlAttribute(image, 'loading', 'lazy');
    image = setHtmlAttribute(image, 'decoding', 'async');
    image = setHtmlAttribute(image, 'alt', `${contextTitle} — imagine ${imageIndex}`);
    image = setHtmlAttribute(image, 'data-gallery-image', '');
    const source = getHtmlAttribute(image, 'src');
    if (source && /(?:^|\/)assets\/media\/thumbs\//i.test(source)) {
      image = setHtmlAttribute(image, 'data-gallery-thumbnail', '');
    }
    return `${anchor}${image}</a>`;
  });

  output = convertGalleryWrappers(output);
  return output.replace(
    /<p\b[^>]*>\s*(<a\b[^>]*data-gallery-item[^>]*>[\s\S]*?<\/a>)\s*<\/p>/gi,
    (_match, item) => `<p class="gallery gallery--single" data-gallery="" data-gallery-surface="">${displayFullImageInSingleGallery(item)}</p>`,
  );
}

function rewriteContent(
  sourceHtml,
  outputFile,
  contextTitle,
  { externalLinkCards = true } = {},
) {
  let html = sourceHtml
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\s+srcset=(["'])[^"']*\1/gi, '')
    .replace(/\s+sizes=(["'])[^"']*\1/gi, '')
    .replace(/<img\b[^>]*\bsrc=(["'])[^"']*\/dwn\.png\1[^>]*>/gi, '');
  html = convertDisclosures(html);
  html = rewriteAttribute(html, 'href', outputFile, mapHref);
  html = rewriteAttribute(html, 'src', outputFile, mapSource);
  html = html
    .replace(/\s+style=(["'])[^"']*\1/gi, '')
    .replace(/\s+class=(["'])(?:wp-image-\d+|aligncenter|size-full)(?:\s+[^"']*)?\1/gi, '');
  html = decorateDocumentLinks(html);
  if (externalLinkCards) html = decorateExternalLinks(html);
  return decorateGalleryMedia(html, contextTitle);
}

function navigationHtml(route, outputFile) {
  return manifest.navigation.map((item) => {
    const targetRoute = manifest.routes.find((candidate) => candidate.file === item.file);
    const active = targetRoute?.id === route.id ? ' aria-current="page"' : '';
    return `<li><a data-nav-label="${escapeHtml(item.label)}" data-internal-link href="${escapeHtml(localHref(outputFile, item.file))}"${active}>${escapeHtml(item.label)}</a></li>`;
  }).join('');
}

function headerHtml(route, outputFile) {
  return `<header class="site-header">
    <div class="identity-field">
      <img class="identity-field__artwork" data-identity-artwork src="${escapeHtml(localHref(outputFile, manifest.identity.bannerArtwork.localPath))}" alt="" width="1774" height="887">
      <a class="brand" data-internal-link href="${escapeHtml(localHref(outputFile, 'index.html'))}" aria-label="SUOC — pagina principală">
        <img class="brand__emblem" data-uoc-logo src="${escapeHtml(localHref(outputFile, manifest.identity.universityLogo.localPath))}" alt="Universitatea Ovidius din Constanța" width="1537" height="1537">
        <span class="brand__wordmark" data-brand-title><span class="brand__eyebrow">Sindicatul Universității</span> <span class="brand__name">Ovidius din Constanța</span><span class="brand__acronym">SUOC</span></span>
      </a>
    </div>
    <nav class="primary-navigation" aria-label="Navigație principală">
      <button class="menu-toggle" type="button" aria-controls="primary-menu" aria-expanded="false" aria-label="Deschide meniul">
        <span class="menu-toggle__label">Meniu</span>
        <span class="menu-toggle__icon" aria-hidden="true"><span></span><span></span><span></span></span>
      </button>
      <ul id="primary-menu">${navigationHtml(route, outputFile)}</ul>
    </nav>
    <section class="site-search" aria-label="Căutare în site">
      <form class="site-search__form" role="search" data-search-form>
        <label class="visually-hidden" for="site-search">Caută în site</label>
        <input id="site-search" type="search" inputmode="search" autocomplete="off" placeholder="Caută în site" data-search-input>
        <button type="submit">Caută</button>
      </form>
      <div class="search-results" data-search-results aria-live="polite" hidden></div>
    </section>
  </header>`;
}

function footerHtml(outputFile) {
  return `<footer class="site-footer">
    <div class="site-footer__inner">
      <p>${manifest.footer}</p>
      <a data-internal-link href="${escapeHtml(localHref(outputFile, 'contact.html'))}">Contact</a>
    </div>
  </footer>`;
}

function sectionId(label) {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function structureStartPage(html) {
  const headings = [...html.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)];
  if (headings.length !== 4) throw new Error(`Expected four Start sections, received ${headings.length}`);

  const sections = headings.map((heading, index) => {
    const label = stripTags(heading[1]);
    const id = `start-${sectionId(label)}`;
    const contentStart = heading.index + heading[0].length;
    const contentEnd = headings[index + 1]?.index ?? html.length;
    return {
      content: html.slice(contentStart, contentEnd).trim(),
      id,
      label,
      number: String(index + 1).padStart(2, '0'),
    };
  });

  const indexLinks = sections.map((section) =>
    `<a href="#${section.id}" data-index-number="${section.number}"><span class="start-index__label" data-index-label>${escapeHtml(section.label)}</span></a>`,
  ).join('');
  const dossiers = sections.map((section) => `<section class="start-section" id="${section.id}" data-start-section>
      <header class="start-section__heading" data-section-number="${section.number}"><h2 data-section-label>${escapeHtml(section.label)}</h2></header>
      <div class="start-section__content" data-section-content>${section.content}</div>
    </section>`).join('');
  return `<nav class="start-index" data-start-index aria-label="Secțiuni Start">${indexLinks}</nav><div class="start-dossiers">${dossiers}</div>`;
}

function splitStartNote(html, definition, replacementHref = null) {
  const matches = [...html.matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/gi)]
    .filter((match) => {
      const text = stripTags(match[0]);
      return definition.phrases.every((phrase) => text.includes(phrase));
    });
  if (matches.length !== 1) {
    throw new Error(`Expected one ${definition.routeId} Start note, received ${matches.length}`);
  }

  const sourceListItem = matches[0][0];
  const noteHtml = sourceListItem
    .replace(/^<li\b[^>]*>/i, '')
    .replace(/<\/li>$/i, '');
  const replacement = replacementHref === null
    ? ''
    : `<li class="start-note-action"><a class="internal-card" data-link-label="DETALII" data-start-note-link data-internal-link href="${escapeHtml(replacementHref)}">${escapeHtml(definition.title)}</a></li>`;
  return {
    noteHtml,
    startHtml: html.replace(sourceListItem, replacement),
  };
}

function structureLegislationPage(html) {
  let documentIndex = 0;
  const entries = html.replace(
    /<p\b[^>]*>\s*(<a\b[^>]*data-document-card[^>]*>)([\s\S]*?)(<\/a>)\s*<\/p>/gi,
    (_match, openingTag, title, closingTag) => {
      documentIndex += 1;
      const href = getHtmlAttribute(openingTag, 'href');
      const format = documentFormat(href);
      if (!format) throw new Error(`Document ${documentIndex} has no file extension`);

      let entry = addHtmlClass(openingTag, 'legislation-entry');
      entry = setHtmlAttribute(entry, 'data-legislation-entry', '');
      entry = setHtmlAttribute(entry, 'data-document-index', String(documentIndex).padStart(2, '0'));
      entry = setHtmlAttribute(entry, 'data-document-format', format);
      return `${entry}<span class="legislation-entry__title">${title}</span>${closingTag}`;
    },
  );
  if (documentIndex !== 6) {
    throw new Error(`Expected six Legislație documents, received ${documentIndex}`);
  }
  return `<div class="legislation-library" data-legislation-library>${entries}</div>`;
}

function pageBody(route, outputFile) {
  const page = source.pages.find((entry) => entry.slug === route.sourceSlug);
  const isStart = route.id === 'start';
  const isLegislation = route.id === 'legislatie';
  let content = rewriteContent(page.html, outputFile, page.title, {
    externalLinkCards: !isStart,
  });
  if (isStart) {
    for (const definition of startNoteDefinitions) {
      const noteRoute = manifest.routes.find((candidate) => candidate.id === definition.routeId);
      if (!noteRoute) throw new Error(`Missing derived route: ${definition.routeId}`);
      content = splitStartNote(
        content,
        definition,
        localHref(outputFile, noteRoute.file),
      ).startHtml;
    }
    content = structureStartNewsActions(content);
    content = structureStartPage(content);
    content = structureStartSectionActions(content);
  }
  if (isLegislation) content = structureLegislationPage(content);
  return `<article class="content-page${isStart ? ' content-page--start' : ''}${isLegislation ? ' content-page--legislation' : ''}">
    <header class="page-heading"><h1>${escapeHtml(page.title)}</h1></header>
    <div class="source-content" data-source-content>${content}</div>
  </article>`;
}

function derivedBody(route, outputFile) {
  const sourcePage = source.pages.find((entry) => entry.slug === route.sourceSlug);
  const definition = startNoteDefinitions.find((candidate) => candidate.routeId === route.id);
  if (!definition) throw new Error(`Missing Start note definition: ${route.id}`);
  const content = rewriteContent(sourcePage.html, outputFile, route.title, {
    externalLinkCards: route.id !== 'oug-17-2017-asimilare-functii',
  });
  const noteHtml = splitStartNote(content, definition).noteHtml;
  const backHref = `${localHref(outputFile, 'index.html')}#start-noutati`;
  return `<article class="content-page content-page--note">
    <header class="page-heading"><h1>${escapeHtml(route.title)}</h1></header>
    <div class="source-content note-source" data-source-content data-note-source>${noteHtml}</div>
    <a class="internal-card note-back-link" data-note-back-link data-internal-link href="${escapeHtml(backHref)}">Înapoi la Noutăți</a>
  </article>`;
}

function postBody(route, outputFile, headingLevel = 1) {
  const post = source.posts.find((entry) => entry.slug === route.sourceSlug);
  const Heading = `h${headingLevel}`;
  const postRoute = manifest.routes.find((candidate) => candidate.sourceSlug === post.slug);
  const title = headingLevel === 1
    ? `<${Heading}>${escapeHtml(post.title)}</${Heading}>`
    : `<${Heading}><a data-internal-link href="${escapeHtml(localHref(outputFile, postRoute.file))}">${escapeHtml(post.title)}</a></${Heading}>`;
  return `<article class="post" data-post-id="${post.id}" data-year="${post.date.slice(0, 4)}">
    <header class="page-heading">${title}
      <p class="post-meta"><time datetime="${post.date}">${post.date}</time><span>${escapeHtml(post.category)}</span></p>
    </header>
    <div class="source-content" data-source-content>${rewriteContent(post.html, outputFile, post.title)}</div>
  </article>`;
}

function eventArchiveCard(post, outputFile) {
  const postRoute = manifest.routes.find((candidate) => candidate.sourceSlug === post.slug);
  const articleHref = localHref(outputFile, postRoute.file);
  const eventContent = rewriteContent(post.html, outputFile, post.title);
  const firstGalleryItem = eventContent.match(/<a\b[^>]*data-gallery-item[^>]*>/i)?.[0];
  const coverSource = firstGalleryItem && getHtmlAttribute(firstGalleryItem, 'href');
  const cover = coverSource
    ? `<a class="event-card__cover" data-event-cover data-internal-link href="${escapeHtml(articleHref)}" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(coverSource)}" alt="" loading="lazy" decoding="async"></a>`
    : '';
  return `<article class="post event-card" data-event-card data-post-id="${post.id}" data-year="${post.date.slice(0, 4)}">
    ${cover}
    <div class="event-card__body">
      <p class="event-card__meta"><time datetime="${post.date}">${post.date}</time><span>${escapeHtml(post.category)}</span></p>
      <h3 class="event-card__title" data-event-title><a data-internal-link href="${escapeHtml(articleHref)}">${escapeHtml(post.title)}</a></h3>
      <a class="event-card__link" data-event-link data-internal-link href="${escapeHtml(articleHref)}">Deschide evenimentul</a>
    </div>
  </article>`;
}

function archiveBody(route, outputFile) {
  const posts = source.posts
    .filter((post) => post.categoryId === route.categoryId)
    .sort((left, right) => right.date.localeCompare(left.date));
  const groups = [];
  for (const post of posts) {
    const year = post.date.slice(0, 4);
    let group = groups.at(-1);
    if (group?.year !== year) {
      group = { year, articles: [] };
      groups.push(group);
    }
    if (route.id === 'evenimente') {
      group.articles.push(eventArchiveCard(post, outputFile));
    } else {
      const postRoute = manifest.routes.find((candidate) => candidate.sourceSlug === post.slug);
      group.articles.push(postBody(postRoute, outputFile, 2));
    }
  }
  const articles = groups
    .map((group) => route.id === 'evenimente'
      ? `<section class="archive-year event-year" data-archive-year="${group.year}"><header class="event-year__heading"><span>Arhivă</span><h2 data-archive-year-heading>${group.year}</h2><p>${group.articles.length} ${group.articles.length === 1 ? 'eveniment' : 'evenimente'}</p></header><div class="event-year__list">${group.articles.join('')}</div></section>`
      : `<div class="archive-year" data-archive-year="${group.year}">${group.articles.join('')}</div>`)
    .join('');
  return `<section class="archive-page${route.id === 'evenimente' ? ' archive-page--events' : ''}"><header class="page-heading"><h1>${escapeHtml(route.title)}</h1></header>${articles}</section>`;
}

function lightboxHtml() {
  return `<dialog class="lightbox" aria-label="Vizualizator imagini">
    <div class="lightbox__frame">
      <button class="lightbox__close" type="button" data-lightbox-close aria-label="Închide vizualizatorul">Închide</button>
      <figure><img data-lightbox-image alt=""><figcaption data-lightbox-caption></figcaption></figure>
      <div class="lightbox__controls">
        <button type="button" data-lightbox-previous>Imaginea anterioară</button>
        <button type="button" data-lightbox-next>Imaginea următoare</button>
      </div>
    </div>
  </dialog>`;
}

function renderDocument(route) {
  const outputFile = route.file;
  const body = route.type === 'page'
    ? pageBody(route, outputFile)
    : route.type === 'derived'
      ? derivedBody(route, outputFile)
    : route.type === 'post'
      ? postBody(route, outputFile)
      : archiveBody(route, outputFile);
  const stylesheet = localHref(outputFile, 'assets/css/site.css');
  const searchIndex = localHref(outputFile, 'assets/js/search-index.js');
  const siteScript = localHref(outputFile, 'assets/js/site.js');
  const lightbox = body.includes('data-gallery-item') ? lightboxHtml() : '';
  return `<!doctype html>
<html lang="ro" data-route-id="${route.id}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(route.title)} | SUOC</title>
  <meta name="description" content="Sindicatul Universității Ovidius din Constanța — SUOC">
  <link rel="stylesheet" href="${escapeHtml(stylesheet)}">
  <script src="${escapeHtml(searchIndex)}" defer></script>
  <script src="${escapeHtml(siteScript)}" defer></script>
</head>
<body>
  <a class="skip-link" href="#continut">Sari la conținut</a>
  <div class="site-shell">
    ${headerHtml(route, outputFile)}
    <main id="continut">${body}</main>
    ${lightbox}
    ${footerHtml(outputFile)}
  </div>
</body>
</html>
`;
}

function searchIndexScript() {
  const entries = manifest.routes
    .filter((route) => ['page', 'post', 'derived'].includes(route.type))
    .map((route) => {
      if (route.type === 'derived') {
        const startPage = source.pages.find((page) => page.slug === route.sourceSlug);
        const definition = startNoteDefinitions.find((candidate) => candidate.routeId === route.id);
        if (!definition) throw new Error(`Missing Start note definition: ${route.id}`);
        const noteHtml = splitStartNote(startPage.html, definition).noteHtml;
        return { file: route.file, title: route.title, text: stripTags(noteHtml) };
      }
      const record = route.type === 'page'
        ? source.pages.find((page) => page.slug === route.sourceSlug)
        : source.posts.find((post) => post.slug === route.sourceSlug);
      const recordHtml = route.id === 'start'
        ? startNoteDefinitions.reduce(
          (html, definition) => splitStartNote(html, definition).startHtml,
          record.html,
        )
        : record.html;
      return { file: route.file, title: record.title, text: stripTags(recordHtml) };
    });
  return `window.SUOC_SEARCH_INDEX = ${JSON.stringify(entries)};\n`;
}

for (const route of manifest.routes) {
  const outputPath = resolve(projectRoot, route.file);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderDocument(route));
}

await mkdir(resolve(projectRoot, 'assets/js'), { recursive: true });
await writeFile(resolve(projectRoot, 'assets/js/search-index.js'), searchIndexScript());

console.log(`Generated ${manifest.routes.length} file-safe HTML routes.`);

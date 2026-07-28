import { mkdir, writeFile } from 'node:fs/promises';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const siteOrigin = 'https://sindicat.univ-ovidius.ro';

const routeDefinitions = [
  { id: 'start', type: 'page', sourceSlug: 'start', file: 'index.html' },
  {
    id: 'oug-9-2017-personal-nedidactic',
    type: 'derived',
    sourceSlug: 'start',
    file: 'informatii/oug-9-2017-personal-nedidactic.html',
    title: 'Majorarea cu 15% a salariilor personalului nedidactic (2017)',
  },
  {
    id: 'oug-17-2017-asimilare-functii',
    type: 'derived',
    sourceSlug: 'start',
    file: 'informatii/oug-17-2017-asimilare-functii.html',
    title: 'Asimilarea funcțiilor pentru salarizare (OUG 17/2017)',
  },
  { id: 'despre-noi', type: 'page', sourceSlug: 'despre-noi', file: 'despre-noi.html' },
  { id: 'obiective', type: 'page', sourceSlug: 'obiective', file: 'obiective.html' },
  { id: 'conducere', type: 'page', sourceSlug: 'conducere', file: 'conducere.html' },
  { id: 'afilieri', type: 'page', sourceSlug: 'afilieri', file: 'afilieri.html' },
  { id: 'legislatie', type: 'page', sourceSlug: 'legislatie', file: 'legislatie.html' },
  { id: 'contact', type: 'page', sourceSlug: 'contact', file: 'contact.html' },
  { id: 'evenimente', type: 'archive', categoryId: 3, file: 'evenimente.html', title: 'Evenimente' },
  { id: 'noutati', type: 'archive', categoryId: 4, file: 'noutati.html', title: 'Noutăți' },
  {
    id: 'spectacol-craciun-2014',
    type: 'post',
    sourceSlug: 'spectacol-de-craciun-oferit-de-sindicatul-uoc-decembrie-2014',
    file: 'articole/spectacol-craciun-2014.html',
  },
  {
    id: 'sejur-profesori-2013',
    type: 'post',
    sourceSlug: 'sejur-de-7-zile-pentru-profesorii-universitatii-ovidius',
    file: 'articole/sejur-profesori-2013.html',
  },
  {
    id: 'masa-festiva-8-martie-2013',
    type: 'post',
    sourceSlug: 'masa-festiva-pentru-femeile-din-universitate-cu-ocazia-zilei-de-8-martie',
    file: 'articole/masa-festiva-8-martie-2013.html',
  },
  {
    id: 'serbare-craciun-copii-2013',
    type: 'post',
    sourceSlug: 'serbare-de-craciun-pentru-copiii-membrilor-de-sindicat',
    file: 'articole/serbare-craciun-copii-2013.html',
  },
  {
    id: 'ziua-unirii-2013',
    type: 'post',
    sourceSlug: 'intalnirea-profesorilor-universitatii-ovidius-cu-ocazia-zilei-unirii-24-ianuarie-2013',
    file: 'articole/ziua-unirii-2013.html',
  },
  {
    id: 'cotizatie-2012',
    type: 'post',
    sourceSlug: 'consiliul-director-a-aprobat-in-sedinta-din-data-de-22-11-2012-conform-art-41-din-statutul-suoc-cuantumul-cotizatiei-de-membru-ca-procent-de-1-din-salariul-de-incadrare',
    file: 'articole/cotizatie-2012.html',
  },
  {
    id: 'campanie-lavinia-2012',
    type: 'post',
    sourceSlug: 'sindicatul-universitatii-ovidius-din-constanta-demareaza-campania-de-strangere-de-fonduri-necesare-studentei-broasca-lavinia-din-universitatea-ovidius-constanta-facultatea-de-farmacie-bolnava-de-le',
    file: 'articole/campanie-lavinia-2012.html',
  },
];

const navigation = [
  ['Start', 'index.html'],
  ['Despre noi', 'despre-noi.html'],
  ['Obiective', 'obiective.html'],
  ['Conducere', 'conducere.html'],
  ['Afilieri', 'afilieri.html'],
  ['Evenimente', 'evenimente.html'],
  ['Legislație', 'legislatie.html'],
  ['Contact', 'contact.html'],
].map(([label, file]) => ({ label, file }));

const disclosures = [
  'Candidaturi depuse pentru AG 30.06.2022',
  'Convocator 23.06.2022',
  'Rezultat alegeri',
  'Convocator 09.11.2016',
  'Convocator 02.11.2016',
  '2017',
  '2016',
  '2015',
  '2014',
  '2013',
  '2012',
  'Protest guvern',
  'Decontare navetă',
  'Spor doctorat',
  'Vouchere vacanță',
];

const categoryNames = new Map([
  [3, 'Evenimente'],
  [4, 'Noutăți'],
]);

function decodeEntities(value) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    hellip: '…',
    laquo: '«',
    ldquo: '“',
    lsquo: '‘',
    lt: '<',
    mdash: '—',
    nbsp: '\u00a0',
    ndash: '–',
    quot: '"',
    raquo: '»',
    rdquo: '”',
    rsquo: '’',
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code) => {
    if (code[0] !== '#') return named[code.toLowerCase()] ?? entity;
    const radix = code[1]?.toLowerCase() === 'x' ? 16 : 10;
    const digits = radix === 16 ? code.slice(2) : code.slice(1);
    return String.fromCodePoint(Number.parseInt(digits, radix));
  });
}

function normalizeSiteUrl(rawValue) {
  const decoded = decodeEntities(rawValue.trim());
  const parsed = new URL(decoded, siteOrigin);
  if (parsed.hostname === 'sindicat.univ-ovidius.ro') parsed.protocol = 'https:';
  return parsed.href;
}

function extractAttributes(html, attributeName) {
  const expression = new RegExp(`${attributeName}=["']([^"']+)["']`, 'gi');
  return [...html.matchAll(expression)].map((match) => match[1]);
}

function isSiteOwned(urlValue) {
  try {
    return new URL(urlValue, siteOrigin).hostname === 'sindicat.univ-ovidius.ro';
  } catch {
    return false;
  }
}

function isImage(urlValue) {
  return /\.(?:jpe?g|png|gif|webp)(?:[?#].*)?$/i.test(urlValue);
}

function isDocument(urlValue) {
  return /\.(?:pdf|docx?|xls|xlsx)(?:[?#].*)?$/i.test(urlValue);
}

function mediaPath(urlValue, kind) {
  const parsed = new URL(urlValue);
  const uploadPrefix = '/wp-content/uploads/';
  const relativePath = parsed.pathname.startsWith(uploadPrefix)
    ? decodeURIComponent(parsed.pathname.slice(uploadPrefix.length))
    : decodeURIComponent(basename(parsed.pathname));
  return `assets/media/${kind}/${relativePath}`;
}

function documentPath(urlValue) {
  const parsed = new URL(urlValue);
  return `assets/documents/${decodeURIComponent(basename(parsed.pathname))}`;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Unable to fetch ${url}: HTTP ${response.status}`);
  return response.json();
}

async function download(entry) {
  const outputPath = resolve(projectRoot, entry.localPath);
  await mkdir(dirname(outputPath), { recursive: true });
  const response = await fetch(entry.sourceUrl, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Unable to download ${entry.sourceUrl}: HTTP ${response.status}`);
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}

async function downloadAll(entries, concurrency = 12) {
  let cursor = 0;
  async function worker() {
    while (cursor < entries.length) {
      const entry = entries[cursor];
      cursor += 1;
      await download(entry);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

function uniqueEntries(urls, pathBuilder) {
  return [...new Set(urls)]
    .sort((left, right) => left.localeCompare(right))
    .map((sourceUrl) => ({ sourceUrl, localPath: pathBuilder(sourceUrl) }));
}

async function main() {
  const [pages, posts] = await Promise.all([
    fetchJson(`${siteOrigin}/wp-json/wp/v2/pages?per_page=100&context=view`),
    fetchJson(`${siteOrigin}/wp-json/wp/v2/posts?per_page=100&context=view`),
  ]);

  const pageBySlug = new Map(pages.map((page) => [page.slug, page]));
  const postBySlug = new Map(posts.map((post) => [post.slug, post]));
  const capturedRoutes = routeDefinitions.map((definition) => {
    const source = definition.type === 'page'
      ? pageBySlug.get(definition.sourceSlug)
      : definition.type === 'post'
        ? postBySlug.get(definition.sourceSlug)
        : definition.type === 'derived'
          ? pageBySlug.get(definition.sourceSlug)
          : null;
    if (definition.type !== 'archive' && !source) {
      throw new Error(`Missing source route: ${definition.sourceSlug}`);
    }
    if (definition.type === 'derived') {
      return { ...definition, sourceId: null };
    }
    return {
      ...definition,
      title: definition.title ?? decodeEntities(source.title.rendered),
      sourceUrl: source?.link ?? `${siteOrigin}/category/${definition.id}/`,
      sourceId: source?.id ?? null,
    };
  });

  const sourcePages = pages.map((page) => ({
    id: page.id,
    slug: page.slug,
    title: decodeEntities(page.title.rendered),
    sourceUrl: page.link,
    modified: page.modified,
    html: page.content.rendered,
  }));
  const sourcePosts = posts.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: decodeEntities(post.title.rendered),
    sourceUrl: post.link,
    date: post.date.slice(0, 10),
    modified: post.modified,
    categoryId: post.categories[0],
    category: categoryNames.get(post.categories[0]),
    html: post.content.rendered,
  }));

  const allHtml = [...sourcePages, ...sourcePosts].map((entry) => entry.html).join('\n');
  const postHtml = sourcePosts.map((entry) => entry.html).join('\n');
  const postHrefs = extractAttributes(postHtml, 'href').map(normalizeSiteUrl);
  const postSources = extractAttributes(postHtml, 'src').map(normalizeSiteUrl);

  const thumbnailUrls = postSources.filter(
    (urlValue) => isSiteOwned(urlValue) && /-150x150\.(?:jpe?g|png)$/i.test(new URL(urlValue).pathname),
  );
  const fullImageUrls = [
    ...postHrefs.filter((urlValue) => isSiteOwned(urlValue) && isImage(urlValue)),
    ...postSources.filter(
      (urlValue) => isSiteOwned(urlValue) && isImage(urlValue) && !/-150x150\./i.test(urlValue),
    ),
  ];
  const documentUrls = extractAttributes(allHtml, 'href')
    .map(normalizeSiteUrl)
    .filter((urlValue) => isSiteOwned(urlValue) && isDocument(urlValue));

  const externalLinks = [...new Set(
    extractAttributes(allHtml, 'href')
      .map((value) => decodeEntities(value.trim()))
      .filter((value) => /^https?:\/\//i.test(value) && !isSiteOwned(value)),
  )].sort((left, right) => left.localeCompare(right));

  const full = uniqueEntries(fullImageUrls, (urlValue) => mediaPath(urlValue, 'full'));
  const thumbnails = uniqueEntries(thumbnailUrls, (urlValue) => mediaPath(urlValue, 'thumbs'));
  const documents = uniqueEntries(documentUrls, documentPath);
  const brand = {
    sourceUrl: `${siteOrigin}/wp-content/themes/accord-10/images/bannerbg.png`,
    localPath: 'assets/images/brand/bannerbg.png',
  };

  const expectedCounts = {
    routes: 18,
    full: 159,
    thumbnails: 158,
    documents: 28,
    externalLinks: 160,
  };
  const actualCounts = {
    routes: capturedRoutes.length,
    full: full.length,
    thumbnails: thumbnails.length,
    documents: documents.length,
    externalLinks: externalLinks.length,
  };
  for (const [key, expected] of Object.entries(expectedCounts)) {
    if (actualCounts[key] !== expected) {
      throw new Error(`Unexpected ${key} count: expected ${expected}, received ${actualCounts[key]}`);
    }
  }

  const manifest = {
    sourceOrigin: siteOrigin,
    capturedAt: new Date().toISOString(),
    routes: capturedRoutes,
    navigation,
    disclosures,
    posts: sourcePosts.map(({ id, slug, title, date, category, categoryId, sourceUrl }) => ({
      id,
      slug,
      title,
      date,
      category,
      categoryId,
      sourceUrl,
    })),
    media: { full, thumbnails },
    documents,
    brand,
    identity: {
      universityLogo: {
        sourceUrl: 'https://www.univ-ovidius.ro/wp-content/uploads/2025/12/Logo-White-png.webp',
        localPath: 'assets/images/brand/uoc-logo.webp',
      },
      bannerArtwork: {
        localPath: 'assets/images/brand/suoc-identity-banner.png',
      },
    },
    externalLinks,
    footer: 'Created and maintained by <a href="https://zeespire.com" target="_blank" rel="noopener noreferrer">ZeeSpire Software Solutions</a>.',
    contact: {
      address: 'str. Ion Vodă nr. 58, sala P03',
      email: 'suoc@sindicat.univ-ovidius.ro',
    },
  };
  const source = {
    sourceOrigin: siteOrigin,
    capturedAt: manifest.capturedAt,
    pages: sourcePages,
    posts: sourcePosts,
  };

  await mkdir(resolve(projectRoot, 'content'), { recursive: true });
  await Promise.all([
    writeFile(resolve(projectRoot, 'content/source.json'), `${JSON.stringify(source, null, 2)}\n`),
    writeFile(resolve(projectRoot, 'content/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`),
  ]);
  await downloadAll([...full, ...thumbnails, ...documents, brand]);

  const downloadCount = [...full, ...thumbnails, ...documents, brand]
    .map((entry) => relative(projectRoot, resolve(projectRoot, entry.localPath)))
    .length;
  console.log(`Captured ${capturedRoutes.length} routes and downloaded ${downloadCount} local assets.`);
}

await main();

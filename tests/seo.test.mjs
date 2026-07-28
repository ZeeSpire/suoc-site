import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(projectRoot, 'content/manifest.json'), 'utf8'));
const productionOrigin = 'https://sindicat.univ-ovidius.ro';
const ogImage = `${productionOrigin}/assets/images/brand/suoc-og-image.jpg`;

function readRoute(route) {
  return readFileSync(resolve(projectRoot, route.file), 'utf8');
}

function head(html) {
  return html.match(/<head>([\s\S]*?)<\/head>/i)[1];
}

function decodeEntities(value) {
  const named = { amp: '&', apos: "'", gt: '>', lt: '<', quot: '"', '#039': "'" };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code) => {
    if (named[code.toLowerCase()]) return named[code.toLowerCase()];
    if (code[0] !== '#') return entity;
    const radix = code[1]?.toLowerCase() === 'x' ? 16 : 10;
    return String.fromCodePoint(Number.parseInt(radix === 16 ? code.slice(2) : code.slice(1), radix));
  });
}

function metaContent(html, selector) {
  const pattern = new RegExp(`<meta\\s+(?:name|property)="${selector}"\\s+content="([^"]*)"`, 'i');
  const match = head(html).match(pattern);
  return match ? decodeEntities(match[1]) : null;
}

function pageTitle(html) {
  return decodeEntities(html.match(/<title>([\s\S]*?)<\/title>/i)[1]);
}

function canonicalUrl(file) {
  return file === 'index.html' ? `${productionOrigin}/` : `${productionOrigin}/${file}`;
}

function jsonLd(html) {
  return [...head(html).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
}

test('every route carries a unique, page-specific meta description', () => {
  const seen = new Map();
  for (const route of manifest.routes) {
    const description = metaContent(readRoute(route), 'description');
    assert.ok(description, `${route.file} must declare a meta description`);
    assert.notEqual(
      description,
      'Sindicatul Universității Ovidius din Constanța — SUOC',
      `${route.file} must not reuse the site-wide boilerplate description`,
    );
    assert.ok(
      description.length >= 60 && description.length <= 165,
      `${route.file} description is ${description.length} chars, expected 60-165`,
    );
    assert.ok(!seen.has(description), `${route.file} duplicates the description of ${seen.get(description)}`);
    seen.set(description, route.file);
  }
});

test('titles are unique, branded, and fit a search result', () => {
  const seen = new Map();
  for (const route of manifest.routes) {
    const title = pageTitle(readRoute(route));
    assert.ok(title.endsWith(' | SUOC'), `${route.file} title must end with the SUOC brand suffix`);
    assert.ok(title.length <= 65, `${route.file} title is ${title.length} chars, expected at most 65`);
    assert.ok(!seen.has(title), `${route.file} duplicates the title of ${seen.get(title)}`);
    seen.set(title, route.file);
  }
});

test('the start page title leads with the organisation, not the menu label', () => {
  const title = pageTitle(readFileSync(resolve(projectRoot, 'index.html'), 'utf8'));
  assert.match(title, /^Sindicatul Universității Ovidius din Constanța/);
});

test('every route declares a canonical URL on the production domain', () => {
  for (const route of manifest.routes) {
    const canonical = head(readRoute(route)).match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.equal(canonical, canonicalUrl(route.file), `${route.file} canonical`);
  }
});

test('every route ships Open Graph and Twitter card metadata', () => {
  for (const route of manifest.routes) {
    const html = readRoute(route);
    assert.equal(metaContent(html, 'og:url'), canonicalUrl(route.file), `${route.file} og:url`);
    assert.equal(metaContent(html, 'og:title'), pageTitle(html).replace(/ \| SUOC$/, ''), `${route.file} og:title`);
    assert.equal(metaContent(html, 'og:description'), metaContent(html, 'description'), `${route.file} og:description`);
    assert.equal(metaContent(html, 'og:image'), ogImage, `${route.file} og:image`);
    assert.equal(metaContent(html, 'og:locale'), 'ro_RO', `${route.file} og:locale`);
    assert.equal(
      metaContent(html, 'og:site_name'),
      'Sindicatul Universității Ovidius din Constanța',
      `${route.file} og:site_name`,
    );
    assert.equal(metaContent(html, 'og:type'), route.type === 'post' ? 'article' : 'website', `${route.file} og:type`);
    assert.equal(metaContent(html, 'twitter:card'), 'summary_large_image', `${route.file} twitter:card`);
  }
  assert.ok(existsSync(resolve(projectRoot, 'assets/images/brand/suoc-og-image.jpg')), 'og:image asset must exist');
});

test('the start page describes the organisation as structured data', () => {
  const [organisation] = jsonLd(readFileSync(resolve(projectRoot, 'index.html'), 'utf8'));
  assert.equal(organisation['@context'], 'https://schema.org');
  assert.equal(organisation['@type'], 'Organization');
  assert.equal(organisation.name, 'Sindicatul Universității Ovidius din Constanța');
  assert.equal(organisation.alternateName, 'SUOC');
  assert.equal(organisation.url, `${productionOrigin}/`);
  assert.equal(organisation.logo, `${productionOrigin}/assets/images/brand/uoc-logo.webp`);
  assert.equal(organisation.email, manifest.contact.email);
  assert.equal(organisation.address['@type'], 'PostalAddress');
  assert.equal(organisation.address.streetAddress, manifest.contact.address);
  assert.equal(organisation.address.addressLocality, 'Constanța');
  assert.equal(organisation.address.addressCountry, 'RO');
});

test('every article carries Article structured data with its publication date', () => {
  for (const route of manifest.routes.filter((entry) => entry.type === 'post')) {
    const html = readRoute(route);
    const article = jsonLd(html).find((entry) => entry['@type'] === 'Article');
    assert.ok(article, `${route.file} must declare Article structured data`);
    assert.equal(article.headline, pageTitle(html).replace(/ \| SUOC$/, ''), `${route.file} headline`);
    assert.ok(article.headline.length <= 110, `${route.file} headline must stay under 110 chars`);
    assert.equal(article.datePublished, manifest.posts.find((post) => post.slug === route.sourceSlug).date);
    assert.equal(article.mainEntityOfPage, canonicalUrl(route.file), `${route.file} mainEntityOfPage`);
    assert.equal(article.publisher.name, 'Sindicatul Universității Ovidius din Constanța');
  }
});

test('every route links the SUOC icons', () => {
  for (const route of manifest.routes) {
    const markup = head(readRoute(route));
    assert.match(markup, /<link rel="icon"[^>]+href="[^"]*favicon\.ico"/, `${route.file} favicon`);
    assert.match(markup, /<link rel="apple-touch-icon"[^>]+href="[^"]*apple-touch-icon\.png"/, `${route.file} touch icon`);
  }
  for (const icon of ['favicon.ico', 'assets/images/brand/apple-touch-icon.png']) {
    assert.ok(existsSync(resolve(projectRoot, icon)), `${icon} must exist`);
  }
});

test('sitemap.xml lists every route on the production domain', () => {
  const sitemap = readFileSync(resolve(projectRoot, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(
    [...locations].sort(),
    manifest.routes.map((route) => canonicalUrl(route.file)).sort(),
  );
  for (const lastmod of [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1])) {
    assert.match(lastmod, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.equal(locations.length, [...sitemap.matchAll(/<lastmod>/g)].length, 'each URL needs a lastmod');
});

test('robots.txt allows crawling and advertises the sitemap', () => {
  const robots = readFileSync(resolve(projectRoot, 'robots.txt'), 'utf8');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.doesNotMatch(robots, /^Disallow: \/$/m);
  assert.match(robots, new RegExp(`^Sitemap: ${productionOrigin}/sitemap\\.xml$`, 'm'));
});

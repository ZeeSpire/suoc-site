import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(projectRoot, 'content/manifest.json'), 'utf8'));

function attributes(tag) {
  return new Map(
    [...tag.matchAll(/([\w:-]+)=(?:"([^"]*)"|'([^']*)')/g)]
      .map((match) => [match[1], match[2] ?? match[3]]),
  );
}

function localPath(fromFile, href) {
  const absolute = fileURLToPath(new URL(href, pathToFileURL(resolve(projectRoot, fromFile))));
  return relative(projectRoot, absolute).replaceAll('\\', '/');
}

test('all site-owned documents render as local document cards', async () => {
  const found = new Set();
  for (const route of manifest.routes) {
    const html = await readFile(resolve(projectRoot, route.file), 'utf8');
    for (const match of html.matchAll(/<a\b[^>]*data-document-card[^>]*>/gi)) {
      const href = attributes(match[0]).get('href');
      assert.ok(href, `${route.file} has a document card without an href`);
      found.add(localPath(route.file, href));
    }
  }

  assert.deepEqual(found, new Set(manifest.documents.map((document) => document.localPath)));
});

test('post media uses every full image and thumbnail with progressive links', async () => {
  const fullLinks = new Set();
  const fullSources = new Set();
  const thumbnailSources = new Set();

  for (const route of manifest.routes.filter((candidate) => candidate.type === 'post')) {
    const html = await readFile(resolve(projectRoot, route.file), 'utf8');
    const articleTitle = manifest.posts.find((post) => post.slug === route.sourceSlug).title;
    const galleryItems = [...html.matchAll(/<a\b[^>]*data-gallery-item[^>]*>/gi)];
    const galleryImages = [...html.matchAll(/<img\b[^>]*data-gallery-image[^>]*>/gi)];

    if (galleryItems.length) {
      assert.match(html, /data-gallery-surface/);
      assert.match(html, /<dialog\b[^>]*class="lightbox"/);
    }

    for (const match of galleryItems) {
      const href = attributes(match[0]).get('href');
      assert.ok(href, `${route.file} has a gallery item without a direct href`);
      fullLinks.add(localPath(route.file, href));
    }

    for (const match of galleryImages) {
      const attrs = attributes(match[0]);
      assert.equal(attrs.get('loading'), 'lazy');
      assert.ok(attrs.get('alt')?.includes(articleTitle), `${route.file} has a non-contextual image label`);
      const source = localPath(route.file, attrs.get('src'));
      fullSources.add(source);
      if (attrs.has('data-gallery-thumbnail')) {
        thumbnailSources.add(localPath(route.file, attrs.get('data-gallery-thumbnail') || attrs.get('src')));
      }
    }
  }

  const expectedFull = new Set(manifest.media.full.map((image) => image.localPath));
  const expectedThumbnails = new Set(manifest.media.thumbnails.map((image) => image.localPath));
  assert.deepEqual(fullLinks, expectedFull);
  assert.deepEqual(thumbnailSources, expectedThumbnails);
  assert.equal(fullSources.size, 159, 'Every post image needs a rendered source');
});

test('archives preserve newest-first post order with year group metadata', async () => {
  for (const route of manifest.routes.filter((candidate) => candidate.type === 'archive')) {
    const html = await readFile(resolve(projectRoot, route.file), 'utf8');
    const years = [...html.matchAll(/<article\b[^>]*data-year="(\d{4})"/g)]
      .map((match) => match[1]);
    const expected = manifest.posts
      .filter((post) => post.categoryId === route.categoryId)
      .sort((left, right) => right.date.localeCompare(left.date))
      .map((post) => post.date.slice(0, 4));
    assert.deepEqual(years, expected, `${route.file} year metadata changed archive order`);
  }
});

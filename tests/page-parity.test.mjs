import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(projectRoot, 'content/manifest.json'), 'utf8'));
const source = JSON.parse(readFileSync(resolve(projectRoot, 'content/source.json'), 'utf8'));

function decodeEntities(value) {
  const named = {
    amp: '&', apos: "'", gt: '>', hellip: '…', laquo: '«', ldquo: '“',
    lsquo: '‘', lt: '<', mdash: '—', nbsp: ' ', ndash: '–', quot: '"',
    raquo: '»', rdquo: '”', rsquo: '’', bdquo: '„',
  };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code) => {
    if (code[0] !== '#') return named[code.toLowerCase()] ?? entity;
    const radix = code[1]?.toLowerCase() === 'x' ? 16 : 10;
    const digits = radix === 16 ? code.slice(2) : code.slice(1);
    return String.fromCodePoint(Number.parseInt(digits, radix));
  });
}

function visibleText(html) {
  return decodeEntities(
    html
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ').trim();
}

function extractMain(html) {
  return html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
}

function routeSource(route) {
  if (route.type === 'page') return source.pages.find((entry) => entry.slug === route.sourceSlug);
  if (route.type === 'post') return source.posts.find((entry) => entry.slug === route.sourceSlug);
  return null;
}

test('all 18 semantic HTML routes preserve their source content and file-safe navigation', () => {
  for (const route of manifest.routes) {
    const outputPath = resolve(projectRoot, route.file);
    assert.ok(existsSync(outputPath), `Missing route output: ${route.file}`);
    const html = readFileSync(outputPath, 'utf8');

    assert.match(html, /<!doctype html>/i, `${route.file} must use HTML5`);
    assert.match(html, /<html\s+lang="ro"/i, `${route.file} must declare Romanian`);
    assert.match(html, /<meta\s+charset="utf-8"/i, `${route.file} must declare UTF-8`);
    assert.match(html, new RegExp(`data-route-id="${route.id}"`));
    assert.ok(visibleText(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '').includes(route.title));

    const navLabels = [...html.matchAll(/data-nav-label="([^"]+)"/g)].map((match) => decodeEntities(match[1]));
    assert.deepEqual(navLabels, manifest.navigation.map((item) => item.label), `${route.file} nav order`);
    const internalLinks = [...html.matchAll(/data-internal-link\s+href="([^"]+)"/g)].map((match) => match[1]);
    assert.ok(internalLinks.length >= 8, `${route.file} must contain primary local links`);
    assert.ok(internalLinks.every((href) => /\.html(?:#.*)?$/.test(href)), `${route.file} must use explicit HTML links`);

    assert.ok(html.includes(manifest.footer), `${route.file} must contain the exact footer`);
    assert.doesNotMatch(html, /\/author\/|autor-admin|>\s*admin\s*</i);
    assert.doesNotMatch(html, /Add Your Comments|comment-form|comments-area/i);

    const sourceEntry = routeSource(route);
    if (sourceEntry) {
      const sourceBodyText = visibleText(sourceEntry.html);
      const outputMainText = visibleText(extractMain(html));
      if (sourceBodyText && route.id !== 'start') {
        assert.ok(
          outputMainText.includes(sourceBodyText),
          `${route.file} must preserve the normalized source-body text`,
        );
      }
    }

    if (route.type === 'post') {
      const post = source.posts.find((entry) => entry.slug === route.sourceSlug);
      assert.match(html, new RegExp(`<time[^>]+datetime="${post.date}"`));
      assert.ok(extractMain(html).includes(post.category));
    }
  }

  const startHtml = readFileSync(resolve(projectRoot, 'index.html'), 'utf8');
  const startSource = source.pages.find((entry) => entry.slug === 'start').html;
  const startMainText = visibleText(extractMain(startHtml));
  const sourceListItems = [...startSource.matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/gi)];
  const noteDefinitions = [
    {
      id: 'oug-9-2017-personal-nedidactic',
      phrase: 'Articolul 3^4',
      absentPhrase: /Începând cu luna ianuarie 2017 salariile de bază/,
      hrefs: [
        'http://legislatie.just.ro/Public/DetaliiDocument/186276',
        'http://legislatie.just.ro/Public/DetaliiDocument/186904',
      ],
    },
    {
      id: 'oug-17-2017-asimilare-functii',
      phrase: 'Functiile care nu se regasesc in prezentul tabel',
      absentPhrase: /Functiile care nu se regasesc in prezentul tabel/,
      hrefs: ['http://legislatie.just.ro/Public/DetaliiDocument/186904'],
    },
  ];
  const extractedNotes = noteDefinitions.map((definition) => {
    const sourceMatch = sourceListItems.find((match) =>
      visibleText(match[0]).includes(definition.phrase),
    );
    const route = manifest.routes.find((candidate) => candidate.id === definition.id);
    assert.ok(sourceMatch, `The ${definition.id} source note is missing`);
    assert.ok(route, `The derived ${definition.id} route is missing`);
    return { ...definition, route, sourceHtml: sourceMatch[0], sourceIndex: sourceMatch.index };
  }).sort((left, right) => left.sourceIndex - right.sourceIndex);

  let sourceCursor = 0;
  for (const note of extractedNotes) {
    const preservedSegment = startSource.slice(sourceCursor, note.sourceIndex);
    const preservedText = visibleText(preservedSegment);
    if (preservedText) assert.ok(startMainText.includes(preservedText));
    sourceCursor = note.sourceIndex + note.sourceHtml.length;

    const noteHtml = readFileSync(resolve(projectRoot, note.route.file), 'utf8');
    assert.ok(visibleText(extractMain(noteHtml)).includes(visibleText(note.sourceHtml)));
    assert.doesNotMatch(startMainText, note.absentPhrase);
    assert.match(
      startHtml,
      new RegExp(`data-start-note-link[^>]+href="${note.route.file.replaceAll('.', '\\.')}`),
    );
    for (const href of note.hrefs) assert.ok(noteHtml.includes(`href="${href}"`));
  }
  const finalPreservedText = visibleText(startSource.slice(sourceCursor));
  if (finalPreservedText) assert.ok(startMainText.includes(finalPreservedText));

  assert.equal((startHtml.match(/<details\b/g) ?? []).length, 15);
  assert.deepEqual(
    [...startHtml.matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map((match) => visibleText(match[1])),
    manifest.disclosures,
  );

  const contactHtml = readFileSync(resolve(projectRoot, 'contact.html'), 'utf8');
  assert.ok(contactHtml.includes(manifest.contact.address));
  assert.ok(contactHtml.includes(manifest.contact.email));

  for (const archiveRoute of manifest.routes.filter((route) => route.type === 'archive')) {
    const archiveHtml = readFileSync(resolve(projectRoot, archiveRoute.file), 'utf8');
    const categoryPosts = source.posts
      .filter((post) => post.categoryId === archiveRoute.categoryId)
      .sort((left, right) => right.date.localeCompare(left.date));
    for (const post of categoryPosts) {
      assert.ok(visibleText(extractMain(archiveHtml)).includes(post.title));
      assert.ok(archiveHtml.includes(post.date));
      const bodyText = visibleText(post.html);
      if (archiveRoute.id === 'evenimente') {
        const postRoute = manifest.routes.find((route) => route.sourceSlug === post.slug);
        assert.ok(archiveHtml.includes(`href="${postRoute.file}"`));
      } else if (bodyText) {
        assert.ok(visibleText(extractMain(archiveHtml)).includes(bodyText));
      }
    }
  }
});

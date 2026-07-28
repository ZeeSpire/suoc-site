import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test, before, after } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(projectRoot, 'content/manifest.json'), 'utf8'));
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

let browser;

before(async () => {
  browser = await chromium.launch({ headless: true, executablePath: chromePath });
});

after(async () => {
  await browser?.close();
});

function decodeEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'");
}

function tagAttributes(html, names) {
  const expression = new RegExp(`\\b(?:${names.join('|')})=(?:"([^"]*)"|'([^']*)')`, 'gi');
  return [...html.matchAll(expression)].map((match) => decodeEntities(match[1] ?? match[2]));
}

async function assertLocalReference(fromFile, reference) {
  const cleanReference = reference.split('#')[0].split('?')[0];
  if (!cleanReference) return;
  const target = fileURLToPath(new URL(cleanReference, pathToFileURL(resolve(projectRoot, fromFile))));
  await assert.doesNotReject(access(target), `${fromFile} references missing ${reference}`);
}

test('every static reference resolves and external links preserve the manifest', async () => {
  const externalLinks = new Set();
  for (const route of manifest.routes) {
    const html = await readFile(resolve(projectRoot, route.file), 'utf8');
    assert.doesNotMatch(html, /(?:https?:)?\/\/sindicat\.univ-ovidius\.ro/i);
    assert.doesNotMatch(html, /(?:href|src)=(?:"|')[^"']*(?:\/author\/admin\/?|author-admin)/i);

    for (const href of tagAttributes(html, ['href'])) {
      if (/^(?:mailto:|tel:|javascript:|#)/i.test(href)) continue;
      if (/^https?:/i.test(href)) {
        externalLinks.add(href);
        continue;
      }
      await assertLocalReference(route.file, href);
    }
    for (const source of tagAttributes(html, ['src'])) {
      assert.doesNotMatch(source, /^https?:/i);
      await assertLocalReference(route.file, source);
    }
  }

  externalLinks.delete('https://zeespire.com');
  assert.deepEqual(externalLinks, new Set(manifest.externalLinks));

  const stylesheet = await readFile(resolve(projectRoot, 'assets/css/site.css'), 'utf8');
  for (const match of stylesheet.matchAll(/url\((?:"([^"]+)"|'([^']+)'|([^)'"\s]+))\)/g)) {
    await assertLocalReference('assets/css/site.css', match[1] ?? match[2] ?? match[3]);
  }
  const siteScript = await readFile(resolve(projectRoot, 'assets/js/site.js'), 'utf8');
  assert.doesNotMatch(siteScript, /\bfetch\s*\(/);
});

test('all routes load offline with JavaScript enabled and disabled', async () => {
  for (const javaScriptEnabled of [true, false]) {
    const context = await browser.newContext({
      javaScriptEnabled,
      viewport: { width: 800, height: 700 },
    });
    const networkRequests = [];
    await context.route(/^https?:/, (route) => {
      networkRequests.push(route.request().url());
      return route.abort();
    });

    for (const route of manifest.routes) {
      const page = await context.newPage();
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
      });
      page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
      await page.goto(pathToFileURL(resolve(projectRoot, route.file)).href, { waitUntil: 'load' });
      assert.equal(await page.locator('main').count(), 1, `${route.file} has no main landmark`);
      assert.match(await page.locator('body').evaluate((element) => getComputedStyle(element).fontFamily), /IBM Plex Sans/);
      assert.deepEqual(errors, [], `${route.file} raised browser errors`);
      await page.close();
    }

    assert.deepEqual(networkRequests, [], 'The local site attempted an HTTP request');
    await context.close();
  }
});

test('the viewing instruction requires no server or build step', async () => {
  const readmePath = resolve(projectRoot, 'README.md');
  await assert.doesNotReject(access(readmePath), 'README.md must exist');
  const readme = await readFile(readmePath, 'utf8');
  assert.match(readme, /open\s+`?index\.html`?/i);
  assert.doesNotMatch(readme, /(?:npm|python|server|localhost)/i);
});

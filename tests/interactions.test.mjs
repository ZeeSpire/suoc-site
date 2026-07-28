import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { test, before, after } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

let browser;

before(async () => {
  browser = await chromium.launch({ headless: true, executablePath: chromePath });
});

after(async () => {
  await browser?.close();
});

async function localPage(file, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport ?? { width: 1200, height: 900 },
    reducedMotion: options.reducedMotion,
    javaScriptEnabled: options.javaScriptEnabled ?? true,
  });
  await context.route(/^https?:/, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  await page.goto(pathToFileURL(resolve(projectRoot, file)).href, { waitUntil: 'load' });
  return { context, errors, page };
}

test('mobile menu manages expanded state, Escape and focus return', async () => {
  const { context, errors, page } = await localPage('index.html', {
    viewport: { width: 390, height: 844 },
  });
  const toggle = page.locator('.menu-toggle');
  const menu = page.locator('#primary-menu');
  assert.equal(await page.locator('html.js').count(), 1);
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await menu.isHidden(), true);

  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(await menu.isVisible(), true);

  await page.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await menu.isHidden(), true);
  assert.equal(await toggle.evaluate((element) => element === document.activeElement), true);
  assert.deepEqual(errors, []);
  await context.close();
});

test('all Start disclosures remain keyboard operable', async () => {
  const { context, errors, page } = await localPage('index.html');
  const disclosures = page.locator('details.disclosure');
  assert.equal(await disclosures.count(), 15);
  const first = disclosures.first();
  await first.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await first.getAttribute('open'), '');
  await page.keyboard.press('Enter');
  assert.equal(await first.getAttribute('open'), null);
  assert.deepEqual(errors, []);
  await context.close();
});

test('classic-script local search finds Romanian content without fetch', async () => {
  const { context, errors, page } = await localPage('index.html');
  const input = page.locator('[data-search-input]');
  const results = page.locator('[data-search-results] a');
  assert.equal(await input.count(), 1);

  for (const query of ['vouchere', 'doctorat', 'Crăciun']) {
    await input.fill(query);
    await input.press('Enter');
    assert.ok(await results.count() > 0, `No local result for ${query}`);
    for (const link of await results.all()) {
      assert.match(await link.getAttribute('href'), /\.html(?:#.*)?$/);
    }
  }

  const fetchCalls = await page.evaluate(() => window.__suocFetchCalls ?? 0);
  assert.equal(fetchCalls, 0);
  assert.deepEqual(errors, []);
  await context.close();
});

test('gallery dialog supports next, previous, Escape and focus return', async () => {
  const { context, errors, page } = await localPage('articole/spectacol-craciun-2014.html');
  assert.equal(await page.locator('html.js').count(), 1);
  const firstItem = page.locator('[data-gallery-item]').first();
  const firstHref = await firstItem.getAttribute('href');
  await firstItem.click();

  const dialog = page.locator('dialog.lightbox');
  assert.equal(await dialog.evaluate((element) => element.open), true);
  const image = dialog.locator('[data-lightbox-image]');
  assert.equal(await image.getAttribute('src'), firstHref);

  await dialog.locator('[data-lightbox-next]').click();
  assert.notEqual(await image.getAttribute('src'), firstHref);
  await dialog.locator('[data-lightbox-previous]').click();
  assert.equal(await image.getAttribute('src'), firstHref);

  await page.keyboard.press('Escape');
  assert.equal(await dialog.evaluate((element) => element.open), false);
  assert.equal(await firstItem.evaluate((element) => element === document.activeElement), true);
  assert.deepEqual(errors, []);
  await context.close();
});

test('reduced-motion preference disables smooth and decorative motion', async () => {
  const { context, errors, page } = await localPage('index.html', { reducedMotion: 'reduce' });
  const motion = await page.evaluate(() => ({
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
    transition: getComputedStyle(document.querySelector('.gallery__item') ?? document.body).transitionDuration,
  }));
  assert.equal(motion.scroll, 'auto');
  const transitionSeconds = motion.transition.endsWith('ms')
    ? Number.parseFloat(motion.transition) / 1000
    : Number.parseFloat(motion.transition);
  assert.ok(transitionSeconds <= 0.00001, `Transition remains ${motion.transition}`);
  assert.deepEqual(errors, []);
  await context.close();
});

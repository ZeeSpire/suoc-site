import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test, before, after } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const manifest = JSON.parse(await readFile(resolve(projectRoot, 'content/manifest.json'), 'utf8'));

let browser;

before(async () => {
  browser = await chromium.launch({ headless: true, executablePath: chromePath });
});

after(async () => {
  await browser?.close();
});

async function openLocalPage(file = 'index.html', viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  await context.route(/^https?:/, (route) => route.abort());
  const page = await context.newPage();
  await page.goto(pathToFileURL(resolve(projectRoot, file)).href, { waitUntil: 'load' });
  return { context, page };
}

test('local stylesheet defines the approved Ovidius-derived system', async () => {
  const stylesheet = resolve(projectRoot, 'assets/css/site.css');
  const font = resolve(projectRoot, 'assets/fonts/ibm-plex-sans.woff2');
  await Promise.all([access(stylesheet), access(font)]);

  const css = await readFile(stylesheet, 'utf8');
  assert.match(css, /@font-face[\s\S]*IBM Plex Sans/);
  assert.match(css, /@media\s+print/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('desktop identity, navigation, type and reading width match the visual brief', async () => {
  const { context, page } = await openLocalPage('despre-noi.html');
  const styles = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const identity = getComputedStyle(document.querySelector('.identity-field'));
    const navigation = getComputedStyle(document.querySelector('.primary-navigation'));
    const reading = document.querySelector('.source-content').getBoundingClientRect();
    const shell = document.querySelector('.site-shell').getBoundingClientRect();
    return {
      tokens: {
        primary: root.getPropertyValue('--color-primary').trim(),
        navy: root.getPropertyValue('--color-navy').trim(),
        text: root.getPropertyValue('--color-text').trim(),
        surface: root.getPropertyValue('--color-surface').trim(),
      },
      bodyFont: getComputedStyle(document.body).fontFamily,
      identityBackground: identity.backgroundColor,
      navigationBackground: navigation.backgroundColor,
      readingWidth: reading.width,
      shellWidth: shell.width,
    };
  });

  assert.deepEqual(styles.tokens, {
    primary: '#003399',
    navy: '#000066',
    text: '#2A2C59',
    surface: '#FAFBFC',
  });
  assert.match(styles.bodyFont, /IBM Plex Sans/);
  assert.equal(styles.identityBackground, 'rgb(0, 0, 102)');
  assert.equal(styles.navigationBackground, 'rgb(0, 51, 153)');
  assert.ok(styles.shellWidth <= 1290, `Shell is ${styles.shellWidth}px wide`);
  assert.ok(styles.readingWidth <= 900, `Reading measure is ${styles.readingWidth}px wide`);

  const navigationRects = await page.locator('.primary-navigation a').evaluateAll((links) =>
    links.map((link) => {
      const rect = link.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, height: rect.height };
    }),
  );
  assert.equal(navigationRects.length, 8);
  for (const property of ['top', 'bottom', 'height']) {
    const values = navigationRects.map((rect) => rect[property]);
    const spread = Math.max(...values) - Math.min(...values);
    assert.ok(spread <= 1, `Navigation ${property} differs by ${spread}px`);
  }

  const firstLink = page.locator('.primary-navigation a').first();
  await firstLink.focus();
  const focus = await firstLink.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.outlineColor, style: style.outlineStyle, width: style.outlineWidth };
  });
  assert.notEqual(focus.style, 'none');
  assert.notEqual(focus.width, '0px');
  await context.close();
});

test('the identity banner combines local artwork, the official logo and live SUOC text', async () => {
  for (const width of [390, 1440]) {
    const { context, page } = await openLocalPage('index.html', { width, height: 900 });
    const banner = page.locator('.identity-field');
    const logo = banner.locator('[data-uoc-logo]');
    const artwork = banner.locator('[data-identity-artwork]');
    const title = banner.locator('[data-brand-title]');

    assert.equal(await logo.count(), 1);
    assert.equal(await artwork.count(), 1);
    assert.equal(await title.count(), 1);
    assert.equal(await logo.getAttribute('alt'), 'Universitatea Ovidius din Constanța');
    assert.equal(await artwork.getAttribute('alt'), '');
    assert.match(await title.textContent(), /Sindicatul Universității Ovidius din Constanța/);
    assert.match(await banner.textContent(), /SUOC/);

    const layout = await banner.evaluate((element) => {
      const logoImage = element.querySelector('[data-uoc-logo]');
      const artworkImage = element.querySelector('[data-identity-artwork]');
      return {
        bannerWidth: element.getBoundingClientRect().width,
        logoWidth: logoImage.getBoundingClientRect().width,
        logoNaturalWidth: logoImage.naturalWidth,
        artworkNaturalWidth: artworkImage.naturalWidth,
        artworkSource: artworkImage.src,
        artworkZIndex: Number(getComputedStyle(artworkImage).zIndex),
        logoSource: logoImage.src,
      };
    });
    assert.match(layout.logoSource, /^file:/);
    assert.match(layout.artworkSource, /^file:/);
    assert.equal(layout.logoNaturalWidth, 1537);
    assert.ok(layout.artworkNaturalWidth >= 1600);
    assert.ok(layout.artworkZIndex >= 0, 'Generated artwork must paint above the banner background');
    assert.ok(layout.logoWidth < layout.bannerWidth / 2);
    await context.close();
  }
});

test('a one-image gallery uses its full asset in a bounded lightbox tile', async () => {
  const { context, page } = await openLocalPage('articole/sejur-profesori-2013.html');
  const gallery = page.locator('[data-gallery-surface]').last();
  const item = gallery.locator('[data-gallery-item]');

  assert.equal(await item.count(), 1);
  await item.scrollIntoViewIfNeeded();
  const image = item.locator('[data-gallery-image]');
  await page.waitForFunction(
    (element) => element.complete && element.naturalWidth > 0,
    await image.elementHandle(),
    { timeout: 2000 },
  );
  const media = await item.evaluate((anchor) => {
    const galleryImage = anchor.querySelector('[data-gallery-image]');
    const rect = anchor.getBoundingClientRect();
    return {
      galleryClass: anchor.parentElement.className,
      href: anchor.href,
      src: galleryImage.src,
      naturalWidth: galleryImage.naturalWidth,
      naturalHeight: galleryImage.naturalHeight,
      renderedWidth: rect.width,
      renderedHeight: rect.height,
    };
  });

  assert.match(media.galleryClass, /\bgallery--single\b/);
  assert.equal(media.src, media.href);
  assert.ok(media.naturalWidth >= 800, `Single image is only ${media.naturalWidth}px wide`);
  assert.ok(media.renderedWidth <= 481, `Single gallery item is ${media.renderedWidth}px wide`);
  assert.ok(
    Math.abs((media.renderedWidth / media.renderedHeight) - (media.naturalWidth / media.naturalHeight)) < 0.02,
    'Single gallery image should preserve its original aspect ratio',
  );

  await item.click();
  const dialog = page.locator('dialog.lightbox');
  assert.equal(await dialog.evaluate((element) => element.open), true);
  assert.equal(await dialog.locator('[data-lightbox-image]').evaluate((image) => image.src), media.href);
  await context.close();
});

test('mobile navigation is compact and every route avoids horizontal overflow', async () => {
  for (const width of [390, 768, 1440]) {
    for (const route of manifest.routes) {
      const { context, page } = await openLocalPage(route.file, { width, height: 900 });
      const overflow = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert.ok(
        overflow.scroll <= overflow.client + 1,
        `${route.file} overflows at ${width}px (${overflow.scroll} > ${overflow.client})`,
      );
      if (width === 390) {
        const toggle = page.locator('.menu-toggle');
        await assert.doesNotReject(() => toggle.waitFor({ state: 'visible', timeout: 100 }));
        const label = await toggle.getAttribute('aria-label');
        assert.ok(label, 'Mobile menu toggle needs an accessible label');
      }
      await context.close();
    }
  }
});

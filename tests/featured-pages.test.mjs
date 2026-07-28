import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { test, before, after } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sourceArchive = JSON.parse(readFileSync(resolve(projectRoot, 'content/source.json'), 'utf8'));

function decodeHref(value) {
  return value
    .replace(/&amp;|&#0*38;/gi, '&')
    .replace(/&#x0*26;/gi, '&');
}

function externalHrefs(html) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
    .map((match) => decodeHref(match[1]))
    .filter((href) => {
      try {
        return /^https?:/i.test(href)
          && new URL(href).hostname !== 'sindicat.univ-ovidius.ro';
      } catch {
        return false;
      }
    });
}

let browser;

before(async () => {
  browser = await chromium.launch({ headless: true, executablePath: chromePath });
});

after(async () => {
  await browser?.close();
});

async function openLocalPage(file, width) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const networkRequests = [];
  await context.route(/^https?:/, (route) => {
    networkRequests.push(route.request().url());
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(resolve(projectRoot, file)).href, { waitUntil: 'load' });
  return { context, networkRequests, page };
}

test('Start uses a responsive dossier layout without changing its archive inventory', async () => {
  const expectedLabels = ['Alegeri', 'Noutati', 'Sinteză acțiuni S.U.O.C.', 'Utile'];

  for (const width of [390, 1440]) {
    const { context, networkRequests, page } = await openLocalPage('index.html', width);
    const main = page.locator('main');

    assert.equal(await main.locator('.content-page--start').count(), 1);
    assert.deepEqual(
      await main.locator('[data-start-index] [data-index-label]').allTextContents(),
      expectedLabels,
    );
    assert.deepEqual(
      await main.locator('[data-start-section] [data-section-label]').allTextContents(),
      expectedLabels,
    );
    assert.equal(await main.locator('[data-start-section]').count(), 4);
    assert.equal(await main.locator('details.disclosure').count(), 15);
    const documentActions = main.locator('.content-page--start [data-document-card]');
    assert.equal(await documentActions.count(), 22);
    assert.deepEqual(
      await documentActions.evaluateAll((links) => {
        const counts = Object.groupBy(links, (link) => link.dataset.documentFormat);
        return Object.fromEntries(Object.entries(counts).map(([format, items]) => [format, items.length]));
      }),
      { DOCX: 1, PDF: 21 },
    );
    assert.ok(
      await documentActions.evaluateAll((links) => links.every((link) =>
        link.href.startsWith('file:') && link.href.includes('/assets/documents/'),
      )),
    );

    const resultAction = main.locator('a[data-document-card]', {
      hasText: 'Comunicare rezultat alegeri',
    });
    await resultAction.evaluate((link) => {
      link.closest('details').open = true;
    });
    const resultActionStyle = await resultAction.evaluate((link) => {
      const box = link.getBoundingClientRect();
      const style = getComputedStyle(link);
      return {
        after: getComputedStyle(link, '::after').content.replaceAll('"', ''),
        background: style.backgroundColor,
        color: style.color,
        display: style.display,
        height: box.height,
        right: box.right,
      };
    });
    assert.equal(resultActionStyle.background, 'rgb(255, 255, 255)');
    assert.equal(resultActionStyle.color, 'rgb(25, 42, 61)');
    assert.equal(resultActionStyle.display, 'inline-grid');
    assert.match(resultActionStyle.after, /PDF.*→/);
    assert.ok(resultActionStyle.height >= 48);
    assert.ok(resultActionStyle.right <= width + 1);

    const firstSection = await main.locator('[data-start-section]').first().evaluate((section) => {
      const label = section.querySelector('[data-section-label]').getBoundingClientRect();
      const content = section.querySelector('[data-section-content]').getBoundingClientRect();
      return {
        labelBottom: label.bottom,
        labelLeft: label.left,
        labelRight: label.right,
        contentLeft: content.left,
        contentTop: content.top,
      };
    });
    if (width === 1440) {
      assert.ok(firstSection.contentLeft > firstSection.labelRight);
    } else {
      assert.ok(Math.abs(firstSection.contentLeft - firstSection.labelLeft) <= 1);
      assert.ok(firstSection.contentTop >= firstSection.labelBottom);
    }

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 1);
    assert.deepEqual(networkRequests, []);
    assert.match(page.url(), /^file:/);
    await context.close();
  }
});

test('Start section selector uses editorial navigation cards', async () => {
  const expectedTargets = [
    '#start-alegeri',
    '#start-noutati',
    '#start-sinteza-actiuni-s-u-o-c',
    '#start-utile',
  ];

  for (const width of [390, 1440]) {
    const { context, networkRequests, page } = await openLocalPage('index.html', width);
    const index = page.locator('[data-start-index]');
    const links = index.locator(':scope > a');

    assert.deepEqual(
      await links.evaluateAll((items) => items.map((link) => link.getAttribute('href'))),
      expectedTargets,
    );

    const presentation = await index.evaluate((element) => ({
      columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
      links: [...element.children].map((link) => {
        const style = getComputedStyle(link);
        return {
          after: getComputedStyle(link, '::after').content.replaceAll('"', ''),
          background: style.backgroundColor,
          before: getComputedStyle(link, '::before').content.replaceAll('"', ''),
          borderTopWidth: style.borderTopWidth,
          display: style.display,
          height: link.getBoundingClientRect().height,
        };
      }),
    }));

    assert.equal(presentation.columns, width === 1440 ? 2 : 1);
    assert.ok(presentation.links.every((link) => link.display === 'grid'));
    assert.ok(presentation.links.every((link) => link.background === 'rgb(255, 255, 255)'));
    assert.ok(presentation.links.every((link) => link.borderTopWidth === '4px'));
    assert.ok(presentation.links.every((link) => link.before === 'SECȚIUNE'));
    assert.ok(presentation.links.every((link) => link.after === '↓'));
    assert.ok(presentation.links.every((link) => link.height >= 128));

    assert.deepEqual(networkRequests, []);
    await context.close();
  }
});

test('Start applies the action system to Alegeri, Sinteza and Utile', async () => {
  const sectionExpectations = [
    {
      id: 'start-alegeri', rows: 5, links: 3, single: 3, info: 2, disclosures: 5,
    },
    {
      id: 'start-sinteza-actiuni-s-u-o-c',
      rows: 14,
      links: 14,
      single: 14,
      info: 0,
      disclosures: 4,
    },
    {
      id: 'start-utile', rows: 8, links: 8, single: 8, info: 0, disclosures: 0,
    },
  ];

  for (const width of [390, 1440]) {
    const { context, networkRequests, page } = await openLocalPage('index.html', width);
    const main = page.locator('main');

    for (const expectation of sectionExpectations) {
      const section = main.locator(`#${expectation.id}`);
      const actionRows = section.locator('[data-start-action]');
      const actionLinks = section.locator('[data-start-action-link]');
      assert.equal(await actionRows.count(), expectation.rows);
      assert.equal(await actionLinks.count(), expectation.links);
      assert.equal(await section.locator('[data-start-action-kind="single"]').count(), expectation.single);
      assert.equal(await section.locator('[data-start-action-kind="actions"]').count(), 0);
      assert.equal(await section.locator('[data-start-action-kind="group"]').count(), 0);
      assert.equal(await section.locator('[data-start-action-kind="info"]').count(), expectation.info);
      assert.equal(await section.locator('details.disclosure').count(), expectation.disclosures);
    }

    const otherSections = main.locator(
      '#start-alegeri, #start-sinteza-actiuni-s-u-o-c, #start-utile',
    );
    const actionRows = otherSections.locator('[data-start-action]');
    const actionLinks = otherSections.locator('[data-start-action-link]');
    assert.equal(await actionRows.count(), 27);
    assert.equal(await actionLinks.count(), 25);
    assert.ok(await actionLinks.evaluateAll((links) => links.every((link) => {
      const row = link.closest('[data-start-action]');
      const style = getComputedStyle(link);
      return style.display === 'inline-grid'
        && Number.parseFloat(style.borderTopWidth) > 0
        && getComputedStyle(link, '::after').content !== 'none'
        && Math.abs(link.getBoundingClientRect().width - row.getBoundingClientRect().width) <= 1;
    })));
    assert.ok(await actionRows.evaluateAll((rows) => rows.every((row) =>
      getComputedStyle(row).listStyleType === 'none'
        && getComputedStyle(row, '::before').content === 'none')));

    const electionInfo = main.locator('#start-alegeri [data-start-action-kind="info"]');
    assert.equal(await electionInfo.count(), 2);
    assert.ok(await electionInfo.evaluateAll((rows) => rows.every((row) =>
      getComputedStyle(row, '::after').content.replaceAll('"', '') === 'INFO'
        && !row.querySelector('a'))));

    const usefulLinks = main.locator('#start-utile [data-start-action-link]');
    assert.equal(await usefulLinks.count(), 8);
    assert.ok(await usefulLinks.evaluateAll((links) => links.every((link) =>
      link.hasAttribute('data-external-card')
        && link.dataset.externalLabel.match(/^(?:LINK|PDF)$/)
        && link.getAttribute('target') === '_blank')));

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 1);
    assert.deepEqual(networkRequests, []);
    await context.close();
  }
});

test('Start moves the long OUG 9/2017 note to one complete local information page', async () => {
  const expectedSources = [
    'http://legislatie.just.ro/Public/DetaliiDocument/186276',
    'http://legislatie.just.ro/Public/DetaliiDocument/186904',
  ];

  for (const width of [390, 1440]) {
    const { context, networkRequests, page } = await openLocalPage('index.html', width);
    const main = page.locator('main');
    const noteLink = main.locator(
      'a[data-start-note-link][href="informatii/oug-9-2017-personal-nedidactic.html"]',
    );

    assert.equal(await noteLink.count(), 1);
    assert.equal(
      (await noteLink.textContent()).replace(/\s+/g, ' ').trim(),
      'Majorarea cu 15% a salariilor personalului nedidactic (2017)',
    );
    assert.doesNotMatch(
      await main.textContent(),
      /Începând cu luna ianuarie 2017 salariile de bază/,
    );
    const noteTarget = await noteLink.evaluate((link) => link.href);
    assert.match(noteTarget, /^file:.*\/informatii\/oug-9-2017-personal-nedidactic\.html$/);

    await page.goto(noteTarget, { waitUntil: 'load' });
    const note = page.locator('main .content-page--note');
    assert.equal(await note.count(), 1);
    assert.equal(
      await note.locator('h1').textContent(),
      'Majorarea cu 15% a salariilor personalului nedidactic (2017)',
    );
    assert.match(await note.locator('[data-note-source]').textContent(), /Articolul 3\^4/);
    assert.match(await note.locator('[data-note-source]').textContent(), /ABROGAT/);
    assert.deepEqual(
      await note.locator('[data-note-source] a').evaluateAll((links) =>
        links.map((link) => link.href),
      ),
      expectedSources,
    );
    assert.match(
      await note.locator('[data-note-back-link]').evaluate((link) => link.href),
      /^file:.*\/index\.html#start-noutati$/,
    );

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 1);
    assert.deepEqual(networkRequests, []);
    await context.close();
  }
});

test('Start moves the OUG 17/2017 function-assimilation note to a local information page', async () => {
  const title = 'Asimilarea funcțiilor pentru salarizare (OUG 17/2017)';
  const sourceUrl = 'http://legislatie.just.ro/Public/DetaliiDocument/186904';

  for (const width of [390, 1440]) {
    const { context, networkRequests, page } = await openLocalPage('index.html', width);
    const main = page.locator('main');
    const noteLink = main.locator(
      'a[data-start-note-link][href="informatii/oug-17-2017-asimilare-functii.html"]',
    );

    assert.equal(await noteLink.count(), 1);
    assert.equal((await noteLink.textContent()).replace(/\s+/g, ' ').trim(), title);
    assert.doesNotMatch(
      await main.textContent(),
      /Functiile care nu se regasesc in prezentul tabel/,
    );
    const noteTarget = await noteLink.evaluate((link) => link.href);
    assert.match(noteTarget, /^file:.*\/informatii\/oug-17-2017-asimilare-functii\.html$/);

    await page.goto(noteTarget, { waitUntil: 'load' });
    const note = page.locator('main .content-page--note');
    assert.equal(await note.count(), 1);
    assert.equal(await note.locator('h1').textContent(), title);
    assert.match(
      await note.locator('[data-note-source]').textContent(),
      /Functiile care nu se regasesc in prezentul tabel/,
    );
    assert.deepEqual(
      await note.locator('[data-note-source] a').evaluateAll((links) =>
        links.map((link) => link.href),
      ),
      [sourceUrl],
    );
    const sourceLink = note.locator('[data-note-source] a');
    assert.equal(await sourceLink.getAttribute('target'), '_blank');
    assert.equal(await sourceLink.getAttribute('rel'), 'noopener noreferrer');
    assert.equal(await sourceLink.getAttribute('data-external-card'), null);
    assert.equal(await sourceLink.getAttribute('data-external-label'), null);
    assert.equal(await sourceLink.evaluate((link) => link.classList.contains('external-card')), false);
    const sourceLinkStyle = await sourceLink.evaluate((link) => ({
      after: getComputedStyle(link, '::after').content,
      background: getComputedStyle(link).backgroundColor,
      display: getComputedStyle(link).display,
      textDecoration: getComputedStyle(link).textDecorationLine,
    }));
    assert.equal(sourceLinkStyle.after, 'none');
    assert.equal(sourceLinkStyle.background, 'rgba(0, 0, 0, 0)');
    assert.equal(sourceLinkStyle.display, 'inline');
    assert.match(sourceLinkStyle.textDecoration, /underline/);
    assert.match(
      await note.locator('[data-note-back-link]').evaluate((link) => link.href),
      /^file:.*\/index\.html#start-noutati$/,
    );

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 1);
    assert.deepEqual(networkRequests, []);
    await context.close();
  }
});

test('Start presents the complete Noutati index as consistent actions', async () => {
  const startSource = sourceArchive.pages.find((entry) => entry.slug === 'start').html;
  const sourceNotes = [...startSource.matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/gi)]
    .map((match) => match[0])
    .filter((item) => item.includes('Articolul 3^4')
      || item.includes('Functiile care nu se regasesc in prezentul tabel'));
  assert.equal(sourceNotes.length, 2);
  const startWithoutNotes = sourceNotes.reduce(
    (html, sourceNote) => html.replace(sourceNote, ''),
    startSource,
  );
  const expectedStartTargets = externalHrefs(startWithoutNotes).sort();
  const expectedNoteTargets = externalHrefs(
    sourceNotes.find((sourceNote) => sourceNote.includes('Articolul 3^4')),
  ).sort();
  const yearExpectations = [
    { year: '2017', rows: 12, links: 16, single: 9, actions: 1, group: 2, info: 0 },
    { year: '2016', rows: 15, links: 16, single: 14, actions: 1, group: 0, info: 0 },
    { year: '2015', rows: 35, links: 43, single: 30, actions: 2, group: 2, info: 1 },
    { year: '2014', rows: 58, links: 72, single: 44, actions: 2, group: 9, info: 3 },
    { year: '2013', rows: 13, links: 18, single: 10, actions: 1, group: 2, info: 0 },
    { year: '2012', rows: 1, links: 0, single: 0, actions: 0, group: 0, info: 1 },
  ];

  for (const width of [390, 1440]) {
    const { context, networkRequests, page } = await openLocalPage('index.html', width);
    const main = page.locator('main');
    const startLinks = page.locator(
      'main a[href^="http://"], main a[href^="https://"]',
    );

    assert.equal(await startLinks.count(), expectedStartTargets.length);
    assert.deepEqual(
      (await startLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')))).sort(),
      expectedStartTargets,
    );

    const news = main.locator('#start-noutati');
    const yearActionGroups = news.locator('[data-start-year-actions]');
    assert.equal(await yearActionGroups.count(), yearExpectations.length);
    assert.deepEqual(
      await yearActionGroups.evaluateAll((groups) =>
        groups.map((group) => group.dataset.startYearActions)),
      yearExpectations.map(({ year }) => year),
    );

    for (const expectation of yearExpectations) {
      const yearActions = news.locator(`[data-start-year-actions="${expectation.year}"]`);
      await yearActions.evaluate((group) => {
        group.closest('details').open = true;
      });
      const rows = yearActions.locator(
        ':scope > .start-year-action-list > [data-start-year-action]',
      );
      assert.equal(await rows.count(), expectation.rows);
      assert.equal(await rows.locator('[data-start-year-action-link]').count(), expectation.links);
      assert.equal(
        await yearActions.locator(
          ':scope > .start-year-action-list > [data-start-action-kind="single"]',
        ).count(),
        expectation.single,
      );
      assert.equal(
        await yearActions.locator(
          ':scope > .start-year-action-list > [data-start-action-kind="group"]',
        ).count(),
        expectation.group,
      );
      assert.equal(
        await yearActions.locator(
          ':scope > .start-year-action-list > [data-start-action-kind="actions"]',
        ).count(),
        expectation.actions,
      );
      const infoRows = yearActions.locator(
        ':scope > .start-year-action-list > [data-start-action-kind="info"]',
      );
      assert.equal(await infoRows.count(), expectation.info);
      assert.ok(await infoRows.evaluateAll((rows) => rows.every((row) => !row.querySelector('a'))));
    }

    const actionRows = news.locator('[data-start-year-action]');
    const actionLinks = news.locator('[data-start-year-action-link]');
    assert.equal(await actionRows.count(), 134);
    assert.equal(await actionLinks.count(), 165);
    assert.equal(await news.locator('[data-start-action-kind="single"]').count(), 107);
    assert.equal(await news.locator('[data-start-action-kind="actions"]').count(), 7);
    assert.equal(await news.locator('[data-start-action-kind="group"]').count(), 15);
    assert.equal(await news.locator('[data-start-action-kind="info"]').count(), 5);

    const singleActionLinks = news.locator(
      '[data-start-action-kind="single"] [data-start-year-action-link]',
    );
    assert.equal(await singleActionLinks.count(), 107);
    assert.ok(await singleActionLinks.evaluateAll((links) => links.every((link) => {
      const style = getComputedStyle(link);
      return style.display === 'inline-grid'
        && Number.parseFloat(style.borderTopWidth) > 0
        && getComputedStyle(link, '::after').content !== 'none';
    })));

    const linkOnlyActionRows = news.locator('[data-start-action-kind="actions"]');
    const linkOnlyActionLinks = linkOnlyActionRows.locator('[data-start-year-action-link]');
    assert.equal(await linkOnlyActionRows.count(), 7);
    assert.equal(await linkOnlyActionLinks.count(), 16);
    assert.ok(await linkOnlyActionLinks.evaluateAll((links) => links.every((link) => {
      const style = getComputedStyle(link);
      const rowWidth = link.closest('[data-start-action-kind="actions"]')
        .getBoundingClientRect().width;
      return style.display === 'grid'
        && Number.parseFloat(style.borderTopWidth) > 0
        && getComputedStyle(link, '::after').content !== 'none'
        && Math.abs(link.getBoundingClientRect().width - rowWidth) <= 1;
    })));

    const groupedActionLinks = news.locator(
      '[data-start-action-kind="group"] [data-start-year-action-link]',
    );
    assert.equal(await groupedActionLinks.count(), 42);
    const groupedLinkStyles = await groupedActionLinks.evaluateAll((links) => links.map((link) => {
      const style = getComputedStyle(link);
      return {
        after: getComputedStyle(link, '::after').content,
        background: style.backgroundColor,
        borderWidths: [
          style.borderTopWidth,
          style.borderRightWidth,
          style.borderBottomWidth,
          style.borderLeftWidth,
        ],
        display: style.display,
        padding: [
          style.paddingTop,
          style.paddingRight,
          style.paddingBottom,
          style.paddingLeft,
        ],
        textDecorationLine: style.textDecorationLine,
      };
    }));
    assert.ok(groupedLinkStyles.every((style) => style.display === 'inline'));
    assert.ok(groupedLinkStyles.every((style) => style.background === 'rgba(0, 0, 0, 0)'));
    assert.ok(groupedLinkStyles.every((style) => style.borderWidths.every((width) => width === '0px')));
    assert.ok(groupedLinkStyles.every((style) => style.padding.every((value) => value === '0px')));
    assert.ok(groupedLinkStyles.every((style) => style.after === 'none'));
    assert.ok(groupedLinkStyles.every((style) =>
      style.textDecorationLine.split(' ').includes('underline')));

    const cited2013Group = news.locator(
      '[data-start-year-actions="2013"] [data-start-action-kind="group"]',
      { hasText: 'Adrese minister privind deblocarea fondurilor universitatilor' },
    );
    assert.equal(await cited2013Group.count(), 1);
    assert.equal(await cited2013Group.locator('[data-start-year-action-link]').count(), 2);
    assert.ok((await cited2013Group.textContent()).includes('Legea 221/2008'));

    const cited2017Actions = news.locator(
      '[data-start-year-actions="2017"] [data-start-action-kind="actions"]',
      { hasText: 'Raport MCV pentru Romania' },
    );
    assert.equal(await cited2017Actions.count(), 1);
    assert.deepEqual(
      await cited2017Actions.locator('[data-start-year-action-link]').allTextContents(),
      ['Raport MCV pentru Romania', 'Raport tehnic'],
    );

    const newsExternalActions = news.locator('a[href^="http://"], a[href^="https://"]');
    assert.ok(await newsExternalActions.evaluateAll((links) => links.every((link) =>
      link.hasAttribute('data-external-card')
        && link.hasAttribute('data-external-label')
        && link.classList.contains('external-card'))));

    const outsideNewsActionState = await startLinks.evaluateAll((links) => links
      .filter((link) => !link.closest('#start-noutati') && /^https?:\/\//.test(link.href))
      .map((link) => ({
        externalCard: link.hasAttribute('data-external-card'),
        externalLabel: link.hasAttribute('data-external-label'),
        externalClass: link.classList.contains('external-card'),
      })));
    assert.ok(
      outsideNewsActionState.every((link) =>
        link.externalCard && link.externalLabel && link.externalClass),
    );

    const actionVisuals = await actionRows.evaluateAll((rows) => rows.map((row) => {
      const directLink = row.querySelector(':scope > a[data-start-year-action-link]');
      return {
        kind: row.dataset.startActionKind,
        linkBefore: directLink ? getComputedStyle(directLink, '::before').content : 'none',
        listStyle: getComputedStyle(row).listStyleType,
        rowBefore: getComputedStyle(row, '::before').content,
      };
    }));
    assert.ok(actionVisuals.every((row) => row.listStyle === 'none' && row.rowBefore === 'none'));
    assert.ok(
      actionVisuals.filter((row) => row.kind === 'single')
        .every((row) => row.linkBefore === 'none'),
    );

    const yearActions2017 = news.locator('[data-start-year-actions="2017"]');
    const localPdfAction = yearActions2017.locator('a[data-document-card]', {
      hasText: 'Memoriul pentru vouchere de vacanta',
    });
    const externalPdfAction = yearActions2017.locator('a[data-external-label="PDF"]', {
      hasText: 'Rezolutia C.N.C. FNS ALMA MATER 11.03.2017',
    });
    const pdfActionStyles = await Promise.all([localPdfAction, externalPdfAction].map((link) =>
      link.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          after: getComputedStyle(element, '::after').content.replaceAll('"', ''),
          before: getComputedStyle(element, '::before').content,
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns,
          width: element.getBoundingClientRect().width,
        };
      })));
    assert.ok(pdfActionStyles.every((style) => style.after.match(/PDF.*→/)));
    assert.ok(pdfActionStyles.every((style) => style.before === 'none'));
    assert.ok(pdfActionStyles.every((style) => style.display === 'inline-grid'));
    assert.equal(pdfActionStyles[0].gridTemplateColumns, pdfActionStyles[1].gridTemplateColumns);
    assert.ok(pdfActionStyles.every((style) => style.width > 250));

    const groupedAction = yearActions2017
      .locator(':scope > .start-year-action-list > [data-start-action-kind="group"]')
      .first();
    const groupedActionStyle = await groupedAction.evaluate((row) => {
      const style = getComputedStyle(row);
      return {
        background: style.backgroundColor,
        borderLeftWidth: style.borderLeftWidth,
      };
    });
    assert.equal(groupedActionStyle.background, 'rgb(255, 255, 255)');
    assert.ok(Number.parseFloat(groupedActionStyle.borderLeftWidth) >= 3);

    const informationalPanels = news.locator(
      '[data-start-action-kind="group"], [data-start-action-kind="info"]',
    );
    assert.equal(await informationalPanels.count(), 20);
    const infoActionStyles = await informationalPanels
      .evaluateAll((rows) => rows.map((row) => ({
        after: getComputedStyle(row, '::after').content.replaceAll('"', ''),
        background: getComputedStyle(row).backgroundColor,
        paddingRight: Number.parseFloat(getComputedStyle(row).paddingRight),
        position: getComputedStyle(row).position,
      })));
    assert.ok(infoActionStyles.every((style) => style.after === 'INFO'));
    assert.ok(infoActionStyles.every((style) => style.paddingRight >= 60));
    assert.ok(infoActionStyles.every((style) => style.position === 'relative'));

    const noLinkInfoActionStyles = await news.locator('[data-start-action-kind="info"]')
      .evaluateAll((rows) => rows.map((row) => getComputedStyle(row).backgroundColor));
    assert.ok(noLinkInfoActionStyles.every((background) => background === 'rgb(250, 251, 252)'));

    const citedCnafsPanel = news.locator(
      '[data-start-year-actions="2015"] [data-start-action-kind="group"]',
      { hasText: 'Seria intalnirilor de lucru a Coalitiei Nationale' },
    );
    assert.equal(await citedCnafsPanel.count(), 1);
    assert.equal(
      (await citedCnafsPanel.evaluate((row) => getComputedStyle(row, '::after').content))
        .replaceAll('"', ''),
      'INFO',
    );
    assert.equal(await citedCnafsPanel.locator('[data-start-year-action-link]').count(), 2);

    const documentActions = main.locator('[data-document-card]');
    assert.equal(await documentActions.count(), 22);
    const startNoteActions = main.locator('[data-start-note-link]');
    assert.equal(await startNoteActions.count(), 2);
    assert.ok(
      await startNoteActions.evaluateAll((links) => links.every((link) =>
        link.dataset.linkLabel === 'DETALII' && link.classList.contains('internal-card'),
      )),
    );

    await page.goto(pathToFileURL(resolve(
      projectRoot,
      'informatii/oug-9-2017-personal-nedidactic.html',
    )).href, { waitUntil: 'load' });
    const derivedNoteActions = page.locator('main [data-note-source] a[data-external-card]');
    assert.equal(await derivedNoteActions.count(), expectedNoteTargets.length);
    assert.deepEqual(
      (await derivedNoteActions.evaluateAll((links) =>
        links.map((link) => link.getAttribute('href'))
      )).sort(),
      expectedNoteTargets,
    );
    assert.ok(
      await derivedNoteActions.evaluateAll((links) => links.every((link) =>
        link.dataset.externalLabel === 'LINK' && link.classList.contains('external-card'),
      )),
    );

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 1);
    assert.deepEqual(networkRequests, []);
    await context.close();
  }
});

test('Evenimente links compact year cards to complete individual event pages', async () => {
  for (const width of [390, 1440]) {
    const { context, networkRequests, page } = await openLocalPage('evenimente.html', width);
    const main = page.locator('main');
    const cards = main.locator('[data-event-card]');
    const covers = main.locator('[data-event-cover] img');

    assert.equal(await main.locator('.archive-page--events').count(), 1);
    assert.equal(await cards.count(), 5);
    assert.deepEqual(
      await main.locator('[data-archive-year-heading]').allTextContents(),
      ['2014', '2013', '2012'],
    );
    assert.equal(await main.locator('details[data-event-details]').count(), 0);
    assert.equal(await main.locator('[data-gallery-item]').count(), 0);

    assert.equal(await covers.count(), 5);
    for (const cover of await covers.all()) {
      await cover.scrollIntoViewIfNeeded();
      await page.waitForFunction(
        (image) => image.complete && image.naturalWidth > 0,
        await cover.elementHandle(),
        { timeout: 2000 },
      );
    }
    assert.ok(
      await covers.evaluateAll((images) => images.every((image) =>
        image.src.startsWith('file:') && image.complete && image.naturalWidth > 0,
      )),
    );
    const articleLinks = main.locator('[data-event-title] a[data-internal-link]');
    assert.equal(await articleLinks.count(), 5);
    const articleTargets = await articleLinks.evaluateAll((links) => links.map((link) => link.href));
    assert.ok(articleTargets.every((href) => href.startsWith('file:') && href.includes('/articole/')));
    assert.equal(new Set(articleTargets).size, 5);

    const eventActions = main.locator('a[data-event-link]');
    assert.equal(await eventActions.count(), 5);
    assert.deepEqual(
      await eventActions.allTextContents(),
      Array(5).fill('Deschide evenimentul'),
    );
    assert.deepEqual(
      await eventActions.evaluateAll((links) => links.map((link) => link.href)),
      articleTargets,
    );

    const articlePage = await context.newPage();
    let galleryItemCount = 0;
    for (const articleTarget of articleTargets) {
      await articlePage.goto(articleTarget, { waitUntil: 'load' });
      assert.equal(await articlePage.locator('main .post > .source-content').count(), 1);
      galleryItemCount += await articlePage.locator('main [data-gallery-item]').count();
    }
    assert.equal(galleryItemCount, 151);
    await articlePage.close();

    const mainHeight = await main.evaluate((element) => element.getBoundingClientRect().height);
    assert.ok(mainHeight < (width === 1440 ? 2500 : 3500), `Archive is still ${mainHeight}px tall`);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 1);
    assert.deepEqual(networkRequests, []);
    await context.close();
  }
});

test('Legislație presents all local documents in a responsive format-labelled library', async () => {
  const expectedLabels = [
    'Statut',
    'Legea dialogului social',
    'Legea educației naționale',
    'Codul muncii republicat',
    'Noul cod civil',
    'Model adeziune',
  ];
  const expectedFormats = ['PDF', 'PDF', 'PDF', 'PDF', 'PDF', 'DOCX'];
  const expectedFiles = [
    'statut.pdf',
    'LegeaDialoguluiSocial0322.pdf',
    'Legea-Educatiei-Nationale.pdf',
    'Codul-Muncii-republicat.pdf',
    'Noul-Cod-civil.pdf',
    'Adeziune-SUOC-cu-consimtamant-RGPD.docx',
  ];

  for (const width of [390, 1440]) {
    const { context, networkRequests, page } = await openLocalPage('legislatie.html', width);
    const main = page.locator('main');
    const library = main.locator('[data-legislation-library]');
    const entries = library.locator('[data-legislation-entry]');

    assert.equal(await main.locator('.content-page--legislation').count(), 1);
    assert.equal(await library.count(), 1);
    assert.equal(await entries.count(), 6);
    assert.equal(await library.locator('[data-document-card]').count(), 6);
    assert.deepEqual(
      await entries.locator('.legislation-entry__title').evaluateAll((titles) =>
        titles.map((title) => title.textContent.replace(/\s+/g, ' ').trim()),
      ),
      expectedLabels,
    );
    assert.deepEqual(
      await entries.evaluateAll((items) => items.map((item) => item.dataset.documentFormat)),
      expectedFormats,
    );
    assert.deepEqual(
      await entries.evaluateAll((items) => items.map((item) =>
        getComputedStyle(item, '::after').content.replaceAll('"', ''),
      )),
      expectedFormats,
    );
    const documentTargets = await entries.evaluateAll((items) => items.map((item) => item.href));
    assert.ok(
      documentTargets.every((href) =>
        href.startsWith('file:') && href.includes('/assets/documents/'),
      ),
    );
    assert.deepEqual(
      documentTargets.map((href) => decodeURIComponent(new URL(href).pathname.split('/').at(-1))),
      expectedFiles,
    );

    const startPage = await context.newPage();
    await startPage.goto(pathToFileURL(resolve(projectRoot, 'index.html')).href, {
      waitUntil: 'load',
    });
    const startCardHeight = await startPage.locator('[data-start-index] > a').first()
      .evaluate((card) => card.getBoundingClientRect().height);
    const legislationCardHeights = await entries.evaluateAll((cards) =>
      cards.map((card) => card.getBoundingClientRect().height));
    assert.ok(
      legislationCardHeights.every((height) => Math.abs(height - startCardHeight) <= 1),
      `Legislație cards ${legislationCardHeights.join(', ')} do not match Start ${startCardHeight}`,
    );
    await startPage.close();

    const firstRow = await entries.evaluateAll(([first, second]) => {
      const firstBox = first.getBoundingClientRect();
      const secondBox = second.getBoundingClientRect();
      return {
        firstBottom: firstBox.bottom,
        firstLeft: firstBox.left,
        firstRight: firstBox.right,
        firstTop: firstBox.top,
        secondLeft: secondBox.left,
        secondTop: secondBox.top,
      };
    });
    if (width === 1440) {
      assert.ok(Math.abs(firstRow.firstTop - firstRow.secondTop) <= 1);
      assert.ok(firstRow.secondLeft > firstRow.firstRight);
    } else {
      assert.ok(firstRow.secondTop >= firstRow.firstBottom);
      assert.ok(Math.abs(firstRow.firstLeft - firstRow.secondLeft) <= 1);
    }

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 1);
    assert.deepEqual(networkRequests, []);
    assert.match(page.url(), /^file:/);
    await context.close();
  }
});

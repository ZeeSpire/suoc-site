import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(projectRoot, 'content/manifest.json');

const expectedRouteIds = [
  'start',
  'oug-9-2017-personal-nedidactic',
  'oug-17-2017-asimilare-functii',
  'despre-noi',
  'obiective',
  'conducere',
  'afilieri',
  'legislatie',
  'contact',
  'evenimente',
  'noutati',
  'spectacol-craciun-2014',
  'sejur-profesori-2013',
  'masa-festiva-8-martie-2013',
  'serbare-craciun-copii-2013',
  'ziua-unirii-2013',
  'cotizatie-2012',
  'campanie-lavinia-2012',
];

const expectedNavigation = [
  'Start',
  'Despre noi',
  'Obiective',
  'Conducere',
  'Afilieri',
  'Evenimente',
  'Legislație',
  'Contact',
];

const expectedDisclosures = [
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

function assertLocalFiles(entries, collectionName) {
  for (const entry of entries) {
    assert.match(entry.localPath, /^assets\//, `${collectionName} path must be local`);
    const absolutePath = resolve(projectRoot, entry.localPath);
    assert.ok(existsSync(absolutePath), `Missing ${collectionName} file: ${entry.localPath}`);
    assert.ok(statSync(absolutePath).size > 0, `Empty ${collectionName} file: ${entry.localPath}`);
  }
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(resolve(projectRoot, file))).digest('hex');
}

test('the frozen SUOC archive is complete, local, and excludes the admin route', () => {
  assert.ok(existsSync(manifestPath), 'content/manifest.json must exist');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  assert.deepEqual(manifest.routes.map((route) => route.id), expectedRouteIds);
  assert.equal(manifest.routes.filter((route) => route.type === 'page').length, 7);
  assert.equal(manifest.routes.filter((route) => route.type === 'derived').length, 2);
  assert.equal(manifest.routes.filter((route) => route.type === 'archive').length, 2);
  assert.equal(manifest.routes.filter((route) => route.type === 'post').length, 7);
  assert.ok(manifest.routes.every((route) => !/admin|author/i.test(`${route.id} ${route.file}`)));

  assert.deepEqual(manifest.navigation.map((item) => item.label), expectedNavigation);
  assert.deepEqual(manifest.disclosures, expectedDisclosures);
  assert.equal(manifest.posts.length, 7);
  assert.ok(manifest.posts.every((post) => post.title && post.date && post.category));

  assert.equal(manifest.media.full.length, 159);
  assert.equal(manifest.media.thumbnails.length, 158);
  assert.equal(manifest.documents.length, 28);
  assert.equal(manifest.externalLinks.length, 160);
  assert.equal(new Set(manifest.externalLinks).size, 160);

  assert.equal(
    manifest.footer,
    'Created and maintained by <a href="https://zeespire.com" target="_blank" rel="noopener noreferrer">ZeeSpire Software Solutions</a>.',
  );
  assert.deepEqual(manifest.identity, {
    universityLogo: {
      sourceUrl: 'https://www.univ-ovidius.ro/wp-content/uploads/2025/12/Logo-White-png.webp',
      localPath: 'assets/images/brand/uoc-logo.webp',
    },
    bannerArtwork: {
      localPath: 'assets/images/brand/suoc-identity-banner.png',
    },
  });
  assertLocalFiles([manifest.identity.universityLogo], 'university logo');
  assertLocalFiles([manifest.identity.bannerArtwork], 'banner artwork');
  assert.equal(
    sha256(manifest.identity.universityLogo.localPath),
    'c1abad88f358cf80ac3762659ba345cbf1c10f2ae809549c88860445cb9d537a',
    'The official UOC emblem must remain byte-for-byte unchanged',
  );
  assert.deepEqual(manifest.contact, {
    address: 'str. Ion Vodă nr. 58, sala P03',
    email: 'suoc@sindicat.univ-ovidius.ro',
  });

  assertLocalFiles(manifest.media.full, 'full image');
  assertLocalFiles(manifest.media.thumbnails, 'thumbnail');
  assertLocalFiles(manifest.documents, 'document');
  assertLocalFiles([manifest.brand], 'brand');
});

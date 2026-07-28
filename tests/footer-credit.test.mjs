import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const credit = 'Created and maintained by <a href="https://zeespire.com" target="_blank" rel="noopener noreferrer">ZeeSpire Software Solutions</a>.';

test('SUOC generator sources and all routes use the canonical ZeeSpire credit', async () => {
  const manifest = JSON.parse(await readFile(resolve(projectRoot, 'content/manifest.json'), 'utf8'));
  assert.equal(manifest.footer, credit);
  assert.equal(manifest.routes.length, 18);

  const captureScript = await readFile(resolve(projectRoot, 'scripts/capture-site.mjs'), 'utf8');
  const buildScript = await readFile(resolve(projectRoot, 'scripts/build-site.mjs'), 'utf8');
  assert.ok(captureScript.includes(`footer: '${credit}'`));
  assert.ok(buildScript.includes('<p>${manifest.footer}</p>'));

  for (const route of manifest.routes) {
    const html = await readFile(resolve(projectRoot, route.file), 'utf8');
    assert.ok(html.includes(credit), `${route.file} is missing the canonical credit`);
    assert.doesNotMatch(html, /Site creat si administrat de Gabriel Voicu/i);
  }
});

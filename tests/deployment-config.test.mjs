import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const projectRoot = new URL('../', import.meta.url);

test('GitHub Pages deploys the static root for the SUOC custom domain', async () => {
  const [workflow, customDomain, gitignore] = await Promise.all([
    readFile(new URL('.github/workflows/pages.yml', projectRoot), 'utf8'),
    readFile(new URL('CNAME', projectRoot), 'utf8'),
    readFile(new URL('.gitignore', projectRoot), 'utf8'),
  ]);

  assert.match(workflow, /push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /contents:\s*read/);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /group:\s*["']?pages["']?/);
  assert.match(workflow, /cancel-in-progress:\s*false/);
  assert.match(workflow, /actions\/checkout@v4/);
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /path:\s*["']?\.["']?/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
  assert.equal(customDomain, 'sindicat.univ-ovidius.ro\n');
  assert.match(gitignore, /^\.DS_Store$/m);
});

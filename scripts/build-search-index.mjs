// Regenerates assets/js/search-index.js from the committed HTML pages.
// Each page contributes its first <h1> as the title and the text inside <main>.
// Fails loudly when a page lacks <main> or <h1>, so search never ships incomplete.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pageDirectories = ['.', 'articole', 'informatii'];
// Listing pages only repeat article summaries; indexing them duplicates results.
const excludedPages = new Set(['noutati.html', 'evenimente.html']);

const namedEntities = {
  amp: '&', apos: "'", gt: '>', hellip: '…', laquo: '«', ldquo: '“',
  lsquo: '‘', lt: '<', mdash: '—', nbsp: ' ', ndash: '–', quot: '"',
  raquo: '»', rdquo: '”', rsquo: '’', bdquo: '„',
};

function decodeEntities(value) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code) => {
    if (code[0] !== '#') return namedEntities[code.toLowerCase()] ?? entity;
    const hex = code[1]?.toLowerCase() === 'x';
    return String.fromCodePoint(Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10));
  });
}

function stripTags(html) {
  const withoutCode = html.replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, ' ');
  return decodeEntities(withoutCode.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

const entries = [];
const problems = [];

for (const directory of pageDirectories) {
  const names = (await readdir(join(projectRoot, directory))).filter((name) => name.endsWith('.html')).sort();
  for (const name of names) {
    const file = relative(projectRoot, join(projectRoot, directory, name));
    if (excludedPages.has(file)) continue;
    const html = await readFile(join(projectRoot, file), 'utf8');
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
    if (!main) { problems.push(`${file}: missing <main>`); continue; }
    const title = stripTags(main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
    if (!title) { problems.push(`${file}: missing <h1> inside <main>`); continue; }
    entries.push({ file, title, text: stripTags(main) });
  }
}

if (problems.length) {
  console.error(`Search index not written:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

await writeFile(
  join(projectRoot, 'assets/js/search-index.js'),
  `window.SUOC_SEARCH_INDEX = ${JSON.stringify(entries)};\n`,
);
console.log(`Search index written: ${entries.length} pages.`);

// Fetches how Wiktionary splits each course word into syllables ("kis‧sa"),
// for the younger readers' syllable display (src/content/syllables.ts). The
// split is Wiktionary's own — its Finnish pronunciation module — expanded
// through the MediaWiki API; the app never splits a word itself, and a word
// with no split from here is simply never split.
//
// Polite: one request every few seconds, backing off when asked to. Re-runs
// fetch only the words still missing.
//
//   node scripts/fetch-hyphenation.mjs <words.json>
//
// <words.json> is a JSON array of Finnish words. Writes
// data/wiktionary/hyphenation.json: { _source, _license, words: { word: ["kis", "sa"] } }.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'data', 'wiktionary', 'hyphenation.json');
const UA = 'KielipesaFinnishKidsGame/1.0 (https://github.com/desskit/Finnish-Kids-Game)';
const GAP_MS = 4000;

const listPath = process.argv[2];
if (!listPath) {
  console.error('usage: node scripts/fetch-hyphenation.mjs <words.json>');
  process.exit(1);
}
const words = JSON.parse(readFileSync(listPath, 'utf8'));
const out = existsSync(OUT)
  ? JSON.parse(readFileSync(OUT, 'utf8'))
  : {
      _source:
        "Syllable splits from Wiktionary (en.wiktionary.org): the 'Hyphenation' its {{fi-pronunciation}} template gives each word, via the MediaWiki API (scripts/fetch-hyphenation.mjs).",
      _license: 'CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)',
      words: {},
      none: [],
    };
out.none ??= [];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const save = () => writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');

/** The split from the expanded template, or null. */
export function splitFrom(wikitext, word) {
  const line = wikitext.split('\n').find((l) => /Hyphenation/i.test(l));
  if (!line) return null;
  const text = line
    .replace(/<[^>]+>/g, '')
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')
    .replace(/\[\[([^\]]*)\]\]/g, '$1');
  // The split: the first run of letters joined by ‧ (or -) that spells the word.
  for (const m of text.matchAll(/[\p{L}]+(?:[‧·-][\p{L}]+)*/gu)) {
    const parts = m[0].split(/[‧·-]/);
    if (parts.join('').toLowerCase() === word.toLowerCase()) return parts;
  }
  return null;
}

async function fetchOne(word) {
  const url =
    'https://en.wiktionary.org/w/api.php?action=expandtemplates&format=json&prop=wikitext' +
    `&title=${encodeURIComponent(word)}&text=${encodeURIComponent('{{fi-pronunciation}}')}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
    if (res.status === 429 || res.status >= 500) {
      const back = 60_000 * (attempt + 1);
      console.log(`  ${res.status} for ${word}: waiting ${back / 1000}s`);
      await wait(back);
      continue;
    }
    const body = await res.text();
    if (!body.startsWith('{')) {
      console.log(`  not JSON for ${word}: waiting 60s`);
      await wait(60_000);
      continue;
    }
    return JSON.parse(body).expandtemplates?.wikitext ?? '';
  }
  throw new Error(`gave up on ${word}`);
}

const todo = words.filter((w) => !out.words[w] && !out.none.includes(w));
console.log(`${todo.length} of ${words.length} words to fetch`);
for (const [i, word] of todo.entries()) {
  const wikitext = await fetchOne(word);
  const parts = splitFrom(wikitext, word);
  if (parts) out.words[word] = parts;
  else out.none.push(word);
  console.log(`[${i + 1}/${todo.length}] ${word}: ${parts ? parts.join('‧') : '—'}`);
  save();
  await wait(GAP_MS);
}
console.log(`done: ${Object.keys(out.words).length} split, ${out.none.length} without a split`);

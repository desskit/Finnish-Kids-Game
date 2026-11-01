// Checks every WORD of the app's hand-authored Finnish — stories, scenes,
// lessons, titles, buttons: the same entries docs/FINNISH_REVIEW.md lists —
// against the Wiktionary data the app is built from (data/finnish-inflection-
// drill + data/wiktionary). A word that isn't a form there is printed, so a
// typo or a made-up form is caught before a child ever reads it.
//
// The vendored data has nouns, verbs and numerals; small words (minä, missä,
// ja, tänään…), names and titles are looked up on kaikki.org (Wiktionary's
// machine-readable copy) with --online, which needs an internet connection.
// A word found in neither is a real finding: fix it, or ask the Finnish
// speaker. It never checks grammar between words — that is the review sheet's
// job — only that each word exists.
//
// Run: npm run check:words            (offline: vendored data only)
//      npm run check:words -- --online (also asks kaikki.org about the rest)
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { reviewEntries } from '../src/game/reviewEntries';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const online = process.argv.includes('--online');

// --- every form the vendored data has ---------------------------------------
const forms = new Set<string>();
const addForms = (value: unknown) => {
  if (typeof value === 'string') for (const f of value.toLowerCase().split(/[\s/]+/)) f && forms.add(f);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) addForms(v);
};
const read = (path: string) =>
  JSON.parse(path.endsWith('.gz') ? gunzipSync(readFileSync(path)).toString('utf-8') : readFileSync(path, 'utf-8'));
for (const file of ['nouns.json', 'verbs.json', 'possessives.json', 'numerals.json']) {
  for (const dir of ['data/finnish-inflection-drill', 'data/wiktionary']) {
    let data;
    try {
      data = read(join(root, dir, dir.endsWith('wiktionary') ? `${file}.gz` : file));
    } catch {
      continue; // the supplement has no numerals file
    }
    for (const w of data.words ?? []) {
      addForms(w.word);
      addForms(w.inflections);
    }
  }
}

// --- the words of the authored Finnish ---------------------------------------
const LETTERS = 'A-Za-zÅÄÖåäöŠšŽž';
const WORD = new RegExp(`-?[${LETTERS}]+(?:-[${LETTERS}]+)*-?`, 'g');
/** Review-sheet markup and English that sit inside some "fi" texts. */
const NOT_FINNISH = /⟨[^⟩]*⟩|\{[^}]*\}|— marked wrong:|e\.g\.|\bKPT\b|"(?:a|the)"|…[a-zåäö]+/g;
const harmonyOk = (base: string, clitic: string) =>
  /[äöy]/.test(clitic) ? !/[aou]/.test(base) : /[aou]/.test(base);
const CLITICS = ['kaan', 'kään', 'kin', 'han', 'hän', 'ko', 'kö', 'pa', 'pä'];

/** A form the data has — or one with a question / "too" clitic, in vowel harmony. */
function known(word: string): boolean {
  if (forms.has(word)) return true;
  for (const c of CLITICS) {
    const base = word.slice(0, -c.length);
    if (word.endsWith(c) && base.length > 1 && forms.has(base) && (c === 'kin' || harmonyOk(base, c))) return true;
  }
  return false;
}

/**
 * Two words the data has, stuck together (metsä + retki): Finnish makes new
 * words this way all the time, and a dictionary can't list them all. Each part
 * at least three letters, so short endings can't pass for a word.
 */
function compound(word: string): boolean {
  for (let i = 3; i <= word.length - 3; i++) {
    if (forms.has(word.slice(0, i)) && known(word.slice(i))) return true;
  }
  return false;
}

const where = new Map<string, string[]>();
for (const e of reviewEntries()) {
  for (const m of e.fi.replace(NOT_FINNISH, ' ').matchAll(WORD)) {
    const raw = m[0];
    if (raw.startsWith('-') || raw.endsWith('-') || raw.length < 2) continue; // an ending like -ssa, or a letter
    if (/^([A-ZÅÄÖ])([a-zåäö])$/.test(raw) && raw[0].toLowerCase() === raw[1]) continue; // "Aa": a letter, shown twice
    const word = raw.toLowerCase();
    if (known(word) || known(word.replace(/-/g, ''))) continue; // kir-ja: a word split into syllables
    if (compound(word)) continue;
    where.set(word, [...(where.get(word) ?? []), e.key]);
  }
}

// --- what's left: ask Wiktionary, or report ----------------------------------
interface KaikkiEntry {
  pos?: string;
  senses?: { glosses?: string[]; form_of?: { word: string }[] }[];
  forms?: { form?: string }[];
}
const pages = new Map<string, KaikkiEntry[]>();
/** A word's Wiktionary page (as written, then capitalized, for names). */
async function page(word: string): Promise<KaikkiEntry[]> {
  if (!pages.has(word)) {
    let entries: KaikkiEntry[] = [];
    for (const w of [word, word[0].toUpperCase() + word.slice(1)]) {
      const q = encodeURIComponent;
      const res = await fetch(`https://kaikki.org/dictionary/Finnish/meaning/${q(w[0])}/${q(w.slice(0, 2))}/${q(w)}.jsonl`);
      if (!res.ok) continue;
      entries = (await res.text()).split('\n').filter(Boolean).map((l) => JSON.parse(l));
      if (entries.length) break;
    }
    pages.set(word, entries);
  }
  return pages.get(word)!;
}
const describe = (e: KaikkiEntry) => {
  const formOf = e.senses?.flatMap((s) => s.form_of ?? []).map((f) => f.word);
  return `${e.pos}${formOf?.length ? ` of ${formOf[0]}` : ''}: ${e.senses?.[0]?.glosses?.[0] ?? ''}`.slice(0, 80);
};

/**
 * On Wiktionary: the word's own page; else a form listed in the table of a
 * word it starts with (Eeron on Eero's page, kirjainten on kirjain's); else
 * with a clitic taken off (sinuun + kin); else two words stuck together.
 */
async function kaikki(word: string): Promise<string | null> {
  const own = (await page(word))[0];
  if (own) return describe(own);
  for (let i = word.length - 1; i >= 3; i--) {
    const stem = word.slice(0, i);
    if ((await page(stem)).some((e) => e.forms?.some((f) => f.form?.toLowerCase() === word))) return `a form of ${stem}`;
  }
  for (const c of CLITICS) {
    const base = word.slice(0, -c.length);
    if (word.endsWith(c) && base.length > 2 && (c === 'kin' || harmonyOk(base, c)) && (forms.has(base) || (await page(base)).length)) {
      return `${base} + -${c}`;
    }
  }
  for (let i = 3; i <= word.length - 3; i++) {
    const [a, b] = [word.slice(0, i), word.slice(i)];
    if ((forms.has(a) || (await page(a)).length) && known(b)) return `${a} + ${b}`;
  }
  return null;
}

const left = [...where.keys()].sort();
let unknown = 0;
for (const word of left) {
  const found = online ? await kaikki(word) : null;
  if (!found) unknown++;
  if (online && found) continue;
  console.log(`${online ? 'NOT IN WIKTIONARY' : 'not in the data'}: ${word}  (${where.get(word)!.slice(0, 3).join(', ')})`);
}
console.log(
  online
    ? `${left.length - unknown} more words found on Wiktionary; ${unknown} not found anywhere.`
    : `${left.length} words aren't in the vendored data (mostly small words, names and titles) — run with --online to look them up.`,
);
if (online && unknown > 0) process.exitCode = 1;

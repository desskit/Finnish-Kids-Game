// Fetches Finnish words from Wiktionary (via kaikki.org's machine-readable
// extract) into a supplement for the vendored Finnish-Inflection-Drill data,
// so the curated word lists in build-kids-data.mjs can use words the vendored
// snapshot doesn't have (like "sorsa").
//
// It is a faithful port of Finnish-Inflection-Drill's own pipeline
// (scripts/extract.py and scripts/extract_possessives.py, upstream commit
// 2b62dfa): the same filters, the same tag → key mapping, the same KOTUS type
// and group lookup (data/finnish-inflection-drill/config/), the same output
// shape. Nothing is generated: every form is copied from Wiktionary.
//
// What it keeps: every noun, adjective and verb lemma that one of its forms
// ranks within the top --cutoff words of a Finnish frequency list (upstream
// used 30,000; the default here casts a wider net), plus every lemma in the
// keep list (data/wiktionary/keep.txt), however rare. Lemmas the vendored
// snapshot already has are left out, so it stays the source of truth for them.
//
// Run it where kaikki.org can be reached (a normal home connection):
//
//   node scripts/fetch-wiktionary.mjs                 # download (once) and extract
//   node scripts/fetch-wiktionary.mjs --cutoff 60000  # a narrower net
//   node scripts/fetch-wiktionary.mjs --kaikki path/to/kaikki.org-dictionary-Finnish.jsonl
//   (also --freq <file|url>, --keep <file>, --out <dir>)
//
// Downloads go to data/wiktionary/.cache/ (about 1–2 GB; not committed). The
// result is data/wiktionary/{nouns,verbs,possessives}.json.gz plus report.md:
// commit those, then run `node scripts/build-kids-data.mjs data/finnish-inflection-drill`.
// Needs Node 18 or newer; no packages.

import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { createGunzip, gzipSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FID = join(ROOT, 'data', 'finnish-inflection-drill');

const SOURCES = {
  kaikki: 'https://kaikki.org/dictionary/Finnish/kaikki.org-dictionary-Finnish.jsonl',
  // the OpenSubtitles-based list upstream uses: one "word count" per line, most common first
  freq: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/fi/fi_full.txt',
};

// --- Command line ------------------------------------------------------------

function option(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const CUTOFF = Number(option('cutoff', '100000'));
const OUT = resolve(option('out', join(ROOT, 'data', 'wiktionary')));
const CACHE = join(ROOT, 'data', 'wiktionary', '.cache');
const KEEP_FILE = option('keep', join(ROOT, 'data', 'wiktionary', 'keep.txt'));
const KAIKKI = option('kaikki', SOURCES.kaikki);
const FREQ = option('freq', SOURCES.freq);
if (!(CUTOFF > 0)) throw new Error('--cutoff must be a positive number');

// --- Downloads -----------------------------------------------------------------

const isUrl = (s) => /^https?:\/\//.test(s);

/** A local copy of `src` (a URL is downloaded into the cache once). */
async function local(src, name) {
  if (!isUrl(src)) {
    if (!existsSync(src)) throw new Error(`No such file: ${src}`);
    return src;
  }
  mkdirSync(CACHE, { recursive: true });
  const dest = join(CACHE, name);
  if (existsSync(dest)) {
    console.log(`[cache] ${name} (${(statSync(dest).size / 1e6).toFixed(1)} MB)`);
    return dest;
  }
  console.log(`[get]   ${src}`);
  const res = await fetch(src);
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status} ${res.statusText}): ${src}`);
  const total = Number(res.headers.get('content-length')) || 0;
  let got = 0;
  let shown = 0;
  const body = Readable.fromWeb(res.body);
  body.on('data', (chunk) => {
    got += chunk.length;
    if (got - shown > 8e6 || got === total) {
      shown = got;
      process.stdout.write(`\r        ${(got / 1e6).toFixed(0)}${total ? ` / ${(total / 1e6).toFixed(0)}` : ''} MB`);
    }
  });
  // download to a temporary name so a broken download is never mistaken for a finished one
  await pipeline(body, createWriteStream(`${dest}.part`));
  process.stdout.write('\n');
  renameSync(`${dest}.part`, dest);
  return dest;
}

/** Each line of a text file (plain, or gzip if it ends in .gz), streamed. */
function lines(path) {
  let stream = createReadStream(path);
  if (path.endsWith('.gz')) stream = stream.pipe(createGunzip());
  return createInterface({ input: stream, crlfDelay: Infinity });
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

// --- The upstream rules (scripts/extract.py) ----------------------------------

// Lemma shape: lowercase Finnish letters plus hyphen and apostrophe, or a
// single-capital hyphenated compound like "T-paita".
const LEMMA_OK = /^(?:[a-zåäöšž'-]+|[A-ZÅÄÖ]-[a-zåäöšž-]+)$/;
// Dictionary metadata rather than words: letter names, misspellings, music notes.
const LETTER_NAME_GLOSS = /name of the .{0,40}letter|letter (?:of|in) (?:the )?.{0,40}(?:script|alphabet)/i;
const MISSPELLING_GLOSS = /^\s*(?:misspelling of|alternative letter-case form of)/i;
const MUSIC_NOTE_GLOSS = /^\s*[A-G][ -]?(?:flat|sharp)?\s*(?:\(note\))?\s*$/;

function isJunk(word, glosses) {
  if (word.length <= 1 || !LEMMA_OK.test(word)) return true;
  const first = glosses[0] ?? '';
  if (MISSPELLING_GLOSS.test(first) || MUSIC_NOTE_GLOSS.test(first)) return true;
  return glosses.some((g) => LETTER_NAME_GLOSS.test(g));
}

const CASE_TAGS = new Set(['nominative', 'genitive', 'partitive', 'inessive', 'elative', 'illative', 'adessive', 'ablative', 'allative', 'essive', 'translative', 'abessive', 'instructive', 'comitative', 'accusative']);
const NUMBER_TAGS = new Set(['singular', 'plural']);
const PERSON_TAGS = [
  ['first-person', 'singular', '1sg'],
  ['second-person', 'singular', '2sg'],
  ['third-person', 'singular', '3sg'],
  ['first-person', 'plural', '1pl'],
  ['second-person', 'plural', '2pl'],
  ['third-person', 'plural', '3pl'],
];
// only the long first infinitive is on (nearly) every verb
const INFINITIVE_TAGS = { 'infinitive-i-long': 'inf1_long' };

const tagSet = (form) => new Set(form.tags ?? []);
const only = (tags, set) => [...tags].filter((t) => set.has(t));

function nounFormKey(tags) {
  const cases = only(tags, CASE_TAGS);
  const nums = only(tags, NUMBER_TAGS);
  if (cases.length !== 1 || nums.length !== 1) return null;
  return `${cases[0]}_${nums[0]}`;
}

function verbFormKey(tags) {
  for (const [t, key] of Object.entries(INFINITIVE_TAGS)) {
    if (tags.has(t)) return `${key}_${tags.has('passive') ? 'passive' : 'active'}`;
  }
  if (tags.has('participle')) {
    return `participle_${tags.has('past') ? 'past' : 'present'}_${tags.has('passive') ? 'passive' : 'active'}`;
  }
  // mood before plain tense: a conditional form carries "present" too
  let tense;
  if (tags.has('conditional')) tense = tags.has('perfect') ? 'conditional_perfect' : 'conditional';
  else if (tags.has('imperative')) tense = tags.has('perfect') ? 'imperative_perfect' : 'imperative';
  else if (tags.has('potential')) tense = tags.has('perfect') ? 'potential_perfect' : 'potential';
  else if (tags.has('pluperfect')) tense = 'pluperfect';
  else if (tags.has('perfect')) tense = 'perfect';
  else if (tags.has('past')) tense = 'past';
  else if (tags.has('present')) tense = 'present';
  else return null;
  const voice = tags.has('passive') ? 'passive' : 'active';
  const polarity = tags.has('negative') ? 'negative' : 'positive';
  let person = '';
  for (const [p1, p2, key] of PERSON_TAGS) {
    if (tags.has(p1) && tags.has(p2)) {
      person = `_${key}`;
      break;
    }
  }
  // an active imperative needs a person; the passive one is impersonal
  if (tense.startsWith('imperative') && voice === 'active' && !person) return null;
  return `${tense}_${voice}_${polarity}${person}`;
}

function kotusType(entry, templates) {
  for (const key of ['head_templates', 'inflection_templates']) {
    for (const t of entry[key] ?? []) if (t.name && t.name in templates) return templates[t.name];
  }
  return null;
}

function translations(entry) {
  const out = [];
  for (const sense of entry.senses ?? []) for (const g of sense.glosses ?? []) if (typeof g === 'string') out.push(g);
  return out.slice(0, 5);
}

function audio(entry) {
  for (const s of entry.sounds ?? []) {
    const url = s.ogg_url || s.mp3_url || s.audio;
    if (url) return url;
  }
  return null;
}

function examples(entry) {
  const out = [];
  for (const sense of entry.senses ?? []) {
    for (const ex of sense.examples ?? []) {
      if (!ex.text) continue;
      out.push({ fi: ex.text, en: ex.english || ex.translation || '' });
      if (out.length >= 3) return out;
    }
  }
  return out;
}

/** The forms that aren't real forms ("-" for a slot that doesn't exist). */
const realForm = (s) => s && s !== '-' && s !== '—';

function shapeNoun(entry, ktype, group) {
  // a slot's first form is the bare one, except the comitative (it always
  // takes a possessive): there prefer the 3rd-person form, the citation form
  const candidates = new Map();
  for (const f of entry.forms ?? []) {
    if (!realForm(f.form)) continue;
    const key = nounFormKey(tagSet(f));
    if (!key) continue;
    if (!candidates.has(key)) candidates.set(key, []);
    candidates.get(key).push(f.form);
  }
  const inflections = {};
  for (const [key, forms] of candidates) {
    if (key === 'comitative_plural') {
      const third = forms.find((s) => !['ni', 'si', 'mme', 'nne'].some((e) => s.endsWith(e)));
      inflections[key] = third ?? forms[0];
    } else inflections[key] = forms[0];
  }
  return { word: entry.word, translations: translations(entry), kotus_type: ktype, group, inflections, audio: audio(entry), examples: examples(entry) };
}

function shapeVerb(entry, ktype, group) {
  const inflections = {};
  for (const f of entry.forms ?? []) {
    if (!realForm(f.form)) continue;
    const key = verbFormKey(tagSet(f));
    if (key && !(key in inflections)) inflections[key] = f.form;
  }
  return { word: entry.word, translations: translations(entry), kotus_type: ktype, group, inflections, audio: audio(entry), examples: examples(entry) };
}

// --- The upstream possessive rules (scripts/extract_possessives.py) ------------

const META_TAGS = new Set(['table-tags', 'inflection-template', 'class']);

/** A noun's forms split into tables at the metadata markers: [bare, ...possessive tables]. */
function splitIntoTables(forms) {
  const tables = [];
  let current = {};
  for (const f of forms) {
    const tags = tagSet(f);
    if ([...tags].some((t) => META_TAGS.has(t))) {
      if (Object.keys(current).length) tables.push(current);
      current = {};
      continue;
    }
    if (!realForm(f.form)) continue;
    const cases = only(tags, CASE_TAGS);
    const nums = only(tags, NUMBER_TAGS);
    if (cases.length === 1 && nums.length === 1) {
      const key = `${cases[0]}_${nums[0]}`;
      if (!(key in current)) current[key] = f.form;
    }
  }
  if (Object.keys(current).length) tables.push(current);
  return tables;
}

/** Whose a possessive table is, from its nominative's suffix. */
function detectPerson(table) {
  const nom = table.nominative_singular || table.nominative_plural || '';
  if (nom.endsWith('mme')) return '1pl';
  if (nom.endsWith('nne')) return '2pl';
  if (nom.endsWith('ni')) return '1sg';
  if (nom.endsWith('si')) return '2sg';
  return '3rd';
}

// --- Run -------------------------------------------------------------------------

async function main() {
  const keep = existsSync(KEEP_FILE)
    ? new Set(
        readFileSync(KEEP_FILE, 'utf8')
          .split(/\r?\n/)
          .map((l) => l.replace(/#.*/, '').trim())
          .filter(Boolean),
      )
    : new Set();
  console.log(`Cutoff: forms in the top ${CUTOFF.toLocaleString('en')} of the frequency list, plus ${keep.size} kept word(s).`);

  const kaikki = await local(KAIKKI, KAIKKI.endsWith('.gz') ? 'kaikki-finnish.jsonl.gz' : 'kaikki-finnish.jsonl');
  const freqFile = await local(FREQ, 'frequency-fi.txt');

  console.log('[1/4] frequency list…');
  const freq = new Map();
  let n = 0;
  for await (const line of lines(freqFile)) {
    n++;
    const word = line.trim().split(/\s+/)[0];
    if (word && !freq.has(word)) freq.set(word, n);
  }
  console.log(`      ${freq.size.toLocaleString('en')} ranked words`);

  const templates = readJson(join(FID, 'config', 'kotus_templates.json'));
  const groupOf = (file) => {
    const map = new Map();
    for (const g of readJson(join(FID, 'config', file)).groups) for (const t of g.kotus_types) map.set(t, g.id);
    return map;
  };
  const nounGroup = groupOf('noun_groups.json');
  const verbGroup = groupOf('verb_groups.json');

  // the lemmas the vendored snapshot already has stay as they are
  const have = (file) => new Set(readJson(join(FID, file)).words.map((w) => w.word));
  const haveNouns = have('nouns.json');
  const haveVerbs = have('verbs.json');

  console.log('[2/4] reading Wiktionary (kaikki.org extract)…');
  const nouns = [];
  const verbs = [];
  const counts = {};
  const bump = (k) => (counts[k] = (counts[k] ?? 0) + 1);
  const unknownTemplates = new Map();
  let read = 0;
  for await (const line of lines(kaikki)) {
    if (!line.trim()) continue;
    if (++read % 200000 === 0) process.stdout.write(`\r      ${read.toLocaleString('en')} entries`);
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const { pos, word } = entry;
    if (!word || !['noun', 'adj', 'verb'].includes(pos)) continue;
    bump(`seen_${pos}`);
    // only lemmas: inflected-form entries carry no inflection table
    if (!entry.inflection_templates?.length) {
      bump(`not_lemma_${pos}`);
      continue;
    }
    // the best rank of the lemma or any of its forms
    let rank = freq.get(word.toLowerCase()) ?? null;
    for (const f of entry.forms ?? []) {
      if (!f.form) continue;
      const r = freq.get(f.form.toLowerCase());
      if (r !== undefined && (rank === null || r < rank)) rank = r;
    }
    const kept = keep.has(word);
    if (!kept && freq.size && (rank === null || rank > CUTOFF)) continue;
    bump(`in_freq_${pos}`);
    if (isJunk(word, translations(entry))) {
      bump(`junk_${pos}`);
      continue;
    }
    const nounlike = pos !== 'verb';
    if ((nounlike ? haveNouns : haveVerbs).has(word)) {
      bump(`already_vendored_${pos}`);
      continue;
    }
    const ktype = kotusType(entry, nounlike ? templates.nouns : templates.verbs);
    if (ktype === null) {
      const t = [...(entry.inflection_templates ?? []), ...(entry.head_templates ?? [])].find((x) => /^fi-(decl|conj)-/.test(x.name ?? ''));
      if (t) unknownTemplates.set(t.name, (unknownTemplates.get(t.name) ?? 0) + 1);
    }
    const group = (nounlike ? nounGroup : verbGroup).get(ktype) ?? 'other';
    const shaped = nounlike ? shapeNoun(entry, ktype, group) : shapeVerb(entry, ktype, group);
    if (!Object.keys(shaped.inflections).length) {
      bump(`no_inflections_${pos}`);
      continue;
    }
    shaped.frequency_rank = rank;
    (nounlike ? nouns : verbs).push(shaped);
  }
  process.stdout.write('\n');

  // one entry per word: the one with the most forms; most common first
  const dedupe = (items) => {
    const best = new Map();
    for (const it of items) {
      const prev = best.get(it.word);
      if (!prev || Object.keys(it.inflections).length > Object.keys(prev.inflections).length) best.set(it.word, it);
    }
    return [...best.values()].sort((a, b) => (a.frequency_rank ?? 1e9) - (b.frequency_rank ?? 1e9));
  };
  const outNouns = dedupe(nouns);
  const outVerbs = dedupe(verbs);

  console.log('[3/4] possessive forms (a second pass)…');
  const meta = new Map(outNouns.map((w) => [w.word, w]));
  const wanted = new Set(meta.keys());
  const possessives = [];
  for await (const line of lines(kaikki)) {
    if (!wanted.size) break;
    if (!line.includes('"pos": "noun"') && !line.includes('"pos":"noun"')) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry.pos !== 'noun' || !entry.inflection_templates?.length || !wanted.has(entry.word)) continue;
    wanted.delete(entry.word);
    const inflections = {};
    for (const table of splitIntoTables(entry.forms ?? []).slice(1)) {
      if (!Object.keys(table).length) continue;
      const person = detectPerson(table);
      if (!(person in inflections)) inflections[person] = table;
    }
    if (!Object.keys(inflections).length) continue;
    const m = meta.get(entry.word);
    possessives.push({ word: entry.word, frequency_rank: m.frequency_rank, translations: m.translations, group: m.group, inflections });
  }
  possessives.sort((a, b) => (a.frequency_rank ?? 1e9) - (b.frequency_rank ?? 1e9));

  console.log('[4/4] writing data/wiktionary/…');
  const cases = readJson(join(FID, 'config', 'noun_cases.json'));
  const stamp = {
    _source:
      'Finnish word forms from Wiktionary (en.wiktionary.org) via the kaikki.org machine-readable extract, ' +
      'extracted with the rules of desskit/Finnish-Inflection-Drill (scripts/fetch-wiktionary.mjs).',
    _license: 'CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)',
    _generated: { date: new Date().toISOString().slice(0, 10), cutoff: CUTOFF, kept: [...keep] },
  };
  mkdirSync(OUT, { recursive: true });
  const write = (name, payload) => {
    const gz = gzipSync(JSON.stringify(payload), { level: 9 });
    writeFileSync(join(OUT, name), gz);
    return `${name} ${(gz.length / 1e6).toFixed(1)} MB`;
  };
  const sizes = [
    write('nouns.json.gz', { ...stamp, cases: cases.cases.map((c) => c.id), numbers: cases.numbers.map((x) => x.id), words: outNouns }),
    write('verbs.json.gz', { ...stamp, words: outVerbs }),
    write('possessives.json.gz', { ...stamp, possessors: ['1sg', '2sg', '3rd', '1pl', '2pl'], cases: cases.cases.map((c) => c.id), numbers: cases.numbers.map((x) => x.id), words: possessives }),
  ];

  // the report: what's new, and every kept word found or not
  const byWord = new Map([...outNouns, ...outVerbs].map((w) => [w.word, w]));
  const keptRows = [...keep].map((w) => {
    const e = byWord.get(w);
    if (e) {
      const forms = Object.values(e.inflections).slice(0, 4).join(', ');
      return `| ${w} | found | ${e.kotus_type ?? '?'} | ${e.translations[0] ?? ''} | ${forms} |`;
    }
    const vendored = haveNouns.has(w) || haveVerbs.has(w);
    return `| ${w} | ${vendored ? 'already in the vendored data' : '**not found**'} | | | |`;
  });
  const report = [
    '# Wiktionary supplement',
    '',
    `Generated ${stamp._generated.date} by \`node scripts/fetch-wiktionary.mjs\` (cutoff ${CUTOFF.toLocaleString('en')}).`,
    '',
    `- ${outNouns.length.toLocaleString('en')} nouns and adjectives, ${outVerbs.length.toLocaleString('en')} verbs, ${possessives.length.toLocaleString('en')} nouns with possessive forms`,
    `- only lemmas the vendored Finnish-Inflection-Drill snapshot doesn't already have`,
    `- files: ${sizes.join(', ')}`,
    '',
    '## Kept words',
    '',
    '| word | status | KOTUS type | first meaning | first forms |',
    '|---|---|---|---|---|',
    ...keptRows,
    '',
    '## Counts',
    '',
    ...Object.entries(counts).map(([k, v]) => `- ${k}: ${v.toLocaleString('en')}`),
    ...(unknownTemplates.size
      ? ['', '## Templates without a KOTUS type', '', ...[...unknownTemplates].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([t, c]) => `- ${t}: ${c}`)]
      : []),
    '',
  ].join('\n');
  writeFileSync(join(OUT, 'report.md'), report);

  console.log(`\n${sizes.join('\n')}`);
  console.log(`${outNouns.length} nouns/adjectives, ${outVerbs.length} verbs, ${possessives.length} with possessives (new lemmas only).`);
  for (const row of keptRows) console.log(row.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim());
  console.log('\nNext: commit data/wiktionary/ (not .cache), then run');
  console.log('  node scripts/build-kids-data.mjs data/finnish-inflection-drill');
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exit(1);
});

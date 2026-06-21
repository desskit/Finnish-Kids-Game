// Builds curated kids-game vocabulary data from the Finnish-Inflection-Drill
// dataset (Wiktionary via kaikki.org + Tatoeba examples, CC BY-SA 4.0).
//
// We DO NOT vendor the full 46 MB source. This script selects a small,
// kid-appropriate slice and copies the verified, human-generated inflection
// tables + tags into src/content/data/*.sourced.json. The app then looks up
// the correct case form by tag — it never generates or inflects Finnish.
//
// Usage:
//   node scripts/build-kids-data.mjs [path-to-FID/data]
// Source dir resolution: argv[2] -> $FID_DATA_DIR -> ../Finnish-Inflection-Drill/data
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR =
  process.argv[2] ||
  process.env.FID_DATA_DIR ||
  resolve(__dirname, '..', '..', 'Finnish-Inflection-Drill', 'data');
const OUT_DIR = resolve(__dirname, '..', 'src', 'content', 'data');
mkdirSync(OUT_DIR, { recursive: true });

const ATTRIBUTION =
  'Finnish word forms from Wiktionary (en.wiktionary.org) via the kaikki.org ' +
  'machine-readable extract; example sentences from Tatoeba (tatoeba.org). ' +
  'Curated for Finnish-Kids-Game from desskit/Finnish-Inflection-Drill.';
const LICENSE = 'CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)';

const load = (file) => JSON.parse(readFileSync(join(SRC_DIR, file), 'utf-8'));

// Curation: human-authored {id, fi, en, emoji}; everything else is sourced.
const ANIMALS = [
  ['cat', 'kissa', 'cat', '🐱'],
  ['dog', 'koira', 'dog', '🐶'],
  ['bear', 'karhu', 'bear', '🐻'],
  ['bunny', 'pupu', 'bunny', '🐰'],
  ['bird', 'lintu', 'bird', '🐦'],
  ['fish', 'kala', 'fish', '🐟'],
  ['horse', 'hevonen', 'horse', '🐴'],
  ['cow', 'lehmä', 'cow', '🐮'],
  ['pig', 'possu', 'pig', '🐷'],
  ['fox', 'kettu', 'fox', '🦊'],
  ['duck', 'ankka', 'duck', '🦆'],
  ['frog', 'sammakko', 'frog', '🐸'],
];

const NUMBERS = [
  ['one', 'yksi', 'one', '1️⃣'],
  ['two', 'kaksi', 'two', '2️⃣'],
  ['three', 'kolme', 'three', '3️⃣'],
  ['four', 'neljä', 'four', '4️⃣'],
  ['five', 'viisi', 'five', '5️⃣'],
  ['six', 'kuusi', 'six', '6️⃣'],
  ['seven', 'seitsemän', 'seven', '7️⃣'],
  ['eight', 'kahdeksan', 'eight', '8️⃣'],
  ['nine', 'yhdeksän', 'nine', '9️⃣'],
  ['ten', 'kymmenen', 'ten', '🔟'],
];

function pickExamples(src) {
  // Keep up to 2 short examples. NOTE: not yet reviewed for kid-appropriateness;
  // stored as data only and not surfaced in the kids UI yet.
  return (src || [])
    .filter((e) => e && e.fi && e.en && e.fi.length <= 45)
    .slice(0, 2)
    .map((e) => ({ fi: e.fi, en: e.en }));
}

function buildTheme({ id, fi, en, emoji, curation, sourceWords }) {
  const byWord = new Map(sourceWords.map((w) => [w.word, w]));
  const words = [];
  const missing = [];
  for (const [wid, finnish, english, emo] of curation) {
    const src = byWord.get(finnish);
    if (!src) {
      missing.push(finnish);
      continue;
    }
    const entry = {
      id: wid,
      word: finnish,
      en: english,
      emoji: emo,
      inflections: src.inflections,
    };
    if (typeof src.kotus_type === 'number') entry.kotusType = src.kotus_type;
    if (src.group) entry.group = src.group;
    if (typeof src.frequency_rank === 'number') entry.frequencyRank = src.frequency_rank;
    const ex = pickExamples(src.examples);
    if (ex.length) entry.examples = ex;
    words.push(entry);
  }
  if (missing.length) {
    console.warn(`  [${id}] missing from source (skipped): ${missing.join(', ')}`);
  }
  return {
    _source: ATTRIBUTION,
    _license: LICENSE,
    theme: { id, fi, en, emoji },
    words,
  };
}

const nounWords = load('nouns.json').words;
const numeralWords = load('numerals.json').words;

const animals = buildTheme({
  id: 'animals',
  fi: 'Eläimet',
  en: 'Animals',
  emoji: '🐾',
  curation: ANIMALS,
  sourceWords: nounWords,
});

const numbers = buildTheme({
  id: 'numbers',
  fi: 'Numerot',
  en: 'Numbers',
  emoji: '🔢',
  curation: NUMBERS,
  sourceWords: numeralWords,
});

writeFileSync(join(OUT_DIR, 'animals.sourced.json'), JSON.stringify(animals, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'numbers.sourced.json'), JSON.stringify(numbers, null, 2) + '\n');

console.log(
  `Wrote ${animals.words.length} animals and ${numbers.words.length} numbers to ${OUT_DIR}`,
);

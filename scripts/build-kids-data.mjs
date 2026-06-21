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

// Numbers carry a numeric `value` (5th field) used for counting scenes and the
// counting grammar rule (1 -> nominative singular, >1 -> partitive singular).
const NUMBERS = [
  ['one', 'yksi', 'one', '1️⃣', 1],
  ['two', 'kaksi', 'two', '2️⃣', 2],
  ['three', 'kolme', 'three', '3️⃣', 3],
  ['four', 'neljä', 'four', '4️⃣', 4],
  ['five', 'viisi', 'five', '5️⃣', 5],
  ['six', 'kuusi', 'six', '6️⃣', 6],
  ['seven', 'seitsemän', 'seven', '7️⃣', 7],
  ['eight', 'kahdeksan', 'eight', '8️⃣', 8],
  ['nine', 'yhdeksän', 'nine', '9️⃣', 9],
  ['ten', 'kymmenen', 'ten', '🔟', 10],
];

// Adjectives decline like nouns and AGREE with their noun in case + number, so
// they're sourced from nouns.json too. Colors get a color-square placeholder;
// quality/size adjectives have no single picture (emoji omitted).
const ADJECTIVES = [
  ['big', 'iso', 'big', ''],
  ['small', 'pieni', 'small', ''],
  ['fast', 'nopea', 'fast', ''],
  ['slow', 'hidas', 'slow', ''],
  ['old', 'vanha', 'old', ''],
  ['happy', 'iloinen', 'happy', ''],
  ['tired', 'väsynyt', 'tired', ''],
  ['hungry', 'nälkäinen', 'hungry', ''],
  ['cute', 'söpö', 'cute', ''],
  ['kind', 'kiltti', 'kind', ''],
  ['red', 'punainen', 'red', '🟥'],
  ['blue', 'sininen', 'blue', '🟦'],
  ['yellow', 'keltainen', 'yellow', '🟨'],
  ['green', 'vihreä', 'green', '🟩'],
  ['black', 'musta', 'black', '⬛'],
  ['white', 'valkoinen', 'white', '⬜'],
  ['brown', 'ruskea', 'brown', '🟫'],
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
  for (const [wid, finnish, english, emo, value] of curation) {
    const src = byWord.get(finnish);
    if (!src) {
      missing.push(finnish);
      continue;
    }
    const entry = {
      id: wid,
      word: finnish,
      en: english,
      emoji: emo || undefined,
      inflections: src.inflections,
    };
    if (typeof value === 'number') entry.value = value;
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

// Adjectives are sourced from nouns.json (adjectives decline identically).
const adjectives = buildTheme({
  id: 'adjectives',
  fi: 'Adjektiivit',
  en: 'Adjectives',
  emoji: '🎨',
  curation: ADJECTIVES,
  sourceWords: nounWords,
});

writeFileSync(join(OUT_DIR, 'animals.sourced.json'), JSON.stringify(animals, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'numbers.sourced.json'), JSON.stringify(numbers, null, 2) + '\n');
writeFileSync(
  join(OUT_DIR, 'adjectives.sourced.json'),
  JSON.stringify(adjectives, null, 2) + '\n',
);

console.log(
  `Wrote ${animals.words.length} animals, ${numbers.words.length} numbers, ` +
    `${adjectives.words.length} adjectives to ${OUT_DIR}`,
);

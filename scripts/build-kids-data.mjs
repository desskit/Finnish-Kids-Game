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
  ['pig', 'sika', 'pig', '🐷'],
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

const FOOD = [
  ['bread', 'leipä', 'bread', '🍞'],
  ['milk', 'maito', 'milk', '🥛'],
  ['water', 'vesi', 'water', '💧'],
  ['apple', 'omena', 'apple', '🍎'],
  ['banana', 'banaani', 'banana', '🍌'],
  ['cheese', 'juusto', 'cheese', '🧀'],
  ['cake', 'kakku', 'cake', '🍰'],
  ['cookie', 'keksi', 'cookie', '🍪'],
  ['juice', 'mehu', 'juice', '🧃'],
  ['ice-cream', 'jäätelö', 'ice cream', '🍦'],
  ['chocolate', 'suklaa', 'chocolate', '🍫'],
  ['potato', 'peruna', 'potato', '🥔'],
  ['strawberry', 'mansikka', 'strawberry', '🍓'],
  ['carrot', 'porkkana', 'carrot', '🥕'],
];

// Place nouns for the locative-case node ("where things are" — in/on/into/
// out-of/onto/off + plural). Sourced the same way as every other theme; no
// hand-typed Finnish.
const PLACES = [
  ['box', 'laatikko', 'box', '📦'],
  ['table', 'pöytä', 'table', '🍽️'],
  ['house', 'talo', 'house', '🏠'],
  ['room', 'huone', 'room', '🚪'],
  ['car', 'auto', 'car', '🚗'],
  ['bed', 'sänky', 'bed', '🛏️'],
  ['chair', 'tuoli', 'chair', '🪑'],
  ['school', 'koulu', 'school', '🏫'],
  ['tree', 'puu', 'tree', '🌳'],
  ['forest', 'metsä', 'forest', '🌲'],
  ['basket', 'kori', 'basket', '🧺'],
  ['bag', 'laukku', 'bag', '👜'],
];

// Locative SHAPE tags for places — which "where" cases each one makes sense in:
//   'surface'   → you can be ON / ONTO / OFF it   (adessive/allative/ablative)
//   'container' → you can be IN / INTO / OUT-OF it (inessive/illative/elative)
// Many are BOTH (a box, a bed, a car — a cat sits on top OR climbs inside).
// A flat table/chair is a surface only; a room/forest is a container only.
// The locative carrier phrases require the matching tag (see constructions.ts),
// so "the cat is on the room" can never be generated.
const PLACE_TAGS = {
  box: ['surface', 'container'],
  table: ['surface'],
  house: ['container'],
  room: ['container'],
  car: ['surface', 'container'],
  bed: ['surface', 'container'],
  chair: ['surface'],
  school: ['container'],
  tree: ['container'],
  forest: ['container'],
  basket: ['surface', 'container'],
  bag: ['container'],
};

const FAMILY = [
  ['mother', 'äiti', 'mom', '👩'],
  ['father', 'isä', 'dad', '👨'],
  ['brother', 'veli', 'brother', '🧑'],
  ['sister', 'sisko', 'sister', '👧'],
  ['baby', 'vauva', 'baby', '👶'],
  ['son', 'poika', 'son', '👦'],
  ['daughter', 'tyttö', 'daughter', '👧'],
  ['grandmother', 'isoäiti', 'grandmother', '👵'],
  ['grandfather', 'isoisä', 'grandfather', '👴'],
  ['family', 'perhe', 'family', '👪'],
];

// Body parts. All decline as ordinary singular nouns (full case paradigm), so
// they flow into the same build/order/spell/count exercises as the other noun
// themes. No plurale-tantum words (those lack the singular forms the carrier
// phrases need).
const BODY = [
  ['eye', 'silmä', 'eye', '👁️'],
  ['ear', 'korva', 'ear', '👂'],
  ['nose', 'nenä', 'nose', '👃'],
  ['mouth', 'suu', 'mouth', '👄'],
  ['hand', 'käsi', 'hand', '✋'],
  ['foot', 'jalka', 'foot', '🦶'],
  ['head', 'pää', 'head', '🙂'],
  ['tooth', 'hammas', 'tooth', '🦷'],
  ['hair', 'tukka', 'hair', '💇'],
  ['tummy', 'vatsa', 'tummy', '🤰'],
  ['finger', 'sormi', 'finger', '👆'],
  ['knee', 'polvi', 'knee', '🦵'],
];

// Nature words — sky, weather and landscape things a child can point at.
const NATURE = [
  ['sun', 'aurinko', 'sun', '☀️'],
  ['moon', 'kuu', 'moon', '🌙'],
  ['star', 'tähti', 'star', '⭐'],
  ['cloud', 'pilvi', 'cloud', '☁️'],
  ['rain', 'sade', 'rain', '🌧️'],
  ['snow', 'lumi', 'snow', '❄️'],
  ['flower', 'kukka', 'flower', '🌸'],
  // `puu` (tree) already lives in the Places theme; use a distinct nature word
  // so ids stay globally unique (enforced by the content-integrity test).
  ['mountain', 'vuori', 'mountain', '⛰️'],
  ['stone', 'kivi', 'stone', '🪨'],
  ['lake', 'järvi', 'lake', '🏞️'],
  ['sea', 'meri', 'sea', '🌊'],
  ['sky', 'taivas', 'sky', '🌌'],
];

// Clothes. NOTE: `housut` (pants) is deliberately excluded — it's a plurale
// tantum (no singular forms), so the singular carrier phrases can't fill it;
// `pusero` (blouse) stands in as a singular-declining garment.
const CLOTHES = [
  ['shirt', 'paita', 'shirt', '👕'],
  ['blouse', 'pusero', 'blouse', '👚'],
  ['coat', 'takki', 'coat', '🧥'],
  ['shoe', 'kenkä', 'shoe', '👟'],
  ['sock', 'sukka', 'sock', '🧦'],
  ['hat', 'hattu', 'hat', '👒'],
  ['dress', 'mekko', 'dress', '👗'],
  ['skirt', 'hame', 'skirt', '👗'],
  ['glove', 'käsine', 'glove', '🧤'],
  ['scarf', 'huivi', 'scarf', '🧣'],
  ['cap', 'lakki', 'cap', '🧢'],
  ['boot', 'saapas', 'boot', '🥾'],
];

// Kid-friendly verbs spanning all six KOTUS verb types. The 4th field is an
// action emoji: verbs that have one can appear as picture cards (the
// listen-verbs warm-up + Review); abstract verbs (olla, saada, muistaa…) stay
// emoji-less and are served only by the conjugation drill and sentences.
const VERBS = [
  ['be', 'olla', 'be'],
  ['eat', 'syödä', 'eat', '🍽️'],
  ['drink', 'juoda', 'drink', '🥤'],
  ['sleep', 'nukkua', 'sleep', '😴'],
  ['play', 'leikkiä', 'play', '🧸'],
  ['run', 'juosta', 'run', '🏃'],
  ['jump', 'hypätä', 'jump', '🦘'],
  ['go', 'mennä', 'go'],
  ['come', 'tulla', 'come'],
  ['see', 'nähdä', 'see', '👀'],
  ['give', 'antaa', 'give', '🎁'],
  ['take', 'ottaa', 'take'],
  ['look', 'katsoa', 'look', '📺'],
  ['sing', 'laulaa', 'sing', '🎤'],
  ['read', 'lukea', 'read', '📖'],
  ['swim', 'uida', 'swim', '🏊'],
  ['want', 'haluta', 'want'],
  ['love', 'rakastaa', 'love', '❤️'],
  ['help', 'auttaa', 'help', '🤝'],
  ['sit', 'istua', 'sit', '🪑'],
  ['stand', 'seisoa', 'stand', '🧍'],
  ['walk', 'kävellä', 'walk', '🚶'],
  ['dance', 'tanssia', 'dance', '💃'],
  ['draw', 'piirtää', 'draw', '✏️'],
  ['write', 'kirjoittaa', 'write', '✍️'],
  ['open', 'avata', 'open', '🔓'],
  ['close', 'sulkea', 'close', '🔒'],
  ['buy', 'ostaa', 'buy', '🛒'],
  ['hear', 'kuulla', 'hear'],
  ['listen', 'kuunnella', 'listen', '🎧'],
  ['speak', 'puhua', 'speak', '🗣️'],
  ['say', 'sanoa', 'say', '💬'],
  ['ask', 'kysyä', 'ask', '❓'],
  ['answer', 'vastata', 'answer', '🙋'],
  ['search', 'etsiä', 'search', '🔍'],
  ['find', 'löytää', 'find'],
  ['make', 'tehdä', 'make', '🔨'],
  ['get', 'saada', 'get'],
  ['bring', 'tuoda', 'bring'],
  ['carry', 'viedä', 'take away'],
  ['fly', 'lentää', 'fly', '✈️'],
  ['drive', 'ajaa', 'drive', '🚗'],
  ['wash', 'pestä', 'wash', '🧼'],
  ['clean', 'siivota', 'clean', '🧹'],
  ['cook', 'keittää', 'cook', '🍳'],
  ['paint', 'maalata', 'paint', '🎨'],
  ['smile', 'hymyillä', 'smile', '😊'],
  ['cry', 'itkeä', 'cry', '😢'],
  ['laugh', 'nauraa', 'laugh', '😂'],
  ['hug', 'halata', 'hug', '🤗'],
  ['throw', 'heittää', 'throw', '🥏'],
  ['climb', 'kiivetä', 'climb', '🧗'],
  ['remember', 'muistaa', 'remember'],
  ['forget', 'unohtaa', 'forget'],
  ['learn', 'oppia', 'learn', '🎓'],
  ['teach', 'opettaa', 'teach', '👩‍🏫'],
  ['wait', 'odottaa', 'wait', '⏳'],
  ['live', 'asua', 'live'],
  ['build', 'rakentaa', 'build', '🧱'],
  ['fix', 'korjata', 'fix', '🔧'],
  ['wake-up', 'herätä', 'wake up', '⏰'],
];

// Focused conjugation subset kept per verb: present and past, each in BOTH
// polarities, across all persons, plus the two singular/plural commands. The
// four tense×polarity sets are what the Conjugate node climbs one rung per
// level (present+ → present- → past+ → past-); every form is sourced here.
const VERB_PERSONS = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];
const VERB_INFLECTION_KEYS = [
  ...VERB_PERSONS.map((p) => `present_active_positive_${p}`),
  ...VERB_PERSONS.map((p) => `present_active_negative_${p}`),
  ...VERB_PERSONS.map((p) => `past_active_positive_${p}`),
  ...VERB_PERSONS.map((p) => `past_active_negative_${p}`),
  'imperative_active_positive_2sg',
  'imperative_active_positive_2pl',
];

function pickExamples(src) {
  // Keep up to 2 short examples. NOTE: not yet reviewed for kid-appropriateness;
  // stored as data only and not surfaced in the kids UI yet.
  return (src || [])
    .filter((e) => e && e.fi && e.en && e.fi.length <= 45)
    .slice(0, 2)
    .map((e) => ({ fi: e.fi, en: e.en }));
}

function buildTheme({ id, fi, en, emoji, curation, sourceWords, inflectionKeys, tagsById }) {
  const byWord = new Map(sourceWords.map((w) => [w.word, w]));
  const words = [];
  const missing = [];
  for (const [wid, finnish, english, emo, value] of curation) {
    const src = byWord.get(finnish);
    if (!src) {
      missing.push(finnish);
      continue;
    }
    // Optionally keep only a focused subset of the (large) paradigm.
    let inflections = src.inflections;
    if (inflectionKeys) {
      inflections = {};
      for (const k of inflectionKeys) {
        if (src.inflections[k]) inflections[k] = src.inflections[k];
      }
    }
    const entry = {
      id: wid,
      word: finnish,
      en: english,
      emoji: emo || undefined,
      inflections,
    };
    if (typeof value === 'number') entry.value = value;
    // Semantic tags (hand-curated, per word) — e.g. a place's locative shape.
    if (tagsById && tagsById[wid]) entry.tags = tagsById[wid];
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

const verbWords = load('verbs.json').words;
const verbs = buildTheme({
  id: 'verbs',
  fi: 'Verbit',
  en: 'Verbs',
  emoji: '🏃',
  curation: VERBS,
  sourceWords: verbWords,
  inflectionKeys: VERB_INFLECTION_KEYS,
});

const food = buildTheme({
  id: 'food',
  fi: 'Ruoka',
  en: 'Food',
  emoji: '🍎',
  curation: FOOD,
  sourceWords: nounWords,
});

const family = buildTheme({
  id: 'family',
  fi: 'Perhe',
  en: 'Family',
  emoji: '👪',
  curation: FAMILY,
  sourceWords: nounWords,
});

const places = buildTheme({
  id: 'places',
  fi: 'Paikat',
  en: 'Places',
  emoji: '📍',
  curation: PLACES,
  sourceWords: nounWords,
  tagsById: PLACE_TAGS,
});

const body = buildTheme({
  id: 'body',
  fi: 'Keho',
  en: 'Body',
  emoji: '🧍',
  curation: BODY,
  sourceWords: nounWords,
});

const nature = buildTheme({
  id: 'nature',
  fi: 'Luonto',
  en: 'Nature',
  emoji: '🌳',
  curation: NATURE,
  sourceWords: nounWords,
});

const clothes = buildTheme({
  id: 'clothes',
  fi: 'Vaatteet',
  en: 'Clothes',
  emoji: '👕',
  curation: CLOTHES,
  sourceWords: nounWords,
});

writeFileSync(join(OUT_DIR, 'animals.sourced.json'), JSON.stringify(animals, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'numbers.sourced.json'), JSON.stringify(numbers, null, 2) + '\n');
writeFileSync(
  join(OUT_DIR, 'adjectives.sourced.json'),
  JSON.stringify(adjectives, null, 2) + '\n',
);
writeFileSync(join(OUT_DIR, 'verbs.sourced.json'), JSON.stringify(verbs, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'food.sourced.json'), JSON.stringify(food, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'family.sourced.json'), JSON.stringify(family, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'places.sourced.json'), JSON.stringify(places, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'body.sourced.json'), JSON.stringify(body, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'nature.sourced.json'), JSON.stringify(nature, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'clothes.sourced.json'), JSON.stringify(clothes, null, 2) + '\n');

console.log(
  `Wrote ${animals.words.length} animals, ${numbers.words.length} numbers, ` +
    `${adjectives.words.length} adjectives, ${verbs.words.length} verbs, ` +
    `${food.words.length} food, ${family.words.length} family, ` +
    `${places.words.length} places, ${body.words.length} body, ` +
    `${nature.words.length} nature, ${clothes.words.length} clothes words to ${OUT_DIR}`,
);

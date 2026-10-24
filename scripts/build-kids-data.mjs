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
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { loadAgid, englishFormsFor } from './agid.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// English morphology (plurals / verb forms / comparatives) is SOURCED, not
// rule-generated — the English counterpart of the Finnish sourcing rule. Every
// word's forms are looked up from the vendored AGID database and attached to
// its item; a word we can't resolve fails the build (see ENGLISH_MISSING).
const AGID = loadAgid(resolve(__dirname, '..', 'data', 'english-agid', 'infl.txt'));
const ENGLISH_MISSING = [];
/** AGID part-of-speech for a theme (numbers carry no inflected English). */
// Lesson-only words are shown once, as-is, and never pluralised or put in an
// English template — so they need no English morphology.
const posForTheme = (id) =>
  id === 'verbs'
    ? 'V'
    : id === 'adjectives'
      ? 'A'
      : ['numbers', 'ordinals', 'lesson-words', 'feeling-verbs', 'math'].includes(id)
        ? null
        : 'N';
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

// The Wiktionary supplement (data/wiktionary/, fetched by
// scripts/fetch-wiktionary.mjs with the upstream pipeline's own rules): words
// the vendored snapshot doesn't have. The snapshot always wins for a word it has.
const SUPPLEMENT_DIR = resolve(__dirname, '..', 'data', 'wiktionary');
function withSupplement(words, file) {
  const path = join(SUPPLEMENT_DIR, `${file}.gz`);
  if (!existsSync(path)) return words;
  const have = new Set(words.map((w) => w.word));
  const extra = JSON.parse(gunzipSync(readFileSync(path)).toString('utf-8')).words.filter((w) => !have.has(w.word));
  console.log(`  + ${extra.length} ${file.replace('.json', '')} from the Wiktionary supplement`);
  return [...words, ...extra];
}

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
  ['sheep', 'lammas', 'sheep', '🐑'],
  ['mouse', 'hiiri', 'mouse', '🐭'],
  ['elephant', 'norsu', 'elephant', '🐘'],
  ['lion', 'leijona', 'lion', '🦁'],
  ['monkey', 'apina', 'monkey', '🐵'],
  ['chicken', 'kana', 'chicken', '🐔'],
  ['wolf', 'susi', 'wolf', '🐺'],
  ['snake', 'käärme', 'snake', '🐍'],
  ['butterfly', 'perhonen', 'butterfly', '🦋'],
  ['bee', 'mehiläinen', 'bee', '🐝'],
  // the wild duck (a mallard): from the Wiktionary supplement (data/wiktionary/).
  // 🦆 is ankka's, so sorsa's picture goes by a key of its own.
  ['wild-duck', 'sorsa', 'wild duck', '🪿'],
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
  // 11-20: no keycap emoji exists past ten, so the "emoji" is the numeral
  // itself (renders as big digits on a card). Counting only ever uses the
  // nominative word + value, so these unlock the higher counting rungs (the
  // count node scales to 20) that stopped dead at ten before.
  ['eleven', 'yksitoista', 'eleven', '11', 11],
  ['twelve', 'kaksitoista', 'twelve', '12', 12],
  ['thirteen', 'kolmetoista', 'thirteen', '13', 13],
  ['fourteen', 'neljätoista', 'fourteen', '14', 14],
  ['fifteen', 'viisitoista', 'fifteen', '15', 15],
  ['sixteen', 'kuusitoista', 'sixteen', '16', 16],
  ['seventeen', 'seitsemäntoista', 'seventeen', '17', 17],
  ['eighteen', 'kahdeksantoista', 'eighteen', '18', 18],
  ['nineteen', 'yhdeksäntoista', 'nineteen', '19', 19],
  ['twenty', 'kaksikymmentä', 'twenty', '20', 20],
  // Counting by tens to a hundred. Only the round tens + sata are real,
  // single-word sourced numerals (21-99 are compounds NOT in the source, and
  // rule-building them would break the golden rule). These extend the number-
  // RECOGNITION node past 20; counting stays ≤ 20 (buildCountingRound filters
  // by value ≤ maxCount, so no card ever tries to show 60 objects).
  ['thirty', 'kolmekymmentä', 'thirty', '30', 30],
  ['forty', 'neljäkymmentä', 'forty', '40', 40],
  ['fifty', 'viisikymmentä', 'fifty', '50', 50],
  ['sixty', 'kuusikymmentä', 'sixty', '60', 60],
  ['seventy', 'seitsemänkymmentä', 'seventy', '70', 70],
  ['eighty', 'kahdeksankymmentä', 'eighty', '80', 80],
  ['ninety', 'yhdeksänkymmentä', 'ninety', '90', 90],
  ['hundred', 'sata', 'a hundred', '100', 100],
];

// Adjectives decline like nouns and AGREE with their noun in case + number, so
// they're sourced from nouns.json too. Colors get a color-square placeholder;
// quality/size adjectives have no single picture (emoji omitted).
// Describing words + feelings. A picture where one reads clearly (so the
// course's "New words" warm-up can show it); the rest ('old', 'thirsty') fall
// back to their English word on the card. Feelings also power the Feelings
// unit ("Olen iloinen"); `kylmä`/`kuuma` double as "Minulla on kylmä".
const ADJECTIVES = [
  ['big', 'iso', 'big', '🦕'],
  ['small', 'pieni', 'small', '🐜'],
  ['fast', 'nopea', 'fast', '🏎️'],
  ['slow', 'hidas', 'slow', '🐢'],
  ['old', 'vanha', 'old', ''],
  ['happy', 'iloinen', 'happy', '😄'],
  ['tired', 'väsynyt', 'tired', '🥱'],
  ['hungry', 'nälkäinen', 'hungry', '🤤'],
  ['cute', 'söpö', 'cute', '🥰'],
  ['kind', 'kiltti', 'kind', '😇'],
  ['sad', 'surullinen', 'sad', '😞'],
  ['angry', 'vihainen', 'angry', '😠'],
  ['thirsty', 'janoinen', 'thirsty', ''],
  ['sick', 'sairas', 'sick', '🤒'],
  ['calm', 'rauhallinen', 'calm', '😌'],
  ['proud', 'ylpeä', 'proud', '😤'],
  ['cold', 'kylmä', 'cold', '🥶'],
  ['hot', 'kuuma', 'hot', '🥵'],
  ['red', 'punainen', 'red', '🟥'],
  ['blue', 'sininen', 'blue', '🟦'],
  ['yellow', 'keltainen', 'yellow', '🟨'],
  ['green', 'vihreä', 'green', '🟩'],
  ['black', 'musta', 'black', '⬛'],
  ['white', 'valkoinen', 'white', '⬜'],
  ['brown', 'ruskea', 'brown', '🟫'],
  // For the "Comparing" unit (each has a sourced comparative + superlative).
  ['young', 'nuori', 'young'],
  ['tall', 'pitkä', 'tall', '🗼'],
  ['strong', 'vahva', 'strong', '🏋️'],
  ['good', 'hyvä', 'good', '👍'],
  ['funny', 'hauska', 'funny', '🤪'],
  // Feelings, part 2: "Minulla on tylsää" — I'm bored (the picture: a bored kid).
  ['boring', 'tylsä', 'boring', '😑'],
  // Describing: four more colors (the swatch keys are unused emoji), and six
  // opposites, each only for the things it fits (semantics.ts).
  ['pink', 'vaaleanpunainen', 'pink', '🩷'],
  ['purple', 'violetti', 'purple', '🟪'],
  ['gray', 'harmaa', 'gray', '🩶'],
  ['orange', 'oranssi', 'orange', '🟧'],
  ['new', 'uusi', 'new', '🏷️'],
  ['short', 'lyhyt', 'short', '🤏'],
  ['easy', 'helppo', 'easy', '🧩'],
  ['hard', 'vaikea', 'hard', '🪢'],
  // "clean" is the verb siivota's id
  ['clean-adj', 'puhdas', 'clean', '🫧'],
  ['dirty', 'likainen', 'dirty', '🪰'],
  // Weather: "On lämmin" — it's warm (the picture: a thermometer in the sun).
  ['warm', 'lämmin', 'warm', '🌡️'],
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
  ['egg', 'muna', 'egg', '🥚'],
  ['rice', 'riisi', 'rice', '🍚'],
  ['soup', 'keitto', 'soup', '🍲'],
  ['sausage', 'makkara', 'sausage', '🌭'],
  ['tomato', 'tomaatti', 'tomato', '🍅'],
  ['candy', 'karkki', 'candy', '🍬'],
  ['porridge', 'puuro', 'porridge', '🥣'],
  ['butter', 'voi', 'butter', '🧈'],
  ['pizza', 'pitsa', 'pizza', '🍕'],
  // The Finnish year: Christmas gingerbread, a sweet bun at the cottage and
  // the forest's blueberries. From the Wiktionary supplement (data/wiktionary/).
  ['gingerbread', 'piparkakku', 'gingerbread cookie', '🫚'],
  ['bun', 'pulla', 'sweet bun', '🥐'],
  ['blueberry', 'mustikka', 'blueberry', '🫐'],
];

// Meals, for My day: "Syön aamupalaa" — I'm eating breakfast. Their own
// theme, opt-in like money: a meal fills only the phrases that name it, never
// "kolme aamupalaa" or "Ostan lounaan". iltapala is from the Wiktionary
// supplement (data/wiktionary/).
const MEALS = [
  ['breakfast', 'aamupala', 'breakfast', '🥞'],
  ['lunch', 'lounas', 'lunch', '🍱'],
  ['dinner', 'päivällinen', 'dinner', '🍝'],
  ['evening-snack', 'iltapala', 'evening snack', '🥪'],
];

// The weather itself — "Millainen sää?" (what's the weather like?). Opt-in,
// like money: "Näen sään" or "kolme säätä" would be nonsense.
const WEATHER = [['weather', 'sää', 'weather', '⛅']];

// The Finnish year: Christmas, Easter and Midsummer, and what comes with them.
// Opt-in like the meals: a holiday fills only the phrases that name it
// ("Odotan joulua!", "Olemme mökillä jouluna") — never "kolme joulua" or
// "Ostan joulupukin". Mostly from the Wiktionary supplement (data/wiktionary/).
const FINNISH_YEAR = [
  ['christmas', 'joulu', 'Christmas', '🎀'],
  // A name in English: "I can't wait for Santa!" (scripts/agid.mjs)
  ['santa', 'joulupukki', 'Santa', '🎅'],
  ['christmas-tree', 'joulukuusi', 'Christmas tree', '🎄'],
  ['elf', 'tonttu', 'elf', '🧝'],
  ['snowman', 'lumiukko', 'snowman', '⛄'],
  ['easter', 'pääsiäinen', 'Easter', '🐣'],
  // the little Easter witches who go door to door with willow twigs
  ['witch', 'noita', 'witch', '🧙'],
  // "pajunkissa" is a willow cat; a catkin is a little cat too
  ['catkin', 'pajunkissa', 'willow catkin', '🌾'],
  ['midsummer', 'juhannus', 'Midsummer', '🎋'],
  ['bonfire', 'kokko', 'bonfire', '🎇'],
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
  // No 4th field on purpose (emoji-less, see the FAMILY comment above) — text-
  // only depth for build/order/spell. No PLACE_TAGS entry either, so they
  // simply never fill a locative ("where") carrier, only the plain ones.
  ['window', 'ikkuna', 'window'],
  ['door', 'ovi', 'door'],
  ['kitchen', 'keittiö', 'kitchen'],
  ['garden', 'puutarha', 'garden'],
  ['bus', 'bussi', 'bus', '🚌'],
  ['train', 'juna', 'train', '🚆'],
  // Ways to travel, for "Menen bussilla" (by bus). A ship is ON (laivalla);
  // the rest are IN (veneessä, lentokoneessa, taksissa).
  ['boat', 'vene', 'boat', '🚤'],
  ['plane', 'lentokone', 'plane', '🛩️'],
  ['ship', 'laiva', 'ship', '🚢'],
  ['taxi', 'taksi', 'taxi', '🚕'],
  ['shop', 'kauppa', 'shop', '🏪'],
  ['library', 'kirjasto', 'library', '📚'],
  // Around town & home — places a child goes, for the person-subject
  // carriers ("Menen puistoon", "Olen pihalla").
  ['park', 'puisto', 'park', '🛝'],
  ['hospital', 'sairaala', 'hospital', '🏥'],
  ['station', 'asema', 'station', '🚉'],
  ['museum', 'museo', 'museum', '🏛️'],
  ['restaurant', 'ravintola', 'restaurant', '🍴'],
  ['cafe', 'kahvila', 'cafe', '☕'],
  ['city', 'kaupunki', 'city', '🏙️'],
  ['market', 'tori', 'market', '🛍️'],
  ['zoo', 'eläintarha', 'zoo', '🦒'],
  ['field', 'kenttä', 'field', '🏟️'],
  ['living-room', 'olohuone', 'living room'],
  ['bedroom', 'makuuhuone', 'bedroom', '🛌'],
  ['bathroom', 'kylpyhuone', 'bathroom', '🛁'],
  ['sofa', 'sohva', 'sofa', '🛋️'],
  ['yard', 'piha', 'yard', '🏡'],
  // School & daycare: where you ask to go ("Saanko mennä vessaan?") and where a
  // little brother goes ("Leo on päiväkodissa"). US English: the "bathroom"
  // is kylpyhuone's, so vessa is the restroom.
  ['restroom', 'vessa', 'restroom', '🚻'],
  ['daycare', 'päiväkoti', 'daycare', '🏤'],
  // The Finnish year: the summer cottage ("Menen mökille" — with -lle) and the
  // sauna ("Menen saunaan").
  ['cottage', 'mökki', 'cottage', '🛖'],
  ['sauna', 'sauna', 'sauna', '🧖'],
];

// Locative SHAPE tags for places — which "where" cases each one makes sense in:
//   'surface'   → you can be ON / ONTO / OFF it   (adessive/allative/ablative)
//   'container' → you can be IN / INTO / OUT-OF it (inessive/illative/elative)
// A bed is BOTH ("sängyllä" on the bed, "sängyssä" in bed). A flat table/chair
// is a surface only; a room/forest is a container only. A box, a car and a
// basket are containers only: a cat on top of one is "laatikon / auton / korin
// päällä" — "autolla" would read as "by car", "korilla" / "laatikolla" as odd.
// The locative carrier phrases require the matching tag (see constructions.ts),
// so "the cat is on the room" can never be generated.
const PLACE_TAGS = {
  box: ['container'],
  table: ['surface'],
  house: ['container'],
  room: ['container'],
  car: ['container'],
  bed: ['surface', 'container'],
  chair: ['surface'],
  school: ['container'],
  tree: ['container'],
  forest: ['container'],
  basket: ['container'],
  bag: ['container'],
  // The 4 emoji-less places (see PLACES above) — "ikkunalla"/"ovella" (at the
  // window/door) is idiomatic adessive, so surface; "keittiössä"/"puutarhassa"
  // (in the kitchen/garden) is inessive, so container — same pattern as the
  // room/house/school/forest entries above.
  window: ['surface'],
  door: ['surface'],
  kitchen: ['container'],
  garden: ['container'],
  // Everyday destinations for the course's "going places" units — you are IN a
  // bus/train/shop/library ("bussissa", "kaupassa", "kirjastossa").
  bus: ['container'],
  train: ['container'],
  shop: ['container'],
  library: ['container'],
  park: ['container'],
  hospital: ['container'],
  station: ['surface'],
  museum: ['container'],
  restaurant: ['container'],
  cafe: ['container'],
  city: ['container'],
  market: ['surface'],
  zoo: ['container'],
  field: ['surface'],
  'living-room': ['container'],
  bedroom: ['container'],
  bathroom: ['container'],
  sofa: ['surface'],
  yard: ['surface'],
  boat: ['container'],
  plane: ['container'],
  ship: ['surface'],
  taxi: ['container'],
  // Both endings are said for these (contrasts.ts EITHER_IN_OR_ON): "vessassa /
  // vessalla", "saunassa / saunalla", "mökillä / mökissä".
  restroom: ['container'],
  daycare: ['container'],
  sauna: ['container'],
  cottage: ['surface'],
};

// Where a PERSON can be / go / come from — a separate gate from the cat's
// surface/container shape, because "Olen pöydällä" (I'm on the table) is odd
// even though the table is a surface. 'person-in' places take -ssa / -Vn /
// -sta ("Olen koulussa", "Menen kouluun", "Tulen koulusta"); 'person-on'
// places take -lla / -lle / -lta ("Olen pihalla", "Menen asemalle").
const PERSON_IN = [
  'school', 'room', 'kitchen', 'garden', 'house', 'forest', 'bus', 'train', 'shop',
  'library', 'car', 'bed', 'park', 'hospital', 'museum', 'restaurant', 'cafe', 'city',
  'zoo', 'living-room', 'bedroom', 'bathroom', 'boat', 'plane', 'taxi',
  'restroom', 'daycare', 'sauna',
];
const PERSON_ON = ['station', 'market', 'field', 'yard', 'sofa', 'door', 'window', 'ship', 'cottage'];
for (const id of PERSON_IN) PLACE_TAGS[id] = [...(PLACE_TAGS[id] ?? []), 'person-in'];
for (const id of PERSON_ON) PLACE_TAGS[id] = [...(PLACE_TAGS[id] ?? []), 'person-on'];

// School life — the course's everyday register for an 8-year-old (people and
// things at school), replacing animals/body parts as the first nouns met.
// NOTE: `sakset` (scissors) is a plurale tantum (no singular forms) — excluded.
const SCHOOL = [
  ['teacher', 'opettaja', 'teacher', '🧑‍🏫'],
  ['friend', 'kaveri', 'friend', '🤝'],
  ['book', 'kirja', 'book', '📕'],
  ['pencil', 'kynä', 'pencil', '✏️'],
  ['backpack', 'reppu', 'backpack', '🎒'],
  ['paper', 'paperi', 'paper', '📄'],
  ['picture', 'kuva', 'picture', '🖼️'],
  ['clock', 'kello', 'clock', '⏰'],
  ['homework', 'läksy', 'homework', '📝'],
  // Emoji-less (text-only depth, see FAMILY).
  ['class', 'luokka', 'class'],
  // School day: subjects + school life ("Pidän matematiikasta").
  ['math', 'matematiikka', 'math', '➗'],
  ['gym', 'liikunta', 'gym', '🤸'],
  ['english', 'englanti', 'English', '🇬🇧'],
  ['pupil', 'oppilas', 'student', '🧑‍🎓'],
  ['test', 'koe', 'test', '📋'],
  ['eraser', 'kumi', 'eraser'],
  ['task', 'tehtävä', 'task'],
  // US English: a "canteen" is a water bottle there.
  ['canteen', 'ruokala', 'cafeteria'],
  // The leader in "Kapteeni käskee" (the Finnish "Simon says"), from My body.
  ['captain', 'kapteeni', 'captain', '🧑‍✈️'],
  // School & daycare: the recess bell, the notebook, glue and the board, and
  // the school nurse with her bandages. From the Wiktionary supplement
  // (välitunti, vihko, terveydenhoitaja, laastari) and the snapshot.
  ['recess', 'välitunti', 'recess', '🛎️'],
  // id clash: the app's Notebook icon (📓) is a UI picture; this is the word
  ['notebook', 'vihko', 'notebook', '📒'],
  ['glue', 'liima', 'glue', '🧴'],
  // the board in class (taulu is a painting on a wall too)
  ['board', 'taulu', 'board', '🪧'],
  ['nurse', 'terveydenhoitaja', 'school nurse', '🧑‍⚕️'],
  ['bandage', 'laastari', 'bandage', '🩹'],
];

// When? — days of the week (no single picture each, so their English shows on
// the card), parts of the day, seasons. Kept OUT of the mixed noun pool: they
// only fill their own time carriers ("Tänään on maanantai", "Leikin
// maanantaina / aamulla / kesällä").
const TIME = [
  ['monday', 'maanantai', 'Monday'],
  ['tuesday', 'tiistai', 'Tuesday'],
  ['wednesday', 'keskiviikko', 'Wednesday'],
  ['thursday', 'torstai', 'Thursday'],
  ['friday', 'perjantai', 'Friday'],
  ['saturday', 'lauantai', 'Saturday'],
  ['sunday', 'sunnuntai', 'Sunday'],
  ['weekend', 'viikonloppu', 'weekend', '🎡'],
  ['morning', 'aamu', 'morning', '🌅'],
  ['daytime', 'päivä', 'day', '🌞'],
  ['evening', 'ilta', 'evening', '🌆'],
  ['night', 'yö', 'night', '🌃'],
  ['spring', 'kevät', 'spring', '🌱'],
  ['summer', 'kesä', 'summer', '🏖️'],
  ['autumn', 'syksy', 'autumn', '🍂'],
  // a snowy spruce (⛄ is the snowman's, lumiukko, in the Finnish year)
  ['winter', 'talvi', 'winter', '🌨️'],
  // Months, for dates and birthdays ("viides toukokuuta", "toukokuussa").
  ['january', 'tammikuu', 'January'],
  ['february', 'helmikuu', 'February'],
  ['march', 'maaliskuu', 'March'],
  ['april', 'huhtikuu', 'April'],
  ['may', 'toukokuu', 'May'],
  ['june', 'kesäkuu', 'June'],
  ['july', 'heinäkuu', 'July'],
  ['august', 'elokuu', 'August'],
  ['september', 'syyskuu', 'September'],
  ['october', 'lokakuu', 'October'],
  ['november', 'marraskuu', 'November'],
  ['december', 'joulukuu', 'December'],
  ['birthday', 'syntymäpäivä', 'birthday', '🎂'],
  ['year', 'vuosi', 'year'],
  ['month', 'kuukausi', 'month'],
];

// How you feel, as a NOUN: "Minulla on nälkä / jano" (literally "on me is
// hunger"). Only the Feelings unit's "Minulla on ___" carrier uses these.
// Ordinals — first, second… (only 1st–10th are sourced numerals). Their own
// theme, so counting never draws one ("ensimmäinen kissaa" is nonsense).
const ORDINALS = [
  ['first', 'ensimmäinen', 'first', '1.', 1],
  ['second', 'toinen', 'second', '2.', 2],
  ['third', 'kolmas', 'third', '3.', 3],
  ['fourth', 'neljäs', 'fourth', '4.', 4],
  ['fifth', 'viides', 'fifth', '5.', 5],
  ['sixth', 'kuudes', 'sixth', '6.', 6],
  ['seventh', 'seitsemäs', 'seventh', '7.', 7],
  ['eighth', 'kahdeksas', 'eighth', '8.', 8],
  ['ninth', 'yhdeksäs', 'ninth', '9.', 9],
  ['tenth', 'kymmenes', 'tenth', '10.', 10],
];

const STATES = [
  ['hunger', 'nälkä', 'hunger'],
  ['thirst', 'jano', 'thirst'],
];

// Lesson-only words: shown in a lesson to make a point about SOUNDS, never
// drawn into a game pool. "tulli" completes the classic length trio
// tuli (fire) / tuuli (wind) / tulli (customs): one vowel, two vowels, two
// consonants — three different words.
const LESSON_WORDS = [['customs', 'tulli', 'customs', '🛂']];

// Free time — hobbies, games and gadgets: the things a child actually talks
// about owning and liking ("Minulla on pyörä", "Pidän jalkapallosta").
const FREETIME = [
  ['ball', 'pallo', 'ball', '🏐'],
  // The ball (⚽). In US English "football" is another game, so the ball is a
  // "soccer ball" — and liking or watching it is "soccer" (see KIND_EN).
  ['football', 'jalkapallo', 'soccer ball', '⚽'],
  ['bike', 'pyörä', 'bike', '🚲'],
  ['game', 'peli', 'game', '🎮'],
  ['guitar', 'kitara', 'guitar', '🎸'],
  ['piano', 'piano', 'piano', '🎹'],
  ['music', 'musiikki', 'music', '🎵'],
  ['movie', 'elokuva', 'movie', '🎞️'],
  ['phone', 'puhelin', 'phone', '📱'],
  ['computer', 'tietokone', 'computer', '💻'],
  // Emoji-less (text-only depth).
  ['hobby', 'harrastus', 'hobby'],
  // Things you do something WITH ("Syön lusikalla", I eat with a spoon).
  ['spoon', 'lusikka', 'spoon', '🥄'],
  ['fork', 'haarukka', 'fork'],
  ['key', 'avain', 'key', '🔑'],
  // Birthday party things.
  ['balloon', 'ilmapallo', 'balloon', '🎈'],
  ['candle', 'kynttilä', 'candle', '🕯️'],
  ['present', 'lahja', 'present'],
  // The Play unit: toys (Leikin nukella), instruments (Soitan rumpua) and
  // games (Pelaan shakkia). shakki and jääkiekko are the game AND its things:
  // the chess set, the hockey puck — the sport is their English when played
  // or liked (KIND_EN).
  ['teddy', 'nalle', 'teddy bear', '🧸'],
  ['doll', 'nukke', 'doll', '🪆'],
  ['toy', 'lelu', 'toy', '🚂'],
  ['drum', 'rumpu', 'drum', '🥁'],
  ['violin', 'viulu', 'violin', '🎻'],
  ['card', 'kortti', 'card', '🃏'],
  ['chess', 'shakki', 'chess set', '♟️'],
  ['hockey', 'jääkiekko', 'hockey puck', '🏒'],
];

// Money: the euro, for the shop's prices ("kaksi euroa"). Its own topic, so
// it fills no carrier phrase but the ones that name it.
const MONEY = [['euro', 'euro', 'euro', '💶']];

// Math in Finnish (the optional Lasketaan! section): zero, which the course's
// counting never needs. Its own opt-in topic, so no course game meets it; like
// every number in that section it is shown as a word, never a picture.
const MATH_NUMBERS = [['zero', 'nolla', 'zero', '', 0]];
// …and the words its problems are built with: "kaksi kertaa kolme" (times),
// "puolet" (half of), "tunnin päästä" (in an hour), the shop's coins, the
// scale and the die. Glossary words: tapping one shows what it means.
const MATH_WORDS = [
  ['times', 'kerta', 'time (kaksi kertaa = two times)'],
  ['half', 'puoli', 'half'],
  ['hour', 'tunti', 'hour'],
  ['coin', 'kolikko', 'coin'],
  ['scale', 'vaaka', 'scale (for weighing)'],
  ['die', 'noppa', 'die (for a game)'],
];

const FAMILY = [
  ['mother', 'äiti', 'mom', '👩'],
  ['father', 'isä', 'dad', '👨'],
  ['brother', 'veli', 'brother', '🧑'],
  ['sister', 'sisko', 'sister', '👧'],
  ['baby', 'vauva', 'baby', '👶'],
  ['son', 'poika', 'son', '👦'],
  // "daughter" is tytär (tyttö is "girl"). No picture: 👧 is the sister's.
  ['daughter', 'tytär', 'daughter'],
  ['grandmother', 'isoäiti', 'grandmother', '👵'],
  ['grandfather', 'isoisä', 'grandfather', '👴'],
  ['family', 'perhe', 'family', '👪'],
  ['child', 'lapsi', 'child', '🧒'],
  // The relatives the "I have" unit adds, each drawn as one of the cast (an
  // aunt with red hair, an uncle with a moustache, a cousin in a striped cap)
  // and never offered beside Mom, Dad or a child (content/apart.ts). 'setä'
  // stands in for "uncle" in general (Finnish also has 'eno' for a maternal
  // uncle specifically; kept out for simplicity).
  ['aunt', 'täti', 'aunt', '👩‍🦰'],
  ['uncle', 'setä', 'uncle', '🧔'],
  ['cousin', 'serkku', 'cousin', '🧑‍🦱'],
  // No 4th field (emoji stays undefined on purpose): it still plays in the
  // text-only games (build/order/spell), just never as a picture card.
  ['grandchild', 'lapsenlapsi', 'grandchild'],
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
  ['tongue', 'kieli', 'tongue', '👅'],
  ['heart', 'sydän', 'heart', '❤️'],
  ['bone', 'luu', 'bone', '🦴'],
  ['muscle', 'lihas', 'muscle', '💪'],
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
  ['wind', 'tuuli', 'wind', '💨'],
  ['ice', 'jää', 'ice', '🧊'],
  ['leaf', 'lehti', 'leaf', '🍃'],
  ['fire', 'tuli', 'fire', '🔥'],
  ['grass', 'ruoho', 'grass', '🌿'],
  ['island', 'saari', 'island', '🏝️'],
  // Out in nature: the shore of a lake or the sea ("Olemme rannalla").
  ['beach', 'ranta', 'beach', '🐚'],
];

// Where a PERSON can be in nature: on the mountain ("Olen vuorella", "Menen
// vuorelle"). The lake, sea, beach and island stay out: there both endings
// are said ("järveen" is into the lake, "järvelle" out onto it).
const NATURE_TAGS = { mountain: ['person-on'] };

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
  // No picture: 👗 is the dress's, and two words on one picture can't be told apart.
  ['skirt', 'hame', 'skirt'],
  ['glove', 'käsine', 'glove', '🧤'],
  ['scarf', 'huivi', 'scarf', '🧣'],
  ['cap', 'lakki', 'cap', '🧢'],
  ['boot', 'saapas', 'boot', '🥾'],
  ['ring', 'sormus', 'ring', '💍'],
  ['tie', 'solmio', 'tie', '👔'],
  ['vest', 'liivi', 'vest', '🦺'],
  // Emoji-less (see the FAMILY comment above) — text-only depth.
  ['belt', 'vyö', 'belt'],
  ['earring', 'korvakoru', 'earring'],
  // Winter clothes, for Not having ("Minulla ei ole pipoa") and getting dressed
  // in My day ("Puen haalarin päälle"). From the Wiktionary supplement.
  ['beanie', 'pipo', 'beanie', '🧶'],
  ['mitten', 'lapanen', 'mitten', '🥊'],
  ['snowsuit', 'haalari', 'snowsuit', '🩱'],
  ['sweater', 'villapaita', 'sweater', '🎽'],
  ['raincoat', 'sadetakki', 'raincoat', '☔'],
];

// Kid-friendly verbs spanning all six KOTUS verb types. The 4th field is an
// action emoji: verbs that have one can appear as picture cards (the
// listen-verbs warm-up + Review); abstract verbs (olla, saada, muistaa…) stay
// emoji-less and are served only by the conjugation drill and sentences.
const VERBS = [
  ['be', 'olla', 'be'],
  ['eat', 'syödä', 'eat', '🍜'],
  ['drink', 'juoda', 'drink', '🥤'],
  ['sleep', 'nukkua', 'sleep', '😴'],
  // leikkiä is pretend play and toys (its picture: a yo-yo)
  ['play', 'leikkiä', 'play', '🪀'],
  ['run', 'juosta', 'run', '🏃'],
  ['jump', 'hypätä', 'jump', '🦘'],
  ['go', 'mennä', 'go'],
  ['come', 'tulla', 'come'],
  ['see', 'nähdä', 'see', '👀'],
  ['give', 'antaa', 'give', '🎁'],
  ['take', 'ottaa', 'take'],
  ['look', 'katsoa', 'look', '📺'],
  ['sing', 'laulaa', 'sing', '🎙️'],
  ['read', 'lukea', 'read', '📖'],
  ['swim', 'uida', 'swim', '🏊'],
  ['want', 'haluta', 'want'],
  ['love', 'rakastaa', 'love', '💞'],
  ['like', 'tykätä', 'like', '😋'],
  ['help', 'auttaa', 'help', '🙌'],
  ['sit', 'istua', 'sit', '💺'],
  ['stand', 'seisoa', 'stand', '🧍'],
  ['walk', 'kävellä', 'walk', '🚶'],
  ['dance', 'tanssia', 'dance', '💃'],
  ['draw', 'piirtää', 'draw', '🖍️'],
  ['write', 'kirjoittaa', 'write', '✍️'],
  ['open', 'avata', 'open', '🔓'],
  ['close', 'sulkea', 'close', '🔒'],
  ['buy', 'ostaa', 'buy', '🛒'],
  ['hear', 'kuulla', 'hear', '🦻'],
  ['listen', 'kuunnella', 'listen', '🎧'],
  ['speak', 'puhua', 'speak', '🗣️'],
  ['say', 'sanoa', 'say', '💬'],
  ['ask', 'kysyä', 'ask', '❓'],
  ['answer', 'vastata', 'answer', '🙋'],
  ['search', 'etsiä', 'look for', '🔍'],
  ['find', 'löytää', 'find'],
  ['make', 'tehdä', 'make', '🔨'],
  ['get', 'saada', 'get', '🫴'],
  ['bring', 'tuoda', 'bring'],
  ['carry', 'viedä', 'carry', '🧳'],
  ['fly', 'lentää', 'fly', '✈️'],
  ['drive', 'ajaa', 'drive', '🚙'],
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
  ['remember', 'muistaa', 'remember', '🧠'],
  ['forget', 'unohtaa', 'forget', '❔'],
  ['learn', 'oppia', 'learn', '🎓'],
  ['teach', 'opettaa', 'teach', '👩‍🏫'],
  ['wait', 'odottaa', 'wait', '⏳'],
  ['live', 'asua', 'live', '🏘️'],
  ['build', 'rakentaa', 'build', '🧱'],
  ['fix', 'korjata', 'fix', '🔧'],
  ['wake-up', 'herätä', 'wake up', '⏲️'],
  // Type 4 verbs with a consonant change (hypätä → hyppään), for the
  // "Verbs, part 2" unit's KPT half.
  ['meet', 'tavata', 'meet'],
  ['fall', 'pudota', 'fall'],
  ['cut', 'leikata', 'cut', '✂️'],
  // Type 5 (-ita/-itä → -itse-) and type 6 (-eta/-etä → -ene-), for the
  // "Verbs, part 3" unit.
  ['need', 'tarvita', 'need'],
  ['choose', 'valita', 'choose', '👉'],
  ['disturb', 'häiritä', 'disturb'],
  ['lock', 'lukita', 'lock', '🔐'],
  ['grow-old', 'vanheta', 'grow old', '🧓'],
  ['warm-up', 'lämmetä', 'warm up', '♨️'],
  ['run-away', 'paeta', 'run away', '😱'],
  // My body: the words of "Kapteeni käskee" — the captain ORDERS, and you
  // TOUCH your nose or LIFT your hand ("Kosketa nenää!", "Nosta käsi ylös!").
  ['order', 'käskeä', 'order', '📣'],
  ['touch', 'koskettaa', 'touch', '🫳'],
  ['lift', 'nostaa', 'lift', '📤'],
  // Play: English has one "play", Finnish three — leikkiä (toys, pretend),
  // pelata (games and sports) and soittaa (music; it's also "call").
  ['play-game', 'pelata', 'play games', '🎲'],
  ['play-music', 'soittaa', 'play music', '🪈'],
  // My day: brushing your teeth and getting dressed ("Harjaan hampaat", "Puen
  // takin päälle").
  ['brush', 'harjata', 'brush', '🪥'],
  ['put-on', 'pukea', 'put on', '👘'],
  // School & daycare: "En ymmärrä" — I don't understand (rt → rr: ymmärrän).
  ['understand', 'ymmärtää', 'understand', '🧐'],
  // The Finnish year: winter fun (ht → hd: hiihdän). From the supplement.
  ['ski', 'hiihtää', 'ski', '⛷️'],
  ['skate', 'luistella', 'skate', '⛸️'],
];

// Feelings that are verbs: "Minua pelottaa" — literally "it scares me". Only
// their "it" form (present 3sg) is ever used ("Minua ___"), so they're a theme
// of their own: never in the conjugation drills ("minä pelotan" would say "I
// scare someone"), and no English forms are needed (the gloss is how it feels).
const FEELING_VERBS = [
  ['scared', 'pelottaa', 'scared', '😨'],
  ['nervous', 'jännittää', 'nervous', '😬'],
  ['sleepy', 'väsyttää', 'sleepy', '😪'],
  ['giggly', 'naurattaa', 'giggly', '🤭'],
  ['teary', 'itkettää', 'teary', '🥹'],
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
  // The expert band (L7+): perfect ("olen syönyt") and conditional ("söisin"),
  // auxiliaries included in the sourced forms — nothing is assembled in code.
  ...VERB_PERSONS.map((p) => `perfect_active_positive_${p}`),
  ...VERB_PERSONS.map((p) => `perfect_active_negative_${p}`),
  ...VERB_PERSONS.map((p) => `conditional_active_positive_${p}`),
  ...VERB_PERSONS.map((p) => `conditional_active_negative_${p}`),
  'imperative_active_positive_2sg',
  'imperative_active_positive_2pl',
  // "Don't…!" (älä + the connegative) and "Let's…!" (the present passive, which
  // spoken Finnish uses for "let's": "Leikitään!") — both sourced whole.
  'imperative_active_negative_2sg',
  'present_passive_positive',
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
    // Sourced English morphology (plural / verb forms / comparatives) from AGID.
    const pos = posForTheme(id);
    if (pos) {
      const eng = englishFormsFor(AGID, english, pos);
      if (eng) entry.english = eng;
      else ENGLISH_MISSING.push(`${id}:${english} (${pos})`);
    }
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

const nounWords = withSupplement(load('nouns.json').words, 'nouns.json');
const numeralWords = load('numerals.json').words;

// Possessive suffixes ("kissani" = my cat, "talossasi" = in your house). A
// focused subset of the vendored possessive paradigm: the three most useful
// possessors × a few teachable cases, singular. Attached to noun items under
// `poss_{possessor}_{case}_singular` keys (namespaced so they never collide
// with the plain case forms). Every form is SOURCED — never assembled in code.
const possessiveWords = withSupplement(load('possessives.json').words, 'possessives.json');
const POSS_POSSESSORS = ['1sg', '2sg', '3rd'];
const POSS_CASES = ['nominative', 'inessive', 'adessive'];

function attachPossessives(theme) {
  const bySrc = new Map(possessiveWords.map((w) => [w.word, w]));
  const missing = [];
  for (const item of theme.words) {
    const src = bySrc.get(item.word);
    if (!src || !src.inflections) {
      missing.push(item.word);
      continue;
    }
    for (const possessor of POSS_POSSESSORS) {
      const table = src.inflections[possessor];
      if (!table) continue;
      for (const c of POSS_CASES) {
        const form = table[`${c}_singular`];
        if (form) item.inflections[`poss_${possessor}_${c}_singular`] = form;
      }
    }
  }
  if (missing.length) {
    console.warn(`  [${theme.theme.id}] no possessive source (skipped): ${missing.join(', ')}`);
  }
  return theme;
}

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

// Comparison degrees ("isompi" bigger, "isoin" biggest) — dictionary headwords
// of their own in the source ("comparative degree of iso"), looked up and
// attached whole. When the source lists more than one, the first in PREFER wins
// (the standard form: lyhyempi, not the spoken lyhempi).
const DEGREE_PREFER = { pitkä: ['pidempi'], hyvä: ['paras'], lyhyt: ['lyhyempi'] };
function attachDegrees(theme) {
  const found = {};
  for (const w of nounWords) {
    const tr = (w.translations || []).join(' ');
    for (const m of tr.matchAll(/(comparative|superlative) (?:degree |form )?of ([a-zäöå]+)/g)) {
      ((found[m[2]] ??= {})[m[1]] ??= []).push(w.word);
    }
  }
  for (const item of theme.words) {
    const f = found[item.word];
    if (!f?.comparative || !f?.superlative) continue;
    const pick = (list) => list.find((x) => (DEGREE_PREFER[item.word] ?? []).includes(x)) ?? list[0];
    item.degrees = { comparative: pick(f.comparative), superlative: pick(f.superlative) };
  }
  return theme;
}
attachDegrees(adjectives);

const verbWords = withSupplement(load('verbs.json').words, 'verbs.json');
const verbs = buildTheme({
  id: 'verbs',
  fi: 'Verbit',
  en: 'Verbs',
  emoji: '🏃',
  curation: VERBS,
  sourceWords: verbWords,
  inflectionKeys: VERB_INFLECTION_KEYS,
});

const feelingVerbs = buildTheme({
  id: 'feeling-verbs',
  fi: 'Tunteet',
  en: 'Feelings that are verbs',
  emoji: '😨',
  curation: FEELING_VERBS,
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
  tagsById: NATURE_TAGS,
});

const meals = buildTheme({
  id: 'meals',
  fi: 'Ateriat',
  en: 'Meals',
  emoji: '🥞',
  curation: MEALS,
  sourceWords: nounWords,
});

const weather = buildTheme({
  id: 'weather',
  fi: 'Sää',
  en: 'Weather',
  emoji: '⛅',
  curation: WEATHER,
  sourceWords: nounWords,
});

const finnishYear = buildTheme({
  id: 'finnish-year',
  fi: 'Suomalainen vuosi',
  en: 'The Finnish year',
  emoji: '🎄',
  curation: FINNISH_YEAR,
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

const school = buildTheme({
  id: 'school',
  fi: 'Koulu',
  en: 'School',
  emoji: '🏫',
  curation: SCHOOL,
  sourceWords: nounWords,
});

const time = buildTheme({
  id: 'time',
  fi: 'Aika',
  en: 'Time',
  emoji: '📅',
  curation: TIME,
  sourceWords: nounWords,
});

const states = buildTheme({
  id: 'states',
  fi: 'Olotila',
  en: 'How you feel',
  emoji: '🙂',
  curation: STATES,
  sourceWords: nounWords,
});

const ordinals = buildTheme({
  id: 'ordinals',
  fi: 'Järjestysluvut',
  en: 'First, second…',
  emoji: '🥇',
  curation: ORDINALS,
  sourceWords: numeralWords,
});

const lessonWords = buildTheme({
  id: 'lesson-words',
  fi: 'Oppitunnin sanat',
  en: 'Lesson words',
  emoji: '📖',
  curation: LESSON_WORDS,
  sourceWords: nounWords,
});

const mathWords = buildTheme({
  id: 'math',
  fi: 'Lasketaan',
  en: 'Math',
  emoji: '➗',
  curation: [...MATH_NUMBERS, ...MATH_WORDS],
  // a number word from the numerals' tables, every other from the nouns'
  sourceWords: [...nounWords, ...numeralWords],
});

const money = buildTheme({
  id: 'money',
  fi: 'Raha',
  en: 'Money',
  emoji: '💶',
  curation: MONEY,
  sourceWords: nounWords,
});

const freetime = buildTheme({
  id: 'freetime',
  fi: 'Vapaa-aika',
  en: 'Free time',
  emoji: '🎮',
  curation: FREETIME,
  sourceWords: nounWords,
});

// Attach possessive suffix forms to every NOUN theme (the "Kenen?" game draws
// from these). Adjectives/verbs/numbers don't take possessive suffixes here.
[animals, food, family, places, body, nature, clothes, school, freetime, meals].forEach(attachPossessives);

// Sourced-English guarantee: no word may ship without its AGID-derived forms.
if (ENGLISH_MISSING.length) {
  console.error(
    `\nERROR: ${ENGLISH_MISSING.length} word(s) have no English morphology in AGID:\n  ` +
      ENGLISH_MISSING.join('\n  ') +
      `\nAdd them to data/english-agid or handle them in scripts/agid.mjs.`,
  );
  process.exit(1);
}

writeFileSync(join(OUT_DIR, 'animals.sourced.json'), JSON.stringify(animals, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'numbers.sourced.json'), JSON.stringify(numbers, null, 2) + '\n');
writeFileSync(
  join(OUT_DIR, 'adjectives.sourced.json'),
  JSON.stringify(adjectives, null, 2) + '\n',
);
writeFileSync(join(OUT_DIR, 'verbs.sourced.json'), JSON.stringify(verbs, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'feeling-verbs.sourced.json'), JSON.stringify(feelingVerbs, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'food.sourced.json'), JSON.stringify(food, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'family.sourced.json'), JSON.stringify(family, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'places.sourced.json'), JSON.stringify(places, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'body.sourced.json'), JSON.stringify(body, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'nature.sourced.json'), JSON.stringify(nature, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'clothes.sourced.json'), JSON.stringify(clothes, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'school.sourced.json'), JSON.stringify(school, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'freetime.sourced.json'), JSON.stringify(freetime, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'money.sourced.json'), JSON.stringify(money, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'math.sourced.json'), JSON.stringify(mathWords, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'meals.sourced.json'), JSON.stringify(meals, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'weather.sourced.json'), JSON.stringify(weather, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'finnish-year.sourced.json'), JSON.stringify(finnishYear, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'time.sourced.json'), JSON.stringify(time, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'states.sourced.json'), JSON.stringify(states, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'ordinals.sourced.json'), JSON.stringify(ordinals, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'lesson-words.sourced.json'), JSON.stringify(lessonWords, null, 2) + '\n');

console.log(
  `Wrote ${animals.words.length} animals, ${numbers.words.length} numbers, ` +
    `${adjectives.words.length} adjectives, ${verbs.words.length} verbs, ${feelingVerbs.words.length} feeling verbs, ` +
    `${food.words.length} food, ${family.words.length} family, ` +
    `${places.words.length} places, ${body.words.length} body, ` +
    `${nature.words.length} nature, ${clothes.words.length} clothes, ` +
    `${school.words.length} school, ${freetime.words.length} free-time, ${money.words.length} money, ` +
    `${meals.words.length} meals, ${weather.words.length} weather, ${finnishYear.words.length} Finnish-year, ` +
    `${time.words.length} time, ${states.words.length} state, ${ordinals.words.length} ordinal words to ${OUT_DIR}`,
);

// Aakkoset — the Finnish alphabet and its sounds, for the optional "Alphabet &
// sounds" corner. The letter NAMES (aa, bee, äl…) and the sound tips are
// HAND-AUTHORED (a small, closed set every Finnish school teaches); the example
// WORDS are looked up from the sourced vocabulary by their Finnish spelling —
// `alphabet.test.ts` fails if one is missing.
// ⚠️ NEEDS NATIVE FINNISH VETTING (letter names; listed in FINNISH_REVIEW.md).

export interface Letter {
  /** Lowercase letter. */
  ch: string;
  /** How Finns say the letter's name when spelling ("ää", "äl"). */
  nameFi: string;
  /** Kid-level English tip on how it sounds. */
  tip: string;
  /** Only in borrowed words and names (b, c, f, g, q, w, x, z, å). */
  borrowed?: boolean;
  /** A vowel (part of the vowel team rules). */
  vowel?: boolean;
  /** Example words (sourced Finnish spellings), best first. */
  examples: string[];
}

export const ALPHABET: Letter[] = [
  { ch: 'a', nameFi: 'aa', vowel: true, tip: 'Like the a in "father" — but short.', examples: ['auto', 'apina', 'ankka'] },
  { ch: 'b', nameFi: 'bee', borrowed: true, tip: 'Only in borrowed words. Like English b.', examples: ['banaani', 'bussi'] },
  { ch: 'c', nameFi: 'see', borrowed: true, tip: 'Only in names and borrowed words. Usually sounds like k or s.', examples: [] },
  { ch: 'd', nameFi: 'dee', tip: 'A soft d, with the tongue just behind the teeth. Mostly in the MIDDLE of words.', examples: ['kahdeksan', 'yhdeksän'] },
  { ch: 'e', nameFi: 'ee', vowel: true, tip: 'Like the e in "bed".', examples: ['elokuva', 'eläintarha'] },
  { ch: 'f', nameFi: 'äf', borrowed: true, tip: 'Only in borrowed words. Like English f.', examples: [] },
  { ch: 'g', nameFi: 'gee', borrowed: true, tip: 'On its own only in borrowed words. In Finnish words you meet it as ng — like in "singer".', examples: ['englanti'] },
  { ch: 'h', nameFi: 'hoo', tip: 'A breathy h — say it even in the middle of a word.', examples: ['hevonen', 'hiiri', 'kahdeksan'] },
  { ch: 'i', nameFi: 'ii', vowel: true, tip: 'Like the ee in "see" — but short.', examples: ['iso', 'ilta', 'isä'] },
  { ch: 'j', nameFi: 'jii', tip: 'Like the y in "yes" — never like English j!', examples: ['juna', 'jää', 'järvi'] },
  { ch: 'k', nameFi: 'koo', tip: 'Like k, but with no puff of air.', examples: ['kissa', 'koira', 'kirja'] },
  { ch: 'l', nameFi: 'äl', tip: 'Like the l in "leaf".', examples: ['lumi', 'lintu', 'lehmä'] },
  { ch: 'm', nameFi: 'äm', tip: 'Like English m.', examples: ['meri', 'metsä', 'museo'] },
  { ch: 'n', nameFi: 'än', tip: 'Like English n.', examples: ['norsu', 'nopea', 'neljä'] },
  { ch: 'o', nameFi: 'oo', vowel: true, tip: 'Like the o in "more", with round lips — short.', examples: ['omena', 'opettaja'] },
  { ch: 'p', nameFi: 'pee', tip: 'Like p, but with no puff of air.', examples: ['puu', 'pupu', 'pöytä'] },
  { ch: 'q', nameFi: 'kuu', borrowed: true, tip: 'Only in names. Sounds like k.', examples: [] },
  { ch: 'r', nameFi: 'är', tip: 'ROLLED! Tap the tip of your tongue fast — like a purring cat: rrr.', examples: ['ruoho', 'riisi', 'ravintola'] },
  { ch: 's', nameFi: 'äs', tip: 'Always like the s in "sun" — never like z.', examples: ['sata', 'sade', 'sammakko'] },
  { ch: 't', nameFi: 'tee', tip: 'Like t, with no puff of air — the tongue touches the teeth.', examples: ['talo', 'tuuli', 'tähti'] },
  { ch: 'u', nameFi: 'uu', vowel: true, tip: 'Like the oo in "book".', examples: ['uida', 'kuusi', 'puu'] },
  { ch: 'v', nameFi: 'vee', tip: 'Like the v in "van".', examples: ['vuori', 'viisi', 'väsynyt'] },
  { ch: 'w', nameFi: 'kaksois-vee', borrowed: true, tip: 'Only in names. Sounds like v.', examples: [] },
  { ch: 'x', nameFi: 'äks', borrowed: true, tip: 'Only in names and borrowed words. Sounds like ks.', examples: [] },
  { ch: 'y', nameFi: 'yy', vowel: true, tip: 'Say "ee" — then make your lips round like for "oo". That\'s y!', examples: ['yksi', 'yö', 'kynä'] },
  { ch: 'z', nameFi: 'tset', borrowed: true, tip: 'Only in borrowed words. Sounds like ts.', examples: [] },
  { ch: 'å', nameFi: 'ruotsalainen oo', borrowed: true, tip: 'Only in Swedish names. Sounds like o.', examples: [] },
  { ch: 'ä', nameFi: 'ää', vowel: true, tip: 'Like the a in "cat".', examples: ['äiti', 'jäätelö', 'isä'] },
  { ch: 'ö', nameFi: 'öö', vowel: true, tip: 'Like the u in "fur", with round lips.', examples: ['pöytä', 'söpö', 'yö'] },
];

/** A short guide to one of the tricky sound patterns. */
export interface SoundGuide {
  id: string;
  icon: string;
  title: string;
  /** Kid-level English (prose markup like lessons: **bold**, *Finnish*). */
  text: string;
  /** Example words (sourced spellings), to hear. */
  examples: string[];
}

export const SOUND_GUIDES: SoundGuide[] = [
  {
    id: 'length',
    icon: '📏',
    title: 'One letter or two?',
    text: 'Two of the same letter = hold the sound **longer**. It changes the word: *tuli* (fire), *tuuli* (wind), *tulli* (customs).',
    examples: ['tuli', 'tuuli', 'tulli', 'kissa', 'pallo'],
  },
  {
    id: 'vowel-pairs',
    icon: '👄',
    title: 'a or ä · o or ö · u or y',
    text: 'The dots change the sound: **a** (father) vs **ä** (cat), **o** vs **ö** (fur), **u** (book) vs **y** (ee with round lips). A word usually keeps to ONE team: *a o u* or *ä ö y*.',
    examples: ['talo', 'tähti', 'koulu', 'pöytä', 'kynä'],
  },
  {
    id: 'two-vowels',
    icon: '🎶',
    title: 'Two different vowels together',
    text: 'Glide from one vowel to the next in one smooth sound: *ai*, *äi*, *au*, *ou*, *ie*, *uo*, *yö*, *öy*…',
    examples: ['auto', 'äiti', 'koulu', 'pieni', 'vuori', 'yö', 'pöytä'],
  },
  {
    id: 'j-r-h',
    icon: '👅',
    title: 'Watch out: j, r and h',
    text: '**j** is like y in "yes". **r** is rolled — tap your tongue. **h** is breathy, even in the middle: *kahdeksan*.',
    examples: ['juna', 'ruoho', 'kahdeksan'],
  },
  {
    id: 'ng-nk',
    icon: '🔔',
    title: 'ng and nk',
    text: '**nk** sounds like "nk" in "think": *ankka*. **ng** is like "ng" in "singer" — and long: *englanti*.',
    examples: ['ankka', 'aurinko', 'englanti'],
  },
  {
    id: 'stress',
    icon: '🥁',
    title: 'Press on the first part',
    text: 'Every Finnish word is pressed on its **first part**: AU-to, O-pet-ta-ja, KIR-ja. Say the rest lightly.',
    examples: ['auto', 'opettaja', 'kirja'],
  },
];

export const letterByCh = (ch: string): Letter | undefined => ALPHABET.find((l) => l.ch === ch);

// Tap a word in a story to see what it means. Every word the game teaches
// carries its sourced forms, so a form found in a story ("hattua") leads back
// to its word ("hattu · hat") — looked up, never worked out. Small words the
// tables don't carry (ja, mutta, nyt…) have a short glossary of their own, and
// the cast's names are names.

import { themes, verbs, feelingVerbs, adjectives, numbers, ordinals, time, states } from '.';
import { PRONOUNS } from './pronouns';
import { CAST } from './storyKit';
import { glossWithAlso, possessiveGloss, type CaseId, type PersonId, type PossessorId } from './types';

export interface WordMeaning {
  /** The word's basic form ("hattu"). */
  base: string;
  en: string;
}

/** Function words and particles: what they mean in a story. Checked first. */
const SMALL_WORDS: Record<string, string> = {
  ja: 'and',
  tai: 'or',
  mutta: 'but',
  koska: 'because',
  kuin: 'than',
  ei: 'no, not',
  kyllä: 'yes',
  joo: 'yeah',
  myös: 'also, too',
  vain: 'only',
  nyt: 'now',
  jo: 'already',
  taas: 'again',
  sitten: 'then',
  ensin: 'first',
  lopuksi: 'in the end, finally',
  tänään: 'today',
  huomenna: 'tomorrow',
  eilen: 'yesterday',
  tässä: 'here',
  täällä: 'here',
  siellä: 'there',
  ulkona: 'outside',
  ulos: 'out',
  sisään: 'in, inside',
  alas: 'down',
  kotona: 'at home',
  kotiin: 'home',
  yhdessä: 'together',
  paljon: 'a lot, lots',
  vähän: 'a little',
  hyvin: 'well',
  nopeasti: 'quickly',
  hiljaa: 'quietly; quiet!',
  salaa: 'in secret',
  kiitos: 'thank you',
  hei: 'hi',
  moi: 'hi',
  näkemiin: 'goodbye',
  anteeksi: 'sorry',
  tervetuloa: 'welcome',
  huomenta: 'good morning',
  voi: 'oh',
  miau: 'meow',
  mitä: 'what',
  mikä: 'what, which',
  kuka: 'who',
  missä: 'where',
  mihin: 'where to',
  mistä: 'where from; about what',
  milloin: 'when',
  miksi: 'why',
  miten: 'how',
  montako: 'how many',
  millainen: 'what … like',
  kumpi: 'which (of two)',
  kenellä: 'who has',
  kenen: 'whose',
  se: 'it',
  sen: 'its, it',
  sillä: 'it has',
  tämä: 'this',
  tuo: 'that',
  ne: 'they (things)',
  nämä: 'these',
  kaikki: 'everyone, all',
  jotain: 'something',
  minäkin: 'me too',
  // the "not" verb and "don't!"
  en: "I don't",
  et: "you don't",
  emme: "we don't",
  ette: "you (all) don't",
  eivät: "they don't",
  älä: "don't!",
  // place words that come after their noun ("tuolin alla")
  alla: 'under',
  takana: 'behind',
  edessä: 'in front of',
  vieressä: 'next to',
  kanssa: 'with',
  mukaan: 'along',
  pois: 'away',
  takaisin: 'back',
  // asking
  onko: 'is …? / does … have?',
  entä: 'and …? / what about …?',
  paljonko: 'how much (Paljonko kello on? = What time is it?)',
  // everyday words that aren't vocabulary items (yet)
  koti: 'home',
  kuuluu: 'is going (Mitä kuuluu? = How are you?)',
  hätää: 'trouble (Ei hätää! = No worries!)',
  alkaa: 'starts',
  paistaa: 'shines',
  puoli: 'half (puoli kahdeksan = half past seven, 7:30)',
  // "pää + -lle" would read "onto the head"
  päälle: 'on (Puen takin päälle = I put on my coat)',
  käy: 'runs, works',
  karkkipäivä: 'candy day',
  kaunis: 'beautiful',
  tavaraa: 'things, stuff',
  ruokaa: 'food',
  täytän: 'I turn (… years old)',
  uusi: 'new',
  hiljaista: 'quiet',
  ollut: 'been',
  pidän: 'I like',
  pidät: 'you like',
  pitää: 'likes',
  osaan: 'I can',
  osaat: 'you can',
  osaa: 'can',
  pelaa: 'plays (a game)',
  pelataan: "let's play (a game)",
  pelata: 'to play (a game)',
  oikein: 'right, correct',
  nimesi: 'your name',
  nimeni: 'my name',
  syntymäpäiväni: 'my birthday',
  no: 'well',
  saanko: 'may I?',
  saan: 'I may, I get',
  saat: 'you may, you get',
  saa: 'may, gets',
  // "go and do" forms: "Mennään uimaan!" (let's go swimming)
  uimaan: 'to swim (go swimming)',
  leikkimään: 'to play',
  syömään: 'to eat',
  nukkumaan: 'to sleep (go to bed)',
  pelaamaan: 'to play (a game)',
};

/**
 * Spellings two words share, and what each means: "Isä tuli kotiin" is Dad
 * CAME home, not "fire". A story word that is a form of two words needs an
 * entry here (unitStories.test.ts checks).
 */
export const TWO_WORDS: Record<string, WordMeaning> = {
  tuli: { base: 'tulla / tuli', en: 'came (tulla) · fire (tuli)' },
  tulen: { base: 'tulla / tuli', en: 'I come (tulla) · a fire (tuli: "tekee tulen" = makes a fire)' },
};

const SUBJECTS: Record<PersonId, string> = {
  '1sg': 'I',
  '2sg': 'you',
  '3sg': 'he, she',
  '1pl': 'we',
  '2pl': 'you (all)',
  '3pl': 'they',
};

let index: Map<string, WordMeaning> | null = null;

function build(): Map<string, WordMeaning> {
  const map = new Map<string, WordMeaning>();
  // The first meaning found for a spelling wins.
  const put = (form: string | undefined, meaning: WordMeaning) => {
    const key = form?.toLowerCase();
    if (key && !/\s/.test(key) && !map.has(key)) map.set(key, meaning);
  };
  const items = [...themes.flatMap((t) => t.items), ...verbs.items, ...feelingVerbs.items, ...adjectives.items, ...numbers.items, ...ordinals.items, ...time.items, ...states.items];
  // A word's own basic form wins over another word's inflected form that looks the same.
  for (const item of items) put(item.fi, { base: item.fi, en: glossWithAlso(item) });
  // Pronouns next: in a story "heitä" is THEM, not the command "throw!".
  for (const [person, table] of Object.entries(PRONOUNS) as [PersonId, (typeof PRONOUNS)[PersonId]][]) {
    const en = `${SUBJECTS[person]} / ${table.enObject}`;
    for (const [k, f] of Object.entries(table)) if (k !== 'enObject') put(f, { base: table.nominative, en });
  }
  // "nopeampi" is faster, "paras" best — the sourced degrees, with their English.
  for (const item of items) {
    if (!item.degrees) continue;
    put(item.degrees.comparative, { base: item.fi, en: item.english?.comparative ?? item.en });
    put(item.degrees.superlative, { base: item.fi, en: item.english?.superlative ?? item.en });
  }
  // Every other sourced form. A possessive one says whose: "repussani" → in my backpack.
  for (const item of items) {
    for (const [key, f] of Object.entries(item.inflections)) {
      const poss = /^poss_(1sg|2sg|3rd)_(\w+)_singular$/.exec(key);
      put(f, {
        base: item.fi,
        en: poss ? possessiveGloss(item, poss[1] as PossessorId, poss[2] as CaseId) : glossWithAlso(item),
      });
    }
  }
  // A "not" form is two words ("ei käskenyt" = didn't order): the verb part on
  // its own is still this verb.
  for (const item of items) {
    for (const [key, f] of Object.entries(item.inflections)) {
      if (key.includes('_negative_')) put(f?.split(' ').pop(), { base: item.fi, en: glossWithAlso(item) });
    }
  }
  return map;
}

/** Endings a word can carry on top of its form: "Laulatko?" is laulat + -ko. */
const CLITICS: [string, string][] = [
  ['ko', 'asking'],
  ['kö', 'asking'],
  ['kin', 'too'],
  ['kaan', 'not … either'],
  ['kään', 'not … either'],
  ['han', ''],
  ['hän', ''],
  ['pa', ''],
  ['pä', ''],
];

/** What a word in a story means — or undefined for a word we can't look up. */
export function lookupWord(word: string): WordMeaning | undefined {
  const w = word.toLowerCase();
  const found = meaningOf(w);
  if (found) return found;
  for (const [clitic, note] of CLITICS) {
    if (w.length <= clitic.length + 1 || !w.endsWith(clitic)) continue;
    const m = meaningOf(w.slice(0, -clitic.length));
    if (m) return { base: m.base, en: note ? `${m.en} (${note})` : m.en };
  }
  return undefined;
}

function meaningOf(w: string): WordMeaning | undefined {
  if (SMALL_WORDS[w]) return { base: w, en: SMALL_WORDS[w] };
  if (TWO_WORDS[w]) return TWO_WORDS[w];
  // A cast member's name, in any form (Aino, Ainolla, Mirrille…).
  for (const c of Object.values(CAST)) {
    const name = c.nameFi.toLowerCase();
    if (w.startsWith(name) && c.nameFi !== 'Äiti' && c.nameFi !== 'Isä' && c.nameFi !== 'Isoäiti' && c.nameFi !== 'Opettaja') {
      return { base: c.nameFi, en: `${c.nameEn} (a name)` };
    }
  }
  index ??= build();
  return index.get(w);
}

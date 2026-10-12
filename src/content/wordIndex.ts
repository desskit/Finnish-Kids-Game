// Tap a word in a story to see what it means. Every word the game teaches
// carries its sourced forms, so a form found in a story ("hattua") leads back
// to its word ("hattu · hat") — looked up, never worked out. Small words the
// tables don't carry (ja, mutta, nyt…) have a short glossary of their own, and
// the cast's names are names.

import { themes, verbs, adjectives, numbers, ordinals, time, states } from '.';
import { PRONOUNS } from './pronouns';
import { CAST } from './storyKit';
import type { PersonId } from './types';

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
  lopuksi: 'at the end',
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

function forms(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    if (!/\s/.test(value)) out.push(value.toLowerCase());
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) forms(v, out);
  }
  return out;
}

function build(): Map<string, WordMeaning> {
  const map = new Map<string, WordMeaning>();
  const items = [...themes.flatMap((t) => t.items), ...verbs.items, ...adjectives.items, ...numbers.items, ...ordinals.items, ...time.items, ...states.items];
  // A word's own basic form wins over another word's inflected form that looks the same.
  for (const item of items) {
    const key = item.fi.toLowerCase();
    if (!map.has(key)) map.set(key, { base: item.fi, en: item.en });
  }
  for (const item of items) {
    for (const f of forms(item.inflections)) if (!map.has(f)) map.set(f, { base: item.fi, en: item.en });
  }
  for (const [person, table] of Object.entries(PRONOUNS) as [PersonId, (typeof PRONOUNS)[PersonId]][]) {
    const en = `${SUBJECTS[person]} / ${table.enObject}`;
    for (const [k, f] of Object.entries(table)) {
      if (k !== 'enObject' && !map.has(f.toLowerCase())) map.set(f.toLowerCase(), { base: table.nominative, en });
    }
  }
  return map;
}

/** What a word in a story means — or undefined for a word we can't look up. */
export function lookupWord(word: string): WordMeaning | undefined {
  const w = word.toLowerCase();
  if (SMALL_WORDS[w]) return { base: w, en: SMALL_WORDS[w] };
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

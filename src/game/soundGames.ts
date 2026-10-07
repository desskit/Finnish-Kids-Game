// The Alphabet corner's three listening games. Each question is a REAL word
// (sourced, with a picture) that the child hears; part of it is blanked out and
// the options are LETTERS — so no made-up word is ever shown as Finnish.
//
//   first-letter  "▢uto" + 🔊 → a / ä / o …        (which letter does it start with?)
//   length        "ki▢a" + 🔊 → s / ss             (one letter or two?)
//   vowel         "p▢ytä" + 🔊 → o / ö             (a or ä, o or ö, u or y?)

import type { LexicalItem } from '../content/types';
import { allWords } from '../content/lookup';
import { ALPHABET, type Letter } from '../content/alphabet';
import { sample, shuffle } from '../util/shuffle';

export type SoundMode = 'first-letter' | 'length' | 'vowel';

export interface SoundQuestion {
  item: LexicalItem;
  /** The word split around the blank. */
  before: string;
  after: string;
  answer: string;
  options: string[];
  /** One-line hint for a wrong pick. */
  tip: string;
}

const FINNISH_LETTERS = 'adehijklmnoprstuvyäö'.split('');
/** Look-alike / sound-alike letters, offered first as wrong options. */
const CONFUSABLE: Record<string, string[]> = {
  a: ['ä', 'o'],
  ä: ['a', 'e'],
  o: ['ö', 'u'],
  ö: ['o', 'y'],
  u: ['y', 'o'],
  y: ['u', 'i'],
  e: ['ä', 'i'],
  i: ['y', 'e'],
  k: ['t', 'p'],
  t: ['d', 'k'],
  p: ['k', 't'],
  j: ['i', 'h'],
  h: ['j', 'k'],
  v: ['p', 'h'],
  r: ['l', 'n'],
  l: ['r', 'n'],
  m: ['n', 'p'],
  n: ['m', 'l'],
  s: ['h', 't'],
};
const VOWEL_PAIRS: [string, string][] = [
  ['a', 'ä'],
  ['o', 'ö'],
  ['u', 'y'],
];

/** Kid words: one word, Finnish letters only, a picture, not too long. */
export function soundWords(): LexicalItem[] {
  return allWords().filter((w) => w.emoji && /^[a-zåäö]+$/.test(w.fi) && w.fi.length <= 9);
}

function firstLetter(w: LexicalItem, optionCount: number): SoundQuestion | null {
  const ch = w.fi[0];
  if (!FINNISH_LETTERS.includes(ch)) return null;
  const wrong = [
    ...(CONFUSABLE[ch] ?? []),
    ...shuffle(FINNISH_LETTERS.filter((l) => l !== ch)),
  ].filter((l, i, a) => l !== ch && a.indexOf(l) === i);
  return {
    item: w,
    before: '',
    after: w.fi.slice(1),
    answer: ch,
    options: shuffle([ch, ...wrong.slice(0, optionCount - 1)]),
    tip: `Listen to the very first sound: "${w.fi}" starts with ${ch}.`,
  };
}

function length(w: LexicalItem, wantLong: boolean): SoundQuestion | null {
  const s = w.fi;
  const spots: number[] = [];
  for (let i = 1; i < s.length; i++) {
    if (wantLong) {
      if (s[i] === s[i + 1] && s[i] !== s[i - 1] && s[i + 2] !== s[i]) spots.push(i);
    } else if (s[i] !== s[i - 1] && s[i] !== s[i + 1] && /[a-zäö]/.test(s[i])) {
      spots.push(i);
    }
  }
  if (spots.length === 0) return null;
  const i = sample(spots, 1)[0];
  const ch = s[i];
  const n = wantLong ? 2 : 1;
  const answer = ch.repeat(n);
  return {
    item: w,
    before: s.slice(0, i),
    after: s.slice(i + n),
    answer,
    options: shuffle([ch, ch + ch]),
    tip: wantLong
      ? `The ${ch} in "${s}" is held LONG — so it's written twice: ${ch}${ch}.`
      : `The ${ch} in "${s}" is short — just one ${ch}.`,
  };
}

function vowel(w: LexicalItem): SoundQuestion | null {
  const s = w.fi;
  // Whole runs of one vowel ("jää" → the "ää"), so the blank never splits one.
  const runs: { i: number; len: number; pair: [string, string] }[] = [];
  for (let i = 0; i < s.length; ) {
    let j = i;
    while (s[j + 1] === s[i]) j++;
    const pair = VOWEL_PAIRS.find((p) => p.includes(s[i]));
    if (pair) runs.push({ i, len: j - i + 1, pair });
    i = j + 1;
  }
  if (runs.length === 0) return null;
  const r = sample(runs, 1)[0];
  const answer = s.slice(r.i, r.i + r.len);
  return {
    item: w,
    before: s.slice(0, r.i),
    after: s.slice(r.i + r.len),
    answer,
    options: shuffle(r.pair.map((v) => v.repeat(r.len))),
    tip: `${r.pair[0]} and ${r.pair[1]} sound different — and a word keeps to one team: a o u, or ä ö y.`,
  };
}

export function buildSoundRound(
  mode: SoundMode,
  words: readonly LexicalItem[],
  count: number,
  optionCount = 4,
): SoundQuestion[] {
  const out: SoundQuestion[] = [];
  const used = new Set<string>();
  for (let guard = 0; out.length < count && guard < count * 20; guard++) {
    const w = sample(words, 1)[0];
    if (!w || used.has(w.fi)) continue;
    const q =
      mode === 'first-letter'
        ? firstLetter(w, optionCount)
        : mode === 'length'
          ? length(w, out.length % 2 === 0)
          : vowel(w);
    if (!q) continue;
    used.add(w.fi);
    out.push(q);
  }
  return out;
}

// --- Letter names (Kirjainten nimet): j is "jii", l is "äl" ------------------------


export interface NameQuestion {
  letter: Letter;
  /** 'hear': the name is spoken → tap the letter. 'see': the letter is shown → pick its name. */
  ask: 'hear' | 'see';
  answer: string;
  options: string[];
  tip: string;
}

/** Names that sound alike — offered first as wrong options. */
const NAME_ALIKE: Record<string, string[]> = {
  a: ['ä', 'o'],
  ä: ['a', 'e'],
  e: ['ä', 'i'],
  i: ['j', 'e'],
  j: ['i', 'g'],
  o: ['ö', 'u'],
  ö: ['o', 'y'],
  u: ['y', 'o'],
  y: ['u', 'i'],
  l: ['r', 'm', 'n', 's'],
  r: ['l', 's'],
  m: ['n', 'l'],
  n: ['m', 'l'],
  s: ['l', 'r'],
  k: ['h', 'o'],
  h: ['k', 'o'],
  p: ['t', 'v', 'd'],
  t: ['p', 'd'],
  d: ['t', 'p'],
  v: ['p', 'd'],
};

/** The letters the names game asks about: every letter used in Finnish words. */
export const NAME_LETTERS = ALPHABET.filter((l) => !l.borrowed);

export function buildNameRound(count: number, optionCount = 4): NameQuestion[] {
  const picks = shuffle(NAME_LETTERS).slice(0, count);
  return picks.map((letter, n) => {
    const ask: 'hear' | 'see' = n % 2 === 0 ? 'hear' : 'see';
    const alike = (NAME_ALIKE[letter.ch] ?? []).map((ch) => NAME_LETTERS.find((l) => l.ch === ch)!).filter(Boolean);
    const others = shuffle(NAME_LETTERS.filter((l) => l !== letter && !alike.includes(l)));
    const wrong = [...alike, ...others].slice(0, optionCount - 1);
    const answer = ask === 'hear' ? letter.ch : letter.nameFi;
    const options = shuffle([letter, ...wrong].map((l) => (ask === 'hear' ? l.ch : l.nameFi)));
    return {
      letter,
      ask,
      answer,
      options,
      tip: `${letter.ch.toUpperCase()} is called "${letter.nameFi}". ${letter.tip}`,
    };
  });
}

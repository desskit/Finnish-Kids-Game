// The math section's problems (Lasketaan!), built from SOURCED number words
// only: nolla to kaksikymmentä, the round tens and sata — every one a word in
// the data, with its own looked-up forms. Compounds like 21 aren't in the data
// and are never put together by rule, so the sums stay inside that set: plus
// and minus within twenty, more or less, what comes after or before, counting
// runs, the teens, and word problems.
//
// Pure: no React, no storage. A problem is Finnish to say (and, at the lower
// levels, show), the answer's value, the choices, and what the answer looks
// like afterwards (`show`, drawn as dots — never as a digit).

import { mathWords, money, numbers, food, freetime, places, school } from '../content';
import { countedEn, countingNounForm, pluralEn, type LexicalItem } from '../content/types';
import {
  EDIBLE_THINGS,
  THINGS,
  WORD_FRAMES,
  compareFrame,
  neighborFrame,
  sumFrame,
  wordProblem,
  MISSING,
  clockMoveFrame,
  clockSaid,
  halfFrame,
  payFrame,
  priceSaid,
  timesFrame,
  totalFrame,
  type Said,
  type WordFrame,
} from '../content/mathProblems';

// --- The numbers ---------------------------------------------------------------

/** Every number the section may say, by value (0–20, the round tens, 100). */
const BY_VALUE = new Map<number, LexicalItem>(
  [...mathWords.items, ...numbers.items].filter((n) => typeof n.value === 'number').map((n) => [n.value!, n]),
);

/** The values the section can say. */
export const MATH_VALUES: readonly number[] = [...BY_VALUE.keys()].sort((a, b) => a - b);

/** Can this value be said with a sourced word? */
export const isSayable = (v: number): boolean => BY_VALUE.has(v);

/** The number's word (nominative): "kolme". */
export function numberWord(v: number): string {
  const n = BY_VALUE.get(v);
  if (!n) throw new Error(`No sourced word for ${v}`);
  return n.fi;
}

/** A sourced form of the number: its genitive ("viiden"), partitive ("viittä") or elative ("viidestä"). */
export function numberForm(v: number, form: 'genitive' | 'partitive' | 'elative'): string {
  const n = BY_VALUE.get(v);
  const f = n?.inflections[`${form}_singular`];
  if (!f) throw new Error(`No sourced ${form} for ${v}`);
  return f;
}

/** The English number word, for the grown-ups' review only. */
export function numberEn(v: number): string {
  const n = BY_VALUE.get(v);
  if (!n) throw new Error(`No sourced word for ${v}`);
  return n.en;
}

/** The value a Finnish number word stands for (any case form of it), if any. */
export function valueOfWord(word: string): number | undefined {
  const w = word.toLowerCase();
  for (const [v, n] of BY_VALUE) {
    if (n.fi === w || Object.values(n.inflections).includes(w)) return v;
  }
  return undefined;
}

// --- Problems ---------------------------------------------------------------------

/** What the answer looks like once it's given — drawn as dots, never a digit. */
export type MathShow =
  | { kind: 'plus'; a: number; b: number }
  | { kind: 'minus'; a: number; b: number }
  | { kind: 'compare'; a: number; b: number }
  | {
      kind: 'run';
      values: number[];
      missing: number;
      /** The run IS the problem (the train, the rocket): said with its gap. */
      gap?: boolean;
      /** The rocket's countdown to nolla. */
      countdown?: boolean;
    }
  /** A number built from its parts: kolme|toista, or (`tens`) viisi|kymmentä. */
  | { kind: 'parts'; teen: number; base: number; tens?: boolean }
  /** `a` lots of `b`. */
  | { kind: 'times'; a: number; b: number }
  /** A whole split in two. */
  | { kind: 'half'; whole: number }
  /** Prices in euros, paid in coins. */
  | { kind: 'coins'; prices: number[] }
  /** A clock's time, then the time asked for ([hour, minutes]). */
  | { kind: 'clock'; from: [number, number]; to: [number, number] };

export interface MathProblem {
  /** The same problem always has the same key (no repeats in a round). */
  key: string;
  /** What is said, sentence by sentence (and shown, at the lower levels). */
  ask: Said[];
  /** The answer said in full, after a right answer. */
  tell: Said;
  answer: number;
  /** The choices, as values, the answer among them. */
  options: number[];
  show: MathShow;
  /** A word problem: what is counted (the item), and its frame. */
  noun?: LexicalItem;
  frame?: WordFrame['id'];
  /** What a choice says when it isn't a plain number word ("puoli neljä"). */
  words?: Record<number, string>;
  /** The things on sale (the shop). */
  things?: LexicalItem[];
}

/** What a choice (or the answer) says: its own words, or its number word. */
export const choiceWord = (p: MathProblem, v: number): string => p.words?.[v] ?? numberWord(v);

/** The problem sets: one per game (see mathPath.tsx). */
export type MathSet =
  /** Plus and minus within ten (stage 1). */
  | 'sums-10'
  /** Which is more, which is less — within twelve (stage 2). */
  | 'compare-12'
  /** What comes after, what comes before — within twelve (stage 2). */
  | 'neighbors-12'
  /** A counting run with one missing, up or down — within twelve (stage 2). */
  | 'run-12'
  /** Word problems (stage 3). */
  | 'word'
  /** "Kymmenen plus kolme" and the teens' parts (stage 4). */
  | 'teens'
  /** Plus and minus within twenty (stage 4). */
  | 'sums-20'
  /** A counting run within twenty, and the rocket's countdown to nolla (stage 4). */
  | 'run-20'
  /** The round tens' parts: viisi|kymmentä (stage 5). */
  | 'tens-parts'
  /** Plus and minus with round tens, up to sata (stage 5). */
  | 'tens-sums'
  /** Counting in tens, one missing (stage 5). */
  | 'run-tens'
  /** Times: kaksi kertaa kolme (stage 6). */
  | 'times'
  /** Halves: puolet kahdeksasta (stage 6). */
  | 'halves'
  /** Two prices and their total, in euros (stage 7). */
  | 'shop-totals'
  /** A price to pay in coins (stage 7). */
  | 'shop-pay'
  /** An hour later or earlier (stage 8). */
  | 'clock-hour'
  /** Half an hour later: "puoli neljä" (stage 8). */
  | 'clock-half';

type Rng = () => number;
const pick = <T>(xs: readonly T[], rng: Rng): T => xs[Math.floor(rng() * xs.length)];
const int = (lo: number, hi: number, rng: Rng) => lo + Math.floor(rng() * (hi - lo + 1));

function shuffle<T>(xs: T[], rng: Rng): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * The choices for an answer: the answer and its near neighbours (the easy
 * slips: one off, two off), all sayable and inside [lo, hi].
 */
export function optionsFor(answer: number, count: number, lo: number, hi: number, rng: Rng = Math.random): number[] {
  const near = [answer - 1, answer + 1, answer - 2, answer + 2, answer - 3, answer + 3];
  const pool = near.filter((v) => v >= lo && v <= hi && isSayable(v));
  const wrong = shuffle(pool.slice(0, 4), rng).slice(0, Math.max(0, count - 1));
  return shuffle([answer, ...wrong], rng);
}

function sumProblem(op: 'plus' | 'minus', a: number, b: number, count: number, hi: number, rng: Rng): MathProblem {
  const c = op === 'plus' ? a + b : a - b;
  const { ask, tell } = sumFrame(op, numberWord(a), numberWord(b), numberWord(c), [numberEn(a), numberEn(b), numberEn(c)]);
  return { key: `${op}:${a}:${b}`, ask: [ask], tell, answer: c, options: optionsFor(c, count, 0, hi, rng), show: { kind: op, a, b } };
}

/** Plus and minus within `hi`: every operand and result sayable, nothing below nolla. */
function sums(hi: number, count: number, rng: Rng, minA = 0): MathProblem {
  const op = rng() < 0.5 ? 'plus' : 'minus';
  if (op === 'plus') {
    const c = int(Math.max(1, minA), hi, rng);
    const a = int(0, c, rng);
    return sumProblem('plus', a, c - a, count, hi, rng);
  }
  const a = int(Math.max(1, minA), hi, rng);
  const b = int(0, a, rng);
  return sumProblem('minus', a, b, count, hi, rng);
}

function compare(hi: number, rng: Rng): MathProblem {
  const a = int(0, hi, rng);
  let b = int(0, hi, rng);
  while (b === a) b = int(0, hi, rng);
  const more = rng() < 0.5;
  const answer = more ? Math.max(a, b) : Math.min(a, b);
  const { ask, tell } = compareFrame(more, numberWord(a), numberWord(b), numberWord(answer), [numberEn(a), numberEn(b), numberEn(answer)]);
  return { key: `${more ? 'more' : 'less'}:${a}:${b}`, ask: [ask], tell, answer, options: [a, b], show: { kind: 'compare', a, b } };
}

function neighbor(hi: number, count: number, rng: Rng): MathProblem {
  const after = rng() < 0.5;
  const a = after ? int(0, hi - 1, rng) : int(1, hi, rng);
  const answer = after ? a + 1 : a - 1;
  const form = numberForm(a, after ? 'genitive' : 'partitive');
  const { ask, tell } = neighborFrame(after, form, numberWord(answer), [numberEn(a), numberEn(answer)]);
  return {
    key: `${after ? 'after' : 'before'}:${a}`,
    ask: [ask],
    tell,
    answer,
    options: optionsFor(answer, count, 0, hi, rng),
    show: { kind: 'run', values: after ? [a, answer] : [answer, a], missing: answer },
  };
}

/** A counting run of five, up (or down: the rocket counts down), one missing — never the first. In `step`s (tens). */
function run(lo: number, hi: number, count: number, rng: Rng, down = rng() < 0.4, step = 1): MathProblem {
  const len = 5;
  const start = lo + step * int(0, (hi - lo) / step - len + 1, rng);
  const up = Array.from({ length: len }, (_, i) => start + i * step);
  const values = down ? up.reverse() : up;
  const missing = values[int(1, len - 1, rng)];
  return {
    key: `run:${values.join('-')}:${missing}`,
    ask: [MISSING],
    tell: { fi: values.map(numberWord).join(', '), en: values.map(numberEn).join(', ') },
    answer: missing,
    options: step === 1 ? optionsFor(missing, count, lo, hi, rng) : tensOptions(missing, count, rng),
    show: { kind: 'run', values, missing, gap: true },
  };
}

/** Choices near a round ten: the tens either side (all sayable, up to sata). */
function tensOptions(answer: number, count: number, rng: Rng): number[] {
  const near = [answer - 10, answer + 10, answer - 20, answer + 20].filter((v) => v >= 10 && v <= 100 && isSayable(v));
  return shuffle([answer, ...shuffle(near, rng).slice(0, Math.max(0, count - 1))], rng);
}

/** The rocket's countdown: kymmenen … nolla, one missing. */
export function countdown(count: number, rng: Rng = Math.random): MathProblem {
  const values = Array.from({ length: 11 }, (_, i) => 10 - i);
  const missing = values[int(1, values.length - 2, rng)];
  return {
    key: `countdown:${missing}`,
    ask: [MISSING],
    tell: { fi: values.map(numberWord).join(', '), en: values.map(numberEn).join(', ') },
    answer: missing,
    options: optionsFor(missing, count, 0, 10, rng),
    show: { kind: 'run', values, missing, gap: true, countdown: true },
  };
}

/** The teens: "Kymmenen plus kolme?" — or, built from its parts, "…toista". */
function teens(count: number, rng: Rng): MathProblem {
  const base = int(1, 9, rng);
  const teen = 10 + base;
  // half the time a sum: ten and some more ("kymmenen plus kolme")
  if (rng() < 0.5) return sumProblem('plus', 10, base, count, 20, rng);
  // the builder: hear the teen, pick its first part (kolme + toista)
  return {
    key: `parts:${teen}`,
    ask: [{ fi: numberWord(teen), en: numberEn(teen) }],
    tell: { fi: `${numberWord(teen).charAt(0).toUpperCase()}${numberWord(teen).slice(1)}.`, en: numberEn(teen) },
    answer: base,
    options: optionsFor(base, count, 1, 9, rng),
    show: { kind: 'parts', teen, base },
  };
}

// --- Round tens (stage 5) ---------------------------------------------------------------

/** The round tens' parts: hear "viisikymmentä", find "viisi" (before -kymmentä). */
function tensParts(count: number, rng: Rng): MathProblem {
  const base = int(2, 9, rng);
  const whole = base * 10;
  return {
    key: `tens-parts:${whole}`,
    ask: [{ fi: numberWord(whole), en: numberEn(whole) }],
    tell: { fi: `${numberWord(whole).charAt(0).toUpperCase()}${numberWord(whole).slice(1)}.`, en: numberEn(whole) },
    answer: base,
    options: optionsFor(base, count, 2, 9, rng),
    show: { kind: 'parts', teen: whole, base, tens: true },
  };
}

/** Plus and minus with round tens, the answer a round ten up to sata (or nolla). */
function tensSums(count: number, rng: Rng): MathProblem {
  if (rng() < 0.5) {
    const c = 10 * int(2, 10, rng);
    const a = 10 * int(1, c / 10 - 1, rng);
    const p = sumProblem('plus', a, c - a, count, 100, rng);
    return { ...p, options: tensOptions(c, count, rng) };
  }
  const a = 10 * int(2, 10, rng);
  const b = 10 * int(1, a / 10 - 1, rng);
  const p = sumProblem('minus', a, b, count, 100, rng);
  return { ...p, options: tensOptions(a - b, count, rng) };
}

// --- Times and halves (stage 6) ----------------------------------------------------------

/** "Kaksi kertaa kolme": only tables whose answers are sourced words (to twenty, and round tens). */
function times(count: number, rng: Rng): MathProblem {
  let a = 2;
  let b = 2;
  do {
    a = pick([2, 3, 4, 5, 10], rng);
    b = int(1, 10, rng);
  } while (!isSayable(a * b) || a * b > 100);
  const c = a * b;
  const { ask, tell } = timesFrame(numberWord(a), numberWord(b), numberWord(c), [numberEn(a), numberEn(b), numberEn(c)]);
  const options = c > 20 ? tensOptions(c, count, rng) : optionsFor(c, count, 1, 20, rng);
  return { key: `times:${a}:${b}`, ask: [ask], tell, answer: c, options, show: { kind: 'times', a, b } };
}

/** "Puolet kahdeksasta": an even whole to twenty, or a round ten whose half is a word. */
function halves(count: number, rng: Rng): MathProblem {
  const wholes = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 40, 60, 80, 100].filter((w) => isSayable(w / 2));
  const whole = pick(wholes, rng);
  const half = whole / 2;
  const { ask, tell } = halfFrame(numberForm(whole, 'elative'), numberWord(half), [numberEn(whole), numberEn(half)]);
  const options = half > 20 ? tensOptions(half, count, rng) : optionsFor(half, count, 1, 20, rng);
  return { key: `half:${whole}`, ask: [ask], tell, answer: half, options, show: { kind: 'half', whole } };
}

// --- At the shop (stage 7) ----------------------------------------------------------------

/** Things for sale: food and toys with a picture, each a whole thing. */
const SHOP_THINGS = ['apple', 'banana', 'bread', 'milk', 'ice-cream', 'cookie', 'ball', 'book', 'car', 'pencil'];
const euro = () => money.items.find((i) => i.id === 'euro')!;

function price(thing: LexicalItem, amount: number): Said {
  return priceSaid(thing.fi, numberWord(amount), countingNounForm(euro(), amount), { thing: thing.en, amount: numberEn(amount) });
}

/** Two prices, then "Paljonko yhteensä?" — two euros or more each, to twelve in all. */
function shopTotals(count: number, rng: Rng): MathProblem {
  const pool = SHOP_THINGS.map(nounById).filter((n): n is LexicalItem => !!n);
  const first = pick(pool, rng);
  const second = pick(pool.filter((n) => n !== first), rng);
  const a = int(2, 6, rng);
  const b = int(2, 6, rng);
  const c = a + b;
  const { ask, tell } = totalFrame(numberWord(c), countingNounForm(euro(), c), numberEn(c));
  return {
    key: `total:${first.id}:${a}:${second.id}:${b}`,
    ask: [price(first, a), price(second, b), ask],
    tell,
    answer: c,
    options: optionsFor(c, count, 4, 12, rng),
    show: { kind: 'coins', prices: [a, b] },
    things: [first, second],
  };
}

/** A price to pay with coins: two euros to ten. */
function shopPay(count: number, rng: Rng): MathProblem {
  const pool = SHOP_THINGS.map(nounById).filter((n): n is LexicalItem => !!n);
  const thing = pick(pool, rng);
  const a = int(2, 10, rng);
  const coins = mathWords.items.find((i) => i.id === 'coin')!.inflections.adessive_plural!;
  return {
    key: `pay:${thing.id}:${a}`,
    ask: [price(thing, a), payFrame(coins)],
    tell: price(thing, a),
    answer: a,
    options: optionsFor(a, count, 2, 10, rng),
    show: { kind: 'coins', prices: [a] },
    things: [thing],
  };
}

// --- What time is it? (stage 8) ------------------------------------------------------------

/** "puoli neljä" (half past three) is stored as 100 + four. */
const HALF = 100;
const hourOf = (h: number) => ((h - 1 + 12) % 12) + 1;
/** A time said: "kolme", or "puoli neljä" (half past three: "half to four"). */
const timeWord = (v: number) => (v > HALF ? `${halfWord()} ${numberWord(v - HALF)}` : numberWord(v));
const halfWord = () => mathWords.items.find((i) => i.id === 'half')!.fi;
const hourForms = () => {
  const hour = mathWords.items.find((i) => i.id === 'hour')!;
  const half = mathWords.items.find((i) => i.id === 'half')!;
  return { hourGen: hour.inflections.genitive_singular!, hour: hour.fi, halfGen: half.inflections.genitive_singular! };
};
const timeEn = (v: number) => (v > HALF ? `${numberEn(hourOf(v - HALF - 1))} thirty` : `${numberEn(v)} o'clock`);

/** An hour later, or earlier, on the clock (twelve and one wrap round). */
function clockHour(count: number, rng: Rng): MathProblem {
  const from = int(1, 12, rng);
  const later = rng() < 0.6;
  const to = hourOf(later ? from + 1 : from - 1);
  const { ask, tell } = clockMoveFrame(later ? 'later' : 'earlier', hourForms(), numberWord(to), timeEn(to));
  const near = [hourOf(to - 1), hourOf(to + 1), hourOf(to + 2), hourOf(to - 2)].filter((v) => v !== to);
  return {
    key: `clock:${later ? 'later' : 'earlier'}:${from}`,
    ask: [clockSaid(numberWord(from), timeEn(from)), ask],
    tell,
    answer: to,
    options: shuffle([to, ...[...new Set(near)].slice(0, count - 1)], rng),
    show: { kind: 'clock', from: [from, 0], to: [to, 0] },
  };
}

/**
 * Half an hour later: from three it's "puoli neljä" — half TO four. The
 * trap is the hour itself ("puoli kolme" is half past two), so it's a choice.
 */
function clockHalf(count: number, rng: Rng): MathProblem {
  const from = int(1, 12, rng);
  const next = hourOf(from + 1);
  const answer = HALF + next;
  const { ask, tell } = clockMoveFrame('half-later', hourForms(), timeWord(answer), timeEn(answer));
  const options = shuffle([answer, HALF + from, HALF + hourOf(from + 2), next].slice(0, Math.max(2, count)), rng);
  const words = Object.fromEntries(options.map((v) => [v, timeWord(v)]));
  return {
    key: `clock:half:${from}`,
    ask: [clockSaid(numberWord(from), timeEn(from)), ask],
    tell,
    answer,
    options,
    show: { kind: 'clock', from: [from, 0], to: [from, 30] },
    words,
  };
}

// --- Word problems ------------------------------------------------------------------

const ALL_NOUNS: LexicalItem[] = [...food.items, ...freetime.items, ...school.items, ...places.items];
const nounById = (id: string) => ALL_NOUNS.find((n) => n.id === id);

/** The word frames a child can be given: only verbs the course has taught. */
export function framesFor(knownVerbs: ReadonlySet<string>): WordFrame[] {
  return WORD_FRAMES.filter((f) => !f.verb || knownVerbs.has(f.verb));
}

function wordFromFrame(frame: WordFrame, count: number, rng: Rng): MathProblem {
  const noun = nounById(pick(frame.edible ? EDIBLE_THINGS : THINGS, rng))!;
  let a: number;
  let b: number;
  if (frame.op === 'plus') {
    b = int(frame.bMin, 5, rng);
    a = int(1, 10 - b, rng);
  } else {
    // something always left: a > b
    a = int(frame.bMin + 1, 10, rng);
    b = int(frame.bMin, a - 1, rng);
  }
  return wordProblemFor(frame, noun, a, b, optionsFor(frame.op === 'plus' ? a + b : a - b, count, 0, 10, rng));
}

/** A word problem from its frame, thing and numbers (with these choices). */
export function wordProblemFor(frame: WordFrame, noun: LexicalItem, a: number, b: number, options: number[] = []): MathProblem {
  const c = frame.op === 'plus' ? a + b : a - b;
  const { ask, tell } = wordProblem(frame, {
    a: numberWord(a),
    b: numberWord(b),
    c: numberWord(c),
    nounA: countingNounForm(noun, a),
    nounB: countingNounForm(noun, b),
    nounC: countingNounForm(noun, c),
    nounPart: noun.inflections.partitive_singular ?? noun.fi,
    en: {
      a: numberEn(a),
      b: numberEn(b),
      c: numberEn(c),
      nounA: countedEn(noun, a),
      nounB: countedEn(noun, b),
      nounC: countedEn(noun, c),
      plural: pluralEn(noun),
    },
  });
  return {
    key: `${frame.id}:${noun.id}:${a}:${b}`,
    ask,
    tell,
    answer: c,
    options,
    show: { kind: frame.op, a, b },
    noun,
    frame: frame.id,
  };
}

// --- Rounds -------------------------------------------------------------------------

export interface MathRoundOptions {
  /** Choices per question (a comparison always has its two). */
  optionCount: number;
  /** For word problems: the verbs the course has taught (eat, get, give). */
  knownVerbs?: ReadonlySet<string>;
  rng?: Rng;
}

/** One problem from a set. */
export function problemFor(set: MathSet, o: MathRoundOptions): MathProblem {
  const rng = o.rng ?? Math.random;
  const n = o.optionCount;
  switch (set) {
    case 'sums-10':
      return sums(10, n, rng);
    case 'compare-12':
      return compare(12, rng);
    case 'neighbors-12':
      return neighbor(12, n, rng);
    case 'run-12':
      return run(0, 12, n, rng);
    case 'word': {
      const frames = framesFor(o.knownVerbs ?? new Set());
      return wordFromFrame(pick(frames, rng), n, rng);
    }
    case 'teens':
      return teens(n, rng);
    case 'sums-20':
      return sums(20, n, rng, 11);
    case 'run-20':
      return rng() < 0.3 ? countdown(n, rng) : run(0, 20, n, rng, false);
    case 'tens-parts':
      return tensParts(n, rng);
    case 'tens-sums':
      return tensSums(n, rng);
    case 'run-tens':
      return run(10, 100, n, rng, rng() < 0.3, 10);
    case 'times':
      return times(n, rng);
    case 'halves':
      return halves(n, rng);
    case 'shop-totals':
      return shopTotals(n, rng);
    case 'shop-pay':
      return shopPay(n, rng);
    case 'clock-hour':
      return clockHour(n, rng);
    case 'clock-half':
      return clockHalf(n, rng);
  }
}

/** A round of `count` different problems from a set. */
export function buildMathRound(set: MathSet, count: number, o: MathRoundOptions): MathProblem[] {
  const out: MathProblem[] = [];
  const seen = new Set<string>();
  for (let tries = 0; out.length < count && tries < count * 40; tries++) {
    const p = problemFor(set, o);
    if (seen.has(p.key)) continue;
    seen.add(p.key);
    out.push(p);
  }
  return out;
}

/**
 * The problem as it is said aloud. A counting run is said with its gap
 * ("kolme, neljä, …, kuusi, seitsemän"), then its question.
 */
export function spokenProblem(p: MathProblem): string {
  const s = p.show;
  const asked = p.ask.map((x) => x.fi).join(' ');
  if (s.kind !== 'run' || !s.gap) return asked;
  return `${s.values.map((v) => (v === s.missing ? '…' : numberWord(v))).join(', ')}. ${asked}`;
}

/** The second part of a teen, from its sourced word: kolme|toista. */
export function teenTail(teen: number, base: number): string {
  return numberWord(teen).slice(numberWord(base).length);
}

/** Every number a problem says (its numbers and plain-number choices) — the tests keep them sayable. */
export function valuesIn(p: MathProblem): number[] {
  const s = p.show;
  const shown =
    s.kind === 'run'
      ? s.values
      : s.kind === 'parts'
        ? [s.teen, s.base]
        : s.kind === 'half'
          ? [s.whole, s.whole / 2]
          : s.kind === 'coins'
            ? [...s.prices, s.prices.reduce((x, y) => x + y, 0)]
            : s.kind === 'clock'
              ? [s.from[0], s.to[0]]
              : s.kind === 'times'
                ? [s.a, s.b, s.a * s.b]
                : [s.a, s.b];
  // a time's own words ("puoli neljä") are checked as words, not numbers
  return [p.answer, ...p.options, ...shown].filter((v) => !p.words?.[v]);
}

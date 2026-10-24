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

import { mathWords, numbers, food, freetime, places, school } from '../content';
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

/** A sourced form of the number: its genitive ("viiden") or partitive ("viittä"). */
export function numberForm(v: number, form: 'genitive' | 'partitive'): string {
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
  | { kind: 'parts'; teen: number; base: number };

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
}

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
  | 'run-20';

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

/** A counting run of five, up (or down: the rocket counts down), one missing — never the first. */
function run(lo: number, hi: number, count: number, rng: Rng, down = rng() < 0.4): MathProblem {
  const len = 5;
  const start = int(lo, hi - len + 1, rng);
  const up = Array.from({ length: len }, (_, i) => start + i);
  const values = down ? up.reverse() : up;
  const missing = values[int(1, len - 1, rng)];
  return {
    key: `run:${values.join('-')}:${missing}`,
    ask: [MISSING],
    tell: { fi: values.map(numberWord).join(', '), en: values.map(numberEn).join(', ') },
    answer: missing,
    options: optionsFor(missing, count, lo, hi, rng),
    show: { kind: 'run', values, missing, gap: true },
  };
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
    options: optionsFor(c, count, 0, 10, rng),
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

/** Every value a problem uses (its numbers and choices) — the tests keep them sayable. */
export function valuesIn(p: MathProblem): number[] {
  const s = p.show;
  const shown =
    s.kind === 'run' ? s.values : s.kind === 'parts' ? [s.teen, s.base, 10] : [s.a, s.b];
  return [p.answer, ...p.options, ...shown];
}

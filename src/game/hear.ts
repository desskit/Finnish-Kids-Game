// "Kuuntele ja valitse" — hear a Finnish sentence, pick what it MEANT.
//
// A grammar listening game: the options are meanings that differ only by the
// part being learned — the ending ("into / in / out of the box"), the person
// ("I eat / you eat / we eat"), yes or no ("I eat / I don't eat"), now or
// yesterday, one or several. The Finnish text stays hidden until the child has
// chosen (after a wrong pick it appears, with the deciding part marked), so the
// skill is really hearing the ending — the thing that's easy to read and hard
// to catch at speaking speed.
//
// Everything is looked up: carrier sentences via sentenceFor (sourced slot
// forms), verb forms via verbForm, counted nouns via countingNounForm. The
// English is the same meta-text the other games show.

import type { Construction, LexicalItem, PersonId, Polarity, VerbTense } from '../content/types';
import {
  PERSONS,
  countingNounForm,
  englishSentenceFor,
  formFor,
  sentenceFor,
  suitsSlot,
  verbForm,
} from '../content/types';
import { englishVerbClause } from '../content/englishVerb';
import { caseSegments, possessiveSegments, verbSegments, type Segment } from '../content/endings';
import { formMeaning, whyForConstruction, whyForVerb, type Why } from '../content/why';
import { grammarSrsId } from './srs';
import { sample, shuffle, weightedSample } from '../util/shuffle';
import { isCountable } from '../content/semantics';
import type { VerbCombo } from './adapt';
import type { WeighFn } from './round';

export interface HearOption {
  id: string;
  /** The meaning, in English. */
  en: string;
  /** A picture for it, when there is one ("🐱🐱🐱" for counting). */
  emoji?: string;
}

export interface HearQuestion {
  /** What is said aloud (Finnish). Shown only once the child has chosen. */
  fi: string;
  /** The same sentence with the deciding part marked. */
  segments: Segment[];
  options: HearOption[];
  answerId: string;
  /** The rule behind the right meaning. */
  why: Why;
  /** For each wrong meaning: what the child would have heard instead. */
  whyFor: Record<string, Why>;
  /** Spaced-repetition credit: the word, and the grammar (carrier) when there is one. */
  attemptId?: string;
  grammarId?: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// --- Carriers: the same word in the step's different sentence patterns ---------

/** "Kissa menee |laatikkoon|." — the carrier with the slot's ending marked. */
export function carrierSegments(con: Construction, item: LexicalItem): Segment[] {
  const form = formFor(item, con) ?? item.fi;
  const slot = con.possessor
    ? possessiveSegments(form, con.possessor)
    : con.verb
      ? [{ text: form }]
      : caseSegments(form, con.case, con.number === 'plural');
  return [
    ...(con.before ? [{ text: `${con.before} ` }] : []),
    ...slot,
    ...(con.after ? [{ text: ` ${con.after}` }] : []),
    ...(con.punct ? [{ text: con.punct }] : []),
  ];
}

function carrierQuestion(
  item: LexicalItem,
  target: Construction,
  set: readonly Construction[],
  optionCount: number,
  items: readonly LexicalItem[],
): HearQuestion | null {
  const fits = set.filter((c) => formFor(item, c) && suitsSlot(item, c));
  const right = englishSentenceFor(item, target);
  // One meaning per distinct English (tykkään / pidän both say "I like…").
  const seen = new Set([right]);
  const wrong: Construction[] = [];
  for (const c of shuffle(fits.filter((c) => c.id !== target.id))) {
    const en = englishSentenceFor(item, c);
    if (seen.has(en) || sentenceFor(item, c) === sentenceFor(item, target)) continue;
    seen.add(en);
    wrong.push(c);
  }
  const picked = wrong.slice(0, Math.max(1, optionCount - 1));
  // Fewer patterns than tiles: fill with the same pattern and another word,
  // so the whole sentence has to be heard.
  const others = shuffle(
    items.filter(
      (i) => i.id !== item.id && formFor(i, target) && suitsSlot(i, target) && !seen.has(englishSentenceFor(i, target)),
    ),
  ).slice(0, Math.max(0, optionCount - 1 - picked.length));
  if (picked.length + others.length === 0) return null;
  const heard = formFor(item, target)!;
  const meaning = target.possessor || target.verb ? undefined : formMeaning(item, heard);
  const youHeard = `You heard *${sentenceFor(item, target)}*${meaning ? ` — *${heard}* is ${meaning}` : ''}.`;
  const whyFor: Record<string, Why> = {};
  for (const c of picked) {
    whyFor[c.id] = {
      text: `${youHeard} "${englishSentenceFor(item, c)}" would sound like *${sentenceFor(item, c)}*.`,
      example: carrierSegments(target, item),
    };
  }
  for (const o of others) {
    whyFor[`w:${o.id}`] = {
      text: `${youHeard} "${englishSentenceFor(o, target)}" would sound like *${sentenceFor(o, target)}*.`,
      example: carrierSegments(target, item),
    };
  }
  return {
    fi: sentenceFor(item, target),
    segments: carrierSegments(target, item),
    options: shuffle([
      ...[target, ...picked].map((c) => ({ id: c.id, en: englishSentenceFor(item, c), emoji: item.emoji })),
      ...others.map((o) => ({ id: `w:${o.id}`, en: englishSentenceFor(o, target), emoji: o.emoji })),
    ]),
    answerId: target.id,
    why: whyForConstruction(target, item),
    whyFor,
    attemptId: item.id,
    grammarId: grammarSrsId(target.id),
  };
}

/** Hear a carrier sentence; the wrong meanings are the step's OTHER patterns. */
export function buildCarrierHearRound(
  items: readonly LexicalItem[],
  constructions: readonly Construction[],
  questionCount: number,
  optionCount: number,
  weigh?: WeighFn,
): HearQuestion[] {
  // Words that fit two or more of the patterns contrast them; with a single
  // pattern (or a word only one fits), other words fill the tiles.
  const pairs: { item: LexicalItem; con: Construction }[] = [];
  for (const con of constructions) {
    for (const item of items) {
      if (formFor(item, con) && suitsSlot(item, con)) pairs.push({ item, con });
    }
  }
  const contrasting = pairs.filter(({ item, con }) =>
    constructions.some((c) => c.id !== con.id && formFor(item, c) && suitsSlot(item, c)),
  );
  // Prefer the grammar contrast whenever the step has one.
  const pool = constructions.length > 1 && contrasting.length >= questionCount ? contrasting : pairs;
  const out: HearQuestion[] = [];
  const used = new Set<string>();
  for (const { item, con } of weightedSample(pool, Math.min(pool.length, questionCount * 3), weigh && ((p) => weigh(p.item)))) {
    if (out.length >= questionCount) break;
    const key = `${item.id}|${con.id}`;
    if (used.has(key)) continue;
    const q = carrierQuestion(item, con, constructions, optionCount, items);
    if (!q) continue;
    used.add(key);
    out.push(q);
  }
  return out;
}

// --- Verbs: who, yes or no, now or yesterday ------------------------------------

/** What a listener hears: the ending carries "I / you / we" (no pronoun —
 *  that's how Finnish is spoken), "hän / he" for he/she and they. */
export function spokenClause(verb: LexicalItem, tense: VerbTense, polarity: Polarity, person: PersonId): string | undefined {
  const form = verbForm(verb, tense, polarity, person);
  if (!form) return undefined;
  const pronoun = person === '3sg' ? 'hän' : person === '3pl' ? 'he' : '';
  return cap([pronoun, form].filter(Boolean).join(' ')) + '.';
}

function clauseSegments(verb: LexicalItem, tense: VerbTense, polarity: Polarity, person: PersonId): Segment[] {
  const form = verbForm(verb, tense, polarity, person)!;
  const pronoun = person === '3sg' ? 'Hän ' : person === '3pl' ? 'He ' : '';
  const segs = verbSegments(form, tense, polarity, person);
  if (!pronoun && segs.length > 0) segs[0] = { ...segs[0], text: cap(segs[0].text) };
  return [...(pronoun ? [{ text: pronoun }] : []), ...segs, { text: '.' }];
}

const englishOf = (verb: LexicalItem, tense: VerbTense, polarity: Polarity, person: PersonId) => {
  const p = PERSONS.find((x) => x.id === person)!;
  return cap(englishVerbClause(p.en, verb.en, verb.english, tense, polarity, person)) + '.';
};

interface Variant {
  tense: VerbTense;
  polarity: Polarity;
  person: PersonId;
}

const key = (v: Variant) => `${v.tense}|${v.polarity}|${v.person}`;

function verbQuestion(verb: LexicalItem, combos: readonly VerbCombo[], optionCount: number): HearQuestion | null {
  const persons = PERSONS.map((p) => p.id);
  const target: Variant = { ...sample(combos, 1)[0], person: sample(persons, 1)[0] };
  const fi = spokenClause(verb, target.tense, target.polarity, target.person);
  if (!fi) return null;
  // The contrasts worth hearing: another person in the same tense, then the
  // same person with the other yes/no or the other tense (when the step has it).
  const candidates: Variant[] = [
    ...combos
      .filter((c) => c.tense !== target.tense || c.polarity !== target.polarity)
      .map((c) => ({ ...c, person: target.person })),
    ...shuffle(persons.filter((p) => p !== target.person)).map((person) => ({
      tense: target.tense,
      polarity: target.polarity,
      person,
    })),
  ];
  const right = englishOf(verb, target.tense, target.polarity, target.person);
  const seenEn = new Set([right]);
  const seenFi = new Set([fi]);
  const wrong: Variant[] = [];
  for (const v of candidates) {
    if (wrong.length >= optionCount - 1) break;
    const en = englishOf(verb, v.tense, v.polarity, v.person);
    const said = spokenClause(verb, v.tense, v.polarity, v.person);
    if (!said || seenEn.has(en) || seenFi.has(said)) continue;
    seenEn.add(en);
    seenFi.add(said);
    wrong.push(v);
  }
  if (wrong.length === 0) return null;
  const base = whyForVerb(verb, target.tense, target.polarity, target.person);
  const rule = base.text.split('\n\n')[0];
  const whyFor: Record<string, Why> = {};
  for (const v of wrong) {
    whyFor[key(v)] = {
      text: `You heard *${fi}* — "${right}". "${englishOf(verb, v.tense, v.polarity, v.person)}" would sound like *${spokenClause(verb, v.tense, v.polarity, v.person)}*. ${rule}`,
      example: clauseSegments(verb, target.tense, target.polarity, target.person),
    };
  }
  return {
    fi,
    segments: clauseSegments(verb, target.tense, target.polarity, target.person),
    options: shuffle([target, ...wrong]).map((v) => ({
      id: key(v),
      en: englishOf(verb, v.tense, v.polarity, v.person),
      emoji: verb.emoji,
    })),
    answerId: key(target),
    why: base,
    whyFor,
    attemptId: verb.id,
  };
}

/** Hear a verb form; the wrong meanings are other persons / yes-no / tenses. */
export function buildVerbHearRound(
  verbs: readonly LexicalItem[],
  combos: readonly VerbCombo[],
  questionCount: number,
  optionCount: number,
  weigh?: WeighFn,
): HearQuestion[] {
  if (verbs.length === 0 || combos.length === 0) return [];
  const out: HearQuestion[] = [];
  const used = new Set<string>();
  for (let guard = 0; out.length < questionCount && guard < questionCount * 8; guard++) {
    const verb = weightedSample(verbs, 1, weigh)[0];
    const q = verb && verbQuestion(verb, combos, optionCount);
    if (!q || used.has(q.fi)) continue;
    used.add(q.fi);
    out.push(q);
  }
  return out;
}

// --- Counting: "kolme kissaa" — how many? ---------------------------------------

const ONLY_ONE = ['mother', 'father', 'grandmother', 'grandfather'];

/** Hear a number + thing; pick how many. Numbers up to `maxCount` that are known. */
export function buildCountHearRound(
  numbers: readonly LexicalItem[],
  nouns: readonly LexicalItem[],
  questionCount: number,
  optionCount: number,
  maxCount: number,
  weigh?: WeighFn,
): HearQuestion[] {
  const nums = numbers.filter((n) => n.value !== undefined && n.value >= 1 && n.value <= maxCount);
  // Things you'd count: not number words, not people you have just one of.
  const things = nouns.filter(
    (n) =>
      n.emoji &&
      isCountable(n.id) &&
      n.inflections.partitive_singular &&
      n.topic !== 'numbers' &&
      n.topic !== 'ordinals' &&
      !ONLY_ONE.includes(n.id),
  );
  if (nums.length < 2 || things.length === 0) return [];
  const out: HearQuestion[] = [];
  const used = new Set<string>();
  const label = (n: LexicalItem, noun: LexicalItem) =>
    `${n.value} ${n.value === 1 ? noun.en : noun.english?.plural ?? `${noun.en}s`}`;
  for (let guard = 0; out.length < questionCount && guard < questionCount * 8; guard++) {
    const num = sample(nums, 1)[0];
    const noun = weightedSample(things, 1, weigh)[0];
    const fi = `${cap(num.fi)} ${countingNounForm(noun, num.value!)}.`;
    if (used.has(fi)) continue;
    // Confusable counts first: one more, one fewer, then any.
    const near = nums.filter((n) => Math.abs(n.value! - num.value!) === 1);
    const rest = shuffle(nums.filter((n) => n !== num && !near.includes(n)));
    const wrong = [...shuffle(near), ...rest].slice(0, Math.max(1, optionCount - 1));
    const form = countingNounForm(noun, num.value!);
    const rule =
      num.value === 1
        ? 'With **one** thing, the word stays in its basic form.'
        : 'With **two or more**, the word gets **-a / -ä** (or **-ta / -tä**).';
    const segments: Segment[] = [
      { text: `${cap(num.fi)} `, mark: true },
      ...(num.value === 1 ? [{ text: form }] : caseSegments(form, 'partitive')),
      { text: '.' },
    ];
    const whyFor: Record<string, Why> = {};
    for (const w of wrong) {
      whyFor[w.id] = {
        text: `You heard *${num.fi}* — ${num.value}. ${w.value} is *${w.fi}*.`,
        example: segments,
      };
    }
    used.add(fi);
    out.push({
      fi,
      segments,
      options: shuffle([num, ...wrong]).map((n) => ({
        id: n.id,
        en: label(n, noun),
        emoji: n.value! <= 5 ? noun.emoji!.repeat(n.value!) : `${n.value} × ${noun.emoji}`,
      })),
      answerId: num.id,
      why: { text: rule, example: segments },
      whyFor,
      attemptId: num.id,
    });
  }
  return out;
}

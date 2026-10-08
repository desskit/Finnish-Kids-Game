// Lessons — the short "how it works" explanations at the start of every course
// unit, also re-readable in the Notebook.
//
// Content discipline (same golden rule as everywhere): the PROSE is authored
// English, written for a curious ~8-year-old; every FINNISH form shown as an
// example is a reference (`LessonRef`) that resolves to a looked-up form —
// sourced inflection tables (`caseFormOf`, `verbForm`, `possessiveForm`), an
// already-vetted carrier phrase (`sentenceFor`), or an already-vetted dialogue
// line. Finnish snippets inside prose are limited to words/forms that also
// appear in those sources. The ending highlighter (endings.ts) only MARKS the
// ending of a looked-up form; it never produces one.

import type {
  CaseId,
  GrammaticalNumber,
  PersonId,
  Polarity,
  PossessorId,
  VerbTense,
} from './types';
import {
  caseFormOf,
  countingNounForm,
  englishSentenceFor,
  formFor,
  PERSONS,
  possessiveForm,
  possessiveGloss,
  verbForm,
} from './types';
import { nounConstructions } from './constructions';
import { commandFor, dontForm, letsForm, ownerGloss } from './types';
import { questionFor } from './questions';
import { PRONOUNS, PRONOUN_FRAMES, type PronounCase } from './pronouns';
import { dialogues, personalizeLine } from './dialogues';
import { numbers } from './index';
import { itemById } from './lookup';
import { gradation, markGradation, typeSegments, verbType } from './verbTypes';
import { englishVerbClause } from './englishVerb';
import { ageSentence, dateEnglish, dateFi, dateSegments, yearsWord } from './dates';
import {
  comparisonEnglish,
  comparisonSegments,
  degreeEnglish,
  degreeForm,
  degreeSegments,
  superlativeEnglish,
  superlativeSegments,
  type Degree,
} from './compare';
import {
  caseSegments,
  dontSegments,
  letsSegments,
  possessiveSegments,
  pronounSegments,
  questionSegments,
  segmentsText,
  verbSegments,
  type Segment,
} from './endings';

// --- Types --------------------------------------------------------------------

export type LessonRef =
  /** A word, optionally in a case: shows "base → form" with the ending marked. */
  | { word: string; case?: CaseId; number?: GrammaticalNumber; en?: string }
  /** A whole carrier sentence. `asCase` deliberately uses the WRONG case (only
   *  for the wrong options of a `check` card). */
  | { sentence: string; word: string; asCase?: CaseId; verbAs?: '1sg'; en?: string }
  /** A pronoun + conjugated verb ("minä syön"). */
  | { verb: string; tense: VerbTense; polarity: Polarity; person: PersonId; en?: string }
  /** A possessive form ("kirjani"). */
  | { possessive: string; possessor: PossessorId; case?: CaseId; en?: string }
  /** A number + counted noun ("kaksi kirjaa"); `wrong` keeps the noun in the
   *  basic form (a wrong option for a `check`). */
  | { count: number; word: string; wrong?: boolean; en?: string }
  /** Adjective + noun agreeing in a case; `adjCase` breaks agreement (wrong option). */
  | { agree: string; word: string; case: CaseId; adjCase?: CaseId; en?: string }
  /** A vetted dialogue line. */
  | { line: string; part: 'prompt' | 'reply' }
  /** A yes/no question with a verb ("Syötkö?" — questions.ts). */
  | { ask: string; en?: string }
  /** A command: do it ("Juokse!"), don't ("Älä juokse!") or let's ("Juostaan!"). */
  | { mood: string; kind: 'do' | 'dont' | 'lets'; en?: string }
  /** A pronoun form ("minua", "minulle" — pronouns.ts). */
  | { pronoun: PersonId; case: PronounCase; en?: string }
  /** A pronoun sentence frame filled ("Auta minua!"); `case` = a wrong option. */
  | { frame: string; person: PersonId; case?: PronounCase; en?: string }
  /** An owner + a thing ("isän pyörä"); `wrong` = a learner slip, for checks. */
  | { owner: string; thing: string; wrong?: 'basic' | 'has'; en?: string }
  /** A KPT verb: "nukkua → minä nukun", the changing consonants marked in both
   *  (sourced forms; present tense, `person` default "minä"). */
  | { kpt: string; person?: PersonId; en?: string }
  /** A verb's infinitive with the ending that shows its TYPE marked ("laulaa"). */
  | { vtype: string; en?: string }
  /** An adjective at a degree: "iso → isompi" (comparative) / "iso → isoin". */
  | { degree: string; d: Degree; en?: string }
  /** "Norsu on isompi kuin hiiri." (`a` is more than `b`). */
  | { compare: string; a: string; b: string; en?: string }
  /** "Norsu on isoin." */
  | { most: string; a: string; en?: string }
  /** A date: "viides toukokuuta" (ordinal id + month id); `wrong` = a slip
   *  (the plain number, or the month in its basic form), for checks. */
  | { date: string; month: string; wrong?: 'number' | 'month'; en?: string }
  /** "Olen kahdeksan vuotta vanha." (number id). */
  | { age: string; en?: string };

export type LessonCard =
  | { kind: 'explain'; title?: string; text: string }
  | { kind: 'examples'; title?: string; text?: string; rows: LessonRef[] }
  | {
      kind: 'verbTable';
      title?: string;
      text?: string;
      verb: string;
      tense: VerbTense;
      polarity: Polarity;
    }
  /** Set-phrase pairs: what someone SAYS → what you SAY BACK (vetted dialogue
   *  exchanges by id). Teaches "what comes after what" before any game asks. */
  | { kind: 'pairs'; title?: string; text?: string; ids: string[] }
  | {
      kind: 'check';
      title?: string;
      question: string;
      /** A listening check: a 🔊 button plays this; the options are written
       *  forms to pick from ("which one did you hear?"). */
      listen?: LessonRef;
      options: { ref?: LessonRef; text?: string; correct?: boolean }[];
      explain: string;
    };

export interface Lesson {
  id: string;
  titleFi: string;
  titleEn: string;
  emoji: string;
  cards: LessonCard[];
}

/** A resolved example, ready to render. */
export interface ResolvedRef {
  segments: Segment[];
  /** The plain form, when the row shows "base → form". */
  base?: string;
  /** The base with a part marked (a KPT verb's infinitive) — shown in place of `base`. */
  baseSegments?: Segment[];
  en?: string;
  emoji?: string;
  /** What 🔊 says. */
  speak: string;
}

// --- Resolution -------------------------------------------------------------------

function sentenceSegments(
  before: string | undefined,
  slot: Segment[],
  after: string | undefined,
  punct: string | undefined,
): Segment[] {
  const out: Segment[] = [];
  if (before) out.push({ text: before + ' ' });
  out.push(...slot);
  if (after) out.push({ text: ' ' + after });
  if (punct) out.push({ text: punct });
  return out;
}

/**
 * Resolve a reference to looked-up Finnish. Returns null when a form is
 * missing (the lessons test asserts every authored reference resolves).
 */
export function resolveRef(ref: LessonRef, childName = ''): ResolvedRef | null {
  if ('line' in ref) {
    const ex = dialogues.find((d) => d.id === ref.line);
    if (!ex) return null;
    const l = personalizeLine(ex[ref.part], childName);
    return { segments: [{ text: l.fi }], en: l.en, speak: l.fi };
  }
  if ('ask' in ref) {
    const verb = itemById(ref.ask);
    const q = verb && questionFor(verb);
    if (!verb || !q) return null;
    const segs = [...questionSegments(q.slice(0, -1)), { text: '?' }];
    segs[0] = { ...segs[0], text: segs[0].text.charAt(0).toUpperCase() + segs[0].text.slice(1) };
    return { segments: segs, en: ref.en ?? `Do you ${verb.en}?`, emoji: verb.emoji, speak: segmentsText(segs) };
  }
  if ('mood' in ref) {
    const verb = itemById(ref.mood);
    if (!verb) return null;
    const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
    let segs: Segment[] | null = null;
    let en = '';
    if (ref.kind === 'do') {
      const f = commandFor(verb);
      if (f) segs = [{ text: f }];
      en = `${cap(verb.en)}!`;
    } else if (ref.kind === 'dont') {
      const f = dontForm(verb);
      if (f) segs = [...dontSegments(cap(f)), { text: '!' }];
      en = `Don't ${verb.en}!`;
    } else {
      const f = letsForm(verb);
      if (f) segs = [...letsSegments(cap(f)), { text: '!' }];
      en = `Let's ${verb.en}!`;
    }
    if (!segs) return null;
    return { segments: segs, en: ref.en ?? en, emoji: verb.emoji, speak: segmentsText(segs) };
  }
  if ('pronoun' in ref) {
    const forms = PRONOUNS[ref.pronoun];
    if (!forms) return null;
    const segs = pronounSegments(forms[ref.case], ref.case);
    return { segments: segs, base: ref.case === 'nominative' ? undefined : forms.nominative, en: ref.en, speak: segmentsText(segs) };
  }
  if ('frame' in ref) {
    const frame = PRONOUN_FRAMES.find((f) => f.id === ref.frame);
    if (!frame) return null;
    const c = ref.case ?? frame.case;
    const segs = [
      { text: frame.before + ' ' },
      ...pronounSegments(PRONOUNS[ref.person][c], c),
      { text: frame.punct },
    ];
    return {
      segments: segs,
      en: ref.en ?? (ref.case ? undefined : frame.en.replace('___', PRONOUNS[ref.person].enObject)),
      speak: segmentsText(segs),
    };
  }
  if ('owner' in ref) {
    const owner = itemById(ref.owner);
    const thing = itemById(ref.thing);
    if (!owner || !thing) return null;
    const ownerForm =
      ref.wrong === 'basic'
        ? owner.fi
        : caseFormOf(owner, ref.wrong === 'has' ? 'adessive' : 'genitive', 'singular');
    if (!ownerForm) return null;
    const segs: Segment[] = [
      ...(ref.wrong ? [{ text: ownerForm }] : caseSegments(ownerForm, 'genitive')),
      { text: ` ${thing.fi}` },
    ];
    const gloss = ownerGloss(owner, thing);
    return {
      segments: segs,
      en: ref.en ?? (ref.wrong ? undefined : gloss.charAt(0).toUpperCase() + gloss.slice(1)),
      emoji: thing.emoji,
      speak: segmentsText(segs),
    };
  }
  if ('sentence' in ref) {
    const con = nounConstructions.find((c) => c.id === ref.sentence);
    const item = itemById(ref.word);
    if (!con || !item) return null;
    const c = ref.asCase ?? con.case;
    const form = ref.verbAs
      ? verbForm(item, 'present', 'positive', ref.verbAs)
      : ref.asCase
        ? caseFormOf(item, c, con.number)
        : formFor(item, con);
    if (!form) return null;
    const slot =
      con.possessor && !ref.asCase
        ? possessiveSegments(form, con.possessor)
        : caseSegments(form, c, con.number === 'plural');
    const segs = sentenceSegments(con.before, slot, con.after, con.punct);
    return {
      segments: segs,
      en: ref.en ?? (ref.asCase || ref.verbAs ? undefined : englishSentenceFor(item, con)),
      emoji: item.emoji,
      speak: segmentsText(segs),
    };
  }
  if ('kpt' in ref) {
    const verb = itemById(ref.kpt);
    const person = ref.person ?? '1sg';
    const p = PERSONS.find((x) => x.id === person);
    const g = verb && gradation(verb);
    const form = verb && verbForm(verb, 'present', 'positive', person);
    if (!verb || !p || !g || !form) return null;
    const segs = [{ text: p.fi + ' ' }, ...markGradation(form, g)];
    return {
      segments: segs,
      base: verb.fi,
      baseSegments: markGradation(verb.fi, g),
      en: ref.en ?? englishVerbClause(p.en, verb.en, verb.english, 'present', 'positive', person),
      emoji: verb.emoji,
      speak: segmentsText(segs),
    };
  }
  if ('degree' in ref) {
    const adj = itemById(ref.degree);
    const form = adj && degreeForm(adj, ref.d);
    if (!adj || !form) return null;
    const segs = degreeSegments(form, ref.d);
    return {
      segments: segs,
      base: ref.d === 'base' ? undefined : adj.fi,
      en: ref.en ?? degreeEnglish(adj, ref.d),
      emoji: adj.emoji,
      speak: segmentsText(segs),
    };
  }
  if ('compare' in ref) {
    const adj = itemById(ref.compare);
    const a = itemById(ref.a);
    const b = itemById(ref.b);
    const segs = adj && a && b && comparisonSegments(adj, a, b);
    if (!segs) return null;
    return { segments: segs, en: ref.en ?? comparisonEnglish(adj!, a!, b!), emoji: `${a!.emoji ?? ''}${b!.emoji ?? ''}`, speak: segmentsText(segs) };
  }
  if ('most' in ref) {
    const adj = itemById(ref.most);
    const a = itemById(ref.a);
    const segs = adj && a && superlativeSegments(adj, a);
    if (!segs) return null;
    return { segments: segs, en: ref.en ?? superlativeEnglish(adj!, a!), emoji: a!.emoji, speak: segmentsText(segs) };
  }
  if ('date' in ref) {
    const ord = itemById(ref.date);
    const month = itemById(ref.month);
    if (!ord || !month) return null;
    let segs: Segment[] | undefined;
    if (ref.wrong === 'number') {
      const num = numbers.items.find((n) => n.value === ord.value);
      const f = num && dateFi(num, month);
      segs = f ? [{ text: f }] : undefined;
    } else if (ref.wrong === 'month') {
      const f = dateFi(ord, month, 'nominative');
      segs = f ? [{ text: f }] : undefined;
    } else segs = dateSegments(ord, month);
    if (!segs) return null;
    return { segments: segs, en: ref.en ?? (ref.wrong ? undefined : `the ${dateEnglish(ord, month).split(' ')[1]} of ${month.en}`), emoji: '📅', speak: segmentsText(segs) };
  }
  if ('age' in ref) {
    const num = itemById(ref.age);
    const years = yearsWord();
    const f = num && ageSentence(num, years);
    if (!num || !f || !years) return null;
    const segs: Segment[] = [{ text: `Olen ${num.fi} ` }, { text: years, mark: true }, { text: ' vanha.' }];
    return { segments: segs, en: ref.en ?? `I'm ${num.value} years old.`, emoji: '🎂', speak: segmentsText(segs) };
  }
  if ('vtype' in ref) {
    const verb = itemById(ref.vtype);
    const t = verb && verbType(verb);
    if (!verb || !t) return null;
    const segs = typeSegments(verb.fi, t);
    return { segments: segs, en: ref.en ?? `to ${verb.en} · type ${t}`, emoji: verb.emoji, speak: verb.fi };
  }
  if ('verb' in ref) {
    const verb = itemById(ref.verb);
    const p = PERSONS.find((x) => x.id === ref.person);
    if (!verb || !p) return null;
    const form = verbForm(verb, ref.tense, ref.polarity, ref.person);
    if (!form) return null;
    const segs = [
      { text: p.fi + ' ' },
      ...verbSegments(form, ref.tense, ref.polarity, ref.person),
    ];
    return { segments: segs, en: ref.en, emoji: verb.emoji, speak: segmentsText(segs) };
  }
  if ('possessive' in ref) {
    const item = itemById(ref.possessive);
    if (!item) return null;
    const c = ref.case ?? 'nominative';
    const form = possessiveForm(item, ref.possessor, c);
    if (!form) return null;
    return {
      segments: possessiveSegments(form, ref.possessor),
      base: item.fi,
      en: ref.en ?? possessiveGloss(item, ref.possessor, c),
      emoji: item.emoji,
      speak: form,
    };
  }
  if ('count' in ref) {
    const noun = itemById(ref.word);
    const num = numbers.items.find((n) => n.value === ref.count);
    if (!noun || !num) return null;
    const nounForm = ref.wrong ? noun.fi : countingNounForm(noun, ref.count);
    const segs: Segment[] = [
      { text: num.fi + ' ' },
      ...(ref.count > 1 && !ref.wrong ? caseSegments(nounForm, 'partitive') : [{ text: nounForm }]),
    ];
    const enNoun = ref.count === 1 ? noun.en : (noun.english?.plural ?? noun.en);
    return {
      segments: segs,
      en: ref.en ?? (ref.wrong ? undefined : `${num.en} ${enNoun}`),
      emoji: noun.emoji,
      speak: segmentsText(segs),
    };
  }
  if ('agree' in ref) {
    const adj = itemById(ref.agree);
    const noun = itemById(ref.word);
    if (!adj || !noun) return null;
    const a = caseFormOf(adj, ref.adjCase ?? ref.case, 'singular');
    const n = caseFormOf(noun, ref.case, 'singular');
    if (!a || !n) return null;
    const segs = [
      ...caseSegments(a, ref.adjCase ?? ref.case),
      { text: ' ' },
      ...caseSegments(n, ref.case),
    ];
    return { segments: segs, en: ref.en, emoji: noun.emoji, speak: segmentsText(segs) };
  }
  // Plain word (optionally inflected).
  const item = itemById(ref.word);
  if (!item) return null;
  const c = ref.case ?? 'nominative';
  const number = ref.number ?? 'singular';
  const form = caseFormOf(item, c, number);
  if (!form) return null;
  const changed = c !== 'nominative' || number === 'plural';
  return {
    segments: caseSegments(form, c, number === 'plural'),
    base: changed ? item.fi : undefined,
    en: ref.en ?? (number === 'plural' ? (item.english?.plural ?? item.en) : item.en),
    emoji: item.emoji,
    speak: form,
  };
}

// --- The lessons --------------------------------------------------------------------
//
// Prose markup (rendered by LessonView): **bold**, *Finnish word* (italic), a
// blank line between paragraphs, and lines starting "- " as a bullet list.

export const lessons: Lesson[] = [
  {
    id: 'sounds',
    titleFi: 'Miltä suomi kuulostaa?',
    titleEn: 'How Finnish sounds',
    emoji: '👂',
    cards: [
      {
        kind: 'explain',
        title: 'Read it like it\'s written',
        text:
          'Finnish is one of the easiest languages in the world to read out loud. **Every letter always makes the same sound**, and you say every letter you see. No silent letters, like the k in English "knee"!\n\nAnd you always press on the **first part** of a word: KIR-ja, PÖY-tä, O-pet-ta-ja. Say the rest lightly.',
      },
      {
        kind: 'examples',
        title: 'Double letters are long',
        text:
          'When a letter is written **twice**, you hold that sound longer — a vowel *or* a consonant. That can change the whole word! Listen to all three:',
        rows: [
          { word: 'fire', en: 'fire — short u, one l' },
          { word: 'wind', en: 'wind — long uu' },
          { word: 'customs', en: 'customs (at the border) — long ll' },
        ],
      },
      {
        kind: 'examples',
        title: 'Three new letters',
        text:
          '- **ä** sounds like the a in "cat"\n- **ö** sounds a bit like the u in "fur"\n- **y** is "ee" said with round lips',
        rows: [{ word: 'mother' }, { word: 'table' }, { word: 'pencil' }],
      },
      {
        kind: 'pairs',
        title: 'What do you say back?',
        text:
          'Greetings come in **pairs**: someone says the first line, and you answer with the second. Tap 🔊 and say both out loud.',
        ids: ['good-morning', 'how-are-you', 'thanks', 'here-you-go', 'sorry', 'goodbye', 'good-night'],
      },
      {
        kind: 'pairs',
        title: 'Saying who you are',
        text:
          'When you meet someone new. Look at *nimesi* and *nimeni*: *nimi* means **name**, and the ending says whose — **-si** = your, **-ni** = my. (More about these endings in the "Whose?" unit.)',
        ids: ['your-name', 'how-old', 'nice-to-meet', 'thanks-food'],
      },
      {
        kind: 'check',
        question: '**Kuuntele!** Tap 🔊 — which word do you hear? Listen for the long sound.',
        listen: { word: 'wind' },
        options: [
          { ref: { word: 'fire' } },
          { ref: { word: 'wind' }, correct: true },
          { ref: { word: 'customs' } },
        ],
        explain: 'You heard *tuuli*: the **uu** is held long. *tuli* is short all the way, and *tulli* holds the **l** instead.',
      },
      {
        kind: 'check',
        question: 'Someone says *Hyvää yötä!* What do you say back?',
        options: [
          { ref: { line: 'good-night', part: 'reply' }, correct: true },
          { ref: { line: 'good-morning', part: 'reply' } },
          { ref: { line: 'sorry', part: 'reply' } },
        ],
        explain: '*Hyvää yötä!* (good night) is answered with the same words: *Hyvää yötä!*',
      },
      {
        kind: 'check',
        question: 'Which letter sounds like the a in "cat"?',
        options: [{ text: 'a' }, { text: 'ä', correct: true }, { text: 'ö' }],
        explain: '**ä** is the "cat" sound — like in *äiti*.',
      },
    ],
  },
  {
    id: 'no-articles',
    titleFi: 'Ei "a" eikä "the"',
    titleEn: 'No "a", no "the"',
    emoji: '👉',
    cards: [
      {
        kind: 'explain',
        title: 'Two words Finnish doesn\'t need',
        text:
          'English keeps putting little words in front of things: **a** book, **the** book.\n\nFinnish has **no word for "a" or "the"** at all. *kirja* means "a book" or "the book" — you just say the word.',
      },
      {
        kind: 'examples',
        title: '"This is…"',
        text: '*Tämä on* means **this is**. *on* is a tiny word you will see everywhere — it means **is**.',
        rows: [
          { sentence: 'this-is', word: 'book' },
          { sentence: 'this-is', word: 'teacher' },
          { sentence: 'this-is', word: 'backpack' },
        ],
      },
      {
        kind: 'examples',
        title: 'Asking with -ko',
        text:
          'To ask a yes-or-no question, put *on* first and stick **-ko** on it: *Onko*. That\'s it — no "do" or "does" needed.',
        rows: [
          { sentence: 'is-this', word: 'book' },
          { sentence: 'is-this', word: 'pencil' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one is a QUESTION?',
        options: [
          { ref: { sentence: 'this-is', word: 'clock' } },
          { ref: { sentence: 'is-this', word: 'clock' }, correct: true },
        ],
        explain: '*Onko* at the start — with its **-ko** — turns it into a question.',
      },
      {
        kind: 'check',
        question: 'How do you say "a teacher" in Finnish?',
        options: [{ text: 'a opettaja' }, { ref: { word: 'teacher' }, correct: true }],
        explain: 'No "a" in Finnish — just *opettaja*.',
      },
    ],
  },
  {
    id: 'counting',
    titleFi: 'Laskeminen',
    titleEn: 'Counting',
    emoji: '🔢',
    cards: [
      {
        kind: 'examples',
        title: 'One to twelve',
        text: 'Eleven and twelve are "one-of-the-second-ten" and "two-of-the-second-ten": *yksitoista*, *kaksitoista*.',
        rows: [
          { word: 'one' },
          { word: 'two' },
          { word: 'three' },
          { word: 'four' },
          { word: 'five' },
          { word: 'six' },
          { word: 'seven' },
          { word: 'eight' },
          { word: 'nine' },
          { word: 'ten' },
          { word: 'eleven' },
          { word: 'twelve' },
        ],
      },
      {
        kind: 'explain',
        title: 'One, or more than one?',
        text:
          'With **one** thing, the word stays just as it is: *yksi kirja*.\n\nWith **two or more**, Finnish adds a little ending: **-a** or **-ä** (a few words take **-ta / -tä** instead). And the word stays singular — no "-s" like in English!',
      },
      {
        kind: 'examples',
        title: 'Spot the ending',
        rows: [
          { count: 1, word: 'book' },
          { count: 2, word: 'book' },
          { count: 3, word: 'friend' },
          { count: 5, word: 'picture' },
        ],
      },
      {
        kind: 'examples',
        title: '-a or -ä?',
        text:
          'Look at the vowels in the word. Words with **a, o, u** take **-a**. Words with **ä, ö, y** take **-ä**. This "vowel team" rule comes back again and again in Finnish.',
        rows: [
          { count: 4, word: 'book' },
          { count: 4, word: 'pencil' },
        ],
      },
      {
        kind: 'check',
        question: 'How do you say "two books"?',
        options: [
          { ref: { count: 2, word: 'book', wrong: true } },
          { ref: { count: 2, word: 'book' }, correct: true },
        ],
        explain: 'Two or more → the word gets **-a**: *kirjaa*.',
      },
      {
        kind: 'check',
        question: 'How do you say "three friends"?',
        options: [
          { ref: { count: 3, word: 'friend' }, correct: true },
          { ref: { count: 3, word: 'friend', wrong: true } },
        ],
        explain: 'Three is more than one → **-a**: *kaveria*.',
      },
    ],
  },
  {
    id: 'having',
    titleFi: 'Minulla on',
    titleEn: 'How to say "I have"',
    emoji: '🎒',
    cards: [
      {
        kind: 'explain',
        title: 'There\'s no verb "to have"',
        text:
          'In English you say *I have a bike*. Finnish has **no verb for "have"**!\n\nInstead it says something like **"on me is a bike"**: *Minulla on pyörä*.',
      },
      {
        kind: 'examples',
        title: 'On me, on you',
        text:
          'The **-lla / -llä** ending means "on". So *minulla* — on me → **I have**, and *sinulla* — on you → **you have**.',
        rows: [
          { sentence: 'i-have', word: 'bike' },
          { sentence: 'you-have', word: 'phone' },
          { sentence: 'i-have', word: 'dog' },
        ],
      },
      {
        kind: 'explain',
        title: 'The thing stays as it is',
        text: 'After *on*, the thing keeps its **basic form**: *pyörä*, *puhelin*, *koira* — and no "a" in front.',
      },
      {
        kind: 'check',
        question: '*Sinulla on pallo.* — Who has the ball?',
        options: [{ text: 'I do' }, { text: 'You do', correct: true }],
        explain: '*sinulla* = "on you" → **you** have the ball.',
      },
      {
        kind: 'check',
        question: 'Which one means "I have a dog"?',
        options: [
          { ref: { sentence: 'i-have', word: 'dog' }, correct: true },
          { ref: { sentence: 'you-have', word: 'dog' } },
        ],
        explain: '*minulla* = "on me" → **I** have.',
      },
    ],
  },
  {
    id: 'having-everyone',
    titleFi: 'Kenellä on?',
    titleEn: 'Who has it? Everyone!',
    emoji: '👪',
    cards: [
      {
        kind: 'explain',
        title: 'Everyone gets -lla / -llä',
        text:
          '- *minulla* → **I** have\n- *sinulla* → **you** have\n- *hänellä* → **he / she** has\n- *meillä* → **we** have\n- *teillä* → **you all** have\n- *heillä* → **they** have',
      },
      {
        kind: 'examples',
        title: 'Listen',
        rows: [
          { sentence: 'she-has', word: 'guitar' },
          { sentence: 'we-have', word: 'dog' },
          { sentence: 'they-have', word: 'computer' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "we have a dog"?',
        options: [
          { ref: { sentence: 'i-have', word: 'dog' } },
          { ref: { sentence: 'we-have', word: 'dog' }, correct: true },
          { ref: { sentence: 'they-have', word: 'dog' } },
        ],
        explain: '*meillä* = "on us" → **we** have.',
      },
      {
        kind: 'check',
        question: '*Hänellä on kitara.* — Who has the guitar?',
        options: [{ text: 'I do' }, { text: 'He or she does', correct: true }, { text: 'They do' }],
        explain: '*hänellä* = "on him / her".',
      },
    ],
  },
  {
    id: 'negation-object',
    titleFi: 'Minulla ei ole',
    titleEn: 'Saying you don\'t have it',
    emoji: '🚫',
    cards: [
      {
        kind: 'explain',
        title: '"is" becomes "is not"',
        text: 'To say you **don\'t** have something, *on* (is) becomes **ei ole** (is not).',
      },
      {
        kind: 'examples',
        title: 'And the word changes too!',
        text:
          'Here\'s the surprise: when you say you DON\'T have something, the thing gets the **-a / -ä** ending — the same one you met after numbers.',
        rows: [
          { sentence: 'i-have', word: 'hat' },
          { sentence: 'i-havent', word: 'hat' },
          { sentence: 'i-have', word: 'coat' },
          { sentence: 'i-havent', word: 'coat' },
        ],
      },
      {
        kind: 'explain',
        title: 'Why?',
        text:
          'Finnish uses **-a / -ä** when something is *not all there* — "none of it", "some of it", "more than one". You\'ll keep meeting this ending, so it\'s worth remembering!',
      },
      {
        kind: 'check',
        question: 'Which one means "I don\'t have a shoe"?',
        options: [
          { ref: { sentence: 'i-havent', word: 'shoe', asCase: 'nominative' } },
          { ref: { sentence: 'i-havent', word: 'shoe' }, correct: true },
        ],
        explain: 'After *ei ole*, the thing takes **-a / -ä**: *kenkää*.',
      },
      {
        kind: 'check',
        question: '*Minulla on hattu.* — Do I have a hat?',
        options: [{ text: 'Yes', correct: true }, { text: 'No' }],
        explain: '*on* means "is" — so yes! For "no" it would be *ei ole* … *hattua*.',
      },
    ],
  },
  {
    id: 'verb-persons',
    titleFi: 'Kuka tekee?',
    titleEn: 'Verbs tell you WHO',
    emoji: '🏃',
    cards: [
      {
        kind: 'explain',
        title: 'The end of the verb says who',
        text:
          'In English: I eat, you eat, we eat — the verb hardly changes.\n\nIn Finnish, **the end of the verb tells you who is doing it**. That\'s why Finns often skip *minä* (I): *Syön.* already means "I eat".',
      },
      {
        kind: 'examples',
        title: 'Verbs come in families',
        text:
          'Finnish verbs belong to **types** (families). Look at the END of the "to…" word to see which one:\n\n- **Type 1** ends in two vowels: *laulaa*, *puhua*\n- **Type 2** ends in **-da / -dä**: *syödä*\n- **Type 3** ends in **-lla, -nna, -sta**: *tulla*, *mennä*',
        rows: [{ vtype: 'sing' }, { vtype: 'eat' }, { vtype: 'come' }],
      },
      {
        kind: 'examples',
        title: 'Each family makes "I…" its own way',
        text:
          '- **Type 1**: drop the last letter → *laula-* + **n**\n- **Type 2**: drop **-da / -dä** → *syö-* + **n**\n- **Type 3**: drop **-la, -na, -ta** (or -lä, -nä, -tä), add **e** → *tule-* + **n**\n\n*juosta* is a special one — learn it as it is: *juoksen*.',
        rows: [
          { verb: 'sing', tense: 'present', polarity: 'positive', person: '1sg' },
          { verb: 'eat', tense: 'present', polarity: 'positive', person: '1sg' },
          { verb: 'come', tense: 'present', polarity: 'positive', person: '1sg' },
          { verb: 'run', tense: 'present', polarity: 'positive', person: '1sg' },
        ],
      },
      {
        kind: 'explain',
        title: 'The six endings — the same for every family',
        text:
          '- **-n** → I\n- **-t** → you\n- (the last vowel doubles: *laulaa*, *tulee*; if it\'s already long, nothing changes: *syö*) → he / she\n- **-mme** → we\n- **-tte** → you all\n- **-vat / -vät** → they',
      },
      {
        kind: 'verbTable',
        title: 'tulla — to come',
        text: 'The marked ending is the "who" part.',
        verb: 'come',
        tense: 'present',
        polarity: 'positive',
      },
      {
        kind: 'check',
        question: 'Which one means "we swim"?',
        options: [
          { ref: { verb: 'swim', tense: 'present', polarity: 'positive', person: '1sg' } },
          {
            ref: { verb: 'swim', tense: 'present', polarity: 'positive', person: '1pl' },
            correct: true,
          },
          { ref: { verb: 'swim', tense: 'present', polarity: 'positive', person: '3pl' } },
        ],
        explain: '**-mme** means "we".',
      },
      {
        kind: 'check',
        question: 'Which family is *mennä* (to go)?',
        options: [{ text: 'Type 1' }, { text: 'Type 2' }, { text: 'Type 3', correct: true }],
        explain: '*mennä* ends in **-nna** — two consonants and a vowel: **type 3** (*menen*).',
      },
    ],
  },
  {
    id: 'kpt-1-3',
    titleFi: 'K, P ja T vaihtuvat',
    titleEn: 'When k, p and t change',
    emoji: '🔀',
    cards: [
      {
        kind: 'explain',
        title: 'A letter in the MIDDLE can change',
        text:
          'Some verbs change a sound in the middle, not just the ending. It happens to **k**, **p** and **t** — Finns call it **KPT**.\n\nIn type 1 the "to…" word has the STRONG sound (*nukkua*), and "I" gets the WEAK one (*nukun*): **kk → k**, **tt → t**, **pp → p**.',
      },
      {
        kind: 'examples',
        title: 'Strong → weak',
        text: 'The marked letters are the ones that change.',
        rows: [{ kpt: 'sleep' }, { kpt: 'play' }, { kpt: 'write' }, { kpt: 'help' }],
      },
      {
        kind: 'examples',
        title: 'He, she and they stay STRONG',
        text:
          'Only **I, you, we, you all** get the weak sound. **He / she** and **they** keep the strong one: *minä nukun* but *hän nukkuu*.',
        rows: [
          { kpt: 'sleep', person: '1sg' },
          { kpt: 'sleep', person: '2sg' },
          { kpt: 'sleep', person: '3sg' },
          { kpt: 'sleep', person: '3pl' },
        ],
      },
      {
        kind: 'examples',
        title: 'Other changes',
        text: '**rt → rr**: *piirtää → piirrän*. And a **k** can disappear: *lukea → luen*.',
        rows: [{ kpt: 'draw' }, { kpt: 'read' }],
      },
      {
        kind: 'examples',
        title: 'Type 3 goes the other way round',
        text:
          'In type 3 the "to…" word has the WEAK sound, and every person gets the STRONG one: *kuunnella → kuuntelen, kuuntelee*.',
        rows: [
          { kpt: 'listen', person: '1sg' },
          { kpt: 'listen', person: '3sg' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "I sleep"?',
        options: [
          { ref: { kpt: 'sleep', person: '1sg' }, correct: true },
          { ref: { verb: 'sleep', tense: 'present', polarity: 'positive', person: '3sg' } },
          { ref: { verb: 'sleep', tense: 'present', polarity: 'positive', person: '2sg' } },
        ],
        explain: '"I" is **-n**, with the weak **k**: *nukun*. *nukkuu* is he/she — strong **kk**.',
      },
      {
        kind: 'check',
        question: 'Which one means "she writes"?',
        options: [
          { ref: { verb: 'write', tense: 'present', polarity: 'positive', person: '1sg' } },
          { ref: { kpt: 'write', person: '3sg' }, correct: true },
          { ref: { verb: 'write', tense: 'present', polarity: 'positive', person: '1pl' } },
        ],
        explain: 'He / she keeps the strong **tt**: *kirjoittaa*.',
      },
    ],
  },
  {
    id: 'negative-verb',
    titleFi: 'En tee',
    titleEn: '"Not" is a verb',
    emoji: '✋',
    cards: [
      {
        kind: 'explain',
        title: 'A "no" word that changes',
        text:
          'In English, "not" never changes. In Finnish, the **"not" word is a little verb** that changes for each person — and the main verb stays short.',
      },
      {
        kind: 'verbTable',
        title: 'syödä — not eating',
        text: 'The marked word is the "not" verb.',
        verb: 'eat',
        tense: 'present',
        polarity: 'negative',
      },
      {
        kind: 'explain',
        title: 'Same endings as before!',
        text:
          '*en, et, ei, emme, ette, eivät* — look: **-n** for I, **-t** for you, **-mme** for we… the "who" endings moved onto the "not" word. The main verb loses its ending: *syön* → *en syö*.',
      },
      {
        kind: 'check',
        question: 'Which one means "you don\'t sleep"?',
        options: [
          {
            ref: { verb: 'sleep', tense: 'present', polarity: 'negative', person: '2sg' },
            correct: true,
          },
          { ref: { verb: 'sleep', tense: 'present', polarity: 'positive', person: '2sg' } },
          { ref: { verb: 'sleep', tense: 'present', polarity: 'negative', person: '3sg' } },
        ],
        explain: '*et* = "you … not" (the **-t** means you).',
      },
      {
        kind: 'check',
        question: 'Which one means "they don\'t sing"?',
        options: [
          { ref: { verb: 'sing', tense: 'present', polarity: 'negative', person: '3pl' }, correct: true },
          { ref: { verb: 'sing', tense: 'present', polarity: 'positive', person: '3pl' } },
          { ref: { verb: 'sing', tense: 'present', polarity: 'negative', person: '1pl' } },
        ],
        explain: '*eivät* = "they … not", and the main verb stays short.',
      },
    ],
  },
  {
    id: 'likes',
    titleFi: 'Tykkään',
    titleEn: 'Liking things',
    emoji: '❤️',
    cards: [
      {
        kind: 'explain',
        title: 'Every verb picks an ending',
        text:
          'In Finnish, the **verb decides which ending** the next word gets. You just have to learn each verb\'s favorite.',
      },
      {
        kind: 'examples',
        title: 'tykätä → -sta / -stä',
        text:
          '"I like" is *tykkään*, and the thing you like always gets **-sta / -stä** (it really means "from").',
        rows: [
          { sentence: 'i-like-tykkaan', word: 'football' },
          { sentence: 'i-like-tykkaan', word: 'pizza' },
          { sentence: 'i-like-tykkaan', word: 'music' },
          { sentence: 'i-like-tykkaan', word: 'ice-cream' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "I like music"?',
        options: [
          { ref: { sentence: 'i-like-tykkaan', word: 'music' }, correct: true },
          { ref: { sentence: 'i-like-tykkaan', word: 'music', asCase: 'partitive' } },
        ],
        explain: '*tykkään* always takes **-sta / -stä**: *musiikista*.',
      },
      {
        kind: 'check',
        question: 'Which one means "I like ice cream"?',
        options: [
          { ref: { sentence: 'i-like-tykkaan', word: 'ice-cream', asCase: 'nominative' } },
          { ref: { sentence: 'i-like-tykkaan', word: 'ice-cream' }, correct: true },
        ],
        explain: '**-stä** with the vowel team ä, ö, y: *jäätelöstä*.',
      },
    ],
  },
  {
    id: 'liking-pidan',
    titleFi: 'Pidän',
    titleEn: 'Another "I like"',
    emoji: '🤝',
    cards: [
      {
        kind: 'explain',
        title: 'Two ways to say "I like"',
        text:
          '*Tykkään* is what friends say every day. *Pidän* means the same thing; you\'ll hear it at school and read it in books. The good news: **both take -sta / -stä**.',
      },
      {
        kind: 'examples',
        title: 'Same ending, both ways',
        rows: [
          { sentence: 'i-like-tykkaan', word: 'pizza' },
          { sentence: 'i-like', word: 'pizza' },
          { sentence: 'i-like-tykkaan', word: 'cat' },
          { sentence: 'i-like', word: 'cat' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "I like football"?',
        options: [
          { ref: { sentence: 'i-like', word: 'football' }, correct: true },
          { ref: { sentence: 'i-like', word: 'football', asCase: 'partitive' } },
        ],
        explain: '*pidän* takes **-sta** too, just like *tykkään*: *jalkapallosta*.',
      },
    ],
  },
  {
    id: 'loving',
    titleFi: 'Rakastan',
    titleEn: 'Loving things',
    emoji: '😍',
    cards: [
      {
        kind: 'examples',
        title: 'rakastaa → -a / -ä',
        text:
          '"I love" is *rakastan* — and it picks a DIFFERENT ending: **-a / -ä**, or **-ta / -tä** after a long vowel, like *suklaata*.',
        rows: [
          { sentence: 'i-love', word: 'pizza' },
          { sentence: 'i-love', word: 'chocolate' },
          { sentence: 'i-love', word: 'cat' },
        ],
      },
      {
        kind: 'explain',
        title: 'Two verbs, two endings',
        text: '- *Tykkään* / *Pidän* (I like) → **-sta**: *Tykkään pitsasta.*\n- *Rakastan* (I love) → **-a**: *Rakastan pitsaa.*',
      },
      {
        kind: 'check',
        question: 'Which one means "I love pizza"?',
        options: [
          { ref: { sentence: 'i-love', word: 'pizza' }, correct: true },
          { ref: { sentence: 'i-love', word: 'pizza', asCase: 'elative' } },
        ],
        explain: '*rakastan* wants **-a**: *pitsaa*. (**-sta** is for *tykkään* and *pidän*.)',
      },
      {
        kind: 'check',
        question: 'Which one means "I like pizza"?',
        options: [
          { ref: { sentence: 'i-like-tykkaan', word: 'pizza' }, correct: true },
          { ref: { sentence: 'i-love', word: 'pizza' } },
        ],
        explain: '*Tykkään* = I like (+ **-sta**). *Rakastan* = I love.',
      },
    ],
  },
  {
    id: 'total-object',
    titleFi: 'Näen',
    titleEn: 'Seeing the whole thing',
    emoji: '👀',
    cards: [
      {
        kind: 'explain',
        title: 'Another verb, another ending',
        text:
          '*Näen* means **I see**. When you see the **whole thing**, it gets **-n** — the same little ending as in *isän pyörä*, but here it means "the whole thing".',
      },
      {
        kind: 'examples',
        title: 'The whole thing: -n',
        rows: [
          { sentence: 'i-see', word: 'bus' },
          { sentence: 'i-see', word: 'train' },
          { sentence: 'i-see', word: 'teacher' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "I see the car"?',
        options: [
          { ref: { sentence: 'i-see', word: 'car' }, correct: true },
          { ref: { sentence: 'i-see', word: 'car', asCase: 'nominative' } },
        ],
        explain: 'Seeing the whole car → **-n**: *auton*.',
      },
      {
        kind: 'check',
        question: '*Näen bussin.* — Which ending does "bus" have?',
        options: [{ text: '-n', correct: true }, { text: '-a' }, { text: '-ssa' }],
        explain: 'Seeing the whole bus → **-n**: *bussin*.',
      },
    ],
  },
  {
    id: 'watching-waiting',
    titleFi: 'Katson ja odotan',
    titleEn: 'Watching and waiting',
    emoji: '⏳',
    cards: [
      {
        kind: 'examples',
        title: 'Going on for a while: -a / -ä',
        text:
          '*katsoa* (to watch) and *odottaa* (to wait for) **take a while** — so the thing always gets **-a / -ä**, never **-n**.',
        rows: [
          { sentence: 'i-watch', word: 'movie' },
          { sentence: 'i-wait-for', word: 'bus' },
          { sentence: 'i-wait-for', word: 'friend' },
        ],
      },
      {
        kind: 'explain',
        title: 'See it, or watch it?',
        text: '- *Näen bussin.* — I see the bus (one look → **-n**)\n- *Odotan bussia.* — I\'m waiting for the bus (it takes a while → **-a**)',
      },
      {
        kind: 'check',
        question: 'Which one means "I\'m waiting for the train"?',
        options: [
          { ref: { sentence: 'i-wait-for', word: 'train', asCase: 'genitive' } },
          { ref: { sentence: 'i-wait-for', word: 'train' }, correct: true },
        ],
        explain: 'Waiting goes on for a while → **-a**: *junaa*.',
      },
      {
        kind: 'check',
        question: 'Which one means "I see the train"?',
        options: [
          { ref: { sentence: 'i-see', word: 'train' }, correct: true },
          { ref: { sentence: 'i-wait-for', word: 'train' } },
        ],
        explain: '*Näen junan* — seeing it once → **-n**.',
      },
      {
        kind: 'examples',
        title: 'One word, four verbs',
        text:
          'The VERB decides the ending — so look at the verb first: *tykkään* → **-sta**, *rakastan* → **-a**, *näen* → **-n**, *odotan* → **-a**.',
        rows: [
          { sentence: 'i-like-tykkaan', word: 'dog' },
          { sentence: 'i-love', word: 'dog' },
          { sentence: 'i-see', word: 'dog' },
          { sentence: 'i-wait-for', word: 'dog' },
        ],
      },
    ],
  },
  {
    id: 'buying',
    titleFi: 'Kaupassa',
    titleEn: 'Buying one whole thing',
    emoji: '🛒',
    cards: [
      {
        kind: 'explain',
        title: 'Like seeing',
        text:
          '*Ostan* means **I buy**. It works just like *Näen*: buying **one whole thing** — an apple, a banana — it gets **-n**.',
      },
      {
        kind: 'examples',
        title: 'One whole thing: -n',
        rows: [
          { sentence: 'i-buy', word: 'apple' },
          { sentence: 'i-buy', word: 'banana' },
          { sentence: 'i-buy', word: 'cake' },
        ],
      },
      {
        kind: 'check',
        question: '*Ostan omenan.* — How many apples?',
        options: [{ text: 'One whole apple', correct: true }, { text: 'Some apple' }],
        explain: '**-n** (*omenan*) means one whole thing.',
      },
      {
        kind: 'check',
        question: 'Which one means "I buy a banana"?',
        options: [
          { ref: { sentence: 'i-buy', word: 'banana' }, correct: true },
          { ref: { sentence: 'i-buy', word: 'banana', asCase: 'nominative' } },
        ],
        explain: 'One whole banana → **-n**: *banaanin*.',
      },
    ],
  },
  {
    id: 'buying-some',
    titleFi: 'Ostan maitoa',
    titleEn: 'Buying some of something',
    emoji: '🥛',
    cards: [
      {
        kind: 'examples',
        title: 'Some of something: -a / -ä',
        text:
          'Milk, bread, juice — you don\'t buy "one milk", you buy **some**. Then it gets **-a / -ä**. (Remember: **-a** means "not all of it".)',
        rows: [
          { sentence: 'i-buy-some', word: 'milk' },
          { sentence: 'i-buy-some', word: 'bread' },
          { sentence: 'i-buy-some', word: 'juice' },
        ],
      },
      {
        kind: 'explain',
        title: 'One apple — some milk',
        text: '- *Ostan omenan.* — one whole apple (**-n**)\n- *Ostan maitoa.* — some milk (**-a**)',
      },
      {
        kind: 'check',
        question: '*Ostan maitoa.* — How much milk?',
        options: [{ text: 'Some milk', correct: true }, { text: 'One whole milk' }],
        explain: '**-a** (*maitoa*) means "some of it".',
      },
      {
        kind: 'check',
        question: 'Which one means "I buy some bread"?',
        options: [
          { ref: { sentence: 'i-buy-some', word: 'bread' }, correct: true },
          { ref: { sentence: 'i-buy-some', word: 'bread', asCase: 'genitive' } },
        ],
        explain: 'Some bread → **-ä**: *leipää*.',
      },
    ],
  },
  {
    id: 'colors',
    titleFi: 'Värit',
    titleEn: 'Colors and describing words',
    emoji: '🎨',
    cards: [
      {
        kind: 'examples',
        title: 'Colors',
        rows: [
          { word: 'red' },
          { word: 'blue' },
          { word: 'yellow' },
          { word: 'green' },
          { word: 'black' },
          { word: 'white' },
          { word: 'brown' },
        ],
      },
      {
        kind: 'examples',
        title: '"This is red"',
        text: 'A describing word works after *Tämä on* just like a thing: *Tämä on punainen* = this is red.',
        rows: [
          { sentence: 'this-is', word: 'red' },
          { sentence: 'this-is', word: 'big' },
          { sentence: 'is-this', word: 'blue' },
        ],
      },
      {
        kind: 'examples',
        title: 'Describing words go first',
        text: 'Just like English: the describing word comes **before** the thing.',
        rows: [
          { agree: 'big', word: 'dog', case: 'nominative', en: 'a big dog' },
          { agree: 'red', word: 'ball', case: 'nominative', en: 'a red ball' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "This is green"?',
        options: [
          { ref: { sentence: 'this-is', word: 'green' }, correct: true },
          { ref: { sentence: 'this-is', word: 'yellow' } },
        ],
        explain: '*vihreä* = green, *keltainen* = yellow.',
      },
      {
        kind: 'check',
        question: 'Which one means "a big dog"?',
        options: [
          { ref: { agree: 'big', word: 'dog', case: 'nominative' }, correct: true },
          { ref: { agree: 'small', word: 'dog', case: 'nominative' } },
        ],
        explain: '*iso* = big, *pieni* = small.',
      },
    ],
  },
  {
    id: 'agreement',
    titleFi: 'Millainen?',
    titleEn: 'Describing words copy',
    emoji: '🪞',
    cards: [
      {
        kind: 'examples',
        title: 'They copy the ending!',
        text:
          'This is the cool part: whatever ending the thing gets, the **describing word gets it too** — like an echo.',
        rows: [
          { agree: 'big', word: 'house', case: 'inessive', en: 'in a big house' },
          { agree: 'small', word: 'dog', case: 'genitive', en: "a small dog's" },
          { agree: 'big', word: 'table', case: 'adessive', en: 'on a big table' },
        ],
      },
      {
        kind: 'explain',
        title: 'Listen for the echo',
        text: '*isossa talossa* — **-ssa** twice. *isolla pöydällä* — **-lla** twice. If the thing has an ending, the describing word has it too.',
      },
      {
        kind: 'check',
        question: 'Which one means "in a big house"?',
        options: [
          { ref: { agree: 'big', word: 'house', case: 'inessive', adjCase: 'nominative' } },
          { ref: { agree: 'big', word: 'house', case: 'inessive' }, correct: true },
        ],
        explain: 'Both words get the ending: *isossa talossa*.',
      },
      {
        kind: 'check',
        question: 'Which one means "of a red ball" (it takes -n)?',
        options: [
          { ref: { agree: 'red', word: 'ball', case: 'genitive' }, correct: true },
          { ref: { agree: 'red', word: 'ball', case: 'genitive', adjCase: 'nominative' } },
        ],
        explain: 'Both words take **-n**: *punaisen pallon*.',
      },
    ],
  },
  {
    id: 'in-on',
    titleFi: 'Missä?',
    titleEn: 'Endings instead of "in" and "on"',
    emoji: '📍',
    cards: [
      {
        kind: 'examples',
        title: 'No word for "in"',
        text:
          'English puts a little word **in front**: *in the box*. Finnish puts an **ending at the back**: **-ssa / -ssä** means "in".',
        rows: [
          { word: 'box', case: 'inessive', en: 'in the box' },
          { word: 'house', case: 'inessive', en: 'in the house' },
          { word: 'school', case: 'inessive', en: 'at school' },
        ],
      },
      {
        kind: 'examples',
        title: '"On" is -lla / -llä',
        rows: [
          { word: 'table', case: 'adessive', en: 'on the table' },
          { word: 'chair', case: 'adessive', en: 'on the chair' },
          { word: 'bed', case: 'adessive', en: 'on the bed' },
        ],
      },
      {
        kind: 'examples',
        title: 'The vowel team again',
        text:
          'Words with **a, o, u** → *-ssa, -lla*. Words with **ä, ö, y** → *-ssä, -llä*. Look at *talossa* vs. *metsässä*.',
        rows: [
          { word: 'house', case: 'inessive', en: 'in the house' },
          { word: 'forest', case: 'inessive', en: 'in the forest' },
          { word: 'table', case: 'adessive', en: 'on the table' },
        ],
      },
      {
        kind: 'explain',
        title: 'Look at the END',
        text:
          'Sometimes the middle of a word changes a little too (*laatikko* → *laatikossa*). Don\'t worry — **the ending at the very end is what tells you "in" or "on"**.',
      },
      {
        kind: 'check',
        question: 'The cat is ON the table. Which is right?',
        options: [
          { ref: { sentence: 'on-it', word: 'table' }, correct: true },
          { ref: { sentence: 'on-it', word: 'table', asCase: 'inessive' } },
        ],
        explain: '"On" → **-lla / -llä**: *pöydällä*.',
      },
      {
        kind: 'check',
        question: 'The cat is IN the house. Which is right?',
        options: [
          { ref: { sentence: 'in-it', word: 'house' }, correct: true },
          { ref: { sentence: 'in-it', word: 'house', asCase: 'adessive' } },
        ],
        explain: '"In" → **-ssa**: *talossa*.',
      },
    ],
  },
  {
    id: 'in-my-house',
    titleFi: 'Talossani',
    titleEn: 'In MY house',
    emoji: '🏠',
    cards: [
      {
        kind: 'explain',
        title: 'Two endings on one word',
        text:
          'Remember the "my" ending **-ni** and the "your" ending **-si**? They go on the very end — **after** the place ending:\n\n*talo* + **-ssa** + **-ni** = *talossani*, "in my house".',
      },
      {
        kind: 'examples',
        title: 'In my…, on your…',
        rows: [
          { possessive: 'house', possessor: '1sg', case: 'inessive' },
          { possessive: 'room', possessor: '2sg', case: 'inessive' },
          { possessive: 'table', possessor: '1sg', case: 'adessive' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "in my house"?',
        options: [
          { ref: { possessive: 'house', possessor: '1sg', case: 'inessive' }, correct: true },
          { ref: { possessive: 'house', possessor: '2sg', case: 'inessive' } },
          { ref: { possessive: 'house', possessor: '1sg' } },
        ],
        explain: '**-ssa** (in) + **-ni** (my): *talossani*.',
      },
      {
        kind: 'check',
        question: 'Which one means "on your table"?',
        options: [
          { ref: { possessive: 'table', possessor: '2sg', case: 'adessive' }, correct: true },
          { ref: { possessive: 'table', possessor: '1sg', case: 'adessive' } },
        ],
        explain: '**-llä** (on) + **-si** (your): *pöydälläsi*.',
      },
    ],
  },
  {
    id: 'into-out',
    titleFi: 'Mihin?',
    titleEn: 'Going into, going onto',
    emoji: '🚶',
    cards: [
      {
        kind: 'explain',
        title: 'Where is it GOING?',
        text:
          '- *Missä?* — where is it? (**in / on**) — you know this one!\n- *Mihin?* — where is it **going**? (**into / onto**)\n\nGoing somewhere has its own endings.',
      },
      {
        kind: 'examples',
        title: 'Going INSIDE',
        text: '"Into" is a long vowel + **n** (*laatikkoon*, *taloon*) — or **-seen** (*huoneeseen*). Short words like *puu* (tree) take **h** + vowel + **n**: *puuhun*.',
        rows: [
          { sentence: 'in-it', word: 'box' },
          { sentence: 'into-it', word: 'box' },
          { sentence: 'into-it', word: 'house' },
        ],
      },
      {
        kind: 'examples',
        title: 'Going ON TOP',
        text: '"Onto" is **-lle** — like "on" (**-lla**), with an **e**.',
        rows: [
          { sentence: 'on-it', word: 'table' },
          { sentence: 'onto-it', word: 'table' },
          { sentence: 'onto-it', word: 'chair' },
        ],
      },
      {
        kind: 'check',
        question: 'The cat goes INTO the box. Which is right?',
        options: [
          { ref: { sentence: 'into-it', word: 'box' }, correct: true },
          { ref: { sentence: 'into-it', word: 'box', asCase: 'inessive' } },
        ],
        explain: '"Into" → a long vowel + **n**: *laatikkoon*.',
      },
      {
        kind: 'check',
        question: 'The cat goes ONTO the table. Which is right?',
        options: [
          { ref: { sentence: 'onto-it', word: 'table' }, correct: true },
          { ref: { sentence: 'onto-it', word: 'table', asCase: 'adessive' } },
        ],
        explain: '"Onto" → **-lle**: *pöydälle*.',
      },
    ],
  },
  {
    id: 'out-of-off',
    titleFi: 'Mistä?',
    titleEn: 'Coming out of, coming off',
    emoji: '📦',
    cards: [
      {
        kind: 'explain',
        title: 'Where is it coming FROM?',
        text: '*Mistä?* — where is it **coming from**? (**out of / off**). Two more endings:',
      },
      {
        kind: 'examples',
        title: 'Out of: -sta / -stä · Off: -lta / -ltä',
        rows: [
          { sentence: 'out-of-it', word: 'box' },
          { sentence: 'out-of-it', word: 'house' },
          { sentence: 'off-it', word: 'table' },
          { sentence: 'off-it', word: 'chair' },
        ],
      },
      {
        kind: 'explain',
        title: 'All six together',
        text:
          '**Inside:** -ssa (in) · -an, -oon, -seen… (into) · -sta (out of)\n\n**On top:** -lla (on) · -lle (onto) · -lta (off)\n\nNotice: **s** for inside, **l** for on top!',
      },
      {
        kind: 'check',
        question: 'The cat comes OUT OF the box. Which is right?',
        options: [
          { ref: { sentence: 'out-of-it', word: 'box', asCase: 'illative' } },
          { ref: { sentence: 'out-of-it', word: 'box' }, correct: true },
          { ref: { sentence: 'out-of-it', word: 'box', asCase: 'inessive' } },
        ],
        explain: '"Out of" → **-sta / -stä**: *laatikosta*.',
      },
      {
        kind: 'check',
        question: 'The cat jumps OFF the table. Which is right?',
        options: [
          { ref: { sentence: 'off-it', word: 'table' }, correct: true },
          { ref: { sentence: 'off-it', word: 'table', asCase: 'allative' } },
        ],
        explain: '"Off" → **-lta / -ltä**: *pöydältä*.',
      },
    ],
  },
  {
    id: 'postpositions',
    titleFi: 'Edessä, takana',
    titleEn: 'Position words come after',
    emoji: '🧭',
    cards: [
      {
        kind: 'explain',
        title: 'Back to front',
        text:
          'English: *under the chair*. Finnish: *tuolin alla* — "the chair\'s under".\n\nThe position word comes **after**, and the thing gets **-n**.',
      },
      {
        kind: 'explain',
        title: 'Four position words',
        text:
          '- *edessä* — in front of\n- *takana* — behind\n- *vieressä* — next to\n- *alla* — under',
      },
      {
        kind: 'examples',
        title: 'Listen',
        rows: [
          { sentence: 'in-front-of', word: 'house' },
          { sentence: 'behind', word: 'tree' },
          { sentence: 'next-to', word: 'friend' },
          { sentence: 'under', word: 'table' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "behind the tree"?',
        options: [
          { ref: { sentence: 'behind', word: 'tree' }, correct: true },
          { ref: { sentence: 'behind', word: 'tree', asCase: 'nominative' } },
        ],
        explain: 'Before a position word, the thing gets **-n**: *puun takana*.',
      },
      {
        kind: 'examples',
        title: 'In a whole sentence',
        rows: [
          { sentence: 'is-under', word: 'chair' },
          { sentence: 'is-behind', word: 'tree' },
          { sentence: 'is-next-to', word: 'teacher' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "under the table"?',
        options: [
          { ref: { sentence: 'under', word: 'table' }, correct: true },
          { ref: { sentence: 'under', word: 'table', asCase: 'nominative' } },
        ],
        explain: 'Before *alla*, the thing gets **-n**: *pöydän alla*.',
      },
    ],
  },
  {
    id: 'possessive',
    titleFi: 'Kenen?',
    titleEn: '"My" is an ending',
    emoji: '🙋',
    cards: [
      {
        kind: 'examples',
        title: 'Endings for my, your, their',
        text:
          'Finnish can stick "my" and "your" onto the **end** of a word:\n- **-ni** → my\n- **-si** → your\n- **-nsa / -nsä** → his / her / their',
        rows: [
          { possessive: 'book', possessor: '1sg' },
          { possessive: 'book', possessor: '2sg' },
          { possessive: 'book', possessor: '3rd' },
        ],
      },
      {
        kind: 'explain',
        title: 'You\'ll hear the pronoun too',
        text:
          'People often say both: *minun kirjani* (my book), *sinun kirjasi* (your book), *hänen kirjansa* (his/her book). **The ending is the part to listen for.**',
      },
      {
        kind: 'examples',
        title: 'You already know one!',
        text:
          'Remember *Nimeni on…* from the very first unit? *nimeni* is **my name** — *nimi* + **-ni**. It works on any word:',
        rows: [
          { possessive: 'mother', possessor: '1sg' },
          { possessive: 'friend', possessor: '1sg' },
          { possessive: 'dog', possessor: '2sg' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "your bike"?',
        options: [
          { ref: { possessive: 'bike', possessor: '1sg' } },
          { ref: { possessive: 'bike', possessor: '2sg' }, correct: true },
          { ref: { possessive: 'bike', possessor: '3rd' } },
        ],
        explain: '**-si** means "your".',
      },
      {
        kind: 'examples',
        title: 'In a sentence',
        rows: [
          { sentence: 'this-is-mine', word: 'book' },
          { sentence: 'this-is-yours', word: 'bike' },
          { sentence: 'this-is-theirs', word: 'backpack' },
        ],
      },
      {
        kind: 'check',
        question: '*Tämä on sinun kirjasi.* — Whose book is it?',
        options: [{ text: 'Mine' }, { text: 'Yours', correct: true }, { text: 'Theirs' }],
        explain: '*sinun* + **-si** = your.',
      },
    ],
  },
  {
    id: 'plurals',
    titleFi: 'Monta',
    titleEn: 'More than one',
    emoji: '👐',
    cards: [
      {
        kind: 'examples',
        title: 'The -t means "more than one"',
        text: 'For a group of things — *the books*, *the balls* — add **-t**.',
        rows: [
          { word: 'book', number: 'plural' },
          { word: 'ball', number: 'plural' },
          { word: 'friend', number: 'plural' },
        ],
      },
      {
        kind: 'explain',
        title: '"These are…" and "Where are…?"',
        text: 'With more than one, *on* (is) becomes *ovat* (are): *Nämä ovat…* = these are, *Missä ovat…?* = where are…?',
      },
      {
        kind: 'check',
        question: '*kirjat* means…',
        options: [{ text: 'a book' }, { text: 'the books', correct: true }],
        explain: 'The **-t** means more than one.',
      },
      {
        kind: 'check',
        question: 'Which one means "the friends"?',
        options: [
          { ref: { word: 'friend', number: 'plural' }, correct: true },
          { ref: { word: 'friend' } },
        ],
        explain: '*kaveri* + **-t** = *kaverit*.',
      },
    ],
  },
  {
    id: 'plural-some',
    titleFi: 'Palloja',
    titleEn: 'Some things, any things',
    emoji: '🧺',
    cards: [
      {
        kind: 'examples',
        title: '"Some" things',
        text:
          'When you mean **some** or **any** (not a fixed group), Finnish uses a different plural ending: **-ja / -jä** (*palloja*), **-ia / -iä** (*koiria*) or **-ita / -itä** (*veneitä*). It\'s the plural cousin of the **-a** ending!',
        rows: [
          { sentence: 'these-are', word: 'book' },
          { sentence: 'i-have-some', word: 'ball' },
          { sentence: 'i-havent-any', word: 'game' },
        ],
      },
      {
        kind: 'explain',
        title: 'The balls — or some balls?',
        text: '- *pallot* — **the** balls (that group) → **-t**\n- *palloja* — **some** balls → **-ja**',
      },
      {
        kind: 'check',
        question: 'Which one means "I have some balls"?',
        options: [
          { ref: { sentence: 'i-have', word: 'ball' } },
          { ref: { sentence: 'i-have-some', word: 'ball' }, correct: true },
        ],
        explain: '"Some" balls → *palloja*.',
      },
      {
        kind: 'check',
        question: '*Minulla ei ole pelejä.* means…',
        options: [{ text: "I don't have any games", correct: true }, { text: 'I have some games' }],
        explain: '*ei ole* = not, and "any games" → *pelejä*.',
      },
    ],
  },
  {
    id: 'plural-places',
    titleFi: 'Laatikoissa',
    titleEn: 'In many boxes',
    emoji: '📦',
    cards: [
      {
        kind: 'examples',
        title: 'In many things: -issa',
        text: 'Place endings work in the plural too — an **-i-** slips in before them: *laatikossa* (in the box) → *laatikoissa* (in the boxes).',
        rows: [
          { sentence: 'in-it', word: 'box' },
          { sentence: 'in-them', word: 'box' },
        ],
      },
      {
        kind: 'explain',
        title: 'Look for the -i-',
        text: '*talossa* → *taloissa* · *repussa* → *repuissa*. The **i** says "more than one", the **-ssa** still says "in".',
      },
      {
        kind: 'check',
        question: 'Which one means "The cats are in the boxes"?',
        options: [
          { ref: { sentence: 'in-them', word: 'box' }, correct: true },
          { ref: { sentence: 'in-them', word: 'box', asCase: 'adessive' } },
        ],
        explain: '**-i-** + **-ssa** = in the boxes: *laatikoissa*.',
      },
      {
        kind: 'check',
        question: '*laatikoissa* means…',
        options: [{ text: 'in the box' }, { text: 'in the boxes', correct: true }],
        explain: 'The **-i-** means more than one.',
      },
    ],
  },
  {
    id: 'past',
    titleFi: 'Eilen',
    titleEn: 'Talking about yesterday',
    emoji: '⏮️',
    cards: [
      {
        kind: 'explain',
        title: 'Slip in an -i-',
        text:
          'To say something **already happened**, Finnish slips an **-i-** into the verb, just before the "who" ending: *syön* (I eat) → *söin* (I ate). Sometimes a vowel changes too — listen for the **i**. Type 4 verbs get **-si-**: *haluan → halusin*.',
      },
      {
        kind: 'verbTable',
        title: 'syödä — ate',
        verb: 'eat',
        tense: 'past',
        polarity: 'positive',
      },
      {
        kind: 'examples',
        title: 'The k, p, t changes come along',
        text: 'Verbs whose sound changes still do it in the past: *minä nukuin* (weak), *hän nukkui* (strong) — just like *nukun* and *nukkuu*.',
        rows: [
          { verb: 'sleep', tense: 'past', polarity: 'positive', person: '1sg' },
          { verb: 'sleep', tense: 'past', polarity: 'positive', person: '3sg' },
          { verb: 'jump', tense: 'past', polarity: 'positive', person: '1sg' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "I read" (yesterday)?',
        options: [
          { ref: { verb: 'read', tense: 'present', polarity: 'positive', person: '1sg' } },
          {
            ref: { verb: 'read', tense: 'past', polarity: 'positive', person: '1sg' },
            correct: true,
          },
        ],
        explain: 'The **-i-** shows the past: *luin*.',
      },
      {
        kind: 'check',
        question: 'Which one means "we ate"?',
        options: [
          { ref: { verb: 'eat', tense: 'past', polarity: 'positive', person: '1pl' }, correct: true },
          { ref: { verb: 'eat', tense: 'present', polarity: 'positive', person: '1pl' } },
          { ref: { verb: 'eat', tense: 'past', polarity: 'positive', person: '3pl' } },
        ],
        explain: 'Past **-i-** + **-mme** (we): *söimme*.',
      },
    ],
  },
  {
    id: 'past-not',
    titleFi: 'En syönyt',
    titleEn: '"Didn\'t"',
    emoji: '🙅',
    cards: [
      {
        kind: 'explain',
        title: 'The "not" verb + -nut / -nyt',
        text:
          'For "didn\'t", use the "not" verb you already know (*en, et, ei…*) plus a special form ending in **-ut / -yt**: usually *-nut / -nyt* (*en syönyt*). For we, you all and they it ends in **-eet** (*emme syöneet*).',
      },
      {
        kind: 'verbTable',
        title: 'syödä — didn\'t eat',
        verb: 'eat',
        tense: 'past',
        polarity: 'negative',
      },
      {
        kind: 'explain',
        title: 'Only two shapes',
        text: '- *en, et, ei* (I, you, he/she) + **-nut / -nyt**: *en syönyt*\n- *emme, ette, eivät* (we, you all, they) + **-neet**: *emme syöneet*\n- Some verbs use **l** or **s** instead of **n**: *en tullut* (I didn\'t come), *en juossut* (I didn\'t run).',
      },
      {
        kind: 'check',
        question: 'Which one means "I didn\'t read"?',
        options: [
          { ref: { verb: 'read', tense: 'past', polarity: 'negative', person: '1sg' }, correct: true },
          { ref: { verb: 'read', tense: 'present', polarity: 'negative', person: '1sg' } },
          { ref: { verb: 'read', tense: 'past', polarity: 'positive', person: '1sg' } },
        ],
        explain: '*en* + **-nut**: *en lukenut*. (*en lue* = I don\'t read.)',
      },
      {
        kind: 'check',
        question: 'Which one means "they didn\'t eat"?',
        options: [
          { ref: { verb: 'eat', tense: 'past', polarity: 'negative', person: '3pl' }, correct: true },
          { ref: { verb: 'eat', tense: 'past', polarity: 'negative', person: '3sg' } },
        ],
        explain: 'They → *eivät* + **-neet**: *eivät syöneet*.',
      },
    ],
  },
  {
    id: 'conversation',
    titleFi: 'Jutellaan',
    titleEn: 'Having a real conversation',
    emoji: '🗣️',
    cards: [
      {
        kind: 'explain',
        title: 'Pick what FITS',
        text:
          'In a conversation, lots of answers are good Finnish — but only one **fits** what the other person just said. Listen to their line first, then choose.',
      },
      {
        kind: 'examples',
        title: 'Polite little words',
        rows: [
          { line: 'thanks', part: 'prompt' },
          { line: 'thanks', part: 'reply' },
          { line: 'sorry', part: 'prompt' },
          { line: 'sorry', part: 'reply' },
        ],
      },
      {
        kind: 'examples',
        title: 'Asking for things',
        rows: [
          { line: 'may-i-have', part: 'prompt' },
          { line: 'can-you-help', part: 'prompt' },
          { line: 'how-much', part: 'prompt' },
        ],
      },
      {
        kind: 'explain',
        title: 'Question words',
        text:
          'Most questions start with a question word:\n- *Mitä?* — what?\n- *Missä?* — where?\n- *Kuka?* — who?\n- *Paljonko?* — how much?',
      },
      {
        kind: 'check',
        question: 'Someone says *Kiitos!* — what fits?',
        options: [
          { ref: { line: 'thanks', part: 'reply' }, correct: true },
          { ref: { line: 'good-night', part: 'prompt' } },
        ],
        explain: 'After a thank-you comes *Ole hyvä!* (you\'re welcome).',
      },
      {
        kind: 'check',
        question: 'Someone says *Anteeksi!* — what fits?',
        options: [
          { ref: { line: 'thanks', part: 'prompt' } },
          { ref: { line: 'sorry', part: 'reply' }, correct: true },
        ],
        explain: '*Ei se mitään* = "it\'s okay".',
      },
    ],
  },
  {
    id: 'word-order',
    titleFi: 'Lauseet',
    titleEn: 'Building sentences',
    emoji: '📝',
    cards: [
      {
        kind: 'explain',
        title: 'Endings do the work',
        text:
          'You now know a lot of endings. In a Finnish sentence, **every word carries its ending**, and the ending tells you what job the word is doing — where it is, who has it, what you like.',
      },
      {
        kind: 'examples',
        title: 'Look at the endings',
        rows: [
          { sentence: 'i-like', word: 'football' },
          { sentence: 'in-it', word: 'backpack' },
          { sentence: 'i-see', word: 'bus' },
          { sentence: 'i-havent', word: 'phone' },
        ],
      },
      {
        kind: 'explain',
        title: 'Spotting mistakes',
        text:
          'If a sentence sounds wrong, **check the endings first**. *Kissa on laatikolla* means the cat is ON the box — if it should be IN the box, the ending must be **-ssa**.',
      },
      {
        kind: 'check',
        question: '"The cat is in the box." Which one is right?',
        options: [
          { ref: { sentence: 'in-it', word: 'box', asCase: 'adessive' } },
          { ref: { sentence: 'in-it', word: 'box' }, correct: true },
        ],
        explain: '"In" → **-ssa**: *laatikossa*.',
      },
      {
        kind: 'check',
        question: '"I like football." Which one is right?',
        options: [
          { ref: { sentence: 'i-like', word: 'football' }, correct: true },
          { ref: { sentence: 'i-like', word: 'football', asCase: 'partitive' } },
        ],
        explain: '*Pidän* always takes **-sta**: *jalkapallosta*.',
      },
    ],
  },
  {
    id: 'expert',
    titleFi: 'Mestari',
    titleEn: 'Expert Finnish',
    emoji: '🏆',
    cards: [
      {
        kind: 'verbTable',
        title: '"Have done" — olen syönyt',
        text: 'Use *olla* (to be) + the **-nut / -nyt** form you met in "didn\'t".',
        verb: 'eat',
        tense: 'perfect',
        polarity: 'positive',
      },
      {
        kind: 'verbTable',
        title: '"Would" — söisin',
        text: 'Slip in **-isi-** to say "would".',
        verb: 'eat',
        tense: 'conditional',
        polarity: 'positive',
      },
      {
        kind: 'examples',
        title: 'Place endings in the plural',
        text: 'Every place ending has a plural with **-i-**:',
        rows: [
          { word: 'table', case: 'adessive', number: 'plural', en: 'on the tables' },
          { word: 'box', case: 'elative', number: 'plural', en: 'out of the boxes' },
          { word: 'table', case: 'allative', number: 'plural', en: 'onto the tables' },
        ],
      },
      {
        kind: 'explain',
        title: 'Keep climbing',
        text:
          'Every practice here gets **harder and harder** as you improve — tricky look-alike answers, no English hints, and finally writing Finnish just from hearing it.',
      },
      {
        kind: 'check',
        question: 'Which one means "I would eat"?',
        options: [
          { ref: { verb: 'eat', tense: 'conditional', polarity: 'positive', person: '1sg' }, correct: true },
          { ref: { verb: 'eat', tense: 'perfect', polarity: 'positive', person: '1sg' } },
          { ref: { verb: 'eat', tense: 'past', polarity: 'positive', person: '1sg' } },
        ],
        explain: '"Would" → **-isi-**: *söisin*.',
      },
    ],
  },
  {
    id: 'feelings',
    titleFi: 'Miltä tuntuu?',
    titleEn: 'Saying how you feel',
    emoji: '😄',
    cards: [
      {
        kind: 'examples',
        title: 'I am…',
        text:
          '*Olen* means **I am**. Put a feeling after it — the feeling stays in its **basic form**.',
        rows: [
          { sentence: 'i-am', word: 'happy' },
          { sentence: 'i-am', word: 'tired' },
          { sentence: 'she-is', word: 'sad' },
        ],
      },
      {
        kind: 'examples',
        title: 'I am not…',
        text:
          '*En ole* means **I am not**. Good news: here the feeling word **doesn\'t change**.',
        rows: [
          { sentence: 'i-am-not', word: 'angry' },
          { sentence: 'i-am-not', word: 'sick' },
        ],
      },
      {
        kind: 'check',
        question: 'How do you say "I\'m happy"?',
        options: [
          { ref: { sentence: 'i-am', word: 'happy' }, correct: true },
          { ref: { sentence: 'i-am-not', word: 'happy' } },
        ],
        explain: '*Olen* = I am: *Olen iloinen*.',
      },
      {
        kind: 'check',
        question: '*En ole väsynyt.* means…',
        options: [{ text: "I'm not tired", correct: true }, { text: "I'm tired" }],
        explain: '*En ole* = I am **not**.',
      },
    ],
  },
  {
    id: 'feelings-on-me',
    titleFi: 'Minulla on nälkä',
    titleEn: 'Hungry, thirsty, cold, hot',
    emoji: '🤤',
    cards: [
      {
        kind: 'explain',
        title: '"On me is hunger"',
        text:
          'Remember *Minulla on…* (on me is) from "I have"? Finnish uses it for feeling **hungry, thirsty, cold or hot**: *Minulla on nälkä* — "on me is hunger".',
      },
      {
        kind: 'examples',
        title: 'Listen',
        rows: [
          { sentence: 'i-feel', word: 'hunger' },
          { sentence: 'i-feel', word: 'thirst' },
          { sentence: 'i-feel', word: 'cold' },
          { sentence: 'i-feel', word: 'hot' },
        ],
      },
      {
        kind: 'check',
        question: 'How do you say "I\'m cold"?',
        options: [
          { ref: { sentence: 'i-feel', word: 'cold' }, correct: true },
          { ref: { sentence: 'i-am', word: 'tired' } },
        ],
        explain: '*Minulla on kylmä* — "on me is cold".',
      },
      {
        kind: 'check',
        question: 'How do you say "I\'m hungry"?',
        options: [
          { ref: { sentence: 'i-feel', word: 'hunger' }, correct: true },
          { ref: { sentence: 'i-feel', word: 'thirst' } },
        ],
        explain: '*nälkä* = hunger, *jano* = thirst.',
      },
    ],
  },
  {
    id: 'school-day',
    titleFi: 'Koulupäivä',
    titleEn: 'Liking and not liking',
    emoji: '🏫',
    cards: [
      {
        kind: 'examples',
        title: 'School subjects',
        rows: [{ word: 'math' }, { word: 'gym' }, { word: 'english' }, { word: 'music' }],
      },
      {
        kind: 'examples',
        title: 'I like / I don\'t like',
        text:
          'You know *Tykkään* + **-sta**. To say you DON\'T like something, use *En tykkää* (or *En pidä*), and the ending **stays the same**.',
        rows: [
          { sentence: 'i-like-tykkaan', word: 'gym' },
          { sentence: 'i-dont-like-tykkaa', word: 'math' },
          { sentence: 'i-dont-like', word: 'test' },
        ],
      },
      {
        kind: 'explain',
        title: 'The "not" verb again',
        text:
          '*En tykkää* uses the same "not" verb you learned before: *en* (I), *et* (you), *ei* (he/she). The thing still gets **-sta / -stä**.',
      },
      {
        kind: 'check',
        question: 'Which one means "I don\'t like math"?',
        options: [
          { ref: { sentence: 'i-dont-like-tykkaa', word: 'math' }, correct: true },
          { ref: { sentence: 'i-dont-like-tykkaa', word: 'math', asCase: 'partitive' } },
        ],
        explain: '*En tykkää* still takes **-sta**: *matematiikasta*.',
      },
      {
        kind: 'check',
        question: '*Pidän englannista.* — Do I like English?',
        options: [{ text: 'Yes', correct: true }, { text: 'No' }],
        explain: '*Pidän* = I like. (*En pidä* would be "I don\'t like".)',
      },
    ],
  },
  {
    id: 'town',
    titleFi: 'Kaupungilla ja kotona',
    titleEn: 'You on the move',
    emoji: '🏙️',
    cards: [
      {
        kind: 'explain',
        title: 'The cat\'s endings — for you',
        text:
          'Remember the cat going *into* and *out of* the box? You use **the same endings** about yourself, with *Olen* (I am), *Menen* (I go) and *Tulen* (I come).',
      },
      {
        kind: 'examples',
        title: 'Inside places: in, into, out of',
        rows: [
          { sentence: 'i-am-in', word: 'park' },
          { sentence: 'i-go-into', word: 'library' },
          { sentence: 'i-come-from-in', word: 'school' },
        ],
      },
      {
        kind: 'examples',
        title: '"On" places: -lla, -lle, -lta',
        text:
          'Some places are "on" places in Finnish — a station, a market, the yard. They take the **l** endings.',
        rows: [
          { sentence: 'i-am-on', word: 'station' },
          { sentence: 'i-go-onto', word: 'yard' },
          { sentence: 'i-come-from-on', word: 'market' },
        ],
      },
      {
        kind: 'examples',
        title: 'At home',
        rows: [
          { sentence: 'i-am-in', word: 'bedroom' },
          { sentence: 'i-am-on', word: 'sofa' },
          { sentence: 'i-go-into', word: 'kitchen' },
        ],
      },
      {
        kind: 'check',
        question: '"I\'m going to the park." Which is right?',
        options: [
          { ref: { sentence: 'i-go-into', word: 'park' }, correct: true },
          { ref: { sentence: 'i-go-into', word: 'park', asCase: 'inessive' } },
          { ref: { sentence: 'i-go-into', word: 'park', asCase: 'elative' } },
        ],
        explain: 'Going INTO → a long vowel + **n**: *puistoon*.',
      },
      {
        kind: 'check',
        question: '"I\'m at the station." Which is right?',
        options: [
          { ref: { sentence: 'i-am-on', word: 'station' }, correct: true },
          { ref: { sentence: 'i-am-on', word: 'station', asCase: 'inessive' } },
        ],
        explain: 'A station is an "on" place → **-lla**: *asemalla*.',
      },
    ],
  },
  {
    id: 'when',
    titleFi: 'Milloin?',
    titleEn: 'Days and times',
    emoji: '📅',
    cards: [
      {
        kind: 'examples',
        title: 'Days of the week',
        text: 'Finnish days **don\'t start with a capital letter**: *maanantai*, not "Maanantai".',
        rows: [
          { word: 'monday' },
          { word: 'tuesday' },
          { word: 'wednesday' },
          { word: 'thursday' },
          { word: 'friday' },
          { word: 'saturday' },
          { word: 'sunday' },
        ],
      },
      {
        kind: 'examples',
        title: 'On Monday: -na / -nä',
        text: '"On" a day is the ending **-na / -nä** — no extra word.',
        rows: [
          { word: 'monday', case: 'essive', en: 'on Monday' },
          { word: 'saturday', case: 'essive', en: 'on Saturday' },
          { sentence: 'play-on-day', word: 'friday' },
        ],
      },
      {
        kind: 'examples',
        title: 'In the morning, in summer: -lla / -llä',
        text: 'Parts of the day and seasons use the "on" ending **-lla / -llä** instead.',
        rows: [
          { word: 'morning', case: 'adessive', en: 'in the morning' },
          { word: 'evening', case: 'adessive', en: 'in the evening' },
          { word: 'summer', case: 'adessive', en: 'in summer' },
          { word: 'winter', case: 'adessive', en: 'in winter' },
        ],
      },
      {
        kind: 'check',
        question: 'How do you say "on Sunday"?',
        options: [
          { ref: { word: 'sunday', case: 'essive' }, correct: true },
          { ref: { word: 'sunday', case: 'adessive' } },
          { ref: { word: 'sunday' } },
        ],
        explain: 'A day → **-na**: *sunnuntaina*.',
      },
      {
        kind: 'check',
        question: 'How do you say "in winter"?',
        options: [
          { ref: { word: 'winter', case: 'adessive' }, correct: true },
          { ref: { word: 'winter', case: 'essive' } },
        ],
        explain: 'A season → **-lla**: *talvella*.',
      },
    ],
  },
  {
    id: 'clock',
    titleFi: 'Paljonko kello on?',
    titleEn: 'What time is it?',
    emoji: '⏰',
    cards: [
      {
        kind: 'explain',
        title: 'Kello on…',
        text:
          '*kello* is a **clock**. To say the time, say *Kello on* + the number: *Kello on kolme* = it\'s three o\'clock. To ask: *Paljonko kello on?*',
      },
      {
        kind: 'examples',
        title: 'Listen',
        text: 'The number stays in its **basic form** — the numbers you learned in unit 3.',
        rows: [
          { sentence: 'clock-is', word: 'three' },
          { sentence: 'clock-is', word: 'eight' },
          { sentence: 'clock-is', word: 'twelve' },
        ],
      },
      {
        kind: 'check',
        question: 'How do you say "It\'s seven o\'clock"?',
        options: [
          { ref: { sentence: 'clock-is', word: 'seven' }, correct: true },
          { ref: { sentence: 'clock-is', word: 'six' } },
          { ref: { sentence: 'clock-is', word: 'eight' } },
        ],
        explain: '7 = *seitsemän*: *Kello on seitsemän*.',
      },
      {
        kind: 'check',
        question: '*Kello on kaksitoista.* — What time is it?',
        options: [{ text: "two o'clock" }, { text: "twelve o'clock", correct: true }, { text: "ten o'clock" }],
        explain: '*kaksitoista* = 12.',
      },
    ],
  },
  // --- Six grammar lessons added with the "Owners / Asking / Want-can-may /
  // Do-don't-let's / Question words / Me and you" units. Finnish quoted in
  // prose (*isän*, *-ko*…) is listed in FINNISH_REVIEW.md for native vetting.
  {
    id: 'owners',
    titleFi: 'Äidin pyörä',
    titleEn: "Mom's bike — the owner gets -n",
    emoji: '🚲',
    cards: [
      {
        kind: 'examples',
        title: 'The owner comes first',
        text: 'To say WHOSE something is, put the **owner first** and give it **-n**: *isä* → *isän pyörä* = Dad\'s bike. No extra word for "\'s"!',
        rows: [
          { owner: 'father', thing: 'bike' },
          { owner: 'mother', thing: 'coat' },
          { owner: 'teacher', thing: 'book' },
          { owner: 'cat', thing: 'ball' },
        ],
      },
      {
        kind: 'explain',
        title: 'Kenen? — Whose?',
        text: '*Kenen pyörä tämä on?* means **Whose bike is this?** Answer with the owner + **-n**: *Se on isän pyörä.*\n\nYou already know *minun* and *sinun* (my, your) — they end in **-n** too!',
      },
      {
        kind: 'examples',
        title: 'Look at the END',
        text: 'Sometimes the middle of the word changes a little (*äiti* → *äidin*). The **-n** at the very end is what says "whose".',
        rows: [
          { owner: 'mother', thing: 'phone' },
          { owner: 'friend', thing: 'bike' },
          { owner: 'sister', thing: 'hat' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means **Dad\'s ball**?',
        options: [
          { ref: { owner: 'father', thing: 'ball' }, correct: true },
          { ref: { owner: 'father', thing: 'ball', wrong: 'basic' } },
          { ref: { owner: 'father', thing: 'ball', wrong: 'has' } },
        ],
        explain: 'The owner takes **-n**: *isän pallo*.',
      },
      {
        kind: 'check',
        question: '*äidin kissa* — whose cat is it?',
        options: [{ text: "Mom's", correct: true }, { text: "Dad's" }, { text: 'Mine' }],
        explain: '*äidin* = Mom\'s (*äiti* + **-n**).',
      },
    ],
  },
  {
    id: 'asking',
    titleFi: 'Kysymykset',
    titleEn: 'Asking with -ko / -kö',
    emoji: '❓',
    cards: [
      {
        kind: 'explain',
        title: 'Any verb can ask',
        text: 'You know *Onko…?* — that is *on* + **-ko**. It works on ANY verb: take the "you" form and add **-ko** or **-kö**.\n\n*syöt* (you eat) → *syötkö?* (do you eat?)',
      },
      {
        kind: 'examples',
        title: '-ko or -kö?',
        text: 'The vowel team again: a word with **a, o, u** gets **-ko**; otherwise **-kö**.',
        rows: [{ ask: 'sleep' }, { ask: 'play' }, { ask: 'swim' }, { ask: 'eat' }, { ask: 'jump' }],
      },
      {
        kind: 'examples',
        title: 'Answer with the verb',
        text: 'Finns often answer a question like this with the **verb itself** — and it switches from "you" to "I":\n\n*Syötkö?* — *Syön!* (yes) or *En syö.* (no)',
        rows: [
          { verb: 'eat', tense: 'present', polarity: 'positive', person: '1sg', en: 'yes — I eat' },
          { verb: 'eat', tense: 'present', polarity: 'negative', person: '1sg', en: "no — I don't eat" },
        ],
      },
      {
        kind: 'check',
        question: 'How do you ask **"Do you swim?"**',
        options: [
          { ref: { ask: 'swim' }, correct: true },
          { ref: { verb: 'swim', tense: 'present', polarity: 'positive', person: '2sg' } },
          { ref: { verb: 'swim', tense: 'present', polarity: 'positive', person: '1sg' } },
        ],
        explain: 'The "you" form + **-ko**: *uit* → *uitko?*',
      },
      {
        kind: 'check',
        question: 'Someone asks *Nukutko?* — say **no**.',
        options: [
          { ref: { verb: 'sleep', tense: 'present', polarity: 'negative', person: '1sg' }, correct: true },
          { ref: { verb: 'sleep', tense: 'present', polarity: 'positive', person: '1sg' } },
          { ref: { verb: 'sleep', tense: 'present', polarity: 'negative', person: '2sg' } },
        ],
        explain: '"No, I don\'t" = *en nuku* — about YOU, so *en* (I), not *et* (you).',
      },
    ],
  },
  {
    id: 'wanting',
    titleFi: 'Haluan leikkiä',
    titleEn: 'Want to, can, may I',
    emoji: '🎯',
    cards: [
      {
        kind: 'explain',
        title: 'Two verbs together',
        text: '*Haluan* = I want. The verb after it stays in its **basic form** — the dictionary form you see in lists: *Haluan leikkiä* = I want to play.\n\nOnly the FIRST verb changes for the person.',
      },
      {
        kind: 'examples',
        title: 'I want to…',
        rows: [
          { sentence: 'i-want-to', word: 'play' },
          { sentence: 'i-want-to', word: 'swim' },
          { sentence: 'i-dont-want-to', word: 'sleep' },
        ],
      },
      {
        kind: 'examples',
        title: 'I can… · May I…?',
        text: '*Osaan* = I can (I know how). *Saanko…?* = May I…? — that is *saan* + the question ending **-ko**.',
        rows: [
          { sentence: 'i-can', word: 'swim' },
          { sentence: 'i-can', word: 'read' },
          { sentence: 'may-i', word: 'play' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means **"I want to swim"**?',
        options: [
          { ref: { sentence: 'i-want-to', word: 'swim' }, correct: true },
          { ref: { sentence: 'i-want-to', word: 'swim', verbAs: '1sg' } },
        ],
        explain: 'After *Haluan*, the verb stays basic: *uida*.',
      },
      {
        kind: 'check',
        question: '*Osaan lukea.* means…',
        options: [{ text: 'I can read', correct: true }, { text: 'I want to read' }, { text: 'May I read?' }],
        explain: '*Osaan* = I can (I know how).',
      },
    ],
  },
  {
    id: 'commands',
    titleFi: 'Tee! Älä! Tehdään!',
    titleEn: "Do it, don't, let's",
    emoji: '🏃',
    cards: [
      {
        kind: 'examples',
        title: 'Telling someone to do it',
        text: 'To tell ONE person what to do, use the **short verb**: the "I" form without its **-n**. *juoksen* (I run) → *Juokse!* (Run!)',
        rows: [
          { mood: 'run', kind: 'do' },
          { mood: 'jump', kind: 'do' },
          { mood: 'look', kind: 'do' },
        ],
      },
      {
        kind: 'examples',
        title: "Don't!",
        text: '"Don\'t" is *älä* + the same short verb.',
        rows: [
          { mood: 'run', kind: 'dont' },
          { mood: 'cry', kind: 'dont' },
          { mood: 'forget', kind: 'dont' },
        ],
      },
      {
        kind: 'examples',
        title: "Let's!",
        text: 'In everyday Finnish, "let\'s…" ends in **-aan / -ään** — you hear it all the time at school and on the playground.',
        rows: [
          { mood: 'play', kind: 'lets' },
          { mood: 'go', kind: 'lets' },
          { mood: 'eat', kind: 'lets' },
          { mood: 'swim', kind: 'lets' },
        ],
      },
      {
        kind: 'check',
        question: 'How do you say **"Don\'t run!"**?',
        options: [
          { ref: { mood: 'run', kind: 'dont' }, correct: true },
          { ref: { mood: 'run', kind: 'do' } },
          { ref: { mood: 'run', kind: 'lets' } },
        ],
        explain: '*Älä* + the short verb: *Älä juokse!*',
      },
      {
        kind: 'check',
        question: 'How do you say **"Let\'s play!"**?',
        options: [
          { ref: { mood: 'play', kind: 'lets' }, correct: true },
          { ref: { mood: 'play', kind: 'do' } },
          { ref: { mood: 'play', kind: 'dont' } },
        ],
        explain: '"Let\'s" ends in **-aan / -ään**: *Leikitään!*',
      },
    ],
  },
  {
    id: 'question-words',
    titleFi: 'Kysymyssanat',
    titleEn: 'Question words',
    emoji: '🤔',
    cards: [
      {
        kind: 'explain',
        title: 'Who, what, whose, why…',
        text: '- *Kuka?* — who?\n- *Mikä?* — what? (what is it)\n- *Mitä?* — what? (what are you doing)\n- *Montako?* — how many?\n- *Kenen?* — whose?\n- *Miksi?* — why?',
      },
      {
        kind: 'pairs',
        title: 'Ask and answer',
        ids: ['qw-who', 'qw-what', 'qw-what-doing', 'qw-how-many', 'qw-whose', 'qw-why'],
      },
      {
        kind: 'check',
        question: '*Kenen?* means…',
        options: [{ text: 'whose?', correct: true }, { text: 'who?' }, { text: 'what?' }],
        explain: '*Kenen?* = whose? (*Kuka?* = who?)',
      },
      {
        kind: 'check',
        question: '*Miksi?* means…',
        options: [{ text: 'when?' }, { text: 'why?', correct: true }, { text: 'what?' }],
        explain: '*Miksi?* = why?',
      },
    ],
  },
  {
    id: 'where-questions',
    titleFi: 'Missä? Mihin? Mistä?',
    titleEn: 'Where, where to, where from, when',
    emoji: '🧭',
    cards: [
      {
        kind: 'explain',
        title: 'Three "where" words',
        text: '- *Missä?* — where? → answer with **-ssa** (*laatikossa*)\n- *Mihin?* — where TO? → answer with **into** (*puistoon*)\n- *Mistä?* — where FROM? → answer with **-sta** (*koulusta*)\n- *Milloin?* — when? → answer with a time (*lauantaina*)',
      },
      {
        kind: 'pairs',
        title: 'Ask and answer',
        ids: ['qw-where', 'qw-where-to', 'qw-where-from', 'qw-when'],
      },
      {
        kind: 'check',
        question: 'Someone asks *Mihin sinä menet?* — what fits?',
        options: [
          { ref: { line: 'qw-where-to', part: 'reply' }, correct: true },
          { ref: { line: 'qw-where', part: 'reply' } },
          { ref: { line: 'qw-when', part: 'reply' } },
        ],
        explain: '*Mihin?* = where TO — *Menen puistoon* (into the park).',
      },
      {
        kind: 'check',
        question: '*Mistä?* means…',
        options: [{ text: 'where?' }, { text: 'where to?' }, { text: 'where from?', correct: true }],
        explain: '*Mistä?* — where from? Answer with **-sta**.',
      },
    ],
  },
  {
    id: 'me-you',
    titleFi: 'Minua, minulle',
    titleEn: 'Me and you',
    emoji: '🫶',
    cards: [
      {
        kind: 'explain',
        title: 'I, me, to me…',
        text: '*minä* (I) changes its ending just like any word:\n\n- *Auta minua!* — Help me!\n- *Anna se minulle!* — Give it to me!\n- *Pidän sinusta.* — I like you.',
      },
      {
        kind: 'examples',
        title: 'The endings you know',
        text: 'The same endings as the nouns: **-a**, **-lle**, **-sta**… plus one new one, **-t**, for "I see you".',
        rows: [
          { pronoun: '1sg', case: 'partitive', en: 'me — help me, wait for me' },
          { pronoun: '1sg', case: 'allative', en: 'to me — give it to me' },
          { pronoun: '2sg', case: 'elative', en: 'you — I like you' },
          { pronoun: '3sg', case: 'accusative', en: 'him/her — I see him/her' },
        ],
      },
      {
        kind: 'examples',
        title: 'Help me, help us…',
        rows: [
          { frame: 'help', person: '1sg' },
          { frame: 'help', person: '3sg' },
          { frame: 'help', person: '1pl' },
          { frame: 'help', person: '3pl' },
        ],
      },
      {
        kind: 'explain',
        title: 'Which ending?',
        text: 'The verb decides, just like with nouns:\n\n- *Auta, Odota* → **-a / -ä** (*minua, häntä*)\n- *Anna se* → **-lle** (*minulle*)\n- *Pidän* → **-sta / -stä** (*sinusta*)\n- *Näen* → **-t** (*sinut, hänet*)',
      },
      {
        kind: 'check',
        question: 'How do you say **"Help me!"**?',
        options: [
          { ref: { frame: 'help', person: '1sg' }, correct: true },
          { ref: { frame: 'help', person: '1sg', case: 'allative' } },
          { ref: { frame: 'help', person: '1sg', case: 'nominative' } },
        ],
        explain: '*auttaa* takes **-a**: *Auta minua!*',
      },
      {
        kind: 'check',
        question: 'How do you say **"Give it to him/her!"**?',
        options: [
          { ref: { frame: 'give', person: '3sg' }, correct: true },
          { ref: { frame: 'give', person: '3sg', case: 'partitive' } },
          { ref: { frame: 'give', person: '3sg', case: 'elative' } },
        ],
        explain: 'Giving TO someone → **-lle**: *hänelle*.',
      },
    ],
  },
  {
    id: 'verb-type4',
    titleFi: 'Verbityyppi 4',
    titleEn: 'Verb type 4',
    emoji: '🔓',
    cards: [
      {
        kind: 'examples',
        title: 'A new family: type 4',
        text:
          'Type 4 verbs end in a vowel + **-ta / -tä**: **-ata, -ota, -uta, -ätä**…',
        rows: [{ vtype: 'open' }, { vtype: 'want' }, { vtype: 'clean' }],
      },
      {
        kind: 'explain',
        title: 'Drop the t — the vowels join up',
        text:
          'Take off **-ta / -tä**, and put **a / ä** in its place: *avata → avaa-*, *haluta → halua-*. Then add the "who" ending: *avaan*, *haluan*.',
      },
      {
        kind: 'verbTable',
        title: 'avata — to open',
        text: 'The marked ending is the "who" part.',
        verb: 'open',
        tense: 'present',
        polarity: 'positive',
      },
      {
        kind: 'examples',
        title: 'He / she',
        text:
          'For **he / she** the last vowel doubles, as usual: *haluan → hän haluaa*. But if it\'s already long, nothing changes: *avaan → hän avaa*.',
        rows: [
          { verb: 'want', tense: 'present', polarity: 'positive', person: '1sg' },
          { verb: 'want', tense: 'present', polarity: 'positive', person: '3sg' },
          { verb: 'clean', tense: 'present', polarity: 'positive', person: '1sg' },
          { verb: 'wake-up', tense: 'present', polarity: 'positive', person: '1sg' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "I want"?',
        options: [
          { ref: { verb: 'want', tense: 'present', polarity: 'positive', person: '1sg' }, correct: true },
          { ref: { verb: 'want', tense: 'present', polarity: 'positive', person: '3sg' } },
          { ref: { verb: 'want', tense: 'present', polarity: 'positive', person: '2sg' } },
        ],
        explain: '"I" is **-n**: *haluan*.',
      },
      {
        kind: 'check',
        question: 'Which family is *korjata* (to fix)?',
        options: [{ text: 'Type 1' }, { text: 'Type 3' }, { text: 'Type 4', correct: true }],
        explain: '*korjata* ends in **-ata**: **type 4** (*korjaan*).',
      },
    ],
  },
  {
    id: 'kpt-4',
    titleFi: 'Vahvempi kirjain',
    titleEn: 'Type 4: the sound gets STRONGER',
    emoji: '🦘',
    cards: [
      {
        kind: 'explain',
        title: 'The other way round — like kuunnella',
        text:
          'Remember *kuunnella → kuuntelen*? Type 4 works the same way: the "to…" word has the **weak** sound, and EVERY person gets the **strong** one: *hypätä → hyppään, hyppää*.',
      },
      {
        kind: 'examples',
        title: 'Weak → strong',
        text: '**p → pp**, **k → kk**, **v → p**, **d → t**… You already know one: *tykätä → tykkään*!',
        rows: [{ kpt: 'like' }, { kpt: 'jump' }, { kpt: 'cut' }, { kpt: 'climb' }, { kpt: 'fall' }, { kpt: 'meet' }],
      },
      {
        kind: 'examples',
        title: 'Every person is strong',
        text: 'In type 4 there is no weak person form: *minä hyppään*, *hän hyppää*, *me hyppäämme*.',
        rows: [
          { kpt: 'jump', person: '1sg' },
          { kpt: 'jump', person: '3sg' },
          { kpt: 'jump', person: '1pl' },
        ],
      },
      {
        kind: 'explain',
        title: 'Watch out: kiivetä',
        text:
          '*kiivetä* ends in **-etä**, but it is a **type 4** verb all the same: *kiipeän*, like *hyppään*.',
      },
      {
        kind: 'check',
        question: 'Which one means "I jump"?',
        options: [
          { ref: { kpt: 'jump', person: '1sg' }, correct: true },
          { ref: { verb: 'jump', tense: 'present', polarity: 'positive', person: '2sg' } },
          { ref: { verb: 'jump', tense: 'present', polarity: 'positive', person: '3sg' } },
        ],
        explain: '"I" is **-n**, with the strong **pp**: *hyppään*.',
      },
      {
        kind: 'check',
        question: 'Listen! Which one did you hear?',
        listen: { kpt: 'cut', person: '3sg' },
        options: [
          { ref: { verb: 'cut', tense: 'present', polarity: 'positive', person: '1sg' } },
          { ref: { kpt: 'cut', person: '3sg' }, correct: true },
          { ref: { verb: 'cut', tense: 'present', polarity: 'positive', person: '1pl' } },
        ],
        explain: '*hän leikkaa* — she cuts. The strong **kk** is in every person.',
      },
    ],
  },
  {
    id: 'verb-types-5-6',
    titleFi: 'Verbityypit 5 ja 6',
    titleEn: 'Verb types 5 and 6',
    emoji: '👵',
    cards: [
      {
        kind: 'examples',
        title: 'Type 5: -ita / -itä',
        text: 'Type 5 turns **-ita** into **-itse-**, then adds the "who" ending: *tarvita → tarvitsen*.',
        rows: [
          { vtype: 'need' },
          { verb: 'need', tense: 'present', polarity: 'positive', person: '1sg' },
          { verb: 'choose', tense: 'present', polarity: 'positive', person: '1sg' },
          { verb: 'choose', tense: 'present', polarity: 'positive', person: '3sg' },
        ],
      },
      {
        kind: 'examples',
        title: 'Type 6: -eta / -etä',
        text: 'Type 6 turns **-eta** into **-ene-**, then adds the "who" ending: *vanheta → vanhenen*.',
        rows: [
          { vtype: 'grow-old' },
          { verb: 'grow-old', tense: 'present', polarity: 'positive', person: '1sg' },
          { verb: 'grow-old', tense: 'present', polarity: 'positive', person: '3sg' },
        ],
      },
      {
        kind: 'verbTable',
        title: 'tarvita — to need',
        text: 'The marked ending is the "who" part.',
        verb: 'need',
        tense: 'present',
        polarity: 'positive',
      },
      {
        kind: 'examples',
        title: 'All six families',
        text: 'Now you know them all — look at the END of the verb.',
        rows: [
          { vtype: 'sing' },
          { vtype: 'eat' },
          { vtype: 'come' },
          { vtype: 'open' },
          { vtype: 'need' },
          { vtype: 'grow-old' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "I choose"?',
        options: [
          { ref: { verb: 'choose', tense: 'present', polarity: 'positive', person: '2sg' } },
          { ref: { verb: 'choose', tense: 'present', polarity: 'positive', person: '1sg' }, correct: true },
          { ref: { verb: 'choose', tense: 'present', polarity: 'positive', person: '3sg' } },
        ],
        explain: '"I" is **-n**: *valitsen*.',
      },
      {
        kind: 'check',
        question: 'Which family is *vanheta* (to grow old)?',
        options: [{ text: 'Type 4' }, { text: 'Type 5' }, { text: 'Type 6', correct: true }],
        explain: '*vanheta* ends in **-eta**: **type 6** (*vanhenen*).',
      },
    ],
  },
  {
    id: 'kpt-6',
    titleFi: 'Tyyppi 6 ja KPT',
    titleEn: 'Type 6: a sound gets stronger too',
    emoji: '💨',
    cards: [
      {
        kind: 'examples',
        title: 'Weak → strong, like type 4',
        text:
          'Type 6 verbs change the same way as type 4: weak in the "to…" word, strong in every person. **mm → mp**, and a **k** can even appear: *paeta → pakenen*.',
        rows: [{ kpt: 'warm-up' }, { kpt: 'run-away' }],
      },
      {
        kind: 'examples',
        title: 'Every person is strong',
        rows: [
          { kpt: 'run-away', person: '1sg' },
          { kpt: 'run-away', person: '3sg' },
          { kpt: 'warm-up', person: '3sg' },
        ],
      },
      {
        kind: 'examples',
        title: 'The whole picture',
        text:
          '- **Type 1**: strong in the "to…" word, weak in *minä, sinä, me, te*.\n- **Types 3, 4 and 6**: weak in the "to…" word, strong in every person.',
        rows: [{ kpt: 'sleep' }, { kpt: 'listen' }, { kpt: 'jump' }, { kpt: 'run-away' }],
      },
      {
        kind: 'check',
        question: 'Which one means "I run away"?',
        options: [
          { ref: { verb: 'run-away', tense: 'present', polarity: 'positive', person: '2sg' } },
          { ref: { verb: 'run-away', tense: 'present', polarity: 'positive', person: '3sg' } },
          { ref: { kpt: 'run-away', person: '1sg' }, correct: true },
        ],
        explain: '"I" is **-n**: *pakenen*.',
      },
      {
        kind: 'check',
        question: 'Remember type 1? Which one means "he sleeps"?',
        options: [
          { ref: { kpt: 'sleep', person: '3sg' }, correct: true },
          { ref: { verb: 'sleep', tense: 'present', polarity: 'positive', person: '1sg' } },
          { ref: { verb: 'sleep', tense: 'present', polarity: 'positive', person: '2sg' } },
        ],
        explain: 'Type 1: he / she keeps the strong **kk**: *nukkuu*.',
      },
    ],
  },
  {
    id: 'comparing',
    titleFi: 'Isompi kuin',
    titleEn: 'Bigger than',
    emoji: '🐘',
    cards: [
      {
        kind: 'examples',
        title: 'Bigger: -mpi',
        text: 'To say "bigger", "faster", "older", Finnish adds **-mpi**.',
        rows: [
          { degree: 'big', d: 'comparative' },
          { degree: 'fast', d: 'comparative' },
          { degree: 'old', d: 'comparative' },
        ],
      },
      {
        kind: 'examples',
        title: 'Than = kuin',
        text:
          '**kuin** means "than". Both things stay in their basic form:\n\n*Norsu on isompi kuin hiiri.* = The elephant is bigger than the mouse.',
        rows: [
          { compare: 'big', a: 'elephant', b: 'mouse' },
          { compare: 'fast', a: 'horse', b: 'cow' },
          { compare: 'old', a: 'grandfather', b: 'baby' },
        ],
      },
      {
        kind: 'examples',
        title: 'Special ones',
        text:
          'A few change more, just like in English (good → better): *hyvä → parempi*, *pitkä → pidempi*.',
        rows: [
          { degree: 'good', d: 'comparative' },
          { degree: 'tall', d: 'comparative' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "faster"?',
        options: [
          { ref: { degree: 'fast', d: 'base' } },
          { ref: { degree: 'fast', d: 'comparative' }, correct: true },
        ],
        explain: '**-mpi** = more: *nopeampi* = faster.',
      },
      {
        kind: 'check',
        question: 'Which one is TRUE?',
        options: [
          { ref: { compare: 'big', a: 'mouse', b: 'elephant' } },
          { ref: { compare: 'big', a: 'elephant', b: 'mouse' }, correct: true },
        ],
        explain: 'The elephant is bigger: *Norsu on isompi kuin hiiri.*',
      },
    ],
  },
  {
    id: 'superlative',
    titleFi: 'Isoin',
    titleEn: 'The biggest of all',
    emoji: '🏆',
    cards: [
      {
        kind: 'examples',
        title: 'The biggest: -in',
        text: 'To say "the biggest", "the fastest", Finnish ends the word with **-in** — and needs no "the".',
        rows: [
          { degree: 'big', d: 'superlative' },
          { most: 'big', a: 'elephant' },
          { most: 'small', a: 'mouse' },
        ],
      },
      {
        kind: 'examples',
        title: 'Big, bigger, biggest',
        text: '*iso → isompi → isoin*. And the special ones: *hyvä → parempi → paras*, *pitkä → pidempi → pisin*.',
        rows: [
          { degree: 'big', d: 'base' },
          { degree: 'big', d: 'comparative' },
          { degree: 'big', d: 'superlative' },
          { degree: 'good', d: 'superlative' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "Grandpa is the oldest"?',
        options: [
          { ref: { most: 'old', a: 'grandfather' }, correct: true },
          { ref: { compare: 'old', a: 'grandfather', b: 'baby' } },
        ],
        explain: '**-in** = the most of all: *vanhin* = the oldest.',
      },
      {
        kind: 'check',
        question: 'Which one means "the fastest"?',
        options: [
          { ref: { degree: 'fast', d: 'comparative' } },
          { ref: { degree: 'fast', d: 'superlative' }, correct: true },
        ],
        explain: '**-in** = the most: *nopein*. *nopeampi* is faster.',
      },
    ],
  },
  {
    id: 'by-with',
    titleFi: 'Bussilla ja kynällä',
    titleEn: 'By bus, with a pen',
    emoji: '🚌',
    cards: [
      {
        kind: 'explain',
        title: 'An ending you already know',
        text:
          'You know **-lla / -llä** for ON: *pöydällä* (on the table). The same ending also means **BY** and **WITH**: how you travel, and what you use.',
      },
      {
        kind: 'examples',
        title: 'By bus, by train',
        rows: [
          { sentence: 'go-by', word: 'bus' },
          { sentence: 'go-by', word: 'train' },
          { sentence: 'go-by', word: 'bike' },
        ],
      },
      {
        kind: 'examples',
        title: 'With a pen, with a spoon',
        text: 'The thing you do it WITH gets **-lla / -llä**.',
        rows: [
          { sentence: 'write-with', word: 'pencil' },
          { sentence: 'eat-with', word: 'spoon' },
          { sentence: 'open-with', word: 'key' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "I\'m going by train"?',
        options: [
          { ref: { sentence: 'go-by', word: 'train', asCase: 'illative' } },
          { ref: { sentence: 'go-by', word: 'train' }, correct: true },
          { ref: { sentence: 'go-by', word: 'train', asCase: 'inessive' } },
        ],
        explain: 'BY train → **-lla**: *junalla*. *junaan* would be INTO the train.',
      },
      {
        kind: 'check',
        question: 'Which one means "I eat with a spoon"?',
        options: [
          { ref: { sentence: 'eat-with', word: 'spoon' }, correct: true },
          { ref: { sentence: 'eat-with', word: 'spoon', asCase: 'partitive' } },
        ],
        explain: 'WITH a spoon → *lusikalla*. *Syön lusikkaa* would mean you are eating the spoon!',
      },
    ],
  },
  {
    id: 'with-someone',
    titleFi: 'Kaverin kanssa',
    titleEn: 'With a friend: kanssa',
    emoji: '🤝',
    cards: [
      {
        kind: 'examples',
        title: 'With a PERSON: kanssa',
        text:
          'Careful! With a person (or a pet) it\'s different: the person gets **-n**, then the word **kanssa** (together with).',
        rows: [
          { sentence: 'with-someone', word: 'friend' },
          { sentence: 'with-someone', word: 'mother' },
          { sentence: 'with-someone', word: 'dog' },
        ],
      },
      {
        kind: 'explain',
        title: 'Tool or person?',
        text: '- A thing you USE → **-lla**: *Leikin pallolla.* (with a ball)\n- Someone you\'re WITH → **-n kanssa**: *Leikin kaverin kanssa.* (with a friend)',
      },
      {
        kind: 'check',
        question: 'Which one means "I play with my friend"?',
        options: [
          { ref: { sentence: 'with-someone', word: 'friend', asCase: 'adessive' } },
          { ref: { sentence: 'with-someone', word: 'friend' }, correct: true },
        ],
        explain: 'With a PERSON → **-n** + *kanssa*: *kaverin kanssa*.',
      },
      {
        kind: 'check',
        question: 'Which one means "I play with a ball"?',
        options: [
          { ref: { sentence: 'play-with-toy', word: 'ball' }, correct: true },
          { ref: { sentence: 'play-with-toy', word: 'ball', asCase: 'genitive' } },
        ],
        explain: 'A ball is a thing you use → **-lla**: *pallolla*.',
      },
    ],
  },
  {
    id: 'big-numbers',
    titleFi: 'Isot numerot',
    titleEn: 'Big numbers',
    emoji: '💯',
    cards: [
      {
        kind: 'examples',
        title: '13 to 19: -toista',
        text:
          'You know 11 and 12. The rest work the same way: the number + **-toista** ("of the second ten"). 13 = *kolmetoista*.',
        rows: [{ word: 'thirteen' }, { word: 'fifteen' }, { word: 'nineteen' }],
      },
      {
        kind: 'examples',
        title: 'Tens: -kymmentä',
        text: 'Tens are the number + **-kymmentä** (tens): 30 = *kolmekymmentä*. And 100 is *sata*.',
        rows: [{ word: 'twenty' }, { word: 'thirty' }, { word: 'fifty' }, { word: 'hundred' }],
      },
      {
        kind: 'explain',
        title: '21, 22, 23…',
        text:
          'Say the ten, then the one — all in one long word: 21 = *kaksikymmentä* + *yksi*, 35 = *kolmekymmentä* + *viisi*.',
      },
      {
        kind: 'check',
        question: 'Which one is 15?',
        options: [{ ref: { word: 'five' } }, { ref: { word: 'fifteen' }, correct: true }, { ref: { word: 'fifty' } }],
        explain: '5 + **-toista** = *viisitoista*. *viisikymmentä* is 50.',
      },
      {
        kind: 'check',
        question: 'Which one is 40?',
        options: [{ ref: { word: 'fourteen' } }, { ref: { word: 'forty' }, correct: true }],
        explain: '4 + **-kymmentä** = *neljäkymmentä*. *neljätoista* is 14.',
      },
    ],
  },
  {
    id: 'ordinals',
    titleFi: 'Ensimmäinen, toinen',
    titleEn: 'First, second, third…',
    emoji: '🥇',
    cards: [
      {
        kind: 'examples',
        title: 'Order words',
        text:
          'For the ORDER (who came first?) Finnish has its own words. *ensimmäinen* (1st) and *toinen* (2nd) are special; from the 3rd on they end in **-s**: *kolmas*, *neljäs*, *viides*.',
        rows: [{ word: 'first' }, { word: 'second' }, { word: 'third' }, { word: 'fourth' }, { word: 'fifth' }],
      },
      {
        kind: 'explain',
        title: 'Three or third?',
        text: '- *kolme* = **3** (how many)\n- *kolmas* = **3rd** (which place in the line)',
      },
      {
        kind: 'check',
        question: 'Which one means "the third"?',
        options: [{ ref: { word: 'three' } }, { ref: { word: 'third' }, correct: true }, { ref: { word: 'thirteen' } }],
        explain: '*kolmas* is the ORDER word (3rd). *kolme* is just 3.',
      },
      {
        kind: 'check',
        question: 'Who won the race? The one who is…',
        options: [{ ref: { word: 'one' } }, { ref: { word: 'first' }, correct: true }, { ref: { word: 'second' } }],
        explain: '*ensimmäinen* = first.',
      },
    ],
  },
  {
    id: 'birthdays',
    titleFi: 'Kuukaudet',
    titleEn: 'The months',
    emoji: '🗓️',
    cards: [
      {
        kind: 'examples',
        title: 'The months',
        text: 'Every month ends in **-kuu** — *kuu* also means "moon"! Months start with a small letter.',
        rows: [{ word: 'january' }, { word: 'may' }, { word: 'july' }, { word: 'december' }],
      },
      {
        kind: 'examples',
        title: 'In May: -ssa',
        text: 'IN a month takes **-ssa / -ssä**, like *koulussa* (in school).',
        rows: [
          { sentence: 'birthday-in', word: 'may' },
          { sentence: 'birthday-in', word: 'december' },
          { sentence: 'now-month', word: 'june' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "My birthday is in May"?',
        options: [
          { ref: { sentence: 'birthday-in', word: 'may' }, correct: true },
          { ref: { sentence: 'birthday-in', word: 'may', asCase: 'partitive' } },
        ],
        explain: 'IN May → **-ssa**: *toukokuussa*.',
      },
      {
        kind: 'check',
        question: '*joulukuu* is…',
        options: [{ text: 'June' }, { text: 'December', correct: true }, { text: 'January' }],
        explain: '*joulu* is Christmas — *joulukuu* is the Christmas month!',
      },
    ],
  },
  {
    id: 'dates',
    titleFi: 'Päivämäärä',
    titleEn: 'Saying a date',
    emoji: '📅',
    cards: [
      {
        kind: 'examples',
        title: 'Order word + month with -ta',
        text:
          'A date is the ORDER word (first, fifth…) + the month with **-ta**: *viides toukokuuta* = the 5th of May.',
        rows: [
          { date: 'first', month: 'january' },
          { date: 'fifth', month: 'may' },
          { date: 'tenth', month: 'december' },
        ],
      },
      {
        kind: 'examples',
        title: 'Past the 10th',
        text:
          '11th to 19th end in **-stoista**: *yhdestoista* (11th), *viidestoista* (15th). The 20th is *kahdeskymmenes* and the 30th *kolmaskymmenes*. The 21st joins two words you know: *kahdeskymmenes* + *ensimmäinen*.',
        rows: [{ word: 'eleventh' }, { word: 'fifteenth' }, { word: 'twentieth' }, { word: 'twenty-first' }],
      },
      {
        kind: 'explain',
        title: 'Two slips to watch for',
        text: '- Use the ORDER word: *viides*, not *viisi*.\n- Give the month **-ta**: *toukokuuta*, not *toukokuu*.',
      },
      {
        kind: 'check',
        question: 'Which one is "the 5th of May"?',
        options: [
          { ref: { date: 'fifth', month: 'may', wrong: 'number' } },
          { ref: { date: 'fifth', month: 'may' }, correct: true },
          { ref: { date: 'fifth', month: 'may', wrong: 'month' } },
        ],
        explain: 'ORDER word *viides* (5th) + month with **-ta**: *viides toukokuuta*.',
      },
      {
        kind: 'check',
        question: 'Which one is "the 15th of June"?',
        options: [
          { ref: { date: 'fifteenth', month: 'june' }, correct: true },
          { ref: { date: 'fifteenth', month: 'june', wrong: 'number' } },
          { ref: { date: 'fifteenth', month: 'june', wrong: 'month' } },
        ],
        explain: '*viidestoista* (15th) + *kesäkuuta*.',
      },
      {
        kind: 'check',
        question: 'Which one is "the 1st of January"?',
        options: [
          { ref: { date: 'first', month: 'january' }, correct: true },
          { ref: { date: 'first', month: 'january', wrong: 'number' } },
        ],
        explain: '*ensimmäinen tammikuuta* — the first of January.',
      },
    ],
  },
  {
    id: 'age',
    titleFi: 'Kuinka vanha olet?',
    titleEn: 'How old are you?',
    emoji: '🎂',
    cards: [
      {
        kind: 'examples',
        title: 'Olen … vuotta vanha',
        text:
          'Your age: the number + *vuotta* (years — with **-ta** after a number, like *kaksi kirjaa*) + *vanha* (old).',
        rows: [{ age: 'seven' }, { age: 'eight' }, { age: 'nine' }],
      },
      {
        kind: 'explain',
        title: 'The number, not the order word',
        text: 'Your age is HOW MANY years: *kahdeksan* (8) — not *kahdeksas* (8th).',
      },
      {
        kind: 'check',
        question: 'Which one means "I\'m eight years old"?',
        options: [
          { ref: { age: 'eight' }, correct: true },
          { ref: { age: 'nine' } },
        ],
        explain: '8 = *kahdeksan*: *Olen kahdeksan vuotta vanha*.',
      },
      {
        kind: 'check',
        question: '*vuotta* means…',
        options: [{ text: 'years', correct: true }, { text: 'months' }, { text: 'days' }],
        explain: '*vuosi* = year; after a number → *vuotta*.',
      },
    ],
  },
];

export const lessonById: Readonly<Record<string, Lesson>> = Object.fromEntries(
  lessons.map((l) => [l.id, l]),
);

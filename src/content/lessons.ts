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
import { dialogues, personalizeLine } from './dialogues';
import { numbers } from './index';
import { itemById } from './lookup';
import {
  caseSegments,
  possessiveSegments,
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
  | { sentence: string; word: string; asCase?: CaseId; en?: string }
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
  | { line: string; part: 'prompt' | 'reply' };

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
  | {
      kind: 'check';
      title?: string;
      question: string;
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
  if ('sentence' in ref) {
    const con = nounConstructions.find((c) => c.id === ref.sentence);
    const item = itemById(ref.word);
    if (!con || !item) return null;
    const c = ref.asCase ?? con.case;
    const form = ref.asCase ? caseFormOf(item, c, con.number) : formFor(item, con);
    if (!form) return null;
    const segs = sentenceSegments(
      con.before,
      caseSegments(form, c, con.number === 'plural'),
      con.after,
      con.punct,
    );
    return {
      segments: segs,
      en: ref.en ?? (ref.asCase ? undefined : englishSentenceFor(item, con)),
      emoji: item.emoji,
      speak: segmentsText(segs),
    };
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
          'Finnish is one of the easiest languages in the world to read out loud. **Every letter always makes the same sound**, and you say every letter you see.\n\nNo silent letters, like the k in English "knee"!',
      },
      {
        kind: 'examples',
        title: 'Double letters are long',
        text:
          'When a letter is written **twice**, you hold the sound longer. That can change the whole word! Listen to the difference:',
        rows: [
          { word: 'fire', en: 'fire (short u)' },
          { word: 'wind', en: 'wind (long uu)' },
          { word: 'friend', en: 'friend' },
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
        kind: 'explain',
        title: 'The beat of a word',
        text:
          'In Finnish you always press on the **first part** of a word: KIR-ja, PÖY-tä, O-pet-ta-ja. Say the rest lightly.',
      },
      {
        kind: 'examples',
        title: 'Your first Finnish',
        text: 'These are the first things to say. Tap 🔊 and copy them out loud.',
        rows: [
          { line: 'good-morning', part: 'prompt' },
          { line: 'how-are-you', part: 'prompt' },
          { line: 'how-are-you', part: 'reply' },
          { line: 'thanks', part: 'prompt' },
          { line: 'goodbye', part: 'prompt' },
        ],
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
        title: 'One to ten',
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
        ],
      },
      {
        kind: 'explain',
        title: 'One, or more than one?',
        text:
          'With **one** thing, the word stays just as it is: *yksi kirja*.\n\nWith **two or more**, Finnish adds a little ending: **-a** or **-ä**. And the word stays singular — no "-s" like in English!',
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
        kind: 'explain',
        title: 'Who has it?',
        text:
          'The **-lla / -llä** ending means "on". So:\n- *minulla* — on me → **I have**\n- *sinulla* — on you → **you have**\n- *hänellä* — on him/her → **he/she has**\n- *meillä* — on us → **we have**\n- *teillä* — on you all → **you all have**\n- *heillä* — on them → **they have**',
      },
      {
        kind: 'examples',
        title: 'Listen',
        rows: [
          { sentence: 'i-have', word: 'bike' },
          { sentence: 'you-have', word: 'phone' },
          { sentence: 'she-has', word: 'guitar' },
          { sentence: 'we-have', word: 'dog' },
          { sentence: 'they-have', word: 'computer' },
        ],
      },
      {
        kind: 'check',
        question: '*Sinulla on pallo.* — Who has the ball?',
        options: [{ text: 'I do' }, { text: 'You do', correct: true }, { text: 'We do' }],
        explain: '*sinulla* = "on you" → **you** have the ball.',
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
        kind: 'verbTable',
        title: 'syödä — to eat',
        text: 'The marked ending is the "who" part.',
        verb: 'eat',
        tense: 'present',
        polarity: 'positive',
      },
      {
        kind: 'explain',
        title: 'The six endings',
        text:
          '- **-n** → I\n- **-t** → you\n- (the vowel just gets longer) → he / she\n- **-mme** → we\n- **-tte** → you all\n- **-vat / -vät** → they',
      },
      {
        kind: 'verbTable',
        title: 'lukea — to read',
        verb: 'read',
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
    ],
  },
  {
    id: 'likes',
    titleFi: 'Pidän ja rakastan',
    titleEn: 'Liking and loving',
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
        title: 'pitää → -sta / -stä',
        text:
          '"I like" is *pidän*, and the thing you like always gets **-sta / -stä** (it really means "from").',
        rows: [
          { sentence: 'i-like', word: 'football' },
          { sentence: 'i-like', word: 'pizza' },
          { sentence: 'i-like', word: 'music' },
          { sentence: 'i-like', word: 'ice-cream' },
        ],
      },
      {
        kind: 'examples',
        title: 'rakastaa → -a / -ä',
        text: '"I love" is *rakastan*, and it always wants **-a / -ä** instead.',
        rows: [
          { sentence: 'i-love', word: 'pizza' },
          { sentence: 'i-love', word: 'chocolate' },
          { sentence: 'i-love', word: 'cat' },
        ],
      },
      {
        kind: 'check',
        question: 'Which one means "I like music"?',
        options: [
          { ref: { sentence: 'i-like', word: 'music' }, correct: true },
          { ref: { sentence: 'i-like', word: 'music', asCase: 'partitive' } },
        ],
        explain: '*pidän* always takes **-sta / -stä**: *musiikista*.',
      },
    ],
  },
  {
    id: 'total-object',
    titleFi: 'Näen ja odotan',
    titleEn: 'Seeing vs. watching',
    emoji: '👀',
    cards: [
      {
        kind: 'examples',
        title: 'The whole thing: -n',
        text: 'When you **see the whole thing** (just once), it gets **-n**.',
        rows: [
          { sentence: 'i-see', word: 'bus' },
          { sentence: 'i-see', word: 'train' },
          { sentence: 'i-see', word: 'teacher' },
        ],
      },
      {
        kind: 'examples',
        title: 'Going on for a while: -a / -ä',
        text:
          '*katsoa* (to watch) and *odottaa* (to wait for) take a while — so the thing always gets **-a / -ä**.',
        rows: [
          { sentence: 'i-watch', word: 'movie' },
          { sentence: 'i-wait-for', word: 'bus' },
          { sentence: 'i-wait-for', word: 'friend' },
        ],
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
    ],
  },
  {
    id: 'buying',
    titleFi: 'Kaupassa',
    titleEn: 'One whole thing, or some?',
    emoji: '🛒',
    cards: [
      {
        kind: 'examples',
        title: 'One whole thing: -n',
        text: 'Buying **one whole thing** — an apple, a banana — it gets **-n**.',
        rows: [
          { sentence: 'i-buy', word: 'apple' },
          { sentence: 'i-buy', word: 'banana' },
        ],
      },
      {
        kind: 'examples',
        title: 'Some of a stuff: -a / -ä',
        text:
          'Milk, bread, juice — you don\'t buy "one milk", you buy **some**. Then it gets **-a / -ä**. (Remember: -a means "not all of it".)',
        rows: [
          { sentence: 'i-buy-some', word: 'milk' },
          { sentence: 'i-buy-some', word: 'bread' },
          { sentence: 'i-buy-some', word: 'juice' },
        ],
      },
      {
        kind: 'check',
        question: '*Ostan maitoa.* — How much milk?',
        options: [{ text: 'Some milk', correct: true }, { text: 'One whole milk' }],
        explain: '**-a** (*maitoa*) means "some of it".',
      },
    ],
  },
  {
    id: 'agreement',
    titleFi: 'Millainen?',
    titleEn: 'Describing words copy',
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
        title: 'Describing words go first',
        text: 'Just like English: the describing word comes **before** the thing.',
        rows: [
          { agree: 'big', word: 'dog', case: 'nominative', en: 'a big dog' },
          { agree: 'red', word: 'ball', case: 'nominative', en: 'a red ball' },
        ],
      },
      {
        kind: 'examples',
        title: 'They copy the ending!',
        text:
          'This is the cool part: whatever ending the thing gets, the **describing word gets it too** — like an echo.',
        rows: [
          { agree: 'big', word: 'house', case: 'inessive', en: 'in a big house' },
          { agree: 'small', word: 'dog', case: 'genitive', en: "a small dog's" },
          { agree: 'red', word: 'ball', case: 'partitive', en: 'red ball (some / not all)' },
        ],
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
          { word: 'box', case: 'inessive' },
          { word: 'house', case: 'inessive' },
          { word: 'school', case: 'inessive' },
        ],
      },
      {
        kind: 'examples',
        title: '"On" is -lla / -llä',
        rows: [
          { word: 'table', case: 'adessive' },
          { word: 'chair', case: 'adessive' },
          { word: 'bed', case: 'adessive' },
        ],
      },
      {
        kind: 'examples',
        title: 'The vowel team again',
        text:
          'Words with **a, o, u** → *-ssa, -lla*. Words with **ä, ö, y** → *-ssä, -llä*. Look at *talossa* vs. *metsässä*.',
        rows: [
          { word: 'house', case: 'inessive' },
          { word: 'forest', case: 'inessive' },
          { word: 'table', case: 'adessive' },
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
    ],
  },
  {
    id: 'into-out',
    titleFi: 'Missä? Mihin? Mistä?',
    titleEn: 'In, into, out of',
    emoji: '🚶',
    cards: [
      {
        kind: 'explain',
        title: 'Three questions',
        text:
          '- *Missä?* — where is it? (**in / on**)\n- *Mihin?* — where is it going? (**into / onto**)\n- *Mistä?* — where is it coming from? (**out of / off**)\n\nEach question has its own endings.',
      },
      {
        kind: 'examples',
        title: 'Things you go INSIDE',
        rows: [
          { sentence: 'in-it', word: 'box' },
          { sentence: 'into-it', word: 'box' },
          { sentence: 'out-of-it', word: 'box' },
        ],
      },
      {
        kind: 'examples',
        title: 'Things you go ON TOP of',
        rows: [
          { sentence: 'on-it', word: 'table' },
          { sentence: 'onto-it', word: 'table' },
          { sentence: 'off-it', word: 'table' },
        ],
      },
      {
        kind: 'explain',
        title: 'The pattern',
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
        title: 'Stacking endings',
        text: 'The "my" ending can even go **after** a place ending: "in my house".',
        rows: [
          { possessive: 'house', possessor: '1sg', case: 'inessive' },
          { possessive: 'room', possessor: '2sg', case: 'inessive' },
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
        rows: [
          { word: 'book', number: 'plural' },
          { word: 'ball', number: 'plural' },
          { word: 'friend', number: 'plural' },
        ],
      },
      {
        kind: 'examples',
        title: '"Some" things',
        text:
          'When you mean **some** or **any** (not a fixed group), Finnish uses a different plural ending, usually **-ja / -jä** or **-ita / -itä**. It\'s the plural cousin of the -a ending!',
        rows: [
          { sentence: 'these-are', word: 'book' },
          { sentence: 'i-have-some', word: 'ball' },
          { sentence: 'i-havent-any', word: 'game' },
        ],
      },
      {
        kind: 'examples',
        title: 'In many things: -issa',
        text: 'Place endings work in the plural too — an **-i-** slips in before them.',
        rows: [{ sentence: 'in-them', word: 'box' }],
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
          'To say something **already happened**, Finnish slips an **-i-** into the verb, just before the "who" ending: *syön* (I eat) → *söin* (I ate). Sometimes a vowel changes too — listen for the **i**.',
      },
      {
        kind: 'verbTable',
        title: 'syödä — ate',
        verb: 'eat',
        tense: 'past',
        polarity: 'positive',
      },
      {
        kind: 'explain',
        title: '"Didn\'t"',
        text:
          'For "didn\'t", use the "not" verb you already know (*en, et, ei…*) plus a special form ending in **-nut / -nyt** (or **-neet** for we, you all and they).',
      },
      {
        kind: 'verbTable',
        title: 'syödä — didn\'t eat',
        verb: 'eat',
        tense: 'past',
        polarity: 'negative',
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
          { ref: { verb: 'read', tense: 'past', polarity: 'negative', person: '1sg' } },
        ],
        explain: 'The **-i-** shows the past: *luin*.',
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
          { word: 'table', case: 'adessive', number: 'plural' },
          { word: 'box', case: 'elative', number: 'plural' },
          { word: 'table', case: 'allative', number: 'plural' },
        ],
      },
      {
        kind: 'explain',
        title: 'Keep climbing',
        text:
          'Every practice here gets **harder and harder** as you improve — tricky look-alike answers, no English hints, and finally writing Finnish just from hearing it.',
      },
    ],
  },
];

export const lessonById: Readonly<Record<string, Lesson>> = Object.fromEntries(
  lessons.map((l) => [l.id, l]),
);

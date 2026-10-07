// "Why?" tips — the one-line rule shown after a wrong answer, so a mistake
// teaches something instead of just buzzing. Authored English (same markup as
// lessons: **bold**, *Finnish*); the example is the CORRECT looked-up form with
// its ending marked (endings.ts — presentation only, never a generated form).

import type {
  CaseId,
  Construction,
  GrammaticalNumber,
  LexicalItem,
  PersonId,
  Polarity,
  PossessorId,
  VerbTense,
} from './types';
import { caseFormOf, countingNounForm, formFor, possessiveForm, verbForm, PERSONS } from './types';
import { caseSegments, possessiveSegments, verbSegments, type Segment } from './endings';
import { gradation, gradationLabel, isSpecialVerb, verbType } from './verbTypes';

export interface Why {
  /** The rule, kid-level English. */
  text: string;
  /** The correct form with the ending that matters marked. */
  example?: Segment[];
}

// Per-construction rules (the verb or position word decides the ending).
const CONSTRUCTION_RULES: Record<string, string> = {
  'this-is': 'After *Tämä on*, the word stays in its **basic form**.',
  'where-is': 'After *Missä on*, the word stays in its **basic form**.',
  'is-this': 'In *Onko tämä…?* the word stays in its **basic form**.',
  'i-have': 'With *Minulla on*, the thing you have stays in its **basic form**.',
  'you-have': 'With *Sinulla on*, the thing stays in its **basic form**.',
  'she-has': 'With *Hänellä on*, the thing stays in its **basic form**.',
  'we-have': 'With *Meillä on*, the thing stays in its **basic form**.',
  'they-have': 'With *Heillä on*, the thing stays in its **basic form**.',
  'i-havent': 'After *ei ole* (is not), the thing gets **-a / -ä** (or **-ta / -tä**).',
  'i-like': '*Pidän* (I like) always takes **-sta / -stä**.',
  'i-love': '*Rakastan* (I love) always takes **-a / -ä** (or **-ta / -tä**).',
  'i-see': 'Seeing the whole thing → **-n**.',
  'i-watch': 'Watching goes on for a while → **-a / -ä** (or **-ta / -tä**).',
  'i-wait-for': 'Waiting goes on for a while → **-a / -ä** (or **-ta / -tä**).',
  'i-buy': 'Buying one whole thing → **-n**.',
  'i-buy-some': 'Buying SOME of something → **-a / -ä** (or **-ta / -tä**).',
  'on-it': 'ON something → **-lla / -llä**.',
  'in-it': 'IN something → **-ssa / -ssä**.',
  'into-it': 'INTO something → a long vowel + **n** (or **-seen**).',
  'onto-it': 'ONTO something → **-lle**.',
  'out-of-it': 'OUT OF something → **-sta / -stä**.',
  'off-it': 'OFF something → **-lta / -ltä**.',
  'in-front-of': 'Before *edessä* (in front of), the thing gets **-n**.',
  behind: 'Before *takana* (behind), the thing gets **-n**.',
  'next-to': 'Before *vieressä* (next to), the thing gets **-n**.',
  under: 'Before *alla* (under), the thing gets **-n**.',
  'in-front-of-them': 'Before *edessä*, MANY things get **-en / -jen**.',
  'behind-them': 'Before *takana*, MANY things get **-en / -jen**.',
  'next-to-them': 'Before *vieressä*, MANY things get **-en / -jen**.',
  'under-them': 'Before *alla*, MANY things get **-en / -jen**.',
  'is-under': 'Before *alla* (under), the thing gets **-n**.',
  'is-behind': 'Before *takana* (behind), the thing gets **-n**.',
  'is-in-front-of': 'Before *edessä* (in front of), the thing gets **-n**.',
  'is-next-to': 'Before *vieressä* (next to), the thing gets **-n**.',
  'this-is-mine': '*minun* (my) + the ending **-ni**.',
  'i-am': 'After *Olen* (I am), the feeling stays in its **basic form**.',
  'she-is': 'After *Hän on* (he/she is), the feeling stays in its **basic form**.',
  'i-am-not': 'After *En ole* (I am not), a feeling STILL stays in its **basic form**.',
  'i-feel': '*Minulla on* + the feeling in its **basic form** — "on me is hunger".',
  'i-dont-like': '*En pidä* (I don\'t like) still takes **-sta / -stä**.',
  'i-am-in': 'You are IN a place → **-ssa / -ssä**.',
  'i-am-on': 'You are AT / ON a place → **-lla / -llä**.',
  'now-month': 'After *Nyt on*, the month stays in its **basic form**: *toukokuu*.',
  'birthday-in': 'IN a month → **-ssa / -ssä**: *toukokuussa* (in May).',
  'owner-thing': 'The OWNER gets **-n**, and comes first: *isän pyörä* (Dad\'s bike).',
  'go-by': '"By" bus, car, train → **-lla / -llä**: *bussilla*.',
  'write-with': '"With" a tool → **-lla / -llä**: *kynällä*.',
  'draw-with': '"With" a tool → **-lla / -llä**: *kynällä*.',
  'eat-with': '"With" a tool → **-lla / -llä**: *lusikalla*.',
  'play-with-toy': 'Playing WITH a toy → **-lla / -llä**: *pallolla*.',
  'open-with': '"With" a tool → **-lla / -llä**: *avaimella*.',
  'with-someone': 'WITH a person (or a pet) → **-n** + *kanssa*: *kaverin kanssa*. **-lla** is only for tools and rides!',
  'i-go-into': 'Going INTO a place → a long vowel + **n** (or **-seen**).',
  'i-go-onto': 'Going TO an "on" place → **-lle**.',
  'i-come-from-in': 'Coming FROM inside a place → **-sta / -stä**.',
  'i-come-from-on': 'Coming FROM an "on" place → **-lta / -ltä**.',
  'today-is': 'After *Tänään on*, the day stays in its **basic form** (no capital letter!).',
  'play-on-day': 'ON a day → **-na / -nä**: *maanantaina*.',
  'play-at-time': 'IN the morning / IN summer → **-lla / -llä**: *aamulla*, *kesällä*.',
  'i-want-to': 'After *Haluan* (I want), the next verb stays in its **basic form**: *leikkiä*.',
  'i-dont-want-to': 'After *En halua*, the next verb stays in its **basic form**.',
  'i-can': 'After *Osaan* (I can), the next verb stays in its **basic form**: *uida*.',
  'may-i': 'After *Saanko* (may I), the next verb stays in its **basic form**.',
  'clock-is': 'After *Kello on*, the number stays in its **basic form**.',
  'this-is-yours': '*sinun* (your) + the ending **-si**.',
  'this-is-theirs': '*hänen* (his / her) + the ending **-nsa / -nsä**.',
  'where-is-yours': '*sinun* (your) + the ending **-si**.',
  'i-have-some': '"Some" things → the plural **-ja / -jä** (or **-ita / -itä**).',
  'i-havent-any': '"Not any" → the plural **-ja / -jä** (or **-ita / -itä**).',
  'these-are': '*Nämä ovat* + "some" things → plural **-ja / -jä** (or **-ita / -itä**).',
  'where-are': 'MORE than one → the plural **-t**.',
  'in-them': 'IN many things → **-issa / -issä**.',
  'on-them': 'ON many things → **-illa / -illä**.',
  'onto-them': 'ONTO many things → **-ille**.',
  'out-of-them': 'OUT OF many things → **-ista / -istä**.',
  'off-them': 'OFF many things → **-ilta / -iltä**.',
};

const CASE_DEFAULTS: Partial<Record<CaseId, string>> = {
  nominative: 'Here the word stays in its **basic form**.',
  genitive: 'Here the word takes **-n**.',
  partitive: 'Here the word takes **-a / -ä** (or **-ta / -tä**).',
  inessive: 'IN something → **-ssa / -ssä**.',
  elative: 'OUT OF / FROM something → **-sta / -stä**.',
  illative: 'INTO something → a long vowel + **n** (or **-seen**).',
  adessive: 'ON something → **-lla / -llä**.',
  ablative: 'OFF something → **-lta / -ltä**.',
  allative: 'ONTO something → **-lle**.',
  essive: 'ON a day → **-na / -nä**.',
};

export function whyForConstruction(con: Construction, item: LexicalItem): Why {
  const form = formFor(item, con);
  const fallback = con.possessor ? POSSESSOR_RULE[con.possessor] : CASE_DEFAULTS[con.case];
  return {
    text: CONSTRUCTION_RULES[con.id] ?? fallback ?? 'Look at the ending.',
    example: form
      ? con.possessor
        ? possessiveSegments(form, con.possessor)
        : caseSegments(form, con.case, con.number === 'plural')
      : undefined,
  };
}

/** Counting: one stays basic, two+ take -a / -ä. */
export function whyForCount(count: number, numberFi: string, noun: LexicalItem): Why {
  const form = countingNounForm(noun, count);
  return {
    text:
      count === 1
        ? 'With **one** thing, the word stays in its basic form.'
        : 'With **two or more**, the word gets **-a / -ä** (or **-ta / -tä**) and stays singular.',
    example: [
      { text: numberFi + ' ' },
      ...(count === 1 ? [{ text: form }] : caseSegments(form, 'partitive')),
    ],
  };
}

/** Conjugation: which part of the verb shows who / when / not. */
/**
 * The verb's family, and — for a verb whose k / p / t changes — which persons
 * get which sound. Shows only sourced forms (the infinitive, minä, hän).
 */
export function verbTypeNote(verb: LexicalItem): string | undefined {
  const t = verbType(verb);
  const mina = verbForm(verb, 'present', 'positive', '1sg');
  const han = verbForm(verb, 'present', 'positive', '3sg');
  if (!t || !mina || !han) return undefined;
  if (isSpecialVerb(verb)) {
    return `*${verb.fi}* is a special one — learn it by heart: *minä ${mina}*, *hän ${han}*.`;
  }
  const g = gradation(verb);
  if (!g) return `Type ${t}: *${verb.fi}* → *minä ${mina}*, *hän ${han}*.`;
  const change = `**${gradationLabel(g)}**`;
  return g.strong === 'infinitive'
    ? `Type ${t}, and the sound changes (${change}): weak for I, you, we, you all (*minä ${mina}*) — strong for he, she, they (*hän ${han}*).`
    : `Type ${t}, and the sound gets STRONGER (${change}) in every person: *minä ${mina}*, *hän ${han}*.`;
}

export function whyForVerb(
  verb: LexicalItem,
  tense: VerbTense,
  polarity: Polarity,
  person: PersonId,
): Why {
  const form = verbForm(verb, tense, polarity, person);
  const pronoun = PERSONS.find((p) => p.id === person)?.fi ?? '';
  let text: string;
  if (polarity === 'negative') {
    text =
      tense === 'past' || tense === 'perfect'
        ? '"Didn\'t": the "not" verb (*en, et, ei, emme, ette, eivät*) shows who, then **-nut / -nyt** (plural **-neet**).'
        : 'The "not" verb shows who — *en, et, ei, emme, ette, eivät* — and the main verb stays short.';
  } else if (tense === 'past') {
    text = 'The past slips in an **-i-** before the "who" ending.';
  } else if (tense === 'conditional') {
    text = '"Would" slips in **-isi-** before the "who" ending.';
  } else if (tense === 'perfect') {
    text = '"Have done" = *olla* (to be) + the **-nut / -nyt** form.';
  } else {
    text =
      'The ending shows who: **-n** I · **-t** you · (last vowel doubles) he/she · **-mme** we · **-tte** you all · **-vat / -vät** they.';
    const note = verbTypeNote(verb);
    if (note) text += '\n\n' + note;
  }
  return {
    text,
    example: form
      ? [{ text: pronoun + ' ' }, ...verbSegments(form, tense, polarity, person)]
      : undefined,
  };
}

const POSSESSOR_RULE: Record<PossessorId, string> = {
  '1sg': '"My" is the ending **-ni**.',
  '2sg': '"Your" is the ending **-si**.',
  '3rd': '"His / her / their" is the ending **-nsa / -nsä** (or a long vowel + n).',
};

export function whyForPossessor(
  item: LexicalItem,
  possessor: PossessorId,
  c: CaseId = 'nominative',
): Why {
  const form = possessiveForm(item, possessor, c);
  return {
    text: POSSESSOR_RULE[possessor],
    example: form ? possessiveSegments(form, possessor) : undefined,
  };
}

/** Agreement: the describing word copies the noun's ending. */
export function whyForAgreement(
  adjective: LexicalItem,
  noun: LexicalItem,
  c: CaseId,
  number: GrammaticalNumber = 'singular',
): Why {
  const a = caseFormOf(adjective, c, number);
  const n = caseFormOf(noun, c, number);
  const pl = number === 'plural';
  return {
    text: 'The describing word **copies the ending** of the thing it describes.',
    example:
      a && n ? [...caseSegments(a, c, pl), { text: ' ' }, ...caseSegments(n, c, pl)] : undefined,
  };
}

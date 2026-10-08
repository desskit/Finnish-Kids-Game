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
import { englishVerbClause } from './englishVerb';

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
  'i-like': '*Pidän* (I like) always takes **-sta / -stä** — just like *tykkään*.',
  'i-like-tykkaan': '*Tykkään* (I like) always takes **-sta / -stä**: *Tykkään pitsasta*.',
  'i-love': '*Rakastan* (I love) always takes **-a / -ä** (or **-ta / -tä**).',
  'i-see': 'Seeing the whole thing → **-n**.',
  'i-watch': 'Watching goes on for a while → **-a / -ä** (or **-ta / -tä**).',
  'i-wait-for': 'Waiting goes on for a while → **-a / -ä** (or **-ta / -tä**).',
  'i-buy': 'Buying one whole thing → **-n**.',
  'i-buy-some': 'Buying SOME of something → **-a / -ä** (or **-ta / -tä**).',
  'on-it': 'ON something → **-lla / -llä**.',
  'in-it': 'IN something → **-ssa / -ssä**.',
  'into-it': 'INTO something → a long vowel + **n** (*laatikkoon*) — or **-seen** (*huoneeseen*), or **h** + vowel + **n** (*puuhun*).',
  'onto-it': 'ONTO something → **-lle**.',
  'out-of-it': 'OUT OF something → **-sta / -stä**.',
  'off-it': 'OFF something → **-lta / -ltä**.',
  'in-front-of': 'The thing gets **-n** and comes FIRST, then *edessä*: *talon edessä* (in front of the house).',
  behind: 'The thing gets **-n** and comes FIRST, then *takana*: *puun takana* (behind the tree).',
  'next-to': 'The thing gets **-n** and comes FIRST, then *vieressä*: *kaverin vieressä* (next to a friend).',
  under: 'The thing gets **-n** and comes FIRST, then *alla*: *pöydän alla* (under the table).',
  'in-front-of-them': 'MANY things get a plural **-n** ending (*-jen, -ien, -iden*…) and come first: *kirjojen edessä*.',
  'behind-them': 'MANY things get a plural **-n** ending (*-jen, -ien, -iden*…) and come first: *tuolien takana*.',
  'next-to-them': 'MANY things get a plural **-n** ending (*-jen, -ien, -iden*…) and come first: *veneiden vieressä*.',
  'under-them': 'MANY things get a plural **-n** ending (*-jen, -ien, -iden*…) and come first: *pöytien alla*.',
  'is-under': 'The thing gets **-n** and comes FIRST, then *alla* (under): *tuolin alla*.',
  'is-behind': 'The thing gets **-n** and comes FIRST, then *takana* (behind): *puun takana*.',
  'is-in-front-of': 'The thing gets **-n** and comes FIRST, then *edessä* (in front of): *talon edessä*.',
  'is-next-to': 'The thing gets **-n** and comes FIRST, then *vieressä* (next to): *sängyn vieressä*.',
  'this-is-mine': '*minun* (my) + the ending **-ni**.',
  'i-am': 'After *Olen* (I am), the feeling stays in its **basic form**.',
  'she-is': 'After *Hän on* (he/she is), the feeling stays in its **basic form**.',
  'i-am-not': 'After *En ole* (I am not), a feeling STILL stays in its **basic form**.',
  'i-feel': '*Minulla on* + the feeling in its **basic form** — "on me is hunger".',
  'i-dont-like': '*En pidä* (I don\'t like) still takes **-sta / -stä**.',
  'i-dont-like-tykkaa': '*En tykkää* (I don\'t like) still takes **-sta / -stä**.',
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
  'with-someone': 'WITH a person (or a pet) → **-n** + *kanssa*: *kaverin kanssa*. (**-lla** is for a thing you use: *pallolla*.)',
  'i-go-into': 'Going INTO a place → a long vowel + **n** (*kouluun*) — or **-seen** (*huoneeseen*).',
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
  'i-have-some': '"Some" things → the plural **-ja / -jä**, **-ia / -iä** or **-ita / -itä** (*palloja, koiria, veneitä*).',
  'i-havent-any': '"Not any" → the plural **-ja / -jä**, **-ia / -iä** or **-ita / -itä** (*palloja, koiria, veneitä*).',
  'these-are': '*Nämä ovat* + a kind of thing → the plural **-ja / -jä**, **-ia / -iä** or **-ita / -itä** (*kirjoja, koiria*).',
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
  illative: 'INTO something → a long vowel + **n** (or **-seen**, or **h** + vowel + **n**).',
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
        ? '"Didn\'t": the "not" verb (*en, et, ei, emme, ette, eivät*) shows who, then a form ending in **-ut / -yt** — usually *-nut / -nyt* (*en syönyt*), but *-lut, -sut* for some (*en tullut*). For we, you all and they: **-eet** (*emme syöneet*).'
        : 'The "not" verb shows who — *en, et, ei, emme, ette, eivät* — and the main verb is the "I" form without its **-n**: *nukun → en nuku*.';
  } else if (tense === 'past') {
    text =
      'The past slips in an **-i-** before the "who" ending: *syön → söin*. Type 4 verbs get **-si-**: *haluan → halusin*.';
  } else if (tense === 'conditional') {
    text = '"Would" slips in **-isi-** before the "who" ending.';
  } else if (tense === 'perfect') {
    text = '"Have done" = *olla* (to be) + the **-nut / -nyt** form.';
  } else {
    text =
      'The ending shows who: **-n** I · **-t** you · he/she: the last vowel doubles (unless it\'s already long: *syö*) · **-mme** we · **-tte** you all · **-vat / -vät** they.';
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

// --- What a WRONG pick means ------------------------------------------------
//
// A rule alone doesn't say why *your* answer was wrong. These say what the
// picked tile actually means ("*laatikkoon* is the INTO form"), then the rule
// for what was needed — so the child sees the difference, not just the answer.

/** What each case form is, in kid words. */
const FORM_NAME: Partial<Record<CaseId, string>> = {
  nominative: 'the basic form, with no ending',
  genitive: 'the **-n** form ("whose", or the whole thing)',
  partitive: 'the **-a / -ä** form ("some", "not any", or after 2, 3, 4…)',
  inessive: 'the IN form (**-ssa / -ssä**)',
  elative: 'the OUT OF / FROM form (**-sta / -stä**)',
  illative: 'the INTO form',
  adessive: 'the ON / AT / WITH form (**-lla / -llä**)',
  ablative: 'the OFF / FROM form (**-lta / -ltä**)',
  allative: 'the ONTO / TO form (**-lle**)',
  essive: 'the **-na / -nä** form ("on Monday")',
};

/** Which case (and number) a form of this word is — the first match. */
export function caseOfForm(
  item: LexicalItem,
  form: string,
): { c: CaseId; n: GrammaticalNumber } | undefined {
  const f = form.toLowerCase();
  for (const n of ['singular', 'plural'] as const) {
    for (const c of Object.keys(FORM_NAME) as CaseId[]) {
      if (caseFormOf(item, c, n)?.toLowerCase() === f) return { c, n };
    }
  }
  return undefined;
}

/** "the INTO form", "the plural IN form" — what a form of this word is. */
export function formMeaning(item: LexicalItem, form: string): string | undefined {
  const hit = caseOfForm(item, form);
  if (!hit) return undefined;
  if (hit.n === 'plural') {
    return hit.c === 'nominative'
      ? `the plural with **-t** ("the ${item.english?.plural ?? `${item.en}s`}")`
      : `${FORM_NAME[hit.c]}, for MANY things`;
  }
  return FORM_NAME[hit.c]!;
}

/**
 * A carrier-phrase game (build / review): the child picked `picked` — another
 * WORD (its form in this slot) or another FORM of the right word.
 */
export function whyForPhrasePick(
  con: Construction,
  item: LexicalItem,
  picked: { item?: LexicalItem; form?: string },
): Why {
  const base = whyForConstruction(con, item);
  const right = formFor(item, con);
  if (picked.item && picked.item.id !== item.id) {
    const theirs = formFor(picked.item, con);
    return {
      text: `*${theirs}* is "${picked.item.en}" — the right form, but the wrong word. You need "${item.en}": *${right}*.`,
      example: base.example,
    };
  }
  if (picked.form && picked.form !== right) {
    const meaning = formMeaning(item, picked.form);
    return {
      text: meaning ? `*${picked.form}* is ${meaning}. ${base.text}` : base.text,
      example: base.example,
    };
  }
  return base;
}

/** Conjugation: the child picked another person's form — or another verb. */
export function whyForVerbPick(
  verb: LexicalItem,
  tense: VerbTense,
  polarity: Polarity,
  person: PersonId,
  picked: { person: PersonId; form: string; verb?: LexicalItem },
): Why {
  const base = whyForVerb(verb, tense, polarity, person);
  const p = PERSONS.find((x) => x.id === picked.person);
  const target = PERSONS.find((x) => x.id === person);
  if (!p || !target) return base;
  const clause = (v: LexicalItem, who: PersonId) => {
    const pp = PERSONS.find((x) => x.id === who)!;
    return englishVerbClause(pp.en, v.en, v.english, tense, polarity, who);
  };
  if (picked.verb && picked.verb.id !== verb.id) {
    return {
      text: `*${picked.form}* is a different verb: "${clause(picked.verb, picked.person)}". You need *${verb.fi}* — "${clause(verb, person)}".`,
      example: base.example,
    };
  }
  // The pick, then the rule for who-endings — plus the verb's own note only
  // when it matters (a k / p / t change, or a special verb).
  const rule = base.text.split('\n\n')[0];
  const note =
    tense === 'present' && polarity === 'positive' && (gradation(verb) || isSpecialVerb(verb))
      ? verbTypeNote(verb)
      : undefined;
  return {
    text: [
      `*${p.fi} ${picked.form}* means "${clause(verb, picked.person)}". The prompt is *${target.fi}* — "${clause(verb, person)}".`,
      rule,
      note,
    ]
      .filter(Boolean)
      .join('\n\n'),
    example: base.example,
  };
}

/** Agreement: the child picked the thing in a different case than the describing word. */
export function whyForAgreementPick(
  adjective: LexicalItem,
  noun: LexicalItem,
  c: CaseId,
  number: GrammaticalNumber,
  picked: { caseId: CaseId; num: GrammaticalNumber; form: string },
): Why {
  const base = whyForAgreement(adjective, noun, c, number);
  const adj = caseFormOf(adjective, c, number);
  const pickedName = FORM_NAME[picked.caseId];
  const wantName = FORM_NAME[c];
  if (!adj || !pickedName || !wantName) return base;
  const plural = picked.num !== number ? ` (and it's ${picked.num === 'plural' ? 'MANY things' : 'ONE thing'})` : '';
  return {
    text: `*${picked.form}* is ${pickedName}${plural}. But *${adj}* is ${wantName} — the thing must copy it.`,
    example: base.example,
  };
}

const POSSESSOR_EN: Record<PossessorId, string> = { '1sg': 'MY', '2sg': 'YOUR', '3rd': 'HIS / HER / THEIR' };

/** Possessives: the child picked another owner's ending. */
export function whyForPossessorPick(
  item: LexicalItem,
  possessor: PossessorId,
  c: CaseId,
  pickedForm: string,
): Why {
  const base = whyForPossessor(item, possessor, c);
  const who = (Object.keys(POSSESSOR_EN) as PossessorId[]).find(
    (p) => possessiveForm(item, p, c) === pickedForm,
  );
  if (!who || who === possessor) return base;
  return {
    text: `*${pickedForm}* means ${POSSESSOR_EN[who]} ${item.en}. You need ${POSSESSOR_EN[possessor]}: ${POSSESSOR_RULE[possessor]}`,
    example: base.example,
  };
}

/** The ending a case adds, in kid notation — for "that's the ending X takes". */
const CASE_ENDING: Partial<Record<CaseId, string>> = {
  nominative: 'no ending at all',
  genitive: '**-n**',
  partitive: '**-a / -ä** (or **-ta / -tä**)',
  inessive: '**-ssa / -ssä**',
  elative: '**-sta / -stä**',
  illative: 'the INTO ending',
  adessive: '**-lla / -llä**',
  ablative: '**-lta / -ltä**',
  allative: '**-lle**',
  essive: '**-na / -nä**',
};

/**
 * "Which verb, which ending?": the child put the word in another ending. Say
 * which verb of the round that ending belongs to (so the mix-up itself is the
 * lesson), then this verb's rule.
 */
export function whyForVerbCasePick(
  con: Construction,
  item: LexicalItem,
  pickedForm: string,
  others: readonly Construction[],
): Why {
  const base = whyForConstruction(con, item);
  const hit = caseOfForm(item, pickedForm);
  const owners = others.filter(
    (o) => o.id !== con.id && formFor(item, o)?.toLowerCase() === pickedForm.toLowerCase() && o.before,
  );
  const verbs = [...new Set(owners.map((o) => `*${o.before}*`))];
  const ending = hit ? CASE_ENDING[hit.c] : undefined;
  const whose =
    verbs.length > 0
      ? ` — that's the ending ${verbs.join(' and ')} ${verbs.length > 1 ? 'take' : 'takes'}`
      : '';
  return {
    text: `*${pickedForm}* has ${ending ?? 'another ending'}${whose}. ${base.text}`,
    example: base.example,
  };
}

/** Counting: a wrong NUMBER is a miscount; a wrong THING is the wrong word. */
export function whyForCountPick(
  count: number,
  numberFi: string,
  noun: LexicalItem,
  picked: LexicalItem,
): Why {
  const base = whyForCount(count, numberFi, noun);
  if (picked.value !== undefined && picked.topic === 'numbers') {
    return { text: `*${picked.fi}* is ${picked.value}. Count the pictures again, one by one!` };
  }
  return {
    text: `That's "${picked.en}" — look at the picture again. (${base.text})`,
  };
}

/** Find the mistake: the child said "all right" when it wasn't, tapped a word
 *  that can't be wrong, or found a "mistake" in a correct sentence. */
export function whyForErrorPick(
  con: Construction,
  item: LexicalItem,
  slotText: string,
  isCorrect: boolean,
  picked: { ok: true } | { word: string; isSlot: boolean },
): Why {
  const base = whyForConstruction(con, item);
  const slot = slotText.replace(/[.?!]$/, '');
  const meaning = formMeaning(item, slot);
  if (isCorrect) {
    return { text: `This one was already right! ${base.text}`, example: base.example };
  }
  if ('ok' in picked) {
    return {
      text: meaning
        ? `Look again at *${slot}* — it's ${meaning}. ${base.text}`
        : `Look again at the ending of *${slot}*. ${base.text}`,
      example: base.example,
    };
  }
  if (!picked.isSlot) {
    return {
      text: `*${picked.word.replace(/[.?!]$/, '')}* is fine — it never changes here. Check the ending of *${slot}*${meaning ? `: it's ${meaning}` : ''}.`,
      example: base.example,
    };
  }
  return base;
}

// "Valitse oikea muoto" — choose the right form. One small game shape powers
// several grammar points where the WHOLE question is which form of the same
// word fits: answering "Syötkö?" with "Syön." (not "Syöt."), asking
// "Nukutko?", "Juokse! / Älä juokse! / Juostaan!", "Auta minua!", "isän pyörä".
// The options are always the SAME words in different (real) forms, so the
// choice is the grammar, never the vocabulary.
//
// Every verb and noun form is looked up from the sourced tables; the question
// forms (questions.ts) and pronoun forms (pronouns.ts) are small authored
// tables checked by their own tests. Nothing is assembled from rules here.

import type { LexicalItem, PersonId } from "../content/types";
import {
  clothes,
  family,
  freetime,
  school,
  animals,
  adjectives as allAdjectives,
  verbs as allVerbs,
  numbers as allNumbers,
  ordinals as allOrdinals,
  time as allTime,
} from "../content";
import {
  BIRTHDAY_FRAME,
  MONTH_IDS,
  ageSentence,
  dateEnglish,
  dateFi,
  dateSegments,
  yearsWord,
} from "../content/dates";
import {
  comparable,
  comparisonEnglish,
  comparisonSegments,
  comparisonSentence,
  comparisons,
  contests,
  degreeEnglish,
  degreeForm,
  degreeSegments,
  enName,
  superlativeEnglish,
  superlativeSegments,
  superlativeSentence,
  whichIsMost,
  whichOfTwo,
  type Degree,
} from "../content/compare";
import { byIds } from "../util/byIds";
import { itemById as itemByIdSafe } from "../content/lookup";
import {
  caseFormOf,
  commandFor,
  dontForm,
  letsForm,
  ownerGloss,
  verbForm,
} from "../content/types";
import { YOU_QUESTION, questionFor } from "../content/questions";
import {
  PRONOUNS,
  PRONOUN_FRAMES,
  pronounSentence,
  type PronounCase,
} from "../content/pronouns";
import {
  caseSegments,
  dontSegments,
  letsSegments,
  pronounSegments,
  questionSegments,
  verbSegments,
  type Segment,
} from "../content/endings";
import type { Why } from "../content/why";
import { sample, shuffle } from "../util/shuffle";
import {
  TYPE_LOOKS,
  TYPE_TILE,
  typeEnding,
  typeSegments,
  verbType,
  type VerbType,
} from "../content/verbTypes";

export type ChooseMode =
  | "answer"
  | "ask"
  | "mood"
  | "pronoun"
  | "owner"
  | "verb-type"
  | "degree"
  | "compare"
  | "superlative"
  | "ordinal"
  | "date"
  | "age";

export interface FormChoiceQuestion {
  /** Picture anchor, when there is one. */
  emoji?: string;
  /** A Finnish line someone SAYS to the child (spoken aloud), e.g. "Syötkö?". */
  said?: { fi: string; en: string };
  /** The English task ("Say YES", "Mom's bike", "Help me!"). */
  cue: string;
  answer: string;
  /** Answer + distractors, shuffled, all distinct. */
  options: string[];
  why: Why;
  /** A tip for one specific WRONG pick ("Et juokse" = YOU don't run), so the
   *  "Why?" says what that choice actually means, not just the rule. */
  whyFor?: Record<string, Why>;
  /** What to say aloud on a right pick, when the answer isn't Finnish to
   *  read out (a "type 1" tile says the verb itself). Default = the answer. */
  spoken?: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const sentence = (s: string, punct = ".") => cap(s) + punct;

function finish(
  answer: string,
  wrong: (string | undefined)[],
  optionCount: number,
): string[] | null {
  const seen = new Set([answer]);
  const pool: string[] = [];
  for (const w of wrong) {
    if (w && !seen.has(w)) {
      seen.add(w);
      pool.push(w);
    }
  }
  if (pool.length < Math.min(2, optionCount - 1)) return null;
  // Keep the authored order of preference (most instructive wrong form first).
  return shuffle([answer, ...pool.slice(0, optionCount - 1)]);
}

// --- Answering a yes/no question: "Syötkö?" → "Syön." / "En syö." ---------------

function answerQuestion(
  verb: LexicalItem,
  optionCount: number,
): FormChoiceQuestion | null {
  const q = questionFor(verb);
  const yes = verbForm(verb, "present", "positive", "1sg");
  const no = verbForm(verb, "present", "negative", "1sg");
  const youYes = verbForm(verb, "present", "positive", "2sg");
  const youNo = verbForm(verb, "present", "negative", "2sg");
  if (!q || !yes || !no) return null;
  const sayYes = Math.random() < 0.5;
  const answer = sentence(sayYes ? yes : no);
  // The classic slips: answering in "you" ("Syöt.") or the wrong polarity.
  const options = finish(
    answer,
    [
      sentence(sayYes ? no : yes),
      (sayYes ? youYes : youNo) && sentence((sayYes ? youYes : youNo)!),
      (sayYes ? youNo : youYes) && sentence((sayYes ? youNo : youYes)!),
    ],
    optionCount,
  );
  if (!options) return null;
  const example = verbSegments(
    sayYes ? yes : no,
    "present",
    sayYes ? "positive" : "negative",
    "1sg",
  );
  const aboutYou = sayYes
    ? `They asked about YOU, so answer about YOURSELF: the "I" form *${yes}* ("I ${verb.en}").`
    : `They asked about YOU, so answer about YOURSELF: **en** = I don't (*${no}*). **et** would mean "YOU don't".`;
  const whyFor: Record<string, Why> = {
    [sentence(sayYes ? no : yes)]: {
      text: sayYes
        ? `*${no}* says NO ("I don't ${verb.en}"). Here the answer is YES: *${yes}*.`
        : `*${yes}* says YES ("I ${verb.en}"). Here the answer is NO: *${no}*.`,
      example,
    },
  };
  if (youYes) {
    whyFor[sentence(youYes)] = {
      text: sayYes
        ? `*${youYes}* means "YOU ${verb.en}" — the **-t** is "you". They asked about you, so answer about YOURSELF with **-n**: *${yes}* ("I ${verb.en}").`
        : `*${youYes}* means "YOU ${verb.en}". They asked about you, and the answer is NO: *${no}* ("I don't ${verb.en}").`,
      example,
    };
  }
  if (youNo) {
    whyFor[sentence(youNo)] = {
      text: sayYes
        ? `*${youNo}* means "YOU don't ${verb.en}". They asked about you, and the answer is YES: *${yes}* ("I ${verb.en}").`
        : `*${youNo}* means "YOU don't ${verb.en}" — **et** is "you don't". They asked about you, so answer about YOURSELF: **en** = "I don't" → *${no}*.`,
      example,
    };
  }
  return {
    emoji: verb.emoji,
    said: { fi: q, en: `Do you ${verb.en}?` },
    cue: sayYes ? "Answer YES" : "Answer NO",
    answer,
    options,
    why: { text: aboutYou, example },
    whyFor,
  };
}

// --- Asking: "Do you sleep?" → "Nukutko?" ------------------------------------------

function askQuestion(
  verb: LexicalItem,
  others: LexicalItem[],
  optionCount: number,
): FormChoiceQuestion | null {
  const q = questionFor(verb);
  const you = verbForm(verb, "present", "positive", "2sg");
  const me = verbForm(verb, "present", "positive", "1sg");
  if (!q || !you) return null;
  const other = others.find((o) => o.id !== verb.id && YOU_QUESTION[o.id]);
  const options = finish(
    q,
    [sentence(you), other && questionFor(other), me && sentence(me)],
    optionCount,
  );
  if (!options) return null;
  const example = questionSegments(YOU_QUESTION[verb.id]);
  const whyFor: Record<string, Why> = {
    [sentence(you)]: {
      text: `*${you}* just SAYS "you ${verb.en}". To ASK, add **-ko / -kö**: *${YOU_QUESTION[verb.id]}?*`,
      example,
    },
  };
  if (me) {
    whyFor[sentence(me)] = {
      text: `*${me}* means "I ${verb.en}". Ask with the "you" form + **-ko / -kö**: *${YOU_QUESTION[verb.id]}?*`,
      example,
    };
  }
  if (other) {
    whyFor[questionFor(other)!] = {
      text: `*${questionFor(other)}* asks "do you ${other.en}?" — a different action. You want "${verb.en}".`,
      example,
    };
  }
  return {
    emoji: verb.emoji,
    cue: `Ask: "Do you ${verb.en}?"`,
    answer: q,
    options,
    why: {
      text: 'A yes/no question: the "you" verb + **-ko / -kö**.',
      example,
    },
    whyFor,
  };
}

// --- Do it! / Don't! / Let's! -------------------------------------------------------

function moodQuestion(
  verb: LexicalItem,
  optionCount: number,
): FormChoiceQuestion | null {
  const doIt = commandFor(verb);
  const dont = dontForm(verb);
  const lets = letsForm(verb);
  const me = verbForm(verb, "present", "positive", "1sg");
  if (!doIt || !dont || !lets) return null;
  const forms = {
    do: { fi: doIt, en: `${cap(verb.en)}!` },
    dont: { fi: sentence(dont, "!"), en: `Don't ${verb.en}!` },
    lets: { fi: sentence(lets, "!"), en: `Let's ${verb.en}!` },
  };
  const kind = sample(["do", "dont", "lets"] as const, 1)[0];
  const answer = forms[kind].fi;
  const options = finish(
    answer,
    [forms.do.fi, forms.dont.fi, forms.lets.fi, me && sentence(me)],
    optionCount,
  );
  if (!options) return null;
  const why: Why =
    kind === "do"
      ? {
          text: "Telling ONE person to do it: the short verb on its own.",
          example: [{ text: doIt }],
        }
      : kind === "dont"
        ? {
            text: '"Don\'t…!" = *älä* + the short verb.',
            example: dontSegments(dont),
          }
        : {
            text: '"Let\'s…!" ends in **-aan / -ään**.',
            example: letsSegments(lets),
          };
  const meaning = (fi: string, en: string) =>
    `*${fi.replace(/[.!]$/, "")}* means "${en}".`;
  const whyFor: Record<string, Why> = {};
  for (const k of ["do", "dont", "lets"] as const) {
    if (k !== kind)
      whyFor[forms[k].fi] = {
        ...why,
        text: `${meaning(forms[k].fi, forms[k].en)} ${why.text}`,
      };
  }
  if (me)
    whyFor[sentence(me)] = {
      ...why,
      text: `${meaning(me, `I ${verb.en}`)} ${why.text}`,
    };
  return {
    emoji: verb.emoji,
    cue: forms[kind].en,
    answer,
    options,
    why,
    whyFor,
  };
}

// --- Me and you: "Auta minua!" -------------------------------------------------------

const PRONOUN_DISTRACTOR_CASES: PronounCase[] = [
  "nominative",
  "partitive",
  "accusative",
  "allative",
  "elative",
  "adessive",
];

/** What a wrong pronoun form actually says, for the "Why?" tip. */
const CASE_MEANING: Record<PronounCase, string> = {
  nominative:
    'is the plain "I / you / he" form — it never comes after a verb like this.',
  partitive: "has the **-a / -ä** ending — not this one.",
  accusative: 'has the **-t** ending (for "I see you") — not this one.',
  allative: 'means "TO ___" — not this one.',
  elative: 'means "FROM / about ___" — not this one.',
  adessive: 'means "___ has / on ___" — not this one.',
  genitive: 'means "___\'s" — not this one.',
};

function pronounQuestion(optionCount: number): FormChoiceQuestion | null {
  const frame = sample(PRONOUN_FRAMES, 1)[0];
  const persons = (Object.keys(PRONOUNS) as PersonId[]).filter(
    (p) => !frame.exclude.includes(p),
  );
  const person = sample(persons, 1)[0];
  const answer = pronounSentence(frame, person);
  const wrong = shuffle(
    PRONOUN_DISTRACTOR_CASES.filter((c) => c !== frame.case),
  ).map((c) => pronounSentence(frame, person, c));
  const options = finish(answer, wrong, optionCount);
  if (!options) return null;
  const form = PRONOUNS[person][frame.case];
  const example = pronounSegments(form, frame.case);
  const whyFor: Record<string, Why> = {};
  for (const c of PRONOUN_DISTRACTOR_CASES) {
    if (c === frame.case) continue;
    whyFor[pronounSentence(frame, person, c)] = {
      text: `*${PRONOUNS[person][c]}* ${CASE_MEANING[c]} ${frame.rule}`,
      example,
    };
  }
  return {
    cue: frame.en.replace("___", PRONOUNS[person].enObject.toUpperCase()),
    answer,
    options,
    why: { text: frame.rule, example },
    whyFor,
  };
}

// --- Owners: "isän pyörä" (Dad's bike) ----------------------------------------------

function ownerQuestion(
  owners: LexicalItem[],
  things: LexicalItem[],
  optionCount: number,
): FormChoiceQuestion | null {
  const owner = sample(owners, 1)[0];
  const thing = sample(things, 1)[0];
  if (!owner || !thing) return null;
  const gen = caseFormOf(owner, "genitive", "singular");
  if (!gen) return null;
  const answer = `${gen} ${thing.fi}`;
  // The real slips: owner left in its basic form, or "has"-ending (-lla).
  const options = finish(
    answer,
    [
      `${owner.fi} ${thing.fi}`,
      caseFormOf(owner, "adessive", "singular") &&
        `${caseFormOf(owner, "adessive", "singular")} ${thing.fi}`,
      caseFormOf(owner, "allative", "singular") &&
        `${caseFormOf(owner, "allative", "singular")} ${thing.fi}`,
    ],
    optionCount,
  );
  if (!options) return null;
  const example = [...caseSegments(gen, "genitive"), { text: ` ${thing.fi}` }];
  const need = `WHOSE needs **-n** on the owner: *${answer}*.`;
  const ade = caseFormOf(owner, "adessive", "singular");
  const all = caseFormOf(owner, "allative", "singular");
  const whyFor: Record<string, Why> = {
    [`${owner.fi} ${thing.fi}`]: {
      text: `*${owner.fi}* has no ending yet. ${need}`,
      example,
    },
  };
  if (ade)
    whyFor[`${ade} ${thing.fi}`] = {
      text: `*${ade}* is for "${owner.en} HAS" (*${ade} on…*). ${need}`,
      example,
    };
  if (all)
    whyFor[`${all} ${thing.fi}`] = {
      text: `*${all}* means "TO the ${owner.en}". ${need}`,
      example,
    };
  return {
    emoji: thing.emoji,
    cue: cap(ownerGloss(owner, thing)),
    answer,
    options,
    why: {
      text: "The OWNER comes first and takes **-n**: *isä* → *isän pyörä*.",
      example,
    },
    whyFor,
  };
}

// --- The round ----------------------------------------------------------------------

/** People and pets that own things ("isän", "kissan"). */
const OWNER_IDS = [
  "mother",
  "father",
  "brother",
  "sister",
  "baby",
  "grandmother",
  "grandfather",
  "child",
  "teacher",
  "friend",
  "cat",
  "dog",
  "bunny",
];
/** Things you can own and point at. */
const THING_IDS = [
  "ball",
  "bike",
  "game",
  "guitar",
  "piano",
  "phone",
  "computer",
  "book",
  "pencil",
  "backpack",
  "picture",
  "clock",
  "shirt",
  "coat",
  "shoe",
  "sock",
  "hat",
  "dress",
  "cap",
  "boot",
];

/** A step's pools, narrowed to the words met so far (`wordIds`; none = all). */
export function choosePoolsFor(wordIds: string[] | undefined): ChoosePools {
  const known = (items: LexicalItem[]) =>
    wordIds ? (byIds(items, wordIds) as LexicalItem[]) : items;
  const people = [...family.items, ...school.items, ...animals.items].filter(
    (i) => OWNER_IDS.includes(i.id),
  );
  const stuff = [...freetime.items, ...school.items, ...clothes.items].filter(
    (i) => THING_IDS.includes(i.id),
  );
  return {
    verbs: known(allVerbs.items).filter((v) => YOU_QUESTION[v.id]),
    owners: known(people),
    things: known(stuff),
    adjectives: comparable(known(allAdjectives.items)),
    numbers: known(allNumbers.items),
    ordinals: known(allOrdinals.items),
    months: known(allTime.items.filter((t) => MONTH_IDS.includes(t.id))),
    known: wordIds ? new Set(wordIds) : undefined,
  };
}

export interface ChoosePools {
  verbs: LexicalItem[];
  owners: LexicalItem[];
  things: LexicalItem[];
  /** "Which type?" rounds: the verb types on offer (default 1–3). */
  types?: VerbType[];
  /** Comparing rounds: adjectives with sourced degrees (iso → isompi → isoin). */
  adjectives?: LexicalItem[];
  /** Comparing rounds: the words met so far (unset = all). */
  known?: ReadonlySet<string>;
  /** Number / date / age rounds. */
  numbers?: LexicalItem[];
  ordinals?: LexicalItem[];
  months?: LexicalItem[];
}

// --- Numbers, dates and age ------------------------------------------------------

const byValue = (items: LexicalItem[] | undefined, v: number) =>
  items?.find((i) => i.value === v);
const ordinalEn = (n: number) =>
  `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

/** "the 3rd" → kolmas (not kolme); "three" → kolme (not kolmas). */
function ordinalQuestion(pools: ChoosePools): FormChoiceQuestion | null {
  const ord = sample(pools.ordinals ?? [], 1)[0];
  const v = ord?.value;
  const num = v !== undefined ? byValue(pools.numbers, v) : undefined;
  if (!ord || v === undefined || !num) return null;
  const askOrder = Math.random() < 0.6;
  const answer = askOrder ? ord.fi : num.fi;
  const twin = askOrder ? num.fi : ord.fi;
  const near = byValue(askOrder ? pools.ordinals : pools.numbers, v === 1 ? 2 : v - 1);
  const options = finish(answer, [twin, near?.fi], 3);
  if (!options) return null;
  const rule = `*${ord.fi}* = ${ordinalEn(v)} — the ORDER word (first, second, third…). *${num.fi}* = ${v}, just the number.`;
  const whyFor: Record<string, Why> = {
    [twin]: { text: rule, example: [{ text: answer }] },
  };
  if (near) {
    whyFor[near.fi] = {
      text: `*${near.fi}* is ${askOrder ? ordinalEn(near.value!) : near.value}. You need ${askOrder ? ordinalEn(v) : v}: *${answer}*.`,
      example: [{ text: answer }],
    };
  }
  return {
    emoji: askOrder ? ord.emoji : num.emoji,
    cue: askOrder ? `the ${ordinalEn(v)} (${ord.en})` : `${v} (${num.en})`,
    answer,
    options,
    why: { text: rule, example: [{ text: answer }] },
    whyFor,
  };
}

/** "May 5th" → "viides toukokuuta" (not "viisi toukokuuta", not "viides toukokuu"). */
function dateQuestion(pools: ChoosePools): FormChoiceQuestion | null {
  const ord = sample(pools.ordinals ?? [], 1)[0];
  const month = sample(pools.months ?? [], 1)[0];
  const num = ord?.value !== undefined ? byValue(pools.numbers, ord.value) : undefined;
  if (!ord || !month) return null;
  const date = dateFi(ord, month);
  const plainMonth = dateFi(ord, month, "nominative");
  const withNumber = num && dateFi(num, month);
  const example = dateSegments(ord, month);
  if (!date || !plainMonth || !example) return null;
  // Half the time, the whole birthday sentence.
  const birthday = Math.random() < 0.5;
  const wrap = (x: string) => (birthday ? `${BIRTHDAY_FRAME.before} ${x}.` : x);
  const answer = wrap(date);
  const options = finish(answer, [withNumber && wrap(withNumber), wrap(plainMonth)], 3);
  if (!options) return null;
  const en = dateEnglish(ord, month);
  const rule = `A date = the ORDER word (*${ord.fi}*, ${ordinalEn(ord.value!)}) + the month with **-ta / -tä**: *${date}*.`;
  const whyFor: Record<string, Why> = {
    [wrap(plainMonth)]: {
      text: `In a date the month gets **-ta**: *${date}* ("the ${ordinalEn(ord.value!)} of ${month.en}").`,
      example,
    },
  };
  if (withNumber) {
    whyFor[wrap(withNumber)] = {
      text: `*${num!.fi}* is just "${num!.value}". A date uses the ORDER word: *${ord.fi}* (${ordinalEn(ord.value!)}).`,
      example,
    };
  }
  return {
    emoji: birthday ? "🎂" : "📅",
    cue: birthday ? `${BIRTHDAY_FRAME.en} ${en}.` : en,
    answer,
    options,
    why: { text: rule, example },
    whyFor,
  };
}

/** "I'm 8 years old." → "Olen kahdeksan vuotta vanha." */
function ageQuestion(pools: ChoosePools): FormChoiceQuestion | null {
  const num = sample(
    (pools.numbers ?? []).filter((n) => (n.value ?? 0) >= 5 && (n.value ?? 0) <= 10),
    1,
  )[0];
  const ord = num && byValue(pools.ordinals, num.value!);
  const years = yearsWord();
  const year = itemByIdSafe("year");
  const answer = num && ageSentence(num);
  if (!num || !answer || !years || !year) return null;
  const wrongOrd = ord && ageSentence(ord);
  const wrongCase = ageSentence(num, year.fi);
  const options = finish(answer, [wrongCase, wrongOrd], 3);
  if (!options) return null;
  const example: Segment[] = [
    { text: `Olen ${num.fi} ` },
    { text: years, mark: true },
    { text: " vanha." },
  ];
  const whyFor: Record<string, Why> = {};
  if (wrongCase)
    whyFor[wrongCase] = {
      text: `After a number (2 or more) the word gets **-a / -ta**: *${years}*, like *kaksi kirjaa*.`,
      example,
    };
  if (wrongOrd)
    whyFor[wrongOrd] = {
      text: `*${ord!.fi}* means ${ordinalEn(ord!.value!)}. For your age use the number: *${num.fi}*.`,
      example,
    };
  return {
    emoji: "🎂",
    cue: `I'm ${num.value} years old.`,
    answer,
    options,
    why: {
      text: `Number + *${years}* (years, with **-ta** after a number) + *vanha* (old).`,
      example,
    },
    whyFor,
  };
}

// --- Comparing: iso → isompi → isoin; "Norsu on isompi kuin hiiri." ------------

const DEGREE_RULE: Record<Degree, string> = {
  base: "The basic word, with nothing added.",
  comparative: "**-mpi** means MORE: bigger, faster, older.",
  superlative: "**-in** means the MOST of all: biggest, fastest, oldest.",
};

/** A special one (hyvä → parempi → paras) — said so in the Why. */
function irregularNote(adj: LexicalItem): string {
  const c = degreeForm(adj, "comparative")!;
  const s = degreeForm(adj, "superlative")!;
  return c.endsWith("mpi") && s.endsWith("in")
    ? ""
    : ` *${adj.fi}* is a special one: *${c}*, *${s}*.`;
}

function degreeQuestion(adj: LexicalItem): FormChoiceQuestion | null {
  const degrees: Degree[] = ["base", "comparative", "superlative"];
  const d = sample(degrees, 1)[0];
  const forms = degrees.map((x) => degreeForm(adj, x));
  const en = degreeEnglish(adj, d);
  if (forms.some((f) => !f) || !en || new Set(forms).size < 3) return null;
  const answer = degreeForm(adj, d)!;
  const example = degreeSegments(answer, d);
  const whyFor: Record<string, Why> = {};
  for (const x of degrees.filter((y) => y !== d)) {
    whyFor[degreeForm(adj, x)!] = {
      text: `*${degreeForm(adj, x)}* means "${degreeEnglish(adj, x)}". "${en}" is *${answer}*.${irregularNote(adj)}`,
      example,
    };
  }
  return {
    emoji: adj.emoji,
    cue: `"${en}"`,
    answer,
    options: shuffle(forms as string[]),
    why: { text: DEGREE_RULE[d] + irregularNote(adj), example },
    whyFor,
  };
}

function compareQuestion(
  adjectives: LexicalItem[],
  known: ReadonlySet<string> | undefined,
): FormChoiceQuestion | null {
  const c = sample(comparisons(adjectives, known), 1)[0];
  if (!c) return null;
  const { adj, more, less } = c;
  const answer = comparisonSentence(adj, more, less);
  const swapped = comparisonSentence(adj, less, more);
  const basic = comparisonSentence(adj, more, less, "base");
  const q = whichOfTwo(adj);
  const example = comparisonSegments(adj, more, less);
  if (!answer || !swapped || !basic || !q || !example) return null;
  const pair = shuffle([more, less]);
  const options = finish(answer, [swapped, basic], 3);
  if (!options) return null;
  return {
    emoji: pair.map((x) => x.emoji).join("  "),
    said: { fi: q, en: `Which one is ${degreeEnglish(adj, "comparative")}?` },
    cue: `${pair[0].en} or ${pair[1].en}?`,
    answer,
    options,
    why: {
      text: `**-mpi** + **kuin** = "…-er than": ${comparisonEnglish(adj, more, less)}`,
      example,
    },
    whyFor: {
      [swapped]: {
        text: `That says "${comparisonEnglish(adj, less, more)}" — it's the other way round!`,
        example,
      },
      [basic]: {
        text: `With **kuin** (than), use the **-mpi** word: *${degreeForm(adj, "comparative")}*, not *${adj.fi}*.`,
        example,
      },
    },
  };
}

function superlativeQuestion(
  adjectives: LexicalItem[],
  known: ReadonlySet<string> | undefined,
): FormChoiceQuestion | null {
  const c = sample(contests(adjectives, known), 1)[0];
  if (!c) return null;
  const { adj, winner, others, people } = c;
  const answer = superlativeSentence(adj, winner);
  const q = whichIsMost(adj, people);
  const example = superlativeSegments(adj, winner);
  if (!answer || !q || !example) return null;
  const wrong = others.map((o) => superlativeSentence(adj, o));
  const options = finish(answer, wrong, 3);
  if (!options) return null;
  const sup = degreeEnglish(adj, "superlative");
  const whyFor: Record<string, Why> = {};
  for (const o of others) {
    whyFor[superlativeSentence(adj, o)!] = {
      text: `That says "${superlativeEnglish(adj, o)}" — but ${enName(winner)} is the ${sup}!`,
      example,
    };
  }
  return {
    emoji: shuffle([winner, ...others])
      .map((x) => x.emoji)
      .join("  "),
    said: { fi: q, en: `${people ? "Who" : "Which one"} is the ${sup}?` },
    cue: shuffle([winner, ...others])
      .map((x) => x.en)
      .join(", "),
    answer,
    options,
    why: { text: `**-in** = the MOST of all: ${superlativeEnglish(adj, winner)}`, example },
    whyFor,
  };
}

// --- Which verb type? "laulaa" → type 1 ---------------------------------------

function verbTypeQuestion(
  verb: LexicalItem,
  types: VerbType[],
  optionCount: number,
): FormChoiceQuestion | null {
  const t = verbType(verb);
  if (!t || !types.includes(t)) return null;
  const answer = TYPE_TILE[t];
  const others = shuffle(types.filter((x) => x !== t));
  const options = finish(
    answer,
    others.map((x) => TYPE_TILE[x]),
    optionCount,
  );
  if (!options) return null;
  const example = typeSegments(verb.fi, t);
  const whyFor: Record<string, Why> = {};
  for (const x of others) {
    whyFor[TYPE_TILE[x]] = {
      text: `Type ${x} verbs end in **${TYPE_LOOKS[x]}**. *${verb.fi}* ends in **${typeEnding(verb.fi, t)}** — that's type ${t}.`,
      example,
    };
  }
  return {
    emoji: verb.emoji,
    said: { fi: verb.fi, en: `to ${verb.en}` },
    cue: "Look at the end of the word",
    answer,
    spoken: verb.fi,
    options,
    why: {
      text: `Look at the END of the verb: type ${t} ends in **${TYPE_LOOKS[t]}**.`,
      example,
    },
    whyFor,
  };
}

export function buildChooseRound(
  mode: ChooseMode,
  pools: ChoosePools,
  questionCount: number,
  optionCount: number,
): FormChoiceQuestion[] {
  const out: FormChoiceQuestion[] = [];
  const used = new Set<string>();
  const verbs = pools.verbs.filter((v) => v.emoji);
  for (
    let guard = 0;
    out.length < questionCount && guard < questionCount * 10;
    guard++
  ) {
    let q: FormChoiceQuestion | null = null;
    if (mode === "pronoun") q = pronounQuestion(optionCount);
    else if (mode === "degree") {
      const adj = sample(pools.adjectives ?? [], 1)[0];
      if (!adj) break;
      q = degreeQuestion(adj);
    } else if (mode === "compare")
      q = compareQuestion(pools.adjectives ?? [], pools.known);
    else if (mode === "superlative")
      q = superlativeQuestion(pools.adjectives ?? [], pools.known);
    else if (mode === "ordinal") q = ordinalQuestion(pools);
    else if (mode === "date") q = dateQuestion(pools);
    else if (mode === "age") q = ageQuestion(pools);
    else if (mode === "verb-type") {
      // Every verb can be asked about (no picture needed: the word IS the
      // question) — and a type is worth asking about many times.
      const verb = sample(pools.verbs, 1)[0];
      if (!verb) break;
      q = verbTypeQuestion(verb, pools.types ?? [1, 2, 3], optionCount);
      if (q && used.has(q.said!.fi)) continue;
      if (q) used.add(q.said!.fi);
      if (q) out.push(q);
      continue;
    }
    else if (mode === "owner")
      q = ownerQuestion(pools.owners, pools.things, optionCount);
    else {
      const verb = sample(verbs, 1)[0];
      if (!verb) break;
      if (mode === "answer") q = answerQuestion(verb, optionCount);
      else if (mode === "ask")
        q = askQuestion(verb, shuffle(verbs), optionCount);
      else q = moodQuestion(verb, optionCount);
    }
    if (!q || used.has(q.answer + q.cue)) continue;
    used.add(q.answer + q.cue);
    out.push(q);
  }
  return out;
}

/** The highlighted answer for a correct pick (shown after answering). */
export function answerSegments(q: FormChoiceQuestion): Segment[] {
  return q.why.example ?? [{ text: q.answer }];
}

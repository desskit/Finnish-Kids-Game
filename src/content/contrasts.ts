// Which WRONG forms a carrier's slot may be offered as — the shared backbone
// of every "which ending?" question: the pick-the-ending round of the phrase
// steps, "Which verb, which ending?", grammar Review and Find the mistake.
//
// A distractor must be wrong for the sentence's ENGLISH MEANING, not merely a
// different form. Finnish often allows another case with another nuance:
// "Minulla on vettä" (I have some water) is as right as "Minulla on vesi";
// "Katson elokuvan" (I'll watch the whole film) is fine Finnish; "Leikin
// aamuna" (on that morning) isn't wrong. So each carrier lists, in TEACHING
// order (the classic slip first), only the cases that are wrong in it — and
// the object/predicate alternations that are fine for "some" (mass) words are
// offered only for countable things.
//
// Every form handed out is LOOKED UP (caseFormOf / possessiveForm / verbForm)
// from the sourced tables; nothing is built here. The slips themselves are
// grammar judgments — ⚠️ part of the carrier entries in FINNISH_REVIEW.md.

import type { CaseId, Construction, GrammaticalNumber, LexicalItem } from './types';
import { caseFormOf, formFor, possessiveForm, verbForm, POSSESSORS } from './types';
import { isCountable } from './semantics';

export interface Slip {
  case: CaseId;
  /** Default: the construction's own number. */
  number?: GrammaticalNumber;
  /** Only for things you count (not water, milk, bread…): there it'd be fine Finnish. */
  countableOnly?: boolean;
}

const s = (c: CaseId, extra: Partial<Slip> = {}): Slip => ({ case: c, ...extra });
const sg = (c: CaseId, extra: Partial<Slip> = {}): Slip => ({ case: c, number: 'singular', ...extra });
const pl = (c: CaseId, extra: Partial<Slip> = {}): Slip => ({ case: c, number: 'plural', ...extra });

/** The six place endings, for the place carriers' "other places" slips. */
const PLACES_EXCEPT = (own: CaseId): Slip[] =>
  (['inessive', 'elative', 'illative', 'adessive', 'ablative', 'allative'] as CaseId[])
    .filter((c) => c !== own)
    .map((c) => s(c));

// "Minulla on ___" / "Tämä on ___" — the basic form. "-a" would be "some" —
// fine for water or bread, wrong for a cat.
const BASIC: Slip[] = [s('partitive', { countableOnly: true }), s('genitive'), s('elative'), s('adessive')];
// A feeling after olla: always the basic form ("En ole väsynyt", not
// "väsynyttä" — the slip "ei ole → -a" from "Minulla ei ole hattua").
const FEELING: Slip[] = [s('partitive'), s('genitive'), s('elative')];
// Liking: always -sta. "Pidän kissan" would say "I'll keep the cat".
const LIKING: Slip[] = [s('partitive'), s('nominative'), s('genitive')];
// Postpositions: the thing takes -n ("tuolin alla").
const POSTPOSITION: Slip[] = [s('nominative'), s('partitive'), s('adessive')];
// Tools: -lla ("kynällä", "lusikalla"). Not -sta: "Syön lusikasta" (I eat FROM a
// spoon) and "Kirjoitan puhelimesta" (writing from my phone) are fine Finnish.
const WITH_TOOL: Slip[] = [s('nominative'), s('partitive'), s('genitive')];

export const SLIPS: Record<string, Slip[]> = {
  'this-is': BASIC,
  'where-is': BASIC,
  'is-this': BASIC,
  'i-have': BASIC,
  'you-have': BASIC,
  'she-has': BASIC,
  'we-have': BASIC,
  'they-have': BASIC,
  // Not having → -a, always: "Minulla ei ole hattu" is the slip.
  'i-havent': [s('nominative'), s('genitive'), s('elative')],
  'i-like': LIKING,
  'i-like-tykkaan': LIKING,
  'i-dont-like': LIKING,
  'i-dont-like-tykkaa': LIKING,
  // Love → -a. -sta is the liking ending.
  'i-love': [s('elative'), s('nominative'), s('genitive')],
  // See the whole thing → -n. -a only for things you count ("Näen vettä" is fine).
  'i-see': [s('partitive', { countableOnly: true }), s('nominative'), s('elative')],
  // Watching → -a. (Not -n: "Katson elokuvan" = I'll watch the whole film — fine.)
  'i-watch': [s('nominative'), s('elative'), s('adessive')],
  'i-wait-for': [s('genitive'), s('nominative'), s('elative')],
  // One whole thing → -n. (Not -a: for food that's "some" — the shop lesson's
  // other half — and "Ostan kelloa" is "I'm shopping for a clock", fine too.)
  'i-buy': [s('nominative'), s('elative')],
  'i-buy-some': [s('genitive'), s('nominative'), s('elative')],
  'in-front-of': POSTPOSITION,
  behind: POSTPOSITION,
  'next-to': POSTPOSITION,
  under: POSTPOSITION,
  'is-under': POSTPOSITION,
  'is-behind': POSTPOSITION,
  'is-in-front-of': POSTPOSITION,
  'is-next-to': POSTPOSITION,
  'in-front-of-them': [pl('nominative'), sg('genitive'), pl('partitive')],
  'behind-them': [pl('nominative'), sg('genitive'), pl('partitive')],
  'next-to-them': [pl('nominative'), sg('genitive'), pl('partitive')],
  'under-them': [pl('nominative'), sg('genitive'), pl('partitive')],
  // "Some" things → plural -ja. Not "the balls" (pallot): that's fine Finnish too.
  // The singular -a only for things you count: "Minulla on karkkia" (some
  // candy) is as right as "karkkeja" (some candies).
  'i-have-some': [sg('partitive', { countableOnly: true }), sg('nominative')],
  'i-havent-any': [pl('nominative'), sg('nominative')],
  'these-are': [sg('partitive', { countableOnly: true }), sg('nominative')],
  'where-are': [sg('nominative'), pl('partitive')],
  'on-it': [...PLACES_EXCEPT('adessive'), s('nominative')],
  'in-it': [...PLACES_EXCEPT('inessive'), s('nominative')],
  'into-it': [...PLACES_EXCEPT('illative'), s('nominative')],
  'onto-it': [...PLACES_EXCEPT('allative'), s('nominative')],
  'out-of-it': [...PLACES_EXCEPT('elative'), s('nominative')],
  'off-it': [...PLACES_EXCEPT('ablative'), s('nominative')],
  // Many places: the singular place is the slip worth showing first.
  'in-them': [sg('inessive'), ...PLACES_EXCEPT('inessive').map((x) => ({ ...x, number: 'plural' as const }))],
  'on-them': [sg('adessive'), ...PLACES_EXCEPT('adessive').map((x) => ({ ...x, number: 'plural' as const }))],
  'onto-them': [sg('allative'), ...PLACES_EXCEPT('allative').map((x) => ({ ...x, number: 'plural' as const }))],
  'out-of-them': [sg('elative'), ...PLACES_EXCEPT('elative').map((x) => ({ ...x, number: 'plural' as const }))],
  'off-them': [sg('ablative'), ...PLACES_EXCEPT('ablative').map((x) => ({ ...x, number: 'plural' as const }))],
  'i-am': FEELING,
  'she-is': FEELING,
  'i-am-not': FEELING,
  // "Minulla on nälkä": the basic form ("nälkää" is not the everyday way).
  'i-feel': [s('genitive'), s('elative'), s('adessive')],
  'i-am-in': PLACES_EXCEPT('inessive'),
  'i-am-on': PLACES_EXCEPT('adessive'),
  'i-go-into': PLACES_EXCEPT('illative'),
  'i-go-onto': PLACES_EXCEPT('allative'),
  'i-come-from-in': PLACES_EXCEPT('elative'),
  'i-come-from-on': PLACES_EXCEPT('ablative'),
  // The owner takes -n: the basic form, the "has" (-lla) and the "to" (-lle) are the slips.
  // (Not -lle: "Tämä on isälle" = this is FOR Dad — fine Finnish.)
  'owner-thing': [s('nominative'), s('adessive'), s('partitive')],
  'go-by': [s('illative'), s('nominative'), s('partitive')],
  'write-with': WITH_TOOL,
  'draw-with': WITH_TOOL,
  'eat-with': WITH_TOOL,
  // Not -a: "Leikin autoa" can be pretend play ("I'm playing car").
  'play-with-toy': [s('nominative'), s('genitive')],
  'open-with': WITH_TOOL,
  // WITH a person: -n + kanssa. -lla is for a thing you use.
  'with-someone': [s('adessive'), s('nominative'), s('partitive')],
  'now-month': [s('inessive'), s('essive'), s('partitive')],
  // (Not -lla: "toukokuulla" is heard too.)
  'birthday-in': [s('nominative'), s('partitive'), s('illative')],
  'today-is': [s('essive'), s('adessive'), s('partitive')],
  // Days take -na; -lla is for mornings and seasons — the classic swap.
  'play-on-day': [s('adessive'), s('nominative'), s('inessive')],
  // Mornings, seasons → -lla. (Not -na: "aamuna" = on that morning — fine.)
  'play-at-time': [s('nominative'), s('inessive'), s('partitive')],
  'clock-is': [s('partitive'), s('genitive'), s('essive')],
  // "Minulla on tylsää": -a, not the basic form of "Minulla on nälkä".
  'i-have-fun': [s('nominative'), s('genitive'), s('elative')],
  // koskettaa takes -a. (Not -lla: "Kosketa nenällä!" = touch with your nose;
  // not -an: koskea + "nenään" is another verb's way of saying it.)
  'touch-it': [s('nominative'), s('genitive')],
  // After a command, a whole thing keeps its basic form; -n is the slip from
  // "Nostan käden" (I lift my hand). (Not -a: "Nosta kättä" can be fine; not
  // -lla: "nosta kädellä" = lift WITH your hand; not -sta or -en: "nosta
  // kädestä / käteen" can be said of lifting something else.) -na (as a
  // hand) fits no reading.
  'lift-it': [s('genitive'), s('essive')],
  // Playing a game or an instrument takes -a. Not -n: "Pelaan pelin" (a whole
  // game) and "Pelaan kortin" (I play a card) are fine; not -lla: "Pelaan
  // pallolla" and "Soitan kitaralla" are said; not -sta: "Soitan kitarasta"
  // can be calling about it. -na (as a guitar) fits no reading.
  'i-play-game': [s('nominative'), s('essive')],
  'i-play-music': [s('nominative'), s('essive')],
  // "Pese kädet!" — the plural basic form. -n is the slip from "Pesen
  // käden"; never the singular ("Pese käsi!" — one hand) or -a ("Pese
  // käsiä") or -lla ("Pese käsillä" = wash WITH your hands): all fine.
  'wash-hands': [sg('genitive'), pl('genitive')],
};

// IN vs ON places: for most things the two endings mean different things
// (sängyssä / sängyllä — in bed / on the bed), and that contrast is the
// lesson. But where YOU are, go or come from, both are often fine ("Olen
// koululla" = at school; "Tulen koululta"), and some places take either:
// "pihassa / pihalla", "kaupungissa / kaupungilla", a cat "ikkunassa /
// ikkunalla" (in / at the window), "tuolissa / tuolilla" (in / on a chair),
// "laivassa / laivalla" (on board), and "tulee ovesta" (comes in through the
// door) beside "ovelta". There the in/on counterpart is never offered as wrong.
const IN_ON_PAIR: Partial<Record<CaseId, CaseId>> = {
  inessive: 'adessive',
  adessive: 'inessive',
  illative: 'allative',
  allative: 'illative',
  elative: 'ablative',
  ablative: 'elative',
};
const PERSON_PLACE_CARRIERS = new Set(['i-am-in', 'i-am-on', 'i-go-into', 'i-go-onto', 'i-come-from-in', 'i-come-from-on']);
const EITHER_IN_OR_ON = new Set(['yard', 'city', 'window', 'chair', 'ship', 'door']);

function counterpartIsFine(item: LexicalItem, con: Construction, slip: Slip): boolean {
  if (IN_ON_PAIR[con.case] !== slip.case) return false;
  return PERSON_PLACE_CARRIERS.has(con.id) || EITHER_IN_OR_ON.has(item.id);
}

/** Words English doesn't count either: "läksyä" (some homework) is fine Finnish. */
const MASS_IN_ENGLISH = ['homework', 'hair'];

/** Words that can mean "some of it" (mass) — partitive objects are fine for them. */
export function massCapable(item: LexicalItem): boolean {
  return !isCountable(item.id) || item.topic === 'food' || MASS_IN_ENGLISH.includes(item.id);
}

/** Verb carriers ("Haluan ___"): the slip is a finished verb — "Haluan leikin". */
function verbSlips(item: LexicalItem): (string | undefined)[] {
  return [
    verbForm(item, 'present', 'positive', '1sg'),
    verbForm(item, 'present', 'positive', '3sg'),
    verbForm(item, 'present', 'positive', '2sg'),
  ];
}

/**
 * The wrong forms this item may be offered as in this carrier, most
 * instructive first, distinct and never equal to the right form. Possessive
 * carriers offer the other owners' endings (and the bare word); verb carriers
 * a finished verb; everything else the carrier's listed slips. `extraCases`
 * puts other cases first (e.g. the endings of the other verbs in a
 * "which verb?" round) — but only those that are listed slips here too, so a
 * fine-for-this-meaning form is never offered as wrong.
 */
export function slipForms(item: LexicalItem, con: Construction, extraCases: CaseId[] = []): string[] {
  const right = formFor(item, con);
  if (!right) return [];
  const out: string[] = [];
  const seen = new Set([right.toLowerCase()]);
  const push = (f: string | undefined) => {
    if (f && !seen.has(f.toLowerCase())) {
      seen.add(f.toLowerCase());
      out.push(f);
    }
  };
  if (con.verb) {
    verbSlips(item).forEach(push);
    return out;
  }
  if (con.possessor) {
    for (const p of POSSESSORS) {
      if (p.id !== con.possessor) push(possessiveForm(item, p.id, con.case));
    }
    push(caseFormOf(item, con.case, 'singular'));
    return out;
  }
  const slips = (SLIPS[con.id] ?? []).filter(
    (x) => (!x.countableOnly || !massCapable(item)) && !counterpartIsFine(item, con, x),
  );
  const ordered = [
    ...slips.filter((x) => extraCases.includes(x.case)),
    ...slips.filter((x) => !extraCases.includes(x.case)),
  ];
  for (const x of ordered) push(caseFormOf(item, x.case, x.number ?? con.number));
  return out;
}

/** Does this carrier have enough listed slips for an ending question? */
export function hasSlips(con: Construction): boolean {
  return !!con.verb || !!con.possessor || (SLIPS[con.id]?.length ?? 0) >= 2;
}

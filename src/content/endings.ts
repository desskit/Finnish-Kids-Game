import type { CaseId, PersonId, Polarity, PossessorId, VerbTense } from './types';

// Ending HIGHLIGHTER for lessons and why-tips — PRESENTATION ONLY.
//
// Given a form that was already looked up from the sourced tables, mark the
// ending a lesson is talking about ("laatiko|ssa", "syö|mme"). It never builds,
// changes or guesses a form: if the form doesn't end in one of the known
// endings for its tag, nothing is highlighted and the whole word shows plain.
// (Consonant gradation means the STEM can also shift — "laatikko → laatikossa"
// — so lessons say "look at the end", and only the end is ever marked.)

export interface Segment {
  text: string;
  /** True for the highlighted ending. */
  mark?: boolean;
}

const plain = (text: string): Segment[] => [{ text }];

/** Split `form` at the first matching ending pattern (patterns are anchored). */
function splitBy(form: string, patterns: RegExp[]): Segment[] {
  for (const re of patterns) {
    const m = form.match(re);
    if (m && m.index !== undefined && m.index > 0) {
      return [{ text: form.slice(0, m.index) }, { text: m[0], mark: true }];
    }
  }
  return plain(form);
}

const V = '[aeiouyäö]';

// Longest/most specific first. Partitive deliberately omits "tta": in "vettä"
// the ending is "-tä" (vet+tä), so marking "ttä" would mislead.
const CASE_PATTERNS: Partial<Record<CaseId, RegExp[]>> = {
  genitive: [/n$/],
  partitive: [/t[aä]$/, /[aä]$/],
  inessive: [/ss[aä]$/],
  elative: [/st[aä]$/],
  illative: [/seen$/, new RegExp(`h${V}n$`), /(aa|ee|ii|oo|uu|yy|ää|öö)n$/],
  adessive: [/ll[aä]$/],
  ablative: [/lt[aä]$/],
  allative: [/lle$/],
  essive: [/n[aä]$/],
  translative: [/ksi$/],
  abessive: [/tt[aä]$/],
  instructive: [/n$/],
};

// Plural partitive / genitive have their own shapes ("kirjoja", "pelejä",
// "kissojen"); every other plural case slips in an -i- before the singular
// ending ("laatikoissa", "pöydillä"), so that -i- is marked along with it.
const PLURAL_PATTERNS: Partial<Record<CaseId, RegExp[]>> = {
  partitive: [/it[aä]$/, /j[aä]$/, /i[aä]$/],
  genitive: [/jen$/, /iden$/, /itten$/, /den$/, /ten$/, /en$/],
  illative: [/ihin$/, /isiin$/, /iin$/],
};

/** Mark a case ending on a sourced noun/adjective form. Plural nominatives
 *  ("kirjat") get the plural -t marked. */
export function caseSegments(form: string, c: CaseId, plural = false): Segment[] {
  if (c === 'nominative') return plural ? splitBy(form, [/t$/]) : plain(form);
  if (plural) {
    const own = PLURAL_PATTERNS[c];
    const withI = (CASE_PATTERNS[c] ?? []).map((re) => new RegExp('i' + re.source));
    return splitBy(form, [...(own ?? []), ...withI, ...(CASE_PATTERNS[c] ?? [])]);
  }
  return splitBy(form, CASE_PATTERNS[c] ?? []);
}

const PRESENT_ENDINGS: Record<PersonId, RegExp[]> = {
  '1sg': [/n$/],
  '2sg': [/t$/],
  '3sg': [],
  '1pl': [/mme$/],
  '2pl': [/tte$/],
  '3pl': [/v[aä]t$/],
};

// Past: the -i- (tense) + person ending together ("sö|in", "lu|imme").
const PAST_ENDINGS: Record<PersonId, RegExp[]> = {
  '1sg': [/in$/],
  '2sg': [/it$/],
  '3sg': [/i$/],
  '1pl': [/imme$/],
  '2pl': [/itte$/],
  '3pl': [/iv[aä]t$/],
};

// The -nut/-nyt participle (and its plural -neet) — "en syö|nyt".
const PARTICIPLE = [/[nlrst]eet$/, /[nlrst][uy]t$/];

// Conditional -isi- + person ending ("sö|isin").
const CONDITIONAL_ENDINGS: Record<PersonId, RegExp[]> = {
  '1sg': [/isin$/],
  '2sg': [/isit$/],
  '3sg': [/isi$/],
  '1pl': [/isimme$/],
  '2pl': [/isitte$/],
  '3pl': [/isiv[aä]t$/],
};

/**
 * Mark the meaningful part of a sourced verb form. Negative forms are two
 * words ("en syö"): the negation verb is the marked part. Perfect forms
 * ("olen syönyt") mark the participle ending.
 */
export function verbSegments(
  form: string,
  tense: VerbTense,
  polarity: Polarity,
  person: PersonId,
): Segment[] {
  const words = form.split(' ');
  if (polarity === 'negative' && words.length >= 2) {
    const [neg, ...rest] = words;
    const main = rest.join(' ');
    const tail = tense === 'past' ? splitBy(main, PARTICIPLE) : plain(main);
    return [{ text: neg, mark: true }, { text: ' ' }, ...tail];
  }
  if (tense === 'perfect' && words.length >= 2) {
    const [aux, ...rest] = words;
    return [{ text: aux + ' ' }, ...splitBy(rest.join(' '), PARTICIPLE)];
  }
  const table =
    tense === 'past' ? PAST_ENDINGS : tense === 'conditional' ? CONDITIONAL_ENDINGS : PRESENT_ENDINGS;
  return splitBy(form, table[person]);
}

const POSSESSIVE_ENDINGS: Record<PossessorId, RegExp[]> = {
  '1sg': [/ni$/],
  '2sg': [/si$/],
  '3rd': [/ns[aä]$/, new RegExp(`${V}n$`)],
};

/** Mark the possessive suffix on a sourced possessive form ("kirja|ni"). */
export function possessiveSegments(form: string, possessor: PossessorId): Segment[] {
  return splitBy(form, POSSESSIVE_ENDINGS[possessor]);
}

/** Flatten segments back to a string (for TTS / tests). */
export function segmentsText(segs: Segment[]): string {
  return segs.map((s) => s.text).join('');
}

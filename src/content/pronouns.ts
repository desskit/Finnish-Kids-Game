// Personal pronouns in the forms a child needs most: "Auta minua!", "Anna se
// minulle!", "Pidän sinusta.", "Näen hänet." The vendored tables only carry
// "minä" as a NOUN ("the self", declined like one: "minää"), so the real
// pronoun paradigm is HAND-AUTHORED here — a small, closed set, the same in
// every grammar book. `pronouns.test.ts` checks it is complete and that each
// form is distinct where Finnish keeps them apart.
// ⚠️ NEEDS NATIVE FINNISH VETTING (listed in docs/FINNISH_REVIEW.md).

import type { PersonId } from './types';

/** The pronoun cases the "Me and you" unit teaches. */
export type PronounCase =
  | 'nominative'
  | 'partitive'
  | 'accusative'
  | 'allative'
  | 'elative'
  | 'adessive'
  | 'genitive';

export interface PronounForms extends Record<PronounCase, string> {
  /** English object pronoun ("me", "him/her"…). */
  enObject: string;
}

export const PRONOUNS: Record<PersonId, PronounForms> = {
  '1sg': {
    nominative: 'minä',
    partitive: 'minua',
    accusative: 'minut',
    allative: 'minulle',
    elative: 'minusta',
    adessive: 'minulla',
    genitive: 'minun',
    enObject: 'me',
  },
  '2sg': {
    nominative: 'sinä',
    partitive: 'sinua',
    accusative: 'sinut',
    allative: 'sinulle',
    elative: 'sinusta',
    adessive: 'sinulla',
    genitive: 'sinun',
    enObject: 'you',
  },
  '3sg': {
    nominative: 'hän',
    partitive: 'häntä',
    accusative: 'hänet',
    allative: 'hänelle',
    elative: 'hänestä',
    adessive: 'hänellä',
    genitive: 'hänen',
    enObject: 'him/her',
  },
  '1pl': {
    nominative: 'me',
    partitive: 'meitä',
    accusative: 'meidät',
    allative: 'meille',
    elative: 'meistä',
    adessive: 'meillä',
    genitive: 'meidän',
    enObject: 'us',
  },
  '2pl': {
    nominative: 'te',
    partitive: 'teitä',
    accusative: 'teidät',
    allative: 'teille',
    elative: 'teistä',
    adessive: 'teillä',
    genitive: 'teidän',
    enObject: 'you all',
  },
  '3pl': {
    nominative: 'he',
    partitive: 'heitä',
    accusative: 'heidät',
    allative: 'heille',
    elative: 'heistä',
    adessive: 'heillä',
    genitive: 'heidän',
    enObject: 'them',
  },
};

/** A sentence frame with one pronoun slot. Authored like a carrier phrase. */
export interface PronounFrame {
  id: string;
  before: string;
  punct: '!' | '.';
  case: PronounCase;
  /** English with the slot as ___ ("Help ___!"). */
  en: string;
  /** Persons that read oddly here ("Auta sinua!" — help yourself). */
  exclude: PersonId[];
  /** The one-line rule for the "Why?" tip. */
  rule: string;
}

export const PRONOUN_FRAMES: PronounFrame[] = [
  {
    id: 'help',
    before: 'Auta',
    punct: '!',
    case: 'partitive',
    en: 'Help ___!',
    exclude: ['2sg', '2pl'],
    rule: '*auttaa* (to help) takes **-a / -ä**: *minua, sinua, häntä*.',
  },
  {
    id: 'wait',
    before: 'Odota',
    punct: '!',
    case: 'partitive',
    en: 'Wait for ___!',
    exclude: ['2sg', '2pl'],
    rule: 'Waiting goes on for a while → **-a / -ä**: *minua, häntä*.',
  },
  {
    id: 'give',
    before: 'Anna se',
    punct: '!',
    case: 'allative',
    en: 'Give it to ___!',
    exclude: ['2sg', '2pl'],
    rule: 'Giving TO someone → **-lle**: *minulle, hänelle*.',
  },
  {
    id: 'like',
    before: 'Pidän',
    punct: '.',
    case: 'elative',
    en: 'I like ___.',
    exclude: ['1sg', '1pl'],
    rule: '*Pidän* always takes **-sta / -stä** — people too: *sinusta*.',
  },
  {
    id: 'see',
    before: 'Näen',
    punct: '.',
    case: 'accusative',
    en: 'I see ___.',
    exclude: ['1sg', '1pl'],
    rule: 'Seeing a whole person → the special **-t** form: *sinut, hänet*.',
  },
];

/** A frame filled: "Auta minua!". */
export function pronounSentence(frame: PronounFrame, person: PersonId, c: PronounCase = frame.case): string {
  return `${frame.before} ${PRONOUNS[person][c]}${frame.punct}`;
}

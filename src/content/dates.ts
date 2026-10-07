// Dates, birthdays and age — "viides toukokuuta" (the 5th of May),
// "Syntymäpäiväni on viides toukokuuta.", "Olen kahdeksan vuotta vanha."
//
// Every WORD is looked up: the ordinal (sourced numeral, nominative), the month
// in the partitive (sourced noun form "toukokuuta"), the number, and "vuotta"
// (the sourced partitive of "vuosi"). What is AUTHORED is only how they are
// put side by side — a date is "ordinal + month-partitive" — and the small
// frame words ("Syntymäpäiväni on", "Olen … vanha").
// ⚠️ NEEDS NATIVE FINNISH VETTING (the frames; listed in FINNISH_REVIEW.md).

import type { LexicalItem } from './types';
import { caseFormOf } from './types';
import type { Segment } from './endings';
import { itemById } from './lookup';

export const MONTH_IDS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

/** "viides toukokuuta" — ordinal + the month in the partitive (both sourced). */
export function dateFi(ordinal: LexicalItem, month: LexicalItem, monthCase: 'partitive' | 'nominative' = 'partitive'): string | undefined {
  const m = monthCase === 'partitive' ? caseFormOf(month, 'partitive', 'singular') : month.fi;
  return m && `${ordinal.fi} ${m}`;
}

/** The date with the month's partitive ending marked. */
export function dateSegments(ordinal: LexicalItem, month: LexicalItem): Segment[] | undefined {
  const m = caseFormOf(month, 'partitive', 'singular');
  if (!m || !m.startsWith(month.fi)) return m ? [{ text: `${ordinal.fi} ${m}` }] : undefined;
  return [{ text: `${ordinal.fi} ${month.fi}` }, { text: m.slice(month.fi.length), mark: true }];
}

const ORDINAL_SUFFIX = (n: number) => (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');

/** "May 5th" (English meta-text). */
export function dateEnglish(ordinal: LexicalItem, month: LexicalItem): string {
  return `${month.en} ${ordinal.value}${ORDINAL_SUFFIX(ordinal.value ?? 0)}`;
}

/** The birthday frame around a date: "Syntymäpäiväni on viides toukokuuta." */
export const BIRTHDAY_FRAME = { before: 'Syntymäpäiväni on', en: 'My birthday is on' };

/** "vuotta" — the sourced partitive of "vuosi" (year). */
export function yearsWord(): string | undefined {
  const year = itemById('year');
  return year && caseFormOf(year, 'partitive', 'singular');
}

/** "Olen kahdeksan vuotta vanha." — counted by 2+, "vuosi" takes the partitive. */
export function ageSentence(n: LexicalItem, years = yearsWord()): string | undefined {
  return years && `Olen ${n.fi} ${years} vanha.`;
}

// Ordinals 11th–31st, for dates past the 10th ("kahdeskymmenes toukokuuta").
//
// ⚠️ NEEDS NATIVE FINNISH VETTING (listed in FINNISH_REVIEW.md).
// The vendored Wiktionary snapshot only has 1st–10th (numerals.json), so these
// are HAND-AUTHORED — the one exception to "look every form up", made only
// because dates need them. They were cross-checked against an independent
// source (the num2words library's Finnish ordinals, which also agrees with
// every sourced 1st–10th and 1–20), and `higherOrdinals.test.ts` pins their
// structure: 11th–19th = the sourced ordinal's stem + "toista", 20th / 30th
// = "kahdes / kolmas" + "kymmenes", 21st–29th and 31st = the ten + the
// sourced ordinal. Only the BASIC form is given — a date uses nothing else.

import type { LexicalItem } from './types';

const ord = (id: string, fi: string, en: string, value: number): LexicalItem => ({
  id,
  fi,
  en,
  emoji: `${value}.`,
  tier: 3,
  inflections: { nominative_singular: fi },
  value,
  topic: 'ordinals',
  tags: ['authored'],
});

export const HIGHER_ORDINALS: LexicalItem[] = [
  ord('eleventh', 'yhdestoista', 'eleventh', 11),
  ord('twelfth', 'kahdestoista', 'twelfth', 12),
  ord('thirteenth', 'kolmastoista', 'thirteenth', 13),
  ord('fourteenth', 'neljästoista', 'fourteenth', 14),
  ord('fifteenth', 'viidestoista', 'fifteenth', 15),
  ord('sixteenth', 'kuudestoista', 'sixteenth', 16),
  ord('seventeenth', 'seitsemästoista', 'seventeenth', 17),
  ord('eighteenth', 'kahdeksastoista', 'eighteenth', 18),
  ord('nineteenth', 'yhdeksästoista', 'nineteenth', 19),
  ord('twentieth', 'kahdeskymmenes', 'twentieth', 20),
  ord('twenty-first', 'kahdeskymmenesensimmäinen', 'twenty-first', 21),
  ord('twenty-second', 'kahdeskymmenestoinen', 'twenty-second', 22),
  ord('twenty-third', 'kahdeskymmeneskolmas', 'twenty-third', 23),
  ord('twenty-fourth', 'kahdeskymmenesneljäs', 'twenty-fourth', 24),
  ord('twenty-fifth', 'kahdeskymmenesviides', 'twenty-fifth', 25),
  ord('twenty-sixth', 'kahdeskymmeneskuudes', 'twenty-sixth', 26),
  ord('twenty-seventh', 'kahdeskymmenesseitsemäs', 'twenty-seventh', 27),
  ord('twenty-eighth', 'kahdeskymmeneskahdeksas', 'twenty-eighth', 28),
  ord('twenty-ninth', 'kahdeskymmenesyhdeksäs', 'twenty-ninth', 29),
  ord('thirtieth', 'kolmaskymmenes', 'thirtieth', 30),
  ord('thirty-first', 'kolmaskymmenesensimmäinen', 'thirty-first', 31),
];

/** Joined ordinals (21st–29th, 31st): learned as "the ten + the one", not one by one. */
export const JOINED_ORDINAL_IDS = HIGHER_ORDINALS.filter(
  (o) => (o.value ?? 0) > 20 && o.value !== 30,
).map((o) => o.id);

/** "1st", "2nd", "11th", "21st", "22nd" — English ordinal suffixes. */
export function ordinalSuffix(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  return n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
}

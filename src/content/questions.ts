// Yes/no questions with a verb: the "you" form + the question ending -ko / -kö
// ("syöt" → "syötkö?" = do you eat?). The sourced tables don't store the
// question ending, so this is a HAND-AUTHORED table — one line per verb, never
// assembled at runtime. `questions.test.ts` checks every entry against the
// sourced "you" form and the vowel-harmony rule (a/o/u in the word → -ko,
// otherwise -kö), so a typo or a verb change can't slip through.
// ⚠️ NEEDS NATIVE FINNISH VETTING (listed in docs/FINNISH_REVIEW.md).

import type { LexicalItem } from './types';

/** verbId → "do you …?" question form, e.g. eat → "syötkö". */
export const YOU_QUESTION: Readonly<Record<string, string>> = {
  'be': 'oletko',
  'eat': 'syötkö',
  'drink': 'juotko',
  'sleep': 'nukutko',
  'play': 'leikitkö',
  'run': 'juoksetko',
  'jump': 'hyppäätkö',
  'go': 'menetkö',
  'come': 'tuletko',
  'see': 'näetkö',
  'give': 'annatko',
  'take': 'otatko',
  'look': 'katsotko',
  'sing': 'laulatko',
  'read': 'luetko',
  'swim': 'uitko',
  'want': 'haluatko',
  'love': 'rakastatko',
  'like': 'tykkäätkö',
  'help': 'autatko',
  'sit': 'istutko',
  'stand': 'seisotko',
  'walk': 'käveletkö',
  'dance': 'tanssitko',
  'draw': 'piirrätkö',
  'write': 'kirjoitatko',
  'open': 'avaatko',
  'close': 'suljetko',
  'buy': 'ostatko',
  'hear': 'kuuletko',
  'listen': 'kuunteletko',
  'speak': 'puhutko',
  'say': 'sanotko',
  'ask': 'kysytkö',
  'answer': 'vastaatko',
  'search': 'etsitkö',
  'find': 'löydätkö',
  'make': 'teetkö',
  'get': 'saatko',
  'bring': 'tuotko',
  'carry': 'vietkö',
  'fly': 'lennätkö',
  'drive': 'ajatko',
  'wash': 'pesetkö',
  'clean': 'siivoatko',
  'cook': 'keitätkö',
  'paint': 'maalaatko',
  'smile': 'hymyiletkö',
  'cry': 'itketkö',
  'laugh': 'nauratko',
  'hug': 'halaatko',
  'throw': 'heitätkö',
  'climb': 'kiipeätkö',
  'remember': 'muistatko',
  'forget': 'unohdatko',
  'learn': 'opitko',
  'teach': 'opetatko',
  'wait': 'odotatko',
  'live': 'asutko',
  'build': 'rakennatko',
  'fix': 'korjaatko',
  'wake-up': 'heräätkö',
  'need': 'tarvitsetko',
  'choose': 'valitsetko',
  'disturb': 'häiritsetkö',
  'lock': 'lukitsetko',
  'grow-old': 'vanhenetko',
  'warm-up': 'lämpenetkö',
  'meet': 'tapaatko',
  'fall': 'putoatko',
  'cut': 'leikkaatko',
  'run-away': 'pakenetko',
};

/** "Syötkö?" — the question form for a verb, capitalized with "?". */
export function questionFor(verb: LexicalItem): string | undefined {
  const q = YOU_QUESTION[verb.id];
  return q ? q.charAt(0).toUpperCase() + q.slice(1) + '?' : undefined;
}

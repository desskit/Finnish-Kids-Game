// The course words in a Finnish line — so a story or scene line the child
// hears counts as hearing each word in it (`heard`, game/srs.ts). Each word of
// the line is looked up the way a tap on it is (`lookupWord`: a sourced form
// leads back to its word), then matched to a reviewable word by that basic
// form. Unknown words and small words are skipped.

import { reviewItems } from '.';
import { lookupWord } from './wordIndex';

const ID_BY_BASE = new Map<string, string>();
for (const item of reviewItems) {
  const base = item.fi.toLowerCase();
  if (!ID_BY_BASE.has(base)) ID_BY_BASE.set(base, item.id);
}

/** The ids of the reviewable words heard in a line ("Minulla on kissa." → ['cat']). */
export function itemIdsIn(line: string): string[] {
  const out: string[] = [];
  for (const word of line.match(/[\p{L}-]+/gu) ?? []) {
    const base = lookupWord(word)?.base.toLowerCase() ?? word.toLowerCase();
    const id = ID_BY_BASE.get(base);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

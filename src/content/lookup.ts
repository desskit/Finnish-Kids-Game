import { themes, adjectives, verbs, states, lessonWords } from './index';
import type { LexicalItem } from './types';

// Every curated word (nouns + numbers + adjectives + verbs) by its globally
// unique id — for content that references words by id (lessons, why-tips).
export const ITEM_BY_ID: Readonly<Record<string, LexicalItem>> = Object.fromEntries(
  [...themes.flatMap((t) => t.items), ...states.items, ...lessonWords.items, ...adjectives.items, ...verbs.items].map(
    (i) => [i.id, i],
  ),
);

export function itemById(id: string): LexicalItem | undefined {
  return ITEM_BY_ID[id];
}

/** Words by their Finnish spelling (first match wins) — for content that lists
 *  real words by how they are written (the alphabet corner's examples). */
const ITEM_BY_FI = new Map<string, LexicalItem>();
for (const i of Object.values(ITEM_BY_ID)) if (!ITEM_BY_FI.has(i.fi)) ITEM_BY_FI.set(i.fi, i);

export function itemByFi(fi: string): LexicalItem | undefined {
  return ITEM_BY_FI.get(fi);
}

/** Every distinct looked-up word (one per spelling). */
export function allWords(): LexicalItem[] {
  return [...ITEM_BY_FI.values()];
}

import { themes, adjectives, verbs, states } from './index';
import type { LexicalItem } from './types';

// Every curated word (nouns + numbers + adjectives + verbs) by its globally
// unique id — for content that references words by id (lessons, why-tips).
export const ITEM_BY_ID: Readonly<Record<string, LexicalItem>> = Object.fromEntries(
  [...themes.flatMap((t) => t.items), ...states.items, ...adjectives.items, ...verbs.items].map(
    (i) => [i.id, i],
  ),
);

export function itemById(id: string): LexicalItem | undefined {
  return ITEM_BY_ID[id];
}

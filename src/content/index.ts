import { animals } from './animals';
import { constructions } from './constructions';

export type { LexicalItem, Theme, Construction, PhraseFill, Tier, ThemeId } from './types';

// v1 ships a single theme; more themes drop in here as data, no code changes.
export const theme = animals;
export const themes = [animals];
export { constructions };

/** Assemble a full, human-authored sentence from a construction + chosen form. */
export function sentenceFor(prefix: string, form: string, suffix: string): string {
  return `${prefix} ${form}${suffix}`;
}

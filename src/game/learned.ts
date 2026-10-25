// What a child learned — told back to them, instead of a points tally
// (docs/LEARNING_RESEARCH.md: rewards that tell what was learned, or surprise,
// keep a child's own motivation; expected points per answer wear it down).
//
// Pure: everything takes the child and `now`.

import type { Child } from '../state/storage';
import type { LexicalItem } from '../content/types';
import { reviewItemById } from '../content';
import { storyById, type Story } from '../content/stories';
import { isMathId } from './mathPath';
import { isGrammarId } from './srs';
import { dayKey } from './streak';

const DAY = 86_400_000;

/** Words (with a picture) whose schedule matches, newest first. */
function wordsWhere(child: Child | null | undefined, keep: (s: { firstSeenAt?: number; lastSeenAt: number }) => boolean): LexicalItem[] {
  return Object.entries(child?.srs ?? {})
    .filter(([id, s]) => !isGrammarId(id) && reviewItemById[id]?.emoji && keep(s))
    .sort(([, a], [, b]) => b.lastSeenAt - a.lastSeenAt)
    .map(([id]) => reviewItemById[id]);
}

/** The words met for the very first time today. */
export function newWordsOn(child: Child | null | undefined, now: number): LexicalItem[] {
  const today = dayKey(now);
  return wordsWhere(child, (s) => s.firstSeenAt !== undefined && dayKey(s.firstSeenAt) === today);
}

/** The words practiced today. */
export function wordsPracticedOn(child: Child | null | undefined, now: number): LexicalItem[] {
  const today = dayKey(now);
  return wordsWhere(child, (s) => s.lastSeenAt > 0 && dayKey(s.lastSeenAt) === today);
}

/** A small, stable number from a string (the surprise's dice). */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** A finished story waits this long before it can be a surprise. */
export const SURPRISE_AFTER_DAYS = 7;

/**
 * Now and then — about one day in three, never announced — the day's natural
 * stop offers a story the child finished a while ago, to read again for fun.
 * Deterministic: the same child on the same day gets the same answer.
 */
export function surpriseStory(child: Child | null | undefined, now: number): Story | undefined {
  if (!child) return undefined;
  const day = dayKey(now);
  if (hash(`${child.id}:${day}`) % 3 !== 0) return undefined;
  const waiting = Object.entries(child.course?.stories ?? {})
    .filter(([id, r]) => {
      if (!storyById[id] || isMathId(id) || r.goodAt === undefined) return false;
      const last = Math.max(r.goodAt, ...(r.revisits ?? []), r.revisitedAt ?? 0);
      return now - last >= SURPRISE_AFTER_DAYS * DAY;
    })
    .map(([id]) => id)
    .sort();
  if (waiting.length === 0) return undefined;
  return storyById[waiting[hash(day) % waiting.length]];
}

// A child's story log — the rules that keep stories from turning into a grind:
//
//  - ONE GOOD READ finishes a story: the story, then its questions, with 3 of
//    4 right first time. (A course story step is done once each of its
//    stories has had one.)
//  - A weak read is read again WITH the English, and asks other questions.
//  - A few days after it's finished, a story comes back ONCE in the daily
//    warm-up — "Muistatko?", do you remember? — with two questions it hasn't
//    asked before.
//  - Finished stories wait on the bookshelf, to re-read whenever she likes.
//
// Pure: everything takes the child (and `now`).

import type { Child, StoryRecord } from '../state/storage';
import { storyById } from '../content/stories';
import { dayGap } from './stats';
import { dayKey } from './streak';
import { isMathId } from './mathPath';

/** 3 of 4 right first time. */
export const STORY_PASS = 0.75;
/** Questions after a read. */
export const READ_QUESTIONS = 4;
/** Questions in a "Muistatko?" revisit. */
export const REVISIT_QUESTIONS = 2;
/** A finished story comes back after this many days. */
export const REVISIT_AFTER_DAYS = 3;

export type StoryReadKind = 'read' | 'revisit';

export function storyRecord(child: Child | null | undefined, id: string): StoryRecord | undefined {
  return child?.course?.stories?.[id];
}

/** Has this story had its one good read? */
export function storyReadWell(child: Child | null | undefined, id: string): boolean {
  return !!storyRecord(child, id)?.goodAt;
}

/** Did a read go well enough? */
export function isGoodRead(right: number, total: number): boolean {
  return total > 0 && right / total >= STORY_PASS;
}

/** The last read went badly and the story isn't read yet: read it again with the English showing. */
export function needsSupport(child: Child | null | undefined, id: string): boolean {
  const r = storyRecord(child, id);
  return !!r && !r.goodAt && r.last !== undefined && r.last < STORY_PASS;
}

/** Fold a finished read (or revisit) into the child's story log. */
export function recordStoryOnChild(
  child: Child,
  id: string,
  right: number,
  total: number,
  asked: readonly string[],
  now: number,
  kind: StoryReadKind = 'read',
): Child {
  const prev: StoryRecord = storyRecord(child, id) ?? { reads: 0 };
  const next: StoryRecord = {
    ...prev,
    asked: [...asked],
    seen: [...new Set([...(prev.seen ?? []), ...asked])],
  };
  if (kind === 'read') {
    next.reads = prev.reads + 1;
    next.last = total > 0 ? right / total : 0;
    if (!prev.goodAt && isGoodRead(right, total)) next.goodAt = now;
  } else {
    next.revisitedAt = prev.revisitedAt ?? now;
  }
  return { ...child, course: { ...child.course, stories: { ...child.course?.stories, [id]: next } } };
}

/** A story step is done once each of its stories has been read well. */
export function storyStepDone(child: Child | null | undefined, ids: readonly string[]): boolean {
  return ids.length > 0 && ids.every((id) => storyReadWell(child, id));
}

/** The story a step plays next: the first not yet read well, else the one read least. */
export function nextStoryId(child: Child | null | undefined, ids: readonly string[]): string | undefined {
  const unread = ids.find((id) => !storyReadWell(child, id));
  if (unread) return unread;
  return [...ids].sort((a, b) => (storyRecord(child, a)?.reads ?? 0) - (storyRecord(child, b)?.reads ?? 0))[0];
}

/**
 * The finished story due for its one "Muistatko?": read well at least
 * REVISIT_AFTER_DAYS days ago and not revisited yet — the longest-waiting
 * first. Undefined when none is due.
 */
export function dueStoryRevisit(child: Child | null | undefined, now: number): string | undefined {
  const today = dayKey(now);
  return Object.entries(child?.course?.stories ?? {})
    .filter(
      ([id, r]) =>
        storyById[id] &&
        !isMathId(id) &&
        r.goodAt !== undefined &&
        !r.revisitedAt &&
        dayGap(dayKey(r.goodAt), today) >= REVISIT_AFTER_DAYS,
    )
    .sort(([, a], [, b]) => (a.goodAt ?? 0) - (b.goodAt ?? 0))[0]?.[0];
}

// A child's story log — the rules that keep stories from turning into a grind:
//
//  - ONE GOOD READ finishes a story: the story, then its questions, with 3 of
//    4 right first time. (A course story step is done once each of its
//    stories has had one.)
//  - A weak read is read again WITH the English, and asks other questions.
//  - After it's finished, a story comes back in the daily warm-up —
//    "Muistatko?", do you remember? — a day later, then three days, then a
//    week after the good read (hearing the SAME story again is what teaches;
//    docs/LEARNING_RESEARCH.md), each time with two questions it hasn't asked
//    before.
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
/**
 * A finished story's revisits: each this many days after the hearing before
 * it — days 1, 3 and 7 after the good read.
 */
export const REVISIT_GAPS = [1, 2, 4] as const;

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
    next.revisits = [...revisitTimes(prev), now];
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
 * A story's revisits so far. An older save's single revisit (at 3 days, before
 * the 1/3/7 schedule) counts as the first two, so only the week one is left.
 */
function revisitTimes(r: StoryRecord): number[] {
  if (r.revisits) return r.revisits;
  return r.revisitedAt !== undefined ? [r.revisitedAt, r.revisitedAt] : [];
}

/** When a finished story is next due back (undefined: never again, or not read well). */
export function nextRevisitAt(r: StoryRecord): { after: number; gap: number } | undefined {
  if (r.goodAt === undefined) return undefined;
  const done = revisitTimes(r);
  if (done.length >= REVISIT_GAPS.length) return undefined;
  return { after: done[done.length - 1] ?? r.goodAt, gap: REVISIT_GAPS[done.length] };
}

/**
 * The finished story due for a "Muistatko?": its next revisit's days have
 * passed since it was last heard — the one waiting longest first. Undefined
 * when none is due.
 */
export function dueStoryRevisit(child: Child | null | undefined, now: number): string | undefined {
  const today = dayKey(now);
  return Object.entries(child?.course?.stories ?? {})
    .flatMap(([id, r]) => {
      const due = storyById[id] && !isMathId(id) ? nextRevisitAt(r) : undefined;
      return due && dayGap(dayKey(due.after), today) >= due.gap ? [{ id, after: due.after }] : [];
    })
    .sort((a, b) => a.after - b.after)[0]?.id;
}

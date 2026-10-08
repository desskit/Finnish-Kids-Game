// Practice statistics — what the child has practised, how well, and when.
//
// Every finished question segment, from any game (a course step, a Kertaus, a
// checkpoint part, the daily warm-up), is folded in under the SUBJECT it
// practised: the course step's id ("verbs-type4", "into-onto"). A Kertaus
// segment counts for the earlier step it actually replayed, so a subject's
// numbers are about that grammar, wherever it was met.
//
// Scales by construction:
//   - keys are step ids, so a new unit or step is tracked with no stats code;
//   - each subject keeps lifetime totals plus a BOUNDED window of per-day
//     buckets (old days roll off; the totals keep them), so storage stays small
//     however long the child plays;
//   - the record is versioned (`v`) for future migrations.
//
// Pure and time-injected like srs.ts / streak.ts: every function takes `now`
// (or a day key) as an argument, so the whole module is trivially testable.

import type { Progress } from '../state/storage';
import { dayKey } from './streak';

/** Answers on one day (or in one source): how many, how many right first time. */
export interface StatBucket {
  /** Questions answered. */
  n: number;
  /** Of those, right on the FIRST try. */
  right: number;
  /** Practice time in ms (capped per segment — see `segmentMs`). */
  ms?: number;
}

/** Where a segment was played — kept so a grown-up can see the mix. */
export type StatSource =
  | 'practice'
  | 'mix'
  | 'checkpoint'
  | 'warmup'
  | 'bonus'
  | 'review'
  | 'sounds';

export interface SubjectStats {
  /** Lifetime questions (including days that have rolled out of `days`). */
  n: number;
  /** Lifetime first-try right answers. */
  right: number;
  /** Per local calendar day ("2026-10-08"), the most recent MAX_SUBJECT_DAYS. */
  days: Record<string, StatBucket>;
  /** Epoch ms of the first and the most recent answer. */
  first: number;
  last: number;
  /** Lifetime split by where the questions were asked. */
  src?: Partial<Record<StatSource, StatBucket>>;
}

/** One finished daily warm-up. */
export interface WarmupRecord {
  /** The local day it was done ("2026-10-08"). */
  day: string;
  /** The subject (step id) it practised. */
  subject: string;
  right: number;
  total: number;
  /** Epoch ms when it was finished. */
  at: number;
}

export interface StatsState {
  v: 1;
  /** stepId → that subject's stats. */
  subjects: Record<string, SubjectStats>;
  /** Whole-app totals per day (every game, incl. Review and the Alphabet corner). */
  days: Record<string, StatBucket>;
  /** Finished daily warm-ups, oldest first (bounded). */
  warmups?: WarmupRecord[];
}

/** Per-subject day buckets kept (older days live on in the lifetime totals). */
export const MAX_SUBJECT_DAYS = 90;
/** Whole-app day buckets kept — a year and a bit of the activity calendar. */
export const MAX_APP_DAYS = 400;
/** Warm-up records kept. */
export const MAX_WARMUPS = 120;

/** A segment never counts for more than this per question (an idle tab isn't practice). */
export const MS_PER_QUESTION_CAP = 45_000;

export function emptyStats(): StatsState {
  return { v: 1, subjects: {}, days: {} };
}

/**
 * Stats for a child who played before stats existed: the lifetime totals of
 * every step's recorded rounds (no day-by-day history — that starts now).
 * `totalStars` can include a few bonus stars with no matching question, so
 * `right` is capped at `n`.
 */
export function seedFromProgress(progress: Progress | undefined): StatsState {
  const stats = emptyStats();
  for (const topic of Object.values(progress ?? {})) {
    for (const [stepId, p] of Object.entries(topic ?? {})) {
      if (!p || !p.totalPossible) continue;
      const n = p.totalPossible;
      const last = p.lastPlayed || 0;
      stats.subjects[stepId] = {
        n,
        right: Math.min(n, Math.max(0, p.totalStars)),
        days: {},
        first: last,
        last,
      };
    }
  }
  return stats;
}

/** A child's stats, seeded from their older progress when there are none yet. */
export function statsOf(child: { stats?: StatsState; progress?: Progress } | null | undefined): StatsState {
  if (!child) return emptyStats();
  return child.stats ?? seedFromProgress(child.progress);
}

const add = (b: StatBucket | undefined, right: number, total: number, ms: number): StatBucket => {
  const out: StatBucket = { n: (b?.n ?? 0) + total, right: (b?.right ?? 0) + right };
  const t = (b?.ms ?? 0) + ms;
  if (t > 0) out.ms = t;
  return out;
};

/** Keep only the `max` most recent day keys ("YYYY-MM-DD" sorts by date). */
function trimDays(days: Record<string, StatBucket>, max: number): Record<string, StatBucket> {
  const keys = Object.keys(days);
  if (keys.length <= max) return days;
  const keep = keys.sort().slice(-max);
  return Object.fromEntries(keep.map((k) => [k, days[k]]));
}

/** A segment's practice time, capped so an idle screen never inflates it. */
export function segmentMs(startedAt: number, endedAt: number, questions: number): number {
  const raw = Math.max(0, endedAt - startedAt);
  return Math.min(raw, Math.max(1, questions) * MS_PER_QUESTION_CAP);
}

export interface StatEvent {
  /** The subject (step id); omit for app-level-only answers (Review, Alphabet). */
  subject?: string;
  /** First-try right answers in the segment. */
  right: number;
  /** Questions in the segment. */
  total: number;
  /** Practice time in ms (already capped — see `segmentMs`). */
  ms?: number;
  source: StatSource;
}

/**
 * Fold one finished segment into the stats. Pure. Bonus (typing) rounds are a
 * deliberately optional extra, so they show in the day totals and the
 * subject's source split but never move its accuracy — a hard optional game
 * must not make a subject look weak.
 */
export function applyStatEvent(stats: StatsState, e: StatEvent, now: number): StatsState {
  const total = Math.max(0, Math.round(e.total));
  if (total === 0) return stats;
  const right = Math.min(total, Math.max(0, Math.round(e.right)));
  const ms = Math.max(0, Math.round(e.ms ?? 0));
  const day = dayKey(now);
  const days = trimDays({ ...stats.days, [day]: add(stats.days[day], right, total, ms) }, MAX_APP_DAYS);
  if (!e.subject) return { ...stats, days };

  const prev = stats.subjects[e.subject];
  const counts = e.source !== 'bonus';
  const subject: SubjectStats = {
    n: (prev?.n ?? 0) + (counts ? total : 0),
    right: (prev?.right ?? 0) + (counts ? right : 0),
    days: counts
      ? trimDays({ ...prev?.days, [day]: add(prev?.days?.[day], right, total, ms) }, MAX_SUBJECT_DAYS)
      : (prev?.days ?? {}),
    first: prev?.first || now,
    last: counts ? now : (prev?.last ?? now),
    src: { ...prev?.src, [e.source]: add(prev?.src?.[e.source], right, total, ms) },
  };
  return { ...stats, days, subjects: { ...stats.subjects, [e.subject]: subject } };
}

/** Record a finished warm-up (bounded history). */
export function applyWarmup(stats: StatsState, w: WarmupRecord): StatsState {
  const warmups = [...(stats.warmups ?? []), w].slice(-MAX_WARMUPS);
  return { ...stats, warmups };
}

// --- Reading the stats ------------------------------------------------------

const DAY_MS = 86_400_000;

/** Whole days from day key `a` to day key `b`. */
export function dayGap(a: string, b: string): number {
  const pa = Date.parse(`${a}T00:00:00`);
  const pb = Date.parse(`${b}T00:00:00`);
  return Math.round((pb - pa) / DAY_MS);
}

/** The day keys of the last `n` days, oldest first, ending today. */
export function lastDays(n: number, now: number): string[] {
  const out: string[] = [];
  const today = new Date(now);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i, 12);
    out.push(dayKey(d.getTime()));
  }
  return out;
}

/** Sum the buckets of the given days (missing days count as nothing). */
export function sumDays(days: Record<string, StatBucket> | undefined, keys: readonly string[]): StatBucket {
  let n = 0;
  let right = 0;
  let ms = 0;
  for (const k of keys) {
    const b = days?.[k];
    if (!b) continue;
    n += b.n;
    right += b.right;
    ms += b.ms ?? 0;
  }
  return { n, right, ms };
}

/** Plain accuracy (0..1), or undefined with nothing to measure. */
export function ratio(b: StatBucket | undefined): number | undefined {
  return b && b.n > 0 ? b.right / b.n : undefined;
}

/**
 * How fast old answers fade from a subject's "how well do they know it now":
 * an answer from two weeks ago counts half as much as one from today.
 */
export const HALF_LIFE_DAYS = 14;
/**
 * The smoothing prior: every subject starts as if it had 3 of 4 right, so two
 * lucky (or unlucky) answers can't swing it to 100% (or 0%).
 */
export const PRIOR_N = 4;
export const PRIOR_RIGHT = 3;

export interface Strength {
  /** Smoothed, recency-weighted first-try accuracy (0..1). */
  accuracy: number;
  /** Lifetime questions. */
  n: number;
  /** Whole days since the subject was last practised. */
  daysSince: number;
}

/** How well a subject is known right now (see HALF_LIFE_DAYS / PRIOR_*). */
export function strengthOf(s: SubjectStats, now: number): Strength {
  const today = dayKey(now);
  let wN = 0;
  let wRight = 0;
  let inDays = 0;
  let rightInDays = 0;
  for (const [day, b] of Object.entries(s.days ?? {})) {
    const w = Math.pow(0.5, Math.max(0, dayGap(day, today)) / HALF_LIFE_DAYS);
    wN += w * b.n;
    wRight += w * b.right;
    inDays += b.n;
    rightInDays += b.right;
  }
  const daysSince = s.last ? Math.max(0, Math.floor((now - s.last) / DAY_MS)) : 0;
  // Answers older than the day window (or from before day-by-day stats began)
  // count too — at least as faded as the subject's last practice.
  const oldN = Math.max(0, s.n - inDays);
  const oldRight = Math.max(0, Math.min(oldN, s.right - rightInDays));
  if (oldN > 0) {
    const w = Math.pow(0.5, Math.max(daysSince, HALF_LIFE_DAYS) / HALF_LIFE_DAYS);
    wN += w * oldN;
    wRight += w * oldRight;
  }
  return {
    accuracy: (wRight + PRIOR_RIGHT) / (wN + PRIOR_N),
    n: s.n,
    daysSince,
  };
}

/**
 * Not practised for a while = probably weaker than the old numbers say (the
 * forgetting curve): +0.5 points of weakness per day away, at most +0.15.
 */
export const FORGETTING_PER_DAY = 0.005;
export const FORGETTING_CAP = 0.15;

/** 0 (rock solid) … ~1 (struggling): how much a subject needs practice now. */
export function weaknessOf(s: SubjectStats, now: number): number {
  const st = strengthOf(s, now);
  return 1 - st.accuracy + Math.min(FORGETTING_CAP, st.daysSince * FORGETTING_PER_DAY);
}

/** A subject needs this many answers before it can be called weak. */
export const MIN_ANSWERS_TO_JUDGE = 6;

/**
 * Trend: recent accuracy (last 7 days) against the 30 days before. Undefined
 * without enough answers on both sides to say.
 */
export function trendOf(s: SubjectStats, now: number): 'up' | 'down' | 'flat' | undefined {
  const recent = sumDays(s.days, lastDays(7, now));
  const before = sumDays(s.days, lastDays(37, now).slice(0, 30));
  const a = ratio(recent);
  const b = ratio(before);
  if (a === undefined || b === undefined || recent.n < 4 || before.n < 4) return undefined;
  if (a - b >= 0.1) return 'up';
  if (b - a >= 0.1) return 'down';
  return 'flat';
}

/** The most recent warm-up, if any. */
export function lastWarmup(stats: StatsState): WarmupRecord | undefined {
  const w = stats.warmups;
  return w && w.length > 0 ? w[w.length - 1] : undefined;
}

/** Has today's warm-up been done? */
export function warmupDoneOn(stats: StatsState, day: string): boolean {
  return lastWarmup(stats)?.day === day;
}

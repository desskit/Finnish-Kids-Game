// Read-side helpers for the grown-ups' Stats tab: the numbers it shows and the
// CSV files it offers, all derived from `child.stats` + the course. Pure (time
// injected) so they are unit-testable and the screen stays a thin renderer.

import type { Child } from '../state/storage';
import { nounConstructions } from '../content/constructions';
import { itemById } from '../content/lookup';
import { GRAMMAR_PREFIX } from './srs';
import {
  lastDays,
  ratio,
  statsOf,
  strengthOf,
  sumDays,
  trendOf,
  type StatBucket,
  type StatSource,
  type SubjectStats,
} from './stats';
import { allSubjects, type SubjectRef } from './warmup';
import { dayKey } from './streak';

export interface SubjectRow extends SubjectRef {
  stats: SubjectStats;
  /** Smoothed, recency-weighted accuracy — "how well right now". */
  lately: number;
  /** Plain lifetime first-try accuracy. */
  overall: number;
  trend: ReturnType<typeof trendOf>;
  daysSince: number;
}

/** Every practised subject, in course order. */
export function subjectRows(child: Child, now: number): SubjectRow[] {
  const stats = statsOf(child);
  const out: SubjectRow[] = [];
  for (const ref of allSubjects()) {
    const s = stats.subjects[ref.step.id];
    if (!s || s.n === 0) continue;
    const st = strengthOf(s, now);
    out.push({
      ...ref,
      stats: s,
      lately: st.accuracy,
      overall: s.right / s.n,
      trend: trendOf(s, now),
      daysSince: st.daysSince,
    });
  }
  return out;
}

export interface DayRow {
  day: string;
  bucket: StatBucket;
}

/** The last `n` days of whole-app practice, oldest first (empty days included). */
export function dayRows(child: Child, now: number, n: number): DayRow[] {
  const days = statsOf(child).days;
  return lastDays(n, now).map((day) => ({ day, bucket: days[day] ?? { n: 0, right: 0 } }));
}

export interface Summary {
  today: StatBucket;
  week: StatBucket;
  weekActiveDays: number;
  month: StatBucket;
  /** All recorded questions: subjects' lifetime totals + Review/Alphabet days. */
  allTime: number;
  subjectsPractised: number;
  warmupsThisWeek: number;
}

export function summary(child: Child, now: number): Summary {
  const stats = statsOf(child);
  const week = lastDays(7, now);
  const subjectTotal = Object.values(stats.subjects).reduce((a, s) => a + s.n, 0);
  // Questions outside any subject (Review, Alphabet) only live in the day log.
  const allDays = Object.values(stats.days).reduce((a, b) => a + b.n, 0);
  const inSubjectsByDay = Object.values(stats.subjects).reduce(
    (a, s) => a + Object.values(s.days).reduce((x, b) => x + b.n, 0),
    0,
  );
  return {
    today: sumDays(stats.days, [dayKey(now)]),
    week: sumDays(stats.days, week),
    weekActiveDays: week.filter((d) => (stats.days[d]?.n ?? 0) > 0).length,
    month: sumDays(stats.days, lastDays(30, now)),
    allTime: subjectTotal + Math.max(0, allDays - inSubjectsByDay),
    subjectsPractised: Object.values(stats.subjects).filter((s) => s.n > 0).length,
    warmupsThisWeek: (stats.warmups ?? []).filter((w) => week.includes(w.day)).length,
  };
}

/** Lifetime answers split by where they were asked (summed over subjects). */
export function sourceTotals(child: Child): Partial<Record<StatSource, StatBucket>> {
  const out: Partial<Record<StatSource, StatBucket>> = {};
  for (const s of Object.values(statsOf(child).subjects)) {
    for (const [src, b] of Object.entries(s.src ?? {}) as [StatSource, StatBucket][]) {
      const prev = out[src] ?? { n: 0, right: 0 };
      out[src] = { n: prev.n + b.n, right: prev.right + b.right };
    }
  }
  return out;
}

export interface PatternRow {
  id: string;
  /** "Minulla ei ole ___." */
  skeleton: string;
  en: string;
  seen: number;
  correct: number;
}

/** Sentence patterns (spaced-repetition `con:` schedules), shakiest first. */
export function weakPatterns(child: Child, minSeen = 3, limit = 8): PatternRow[] {
  const rows: PatternRow[] = [];
  for (const [key, s] of Object.entries(child.srs ?? {})) {
    if (!key.startsWith(GRAMMAR_PREFIX) || s.seen < minSeen) continue;
    const con = nounConstructions.find((c) => c.id === key.slice(GRAMMAR_PREFIX.length));
    if (!con) continue;
    rows.push({
      id: con.id,
      skeleton: [con.before, '___', con.after].filter(Boolean).join(' ') + (con.punct ?? ''),
      en: con.en,
      seen: s.seen,
      correct: s.correct,
    });
  }
  return rows.sort((a, b) => a.correct / a.seen - b.correct / b.seen || b.seen - a.seen).slice(0, limit);
}

export interface WordRow {
  id: string;
  fi: string;
  en: string;
  emoji?: string;
  seen: number;
  correct: number;
}

/** Words answered at least `minSeen` times, shakiest first. */
export function hardWords(child: Child, minSeen = 3, limit = 10): WordRow[] {
  const rows: WordRow[] = [];
  for (const [id, s] of Object.entries(child.srs ?? {})) {
    if (id.startsWith(GRAMMAR_PREFIX) || s.seen < minSeen) continue;
    const item = itemById(id);
    if (!item) continue;
    rows.push({ id, fi: item.fi, en: item.en, emoji: item.emoji, seen: s.seen, correct: s.correct });
  }
  return rows
    .filter((r) => r.correct < r.seen)
    .sort((a, b) => a.correct / a.seen - b.correct / b.seen || b.seen - a.seen)
    .slice(0, limit);
}

// --- CSV ------------------------------------------------------------------------

const csvCell = (v: string | number | undefined) => {
  const s = v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: (string | number | undefined)[][]) => rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
const pct = (n: number | undefined) => (n === undefined ? '' : Math.round(n * 100));

/** One row per practised subject — for a spreadsheet. */
export function subjectsCsv(child: Child, now: number): string {
  const rows = subjectRows(child, now);
  return csv([
    ['unit_no', 'unit', 'subject_id', 'subject', 'questions', 'right_first_time', 'overall_pct', 'lately_pct', 'trend', 'last_practised'],
    ...rows.map((r) => [
      r.unitNo,
      r.unit.titleEn,
      r.step.id,
      r.step.titleEn,
      r.stats.n,
      r.stats.right,
      pct(r.overall),
      pct(r.lately),
      r.trend ?? '',
      r.stats.last ? dayKey(r.stats.last) : '',
    ]),
  ]);
}

/** One row per day with practice (whole app). */
export function daysCsv(child: Child): string {
  const days = statsOf(child).days;
  return csv([
    ['day', 'questions', 'right_first_time', 'pct', 'minutes'],
    ...Object.keys(days)
      .sort()
      .map((d) => [d, days[d].n, days[d].right, pct(ratio(days[d])), Math.round((days[d].ms ?? 0) / 60000)]),
  ]);
}

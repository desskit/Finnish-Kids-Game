// The daily warm-up ("Päivän lämmittely"). On the first visit of a new day the
// home screen's big Continue button starts here instead: at least ten
// questions on the child's WEAKEST subject so far, then the course carries on.
//
// "Weakest" is measured, not guessed (see stats.ts): smoothed, recency-weighted
// first-try accuracy, plus a little for time away (the forgetting curve). Only
// real subjects qualify — grammar and word steps the child has answered enough
// questions on — never a scripted scene or story, a Kertaus mix (its earlier
// steps count on their own), or the step Continue is about to open anyway.
//
// Pure: everything takes the child and `now`, so it is fully unit-testable.

import type { Child } from '../state/storage';
import { UNITS, nextAction, type Unit } from './course';
import { activitiesUpTo, type ActivityKind, type SkillNode } from './path';
import {
  MIN_ANSWERS_TO_JUDGE,
  dayGap,
  lastWarmup,
  statsOf,
  strengthOf,
  warmupDoneOn,
  weaknessOf,
  type StatsState,
  type Strength,
} from './stats';
import { dayKey } from './streak';

/** At least this many questions in a warm-up. */
export const WARMUP_QUESTIONS = 10;

/** Steps that are scripted wholes, not a subject to drill. */
const NOT_A_SUBJECT: ReadonlySet<ActivityKind> = new Set(['conversation', 'story', 'review']);

/** Game types a warm-up never plays: speaking and typing are extras, not the measure. */
const WARMUP_SKIPS: ReadonlySet<ActivityKind> = new Set(['say', 'spell', 'sentence-type']);

export interface SubjectRef {
  unit: Unit;
  step: SkillNode;
  /** 1-based unit number, for display. */
  unitNo: number;
}

/** Every step that counts as a subject, in course order. */
export function allSubjects(): SubjectRef[] {
  return UNITS.flatMap((unit, i) =>
    unit.skills
      .filter((s) => !s.content.mix && !NOT_A_SUBJECT.has(s.activity))
      .map((step) => ({ unit, step, unitNo: i + 1 })),
  );
}

const SUBJECT_INDEX = new Map(allSubjects().map((r) => [r.step.id, r]));

export function subjectRef(stepId: string): SubjectRef | undefined {
  return SUBJECT_INDEX.get(stepId);
}

export interface RankedSubject extends SubjectRef {
  weakness: number;
  strength: Strength;
}

/**
 * Subjects with enough answers to judge, weakest first. Ties go to the one
 * practised longest ago, then to course order (deterministic).
 */
export function rankSubjects(stats: StatsState, now: number): RankedSubject[] {
  const out: RankedSubject[] = [];
  for (const ref of allSubjects()) {
    const s = stats.subjects[ref.step.id];
    if (!s || s.n < MIN_ANSWERS_TO_JUDGE) continue;
    out.push({ ...ref, weakness: weaknessOf(s, now), strength: strengthOf(s, now) });
  }
  const order = new Map(allSubjects().map((r, i) => [r.step.id, i]));
  return out.sort(
    (a, b) =>
      b.weakness - a.weakness ||
      b.strength.daysSince - a.strength.daysSince ||
      (order.get(a.step.id) ?? 0) - (order.get(b.step.id) ?? 0),
  );
}

/** Yesterday's warm-up went well (≥ 80% first time): that subject is fixed for now. */
const FIXED_RATIO = 0.8;
/** The same subject at most this many warm-ups in a row (variety; no grind). */
const MAX_SAME_IN_A_ROW = 3;

/**
 * The subject for today's warm-up, or undefined when there's nothing to judge
 * yet (a new player). Skips the step Continue is about to open (practised
 * there anyway), yesterday's subject if that warm-up went well, and a subject
 * that has already been the warm-up three times running.
 */
export function pickWarmupSubject(child: Child, now: number): RankedSubject | undefined {
  const stats = statsOf(child);
  const next = nextAction(child);
  const frontier = next.kind === 'step' ? next.step.id : undefined;
  const today = dayKey(now);
  const history = (stats.warmups ?? []).filter((w) => w.day !== today);
  const last = history[history.length - 1];
  const fixed =
    last && dayGap(last.day, today) === 1 && last.total > 0 && last.right / last.total >= FIXED_RATIO
      ? last.subject
      : undefined;
  const tail = history.slice(-MAX_SAME_IN_A_ROW);
  const overused =
    tail.length === MAX_SAME_IN_A_ROW && tail.every((w) => w.subject === tail[0].subject)
      ? tail[0].subject
      : undefined;
  return rankSubjects(stats, now).find(
    (r) => r.step.id !== frontier && r.step.id !== fixed && r.step.id !== overused,
  );
}

/** Is a warm-up waiting? (A new day, none done yet today, and a subject to practise.) */
export function warmupDue(child: Child | null | undefined, now: number): boolean {
  if (!child) return false;
  if (warmupDoneOn(statsOf(child), dayKey(now))) return false;
  return !!pickWarmupSubject(child, now);
}

/** The warm-up subject a child will get, for grown-up displays (same rules). */
export function upcomingWarmup(child: Child, now: number): RankedSubject | undefined {
  return pickWarmupSubject(child, now);
}

/** The level a step plays at for this child (adaptive level, or the manual pin). */
export function warmupLevel(child: Child, ref: SubjectRef): number {
  const top = ref.step.maxLevel ?? 4;
  if (child.adaptive === false) return child.level >= 2 ? top : 1;
  return Math.min(top, child.progress?.[ref.unit.id]?.[ref.step.id]?.level ?? 1);
}

/**
 * The game for segment `segNo` of a warm-up: the step's unlocked games at this
 * level, round-robin (variety), never speaking or typing.
 */
export function warmupActivity(step: SkillNode, level: number, segNo: number): ActivityKind {
  const games = activitiesUpTo(step, level).filter((a) => !WARMUP_SKIPS.has(a));
  const pool = games.length > 0 ? games : [step.activity];
  return pool[((segNo % pool.length) + pool.length) % pool.length];
}

/** The most recent warm-up (for "yesterday you practised…" copy). */
export function previousWarmup(child: Child): ReturnType<typeof lastWarmup> {
  return lastWarmup(statsOf(child));
}

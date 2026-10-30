// A model child plays the course for months, on the REAL engine: Continue
// (course.ts), the levels (progress.ts / adapt.ts), spaced review (srs.ts),
// the warm-up (warmup.ts), review woven into the course and the day's budget
// (session.ts), stats and checkpoints. It answers like a child might — words
// fade over time and grow with well-spaced practice; each grammar step has a
// skill that grows with practice and fades a little — so a change to the
// pacing can be measured before a child meets it: does the course keep moving,
// do weak spots come back, does the review pile stay in hand?
//
// Dev tooling only (scripts/simulate-progress.ts, simulate.test.ts); the app
// never imports it. Deterministic for a given seed.

import type { Child } from '../state/storage';
import { UNITS, checkpointPassRatio, checkpointPlan, nextAction, type Unit } from './course';
import { stepWordPool, type SkillNode } from './path';
import { recordRoundOnChild } from './progress';
import { nextStoryId, recordStoryOnChild, storyStepDone } from './storyLog';
import { stories } from '../content/stories';
import { grammarSrsId, isGrammarId, review } from './srs';
import { familiarityWeigher } from './srs';
import { applyStatEvent, applyWarmup, statsOf } from './stats';
import { warmupDue, warmupPlan, warmupQuestions } from './warmup';
import { dueReviewIds, flowReviewIds, questionsToday, sessionBudget, QUESTIONS_PER_ROUND } from './session';
import { dayKey } from './streak';

const DAY = 86_400_000;

export interface LearnerModel {
  name: string;
  band: 'younger' | 'older';
  /** Starting skill for a grammar step, 0..1. */
  skill: (step: SkillNode) => number;
  /** Skill gained per round, as a share of the way to the ceiling. */
  learn: number;
  /** Share of days played. */
  playDays: number;
  /** Rounds played past the day's budget ("Keep going"). */
  extraRounds: number;
}

/** Steps a "weak spots" child finds hard: k/p/t changes, into/out of, verb families, dates, pronouns, plurals. */
export const isHardStep = (s: SkillNode) => /kpt|into|out-off|six-cases|which-type|dates|me-you|plural|in-them|some-any/.test(s.id);

export const LEARNERS: readonly LearnerModel[] = [
  { name: 'steady', band: 'younger', skill: () => 0.85, learn: 0.12, playDays: 0.85, extraRounds: 0 },
  { name: 'strong-older', band: 'older', skill: () => 0.93, learn: 0.15, playDays: 0.85, extraRounds: 1 },
  { name: 'weak-spots', band: 'younger', skill: (s) => (isHardStep(s) ? 0.55 : 0.85), learn: 0.08, playDays: 0.85, extraRounds: 0 },
];

export interface Snapshot {
  day: number;
  /** 1-based unit Continue is in. */
  unit: number;
  courseRounds: number;
  reviewWarmups: number;
  subjectWarmups: number;
  flowReviews: number;
  words: number;
  /** Mean chance the child recalls a word met so far, right now. */
  recall: number;
  due: number;
  /** Mean skill on the hard steps met so far. */
  hardSkill: number;
  /** Hard steps not practised for a month. */
  hardStale: number;
}

interface Memory {
  stability: number;
  last: number;
}

export function simulate(model: LearnerModel, days: number, seed = 1, snapshotDays: readonly number[] = [days]): Snapshot[] {
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
  const start = Date.parse('2026-01-05T16:00:00');
  let child = {
    id: 'sim',
    name: 'Sim',
    avatar: '🦊',
    level: 1,
    stars: 0,
    createdAt: start,
    progress: {},
    srs: {},
    readerBand: model.band,
    adaptive: true,
    course: { lessonsSeen: {}, checkpoints: {}, openersHeard: {} },
  } as Child;
  const memory = new Map<string, Memory>();
  const skills = new Map<string, { k: number; last: number }>();
  const reviewedAt = new Set<string>();
  const n = { courseRounds: 0, reviewWarmups: 0, subjectWarmups: 0, flowReviews: 0 };

  const recall = (id: string, now: number) => {
    const m = memory.get(id);
    return m ? Math.exp(-(now - m.last) / DAY / m.stability) : 0;
  };
  const practise = (id: string, right: boolean, now: number) => {
    const m = memory.get(id);
    if (!m) return void memory.set(id, { stability: 0.6, last: now });
    const r = recall(id, now);
    m.stability = right ? m.stability * (1 + 2.5 * (1 - r)) + 0.05 : Math.max(0.4, m.stability * 0.6);
    m.last = now;
  };
  const skillOf = (step: SkillNode, now: number) => {
    let k = skills.get(step.id);
    if (!k) skills.set(step.id, (k = { k: model.skill(step), last: now }));
    return k.k * Math.pow(0.995, (now - k.last) / DAY);
  };
  const train = (step: SkillNode, now: number) => {
    const k = skills.get(step.id)!;
    k.k += model.learn * (0.98 - k.k);
    k.last = now;
  };
  const chance = (p: number) => Math.min(0.99, 0.3 + 0.7 * p);
  const answer = (id: string, right: boolean, now: number) => {
    if (!isGrammarId(id)) practise(id, right, now);
    child = { ...child, srs: { ...child.srs, [id]: review(child.srs[id], right, now) } };
  };

  const conStep = new Map<string, SkillNode>();
  for (const u of UNITS) for (const st of u.skills) for (const c of st.content.constructionIds ?? []) if (!conStep.has(c)) conStep.set(c, st);

  const pick = (ids: readonly string[], now: number) => {
    const weigh = familiarityWeigher(child.srs, { now });
    const w = ids.map((id) => weigh({ id }));
    let t = rnd() * w.reduce((a, b) => a + b, 0);
    let k = 0;
    while (k < ids.length - 1 && (t -= w[k]) > 0) k++;
    return ids[k];
  };

  /** One round of a step: six questions, recorded like the app records it. */
  const playRound = (unit: Unit, step: SkillNode, now: number, source: 'practice' | 'warmup') => {
    const pool = stepWordPool(step);
    const sk = skillOf(step, now);
    const con = step.content.constructionIds?.[0];
    let right = 0;
    for (let q = 0; q < QUESTIONS_PER_ROUND; q++) {
      const id = pool.length > 0 ? pick(pool, now) : undefined;
      const r = id ? (memory.has(id) ? recall(id, now) : 0.55) : 1; // a new word is met first (its intro card)
      const ok = rnd() < chance(sk * (0.35 + 0.65 * r));
      if (ok) right++;
      if (id) answer(id, ok, now);
      if (con) answer(grammarSrsId(con), ok, now);
    }
    train(step, now);
    child = recordRoundOnChild(child, unit.id, step.id, right, QUESTIONS_PER_ROUND, step.maxLevel ?? 4);
    child = { ...child, stats: applyStatEvent(statsOf(child), { subject: step.id, right, total: QUESTIONS_PER_ROUND, source }, now) };
    return right;
  };

  const reviewRound = (ids: readonly string[], now: number) => {
    let right = 0;
    for (const id of ids) {
      const st = isGrammarId(id) ? conStep.get(id.slice(4)) : undefined;
      const ok = rnd() < chance(st ? skillOf(st, now) : recall(id, now));
      if (ok) right++;
      answer(id, ok, now);
    }
    child = { ...child, stats: applyStatEvent(statsOf(child), { right, total: ids.length, source: 'review' }, now) };
    return right;
  };

  const warmUp = (now: number) => {
    if (!warmupDue(child, now)) return;
    const plan = warmupPlan(child, now);
    if (plan.kind === 'review') {
      const right = reviewRound(plan.ids, now);
      child = { ...child, stats: applyWarmup(statsOf(child), { day: dayKey(now), subject: 'review', right, total: plan.ids.length, at: now }) };
      n.reviewWarmups++;
    } else if (plan.kind === 'subject') {
      const { unit, step } = plan.subject;
      const rounds = Math.ceil(warmupQuestions(child) / QUESTIONS_PER_ROUND);
      let right = 0;
      for (let r = 0; r < rounds; r++) right += playRound(unit, step, now, 'warmup');
      child = { ...child, stats: applyWarmup(statsOf(child), { day: dayKey(now), subject: step.id, right, total: rounds * QUESTIONS_PER_ROUND, at: now }) };
      n.subjectWarmups++;
    }
  };

  /** What Continue opens next, played. False at the open-ended Mestari unit. */
  const continueOnce = (now: number): boolean => {
    const a = nextAction(child);
    if (a.unit.id === 'mestari') return false;
    const c = child.course ?? {};
    if (a.kind === 'opener') {
      child = { ...child, course: { ...c, openersHeard: { ...c.openersHeard, [a.unit.id]: now } } };
    } else if (a.kind === 'lesson') {
      child = { ...child, course: { ...c, lessonsSeen: { ...c.lessonsSeen, [a.lessonId]: now } } };
    } else if (a.kind === 'checkpoint') {
      const prev = c.checkpoints?.[a.unit.id];
      let right = 0;
      let total = 0;
      for (const part of checkpointPlan(a.unit, prev?.attempts ?? 0)) {
        for (let q = 0; q < part.questions; q++, total++) if (rnd() < chance(skillOf(part.step, now) * 0.95)) right++;
      }
      const ratio = total > 0 ? right / total : 0;
      const passed = ratio >= checkpointPassRatio(a.unit);
      child = {
        ...child,
        stats: applyStatEvent(statsOf(child), { right, total, source: 'checkpoint' }, now),
        course: {
          ...c,
          checkpoints: {
            ...c.checkpoints,
            [a.unit.id]: { attempts: (prev?.attempts ?? 0) + 1, best: Math.max(prev?.best ?? 0, ratio), ...(passed ? { passedAt: now } : {}) },
          },
        },
      };
    } else if (a.step.activity === 'story') {
      const ids = a.step.content.ids ?? stories.map((x) => x.id);
      const id = nextStoryId(child, ids)!;
      const right = rnd() < 0.85 ? 4 : 3;
      child = recordStoryOnChild(child, id, right, 4, [], now);
      child = recordRoundOnChild(child, a.unit.id, a.step.id, right, 4, a.step.maxLevel ?? 4, false, storyStepDone(child, ids));
      child = { ...child, stats: applyStatEvent(statsOf(child), { subject: a.step.id, right, total: 4, source: 'practice' }, now) };
    } else {
      // Review woven in, as SkillRoute does it (once per count of the step's plays).
      const plays = child.progress?.[a.unit.id]?.[a.step.id]?.plays ?? 0;
      const key = `${a.step.id}:${plays}`;
      const ids = a.step.activity === 'dialogue' || a.step.activity === 'conversation' || reviewedAt.has(key) ? [] : flowReviewIds(child, plays, now);
      if (ids.length > 0) {
        reviewedAt.add(key);
        reviewRound(ids, now);
        n.flowReviews++;
      } else {
        playRound(a.unit, a.step, now, 'practice');
        n.courseRounds++;
      }
    }
    return true;
  };

  const out: Snapshot[] = [];
  const want = new Set(snapshotDays);
  for (let d = 0; d < days; d++) {
    const day = start + d * DAY;
    if (rnd() < model.playDays) {
      warmUp(day);
      let t = day;
      for (let guard = 0; questionsToday(child, t) < sessionBudget(child) && guard < 80; guard++) {
        t += 60_000;
        if (!continueOnce(t)) break;
      }
      for (let x = 0; x < model.extraRounds; x++) continueOnce((t += 60_000));
    }
    if (want.has(d + 1)) {
      const end = day + 12 * 3_600_000;
      const words = [...memory.keys()];
      const hard = UNITS.flatMap((u) => u.skills).filter((st) => isHardStep(st) && skills.has(st.id));
      out.push({
        day: d + 1,
        unit: UNITS.findIndex((u) => u.id === nextAction(child).unit.id) + 1,
        ...n,
        words: words.length,
        recall: words.reduce((a, id) => a + recall(id, end), 0) / Math.max(1, words.length),
        due: dueReviewIds(child, end).length,
        hardSkill: hard.reduce((a, st) => a + skillOf(st, end), 0) / Math.max(1, hard.length),
        hardStale: hard.filter((st) => (end - skills.get(st.id)!.last) / DAY > 30).length,
      });
    }
  }
  return out;
}

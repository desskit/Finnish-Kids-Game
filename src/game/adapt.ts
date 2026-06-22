// Adaptive difficulty engine.
//
// Difficulty is a MEASURED, per-(child, activity) quantity — not a global
// toggle. Each finished round feeds its accuracy into a short rolling window;
// sustained high accuracy promotes the child to a harder level, sustained low
// accuracy demotes them. The whole thing is PURE and deterministic (no clock,
// no randomness), so it is trivially unit-testable and the parent dashboard can
// replay/verify exactly why a level changed.
//
// A level maps to concrete "levers" the round builders already accept:
//   - optionCount  : how many answer tiles (more = harder)
//   - maxTier      : which carrier-phrase tiers are allowed (gates harder cases)
//   - maxCount     : the largest count in Count & Say
//   - verbCombos   : which verb tense/polarity sets Conjugate the Verb may draw
//                    (present positive → + negative → + past), all from sourced
//                    data — never generated.

import type { Polarity, Tier, VerbTense } from '../content/types';

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 3;

/** Promote once the recent window averages at/above this first-pass accuracy. */
export const PROMOTE_AT = 0.85;
/** Demote once the recent window averages at/below this. */
export const DEMOTE_BELOW = 0.5;
/** Rounds kept in the rolling window that drives promotion/demotion. */
export const RECENT_WINDOW = 5;
/** Need at least this many rounds at a level before it can change (stability). */
export const MIN_ROUNDS = 2;

export interface VerbCombo {
  tense: VerbTense;
  polarity: Polarity;
}

const PRESENT_POSITIVE: VerbCombo = { tense: 'present', polarity: 'positive' };
const PRESENT_NEGATIVE: VerbCombo = { tense: 'present', polarity: 'negative' };
const PAST_POSITIVE: VerbCombo = { tense: 'past', polarity: 'positive' };

/** The concrete difficulty knobs a level expands into. */
export interface Difficulty {
  level: number;
  optionCount: number;
  maxTier: Tier;
  maxCount: number;
  verbCombos: VerbCombo[];
}

function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return MIN_LEVEL;
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, Math.round(level)));
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Expand a difficulty level into the levers the activities + round builders use.
 * Option count stays ≤ 4 (the card grid only styles 3- and 4-up); harder levels
 * add difficulty through tiers, larger counts, and richer verb forms instead.
 */
export function difficultyFor(level: number): Difficulty {
  switch (clampLevel(level)) {
    case 1:
      return {
        level: 1,
        optionCount: 3,
        maxTier: 2,
        maxCount: 5,
        verbCombos: [PRESENT_POSITIVE],
      };
    case 2:
      return {
        level: 2,
        optionCount: 4,
        maxTier: 3,
        maxCount: 8,
        verbCombos: [PRESENT_POSITIVE, PRESENT_NEGATIVE],
      };
    default:
      return {
        level: 3,
        optionCount: 4,
        maxTier: 3,
        maxCount: 10,
        verbCombos: [PRESENT_POSITIVE, PRESENT_NEGATIVE, PAST_POSITIVE],
      };
  }
}

export interface AdaptOutcome {
  /** The level to use for the next round. */
  level: number;
  /** The rolling accuracy window after this round (reset to empty on a change). */
  recent: number[];
}

/**
 * Fold one finished round's accuracy (stars / total, 0..1) into the adaptive
 * state and return the next level + window. A level change clears the window so
 * the child must re-prove themselves at the new level before moving again — this
 * hysteresis stops oscillation around a threshold.
 */
export function applyRound(level: number, recent: number[], accuracy: number): AdaptOutcome {
  const lvl = clampLevel(level);
  const window = [...(Array.isArray(recent) ? recent : []), clamp01(accuracy)].slice(
    -RECENT_WINDOW,
  );

  if (window.length >= MIN_ROUNDS) {
    const avg = window.reduce((a, b) => a + b, 0) / window.length;
    if (avg >= PROMOTE_AT && lvl < MAX_LEVEL) return { level: lvl + 1, recent: [] };
    if (avg <= DEMOTE_BELOW && lvl > MIN_LEVEL) return { level: lvl - 1, recent: [] };
  }
  return { level: lvl, recent: window };
}

/** Mean of the rolling window as a 0..1 fraction (0 when empty) — for display. */
export function windowAccuracy(recent: number[] | undefined): number {
  if (!recent || recent.length === 0) return 0;
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

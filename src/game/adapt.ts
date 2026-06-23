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
//
// The engine's ladder goes up to MAX_LEVEL, but most skill nodes cap below it
// (`SkillNode.maxLevel`, see path.tsx) — depth is per-node, sized to how much
// real Finnish grammar that node's subject supports. Promotion also STEEPENS
// with level (see `promoteThreshold`/`minRoundsToPromote`): early levels climb
// fast, the top levels demand a longer, more accurate streak — a genuine grind.

import type { Polarity, Tier, VerbTense } from '../content/types';

export const MIN_LEVEL = 1;

/** Demote once the recent window averages at/below this, at any level. */
export const DEMOTE_BELOW = 0.5;
/** Rounds kept in the rolling window that drives promotion/demotion. */
export const RECENT_WINDOW = 8;
/** Need at least this many rounds at a level before DEMOTION can fire (stability). */
export const MIN_ROUNDS = 2;

export interface VerbCombo {
  tense: VerbTense;
  polarity: Polarity;
}

const PRESENT_POSITIVE: VerbCombo = { tense: 'present', polarity: 'positive' };
const PRESENT_NEGATIVE: VerbCombo = { tense: 'present', polarity: 'negative' };
const PAST_POSITIVE: VerbCombo = { tense: 'past', polarity: 'positive' };
const PAST_NEGATIVE: VerbCombo = { tense: 'past', polarity: 'negative' };

/** The concrete difficulty knobs a level expands into. */
export interface Difficulty {
  level: number;
  optionCount: number;
  maxTier: Tier;
  maxCount: number;
  verbCombos: VerbCombo[];
}

/**
 * The shared level → levers table. A data-driven array (not a switch) so
 * extending the engine's depth later is a one-row edit. Levels 1–4 preserve
 * the original curve exactly; 5–8 extend it (deeper tiers, larger counts).
 * `verbCombos` holds at the level-4 set for 5–8 — past-negative isn't sourced
 * for any verb, and the `conjugate` skill caps its own node at depth 4 anyway.
 * Option count stays ≤ 4 (the card grid only styles 3- and 4-up); harder
 * levels add difficulty through tiers, larger counts, and richer verb forms.
 */
const LEVEL_SPECS: Difficulty[] = [
  { level: 1, optionCount: 3, maxTier: 2, maxCount: 5, verbCombos: [PRESENT_POSITIVE] },
  {
    level: 2,
    optionCount: 4,
    maxTier: 3,
    maxCount: 8,
    verbCombos: [PRESENT_POSITIVE, PRESENT_NEGATIVE],
  },
  {
    level: 3,
    optionCount: 4,
    maxTier: 3,
    maxCount: 10,
    verbCombos: [PRESENT_POSITIVE, PRESENT_NEGATIVE, PAST_POSITIVE],
  },
  {
    level: 4,
    optionCount: 4,
    maxTier: 4,
    maxCount: 12,
    verbCombos: [PRESENT_POSITIVE, PRESENT_NEGATIVE, PAST_POSITIVE, PAST_NEGATIVE],
  },
  {
    level: 5,
    optionCount: 4,
    maxTier: 5,
    maxCount: 14,
    verbCombos: [PRESENT_POSITIVE, PRESENT_NEGATIVE, PAST_POSITIVE, PAST_NEGATIVE],
  },
  {
    level: 6,
    optionCount: 4,
    maxTier: 6,
    maxCount: 16,
    verbCombos: [PRESENT_POSITIVE, PRESENT_NEGATIVE, PAST_POSITIVE, PAST_NEGATIVE],
  },
  {
    level: 7,
    optionCount: 4,
    maxTier: 7,
    maxCount: 18,
    verbCombos: [PRESENT_POSITIVE, PRESENT_NEGATIVE, PAST_POSITIVE, PAST_NEGATIVE],
  },
  {
    level: 8,
    optionCount: 4,
    maxTier: 8,
    maxCount: 20,
    verbCombos: [PRESENT_POSITIVE, PRESENT_NEGATIVE, PAST_POSITIVE, PAST_NEGATIVE],
  },
];

/** The engine's absolute ceiling — the level-table size. Node depth (`maxLevel`) is ≤ this. */
export const MAX_LEVEL = LEVEL_SPECS.length;

function clampLevel(level: number, cap: number = MAX_LEVEL): number {
  if (!Number.isFinite(level)) return MIN_LEVEL;
  return Math.max(MIN_LEVEL, Math.min(cap, Math.round(level)));
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** Expand a difficulty level into the levers the activities + round builders use. */
export function difficultyFor(level: number): Difficulty {
  return LEVEL_SPECS[clampLevel(level) - 1];
}

/**
 * Promotion threshold steepens with level: 0.85 at L1, +0.02/level, capped at
 * 0.95 — a grind at the top, fast climbing early.
 */
export function promoteThreshold(level: number): number {
  return Math.min(0.85 + 0.02 * (clampLevel(level) - 1), 0.95);
}

/**
 * Rounds required (at this level) before promotion can fire: 2 at L1–2,
 * stepping up to 5 by the top levels — sustaining accuracy over more rounds
 * is what makes the climb a genuine grind near the ceiling.
 */
export function minRoundsToPromote(level: number): number {
  return Math.min(2 + Math.floor((clampLevel(level) - 1) / 2), 5);
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
 * hysteresis stops oscillation around a threshold. `maxLevel` is the node's own
 * ladder depth (see `SkillNode.maxLevel`) — a node never climbs past it, even
 * though the engine's shared level table (and `recent` window sizing) goes to
 * `MAX_LEVEL`. Demotion is a fast, level-independent safety net; promotion
 * steepens with level (see `promoteThreshold`/`minRoundsToPromote`).
 */
export function applyRound(
  level: number,
  recent: number[],
  accuracy: number,
  maxLevel: number = MAX_LEVEL,
): AdaptOutcome {
  const cap = clampLevel(maxLevel);
  const lvl = clampLevel(level, cap);
  const window = [...(Array.isArray(recent) ? recent : []), clamp01(accuracy)].slice(
    -RECENT_WINDOW,
  );
  const avg = window.reduce((a, b) => a + b, 0) / window.length;

  if (window.length >= minRoundsToPromote(lvl) && avg >= promoteThreshold(lvl) && lvl < cap) {
    return { level: lvl + 1, recent: [] };
  }
  if (window.length >= MIN_ROUNDS && avg <= DEMOTE_BELOW && lvl > MIN_LEVEL) {
    return { level: lvl - 1, recent: [] };
  }
  return { level: lvl, recent: window };
}

/** Mean of the rolling window as a 0..1 fraction (0 when empty) — for display. */
export function windowAccuracy(recent: number[] | undefined): number {
  if (!recent || recent.length === 0) return 0;
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

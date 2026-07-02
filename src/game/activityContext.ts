import { createContext, useContext, useEffect, useRef } from 'react';
import type { Difficulty } from './adapt';
import type { Badge } from './badges';

// Lets a game report a finished question segment up to the router (which knows
// the topic + activity) without threading a callback through every component.
// SkillRoute provides it; the games consume it via useSegmentComplete. The
// router also hands down the adaptive `difficulty` so each activity sizes
// itself to the active child's measured level, plus the sitting's running star
// count for the header.

/** What changed as a result of a recorded segment — drives the reward toast. */
export interface RoundOutcome {
  /** True if this segment pushed the activity's adaptive level up. */
  leveledUp: boolean;
  /** The level after this segment. */
  level: number;
  /** Badges newly earned by this segment (empty when none). */
  newBadges: Badge[];
}

export interface ActivityContextValue {
  /**
   * Record a finished question segment silently AND advance the session to the
   * next one. Owned by SkillRoute so play is one unbroken stream: the caller
   * unmounts right after (key bump) and the next segment — possibly a
   * different game type — mounts with no interstitial. `stars` here is the
   * segment's FIRST-TRY count (real accuracy for the adaptive engine), not the
   * visible star economy.
   */
  onSegmentComplete: (stars: number, total: number) => void;
  /** Difficulty levers for this (topic, activity), from the active child's level. */
  difficulty: Difficulty;
  /** Stars earned so far in this sitting (drives the header counter). */
  sessionStars: number;
}

export const ActivityContext = createContext<ActivityContextValue | null>(null);

export function useActivityContext(): ActivityContextValue | null {
  return useContext(ActivityContext);
}

/**
 * Shared end-of-segment handoff for the games. When `done` flips true it
 * reports the segment ONCE (ref-guarded against StrictMode's double effect
 * run) — in a session that records + advances, unmounting the game via the
 * parent's key bump; standalone (no context, e.g. component tests) it quietly
 * restarts so play still never stops.
 */
export function useSegmentComplete(
  done: boolean,
  stars: number,
  total: number,
  restart: () => void,
): void {
  const ctx = useActivityContext();
  const reported = useRef(false);
  useEffect(() => {
    if (!done) {
      reported.current = false;
      return;
    }
    if (reported.current) return;
    reported.current = true;
    if (ctx) ctx.onSegmentComplete(stars, total);
    else restart();
  }, [done, ctx, stars, total, restart]);
}

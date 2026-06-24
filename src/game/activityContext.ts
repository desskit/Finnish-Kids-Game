import { createContext, useContext } from 'react';
import type { Difficulty } from './adapt';
import type { Badge } from './badges';

// Lets the shared RoundComplete screen report a finished round up to the router
// (which knows the topic + activity) without threading a callback through every
// game component. ActivityRoute provides it; RoundComplete consumes it. The
// router also hands down the adaptive `difficulty` so each activity sizes itself
// to the active child's measured level for that activity.

/** What changed as a result of a finished round — drives the celebration. */
export interface RoundOutcome {
  /** True if this round pushed the activity's adaptive level up. */
  leveledUp: boolean;
  /** The level after this round. */
  level: number;
  /** Badges newly earned by this round (empty when none). */
  newBadges: Badge[];
}

export interface ActivityContextValue {
  /** Called once when a round finishes; records progress and returns what changed. */
  onRoundComplete: (stars: number, total: number) => RoundOutcome;
  /** Difficulty levers for this (topic, activity), from the active child's level. */
  difficulty: Difficulty;
  /**
   * Advance the continuous session to the next round. Owned by SkillRoute (not
   * the game component) so the NEXT round can switch to a different game type —
   * the source of in-session variety. RoundComplete's "Jatka" / auto-advance
   * calls this; the current component then unmounts and the next one mounts.
   */
  onAdvance: () => void;
}

export const ActivityContext = createContext<ActivityContextValue | null>(null);

export function useActivityContext(): ActivityContextValue | null {
  return useContext(ActivityContext);
}

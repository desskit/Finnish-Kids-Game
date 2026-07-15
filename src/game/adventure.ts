// "Today's adventure" — a short, one-tap guided session for the map's
// hero entry, assembling up to 3 stops in pedagogical priority order: due
// review first (spaced repetition only works if it's actually revisited),
// then the child's weakest recently-played node (a gentle nudge back to
// something that needs more reps), then the next not-yet-played node (keeps
// moving forward). Each stop is only included when it actually applies, so a
// brand-new child gets just "next", and a caught-up child might get "weakest"
// + "next" with no review stop. Pure and deterministic given `now` — the
// child steers each stop exactly like free play; this only curates a
// suggested queue and never forces anything.

import type { Child } from '../state/storage';
import { reviewItems } from '../content';
import { isDue, type ItemSchedule } from './srs';
import { windowAccuracy } from './adapt';
import { PATH, findSkill, nextSkillId, type FoundSkill } from './path';

export const ADVENTURE_MAX_STOPS = 3;

/** Below this recent-window accuracy, a played node counts as "could use more
 *  practice" — the same neighborhood as the adaptive engine's own promotion
 *  bar (adapt.ts's L1 threshold is 0.85), so the suggestion tracks the same
 *  notion of "doing fine" the child's own level already uses. */
const WEAK_ACCURACY_THRESHOLD = 0.85;

export interface AdventureStop {
  kind: 'review' | 'skill';
  /** Set only for kind 'skill' — routes to `/skill/:skillId`. */
  skillId?: string;
  titleFi: string;
  titleEn: string;
  icon: string;
}

function hasDueReview(srs: Record<string, ItemSchedule> | undefined, now: number): boolean {
  if (!srs) return false;
  return reviewItems.some((i) => {
    const s = srs[i.id];
    return s && isDue(s, now);
  });
}

/** The child's weakest recently-played node (lowest recent-window accuracy,
 *  below the "could use practice" bar), or undefined if nothing qualifies —
 *  either nothing has been played yet, or every played node is doing fine.
 *  Skips a node with an EMPTY recent window (e.g. right after a level-up,
 *  which resets it) rather than reading that as "worst" by default. */
function weakestSkill(child: Child): FoundSkill | undefined {
  let worst: { found: FoundSkill; acc: number } | undefined;
  for (const chapter of PATH) {
    for (const skill of chapter.skills) {
      if (skill.activity === 'review') continue;
      const entry = child.progress?.[chapter.id]?.[skill.id];
      if (!entry || entry.plays === 0 || !entry.recent || entry.recent.length === 0) continue;
      const acc = windowAccuracy(entry.recent);
      if (acc < WEAK_ACCURACY_THRESHOLD && (!worst || acc < worst.acc)) {
        worst = { found: { chapter, skill }, acc };
      }
    }
  }
  return worst?.found;
}

/** Build today's suggested 1-3 stop queue for `child`, given the current time. */
export function buildAdventure(child: Child, now: number): AdventureStop[] {
  const stops: AdventureStop[] = [];

  if (hasDueReview(child.srs, now)) {
    stops.push({ kind: 'review', titleFi: 'Kertaus', titleEn: 'Review', icon: '🔁' });
  }

  const weak = weakestSkill(child);
  if (weak) {
    stops.push({
      kind: 'skill',
      skillId: weak.skill.id,
      titleFi: weak.skill.titleFi,
      titleEn: weak.skill.titleEn,
      icon: weak.skill.icon,
    });
  }

  const nextId = nextSkillId(child);
  if (nextId && nextId !== weak?.skill.id) {
    const found = findSkill(nextId);
    if (found) {
      stops.push({
        kind: 'skill',
        skillId: found.skill.id,
        titleFi: found.skill.titleFi,
        titleEn: found.skill.titleEn,
        icon: found.skill.icon,
      });
    }
  }

  return stops.slice(0, ADVENTURE_MAX_STOPS);
}

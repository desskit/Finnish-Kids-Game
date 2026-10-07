import type { Child } from '../state/storage';
import { activityLevel } from './progress';

// Parent "can-do" statements (learning-audit E-17): translate node levels into
// plain-language claims about what the child can DO with Finnish ("Can greet
// and reply", "Can count to 10") — CEFR-style can-do framing scaled way down.
// Pure derivation from the same per-node adaptive levels the dashboard already
// shows; nothing new is recorded and no Finnish is generated (statements are
// parent-facing English meta-text, like the rest of the grown-up dashboard).
//
// Evidence: a passed unit checkpoint (first-try answers across every step of
// the unit), or — for the open-ended expert band — a step's measured level,
// held across real rounds (see applyRound), not a one-off lucky streak.

export type CanDoRequirement =
  /** A course unit's checkpoint was passed. */
  | { unitId: string }
  /** A step's measured adaptive level (the open-ended expert unit). */
  | { chapterId: string; skillId: string; level: number };

export interface CanDoStatement {
  id: string;
  emoji: string;
  /** The parent-facing claim, e.g. "Can greet people and reply". */
  en: string;
  /** What the evidence is, shown as the secondary line. */
  basisEn: string;
  /** The evidence that backs the claim (all must be met). */
  requires: CanDoRequirement[];
}

// One claim per course unit — a passed checkpoint is first-try evidence across
// every step of the unit — plus the expert band, measured by step levels.
const unitClaim = (
  n: number,
  unitId: string,
  emoji: string,
  en: string,
): CanDoStatement => ({
  id: unitId,
  emoji,
  en,
  basisEn: `Unit ${n} checkpoint passed`,
  requires: [{ unitId }],
});

export const CAN_DO: CanDoStatement[] = [
  unitClaim(1, 'u1-hello', '👋', 'Can greet people, say thanks and goodbye, and say their name'),
  unitClaim(2, 'u2-people', '👉', 'Can name people and things around them, and ask yes/no questions'),
  unitClaim(3, 'u3-numbers', '🔢', 'Can count to ten (and knows why "kaksi kirjaa" ends in -a)'),
  unitClaim(4, 'u4-having', '🎒', 'Can say who has what ("Minulla on…")'),
  unitClaim(5, 'u5-not-having', '🚫', "Can say what they don't have"),
  unitClaim(6, 'u6-doing', '🏃', 'Can say who is doing what, with the right verb ending'),
  unitClaim(7, 'u7-not-doing', '✋', "Can say what they don't do"),
  unitClaim(8, 'u8-likes', '❤️', 'Can say what they like and love'),
  unitClaim(9, 'u9-seeing', '👀', 'Can say what they see, watch and wait for'),
  unitClaim(10, 'u10-shop', '🛒', 'Can buy things in a shop'),
  unitClaim(11, 'u11-describing', '🎨', 'Can describe things with colors and describing words'),
  unitClaim(12, 'u12-where', '📍', 'Can say where things are (in / on)'),
  unitClaim(13, 'u13-moving', '🚶', 'Can say where things go and where they come from'),
  unitClaim(14, 'u14-around', '🧭', "Can say what's in front of, behind, next to or under something"),
  unitClaim(15, 'u15-whose', '🙋', 'Can say whose something is (my / your / their)'),
  unitClaim(16, 'u16-many', '👐', 'Can talk about more than one thing'),
  unitClaim(17, 'u17-yesterday', '⏮️', 'Can talk about what happened yesterday'),
  unitClaim(18, 'u18-chatting', '🗣️', 'Can hold a short conversation and follow a story'),
  unitClaim(19, 'u19-sentences', '📝', 'Can build whole sentences and spot mistakes in them'),
  // --- The expert band (adult-learner territory) ---
  {
    id: 'verb-tenses',
    emoji: '⏳',
    en: 'Can use past, perfect and conditional verb forms',
    basisEn: 'Expert: Every tense at level 8 (the top)',
    requires: [{ chapterId: 'u20-mestari', skillId: 'verbs-expert', level: 8 }],
  },
  {
    id: 'plural-cases',
    emoji: '🧭',
    en: 'Can use the plural case system (on / into / out of many)',
    basisEn: 'Expert: Every place case at level 9+',
    requires: [{ chapterId: 'u20-mestari', skillId: 'cases-expert', level: 9 }],
  },
  {
    id: 'count-100',
    emoji: '💯',
    en: 'Can count in tens up to 100',
    basisEn: 'Expert: Count to 100 at level 9+',
    requires: [{ chapterId: 'u20-mestari', skillId: 'count-expert', level: 9 }],
  },
  {
    id: 'dictation',
    emoji: '👂',
    en: 'Can write Finnish from hearing it alone',
    basisEn: 'Expert: Spelling at level 9+ (audio-only dictation)',
    requires: [{ chapterId: 'u20-mestari', skillId: 'spell-expert', level: 9 }],
  },
];

function met(child: Child, r: CanDoRequirement): boolean {
  if ('unitId' in r) return !!child.course?.checkpoints?.[r.unitId]?.passedAt;
  // activityLevel defaults to 1 for never-played nodes; require actual play so
  // a fresh child doesn't "meet" a level bar by default.
  const played = !!child.progress?.[r.chapterId]?.[r.skillId];
  return played && activityLevel(child, r.chapterId, r.skillId) >= r.level;
}

/** Whether the child's measured levels back a statement. */
export function canDoAchieved(child: Child, s: CanDoStatement): boolean {
  return s.requires.every((r) => met(child, r));
}

/** The statement list split into achieved / not-yet, in authored order. */
export function canDoSummary(child: Child): {
  achieved: CanDoStatement[];
  upNext: CanDoStatement[];
} {
  const achieved: CanDoStatement[] = [];
  const rest: CanDoStatement[] = [];
  for (const s of CAN_DO) (canDoAchieved(child, s) ? achieved : rest).push(s);
  return { achieved, upNext: rest };
}

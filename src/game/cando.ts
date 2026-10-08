import type { Child } from '../state/storage';
import { activityLevel } from './progress';
import { PATH } from './path';

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
// The unit number comes from the course order, so inserting a unit never
// leaves a claim pointing at the wrong number.
const unitClaim = (unitId: string, emoji: string, en: string): CanDoStatement => ({
  id: unitId,
  emoji,
  en,
  basisEn: `Unit ${PATH.findIndex((u) => u.id === unitId) + 1} checkpoint passed`,
  requires: [{ unitId }],
});

export const CAN_DO: CanDoStatement[] = [
  unitClaim('hello', '👋', 'Can greet people, say thanks and goodbye, and say their name'),
  unitClaim('people', '👉', 'Can name people and things around them, and ask yes/no questions'),
  unitClaim('numbers', '🔢', 'Can count to twelve (and knows why "kaksi kirjaa" ends in -a)'),
  unitClaim('having', '🎒', 'Can say who has what ("Minulla on…")'),
  unitClaim('not-having', '🚫', "Can say what they don't have"),
  unitClaim('whose', '🙋', 'Can say whose something is — my, your, his / her (kirjani, kirjasi, kirjansa)'),
  unitClaim('owners', '🚲', "Can say whose something is — isän pyörä (Dad's bike)"),
  unitClaim('doing', '🏃', 'Can use verb types 1–3 with the right "who" ending (laulan, syöt, hän tulee)'),
  unitClaim('doing-kpt', '🔀', 'Can use verbs whose k, p or t changes (nukkua → minä nukun, hän nukkuu)'),
  unitClaim('not-doing', '✋', "Can say what they don't do"),
  unitClaim('asking', '❓', 'Can ask "do you…?" with -ko / -kö and answer with the verb'),
  unitClaim('feelings', '😄', 'Can say how they feel ("Olen iloinen", "Minulla on nälkä")'),
  unitClaim('likes', '❤️', 'Can say what they like and love (tykkään, pidän, rakastan)'),
  unitClaim('wanting', '🎯', 'Can say what they want to do, can do, and ask "may I…?"'),
  unitClaim('verbs-4', '🔓', 'Can use type 4 verbs (haluta → haluan), including ones that get stronger (hypätä → hyppään)'),
  unitClaim('school-day', '🏫', "Can talk about school subjects they like and don't like"),
  unitClaim('seeing', '👀', 'Can say what they see, watch and wait for'),
  unitClaim('shop', '🛒', 'Can buy things in a shop'),
  unitClaim('commands', '🏃', "Can say do it, don't, and let's (Juokse! Älä juokse! Juostaan!)"),
  unitClaim('describing', '🎨', 'Can describe things with colors and describing words'),
  unitClaim('comparing', '🐘', 'Can compare things — "Norsu on isompi kuin hiiri" — and say which is the biggest'),
  unitClaim('where', '📍', 'Can say where things are (in / on)'),
  unitClaim('moving', '🚶', 'Can say where things go and where they come from'),
  unitClaim('town', '🏙️', 'Can say where they are, where they go and where they come from'),
  unitClaim('by-with', '🚌', 'Can say how they travel and what they use — bussilla, kynällä — and who with (kaverin kanssa)'),
  unitClaim('when', '📅', 'Can name the days, say when things happen, and tell the time'),
  unitClaim('big-numbers', '💯', 'Can count to twenty and by tens to a hundred, and say first, second, third…'),
  unitClaim('birthdays', '🎂', 'Can name the months, say a date (viides toukokuuta), their age and when their birthday is'),
  unitClaim('question-words', '🤔', 'Can ask and answer who, what, where, when, whose and why'),
  unitClaim('me-you', '🫶', 'Can say help me, give it to me, I like you'),
  unitClaim('around', '🧭', "Can say what's in front of, behind, next to or under something"),
  unitClaim('many', '👐', 'Can talk about more than one thing'),
  unitClaim('verbs-5-6', '👵', 'Can tell all six verb types apart and use types 5 and 6 (tarvitsen, vanhenen)'),
  unitClaim('yesterday', '⏮️', 'Can talk about what happened yesterday'),
  unitClaim('chatting', '🗣️', 'Can hold a short conversation and follow a story'),
  unitClaim('sentences', '📝', 'Can build whole sentences and spot mistakes in them'),
  // --- The expert band (adult-learner territory) ---
  {
    id: 'verb-tenses',
    emoji: '⏳',
    en: 'Can use past, perfect and conditional verb forms',
    basisEn: 'Expert: Every tense at level 8 (the top)',
    requires: [{ chapterId: 'mestari', skillId: 'verbs-expert', level: 8 }],
  },
  {
    id: 'plural-cases',
    emoji: '🧭',
    en: 'Can use the plural case system (on / into / out of many)',
    basisEn: 'Expert: Every place case at level 9+',
    requires: [{ chapterId: 'mestari', skillId: 'cases-expert', level: 9 }],
  },
  {
    id: 'count-100',
    emoji: '💯',
    en: 'Can count in tens up to 100',
    basisEn: 'Expert: Count to 100 at level 9+',
    requires: [{ chapterId: 'mestari', skillId: 'count-expert', level: 9 }],
  },
  {
    id: 'dictation',
    emoji: '👂',
    en: 'Can write Finnish from hearing it alone',
    basisEn: 'Expert: Spelling at level 9+ (audio-only dictation)',
    requires: [{ chapterId: 'mestari', skillId: 'spell-expert', level: 9 }],
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

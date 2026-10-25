import type { Child } from '../state/storage';
import { activityLevel } from './progress';
import { PATH } from './path';
import { MATH_STAGES } from './mathPath';

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
  /** A math stage's crown was won (Lasketaan!, mathPath.tsx). */
  | { mathStageId: string }
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
  /** The question asked of the child, where the claim's own words won't do (`childQuestion`). */
  childEn?: string;
}

// One claim per course unit — a passed checkpoint is first-try evidence across
// every step of the unit — plus the expert band, measured by step levels.
// The unit number comes from the course order, so inserting a unit never
// leaves a claim pointing at the wrong number.
const unitClaim = (unitId: string, emoji: string, en: string, childEn?: string): CanDoStatement => ({
  id: unitId,
  emoji,
  en,
  ...(childEn ? { childEn } : {}),
  basisEn: `Unit ${PATH.findIndex((u) => u.id === unitId) + 1} checkpoint passed`,
  requires: [{ unitId }],
});

/** A math stage's claim: its crown won (math in Finnish, Lasketaan!). */
function mathClaim(stageId: string, emoji: string, en: string): CanDoStatement {
  const stage = MATH_STAGES.find((s) => s.id === stageId);
  return { id: stageId, emoji, en, basisEn: `Math: the “${stage?.titleFi ?? stageId}” crown won`, requires: [{ mathStageId: stageId }] };
}

export const CAN_DO: CanDoStatement[] = [
  unitClaim('hello', '👋', 'Can greet people, say thanks and goodbye, and say their name'),
  unitClaim('people', '👉', 'Can name people and things around them, and ask yes/no questions'),
  unitClaim('numbers', '🔢', 'Can count to twelve (and knows why "kaksi kirjaa" ends in -a)'),
  unitClaim('having', '🎒', 'Can say who has what, and who is in their family ("Minulla on täti")'),
  unitClaim('not-having', '🚫', "Can say what they don't have, winter clothes too (Minulla ei ole pipoa)"),
  unitClaim('whose', '🙋', 'Can say whose something is — my, your, his / her (kirjani, kirjasi, kirjansa)'),
  unitClaim('owners', '🚲', "Can say whose something is — isän pyörä (Dad's bike)", "Can you say whose something is, with the owner's name?"),
  unitClaim('doing', '🏃', 'Can use verb types 1–3 with the right "who" ending (laulan, syöt, hän tulee)'),
  unitClaim('doing-kpt', '🔀', 'Can use verbs whose k, p or t changes (nukkua → minä nukun, hän nukkuu)'),
  unitClaim('not-doing', '✋', "Can say what they don't do"),
  unitClaim('asking', '❓', 'Can ask "do you…?" with -ko / -kö and answer with the verb', 'Can you ask a yes-or-no question, and answer one?'),
  unitClaim('feelings', '😄', 'Can say how they feel ("Olen iloinen", "Minulla on nälkä", "Minua jännittää")'),
  unitClaim('likes', '❤️', 'Can say what they like and love (tykkään, pidän, rakastan)'),
  unitClaim('wanting', '🎯', 'Can say what they want to do, can do, and ask "may I…?"', 'Can you say what you want to do and can do, and ask if you may?'),
  unitClaim('verbs-4', '🔓', 'Can use type 4 verbs (haluta → haluan), including ones that get stronger (hypätä → hyppään)'),
  unitClaim('school-day', '🏫', "Can talk about school subjects they like and don't like"),
  unitClaim('play', '🎲', 'Can say what they play, three ways: Leikin nukella, Pelaan jalkapalloa, Soitan pianoa', 'Can you say what you play — with toys, games and music?'),
  unitClaim('seeing', '👀', 'Can say what they see, watch and wait for'),
  unitClaim('shop', '🛒', 'Can buy things in a shop, and count euros (kaksi euroa)'),
  unitClaim('commands', '🫵', "Can say do it, don't, and let's (Juokse! Älä juokse! Juostaan!)"),
  unitClaim('body', '🧑‍✈️', 'Can name their body and follow "Kapteeni käskee" (Kosketa nenää! Nosta käsi ylös!)', 'Can you name your body and play Captain says?'),
  unitClaim('describing', '🎨', 'Can describe things with colors and describing words: new or old, clean or dirty, easy or hard'),
  unitClaim('comparing', '🐘', 'Can compare things — "Norsu on isompi kuin hiiri" — and say which is the biggest'),
  unitClaim('where', '📍', 'Can say where things are (in / on)'),
  unitClaim('moving', '🚶', 'Can say where things go and where they come from'),
  unitClaim('town', '🏙️', 'Can say where they are, where they go and where they come from'),
  unitClaim('school-daycare', '🛎️', 'Can get by at school: Saanko mennä vessaan? Minun täytyy… En ymmärrä — and ask nicely (Haluaisin, Saisinko)', 'Can you ask to go to the restroom, say you don\'t understand, and ask nicely at school?'),
  unitClaim('by-with', '🚌', 'Can say how they travel and what they use — bussilla, kynällä — and who with (kaverin kanssa)', "Can you say how you travel, what you use, and who you're with?"),
  unitClaim('when', '📅', 'Can name the days, say when things happen, and tell the time'),
  unitClaim('my-day', '🌅', 'Can tell their day — Herään kello seitsemältä, Syön aamupalaa — and the half hours (puoli kahdeksan)'),
  unitClaim('weather', '⛅', 'Can say what the weather is like (Sataa lunta, Aurinko paistaa, On kylmä)'),
  unitClaim('nature', '🌲', 'Can name things in nature and say where the animals are (Kala on järvessä, Lintu on puussa)'),
  unitClaim('big-numbers', '💯', 'Can count to twenty and by tens to a hundred, and say first, second, third…'),
  unitClaim('birthdays', '🎂', 'Can name the months, say a date (viides toukokuuta), their age and when their birthday is'),
  unitClaim('finnish-year', '🎄', 'Can talk about Christmas, Easter and Midsummer — Odotan joulua! Menen mökille, saunaan'),
  unitClaim('question-words', '🤔', 'Can ask and answer who, what, where, when, whose and why'),
  unitClaim('me-you', '🫶', 'Can say help me, give it to me, I like you'),
  unitClaim('around', '🧭', "Can say what's in front of, behind, next to or under something"),
  unitClaim('many', '👐', 'Can talk about more than one thing'),
  unitClaim('verbs-5-6', '🧓', 'Can tell all six verb types apart and use types 5 and 6 (tarvitsen, vanhenen)'),
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
  // The math section: a stage's crown is first-try evidence across its games.
  mathClaim('math-plus-minus', '🍎', 'Can add and take away up to ten in Finnish (Kolme plus kaksi on viisi)'),
  mathClaim('math-more-less', '⚖️', 'Can say which number is more or less, and what comes after or before (viiden jälkeen)'),
  mathClaim('math-how-many', '🧺', 'Can work out a little math story told in Finnish (Syön kaksi omenaa…)'),
  mathClaim('math-teens', '🚀', 'Can count to twenty and add up to twenty in Finnish (kymmenen plus kolme on kolmetoista)'),
  mathClaim('math-tens', '🧱', 'Can count in tens to a hundred, and add and take away tens, in Finnish (kaksikymmentä plus kolmekymmentä)'),
  mathClaim('math-times', '🍓', 'Can do small times tables and halves in Finnish (kaksi kertaa kolme, puolet kahdeksasta)'),
  mathClaim('math-shop', '💶', 'Can add up prices and pay the right number of euros (Omena maksaa kaksi euroa)'),
  mathClaim('math-clock', '⏰', 'Can tell the time an hour later or earlier, and half past, in Finnish (tunnin päästä, puoli neljä)'),
];

function met(child: Child, r: CanDoRequirement): boolean {
  if ('unitId' in r) return !!child.course?.checkpoints?.[r.unitId]?.passedAt;
  if ('mathStageId' in r) return !!child.math?.crowns?.[r.mathStageId]?.passedAt;
  // activityLevel defaults to 1 for never-played nodes; require actual play so
  // a fresh child doesn't "meet" a level bar by default.
  const played = !!child.progress?.[r.chapterId]?.[r.skillId];
  return played && activityLevel(child, r.chapterId, r.skillId) >= r.level;
}

/**
 * The claim asked of the child, after a checkpoint ("Can you greet people…?"):
 * the parent-facing English turned to "you", without its Finnish examples (the
 * question is read aloud in English — Finnish is never read in an English
 * voice). A claim whose Finnish is part of the sentence has its own `childEn`.
 * English only — no Finnish is made here.
 */
export function childQuestion(s: CanDoStatement): string {
  if (s.childEn) return s.childEn;
  const body = s.en
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*—[^—]*—/g, '')
    .replace(/\s*—.*$/, '')
    .replace(/^Can /, '')
    .replace(/\btheir\b/g, 'your')
    .replace(/\bthey\b/g, 'you')
    .replace(/\baround them\b/g, 'around you')
    .replace(/[.!:,]$/, '')
    .trim();
  return `Can you ${body}?`;
}

/** The can-do claim a unit's checkpoint backs (one per course unit). */
export function unitClaimFor(unitId: string): CanDoStatement | undefined {
  return CAN_DO.find((s) => s.requires.length === 1 && 'unitId' in s.requires[0] && s.requires[0].unitId === unitId);
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

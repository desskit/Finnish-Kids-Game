import type { Child } from '../state/storage';
import { activityLevel } from './progress';

// Parent "can-do" statements (learning-audit E-17): translate node levels into
// plain-language claims about what the child can DO with Finnish ("Can greet
// and reply", "Can count to 10") — CEFR-style can-do framing scaled way down.
// Pure derivation from the same per-node adaptive levels the dashboard already
// shows; nothing new is recorded and no Finnish is generated (statements are
// parent-facing English meta-text, like the rest of the grown-up dashboard).
//
// Threshold: a node "supports" a statement once its measured level clears the
// requirement — the child has held that level's accuracy across real rounds
// (see applyRound), which is honest evidence, not a one-off lucky streak.

export interface CanDoRequirement {
  chapterId: string;
  skillId: string;
  /** Minimum measured adaptive level on that node. */
  level: number;
}

export interface CanDoStatement {
  id: string;
  emoji: string;
  /** The parent-facing claim, e.g. "Can greet people and reply". */
  en: string;
  /** What the evidence is, shown as the secondary line. */
  basisEn: string;
  /**
   * The node levels that back the claim. `mode: 'all'` (default) needs every
   * requirement met; `'any'` needs one — used where several sibling nodes are
   * each sufficient evidence (e.g. any two vocab themes is handled via 'count').
   */
  requires: CanDoRequirement[];
  mode?: 'all' | 'any' | 'count';
  /** For mode 'count': how many of `requires` must be met. */
  atLeast?: number;
}

// Level meanings, for calibration: L2 = climbed once and held it; L3 = solid in
// the node's core content; a node's max = its whole ladder. Vocab warm-ups run
// to L5, most grammar nodes to L4, count/locatives/capstones to L8.
export const CAN_DO: CanDoStatement[] = [
  {
    id: 'first-words',
    emoji: '🐾',
    en: 'Recognizes their first Finnish words',
    basisEn: 'two vocabulary themes at level 2+',
    requires: [
      { chapterId: 'first-words', skillId: 'listen-animals', level: 2 },
      { chapterId: 'first-words', skillId: 'listen-food', level: 2 },
      { chapterId: 'first-words', skillId: 'listen-family', level: 2 },
      { chapterId: 'first-words', skillId: 'listen-body', level: 2 },
      { chapterId: 'first-words', skillId: 'listen-nature', level: 2 },
      { chapterId: 'first-words', skillId: 'listen-clothes', level: 2 },
      { chapterId: 'first-words', skillId: 'listen-places', level: 2 },
      { chapterId: 'first-words', skillId: 'listen-colors', level: 2 },
      { chapterId: 'first-words', skillId: 'listen-numbers', level: 2 },
    ],
    mode: 'count',
    atLeast: 2,
  },
  {
    id: 'name-things',
    emoji: '🗣️',
    en: 'Can name everyday things in Finnish',
    basisEn: 'a vocabulary theme at level 3+ (production recall)',
    requires: [
      // L3 of the warm-up ramp is `name` — seeing a picture and producing the
      // Finnish, not just recognizing it.
      { chapterId: 'first-words', skillId: 'listen-animals', level: 3 },
      { chapterId: 'first-words', skillId: 'listen-food', level: 3 },
      { chapterId: 'first-words', skillId: 'listen-family', level: 3 },
      { chapterId: 'first-words', skillId: 'listen-body', level: 3 },
      { chapterId: 'first-words', skillId: 'listen-nature', level: 3 },
      { chapterId: 'first-words', skillId: 'listen-clothes', level: 3 },
      { chapterId: 'first-words', skillId: 'listen-places', level: 3 },
    ],
    mode: 'any',
  },
  {
    id: 'greet',
    emoji: '👋',
    en: 'Can greet people and reply politely',
    basisEn: 'Greetings at level 3+',
    requires: [{ chapterId: 'conversations', skillId: 'greetings', level: 3 }],
  },
  {
    id: 'small-talk',
    emoji: '💬',
    en: 'Can hold a short everyday conversation',
    basisEn: 'Small talk at level 3+',
    requires: [{ chapterId: 'conversations', skillId: 'small-talk', level: 3 }],
  },
  {
    id: 'say-what-is',
    emoji: '🧩',
    en: 'Can say what something is ("Tämä on kissa")',
    basisEn: 'This is a… at level 3+',
    requires: [{ chapterId: 'naming', skillId: 'this-is', level: 3 }],
  },
  {
    id: 'answer-yesno',
    emoji: '🤔',
    en: 'Can answer yes/no questions ("Onko tämä…?")',
    basisEn: 'Is this…? at level 3+',
    requires: [{ chapterId: 'naming', skillId: 'is-this', level: 3 }],
  },
  {
    id: 'say-having',
    emoji: '🎒',
    en: 'Can say who has what ("Minulla on…")',
    basisEn: 'I have… at level 3+',
    requires: [{ chapterId: 'naming', skillId: 'i-have', level: 3 }],
  },
  {
    id: 'possessives',
    emoji: '🙋',
    en: 'Can say whose something is (my/your/their + suffix)',
    basisEn: 'Whose? at level 3+',
    requires: [{ chapterId: 'naming', skillId: 'possessives', level: 3 }],
  },
  {
    id: 'likes',
    emoji: '❤️',
    en: 'Can say what they like and see',
    basisEn: 'I like… and I see… at level 3+',
    requires: [
      { chapterId: 'likes', skillId: 'i-like', level: 3 },
      { chapterId: 'likes', skillId: 'i-see', level: 3 },
    ],
  },
  {
    id: 'shop',
    emoji: '🛒',
    en: 'Can use simple shopping phrases ("Ostan…")',
    basisEn: 'Shopping at level 3+',
    requires: [{ chapterId: 'likes', skillId: 'shopping', level: 3 }],
  },
  {
    id: 'count-10',
    emoji: '🔢',
    en: 'Can count things to 10',
    basisEn: 'Count & say at level 3+',
    // difficultyFor(3).maxCount = 10 — the claim tracks the engine's table.
    requires: [{ chapterId: 'numbers-describe', skillId: 'count', level: 3 }],
  },
  {
    id: 'count-20',
    emoji: '💯',
    en: 'Can count things to 20',
    basisEn: 'Count & say at level 8 (the top)',
    // difficultyFor(8).maxCount = 20.
    requires: [{ chapterId: 'numbers-describe', skillId: 'count', level: 8 }],
  },
  {
    id: 'describe',
    emoji: '🎨',
    en: 'Can describe things (big, small, colors…)',
    basisEn: 'Describe it at level 3+',
    requires: [{ chapterId: 'numbers-describe', skillId: 'match', level: 3 }],
  },
  {
    id: 'commands',
    emoji: '🤸',
    en: 'Understands simple commands ("Hyppää!")',
    basisEn: 'Do this! at level 3+',
    requires: [{ chapterId: 'actions', skillId: 'commands', level: 3 }],
  },
  {
    id: 'verbs',
    emoji: '🏃',
    en: 'Can say who does what ("minä syön, sinä syöt")',
    basisEn: 'Verbs (I / you / he) at level 3+',
    requires: [{ chapterId: 'actions', skillId: 'conjugate', level: 3 }],
  },
  {
    id: 'where',
    emoji: '🧭',
    en: 'Can say where things are (in, on, into…)',
    basisEn: 'In, on, into… at level 4+',
    // L4 of the locative ladder = three cases unlocked and held.
    requires: [{ chapterId: 'where', skillId: 'locatives', level: 4 }],
  },
  {
    id: 'read',
    emoji: '📖',
    en: 'Can read and understand a simple sentence',
    basisEn: 'Read a sentence at level 2+',
    requires: [{ chapterId: 'together', skillId: 'reading', level: 2 }],
  },
  {
    id: 'story',
    emoji: '📚',
    en: 'Can follow a little story in Finnish',
    basisEn: 'Story time at level 3+',
    requires: [{ chapterId: 'together', skillId: 'stories', level: 3 }],
  },
  {
    id: 'spell',
    emoji: '⌨️',
    en: 'Can type Finnish words correctly',
    basisEn: 'Spelling at level 3+',
    requires: [{ chapterId: 'together', skillId: 'spell', level: 3 }],
  },
  {
    id: 'sentences',
    emoji: '📝',
    en: 'Can build whole Finnish sentences',
    basisEn: 'Build sentences at level 4+',
    requires: [{ chapterId: 'sentences', skillId: 'full-sentences', level: 4 }],
  },
  // --- The expert band (adult-learner territory) ---
  {
    id: 'verb-tenses',
    emoji: '⏳',
    en: 'Can use past, perfect and conditional verb forms',
    basisEn: 'Verbs (I / you / he) at level 8 (the top)',
    requires: [{ chapterId: 'actions', skillId: 'conjugate', level: 8 }],
  },
  {
    id: 'conversation-expert',
    emoji: '🗣️',
    en: 'Can handle real conversations (directions, phone calls, plans)',
    basisEn: 'Greetings and Small talk at level 6+',
    requires: [
      { chapterId: 'conversations', skillId: 'greetings', level: 6 },
      { chapterId: 'conversations', skillId: 'small-talk', level: 6 },
    ],
  },
  {
    id: 'plural-cases',
    emoji: '🧭',
    en: 'Can use the plural case system (on / into / out of many)',
    basisEn: 'In, on, into… at level 9+',
    requires: [{ chapterId: 'where', skillId: 'locatives', level: 9 }],
  },
  {
    id: 'dictation',
    emoji: '👂',
    en: 'Can write Finnish from hearing it alone',
    basisEn: 'Spelling at level 9+ (audio-only dictation)',
    requires: [{ chapterId: 'together', skillId: 'spell', level: 9 }],
  },
  {
    id: 'spot-errors',
    emoji: '🔎',
    en: 'Can spot a wrong case in a sentence and fix it',
    basisEn: 'Find the mistake at level 5+',
    requires: [{ chapterId: 'together', skillId: 'find-error', level: 5 }],
  },
];

function met(child: Child, r: CanDoRequirement): boolean {
  // activityLevel defaults to 1 for never-played nodes; require actual play so
  // a fresh child doesn't "meet" a level-1 bar by default. (No current bar is
  // below 2, but keep the guard honest.)
  const played = !!child.progress?.[r.chapterId]?.[r.skillId];
  return played && activityLevel(child, r.chapterId, r.skillId) >= r.level;
}

/** Whether the child's measured levels back a statement. */
export function canDoAchieved(child: Child, s: CanDoStatement): boolean {
  const hits = s.requires.filter((r) => met(child, r)).length;
  if (s.mode === 'any') return hits >= 1;
  if (s.mode === 'count') return hits >= (s.atLeast ?? s.requires.length);
  return hits === s.requires.length;
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

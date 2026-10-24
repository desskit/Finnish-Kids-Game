// Persistence layer for profiles + progress.
//
// This module is the ONLY place that touches storage. Today it reads/writes
// localStorage synchronously and migrates the old single-profile key. A future
// cloud backend (e.g. Supabase) implements the same `ProfileStore` shape —
// likely async (Promise-returning), which would add a loading state in the
// provider — without changing any UI call sites.

import type { ItemSchedule } from '../game/srs';
import { isThemeId, type ThemeId } from '../theme/theme';
import { seedFromProgress, type StatsState } from '../game/stats';

export interface ActivityProgress {
  /** How many rounds of this activity were completed. */
  plays: number;
  /** Best single-round score (stars in one play). */
  bestStars: number;
  /** Cumulative stars earned in this activity. */
  totalStars: number;
  /** Cumulative max possible (questions seen) — for an accuracy %. */
  totalPossible: number;
  /** Epoch ms of the last completed round. */
  lastPlayed: number;
  /**
   * Adaptive difficulty level (1..MAX_LEVEL) measured for this activity. Optional
   * so progress written before adaptive difficulty existed still loads; readers
   * default a missing value to level 1. See `src/game/adapt.ts`.
   */
  level?: number;
  /** Rolling per-round accuracy window (0..1) that drives the adaptive level. */
  recent?: number[];
  /**
   * When the child PROVED this activity's top level — reached its `maxLevel`
   * and then cleared the same bar there that a promotion would need. Sticky:
   * a later dip doesn't undo it. A course step counts as done only then.
   */
  topProvenAt?: number;
  /**
   * "Minor" bonus rounds (typing, in later units): played and scored for stars
   * and the Writer achievement, but they never move the level or decide
   * whether the step is done — a small extra challenge, not a roadblock.
   */
  bonus?: { plays: number; right: number; total: number };
}

/** progress[topicId][activityId] — powers map rings, hub state, the dashboard. */
export type Progress = Record<string, Record<string, ActivityProgress>>;

/** srs[itemId] — per-item spaced-repetition state; the attempts log + scheduler. */
export type SrsState = Record<string, ItemSchedule>;

export interface Child {
  id: string;
  name: string;
  /** Emoji avatar: src/art/Avatar.tsx draws its head picture. */
  avatar: string;
  /**
   * The look this player picked (src/theme/theme.ts). Optional + unbackfilled:
   * missing means "follow the device's light or dark setting".
   */
  theme?: ThemeId;
  /**
   * Which kind of reader this player is (src/game/learner.ts): 'younger'
   * (about 6–7) gets short pattern cards read aloud and spoken English help;
   * 'older' (about 8–10) the full lessons. Optional + unbackfilled: missing
   * means 'younger'.
   */
  readerBand?: ReaderBand;
  /**
   * Manual difficulty when `adaptive` is off: 1 = easier, 2 = harder.
   * (Kept for the legacy v1 migration and the manual Easy/Hard override.)
   */
  level: number;
  /**
   * When unset or true, difficulty adapts per-activity from measured accuracy
   * (the default). Set false to pin difficulty to `level`. Optional + unbackfilled
   * so older stored profiles round-trip unchanged; readers treat missing as auto.
   */
  adaptive?: boolean;
  /** Running star total across all activities. */
  stars: number;
  createdAt: number;
  progress: Progress;
  /** Per-item spaced-repetition schedules (attempts + due dates). */
  srs: SrsState;
  /**
   * Local calendar day of the most recent finished round, e.g. "2026-07-09".
   * Optional + unbackfilled so older stored profiles round-trip unchanged
   * (readers treat missing as "never played"). See `src/game/streak.ts`.
   */
  lastPlayedDay?: string;
  /** Consecutive days practiced, including today. Optional (see lastPlayedDay). */
  streakDays?: number;
  /** The longest streak ever reached — streak badges stay earned after a break. */
  bestStreakDays?: number;
  /**
   * Guided-course state (see `src/game/course.ts`): which lessons have been
   * read and which unit checkpoints were passed. Optional + unbackfilled so
   * older stored profiles round-trip (readers treat missing as "nothing yet").
   */
  course?: CourseState;
  /**
   * Practice statistics per subject (course step) and per day, plus the daily
   * warm-up log — see `src/game/stats.ts`. Optional + unbackfilled so older
   * stored profiles round-trip unchanged; readers seed it from `progress`
   * (`statsOf`) until the first new answer writes it.
   */
  stats?: StatsState;
  /**
   * The optional math section (Lasketaan!, see `src/game/mathPath.tsx`): its
   * crowns and the stages the child has seen open. Kept apart from `course`,
   * so math never counts as a unit, a checkpoint or a course badge. Optional +
   * unbackfilled (readers treat missing as "nothing yet").
   */
  math?: MathState;
}

export interface MathState {
  /** stageId → the stage test that wins its crown. */
  crowns?: Record<string, CheckpointRecord>;
  /** stageId → when the child first saw it open (until then the home card says "Uusi!"). */
  seen?: Record<string, number>;
  /** The longest run of right first answers in quick sums (Nopeasti!). */
  quickBest?: number;
  /** Answers said aloud and heard right, in the math games. */
  spoken?: number;
  /** Today's sums (Päivän laskut), done once a day. */
  today?: MathToday;
  /** The child's own animal, while they wear a face won in math (to go back to). */
  animal?: string;
}

export interface MathToday {
  /** The last day they were done ("2026-10-24", local). */
  lastDay: string;
  /** Days in a row, up to lastDay. */
  streak: number;
  /** The longest run of days in a row. */
  best: number;
  /** Days they've been done, in all. */
  days: number;
}

export interface CheckpointRecord {
  /** When the checkpoint was first passed (undefined = attempted, not passed). */
  passedAt?: number;
  /** Best first-try ratio so far, 0..1. */
  best: number;
  attempts: number;
}

export interface CourseState {
  /** lessonId → when it was first read to the end. */
  lessonsSeen?: Record<string, number>;
  /**
   * unitId → when the unit's opener (its story, heard before any practice —
   * see src/game/course.ts) was first listened to the end.
   */
  openersHeard?: Record<string, number>;
  /** unitId → checkpoint record. */
  checkpoints?: Record<string, CheckpointRecord>;
  /**
   * Set phrases the child has been SHOWN before being asked for them:
   * `ex:<exchangeId>` (a greeting pair) and `scene:<sceneId>` (a whole modelled
   * conversation) → when. A phrase is modelled once, then practised.
   */
  phrasesSeen?: Record<string, number>;
  /**
   * The optional Alphabet corner's games (first-letter / length / vowel) —
   * kept apart from the course: they never gate a unit or move a level.
   */
  sounds?: Record<string, { plays: number; right: number; total: number; best: number }>;
  /** storyId → how that story has gone (see `src/game/storyLog.ts`). */
  stories?: Record<string, StoryRecord>;
}

/** One story in a child's story log. */
export interface StoryRecord {
  /** Reads finished (the story, then its questions). */
  reads: number;
  /** The first read with 3 of 4 (or better) right first time: the story is read. */
  goodAt?: number;
  /** The last read's first-try ratio, 0..1 — a weak read brings the English back. */
  last?: number;
  /** The questions asked last time (the next read asks others). */
  asked?: string[];
  /** Every question asked so far (the "Muistatko?" revisit picks new ones). */
  seen?: string[];
  /** When the first "Muistatko?" revisit happened. */
  revisitedAt?: number;
  /** Every "Muistatko?" revisit so far, oldest first (see storyLog.ts: 1, 3 and 7 days). */
  revisits?: number[];
}

export interface Settings {
  /** Silence TTS + reward sounds. */
  muted: boolean;
  /** Force reduced motion even if the OS doesn't request it. */
  reducedMotion: boolean;
  /**
   * Allow the microphone-based speaking game ("Sano se"). Default on where the
   * browser supports recognition; a grown-up can switch it off here. Optional +
   * unbackfilled so older stored settings round-trip (readers treat missing as
   * enabled — see DEFAULT_SETTINGS).
   */
  speakingEnabled?: boolean;
  /**
   * Grown-up override: open every course unit regardless of checkpoints (to
   * jump ahead, or to preview). Optional; missing = off.
   */
  unlockAll?: boolean;
  /**
   * The math section's quick sums (Nopeasti!) without a clock: every question
   * waits as long as it takes. Optional; missing = timed.
   */
  mathUntimed?: boolean;
  /**
   * How much English shows beside Finnish lines (scenes, dialogues, choices):
   * 'always' as before, 'fade' (the default) once a step's first level is
   * passed, 'off' never — each line keeps a tap to see it. Optional; missing
   * = 'fade'. A drill's own task (the sentence to build) stays in English.
   */
  englishHelp?: EnglishHelp;
}

export type ReaderBand = 'younger' | 'older';
export type EnglishHelp = 'always' | 'fade' | 'off';

/** One native reviewer's verdict on one authored-Finnish entry (Grown-ups → Finnish check). */
export interface ReviewDecision {
  status: 'ok' | 'fix';
  /** The Finnish as it read when reviewed — if it changes later, the decision lapses. */
  fi: string;
  /** What's wrong (for 'fix'). */
  note?: string;
  /** How it should read. */
  suggestion?: string;
  /** Epoch ms of the decision. */
  at: number;
}

/** The in-app review on this device (not per player — it's about the app's Finnish). */
export interface ReviewState {
  reviewer?: string;
  /** entry key (game/reviewEntries.ts) → decision. */
  decisions: Record<string, ReviewDecision>;
}

export interface ProfilesData {
  version: 2;
  children: Child[];
  activeId: string | null;
  settings: Settings;
  /**
   * The native reviewer's in-app Finnish check. Optional + unbackfilled, so
   * older stores round-trip unchanged.
   */
  review?: ReviewState;
}

export const DEFAULT_SETTINGS: Settings = {
  muted: false,
  reducedMotion: false,
  speakingEnabled: true,
};

/** Avatar palette offered when adding a child. */
export const AVATARS = [
  '🦊', '🦉', '🐻', '🐱', '🐶', '🐰',
  '🐸', '🐼', '🦁', '🐯', '🐨', '🐧',
];

export function emptyProfiles(): ProfilesData {
  return { version: 2, children: [], activeId: null, settings: { ...DEFAULT_SETTINGS } };
}

/**
 * A throwaway in-memory profile for the grown-up Audit harness: one dummy child
 * so the real games can run and record stars/SRS WITHOUT ever touching the
 * family's saved profiles. Used with `<ProfileProvider ephemeral>` (which never
 * persists), so nothing here reaches localStorage.
 */
export function sandboxProfiles(): ProfilesData {
  return {
    version: 2,
    children: [
      {
        id: 'audit-sandbox',
        name: 'Audit',
        avatar: '🧪',
        level: 1,
        adaptive: true,
        stars: 0,
        createdAt: 0,
        progress: {},
        srs: {},
      },
    ],
    activeId: 'audit-sandbox',
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to a non-crypto id */
  }
  return 'c-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const V2_KEY = 'fkg.profiles.v2';
const V1_KEY = 'fkg.profile.v1';

interface ProfileV1 {
  name: string;
  level: number;
  stars: number;
}

/** Fold the legacy single profile into one Child so no progress is lost. */
function migrateV1(v1: Partial<ProfileV1>): ProfilesData {
  const child: Child = {
    id: newId(),
    name: typeof v1.name === 'string' ? v1.name : '',
    avatar: AVATARS[0],
    level: v1.level === 2 ? 2 : 1,
    stars: typeof v1.stars === 'number' ? v1.stars : 0,
    createdAt: Date.now(),
    progress: {},
    srs: {},
  };
  return { version: 2, children: [child], activeId: child.id, settings: { ...DEFAULT_SETTINGS } };
}

/** Repair anything inconsistent (e.g. an activeId pointing at a removed child). */
function sanitize(data: ProfilesData): ProfilesData {
  const rawChildren = Array.isArray(data.children) ? data.children : [];
  // Backfill fields added in later versions so older stored profiles keep
  // working (per the graceful-migration convention).
  const children = rawChildren.map((c) => {
    const { theme, ...rest } = c;
    return {
      ...rest,
      progress: c.progress ?? {},
      srs: c.srs ?? {},
      // Stats from what was played before stats existed, seeded once on load:
      // seeded later, on the next game, they would count that game twice.
      stats: c.stats ?? seedFromProgress(c.progress),
      // a look we don't know (an older or edited file) falls back to the device's
      ...(isThemeId(theme) ? { theme } : {}),
    };
  });
  const ids = new Set(children.map((c) => c.id));
  const activeId =
    data.activeId && ids.has(data.activeId) ? data.activeId : children[0]?.id ?? null;
  const review =
    data.review && typeof data.review === 'object' && data.review.decisions && typeof data.review.decisions === 'object'
      ? { review: data.review }
      : {};
  return {
    version: 2,
    children,
    activeId,
    settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
    ...review,
  };
}

function load(): ProfilesData {
  try {
    const rawV2 = localStorage.getItem(V2_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as ProfilesData;
      if (parsed && parsed.version === 2 && Array.isArray(parsed.children)) {
        return sanitize(parsed);
      }
    }
    const rawV1 = localStorage.getItem(V1_KEY);
    if (rawV1) {
      const migrated = migrateV1(JSON.parse(rawV1) as Partial<ProfileV1>);
      // Persist the migration (keep v1 as a backup) so it only happens once.
      try {
        localStorage.setItem(V2_KEY, JSON.stringify(migrated));
      } catch {
        /* ignore */
      }
      return migrated;
    }
  } catch {
    /* ignore corrupt/unavailable storage */
  }
  return emptyProfiles();
}

function save(data: ProfilesData): void {
  try {
    localStorage.setItem(V2_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export interface ProfileStore {
  load(): ProfilesData;
  save(data: ProfilesData): void;
}

/** The active store. Swap this for a remote-backed store (Supabase) later. */
export const localProfileStore: ProfileStore = { load, save };

// --- Backup / restore (grown-up Settings) --------------------------------------
//
// Everything lives in this browser only, so a grown-up can save a backup file
// and restore it (after clearing site data, or on a new device). Restore
// validates the file first and repairs it through `sanitize`, so a bad file can
// never leave the app in a broken state.

/** The current data as a pretty JSON backup file. */
export function exportBackup(data: ProfilesData): string {
  return JSON.stringify({ app: 'finnish-kids-game', savedAt: new Date().toISOString(), ...data }, null, 2);
}

/** Parse a backup file; returns the repaired data, or null if it isn't one. */
export function parseBackup(text: string): ProfilesData | null {
  try {
    const parsed = JSON.parse(text) as Partial<ProfilesData>;
    if (!parsed || parsed.version !== 2 || !Array.isArray(parsed.children)) return null;
    const ok = parsed.children.every(
      (c) => c && typeof c.id === 'string' && typeof c.name === 'string' && typeof c.stars === 'number',
    );
    return ok ? sanitize(parsed as ProfilesData) : null;
  } catch {
    return null;
  }
}

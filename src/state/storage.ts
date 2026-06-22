// Persistence layer for profiles + progress.
//
// This module is the ONLY place that touches storage. Today it reads/writes
// localStorage synchronously and migrates the old single-profile key. A future
// cloud backend (e.g. Supabase) implements the same `ProfileStore` shape —
// likely async (Promise-returning), which would add a loading state in the
// provider — without changing any UI call sites.

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
}

/** progress[topicId][activityId] — powers map rings, hub state, the dashboard. */
export type Progress = Record<string, Record<string, ActivityProgress>>;

export interface Child {
  id: string;
  name: string;
  /** Emoji avatar (a "mascot variant" until Phase 1 art lands). */
  avatar: string;
  /** 1 = easier (fewer choices), 2 = harder (more choices). */
  level: number;
  /** Running star total across all activities. */
  stars: number;
  createdAt: number;
  progress: Progress;
}

export interface Settings {
  /** Silence TTS + reward sounds. */
  muted: boolean;
  /** Force reduced motion even if the OS doesn't request it. */
  reducedMotion: boolean;
}

export interface ProfilesData {
  version: 2;
  children: Child[];
  activeId: string | null;
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = { muted: false, reducedMotion: false };

/** Avatar palette offered when adding a child. */
export const AVATARS = [
  '🦊', '🦉', '🐻', '🐱', '🐶', '🐰',
  '🐸', '🐼', '🦁', '🐯', '🐨', '🐧',
];

export function emptyProfiles(): ProfilesData {
  return { version: 2, children: [], activeId: null, settings: { ...DEFAULT_SETTINGS } };
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
  };
  return { version: 2, children: [child], activeId: child.id, settings: { ...DEFAULT_SETTINGS } };
}

/** Repair anything inconsistent (e.g. an activeId pointing at a removed child). */
function sanitize(data: ProfilesData): ProfilesData {
  const children = Array.isArray(data.children) ? data.children : [];
  const ids = new Set(children.map((c) => c.id));
  const activeId =
    data.activeId && ids.has(data.activeId) ? data.activeId : children[0]?.id ?? null;
  return {
    version: 2,
    children,
    activeId,
    settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
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

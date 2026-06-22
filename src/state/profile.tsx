import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  AVATARS,
  emptyProfiles,
  localProfileStore,
  newId,
  type Child,
  type ProfilesData,
  type Settings,
} from './storage';
import { setMuted } from '../audio/mute';
import { review } from '../game/srs';
import { recordRoundOnChild } from '../game/progress';
import { difficultyFor, type Difficulty } from '../game/adapt';

// Multi-child local profiles + per-topic progress + device settings. No
// accounts, no server — persisted to localStorage via `storage.ts` (the seam a
// future Supabase backend slots into). The legacy single profile (`fkg.profile.v1`)
// is migrated into one child on first load.
//
// Activities still call the same `level` / `stars` / `addStars` API — those now
// read/write the *active* child.

export type { Child, ActivityProgress, Settings } from './storage';

interface ProfileContextValue {
  // --- Active-child conveniences (kept stable for existing call sites) ---
  name: string;
  level: number;
  stars: number;
  /** Rename the active child. */
  setName: (name: string) => void;
  /** Set the active child's manual difficulty level (and switch off auto). */
  setLevel: (level: number) => void;
  /** Whether the active child's difficulty adapts automatically (default true). */
  adaptive: boolean;
  /** Turn adaptive difficulty on (auto) or off (manual `level`). */
  setAdaptive: (on: boolean) => void;
  /**
   * The difficulty levers an activity should use right now — adaptive per
   * (topic, activity) when auto, or the pinned manual level otherwise.
   */
  activityDifficulty: (topicId: string, activityId: string) => Difficulty;
  /** Add stars to the active child. */
  addStars: (n: number) => void;

  // --- Multi-child ---
  children: Child[];
  activeChild: Child | null;
  activeId: string | null;
  /** Create a child and make it active; returns the new id. */
  addChild: (name: string, avatar?: string) => string;
  switchChild: (id: string) => void;
  renameChild: (id: string, name: string) => void;
  removeChild: (id: string) => void;

  // --- Progress ---
  /** Record a finished round for the active child (per topic + activity). */
  recordRound: (topicId: string, activityId: string, stars: number, total: number) => void;
  /** Record one answer to a single item for the active child (drives SRS). */
  recordAttempt: (itemId: string, correct: boolean) => void;

  // --- Settings (device-wide) ---
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;

  // --- Danger zone ---
  resetAll: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProfilesData>(() => localProfileStore.load());

  // Persist on every change.
  useEffect(() => {
    localProfileStore.save(data);
  }, [data]);

  // Bridge settings into the imperative world (audio modules + a root class).
  useEffect(() => {
    setMuted(data.settings.muted);
  }, [data.settings.muted]);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.reducedMotion = data.settings.reducedMotion
        ? 'true'
        : 'false';
    }
  }, [data.settings.reducedMotion]);

  const value = useMemo<ProfileContextValue>(() => {
    const active = data.children.find((c) => c.id === data.activeId) ?? null;

    const updateActive = (fn: (c: Child) => Child) =>
      setData((d) =>
        d.activeId
          ? { ...d, children: d.children.map((c) => (c.id === d.activeId ? fn(c) : c)) }
          : d,
      );

    return {
      name: active?.name ?? '',
      level: active?.level ?? 1,
      stars: active?.stars ?? 0,
      setName: (name) => updateActive((c) => ({ ...c, name: name.trim() || c.name })),
      // Picking a manual level pins difficulty (turns auto off).
      setLevel: (level) => updateActive((c) => ({ ...c, level, adaptive: false })),
      adaptive: active ? active.adaptive !== false : true,
      setAdaptive: (on) => updateActive((c) => ({ ...c, adaptive: on })),
      activityDifficulty: (topicId, activityId) => {
        if (!active) return difficultyFor(1);
        // Manual: Easy pins level 1, Hard pins the top level.
        if (active.adaptive === false) return difficultyFor(active.level >= 2 ? 3 : 1);
        // Auto: use the level measured for this specific activity.
        return difficultyFor(active.progress[topicId]?.[activityId]?.level ?? 1);
      },
      addStars: (n) => updateActive((c) => ({ ...c, stars: c.stars + n })),

      children: data.children,
      activeChild: active,
      activeId: data.activeId,

      addChild: (name, avatar) => {
        const id = newId();
        const child: Child = {
          id,
          name: name.trim() || 'Pelaaja',
          avatar: avatar || AVATARS[data.children.length % AVATARS.length],
          level: 1,
          adaptive: true,
          stars: 0,
          createdAt: Date.now(),
          progress: {},
          srs: {},
        };
        setData((d) => ({ ...d, children: [...d.children, child], activeId: id }));
        return id;
      },
      switchChild: (id) =>
        setData((d) => (d.children.some((c) => c.id === id) ? { ...d, activeId: id } : d)),
      renameChild: (id, name) =>
        setData((d) => ({
          ...d,
          children: d.children.map((c) =>
            c.id === id ? { ...c, name: name.trim() || c.name } : c,
          ),
        })),
      removeChild: (id) =>
        setData((d) => {
          const remaining = d.children.filter((c) => c.id !== id);
          const activeId = d.activeId === id ? remaining[0]?.id ?? null : d.activeId;
          return { ...d, children: remaining, activeId };
        }),

      recordAttempt: (itemId, correct) =>
        updateActive((c) => ({
          ...c,
          srs: { ...c.srs, [itemId]: review(c.srs[itemId], correct, Date.now()) },
        })),

      recordRound: (topicId, activityId, stars, total) =>
        updateActive((c) => recordRoundOnChild(c, topicId, activityId, stars, total)),

      settings: data.settings,
      updateSettings: (patch) =>
        setData((d) => ({ ...d, settings: { ...d.settings, ...patch } })),

      resetAll: () => setData(emptyProfiles()),
    };
  }, [data]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}

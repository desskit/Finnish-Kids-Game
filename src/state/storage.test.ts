import { describe, it, expect, beforeEach } from 'vitest';
import {
  localProfileStore,
  emptyProfiles,
  newId,
  AVATARS,
  UNREADABLE_KEY,
  type ProfilesData,
} from './storage';
import { emptyStats } from '../game/stats';

const V2_KEY = 'fkg.profiles.v2';
const V1_KEY = 'fkg.profile.v1';

beforeEach(() => {
  localStorage.clear();
});

describe('emptyProfiles', () => {
  it('is an empty v2 store with default settings', () => {
    const e = emptyProfiles();
    expect(e.version).toBe(2);
    expect(e.children).toEqual([]);
    expect(e.activeId).toBeNull();
    expect(e.settings).toEqual({ muted: false, reducedMotion: false, speakingEnabled: true });
  });

  it('returns a fresh settings object each call (no shared mutation)', () => {
    expect(emptyProfiles().settings).not.toBe(emptyProfiles().settings);
  });
});

describe('newId', () => {
  it('produces unique, non-empty strings', () => {
    const ids = new Set(Array.from({ length: 200 }, () => newId()));
    expect(ids.size).toBe(200);
    ids.forEach((id) => expect(id.length).toBeGreaterThan(0));
  });
});

describe('localProfileStore', () => {
  it('returns empty profiles when storage is blank', () => {
    expect(localProfileStore.load()).toEqual(emptyProfiles());
  });

  it('round-trips a saved store', () => {
    const data: ProfilesData = {
      version: 2,
      children: [
        {
          id: 'a',
          name: 'Aino',
          avatar: '🦊',
          level: 2,
          stars: 7,
          createdAt: 1,
          progress: {},
          srs: {},
          stats: emptyStats(),
        },
      ],
      activeId: 'a',
      settings: { muted: true, reducedMotion: false, speakingEnabled: true },
    };
    localProfileStore.save(data);
    expect(localProfileStore.load()).toEqual(data);
  });

  it('turns the old device-wide "unlock all units" into each player\'s own', () => {
    const kid = (id: string) => ({ id, name: id, avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {}, stats: emptyStats() });
    localProfileStore.save({
      version: 2,
      children: [kid('a'), kid('b')],
      activeId: 'a',
      settings: { muted: false, reducedMotion: false, unlockAll: true },
    });
    const loaded = localProfileStore.load();
    expect(loaded.children.map((c) => c.unlockAll)).toEqual([true, true]);
    expect(loaded.settings.unlockAll).toBeUndefined();
    // Saved again, it stays per player: one can go back to "in order".
    localProfileStore.save({ ...loaded, children: [{ ...loaded.children[0], unlockAll: undefined }, loaded.children[1]] });
    expect(localProfileStore.load().children.map((c) => !!c.unlockAll)).toEqual([false, true]);
  });

  it('gives a player from before stats existed their stats as it loads them, once', () => {
    const played = { plays: 1, bestStars: 5, totalStars: 5, totalPossible: 6, lastPlayed: 1, level: 1 };
    localProfileStore.save({
      version: 2,
      children: [{ id: 'a', name: 'Aino', avatar: '🦊', level: 1, stars: 5, createdAt: 1, progress: { hello: { greetings: played } }, srs: {} }],
      activeId: 'a',
      settings: { muted: false, reducedMotion: false },
    });
    // seeded now, from what was played: not later, when the next game would be counted twice
    expect(localProfileStore.load().children[0].stats?.subjects.greetings).toMatchObject({ n: 6, right: 5 });
  });

  it("keeps a player's look, and drops one it doesn't know", () => {
    localStorage.setItem(
      V2_KEY,
      JSON.stringify({
        version: 2,
        children: [
          { id: 'a', name: 'Aino', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {}, theme: 'pink' },
          { id: 'b', name: 'Eero', avatar: '🐻', level: 1, stars: 0, createdAt: 2, progress: {}, srs: {}, theme: 'neon' },
          { id: 'c', name: 'Leo', avatar: '🐼', level: 1, stars: 0, createdAt: 3, progress: {}, srs: {} },
        ],
        activeId: 'a',
        settings: { muted: false, reducedMotion: false },
      }),
    );
    const [aino, eero, leo] = localProfileStore.load().children;
    expect(aino.theme).toBe('pink');
    expect(eero).not.toHaveProperty('theme');
    expect(leo).not.toHaveProperty('theme');
  });

  it('backfills a missing per-child srs map for older v2 profiles', () => {
    localStorage.setItem(
      V2_KEY,
      JSON.stringify({
        version: 2,
        children: [{ id: 'a', name: 'Aino', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {} }],
        activeId: 'a',
        settings: { muted: false, reducedMotion: false },
      }),
    );
    expect(localProfileStore.load().children[0].srs).toEqual({});
  });

  it('migrates a legacy v1 profile into a single active child', () => {
    localStorage.setItem(V1_KEY, JSON.stringify({ name: 'Veikko', level: 2, stars: 12 }));
    const loaded = localProfileStore.load();

    expect(loaded.version).toBe(2);
    expect(loaded.children).toHaveLength(1);
    expect(loaded.children[0]).toMatchObject({
      name: 'Veikko',
      level: 2,
      stars: 12,
      avatar: AVATARS[0],
    });
    expect(loaded.activeId).toBe(loaded.children[0].id);
    // the migration is persisted under the v2 key so it only happens once...
    expect(localStorage.getItem(V2_KEY)).toBeTruthy();
    // ...and the v1 record is kept as a backup.
    expect(localStorage.getItem(V1_KEY)).toBeTruthy();
  });

  it('clamps an unknown legacy level down to 1', () => {
    localStorage.setItem(V1_KEY, JSON.stringify({ name: 'X', level: 9, stars: 0 }));
    expect(localProfileStore.load().children[0].level).toBe(1);
  });

  it('repairs an activeId that points at a removed child', () => {
    const data: ProfilesData = {
      version: 2,
      children: [
        {
          id: 'b',
          name: 'B',
          avatar: '🐻',
          level: 1,
          stars: 0,
          createdAt: 1,
          progress: {},
        },
      ],
      activeId: 'gone',
      settings: { muted: false, reducedMotion: false },
    };
    localStorage.setItem(V2_KEY, JSON.stringify(data));
    expect(localProfileStore.load().activeId).toBe('b');
  });

  it('falls back to empty profiles on corrupt JSON, keeping the old save aside', () => {
    localStorage.setItem(V2_KEY, '{not valid json');
    expect(localProfileStore.load()).toEqual(emptyProfiles());
    expect(localStorage.getItem(UNREADABLE_KEY)).toBe('{not valid json');
  });

  it('keeps a save it cannot read (a newer version) aside instead of losing it', () => {
    const newer = JSON.stringify({ version: 3, players: [{ id: 'a' }] });
    localStorage.setItem(V2_KEY, newer);
    expect(localProfileStore.load()).toEqual(emptyProfiles());
    expect(localStorage.getItem(UNREADABLE_KEY)).toBe(newer);
    // starting afresh (which saves) never overwrites what was set aside
    localProfileStore.save(emptyProfiles());
    localStorage.setItem(V2_KEY, '{also broken');
    localProfileStore.load();
    expect(localStorage.getItem(UNREADABLE_KEY)).toBe(newer);
  });

  it('drops one damaged player without losing the others, and mends what it can', () => {
    const now = Date.now();
    localStorage.setItem(
      V2_KEY,
      JSON.stringify({
        version: 2,
        activeId: 'a',
        settings: { muted: false, reducedMotion: false },
        children: [
          null,
          'junk',
          {
            id: 'a',
            name: 'Aino',
            avatar: 7,
            level: 1,
            stars: 'many',
            createdAt: 1,
            progress: { hello: { greetings: null, introduce: { level: 2 } }, people: 'x' },
            srs: { kissa: null, koira: { box: 2, due: now } },
            stats: { v: 1, subjects: { greetings: null, introduce: { n: 1, right: 1, days: { '2026-10-28': null }, first: 1, last: 1 } }, days: [], warmups: 'x' },
            course: { checkpoints: { hello: null }, lessonsSeen: 'x', stories: { s: 4 } },
          },
          { name: 'No id', avatar: '🐻', level: 1, stars: 0, createdAt: 2, progress: {}, srs: {} },
        ],
      }),
    );
    const data = localProfileStore.load();
    expect(data.children.map((c) => c.name)).toEqual(['Aino', 'No id']);
    expect(data.children[1].id).toEqual(expect.any(String));
    expect(data.children[1].id).not.toBe('');
    const a = data.children[0];
    expect(a.avatar).toBe(AVATARS[0]);
    expect(a.stars).toBe(0);
    expect(a.progress).toEqual({ hello: { introduce: { level: 2 } } });
    expect(Object.keys(a.srs)).toEqual(['koira']);
    expect(Object.keys(a.stats!.subjects)).toEqual(['introduce']);
    expect(a.stats!.subjects.introduce.days).toEqual({});
    expect(a.stats!.days).toEqual({});
    expect(a.stats!.warmups).toBeUndefined();
    expect(a.course).toEqual({ checkpoints: {}, stories: {} });
  });

  it('backfills missing settings with defaults', () => {
    localStorage.setItem(
      V2_KEY,
      JSON.stringify({ version: 2, children: [], activeId: null }),
    );
    expect(localProfileStore.load().settings).toEqual({
      muted: false,
      reducedMotion: false,
      speakingEnabled: true,
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import {
  localProfileStore,
  emptyProfiles,
  newId,
  AVATARS,
  type ProfilesData,
} from './storage';

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
    expect(e.settings).toEqual({ muted: false, reducedMotion: false });
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
        },
      ],
      activeId: 'a',
      settings: { muted: true, reducedMotion: false },
    };
    localProfileStore.save(data);
    expect(localProfileStore.load()).toEqual(data);
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

  it('falls back to empty profiles on corrupt JSON', () => {
    localStorage.setItem(V2_KEY, '{not valid json');
    expect(localProfileStore.load()).toEqual(emptyProfiles());
  });

  it('backfills missing settings with defaults', () => {
    localStorage.setItem(
      V2_KEY,
      JSON.stringify({ version: 2, children: [], activeId: null }),
    );
    expect(localProfileStore.load().settings).toEqual({
      muted: false,
      reducedMotion: false,
    });
  });
});

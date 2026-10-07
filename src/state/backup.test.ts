import { describe, it, expect } from 'vitest';
import { exportBackup, parseBackup, type ProfilesData } from './storage';

const data: ProfilesData = {
  version: 2,
  children: [
    { id: 'a', name: 'Aino', avatar: '🦊', level: 1, stars: 40, createdAt: 1, progress: {}, srs: {} },
  ],
  activeId: 'a',
  settings: { muted: false, reducedMotion: false },
};

describe('backup / restore', () => {
  it('round-trips a backup file', () => {
    const back = parseBackup(exportBackup(data))!;
    expect(back.children[0].name).toBe('Aino');
    expect(back.activeId).toBe('a');
  });

  it('rejects anything that is not a backup from this app — so nothing is overwritten', () => {
    expect(parseBackup('not json')).toBeNull();
    expect(parseBackup('{"version":1,"children":[]}')).toBeNull();
    expect(parseBackup('{"version":2,"children":[{"name":"x"}]}')).toBeNull();
  });

  it('repairs a backup on the way in (e.g. a missing active player)', () => {
    const back = parseBackup(JSON.stringify({ ...data, activeId: 'gone' }))!;
    expect(back.activeId).toBe('a');
  });
});

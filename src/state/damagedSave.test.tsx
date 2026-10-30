import { describe, it, expect, vi } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../audio/speak', () => ({
  speak: vi.fn(),
  speakEnglish: vi.fn(),
  stopSpeaking: vi.fn(),
  isSpeechAvailable: () => true,
  hasFinnishVoice: () => true,
}));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import { AppRoutes } from '../App';
import { ProfileProvider } from './profile';
import CrashScreen from '../components/CrashScreen';
import { UNREADABLE_KEY } from './storage';

// A save is only ever written by the app, but a restored backup, a half-written
// save or a newer version's save can still hold something unexpected. Break
// every field of a well-played save in turn and open a screen with it: nothing
// may crash, and no player may be lost (a save the app can't read at all is
// set aside, never overwritten).

const now = Date.now();
const save = () => ({
  version: 2,
  activeId: 'k',
  settings: { muted: true, reducedMotion: true, englishHelp: 'fade', together: true },
  children: [
    {
      id: 'k', name: 'Aino', avatar: '🦊', level: 1, stars: 40, createdAt: 1, readerBand: 'older', theme: 'night',
      progress: {
        hello: { greetings: { level: 3, plays: 9, recent: [1, 0.8], totalStars: 30, totalPossible: 36, lastPlayed: now - 1e8 } },
        people: { 'people-words': { level: 2, plays: 4, recent: [0.5], totalStars: 10, totalPossible: 24, lastPlayed: now - 1e7 } },
      },
      srs: {
        kissa: { box: 2, due: now - 1000, correct: 3, wrong: 1, lastSeenAt: now - 1e8, firstSeenAt: now - 2e8 },
        'con:greetings': { box: 4, due: now + 1e9, correct: 8, wrong: 0, lastSeenAt: now - 1e8 },
      },
      heard: { kissa: 7 }, lastPlayedDay: '2026-10-28', streakDays: 3, bestStreakDays: 5,
      course: {
        lessonsSeen: { 'no-articles': now - 1e9 }, openersHeard: { hello: 1, people: 2 },
        checkpoints: { hello: { passedAt: 5, best: 0.9, attempts: 1 } }, phrasesSeen: { 'ex:hei': 1 },
        stories: { 'hello-story': { reads: 2, goodAt: 3, last: 0.75, asked: ['a'], seen: ['a', 'b'], revisits: [4] } },
        selfCheck: { hello: { answer: 'bit', at: 4 } }, sounds: { length: { plays: 1, right: 3, total: 4, best: 0.75 } },
      },
      stats: {
        v: 1, days: { '2026-10-28': { n: 6, right: 5 } }, warmups: [],
        subjects: { greetings: { n: 36, right: 30, days: { '2026-10-28': { n: 6, right: 5 } }, first: 1, last: 2 } },
      },
      math: { crowns: { s1: { passedAt: 1, best: 1, attempts: 1 } }, seen: { s1: 1 }, today: { lastDay: '2026-10-28', streak: 1, best: 2, days: 3 } },
    },
    { id: 'j', name: 'Eero', avatar: '🐻', level: 1, stars: 0, createdAt: 2, progress: {}, srs: {} },
  ],
});

function paths(o: unknown, pre: string[] = [], out: string[][] = []): string[][] {
  if (o && typeof o === 'object') {
    for (const k of Object.keys(o)) {
      out.push([...pre, k]);
      paths((o as Record<string, unknown>)[k], [...pre, k], out);
    }
  }
  return out;
}

const JUNK = [null, 'x', 0, [], {}];
const SCREENS = ['/', '/skill/greetings', '/notebook', '/achievements', '/grown-up', '/math', '/warmup', '/review', '/sounds', '/checkpoint/hello'];

describe('a damaged save', () => {
  it('never crashes a screen or loses a player', () => {
    const failures: string[] = [];
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    let n = 0;
    for (const path of paths(save())) {
      for (const junk of JUNK) {
        const data = save() as Record<string, any>;
        let at = data;
        for (const k of path.slice(0, -1)) at = at[k];
        at[path[path.length - 1]] = junk;
        const raw = JSON.stringify(data);
        const route = SCREENS[n++ % SCREENS.length];
        localStorage.clear();
        localStorage.setItem('fkg.profiles.v2', raw);
        const where = `${path.join('.')} = ${JSON.stringify(junk)} on ${route}`;
        try {
          render(
            <ProfileProvider>
              <MemoryRouter initialEntries={[route]}>
                <AppRoutes />
              </MemoryRouter>
            </ProfileProvider>,
          );
          const kids = (data.children as unknown[]) ?? [];
          const players = Array.isArray(kids) ? kids.filter((c) => c && typeof c === 'object' && !Array.isArray(c)).length : 0;
          const kept = JSON.parse(localStorage.getItem('fkg.profiles.v2') ?? '{}').children?.length ?? 0;
          if (kept < players && localStorage.getItem(UNREADABLE_KEY) !== raw) failures.push(`${where}: lost players`);
        } catch (e) {
          failures.push(`${where}: ${(e as Error).message.split('\n')[0]}`);
        }
        cleanup();
      }
    }
    quiet.mockRestore();
    expect(failures).toEqual([]);
  }, 120_000);
});

describe('CrashScreen', () => {
  it('shows a way home instead of a blank page when a screen throws', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Boom = () => {
      throw new Error('boom');
    };
    render(
      <CrashScreen>
        <Boom />
      </CrashScreen>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back home/ })).toBeInTheDocument();
    quiet.mockRestore();
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { LexicalItem } from './content/types';

// Deterministic listen round for the continuous-session test: the same target
// every question so the test always knows which card is correct.
const fx = vi.hoisted(() => {
  const mk = (id: string, fi: string, emoji: string): LexicalItem => ({
    id,
    fi,
    en: id,
    emoji,
    tier: 1,
    inflections: { nominative_singular: fi },
  });
  return { TARGET: mk('cat', 'kissa', '🐱'), WRONG: mk('dog', 'koira', '🐶') };
});

vi.mock('./game/round', async (importOriginal) => {
  const real = await importOriginal<typeof import('./game/round')>();
  return {
    ...real,
    buildListenRound: () =>
      Array.from({ length: 6 }, () => ({
        target: fx.TARGET,
        options: [fx.TARGET, fx.WRONG],
      })),
  };
});
vi.mock('./audio/speak', () => ({
  speak: vi.fn(),
  speakEnglish: vi.fn(),
  isSpeechAvailable: () => true,
}));
vi.mock('./audio/sfx', () => ({ playDing: vi.fn() }));

import { AppRoutes } from './App';
import ProgressView from './components/ProgressView';
import { ProfileProvider } from './state/profile';

// Integration tests for the guided-course shell (home → lesson → step →
// checkpoint) and the progression UI on top of it (badges, step levels, the
// dashboard). jsdom has no Web Speech/Audio; audio modules are mocked.

function seedChild(
  progress: Record<string, unknown> = {},
  srs: Record<string, unknown> = {},
  course: Record<string, unknown> = {},
) {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [
        {
          id: 'k',
          name: 'Aino',
          avatar: '🦊',
          level: 1,
          adaptive: true,
          stars: 30,
          createdAt: 1,
          progress,
          srs,
          course,
        },
      ],
      activeId: 'k',
      settings: { muted: false, reducedMotion: false },
    }),
  );
}

function renderAt(path: string) {
  return render(
    <ProfileProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </ProfileProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

const lvl = (level: number) => ({
  plays: 3,
  bestStars: 6,
  totalStars: 16,
  totalPossible: 18,
  lastPlayed: 1,
  level,
  recent: [] as number[],
});
/** A step whose TOP level has been proven — the only thing that counts as done. */
const proven = (level: number) => ({ ...lvl(level), topProvenAt: 1 });

describe('course home', () => {
  it('starts a new child on unit 1: Continue → its lesson, later units locked', () => {
    seedChild();
    renderAt('/');
    expect(screen.getByRole('heading', { name: /Hei, Aino/i })).toBeInTheDocument();
    const cont = screen.getByRole('link', { name: /Continue/ });
    expect(cont.getAttribute('href')).toBe('/lesson/sounds');
    expect(cont.textContent).toMatch(/Unit 1 · Lesson/);
    const units = document.querySelectorAll('.unit');
    expect(units).toHaveLength(24);
    expect(units[0].className).toContain('unit--current');
    expect(units[1].className).toContain('unit--locked');
    // Review + Notebook entries, badges; no "Today's adventure" any more.
    expect(screen.getByRole('link', { name: /Review/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Notebook/ })).toBeInTheDocument();
    expect(document.querySelector('.badge-strip')).not.toBeNull();
    expect(screen.queryByText(/Today's adventure/i)).not.toBeInTheDocument();
  });

  it("locks a unit's practice until its lesson is read, and the checkpoint until every step is done", () => {
    seedChild();
    renderAt('/');
    // Unit 1 expanded: lesson link + locked steps + locked checkpoint.
    expect(document.querySelectorAll('.unit--current .unit-step--locked').length).toBeGreaterThanOrEqual(3);
  });

  it('ticks finished steps and opens the checkpoint once all are done', () => {
    seedChild(
      { 'hello': { greetings: proven(3), introduce: proven(3), 'hello-talk': proven(2) } },
      {},
      { lessonsSeen: { sounds: 1 } },
    );
    renderAt('/');
    const cont = screen.getByRole('link', { name: /Continue/ });
    expect(cont.getAttribute('href')).toBe('/checkpoint/hello');
    expect(document.querySelectorAll('.unit--current .unit-step--done').length).toBe(4); // lesson + 3 steps
    expect(document.querySelector('.unit--current .unit-step--checkpoint')?.tagName).toBe('A');
  });

  it('opens the next unit once the checkpoint is passed', () => {
    seedChild(
      { 'hello': { greetings: proven(3), introduce: proven(3), 'hello-talk': proven(2) } },
      {},
      { lessonsSeen: { sounds: 1 }, checkpoints: { 'hello': { passedAt: 1, best: 0.9, attempts: 1 } } },
    );
    renderAt('/');
    const units = document.querySelectorAll('.unit');
    expect(units[0].className).toContain('unit--done');
    expect(units[1].className).toContain('unit--current');
    expect(screen.getByRole('link', { name: /Continue/ }).getAttribute('href')).toBe('/lesson/no-articles');
    expect(screen.getByText('1 of 23 units done')).toBeInTheDocument();
  });
});

describe('lessons + notebook', () => {
  it('reading a lesson to the end marks it read and starts the first practice step', async () => {
    seedChild();
    renderAt('/lesson/sounds');
    expect(screen.getByText('Read it like it\'s written')).toBeInTheDocument();
    // Click through every card.
    for (let i = 0; i < 10; i++) {
      const next = screen.queryByRole('button', { name: /Next/ });
      if (!next) break;
      fireEvent.click(next);
    }
    fireEvent.click(screen.getByRole('button', { name: /Start practicing/ }));
    const saved = JSON.parse(localStorage.getItem('fkg.profiles.v2') ?? '{}');
    expect(saved.children[0].course.lessonsSeen.sounds).toBeGreaterThan(0);
    // Now on the unit's first step (the greetings dialogue) — which first MODELS
    // a pair the child has never been shown, before asking for it.
    expect(await screen.findByText(/New phrase/)).toBeInTheDocument();
    expect(screen.getByText('…you say back:')).toBeInTheDocument();
  });

  it('lists only open units in the Notebook', () => {
    seedChild({}, {}, { checkpoints: { 'hello': { passedAt: 1, best: 1, attempts: 1 } } });
    renderAt('/notebook');
    expect(document.querySelectorAll('.notebook__item')).toHaveLength(2);
    expect(screen.getByText(/22 more lessons unlock/)).toBeInTheDocument();
  });
});

describe('achievements', () => {
  it('lists every achievement with exactly what earns it, and how far along you are', () => {
    seedChild();
    renderAt('/achievements');
    expect(screen.getByText(/0 of \d+ earned/)).toBeInTheDocument();
    expect(screen.getByText('Practice 3 days in a row.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Writer: 0 of 10 sentence steps/)).toBeInTheDocument();
  });

  it('is one tap from home', () => {
    seedChild();
    renderAt('/');
    // The tile AND the badge strip both open it.
    const links = screen.getAllByRole('link', { name: /Achievements/ });
    expect(links.length).toBe(2);
    for (const l of links) expect(l.getAttribute('href')).toMatch(/achievements$/);
  });
});

describe('playing a step', () => {
  it('plays a step as one unbroken stream — no interstitial, silent recording under its unit', async () => {
    // Cat pre-seeded as already-seen so the "meet the word" intro never
    // intercepts this deterministic-round play-through test.
    seedChild({}, { cat: { box: 2, due: 0, seen: 1, correct: 1, lastSeenAt: 1 } });
    vi.useFakeTimers();
    try {
      renderAt('/skill/having-words');
      expect(screen.getByLabelText('0 tähteä')).toBeInTheDocument();
      const tapCorrect = async () => {
        fireEvent.click(screen.getByText('🐱').closest('button') as HTMLButtonElement);
        await act(async () => {
          await vi.advanceTimersByTimeAsync(800);
        });
      };
      for (let q = 0; q < 6; q++) await tapCorrect();
      expect(screen.queryByText(/Great job/i)).not.toBeInTheDocument();
      expect(document.querySelectorAll('.pic-card').length).toBeGreaterThan(0);
      expect(screen.getByLabelText('6 tähteä')).toBeInTheDocument();
      const saved = JSON.parse(localStorage.getItem('fkg.profiles.v2') ?? '{}');
      const entry = saved.children[0].progress['having']['having-words'];
      expect(entry.plays).toBe(1);
      expect(entry.totalPossible).toBe(6);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('grown-up dashboard', () => {
  it('shows difficulty mode and per-step level', () => {
    seedChild({ 'people': { 'this-is': lvl(2) } });
    render(
      <ProfileProvider>
        <MemoryRouter>
          <ProgressView />
        </MemoryRouter>
      </ProfileProvider>,
    );
    expect(screen.getByText(/Auto \(adaptive\)/)).toBeInTheDocument();
    expect(screen.getByText(/This is…/)).toBeInTheDocument();
    expect(screen.getByText('Lv 2/4')).toBeInTheDocument();
  });

  it('shows can-do statements backed by passed checkpoints', () => {
    seedChild({}, {}, { checkpoints: { 'hello': { passedAt: 1, best: 1, attempts: 1 } } });
    render(
      <ProfileProvider>
        <MemoryRouter>
          <ProgressView />
        </MemoryRouter>
      </ProfileProvider>,
    );
    expect(screen.getByText(/Can greet people, say thanks/)).toBeInTheDocument();
    expect(document.querySelectorAll('.cando-row--next').length).toBeLessThanOrEqual(3);
    expect(document.querySelectorAll('.cando-row--next').length).toBeGreaterThan(0);
  });
});

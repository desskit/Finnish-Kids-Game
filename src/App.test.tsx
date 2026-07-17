import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
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
vi.mock('./audio/speak', () => ({ speak: vi.fn(), isSpeechAvailable: () => true }));
vi.mock('./audio/sfx', () => ({ playDing: vi.fn() }));

import { AppRoutes } from './App';
import ProgressView from './components/ProgressView';
import { ProfileProvider } from './state/profile';

// Smoke test for the journey-path navigation shell + the progression UI on top
// of it (badge strip, level pips, the dashboard). jsdom has no Web Speech/Audio,
// but the map / dashboard screens don't play audio, so they render as-is.

function seedChild(progress: Record<string, unknown> = {}, srs: Record<string, unknown> = {}) {
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

describe('journey path + progression UI', () => {
  it('renders the path home with chapters, a skill node, and badges (no manual difficulty control)', () => {
    seedChild();
    renderAt('/');
    expect(screen.getByRole('heading', { name: /Hei, Aino/i })).toBeInTheDocument();
    // A chapter banner and a communicative skill node (not a vocab category).
    expect(screen.getByText('Naming & having')).toBeInTheDocument();
    expect(screen.getByText(/This is a/)).toBeInTheDocument();
    // Difficulty is always adaptive now — no Easy/Hard chips for kids to tap.
    expect(screen.queryByText('Auto')).not.toBeInTheDocument();
    expect(document.querySelector('.badge-strip')).not.toBeNull();
    // The advanced chapter is now live: its capstone node renders, not a
    // "coming soon" placeholder.
    expect(screen.getByText('Full sentences')).toBeInTheDocument();
    expect(screen.getByText('Build sentences')).toBeInTheDocument();
    expect(screen.queryByText(/More coming soon/i)).not.toBeInTheDocument();
  });

  it('shows a level pip on a node once a level is reached', () => {
    seedChild({
      naming: {
        'this-is': { plays: 3, bestStars: 6, totalStars: 16, totalPossible: 18, lastPlayed: 1, level: 2, recent: [] },
      },
    });
    renderAt('/');
    // Node depth shows as "level / maxLevel"; this-is is a depth-4 node.
    expect(screen.getByText('Taso 2/4')).toBeInTheDocument();
  });

  it('plays a skill node as one unbroken stream — no interstitial, silent recording', async () => {
    // Cat pre-seeded as already-seen so the "meet the word" intro (a separate
    // feature) never intercepts this deterministic-round play-through test.
    seedChild({}, { cat: { box: 2, due: 0, seen: 1, correct: 1, lastSeenAt: 1 } });
    vi.useFakeTimers();
    try {
      renderAt('/skill/listen-animals');

      // In-session header shows the running star count, not question dots.
      expect(screen.getByLabelText('0 tähteä')).toBeInTheDocument();

      const tapCorrect = async () => {
        fireEvent.click(screen.getByText('🐱').closest('button') as HTMLButtonElement);
        await act(async () => {
          await vi.advanceTimersByTimeAsync(800);
        });
      };
      for (let q = 0; q < 6; q++) await tapCorrect();

      // Segment finished: no "Hienoa!" stop — a 7th question is just there,
      // and the star counter kept counting.
      expect(screen.queryByText(/Great job/i)).not.toBeInTheDocument();
      expect(document.querySelectorAll('.pic-card').length).toBeGreaterThan(0);
      expect(screen.getByLabelText('6 tähteä')).toBeInTheDocument();

      // The segment was recorded exactly once, quietly, in the background.
      const saved = JSON.parse(localStorage.getItem('fkg.profiles.v2') ?? '{}');
      const entry = saved.children[0].progress['first-words']['listen-animals'];
      expect(entry.plays).toBe(1);
      expect(entry.totalPossible).toBe(6);
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders the parent dashboard with difficulty mode and per-skill level', () => {
    seedChild({
      naming: {
        'this-is': { plays: 2, bestStars: 6, totalStars: 10, totalPossible: 12, lastPlayed: 1, level: 2, recent: [0.83] },
      },
    });
    render(
      <ProfileProvider>
        <MemoryRouter>
          <ProgressView />
        </MemoryRouter>
      </ProfileProvider>,
    );
    expect(screen.getByText(/Auto \(adaptive\)/)).toBeInTheDocument();
    expect(screen.getByText(/This is a/)).toBeInTheDocument();
    expect(screen.getByText('Lv 2/4')).toBeInTheDocument();
  });
});

describe("Today's adventure (guided session)", () => {
  it('offers a one-tap adventure card built from the weak node + the next unplayed one', () => {
    seedChild({
      naming: {
        'this-is': {
          plays: 3,
          bestStars: 2,
          totalStars: 4,
          totalPossible: 12,
          lastPlayed: 1,
          level: 2,
          recent: [0.3, 0.4, 0.2], // well under the practice-more bar
        },
      },
    });
    renderAt('/');
    expect(screen.getByRole('button', { name: /today's adventure/i })).toBeInTheDocument();
  });

  it('chains stop to stop on exit — back button moves on instead of going home, then finally home', async () => {
    // Pre-seed 'cat' as already-seen so stop 2 (listen-animals) shows its
    // normal quiz, not the unrelated "meet the word" intro card.
    seedChild(
      {
        naming: {
          'this-is': {
            plays: 3,
            bestStars: 2,
            totalStars: 4,
            totalPossible: 12,
            lastPlayed: 1,
            level: 2,
            recent: [0.3, 0.4, 0.2],
          },
        },
      },
      // due far in the future — seen, but NOT due, so no review stop sneaks in.
      { cat: { box: 5, due: Date.now() + 30 * 86_400_000, seen: 3, correct: 3, lastSeenAt: 1 } },
    );
    renderAt('/');

    fireEvent.click(screen.getByRole('button', { name: /today's adventure/i }));

    // Stop 1: the weak node ("this-is"), banner shows 1/2.
    expect(screen.getByText(/This is a/)).toBeInTheDocument();
    expect(document.querySelector('.adventure-banner')?.textContent).toContain('1/2');

    // Exit stop 1 — advances to stop 2 ("listen-animals"), not home.
    fireEvent.click(screen.getByLabelText('Back to the map'));
    expect(screen.queryByText(/Hei,/)).not.toBeInTheDocument(); // still not on the map
    expect(document.querySelector('.adventure-banner')?.textContent).toContain('2/2');

    // Exit the LAST stop — now it really does go home, banner gone.
    fireEvent.click(screen.getByLabelText('Back to the map'));
    expect(screen.getByText(/Hei,/)).toBeInTheDocument();
    expect(document.querySelector('.adventure-banner')).toBeNull();
  });

  it('landing back on the map mid-run cancels the adventure — free play is never hijacked', () => {
    // The child bails out of stop 1 with the BROWSER back button (not the
    // in-game one). The map must clear the run, or the next free-play node's
    // back button would "advance" into the stale run's stop 2.
    function BrowserBackSim() {
      const navigate = useNavigate();
      return <button onClick={() => navigate(-1)}>simulate-browser-back</button>;
    }
    seedChild(
      {
        naming: {
          'this-is': {
            plays: 3,
            bestStars: 2,
            totalStars: 4,
            totalPossible: 12,
            lastPlayed: 1,
            level: 2,
            recent: [0.3, 0.4, 0.2],
          },
        },
      },
      { cat: { box: 5, due: Date.now() + 30 * 86_400_000, seen: 3, correct: 3, lastSeenAt: 1 } },
    );
    render(
      <ProfileProvider>
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
          <BrowserBackSim />
        </MemoryRouter>
      </ProfileProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /today's adventure/i }));
    expect(document.querySelector('.adventure-banner')?.textContent).toContain('1/2');

    // Browser back → the map. The stale run is cancelled on arrival.
    fireEvent.click(screen.getByText('simulate-browser-back'));
    expect(screen.getByText(/Hei,/)).toBeInTheDocument();
    expect(document.querySelector('.adventure-banner')).toBeNull();

    // Free play into any node: its back button goes HOME, not to stale stop 2.
    fireEvent.click(screen.getByText(/This is a/).closest('a')!);
    fireEvent.click(screen.getByLabelText('Back to the map'));
    expect(screen.getByText(/Hei,/)).toBeInTheDocument();
  });
});

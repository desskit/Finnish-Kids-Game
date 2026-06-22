import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import ProgressView from './components/ProgressView';
import { ProfileProvider } from './state/profile';

// Smoke test for the navigation shell + the adaptive/progression UI added on top
// of it (badges strip, level pips, the dashboard). jsdom has no Web Speech/Audio,
// but the map / topic-hub / dashboard screens don't play audio, so they render as-is.

function seedChild(progress: Record<string, unknown> = {}) {
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
          srs: {},
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

describe('navigation shell + progression UI', () => {
  it('renders the map home with the difficulty toggle and badge strip', () => {
    seedChild();
    renderAt('/');
    expect(screen.getByText(/Choose a topic/i)).toBeInTheDocument();
    // The Auto/Easy/Hard difficulty control.
    expect(screen.getByText('Auto')).toBeInTheDocument();
    // A badge strip is present (locked + earned badges all render).
    expect(document.querySelector('.badge-strip')).not.toBeNull();
    // 30 stars earns the first star milestone, so at least one badge is unlocked.
    expect(document.querySelectorAll('.badge-strip .badge:not(.badge--locked)').length)
      .toBeGreaterThan(0);
  });

  it('renders a topic hub with activity tiles and a level pip once a level is reached', () => {
    seedChild({ animals: { listen: { plays: 3, bestStars: 6, totalStars: 16, totalPossible: 18, lastPlayed: 1, level: 2, recent: [] } } });
    renderAt('/topic/animals');
    expect(screen.getByText('Listen & Tap')).toBeInTheDocument();
    // The adaptive level the child climbed to shows as a pip on the tile.
    expect(screen.getByText('Taso 2')).toBeInTheDocument();
  });

  it('renders the parent dashboard with the difficulty mode and per-activity level', () => {
    seedChild({ animals: { listen: { plays: 2, bestStars: 6, totalStars: 10, totalPossible: 12, lastPlayed: 1, level: 2, recent: [0.83] } } });
    render(
      <ProfileProvider>
        <MemoryRouter>
          <ProgressView />
        </MemoryRouter>
      </ProfileProvider>,
    );
    expect(screen.getByText(/Auto \(adaptive\)/)).toBeInTheDocument();
    expect(screen.getByText('Listen & Tap')).toBeInTheDocument();
    expect(screen.getByText('Lv 2')).toBeInTheDocument();
  });
});

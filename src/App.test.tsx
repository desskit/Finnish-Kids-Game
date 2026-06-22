import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import ProgressView from './components/ProgressView';
import { ProfileProvider } from './state/profile';

// Smoke test for the journey-path navigation shell + the progression UI on top
// of it (badge strip, level pips, the dashboard). jsdom has no Web Speech/Audio,
// but the map / dashboard screens don't play audio, so they render as-is.

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

describe('journey path + progression UI', () => {
  it('renders the path home with chapters, a skill node, the difficulty toggle and badges', () => {
    seedChild();
    renderAt('/');
    expect(screen.getByRole('heading', { name: /Hei, Aino/i })).toBeInTheDocument();
    // A chapter banner and a communicative skill node (not a vocab category).
    expect(screen.getByText('Naming & having')).toBeInTheDocument();
    expect(screen.getByText(/This is a/)).toBeInTheDocument();
    // The Auto/Easy/Hard difficulty control + the badge strip.
    expect(screen.getByText('Auto')).toBeInTheDocument();
    expect(document.querySelector('.badge-strip')).not.toBeNull();
    // The advanced chapter shows a "coming soon" placeholder while empty.
    expect(screen.getByText(/More coming soon/i)).toBeInTheDocument();
  });

  it('shows a level pip on a node once a level is reached', () => {
    seedChild({
      naming: {
        'this-is': { plays: 3, bestStars: 6, totalStars: 16, totalPossible: 18, lastPlayed: 1, level: 2, recent: [] },
      },
    });
    renderAt('/');
    expect(screen.getByText('Taso 2')).toBeInTheDocument();
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
    expect(screen.getByText('Lv 2')).toBeInTheDocument();
  });
});

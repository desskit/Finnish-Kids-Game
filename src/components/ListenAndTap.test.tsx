import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { LexicalItem } from '../content/types';
import { ProfileProvider, useProfile } from '../state/profile';

// A deterministic round: the same target every question, so the test always
// knows which card is correct (the real builder is random + audio-driven).
const fx = vi.hoisted(() => {
  const mk = (id: string, fi: string, emoji: string): LexicalItem => ({
    id,
    fi,
    en: id,
    emoji,
    tier: 1,
    inflections: { nominative_singular: fi },
  });
  return {
    TARGET: mk('cat', 'kissa', '🐱'),
    WRONG: mk('dog', 'koira', '🐶'),
    FILLER: mk('cow', 'lehmä', '🐮'),
  };
});

vi.mock('../game/round', () => ({
  buildListenRound: () =>
    Array.from({ length: 6 }, () => ({
      target: fx.TARGET,
      options: [fx.TARGET, fx.WRONG, fx.FILLER],
    })),
}));
vi.mock('../audio/speak', () => ({ speak: vi.fn(), isSpeechAvailable: () => true }));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import ListenAndTap from './ListenAndTap';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';

// A child must exist for addStars() to land on someone.
function seedChild() {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [
        { id: 'k', name: 'K', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {} },
      ],
      activeId: 'k',
      settings: { muted: false, reducedMotion: false },
    }),
  );
}

function StarsProbe() {
  const { stars } = useProfile();
  return <output data-testid="stars">{stars}</output>;
}

function renderActivity() {
  return render(
    <ProfileProvider>
      <ListenAndTap items={[fx.TARGET, fx.WRONG, fx.FILLER]} onExit={vi.fn()} />
      <StarsProbe />
    </ProfileProvider>,
  );
}

const correctCard = () => screen.getByText('🐱').closest('button') as HTMLButtonElement;
const wrongCard = () => screen.getByText('🐶').closest('button') as HTMLButtonElement;

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  localStorage.clear();
  seedChild();
  vi.clearAllMocks();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('ListenAndTap', () => {
  it('renders the first question with three picture cards', () => {
    renderActivity();
    expect(screen.getByLabelText('Question 1 of 6')).toBeInTheDocument();
    expect(document.querySelectorAll('.pic-card')).toHaveLength(3);
  });

  it('awards a star and advances on a correct tap', async () => {
    renderActivity();
    fireEvent.click(correctCard());

    expect(playDing).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('stars')).toHaveTextContent('1');

    await advance(800);
    expect(screen.getByLabelText('Question 2 of 6')).toBeInTheDocument();
  });

  it('highlights a wrong tap without advancing or awarding a star', async () => {
    renderActivity();
    fireEvent.click(wrongCard());

    expect(playDing).toHaveBeenCalledWith(false);
    expect(wrongCard().className).toContain('pic-card--wrong');

    await advance(100);
    expect(screen.getByLabelText('Question 1 of 6')).toBeInTheDocument();
    expect(screen.getByTestId('stars')).toHaveTextContent('0');
  });

  it('rolls straight into a fresh round after the last question — no interstitial', async () => {
    renderActivity();
    for (let q = 0; q < 6; q++) {
      fireEvent.click(correctCard());
      await advance(800);
    }
    // Endless play: no celebration screen, the next question is just there
    // (standalone fallback restarts the component's own round).
    expect(screen.queryByText(/Great job/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Question 1 of 6')).toBeInTheDocument();
    expect(document.querySelectorAll('.pic-card')).toHaveLength(3);
    expect(screen.getByTestId('stars')).toHaveTextContent('6');
  });
});

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
import { ActivityContext } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';

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
    // Obvious positive feedback: a distinct pop, not just the wrong card's
    // absence of a wiggle.
    expect(correctCard().className).toContain('pic-card--correct');

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

  it('names the picture the child actually tapped, even when it is wrong', () => {
    renderActivity();
    // The auto-speak-on-new-question effect is a pending setTimeout (fake
    // timers, not yet advanced) — the tap below is the only speak() call so far.
    fireEvent.click(wrongCard());
    expect(speak).toHaveBeenCalledWith('koira'); // the WRONG item's own word, not the target
  });

  it('no gentle timer below level 5 (default fallback difficulty)', () => {
    renderActivity();
    expect(document.querySelector('.q-timer')).toBeNull();
  });

  it('shows a gentle timer at L5+ and, on lapse, nudges the correct card without penalty', async () => {
    render(
      <ProfileProvider>
        <ActivityContext.Provider
          value={{ onSegmentComplete: vi.fn(), difficulty: difficultyFor(6), sessionStars: 0 }}
        >
          <ListenAndTap items={[fx.TARGET, fx.WRONG, fx.FILLER]} onExit={vi.fn()} />
        </ActivityContext.Provider>
      </ProfileProvider>,
    );
    // A timer bar appears (difficultyFor(6).timerMs === 7000).
    expect(document.querySelector('.q-timer')).not.toBeNull();
    // Before lapse, no hint on the correct card.
    expect(correctCard().className).not.toContain('pic-card--hint');
    // Let the countdown lapse: the correct card pulses as a nudge, still no
    // wrong-buzz and no auto-advance (question 1 stays put).
    vi.clearAllMocks();
    await advance(7000);
    expect(correctCard().className).toContain('pic-card--hint');
    expect(playDing).not.toHaveBeenCalledWith(false); // no penalty buzz
    // No auto-advance: the same question stays, unanswered (not locked/correct).
    expect(document.querySelectorAll('.pic-card')).toHaveLength(3);
    expect(correctCard().className).not.toContain('pic-card--correct');
    expect(speak).toHaveBeenCalledWith('kissa'); // re-said the word as the hint
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

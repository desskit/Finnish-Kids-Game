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

// A child must exist for addStars() to land on someone. All three fixture
// words pre-seeded as already-seen by default, so ordinary quiz-flow tests
// never hit the "meet the word" intro card — that flow has its own dedicated
// tests below, with a genuinely fresh (unseeded) child.
const SEEN_SCHEDULE = { box: 2, due: 0, seen: 1, correct: 1, lastSeenAt: 1 };

function seedChild(srs: Record<string, unknown> = {}) {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [
        { id: 'k', name: 'K', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs },
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
  seedChild({ cat: SEEN_SCHEDULE, dog: SEEN_SCHEDULE, cow: SEEN_SCHEDULE });
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

  function renderTimed(level: number, timerFromLevel?: number) {
    return render(
      <ProfileProvider>
        <ActivityContext.Provider
          value={{ onSegmentComplete: vi.fn(), difficulty: difficultyFor(level), sessionStars: 0 }}
        >
          <ListenAndTap
            items={[fx.TARGET, fx.WRONG, fx.FILLER]}
            timerFromLevel={timerFromLevel}
            onExit={vi.fn()}
          />
        </ActivityContext.Provider>
      </ProfileProvider>,
    );
  }

  it('no timer when the node has not opted in (timerFromLevel unset), even at a high level', () => {
    renderTimed(8, undefined);
    expect(document.querySelector('.q-timer')).toBeNull();
  });

  it('no timer below the node’s threshold, even when opted in', () => {
    renderTimed(3, 4); // opted in from L4, but measured level is 3
    expect(document.querySelector('.q-timer')).toBeNull();
  });

  it('shows a gentle timer at/above the threshold and, on lapse, nudges the correct card without penalty', async () => {
    renderTimed(6, 4); // opted in from L4, measured level 6 → questionTimerMs(6) = 7000
    // A timer bar appears.
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

  it('lapsing forfeits the first-try bonus — waiting out the clock is not free mastery', async () => {
    const onSegmentComplete = vi.fn();
    render(
      <ProfileProvider>
        <ActivityContext.Provider
          value={{ onSegmentComplete, difficulty: difficultyFor(6), sessionStars: 0, roundQuestions: 1 }}
        >
          <ListenAndTap items={[fx.TARGET, fx.WRONG, fx.FILLER]} timerFromLevel={4} onExit={vi.fn()} />
          <StarsProbe />
        </ActivityContext.Provider>
      </ProfileProvider>,
    );
    await advance(7000); // lapse → the nudge fires, first-try bonus forfeited
    fireEvent.click(correctCard()); // still correct → still a star, but not first-try
    expect(screen.getByTestId('stars')).toHaveTextContent('1'); // star still awarded
    await advance(800);
    // Segment reports 0 first-tries of 1 — the round did NOT count as clean mastery.
    expect(onSegmentComplete).toHaveBeenCalledWith(0, 1);
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

describe('ListenAndTap — "meet the word" intro', () => {
  it('shows a no-stakes intro card (Finnish + English + TTS) before quizzing a brand-new word', () => {
    seedChild(); // no schedules at all — every word is unseen
    renderActivity();
    expect(document.querySelectorAll('.pic-card')).toHaveLength(0);
    expect(screen.getByText('Uusi sana!')).toBeInTheDocument();
    expect(document.querySelector('.word-intro__fi')).toHaveTextContent('kissa');
    expect(screen.getByText('cat')).toBeInTheDocument();
  });

  it('advances into the real quiz question after "Continue"', () => {
    seedChild();
    renderActivity();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByLabelText('Question 1 of 6')).toBeInTheDocument();
    expect(document.querySelectorAll('.pic-card')).toHaveLength(3);
    expect(screen.getByTestId('stars')).toHaveTextContent('0'); // intro never awards a star
  });

  it('never shows the intro when the word already has an SRS schedule', () => {
    seedChild({ cat: SEEN_SCHEDULE });
    renderActivity();
    expect(document.querySelectorAll('.pic-card')).toHaveLength(3); // straight to the quiz
  });
});

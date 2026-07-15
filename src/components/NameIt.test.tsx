import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { LexicalItem } from '../content/types';
import { ProfileProvider, useProfile } from '../state/profile';

const fx = vi.hoisted(() => {
  const mk = (id: string, fi: string, emoji: string): LexicalItem => ({
    id,
    fi,
    en: id,
    emoji,
    tier: 1,
    inflections: { nominative_singular: fi },
  });
  return { TARGET: mk('cat', 'kissa', '🐱'), OTHER: mk('dog', 'koira', '🐶'), FILLER: mk('cow', 'lehmä', '🐮') };
});

vi.mock('../game/round', () => ({
  buildListenRound: () =>
    Array.from({ length: 6 }, () => ({ target: fx.TARGET, options: [fx.TARGET, fx.OTHER, fx.FILLER] })),
}));
vi.mock('../audio/speak', () => ({
  speak: vi.fn(),
  speakEnglish: vi.fn(),
  isSpeechAvailable: () => true,
}));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import NameIt from './NameIt';
import { speak, speakEnglish } from '../audio/speak';
import { playDing } from '../audio/sfx';
import { ActivityContext } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';

// All three fixture words pre-seeded as already-seen, so ordinary quiz-flow
// tests never hit the "meet the word" intro card — that flow has its own
// dedicated tests below, with a genuinely fresh (unseeded) child.
const SEEN_SCHEDULE = { box: 2, due: 0, seen: 1, correct: 1, lastSeenAt: 1 };

function seedChild(srs: Record<string, unknown> = {}) {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [{ id: 'k', name: 'K', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs }],
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
      <NameIt items={[fx.TARGET, fx.OTHER, fx.FILLER]} onExit={vi.fn()} />
      <StarsProbe />
    </ProfileProvider>,
  );
}

const wordTile = (fi: string) => screen.getByText(fi).closest('button') as HTMLButtonElement;

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

describe('NameIt (production recall)', () => {
  it('shows the picture + English cue and Finnish word tiles', () => {
    renderActivity();
    expect(document.querySelector('.phrase-emoji')).toHaveTextContent('🐱');
    expect(screen.getByText('cat')).toBeInTheDocument();
    expect(document.querySelectorAll('.word-tile')).toHaveLength(3);
    expect(wordTile('kissa')).toBeInTheDocument();
  });

  it('narrates the English cue (never the Finnish answer) on a new question', async () => {
    renderActivity();
    await advance(400);
    expect(speakEnglish).toHaveBeenCalledWith('cat');
    expect(speak).not.toHaveBeenCalled();
  });

  it('awards a star, speaks the produced Finnish, and marks the correct tile on a right pick', async () => {
    renderActivity();
    fireEvent.click(wordTile('kissa'));
    expect(playDing).toHaveBeenCalledWith(true);
    expect(speak).toHaveBeenCalledWith('kissa');
    expect(screen.getByTestId('stars')).toHaveTextContent('1');
    expect(wordTile('kissa').className).toContain('word-tile--correct');
    await advance(800);
  });

  it('flags a wrong tile without a star or speaking Finnish', () => {
    renderActivity();
    vi.clearAllMocks();
    fireEvent.click(wordTile('koira'));
    expect(playDing).toHaveBeenCalledWith(false);
    expect(wordTile('koira').className).toContain('word-tile--wrong');
    expect(screen.getByTestId('stars')).toHaveTextContent('0');
    expect(speak).not.toHaveBeenCalled();
  });

  it('replays the English cue from the Listen button', () => {
    renderActivity();
    vi.clearAllMocks();
    fireEvent.click(screen.getByRole('button', { name: /hear the prompt again/i }));
    expect(speakEnglish).toHaveBeenCalledWith('cat');
    expect(speak).not.toHaveBeenCalled();
  });

  function renderTimed(level: number, timerFromLevel?: number) {
    return render(
      <ProfileProvider>
        <ActivityContext.Provider
          value={{ onSegmentComplete: vi.fn(), difficulty: difficultyFor(level), sessionStars: 0 }}
        >
          <NameIt
            items={[fx.TARGET, fx.OTHER, fx.FILLER]}
            timerFromLevel={timerFromLevel}
            onExit={vi.fn()}
          />
        </ActivityContext.Provider>
      </ProfileProvider>,
    );
  }

  it('no timer when the node has not opted in, even at a high level', () => {
    renderTimed(8, undefined);
    expect(document.querySelector('.q-timer')).toBeNull();
  });

  it('no timer below the node’s threshold, even when opted in', () => {
    renderTimed(3, 4);
    expect(document.querySelector('.q-timer')).toBeNull();
  });

  it('shows a gentle timer at/above the threshold and, on lapse, nudges the correct tile without penalty', async () => {
    renderTimed(6, 4);
    expect(document.querySelector('.q-timer')).not.toBeNull();
    expect(wordTile('kissa').className).not.toContain('word-tile--hint');
    vi.clearAllMocks();
    await advance(7000); // questionTimerMs(6)
    expect(wordTile('kissa').className).toContain('word-tile--hint');
    expect(playDing).not.toHaveBeenCalledWith(false); // no penalty buzz
    expect(document.querySelectorAll('.word-tile')).toHaveLength(3); // no auto-advance
    expect(speakEnglish).toHaveBeenCalledWith('cat'); // re-cued
  });
});

describe('NameIt — "meet the word" intro', () => {
  it('shows a no-stakes intro card (Finnish + English + TTS) before quizzing a brand-new word', () => {
    seedChild(); // no schedules at all — every word is unseen
    renderActivity();
    // The intro, not the quiz: no word tiles yet, but the answer is right there.
    expect(document.querySelectorAll('.word-tile')).toHaveLength(0);
    expect(screen.getByText('Uusi sana!')).toBeInTheDocument();
    expect(document.querySelector('.word-intro__fi')).toHaveTextContent('kissa');
    expect(screen.getByText('cat')).toBeInTheDocument();
  });

  it('advances into the real quiz question after "Continue", without double-crediting SRS', () => {
    seedChild();
    renderActivity();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    // Now the normal NameIt quiz for the SAME word — same index, no question skipped.
    expect(document.querySelectorAll('.word-tile')).toHaveLength(3);
    expect(wordTile('kissa')).toBeInTheDocument();
    expect(screen.getByTestId('stars')).toHaveTextContent('0'); // intro never awards a star
  });

  it('never shows the intro when the word already has an SRS schedule', () => {
    seedChild({ cat: SEEN_SCHEDULE });
    renderActivity();
    expect(document.querySelectorAll('.word-tile')).toHaveLength(3); // straight to the quiz
  });
});

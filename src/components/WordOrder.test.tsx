import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProfileProvider, useProfile } from '../state/profile';
import type { SentenceQuestion } from '../game/round';

vi.mock('../audio/speak', () => ({ speak: vi.fn(), isSpeechAvailable: () => true }));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import WordOrder from './WordOrder';
import { playDing } from '../audio/sfx';

// Two words: "minä" (id 0, correct-first) and "menen." (id 1). Shuffled so the
// WRONG tile ("menen.") renders first — every test taps it to drive misses.
const ROUND: SentenceQuestion[] = Array.from({ length: 6 }, () => ({
  hintEn: 'I go.',
  sentence: 'minä menen.',
  tokens: [
    { id: 0, text: 'minä' },
    { id: 1, text: 'menen.' },
  ],
  shuffled: [
    { id: 1, text: 'menen.' },
    { id: 0, text: 'minä' },
  ],
}));

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

function renderActivity(hintAfterMisses?: number) {
  return render(
    <ProfileProvider>
      <WordOrder buildRound={() => ROUND} hintAfterMisses={hintAfterMisses} onExit={vi.fn()} />
      <StarsProbe />
    </ProfileProvider>,
  );
}

const wrongTile = () => screen.getByText('menen.').closest('button') as HTMLButtonElement;
const correctTile = () => screen.getByText('minä').closest('button') as HTMLButtonElement;

beforeEach(() => {
  localStorage.clear();
  seedChild();
  vi.clearAllMocks();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('WordOrder hint', () => {
  it('never hints when hintAfterMisses is unset (Word Order capstone default)', async () => {
    renderActivity(undefined);
    fireEvent.click(wrongTile());
    await act(async () => vi.advanceTimersByTimeAsync(600));
    fireEvent.click(wrongTile());
    await act(async () => vi.advanceTimersByTimeAsync(600));
    fireEvent.click(wrongTile());
    await act(async () => vi.advanceTimersByTimeAsync(600));
    expect(correctTile().className).not.toContain('word-tile--hint');
  });

  it('nudges the correct next tile after the configured number of misses', async () => {
    renderActivity(2);
    expect(correctTile().className).not.toContain('word-tile--hint');

    fireEvent.click(wrongTile());
    expect(playDing).toHaveBeenCalledWith(false);
    await act(async () => vi.advanceTimersByTimeAsync(600));
    expect(correctTile().className).not.toContain('word-tile--hint');

    fireEvent.click(wrongTile());
    await act(async () => vi.advanceTimersByTimeAsync(600));
    expect(correctTile().className).toContain('word-tile--hint');
  });

  it('resets the miss counter once the correct tile lands', async () => {
    renderActivity(2);
    fireEvent.click(wrongTile());
    await act(async () => vi.advanceTimersByTimeAsync(600));
    fireEvent.click(wrongTile());
    await act(async () => vi.advanceTimersByTimeAsync(600));
    expect(correctTile().className).toContain('word-tile--hint');

    // Land "minä" (clears the hint + the miss count), then finish the
    // question with the one remaining tile ("menen.") to roll into a fresh
    // question with its own fresh set of tiles.
    fireEvent.click(correctTile());
    fireEvent.click(screen.getByText('menen.').closest('button') as HTMLButtonElement);
    await act(async () => vi.advanceTimersByTimeAsync(1400));
    // Fresh question: no wrong taps yet, so no hint even though a hint
    // showed on the previous question.
    expect(correctTile().className).not.toContain('word-tile--hint');
  });
});

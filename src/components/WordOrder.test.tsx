import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProfileProvider, useProfile } from '../state/profile';
import type { SentenceQuestion } from '../game/round';

// Single-slot (carrier-phrase) fixture: "Tämä on kissa." as three tiles, with
// the item's emoji for the picture check. Shuffled last-first so every test
// can drive a deterministic wrong-then-right tap sequence.
const phraseFx = vi.hoisted(() => {
  const tokens = [
    { id: 0, text: 'Tämä' },
    { id: 1, text: 'on' },
    { id: 2, text: 'kissa.' },
  ];
  return {
    ITEM: { id: 'cat', fi: 'kissa', en: 'cat', emoji: '🐱', tier: 1, inflections: {} },
    CONSTRUCTION: { id: 'this-is', before: 'Tämä on', punct: '.', en: 'This is a ___.', tier: 2 },
    TOKENS: tokens,
    SHUFFLED: [tokens[2], tokens[1], tokens[0]],
  };
});

vi.mock('../audio/speak', () => ({
  speak: vi.fn(),
  speakEnglish: vi.fn(),
  isSpeechAvailable: () => true,
}));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));
vi.mock('../game/round', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../game/round')>();
  return {
    ...actual,
    buildWordOrderRound: () =>
      Array.from({ length: 6 }, () => ({
        construction: phraseFx.CONSTRUCTION,
        item: phraseFx.ITEM,
        tokens: phraseFx.TOKENS,
        shuffled: phraseFx.SHUFFLED,
        sentence: 'Tämä on kissa.',
      })),
  };
});

import WordOrder from './WordOrder';
import { speak, speakEnglish } from '../audio/speak';
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

describe('WordOrder TTS + picture', () => {
  it('multi-slot sentence mode (buildRound) never speaks FINNISH, even after a correct finish', async () => {
    renderActivity(undefined);
    fireEvent.click(correctTile()); // "minä" — 1 of 2 tokens
    fireEvent.click(screen.getByText('menen.').closest('button') as HTMLButtonElement);
    await act(async () => vi.advanceTimersByTimeAsync(1400));
    expect(speak).not.toHaveBeenCalled();
  });

  it('multi-slot sentence mode DOES narrate the English hint up front', async () => {
    renderActivity(undefined);
    await act(async () => vi.advanceTimersByTimeAsync(500));
    expect(speakEnglish).toHaveBeenCalledWith('I go.');
  });

  it('multi-slot sentence mode shows no picture (no single main object)', () => {
    renderActivity(undefined);
    expect(document.querySelector('.phrase-emoji')).toBeNull();
  });

  it('single-slot carrier-phrase mode shows the item picture throughout', () => {
    render(
      <ProfileProvider>
        <WordOrder items={[phraseFx.ITEM]} constructions={[phraseFx.CONSTRUCTION]} onExit={vi.fn()} />
      </ProfileProvider>,
    );
    expect(screen.getByText('🐱')).toBeInTheDocument();
  });

  it('single-slot carrier-phrase mode narrates the filled-in English hint up front', async () => {
    render(
      <ProfileProvider>
        <WordOrder items={[phraseFx.ITEM]} constructions={[phraseFx.CONSTRUCTION]} onExit={vi.fn()} />
      </ProfileProvider>,
    );
    await act(async () => vi.advanceTimersByTimeAsync(500));
    // The raw template has a "___" blank; the spoken/shown hint fills it
    // with the item, same as Build a Phrase.
    expect(speakEnglish).toHaveBeenCalledWith('This is a cat.');
    expect(screen.getByText('This is a cat.')).toBeInTheDocument();
  });

  it('single-slot carrier-phrase mode never speaks Finnish before the phrase is complete', async () => {
    render(
      <ProfileProvider>
        <WordOrder items={[phraseFx.ITEM]} constructions={[phraseFx.CONSTRUCTION]} onExit={vi.fn()} />
      </ProfileProvider>,
    );
    await act(async () => vi.advanceTimersByTimeAsync(500));
    // Two of three tiles tapped correctly ("Tämä", "on") — not done yet.
    fireEvent.click(screen.getByText('Tämä').closest('button') as HTMLButtonElement);
    fireEvent.click(screen.getByText('on').closest('button') as HTMLButtonElement);
    expect(speak).not.toHaveBeenCalled();
  });

  it('single-slot carrier-phrase mode speaks the full phrase once assembled correctly', () => {
    render(
      <ProfileProvider>
        <WordOrder items={[phraseFx.ITEM]} constructions={[phraseFx.CONSTRUCTION]} onExit={vi.fn()} />
      </ProfileProvider>,
    );
    fireEvent.click(screen.getByText('Tämä').closest('button') as HTMLButtonElement);
    fireEvent.click(screen.getByText('on').closest('button') as HTMLButtonElement);
    fireEvent.click(screen.getByText('kissa.').closest('button') as HTMLButtonElement);
    expect(speak).toHaveBeenCalledWith('Tämä on kissa.');
  });
});

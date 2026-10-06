import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { Construction, LexicalItem } from '../content/types';
import { ProfileProvider, useProfile } from '../state/profile';

// A deterministic error round: q0 correct ("Kissa on laatikossa."), q1 wrong
// (the slot swapped to the adessive "laatikolla").
const fx = vi.hoisted(() => {
  const CON: Construction = {
    id: 'in-it',
    before: 'Kissa on',
    punct: '.',
    en: 'The cat is in the ___.',
    tier: 3,
    case: 'inessive',
    number: 'singular',
  };
  const ITEM = {
    id: 'box',
    fi: 'laatikko',
    en: 'box',
    emoji: '📦',
    tier: 1,
    inflections: { nominative_singular: 'laatikko', inessive_singular: 'laatikossa', adessive_singular: 'laatikolla' },
  } as LexicalItem;
  const mkWords = (slot: string) => [
    { text: 'Kissa', isSlot: false },
    { text: 'on', isSlot: false },
    { text: slot + '.', isSlot: true },
  ];
  const ROUND = [
    { construction: CON, item: ITEM, gloss: 'The cat is in the box.', words: mkWords('laatikossa'), slotIndex: 2, isCorrect: true, correctForm: 'laatikossa' },
    { construction: CON, item: ITEM, gloss: 'The cat is in the box.', words: mkWords('laatikolla'), slotIndex: 2, isCorrect: false, correctForm: 'laatikossa' },
  ];
  return { CON, ITEM, ROUND };
});

vi.mock('../game/round', () => ({ buildErrorRound: () => fx.ROUND }));
vi.mock('../audio/speak', () => ({
  speak: vi.fn(),
  speakEnglish: vi.fn(),
  isSpeechAvailable: () => true,
}));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import FindError from './FindError';
import { speak, speakEnglish } from '../audio/speak';
import { playDing } from '../audio/sfx';

function seedChild() {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [
        { id: 'k', name: 'K', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {} },
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

function renderGame() {
  return render(
    <ProfileProvider>
      <FindError items={[fx.ITEM]} constructions={[fx.CON]} onExit={vi.fn()} />
      <StarsProbe />
    </ProfileProvider>,
  );
}

const word = (t: string) => screen.getByText(t, { selector: '.error-word' }).closest('button')!;
const allCorrect = () => screen.getByRole('button', { name: /all correct/i });

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

describe('FindError (Löydä virhe)', () => {
  it('shows the sentence as word chips, the intended meaning, and an "all correct" button', async () => {
    renderGame();
    expect(screen.getByText('The cat is in the box.')).toBeInTheDocument();
    expect(word('Kissa')).toBeInTheDocument();
    expect(word('laatikossa.')).toBeInTheDocument();
    expect(allCorrect()).toBeInTheDocument();
    await advance(400);
    expect(speakEnglish).toHaveBeenCalledWith('The cat is in the box.'); // meaning read aloud
  });

  it('a CORRECT sentence is answered with "all correct" — star + confirm audio', async () => {
    renderGame();
    fireEvent.click(allCorrect()); // q0 is correct
    expect(playDing).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('stars')).toHaveTextContent('1');
    const saved = JSON.parse(localStorage.getItem('fkg.profiles.v2')!);
    expect(saved.children[0].srs['box'].seen).toBe(1);
    await advance(1600);
    // Advanced to q1 (the wrong sentence).
    expect(word('laatikolla.')).toBeInTheDocument();
  });

  it('tapping "all correct" on a WRONG sentence buzzes without a star', async () => {
    renderGame();
    fireEvent.click(allCorrect()); // clear q0
    await advance(1600);
    // q1: sentence is wrong; claiming it's correct is a miss.
    fireEvent.click(allCorrect());
    expect(playDing).toHaveBeenCalledWith(false);
  });

  it('tapping the wrong-case word on a WRONG sentence scores and reveals the fix', async () => {
    renderGame();
    fireEvent.click(allCorrect()); // clear q0
    await advance(1600);
    const before = Number(screen.getByTestId('stars').textContent);
    fireEvent.click(word('laatikolla.')); // the swapped slot — the error
    expect(playDing).toHaveBeenCalledWith(true);
    expect(Number(screen.getByTestId('stars').textContent)).toBe(before + 1);
    // The corrected form is revealed on the chip.
    expect(screen.getByText('laatikossa', { selector: '.error-word' })).toBeInTheDocument();
  });

  it('tapping a FIXED word (not the slot) buzzes', () => {
    renderGame();
    fireEvent.click(word('Kissa')); // a fixed word is never the error
    expect(playDing).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('stars')).toHaveTextContent('0');
  });
});

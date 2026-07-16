import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { Construction, LexicalItem } from '../content/types';
import { ProfileProvider, useProfile } from '../state/profile';

// A deterministic round: q1 matches (Kyllä), q2 doesn't (Ei) — so the test
// always knows the right answer without parsing the random builder's output.
const fx = vi.hoisted(() => {
  const mk = (id: string, fi: string, emoji: string) =>
    ({ id, fi, en: id, emoji, tier: 1, inflections: { nominative_singular: fi } }) as LexicalItem;
  const CAT = mk('cat', 'kissa', '🐱');
  const DOG = mk('dog', 'koira', '🐶');
  return {
    CAT,
    DOG,
    ROUND: [
      { shown: CAT, asked: CAT, isMatch: true, question: 'Onko tämä kissa?' },
      { shown: CAT, asked: DOG, isMatch: false, question: 'Onko tämä koira?' },
    ],
  };
});

vi.mock('../game/round', () => ({ buildYesNoRound: () => fx.ROUND }));
vi.mock('../audio/speak', () => ({ speak: vi.fn(), isSpeechAvailable: () => true }));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import YesNoGame from './YesNoGame';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';

const IS_THIS: Construction = {
  id: 'is-this',
  before: 'Onko tämä',
  punct: '?',
  en: 'Is this a ___?',
  tier: 2,
  case: 'nominative',
  number: 'singular',
};

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
      <YesNoGame items={[fx.CAT, fx.DOG]} construction={IS_THIS} onExit={vi.fn()} />
      <StarsProbe />
    </ProfileProvider>,
  );
}

const kylla = () => screen.getByRole('button', { name: /kyllä/i });
const ei = () => screen.getByRole('button', { name: /^2\s*Ei!/i });

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

describe('YesNoGame (Onko tämä…?)', () => {
  it('shows the picture, the question, and Kyllä/Ei tiles; speaks the QUESTION in Finnish', async () => {
    renderGame();
    expect(screen.getByText('🐱')).toBeInTheDocument();
    expect(screen.getByText('Onko tämä kissa?')).toBeInTheDocument();
    expect(kylla()).toBeInTheDocument();
    expect(ei()).toBeInTheDocument();
    await advance(400);
    expect(speak).toHaveBeenCalledWith('Onko tämä kissa?');
  });

  it('a right answer confirms aloud ("Kyllä, se on kissa."), stars, and credits word + grammar SRS', async () => {
    renderGame();
    fireEvent.click(kylla()); // q1 matches → Kyllä is correct
    expect(playDing).toHaveBeenCalledWith(true);
    expect(speak).toHaveBeenCalledWith('Kyllä, se on kissa.');
    expect(screen.getByTestId('stars')).toHaveTextContent('1');
    const saved = JSON.parse(localStorage.getItem('fkg.profiles.v2')!);
    expect(saved.children[0].srs['cat'].seen).toBe(1); // the ASKED word
    expect(saved.children[0].srs['con:is-this'].seen).toBe(1); // the question grammar
    await advance(1200);
  });

  it('a mismatch question is answered Ei, confirming what it really is', async () => {
    renderGame();
    fireEvent.click(kylla());
    await advance(1200); // → q2: cat shown, "Onko tämä koira?" — the answer is Ei
    expect(screen.getByText('Onko tämä koira?')).toBeInTheDocument();
    vi.clearAllMocks();
    fireEvent.click(ei());
    expect(playDing).toHaveBeenCalledWith(true);
    expect(speak).toHaveBeenCalledWith('Ei, se on kissa.');
  });

  it('a wrong answer buzzes without advancing or awarding a star', () => {
    renderGame();
    fireEvent.click(ei()); // q1 matches → Ei is wrong
    expect(playDing).toHaveBeenCalledWith(false);
    expect(screen.getByText('Onko tämä kissa?')).toBeInTheDocument(); // same question
    expect(screen.getByTestId('stars')).toHaveTextContent('0');
  });
});

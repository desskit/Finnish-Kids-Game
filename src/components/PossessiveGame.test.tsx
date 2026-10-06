import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { LexicalItem } from '../content/types';
import { ProfileProvider, useProfile } from '../state/profile';

// A deterministic possessive round: "my cat" with the three possessor forms.
const fx = vi.hoisted(() => {
  const CAT = {
    id: 'cat',
    fi: 'kissa',
    en: 'cat',
    emoji: '🐱',
    tier: 1,
    inflections: {
      nominative_singular: 'kissa',
      poss_1sg_nominative_singular: 'kissani',
      poss_2sg_nominative_singular: 'kissasi',
      poss_3rd_nominative_singular: 'kissansa',
    },
  } as LexicalItem;
  const ROUND = Array.from({ length: 6 }, () => ({
    item: CAT,
    possessor: '1sg' as const,
    caseId: 'nominative' as const,
    answer: 'kissani',
    options: ['kissasi', 'kissani', 'kissansa'],
    gloss: 'my cat',
  }));
  return { CAT, ROUND, next: null as null | typeof ROUND };
});

vi.mock('../game/round', () => ({ buildPossessiveRound: () => fx.next ?? fx.ROUND }));
vi.mock('../audio/speak', () => ({
  speak: vi.fn(),
  speakEnglish: vi.fn(),
  isSpeechAvailable: () => true,
}));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import PossessiveGame from './PossessiveGame';
import { speak, speakEnglish } from '../audio/speak';
import { playDing } from '../audio/sfx';
import { ActivityContext } from '../game/activityContext';

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
      <PossessiveGame items={[fx.CAT]} onExit={vi.fn()} />
      <StarsProbe />
    </ProfileProvider>,
  );
}

const tile = (form: string) => screen.getByText(form, { selector: '.word-tile' }).closest('button')!;

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  localStorage.clear();
  seedChild();
  fx.next = null;
  vi.clearAllMocks();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('PossessiveGame (Kenen?)', () => {
  it('shows the picture + English gloss and the possessor form tiles', async () => {
    renderGame();
    expect(screen.getByText('🐱')).toBeInTheDocument();
    expect(screen.getByText('my cat')).toBeInTheDocument();
    for (const form of ['kissani', 'kissasi', 'kissansa']) {
      expect(screen.getByText(form, { selector: '.word-tile' })).toBeInTheDocument();
    }
    await advance(400);
    expect(speakEnglish).toHaveBeenCalledWith('my cat'); // English cue, never Finnish
    expect(speak).not.toHaveBeenCalled();
  });

  it('rewards the right suffix, speaks it, and credits word + grammar SRS', async () => {
    renderGame();
    fireEvent.click(tile('kissani')); // 1sg = "my cat"
    expect(playDing).toHaveBeenCalledWith(true);
    expect(speak).toHaveBeenCalledWith('kissani');
    expect(screen.getByTestId('stars')).toHaveTextContent('1');
    const saved = JSON.parse(localStorage.getItem('fkg.profiles.v2')!);
    expect(saved.children[0].srs['cat'].seen).toBe(1);
    expect(saved.children[0].srs['con:possessive'].seen).toBe(1);
    await advance(1000);
  });

  it('buzzes a wrong possessor without a star', () => {
    renderGame();
    fireEvent.click(tile('kissasi')); // 2sg = "your cat", wrong here
    expect(playDing).toHaveBeenCalledWith(false);
    expect(tile('kissasi').className).toContain('word-tile--wrong');
    expect(screen.getByTestId('stars')).toHaveTextContent('0');
  });

  it('an empty round never stalls: it completes the segment instead of blanking', async () => {
    fx.next = [];
    const onSegmentComplete = vi.fn();
    render(
      <ProfileProvider>
        <ActivityContext.Provider value={{ onSegmentComplete, sessionStars: 0 }}>
          <PossessiveGame items={[]} onExit={vi.fn()} />
        </ActivityContext.Provider>
      </ProfileProvider>,
    );
    expect(document.querySelector('.word-tile')).toBeNull();
    await act(async () => {});
    expect(onSegmentComplete).toHaveBeenCalled();
  });
});

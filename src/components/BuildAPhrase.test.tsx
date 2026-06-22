import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { Construction, LexicalItem } from '../content/types';
import { ProfileProvider, useProfile } from '../state/profile';

// A deterministic phrase round. formFor()/sentenceFor() stay real, so the items
// carry the nominative_singular form the "Tämä on ___." construction needs.
const fx = vi.hoisted(() => {
  const mk = (id: string, fi: string, emoji: string): LexicalItem => ({
    id,
    fi,
    en: id,
    emoji,
    tier: 2,
    inflections: { nominative_singular: fi },
  });
  const CON: Construction = {
    id: 'this-is',
    before: 'Tämä on',
    punct: '.',
    en: 'This is a ___.',
    tier: 2,
    case: 'nominative',
    number: 'singular',
  };
  return {
    ITEM: mk('cat', 'kissa', '🐱'),
    OTHER: mk('dog', 'koira', '🐶'),
    FILLER: mk('cow', 'lehmä', '🐮'),
    CON,
  };
});

vi.mock('../game/round', () => ({
  buildPhraseRound: () =>
    Array.from({ length: 6 }, () => ({
      construction: fx.CON,
      item: fx.ITEM,
      options: [fx.ITEM, fx.OTHER, fx.FILLER],
    })),
}));
vi.mock('../audio/speak', () => ({ speak: vi.fn(), isSpeechAvailable: () => true }));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import BuildAPhrase from './BuildAPhrase';
import { playDing } from '../audio/sfx';

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
      <BuildAPhrase
        items={[fx.ITEM, fx.OTHER, fx.FILLER]}
        constructions={[fx.CON]}
        onExit={vi.fn()}
      />
      <StarsProbe />
    </ProfileProvider>,
  );
}

const correctTile = () => screen.getByText('kissa').closest('button') as HTMLButtonElement;
const wrongTile = () => screen.getByText('koira').closest('button') as HTMLButtonElement;

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

describe('BuildAPhrase', () => {
  it('renders the first question with three word tiles', () => {
    renderActivity();
    expect(screen.getByLabelText('Question 1 of 6')).toBeInTheDocument();
    expect(document.querySelectorAll('.word-tile')).toHaveLength(3);
  });

  it('fills the slot, awards a star and advances on a correct tap', async () => {
    renderActivity();
    fireEvent.click(correctTile());

    expect(playDing).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('stars')).toHaveTextContent('1');
    expect(document.querySelector('.phrase-slot--filled')).not.toBeNull();

    await advance(1200);
    expect(screen.getByLabelText('Question 2 of 6')).toBeInTheDocument();
  });

  it('highlights a wrong tap without advancing or awarding a star', async () => {
    renderActivity();
    fireEvent.click(wrongTile());

    expect(playDing).toHaveBeenCalledWith(false);
    expect(wrongTile().className).toContain('word-tile--wrong');

    await advance(100);
    expect(screen.getByLabelText('Question 1 of 6')).toBeInTheDocument();
    expect(screen.getByTestId('stars')).toHaveTextContent('0');
  });

  it('reaches RoundComplete with full marks after the whole round', async () => {
    renderActivity();
    for (let q = 0; q < 6; q++) {
      fireEvent.click(correctTile());
      await advance(1200);
    }
    expect(screen.getByText(/Great job/i)).toBeInTheDocument();
    expect(screen.getByText(/6\s*\/\s*6/)).toBeInTheDocument();
    expect(screen.getByTestId('stars')).toHaveTextContent('6');
  });
});

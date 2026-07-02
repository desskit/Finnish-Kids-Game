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
import { speak } from '../audio/speak';
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

// 'kissa' can also appear in the filled phrase-slot once chosen, so scope
// the lookup to the tile tray.
const correctTile = () =>
  screen.getByText('kissa', { selector: '.word-tiles *' }).closest('button') as HTMLButtonElement;
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

  it('never speaks the phrase (or offers a Listen button) before an answer', async () => {
    renderActivity();
    await advance(1000); // past the old auto-speak delay, just in case
    expect(speak).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /hear the sentence again/i })).toBeNull();
  });

  it('fills the slot, awards a star, speaks the phrase, and advances on a correct tap', async () => {
    renderActivity();
    fireEvent.click(correctTile());

    expect(playDing).toHaveBeenCalledWith(true);
    expect(speak).toHaveBeenCalledWith('Tämä on kissa.');
    expect(screen.getByTestId('stars')).toHaveTextContent('1');
    expect(document.querySelector('.phrase-slot--filled')).not.toBeNull();
    expect(correctTile().className).toContain('word-tile--correct');
    // TTS is available for replay now that it's answered.
    expect(screen.getByRole('button', { name: /hear the sentence again/i })).toBeInTheDocument();

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

  it('rolls straight into a fresh round after the last question — no interstitial', async () => {
    renderActivity();
    for (let q = 0; q < 6; q++) {
      fireEvent.click(correctTile());
      await advance(1200);
    }
    // Endless play: no celebration screen, the next question is just there
    // (standalone fallback restarts the component's own round).
    expect(screen.queryByText(/Great job/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Question 1 of 6')).toBeInTheDocument();
    expect(document.querySelectorAll('.word-tile')).toHaveLength(3);
    expect(screen.getByTestId('stars')).toHaveTextContent('6');
  });
});

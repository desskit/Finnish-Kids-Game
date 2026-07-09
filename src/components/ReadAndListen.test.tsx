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
  return { CAT: mk('cat', 'kissa', '🐱'), DOG: mk('dog', 'koira', '🐶'), COW: mk('cow', 'lehmä', '🐮') };
});

vi.mock('../game/round', () => ({
  buildReadingRound: () =>
    Array.from({ length: 6 }, () => ({
      sentence: { fi: 'Pidän kissoista.', en: 'I like cats.' },
      item: fx.CAT,
      options: [fx.CAT, fx.DOG, fx.COW],
    })),
}));
vi.mock('../audio/speak', () => ({ speak: vi.fn(), speakEnglish: vi.fn(), isSpeechAvailable: () => true }));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import ReadAndListen from './ReadAndListen';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';

function seedChild() {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [{ id: 'k', name: 'K', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {} }],
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
      <ReadAndListen items={[fx.CAT, fx.DOG, fx.COW]} onExit={vi.fn()} />
      <StarsProbe />
    </ProfileProvider>,
  );
}

const card = (emoji: string) => screen.getByText(emoji).closest('button') as HTMLButtonElement;

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

describe('ReadAndListen (authentic reading)', () => {
  it('shows + reads the Finnish sentence, with the English hidden at first', async () => {
    renderActivity();
    expect(screen.getByText('Pidän kissoista.', { selector: '.reading-sentence' })).toBeInTheDocument();
    // The English gloss is present but not revealed yet.
    expect(document.querySelector('.reading-gloss--shown')).toBeNull();
    await advance(500);
    expect(speak).toHaveBeenCalledWith('Pidän kissoista.');
  });

  it('reveals the meaning, awards a star, and credits SRS on the right picture', async () => {
    renderActivity();
    vi.clearAllMocks();
    fireEvent.click(card('🐱'));
    expect(playDing).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('stars')).toHaveTextContent('1');
    expect(card('🐱').className).toContain('pic-card--correct');
    // English revealed as the payoff.
    expect(document.querySelector('.reading-gloss--shown')).not.toBeNull();
    expect(screen.getByText('I like cats.')).toBeInTheDocument();
    await advance(1700);
  });

  it('names the tapped picture on a wrong pick, no star', () => {
    renderActivity();
    vi.clearAllMocks();
    fireEvent.click(card('🐶'));
    expect(playDing).toHaveBeenCalledWith(false);
    expect(speak).toHaveBeenCalledWith('koira');
    expect(screen.getByTestId('stars')).toHaveTextContent('0');
    expect(document.querySelector('.reading-gloss--shown')).toBeNull(); // meaning stays hidden
  });
});

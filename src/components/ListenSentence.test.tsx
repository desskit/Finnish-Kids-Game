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
  buildComprehensionRound: () =>
    Array.from({ length: 6 }, () => ({
      sentence: 'Tämä on kissa.',
      item: fx.TARGET,
      options: [fx.TARGET, fx.OTHER, fx.FILLER],
    })),
}));
vi.mock('../audio/speak', () => ({
  speak: vi.fn(),
  speakEnglish: vi.fn(),
  isSpeechAvailable: () => true,
}));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import ListenSentence from './ListenSentence';
import { speak, speakEnglish } from '../audio/speak';
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
      <ListenSentence items={[fx.TARGET, fx.OTHER, fx.FILLER]} constructions={[]} onExit={vi.fn()} />
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

describe('ListenSentence (sentence-level comprehension)', () => {
  it('shows picture cards and no English text (pure Finnish comprehension)', () => {
    renderActivity();
    expect(document.querySelectorAll('.pic-card')).toHaveLength(3);
    expect(screen.queryByText('cat')).not.toBeInTheDocument();
  });

  it('plays the full Finnish sentence on a new question, never English', async () => {
    renderActivity();
    await advance(400);
    expect(speak).toHaveBeenCalledWith('Tämä on kissa.');
    expect(speakEnglish).not.toHaveBeenCalled();
  });

  it('awards a star and replays the sentence on the correct picture', async () => {
    renderActivity();
    vi.clearAllMocks();
    fireEvent.click(card('🐱'));
    expect(playDing).toHaveBeenCalledWith(true);
    expect(speak).toHaveBeenCalledWith('Tämä on kissa.');
    expect(screen.getByTestId('stars')).toHaveTextContent('1');
    expect(card('🐱').className).toContain('pic-card--correct');
    await advance(1000);
  });

  it('names the tapped picture on a wrong pick (still teaches)', () => {
    renderActivity();
    vi.clearAllMocks();
    fireEvent.click(card('🐶'));
    expect(playDing).toHaveBeenCalledWith(false);
    expect(speak).toHaveBeenCalledWith('koira');
    expect(card('🐶').className).toContain('pic-card--wrong');
    expect(screen.getByTestId('stars')).toHaveTextContent('0');
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProfileProvider, useProfile } from '../state/profile';
import { ActivityContext } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';

// A deterministic two-page, two-question story so the flow is fully scripted.
const fx = vi.hoisted(() => {
  const story = {
    id: 'test-story',
    titleFi: 'Testitarina',
    titleEn: 'Test story',
    icon: '📚',
    tier: 2,
    pages: [
      { fi: 'Tämä on kissa.', en: 'This is a cat.', emoji: '🐱' },
      { fi: 'Kissa nukkuu.', en: 'The cat sleeps.', emoji: '😴' },
    ],
    questions: [] as unknown[],
  };
  const q1 = {
    promptFi: 'Mikä nukkuu?',
    promptEn: 'What sleeps?',
    options: [
      { fi: 'kissa', en: 'cat', emoji: '🐱', correct: true },
      { fi: 'koira', en: 'dog', emoji: '🐶' },
    ],
  };
  return {
    ROUND: {
      story,
      questions: [{ question: q1, options: q1.options }],
    },
  };
});

vi.mock('../game/round', () => ({ buildStory: () => fx.ROUND }));
vi.mock('../audio/speak', () => ({ speak: vi.fn(), isSpeechAvailable: () => true }));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import StoryTime from './StoryTime';
import { speak } from '../audio/speak';
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

function renderStory(level = 1) {
  return render(
    <ProfileProvider>
      <ActivityContext.Provider
        value={{ onSegmentComplete: vi.fn(), difficulty: difficultyFor(level), sessionStars: 0 }}
      >
        <StoryTime onExit={vi.fn()} />
        <StarsProbe />
      </ActivityContext.Provider>
    </ProfileProvider>,
  );
}

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

describe('StoryTime (Satuhetki)', () => {
  it('reads page by page: shows the page, speaks it, and Next advances', async () => {
    renderStory();
    expect(screen.getByText('Tämä on kissa.')).toBeInTheDocument();
    expect(screen.getByText('This is a cat.')).toBeInTheDocument(); // glossed at L1
    await advance(400);
    expect(speak).toHaveBeenCalledWith('Tämä on kissa.', { queue: true });

    fireEvent.click(screen.getByRole('button', { name: /seuraava/i }));
    expect(screen.getByText('Kissa nukkuu.')).toBeInTheDocument();
  });

  it('after the last page, asks the comprehension question with labeled picture options', async () => {
    renderStory();
    fireEvent.click(screen.getByRole('button', { name: /seuraava/i }));
    // Last page → the button becomes "Kysymykset" (questions).
    fireEvent.click(screen.getByRole('button', { name: /kysymykset/i }));

    expect(screen.getByText('Mikä nukkuu?')).toBeInTheDocument();
    const cards = document.querySelectorAll('.pic-card');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('kissa')).toBeInTheDocument(); // the fi label on the card
    await advance(400);
    expect(speak).toHaveBeenCalledWith('Mikä nukkuu?', { queue: true });
  });

  it('a correct tap dings, speaks the answer, and awards a star', () => {
    renderStory();
    fireEvent.click(screen.getByRole('button', { name: /seuraava/i }));
    fireEvent.click(screen.getByRole('button', { name: /kysymykset/i }));
    fireEvent.click(screen.getByText('kissa').closest('button')!);
    expect(playDing).toHaveBeenCalledWith(true);
    expect(speak).toHaveBeenCalledWith('kissa');
    expect(screen.getByTestId('stars')).toHaveTextContent('1');
  });

  it('a wrong tap buzzes without advancing; pages are never scored', () => {
    renderStory();
    fireEvent.click(screen.getByRole('button', { name: /seuraava/i }));
    fireEvent.click(screen.getByRole('button', { name: /kysymykset/i }));
    fireEvent.click(screen.getByText('koira').closest('button')!);
    expect(playDing).toHaveBeenCalledWith(false);
    expect(screen.getByText('Mikä nukkuu?')).toBeInTheDocument(); // same question
    expect(screen.getByTestId('stars')).toHaveTextContent('0');
  });

  it('drops the English gloss at the Finnish-only rung (L5)', () => {
    renderStory(5);
    expect(screen.getByText('Tämä on kissa.')).toBeInTheDocument();
    expect(screen.queryByText('This is a cat.')).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { LexicalItem } from '../content/types';
import { ProfileProvider, useProfile } from '../state/profile';

const fx = vi.hoisted(() => ({
  ITEM: { id: 'cat', fi: 'kissa', en: 'cat', emoji: '🐱', tier: 1, inflections: { nominative_singular: 'kissa' } } as LexicalItem,
  // Captures the handlers the component hands to listenOnce, so a test can
  // drive recognition results/errors.
  speech: { handlers: null as null | { onResult: (t: string[]) => void; onError: (k: string) => void }, available: true },
}));

vi.mock('../game/round', () => ({
  buildSayRound: () =>
    Array.from({ length: 6 }, () => ({ say: 'kissa', gloss: 'cat', emoji: '🐱', attemptId: 'cat' })),
}));
vi.mock('../audio/speak', () => ({ speak: vi.fn(), speakEnglish: vi.fn(), isSpeechAvailable: () => true }));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));
vi.mock('../audio/speech', () => ({
  isSpeechRecognitionAvailable: () => fx.speech.available,
  listenOnce: (h: { onResult: (t: string[]) => void; onError: (k: string) => void }) => {
    fx.speech.handlers = h;
    return { stop: vi.fn() };
  },
}));

import SayIt from './SayIt';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import { ActivityContext } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';

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
      <SayIt items={[fx.ITEM]} constructions={[]} onExit={vi.fn()} />
      <StarsProbe />
    </ProfileProvider>,
  );
}

const mic = () => screen.getByRole('button', { name: /tap and say the word|i said it/i });

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('fkg.speak.introSeen', '1'); // skip the one-time notice
  seedChild();
  fx.speech.handlers = null;
  fx.speech.available = true;
  vi.clearAllMocks();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('SayIt (speaking)', () => {
  it('shows the Finnish target + gloss and models the pronunciation', async () => {
    renderActivity();
    expect(screen.getByText('kissa', { selector: '.say-target' })).toBeInTheDocument();
    expect(screen.getByText('cat')).toBeInTheDocument();
    await advance(500);
    expect(speak).toHaveBeenCalledWith('kissa'); // modeled up front (repeat-after-me)
  });

  it('accepts a recognized attempt: star + ding + advance', async () => {
    renderActivity();
    vi.clearAllMocks();
    fireEvent.click(mic());
    // Drive a matching recognition result.
    act(() => fx.speech.handlers!.onResult(['kissa']));
    expect(playDing).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('stars')).toHaveTextContent('1');
    expect(screen.getByText(/great/i)).toBeInTheDocument();
    // Per-sound feedback strip, all sounds good on an exact match.
    expect(document.querySelector('.pron-strip')).toBeInTheDocument();
    expect(document.querySelectorAll('.sound--good').length).toBe(4); // k·i·ss·a
    await advance(1000);
  });

  it('flags a vowel/consonant LENGTH slip while still passing kindly', () => {
    renderActivity();
    vi.clearAllMocks();
    fireEvent.click(mic());
    // Said the long "ss" short — a real word to the recognizer, but the length
    // is wrong. matchSpeech is generous enough to pass; the strip flags the slip.
    act(() => fx.speech.handlers!.onResult(['kisa']));
    expect(screen.getByTestId('stars')).toHaveTextContent('1'); // kind pass
    expect(document.querySelector('.sound--length')).toBeInTheDocument();
    expect(screen.getByText(/mind the long sound/i)).toBeInTheDocument();
  });

  it('shows the feedback strip even on a miss, so the child sees what to fix', () => {
    renderActivity();
    vi.clearAllMocks();
    fireEvent.click(mic());
    act(() => fx.speech.handlers!.onResult(['talo'])); // mostly wrong sounds
    expect(document.querySelector('.pron-strip')).toBeInTheDocument();
    expect(document.querySelectorAll('.sound--off, .sound--missing').length).toBeGreaterThan(0);
  });

  it('never blocks: two unrecognized tries advance anyway, no star', async () => {
    renderActivity();
    vi.clearAllMocks();
    fireEvent.click(mic());
    act(() => fx.speech.handlers!.onResult(['koira'])); // miss 1
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
    expect(screen.getByTestId('stars')).toHaveTextContent('0');

    fireEvent.click(mic());
    act(() => fx.speech.handlers!.onResult(['koira'])); // miss 2 → give up + advance
    expect(screen.getByText(/good try/i)).toBeInTheDocument();
    expect(screen.getByTestId('stars')).toHaveTextContent('0');
    await advance(1400); // advances to the next question without blocking
  });

  it('shows the one-time mic notice first, then the game after dismiss', () => {
    localStorage.removeItem('fkg.speak.introSeen');
    renderActivity();
    expect(screen.getByText(/speaking practice/i)).toBeInTheDocument();
    expect(screen.queryByText('kissa', { selector: '.say-target' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /selv|ok/i }));
    expect(screen.getByText('kissa', { selector: '.say-target' })).toBeInTheDocument();
  });

  it('falls back to a self-report button when recognition is unavailable', () => {
    fx.speech.available = false;
    renderActivity();
    const btn = screen.getByRole('button', { name: /i said it/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.getByTestId('stars')).toHaveTextContent('1'); // kind: still rewards practice
  });

  it('an empty round never stalls: it completes the segment instead of blanking', async () => {
    const onSegmentComplete = vi.fn();
    render(
      <ProfileProvider>
        <ActivityContext.Provider value={{ onSegmentComplete, sessionStars: 0 }}>
          <SayIt items={[]} constructions={[]} buildRound={() => []} onExit={vi.fn()} />
        </ActivityContext.Provider>
      </ProfileProvider>,
    );
    // Nothing to say is rendered…
    expect(document.querySelector('.say-target')).toBeNull();
    expect(document.querySelector('.mic-button')).toBeNull();
    // …and the (empty) segment is reported so the rotation advances.
    await act(async () => {});
    expect(onSegmentComplete).toHaveBeenCalled();
  });

  function renderAtLevel(level: number) {
    return render(
      <ProfileProvider>
        <ActivityContext.Provider
          value={{ onSegmentComplete: vi.fn(), difficulty: difficultyFor(level), sessionStars: 0 }}
        >
          <SayIt items={[fx.ITEM]} constructions={[]} onExit={vi.fn()} />
        </ActivityContext.Provider>
      </ProfileProvider>,
    );
  }

  it('model band (low level): shows the Finnish, models it aloud, offers Listen', async () => {
    renderAtLevel(3);
    expect(screen.getByText('kissa', { selector: '.say-target' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hear it again/i })).toBeInTheDocument();
    await advance(500);
    expect(speak).toHaveBeenCalledWith('kissa'); // modeled
  });

  it('read band (L4): shows the Finnish but does NOT speak it, and drops Listen', async () => {
    renderAtLevel(4);
    expect(screen.getByText('kissa', { selector: '.say-target' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /hear it again/i })).toBeNull();
    await advance(500);
    expect(speak).not.toHaveBeenCalled(); // no TTS
  });

  it('recall band (L5): shows only the ENGLISH, no Finnish, no TTS', async () => {
    renderAtLevel(5);
    expect(screen.getByText('cat', { selector: '.say-target' })).toBeInTheDocument();
    expect(screen.queryByText('kissa', { selector: '.say-target' })).toBeNull();
    expect(screen.queryByRole('button', { name: /hear it again/i })).toBeNull();
    await advance(500);
    expect(speak).not.toHaveBeenCalled();
  });

  it('uses a node-specific buildRound (any skill can supply its own spoken phrase)', () => {
    render(
      <ProfileProvider>
        <SayIt
          items={[]}
          constructions={[]}
          buildRound={() => [{ say: 'kolme kissaa', gloss: 'three cats' }]}
          onExit={vi.fn()}
        />
      </ProfileProvider>,
    );
    expect(screen.getByText('kolme kissaa', { selector: '.say-target' })).toBeInTheDocument();
    expect(screen.getByText('three cats')).toBeInTheDocument();
  });
});

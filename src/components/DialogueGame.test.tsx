import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProfileProvider, useProfile } from '../state/profile';

const fx = vi.hoisted(() => ({
  Q: {
    id: 'thanks',
    prompt: { fi: 'Kiitos!', en: 'Thank you!' },
    reply: { fi: 'Ole hyvä!', en: "You're welcome!" },
    options: [
      { fi: 'Ole hyvä!', en: "You're welcome!" },
      { fi: 'Anteeksi.', en: 'Sorry.' },
      { fi: 'Näkemiin!', en: 'Goodbye!' },
    ],
  },
}));

vi.mock('../game/round', () => ({
  buildDialogueRound: () => Array.from({ length: 6 }, () => fx.Q),
}));
vi.mock('../audio/speak', () => ({ speak: vi.fn(), speakEnglish: vi.fn(), isSpeechAvailable: () => true }));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import DialogueGame from './DialogueGame';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import { ActivityContext } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';

// By default the pair has already been modelled, so the game asks straight away;
// `seen: false` is a child meeting it for the first time.
function seedChild(seen = true) {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [
        {
          id: 'k',
          name: 'K',
          avatar: '🦊',
          level: 1,
          stars: 0,
          createdAt: 1,
          progress: {},
          course: seen ? { phrasesSeen: { 'ex:thanks': 1 } } : {},
        },
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
      <DialogueGame onExit={vi.fn()} />
      <StarsProbe />
    </ProfileProvider>,
  );
}

const reply = (fi: string) => screen.getByText(fi).closest('button') as HTMLButtonElement;

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

describe('DialogueGame (choose the right reply)', () => {
  it('MODELS a never-seen pair first ("when someone says… you say back…"), then asks it', async () => {
    localStorage.clear();
    seedChild(false);
    renderActivity();
    expect(screen.getByText('Uusi fraasi!', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('…you say back:')).toBeInTheDocument();
    expect(document.querySelectorAll('.reply-tile')).toHaveLength(0); // not asked yet
    await advance(400);
    expect(speak).toHaveBeenCalledWith('Kiitos!', { queue: true });
    expect(speak).toHaveBeenCalledWith('Ole hyvä!', { queue: true });
    fireEvent.click(screen.getByText('Jatka', { exact: false }).closest('button')!);
    expect(document.querySelectorAll('.reply-tile')).toHaveLength(3);
    // Remembered for the child: the next session asks it straight away.
    const stored = JSON.parse(localStorage.getItem('fkg.profiles.v2')!);
    expect(stored.children[0].course.phrasesSeen['ex:thanks']).toBeTruthy();
  });

  it('plays the Finnish prompt and shows reply options', async () => {
    renderActivity();
    expect(screen.getByText('Kiitos!', { selector: '.dialogue-said' })).toBeInTheDocument();
    expect(document.querySelectorAll('.reply-tile')).toHaveLength(3);
    await advance(500);
    expect(speak).toHaveBeenCalledWith('Kiitos!'); // the prompt is spoken up front
  });

  it('awards a star and speaks the reply on the right choice', async () => {
    renderActivity();
    vi.clearAllMocks();
    fireEvent.click(reply('Ole hyvä!'));
    expect(playDing).toHaveBeenCalledWith(true);
    expect(speak).toHaveBeenCalledWith('Ole hyvä!');
    expect(screen.getByTestId('stars')).toHaveTextContent('1');
    expect(reply('Ole hyvä!').className).toContain('reply-tile--correct');
    await advance(1300);
  });

  it('flags a wrong reply without a star or advancing', async () => {
    renderActivity();
    fireEvent.click(reply('Anteeksi.'));
    expect(playDing).toHaveBeenCalledWith(false);
    expect(reply('Anteeksi.').className).toContain('reply-tile--wrong');
    await advance(100);
    expect(screen.getByTestId('stars')).toHaveTextContent('0');
    expect(screen.getByLabelText('Question 1 of 6')).toBeInTheDocument();
  });

  function renderAtLevel(level: number) {
    return render(
      <ProfileProvider>
        <ActivityContext.Provider
          value={{ onSegmentComplete: vi.fn(), difficulty: difficultyFor(level), sessionStars: 0 }}
        >
          <DialogueGame onExit={vi.fn()} />
        </ActivityContext.Provider>
      </ProfileProvider>,
    );
  }

  it('shows the English prompt gloss below the top rung', () => {
    renderAtLevel(3);
    expect(screen.getByText('Thank you!', { selector: '.phrase-hint' })).toBeInTheDocument();
  });

  it('goes Finnish-only at the top rung (L5): the prompt gloss is gone', () => {
    renderAtLevel(5);
    expect(screen.getByText('Kiitos!', { selector: '.dialogue-said' })).toBeInTheDocument();
    expect(screen.queryByText('Thank you!')).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProfileProvider, useProfile } from '../state/profile';

const fx = vi.hoisted(() => ({
  SCENE: {
    id: 'playground',
    titleFi: 'Leikkipuistossa',
    titleEn: 'At the playground',
    icon: '🛝',
    partnerIcon: '🧒',
    turns: [
      {
        partner: { fi: 'Moi! Mitä kuuluu?', en: 'Hi! How are you?' },
        reply: { fi: 'Hyvää, kiitos! Entä sinulle?', en: 'Good, thanks! And you?' },
        options: [
          { fi: 'Hyvää, kiitos! Entä sinulle?', en: 'Good, thanks! And you?' },
          { fi: 'Näkemiin!', en: 'Goodbye!' },
          { fi: 'Ole hyvä.', en: "You're welcome." },
        ],
      },
      {
        partner: { fi: 'Kiitos, hyvää! Leikitäänkö?', en: 'Thanks, good! Shall we play?' },
        reply: { fi: 'Joo, leikitään!', en: "Yeah, let's play!" },
        options: [
          { fi: 'Joo, leikitään!', en: "Yeah, let's play!" },
          { fi: 'Hyvää yötä.', en: 'Good night.' },
          { fi: 'Anteeksi.', en: 'Sorry.' },
        ],
      },
    ],
  },
}));

vi.mock('../game/round', () => ({ buildConversation: () => fx.SCENE }));
vi.mock('../audio/speak', () => ({ speak: vi.fn(), speakEnglish: vi.fn(), isSpeechAvailable: () => true }));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import ConversationScene from './ConversationScene';
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
      <ConversationScene onExit={vi.fn()} />
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

describe('ConversationScene (small talk)', () => {
  it('opens the scene by speaking the first partner line and showing reply tiles', async () => {
    renderActivity();
    expect(screen.getByText('Moi! Mitä kuuluu?')).toBeInTheDocument();
    expect(document.querySelectorAll('.reply-tile')).toHaveLength(3);
    await advance(500);
    // Queued so back-to-back conversation lines don't clobber each other.
    expect(speak).toHaveBeenCalledWith('Moi! Mitä kuuluu?', { queue: true });
  });

  it('advances turn by turn on the right reply, building the chat', async () => {
    renderActivity();
    vi.clearAllMocks();
    fireEvent.click(reply('Hyvää, kiitos! Entä sinulle?'));
    expect(playDing).toHaveBeenCalledWith(true);
    expect(speak).toHaveBeenCalledWith('Hyvää, kiitos! Entä sinulle?', { queue: true });
    expect(screen.getByTestId('stars')).toHaveTextContent('1');
    // The child's answered line is now a chat bubble.
    expect(document.querySelector('.chat-bubble--child')).not.toBeNull();
    // After the beat, the second partner line arrives + is spoken.
    await advance(900);
    expect(screen.getByText('Kiitos, hyvää! Leikitäänkö?')).toBeInTheDocument();
    await advance(500);
    expect(speak).toHaveBeenCalledWith('Kiitos, hyvää! Leikitäänkö?', { queue: true });
  });

  it('flags a wrong reply without a star or advancing', async () => {
    renderActivity();
    vi.clearAllMocks();
    fireEvent.click(reply('Näkemiin!'));
    expect(playDing).toHaveBeenCalledWith(false);
    expect(reply('Näkemiin!').className).toContain('reply-tile--wrong');
    await advance(100);
    expect(screen.getByTestId('stars')).toHaveTextContent('0');
    // Still on the first turn.
    expect(screen.getByText('Moi! Mitä kuuluu?')).toBeInTheDocument();
  });

  it('finishes with the completion payoff after the last turn', async () => {
    renderActivity();
    fireEvent.click(reply('Hyvää, kiitos! Entä sinulle?'));
    await advance(900);
    fireEvent.click(reply('Joo, leikitään!'));
    await advance(900);
    expect(screen.getByText(/juttelit suomeksi/i)).toBeInTheDocument();
    expect(screen.getByTestId('stars')).toHaveTextContent('2');
  });

  function renderAtLevel(level: number) {
    return render(
      <ProfileProvider>
        <ActivityContext.Provider
          value={{ onSegmentComplete: vi.fn(), difficulty: difficultyFor(level), sessionStars: 0 }}
        >
          <ConversationScene onExit={vi.fn()} />
        </ActivityContext.Provider>
      </ProfileProvider>,
    );
  }

  it('shows English glosses on bubbles + reply tiles below the top rung', () => {
    renderAtLevel(3);
    expect(screen.getByText('Hi! How are you?', { selector: '.chat-en' })).toBeInTheDocument();
    expect(document.querySelector('.reply-tile__en')).not.toBeNull();
  });

  it('goes Finnish-only at the top rung (L5): no English on bubbles or tiles', () => {
    renderAtLevel(5);
    expect(screen.getByText('Moi! Mitä kuuluu?')).toBeInTheDocument(); // Finnish stays
    expect(document.querySelector('.chat-en')).toBeNull();
    expect(document.querySelector('.reply-tile__en')).toBeNull();
    expect(screen.queryByText('Hi! How are you?')).toBeNull();
  });
});

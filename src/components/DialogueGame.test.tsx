import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProfileProvider, useProfile } from '../state/profile';

const fx = vi.hoisted(() => ({
  Q: {
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
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProfileProvider, useProfile } from '../state/profile';

vi.mock('../audio/speak', () => ({
  speak: vi.fn(),
  speakEnglish: vi.fn(),
  isSpeechAvailable: () => true,
}));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import SpellWord from './SpellWord';
import { speak, speakEnglish } from '../audio/speak';
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

const SENTENCE_ROUND = Array.from({ length: 2 }, () => ({
  text: 'minä menen kotiin.',
  gloss: 'I go home.',
}));

function renderSentenceTyping() {
  return render(
    <ProfileProvider>
      <SpellWord buildRound={() => SENTENCE_ROUND} speakTarget={false} onExit={vi.fn()} />
      <StarsProbe />
    </ProfileProvider>,
  );
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

describe('SpellWord sentence-typing apex', () => {
  it('shows the English gloss, no emoji, and no way to hear the Finnish answer', () => {
    renderSentenceTyping();
    expect(screen.getByText('I go home.')).toBeInTheDocument();
    expect(document.querySelector('.phrase-emoji')).toBeNull();
    expect(screen.queryByRole('button', { name: /hear the word again/i })).toBeNull();
    expect(screen.getByText(/write it in finnish/i)).toBeInTheDocument();
  });

  it('never auto-plays or lets the child hear the target sentence, but does narrate the English gloss', async () => {
    renderSentenceTyping();
    await act(async () => vi.advanceTimersByTimeAsync(500));
    expect(speak).not.toHaveBeenCalled();
    expect(speakEnglish).toHaveBeenCalledWith('I go home.');
  });

  it('offers a Listen button that replays the English gloss, never Finnish', () => {
    renderSentenceTyping();
    const btn = screen.getByRole('button', { name: /hear the prompt again/i });
    vi.clearAllMocks();
    fireEvent.click(btn);
    expect(speakEnglish).toHaveBeenCalledWith('I go home.');
    expect(speak).not.toHaveBeenCalled();
  });

  it('accepts the sentence even without the trailing period', async () => {
    renderSentenceTyping();
    const input = screen.getByLabelText(/type the word you hear/i);
    fireEvent.change(input, { target: { value: 'minä menen kotiin' } });
    expect(playDing).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('stars')).toHaveTextContent('1');
  });

  it('accepts the sentence typed with the trailing period too', async () => {
    renderSentenceTyping();
    const input = screen.getByLabelText(/type the word you hear/i);
    fireEvent.change(input, { target: { value: 'minä menen kotiin.' } });
    expect(playDing).toHaveBeenCalledWith(true);
  });

  it('rejects a genuinely wrong sentence without awarding a star', () => {
    renderSentenceTyping();
    const input = screen.getByLabelText(/type the word you hear/i);
    fireEvent.change(input, { target: { value: 'minä menen kouluun.' } });
    expect(playDing).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('stars')).toHaveTextContent('0');
  });

  it('rolls into a fresh sentence after the round — no SRS id to crash on', async () => {
    renderSentenceTyping();
    for (let i = 0; i < SENTENCE_ROUND.length; i++) {
      const input = screen.getByLabelText(/type the word you hear/i);
      fireEvent.change(input, { target: { value: 'minä menen kotiin.' } });
      await act(async () => vi.advanceTimersByTimeAsync(1200));
    }
    expect(screen.getByText('I go home.')).toBeInTheDocument();
  });
});

describe('SpellWord stuck-child helpers (reveal a letter + skip)', () => {
  const CAT = {
    id: 'cat',
    fi: 'kissa',
    en: 'cat',
    emoji: '🐱',
    tier: 1 as const,
    inflections: { nominative_singular: 'kissa' },
  };
  function renderSpeller() {
    return render(
      <ProfileProvider>
        <SpellWord items={[CAT]} onExit={vi.fn()} />
        <StarsProbe />
      </ProfileProvider>,
    );
  }
  const reveal = () => screen.getByRole('button', { name: /letter/i });
  const skip = () => screen.getByRole('button', { name: /skip/i });
  const input = () => screen.getByLabelText(/type the word you hear/i) as HTMLInputElement;

  it('reveals leading letters into the input, one per press, max 3', () => {
    renderSpeller();
    expect(reveal()).toHaveTextContent('3'); // remaining uses
    fireEvent.click(reveal());
    expect(input().value).toBe('k');
    fireEvent.click(reveal());
    expect(input().value).toBe('ki');
    fireEvent.click(reveal());
    expect(input().value).toBe('kis'); // never the whole 5-letter word
    expect(reveal()).toBeDisabled(); // 3 used up
  });

  it('a revealed word can still be completed by typing the rest (star still given)', async () => {
    renderSpeller();
    fireEvent.click(reveal()); // "k"
    fireEvent.change(input(), { target: { value: 'kissa' } });
    expect(playDing).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('stars')).toHaveTextContent('1');
  });

  it('reveal respects what the child typed: it appends past a correct prefix, not clobbers', () => {
    renderSpeller();
    fireEvent.change(input(), { target: { value: 'ki' } }); // correct so far (kissa)
    fireEvent.click(reveal());
    expect(input().value).toBe('kis'); // appended the next letter, kept "ki"
  });

  it('reveal corrects a wrong prefix to the right letters', () => {
    renderSpeller();
    fireEvent.change(input(), { target: { value: 'xx' } }); // wrong
    fireEvent.click(reveal());
    expect(input().value).toBe('k'); // reset to the correct leading letter
  });

  it('Skip moves on without a star and without a wrong buzz', () => {
    render(
      <ProfileProvider>
        <SpellWord items={[CAT, { ...CAT, id: 'dog', fi: 'koira', en: 'dog', emoji: '🐶' }]} onExit={vi.fn()} />
        <StarsProbe />
      </ProfileProvider>,
    );
    vi.clearAllMocks();
    fireEvent.click(skip());
    expect(playDing).not.toHaveBeenCalledWith(false); // no penalty buzz
    expect(screen.getByTestId('stars')).toHaveTextContent('0');
    // Advanced to a fresh question (input cleared).
    expect((screen.getByLabelText(/type the word you hear/i) as HTMLInputElement).value).toBe('');
  });
});

describe('SpellWord default (bare-word) mode is unaffected', () => {
  it('still auto-speaks and shows the Listen button', async () => {
    render(
      <ProfileProvider>
        <SpellWord
          items={[
            {
              id: 'cat',
              fi: 'kissa',
              en: 'cat',
              emoji: '🐱',
              tier: 1,
              inflections: { nominative_singular: 'kissa' },
            },
          ]}
          onExit={vi.fn()}
        />
      </ProfileProvider>,
    );
    await act(async () => vi.advanceTimersByTimeAsync(500));
    expect(speak).toHaveBeenCalledWith('kissa');
    expect(screen.getByRole('button', { name: /hear the word again/i })).toBeInTheDocument();
  });
});

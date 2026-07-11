import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileProvider } from '../state/profile';

// Keep the real SRS (MAX_BOX, formatForBox depends on it) but pin exactly which
// items the round contains and in what order: a box-1, a box-3, and a box-5
// item, so we can watch the format escalate recognition → production → spelling.
vi.mock('../game/srs', async (orig) => ({
  ...(await orig<typeof import('../game/srs')>()),
  selectReviewItems: () => ['cat', 'dog', 'bear'],
}));
vi.mock('../audio/speak', () => ({
  speak: vi.fn(),
  speakEnglish: vi.fn(),
  isSpeechAvailable: () => true,
}));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import ReviewActivity from './ReviewActivity';
import { speak, speakEnglish } from '../audio/speak';
import { playDing } from '../audio/sfx';

// cat/dog/bear are real animals items; their sourced Finnish forms are stable.
function seedChild() {
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
          srs: {
            cat: { box: 1, due: 0, seen: 2, correct: 1, lastSeenAt: 1 },
            dog: { box: 3, due: 0, seen: 6, correct: 5, lastSeenAt: 1 },
            bear: { box: 5, due: 0, seen: 9, correct: 9, lastSeenAt: 1 },
          },
        },
      ],
      activeId: 'k',
      settings: { muted: false, reducedMotion: false },
    }),
  );
}

function renderReview() {
  return render(
    <MemoryRouter>
      <ProfileProvider>
        <ReviewActivity />
      </ProfileProvider>
    </MemoryRouter>,
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

describe('ReviewActivity — format escalates with SRS box', () => {
  it('box 1 → recognition (hear Finnish, tap a picture)', async () => {
    renderReview();
    // Recognition shows the picture-card grid and plays the Finnish word.
    expect(document.querySelectorAll('.pic-card').length).toBeGreaterThan(0);
    expect(document.querySelector('.spell-input')).toBeNull();
    await advance(400);
    expect(speak).toHaveBeenCalledWith('kissa');
    expect(speakEnglish).not.toHaveBeenCalled();
  });

  it('box 3 → production pick (English cue, choose the Finnish word)', async () => {
    renderReview();
    // Answer the box-1 recognition question (tap the cat picture) to advance.
    fireEvent.click(screen.getByText('🐱').closest('button')!);
    await advance(1000);

    // Now the box-3 word: production tiles + English gloss, cued in English.
    expect(document.querySelectorAll('.word-tile').length).toBeGreaterThan(0);
    expect(screen.getByText('dog')).toBeInTheDocument();
    await advance(400);
    expect(speakEnglish).toHaveBeenCalledWith('dog');
  });

  it('box 5 → spelling (type the Finnish from the English cue)', async () => {
    renderReview();
    fireEvent.click(screen.getByText('🐱').closest('button')!); // box-1 done
    await advance(1000);
    fireEvent.click(screen.getByText('koira').closest('button')!); // box-3 done
    await advance(1000); // clear the advance timeout → mount box-5
    await advance(400); // let the box-5 mount cue fire

    // Box-5 mastered word: a spelling input, cued in English (never Finnish).
    expect(speakEnglish).toHaveBeenCalledWith('bear');
    const input = screen.getByLabelText(/type the word in finnish/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(document.querySelector('.pic-card')).toBeNull();
    expect(document.querySelector('.word-tile')).toBeNull();

    vi.clearAllMocks();
    fireEvent.change(input, { target: { value: 'karhu' } });
    expect(playDing).toHaveBeenCalledWith(true); // 'karhu' accepted
  });

  it('box 5 spelling offers reveal-a-letter (max 3) + skip for a stuck child', async () => {
    renderReview();
    fireEvent.click(screen.getByText('🐱').closest('button')!);
    await advance(1000);
    fireEvent.click(screen.getByText('koira').closest('button')!);
    await advance(1000);
    await advance(400);

    const input = () => screen.getByLabelText(/type the word in finnish/i) as HTMLInputElement;
    const reveal = () => screen.getByRole('button', { name: /letter/i });
    expect(reveal()).toHaveTextContent('3'); // three uses to start
    fireEvent.click(reveal());
    expect(input().value).toBe('k'); // karhu → "k"
    fireEvent.click(reveal());
    fireEvent.click(reveal());
    expect(input().value).toBe('kar'); // stops one short of the whole word
    expect(reveal()).toBeDisabled();

    // Skip advances past the (last) question → round completes without a crash.
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(screen.getByText(/great job/i)).toBeInTheDocument(); // RoundComplete
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProfileProvider } from '../state/profile';
import { nounConstructions } from '../content/constructions';
import { itemById } from '../content/lookup';

vi.mock('../audio/speak', () => ({
  speak: vi.fn(),
  speakEnglish: vi.fn(),
  isSpeechAvailable: () => true,
}));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import HearIt from './HearIt';
import { speak } from '../audio/speak';

beforeEach(() => {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [{ id: 'k', name: 'K', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {} }],
      activeId: 'k',
      settings: { muted: false, reducedMotion: false },
    }),
  );
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const box = itemById('box')!;
const cons = nounConstructions.filter((c) => ['into-it', 'in-it', 'out-of-it'].includes(c.id));

describe('Kuuntele (hear it, pick the meaning)', () => {
  it('says the sentence, hides the text until a pick, explains a wrong one, then moves on', async () => {
    render(
      <ProfileProvider>
        <HearIt source="carriers" items={[box]} constructions={cons} onExit={vi.fn()} />
      </ProfileProvider>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    const said = vi.mocked(speak).mock.calls.at(-1)![0];
    expect(['Kissa menee laatikkoon.', 'Kissa on laatikossa.', 'Kissa tulee laatikosta.']).toContain(said);
    // The Finnish isn't on screen before choosing.
    expect(screen.queryByText(/laatiko/)).not.toBeInTheDocument();
    const meaning: Record<string, string> = {
      'Kissa menee laatikkoon.': 'The cat goes into the box.',
      'Kissa on laatikossa.': 'The cat is in the box.',
      'Kissa tulee laatikosta.': 'The cat comes out of the box.',
    };
    const wrong = Object.entries(meaning).find(([fi]) => fi !== said)![1];
    fireEvent.click(screen.getByText(wrong).closest('button')!);
    // A wrong pick: the sentence appears (ending marked) with the Why.
    expect(document.querySelector('.hear-text--shown')?.textContent).toBe(said);
    expect(screen.getByText(/You heard/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(meaning[said]).closest('button')!);
    expect(document.querySelector('.word-tile--correct')).not.toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(screen.getByText('Mitä kuulit?')).toBeInTheDocument();
  });

  it('offers a slow replay', async () => {
    render(
      <ProfileProvider>
        <HearIt source="carriers" items={[box]} constructions={cons} onExit={vi.fn()} />
      </ProfileProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Hear it slowly' }));
    expect(vi.mocked(speak).mock.calls.at(-1)![1]).toEqual({ slow: true });
  });
});

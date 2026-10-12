import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { LexicalItem } from '../content/types';
import { ProfileProvider } from '../state/profile';

const fx = vi.hoisted(() => {
  const noun = (id: string, fi: string, part: string, emoji: string): LexicalItem => ({
    id,
    fi,
    en: id,
    emoji,
    tier: 1,
    english: { plural: `${id}s` },
    inflections: { nominative_singular: fi, partitive_singular: part },
  });
  const num = (id: string, fi: string, value: number): LexicalItem => ({
    id,
    fi,
    en: id,
    tier: 1,
    value,
    inflections: { nominative_singular: fi },
  });
  const BOOK = noun('book', 'kirja', 'kirjaa', '📕');
  const BALL = noun('ball', 'pallo', 'palloa', '⚽');
  const ONE = num('one', 'yksi', 1);
  const THREE = num('three', 'kolme', 3);
  return { BOOK, BALL, ONE, THREE };
});

vi.mock('../game/round', () => ({
  buildCountingRound: () => [
    { number: fx.THREE, noun: fx.BOOK, numberOptions: [fx.ONE, fx.THREE], nounOptions: [fx.BOOK, fx.BALL] },
  ],
}));
vi.mock('../audio/speak', () => ({ speak: vi.fn(), speakEnglish: vi.fn(), isSpeechAvailable: () => true }));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import CountAndSay from './CountAndSay';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [{ id: 'k', name: 'K', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {} }],
      activeId: 'k',
      settings: { muted: true, reducedMotion: true },
    }),
  );
});
afterEach(cleanup);

describe('CountAndSay', () => {
  it('asks "What are these?" for the counted thing — books, not just animals', () => {
    render(
      <ProfileProvider>
        <CountAndSay nouns={[fx.BOOK, fx.BALL]} numbers={[fx.ONE, fx.THREE]} onExit={vi.fn()} />
      </ProfileProvider>,
    );
    expect(screen.getByLabelText('3 books')).toBeTruthy();
    expect(screen.getByText(/Montako\?/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /kolme/ }));
    expect(screen.getByText(/Mitä nämä ovat\?/)).toBeTruthy();
    expect(screen.getByText('What are these?')).toBeTruthy();
    expect(screen.queryByText(/Mikä eläin/)).toBeNull();
  });
});

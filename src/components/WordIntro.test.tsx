import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { LexicalItem } from '../content/types';

vi.mock('../audio/speak', () => ({ speak: vi.fn(), speakEnglish: vi.fn(), isSpeechAvailable: () => true }));

import WordIntro from './WordIntro';

afterEach(cleanup);

const mk = (id: string, fi: string, en: string): LexicalItem => ({
  id,
  fi,
  en,
  emoji: '🧒',
  tier: 1,
  inflections: { nominative_singular: fi },
});

describe('WordIntro', () => {
  it('shows an everyday second meaning under the gloss ("poika" is a boy too)', () => {
    render(<WordIntro item={mk('son', 'poika', 'son')} onContinue={() => {}} />);
    expect(screen.getByText('poika')).toBeTruthy();
    expect(screen.getByText(/also “boy”/)).toBeTruthy();
  });

  it('shows just the gloss for a word with one meaning', () => {
    render(<WordIntro item={mk('cat', 'kissa', 'cat')} onContinue={() => {}} />);
    expect(screen.getByText('cat')).toBeTruthy();
    expect(screen.queryByText(/also/)).toBeNull();
  });
});

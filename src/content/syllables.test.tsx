import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ALL_SPLITS, syllablesOf } from './syllables';
import WordIntro from '../components/WordIntro';
import { reviewItems } from '.';

// Syllables are Wiktionary's split, never the app's: every one spells its word
// back exactly, and a word without one is shown whole.

describe('syllables', () => {
  it('every split spells its word back exactly, in real pieces', () => {
    for (const [word, parts] of Object.entries(ALL_SPLITS)) {
      expect(parts.join(''), word).toBe(word);
      for (const p of parts) expect(p, word).toMatch(/^\p{L}+$/u);
    }
  });

  it('a one-syllable word, or one Wiktionary gives no split, is never split', () => {
    expect(syllablesOf('not-a-course-word')).toBeUndefined();
    const one = Object.entries(ALL_SPLITS).find(([, p]) => p.length === 1);
    if (one) expect(syllablesOf(one[0])).toBeUndefined();
  });

  it('a younger reader meets a new word split; anyone else sees it whole', () => {
    const item = reviewItems.find((i) => syllablesOf(i.fi));
    expect(item, 'some course word has a split').toBeDefined();
    const parts = syllablesOf(item!.fi)!;
    const r = render(<WordIntro item={item!} onContinue={() => {}} syllables />);
    expect(screen.getByText(parts.join(' - '))).toBeInTheDocument();
    r.unmount();
    render(<WordIntro item={item!} onContinue={() => {}} />);
    expect(screen.queryByText(parts.join(' - '))).toBeNull();
  });
});

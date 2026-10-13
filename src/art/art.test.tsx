import { render } from '@testing-library/react';
import Art, { ArtText, artForGlyph, artForItem } from './Art';
import { glyphKey, isEmoji, keycapText, splitEmoji } from './glyph';
import { ART, GLYPH_ART } from './generated/manifest';

describe('emoji in text', () => {
  it('splits words from emoji, keeping joined emoji, keycaps and flags whole', () => {
    expect(splitEmoji('🔊 Kuuntele')).toEqual([{ glyph: '🔊' }, { text: ' Kuuntele' }]);
    expect(splitEmoji('7 × 🍎')).toEqual([{ text: '7 × ' }, { glyph: '🍎' }]);
    expect(splitEmoji('🧑‍🏫1️⃣🇬🇧❤️')).toEqual([{ glyph: '🧑‍🏫' }, { glyph: '1️⃣' }, { glyph: '🇬🇧' }, { glyph: '❤️' }]);
    expect(splitEmoji('11 kissaa')).toEqual([{ text: '11 kissaa' }]);
  });

  it('knows a single emoji from text', () => {
    expect(isEmoji('🐱')).toBe(true);
    expect(isEmoji('☀️')).toBe(true);
    expect(isEmoji('🐱🐶')).toBe(false);
    expect(isEmoji('11')).toBe(false);
    expect(isEmoji('✓')).toBe(false);
  });

  it('looks emoji up with or without a variation selector', () => {
    expect(glyphKey('☀️')).toBe('☀');
    expect(artForGlyph('☀️')).toBe('sun');
    expect(artForGlyph('☀')).toBe('sun');
    expect(keycapText('3️⃣')).toBe('3');
    expect(keycapText('🔟')).toBe('10');
    expect(keycapText('🍎')).toBeUndefined();
  });
});

describe('<Art>', () => {
  it('draws the picture for an emoji', () => {
    const { container } = render(<Art glyph="🍎" />);
    const svg = container.querySelector('svg.art')!;
    expect(svg).toHaveAttribute('data-art', 'apple');
    expect(svg).toHaveAttribute('data-emoji', '🍎');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg.querySelector('use')).toHaveAttribute('href', '#art-apple');
    expect(container.textContent).toBe('');
  });

  it("prefers a word's own picture to its emoji's", () => {
    expect(artForItem({ id: 'cat', emoji: '🐱' })).toBe('cat');
    // a word with no picture of its own borrows its emoji's
    expect(artForItem({ id: 'no-such-word', emoji: '🍎' })).toBe('apple');
    const { container } = render(<Art item={{ id: 'sister', emoji: '👧' }} />);
    expect(container.querySelector('[data-art="sister"]')).not.toBeNull();
  });

  it('puts keycaps and short text on the number tile', () => {
    for (const [glyph, text] of [['3️⃣', '3'], ['🔟', '10'], ['11', '11'], ['1.', '1.']]) {
      const { container, unmount } = render(<Art glyph={glyph} />);
      const tile = container.querySelector('[data-art="tile"]')!;
      expect(tile).toHaveAttribute('data-emoji', glyph);
      expect(tile.querySelector('.art-tile__text')).toHaveTextContent(text);
      unmount();
    }
  });

  it('shows an emoji that has no picture yet as itself', () => {
    const { container } = render(<Art glyph="🦄" />);
    const fallback = container.querySelector('.art--emoji')!;
    expect(fallback).toHaveTextContent('🦄');
    expect(fallback).toHaveAttribute('data-emoji', '🦄');
  });

  it('can name the picture for a screen reader', () => {
    const { getByRole } = render(<Art glyph="🐱" label="cat" />);
    expect(getByRole('img', { name: 'cat' })).toHaveAttribute('data-art', 'cat');
  });

  it('draws the emoji inside text', () => {
    const { container } = render(
      <p>
        <ArtText text="🔊 Kuuntele" />
      </p>,
    );
    expect(container.querySelector('[data-art="speaker"]')).not.toBeNull();
    expect(container.textContent).toBe(' Kuuntele');
  });
});

describe('the manifest', () => {
  it('only maps emoji to pictures that exist', () => {
    for (const [glyph, id] of Object.entries(GLYPH_ART)) {
      expect(ART[id], glyph).toBeDefined();
      expect(glyph).toBe(glyphKey(glyph));
    }
  });
});

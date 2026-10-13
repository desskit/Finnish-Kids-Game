import { act, render } from '@testing-library/react';
import Art, { ArtText, artForGlyph, artForItem, motionSymbol } from './Art';
import { backdropUrl } from './backdrops';
import { glyphKey, isEmoji, keycapText, splitEmoji } from './glyph';
import { ART, ART_MOTION, BACKDROP_MOTION, BACKDROPS, GLYPH_ART } from './generated/manifest';

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

describe('moving pictures', () => {
  afterEach(() => {
    delete document.documentElement.dataset.reducedMotion;
  });

  it('picks the moving symbol for each kind of motion', () => {
    // Mirri's tail sways and she blinks; Aino only blinks; the sun only shimmers; the apple is still
    expect(ART_MOTION.cat).toEqual({ loop: true, blink: true });
    expect(motionSymbol('cat', 'loop')).toBe('art-cat--m');
    expect(motionSymbol('cat', 'idle')).toBe('art-cat--b');
    expect(motionSymbol('sister', 'idle')).toBe('art-sister--m');
    expect(motionSymbol('sun', 'idle')).toBeUndefined();
    expect(motionSymbol('apple', 'loop')).toBeUndefined();
    expect(motionSymbol('cat', undefined)).toBeUndefined();
  });

  it('plays a picture that moves', () => {
    const { container } = render(<Art glyph="🐱" motion="loop" />);
    const svg = container.querySelector('svg.art')!;
    expect(svg.querySelector('use')).toHaveAttribute('href', '#art-cat--m');
    expect(svg).toHaveAttribute('data-motion', 'loop');
  });

  it('only blinks on an answer card', () => {
    const { container } = render(<Art glyph="🐱" motion="idle" />);
    expect(container.querySelector('use')).toHaveAttribute('href', '#art-cat--b');
  });

  it('stays still without motion, and when reduced motion is on', () => {
    const { container, rerender } = render(<Art glyph="🐱" />);
    expect(container.querySelector('use')).toHaveAttribute('href', '#art-cat');
    rerender(<Art glyph="🐱" motion="loop" />);
    expect(container.querySelector('use')).toHaveAttribute('href', '#art-cat--m');
    // the grown-up setting (src/state/profile.tsx sets this on the root)
    act(() => {
      document.documentElement.dataset.reducedMotion = 'true';
    });
    rerender(<Art glyph="🐱" motion="loop" />);
    expect(container.querySelector('use')).toHaveAttribute('href', '#art-cat');
    expect(container.querySelector('svg.art')).not.toHaveAttribute('data-motion');
  });

  it('finds each backdrop, still and moving', () => {
    for (const [id, tones] of Object.entries(BACKDROPS)) {
      for (const tone of tones) {
        expect(backdropUrl(id as keyof typeof BACKDROPS, tone, false)).toMatch(new RegExp(`${id}-${tone}\\.svg`));
      }
    }
    expect(BACKDROP_MOTION.park).toContain('night');
    expect(backdropUrl('park', 'night', true)).toMatch(/park-night\.moving\.svg/);
  });
});

describe('the manifest', () => {
  it('only maps emoji to pictures that exist', () => {
    for (const [glyph, id] of Object.entries(GLYPH_ART)) {
      expect(ART[id], glyph).toBeDefined();
      expect(glyph).toBe(glyphKey(glyph));
    }
    for (const id of Object.keys(ART_MOTION)) expect(ART[id as keyof typeof ART], id).toBeDefined();
  });
});

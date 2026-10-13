// Emoji in text: what counts as one, how to look one up, and how to split a
// string ("🔊 Kuuntele") into its pictures and its words.

/** One emoji: a pictograph (with any joiners), a keycap (1️⃣) or a flag (🇬🇧). Only used with matchAll. */
const EMOJI = /[0-9#*]\uFE0F?\u20E3|\p{Regional_Indicator}{2}|\p{Extended_Pictographic}[\uFE0E\uFE0F]?(?:\u200D\p{Extended_Pictographic}[\uFE0E\uFE0F]?)*/gu;

/** The same, as a whole string. (Its own pattern: exec on a global one leaves state behind.) */
const ONE_EMOJI = new RegExp(`^(?:${EMOJI.source})$`, 'u');

/** The lookup key for an emoji: the same glyph with or without a variation selector. */
export function glyphKey(glyph: string): string {
  return glyph.replace(/[\uFE0E\uFE0F]/g, '');
}

/** Is this whole string a single emoji? */
export function isEmoji(s: string): boolean {
  return ONE_EMOJI.test(s);
}

/** A keycap's number ("1️⃣" → "1", "🔟" → "10"), or undefined. */
export function keycapText(glyph: string): string | undefined {
  if (glyph === '🔟') return '10';
  const m = /^([0-9#*])\uFE0F?\u20E3$/.exec(glyph);
  return m?.[1];
}

export type Piece = { text: string } | { glyph: string };

/** Split text into runs of words and single emoji, in order. */
export function splitEmoji(text: string): Piece[] {
  const pieces: Piece[] = [];
  let last = 0;
  for (const m of text.matchAll(EMOJI)) {
    const at = m.index ?? 0;
    if (at > last) pieces.push({ text: text.slice(last, at) });
    pieces.push({ glyph: m[0] });
    last = at + m[0].length;
  }
  if (last < text.length) pieces.push({ text: text.slice(last) });
  return pieces;
}

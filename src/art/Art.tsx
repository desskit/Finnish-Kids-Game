// A picture from the set, in place of an emoji. Give it the word (`item`),
// the picture's `id`, or the emoji it replaces (`glyph`). It's sized 1em, so
// it takes the font-size the emoji had. Short text in a picture's place — a
// keycap (1️⃣), a number ("11") or an ordinal ("1.") — sits on the number tile.
//
// Until every picture is drawn, an emoji with no picture yet shows as itself.

import { Fragment, useEffect } from 'react';
import { ART, GLYPH_ART, type ArtId } from './generated/manifest';
import { glyphKey, isEmoji, keycapText, splitEmoji } from './glyph';
import { ensureSprite } from './sprites';

interface Props {
  /** A word: its own picture if it has one, otherwise its emoji's. */
  item?: { id: string; emoji?: string };
  id?: ArtId;
  glyph?: string;
  className?: string;
  /** Says what the picture is to a screen reader (otherwise it's decorative). */
  label?: string;
}

/** The picture drawn for an emoji, if there is one. */
export function artForGlyph(glyph: string | undefined): ArtId | undefined {
  return glyph ? GLYPH_ART[glyphKey(glyph)] : undefined;
}

/** The picture for a word (its own, else its emoji's), if there is one. */
export function artForItem(item: { id: string; emoji?: string }): ArtId | undefined {
  return item.id in ART ? (item.id as ArtId) : artForGlyph(item.emoji);
}

/** Text that sits on the number tile instead of a picture ("3", "11", "1."). */
function tileText(glyph: string | undefined): string | undefined {
  if (!glyph) return undefined;
  const keycap = keycapText(glyph);
  if (keycap) return keycap;
  return !isEmoji(glyph) && glyph.trim().length > 0 && glyph.length <= 3 ? glyph : undefined;
}

export default function Art({ item, id, glyph, className, label }: Props) {
  const emoji = glyph ?? item?.emoji;
  const art = id ?? (item ? artForItem(item) : artForGlyph(glyph));
  const tile = art ? undefined : tileText(emoji);
  const group = art ? ART[art].group : tile ? ART.tile.group : undefined;
  useEffect(() => {
    if (group) void ensureSprite(group);
  }, [group]);

  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
  const cls = (base: string) => (className ? `${base} ${className}` : base);
  if (art) {
    return (
      <svg className={cls('art')} data-art={art} data-emoji={emoji} {...a11y}>
        <use href={`#art-${art}`} />
      </svg>
    );
  }
  if (tile) {
    return (
      <span className={cls(`art art-tile${tile.length > 2 ? ' art-tile--long' : ''}`)} data-art="tile" data-emoji={emoji} {...a11y}>
        <svg aria-hidden="true">
          <use href="#art-tile" />
        </svg>
        <span className="art-tile__text">{tile}</span>
      </span>
    );
  }
  if (!emoji) return null;
  return (
    <span className={cls('art art--emoji')} data-emoji={emoji} {...a11y}>
      {emoji}
    </span>
  );
}

/** Text with its emoji drawn as pictures ("🔊 Kuuntele", "3 × 🍎"). */
export function ArtText({ text }: { text: string }) {
  return (
    <>
      {splitEmoji(text).map((p, i) => ('glyph' in p ? <Art key={i} glyph={p.glyph} /> : <Fragment key={i}>{p.text}</Fragment>))}
    </>
  );
}

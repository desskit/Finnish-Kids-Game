// A picture from the set, in place of an emoji. Give it the word (`item`),
// the picture's `id`, or the emoji it replaces (`glyph`). It's sized 1em, so
// it takes the font-size the emoji had. Short text in a picture's place — a
// keycap (1️⃣), a number ("11") or an ordinal ("1.") — sits on the number tile.
//
// Pictures can move. `motion="loop"` plays everything the picture does (Leo
// runs, Mirri's tail sways, faces blink): for the main picture on a screen.
// `motion="idle"` only blinks: for answer cards. Without it, the picture is
// still: for small icons. Nothing moves when reduced motion is on.
//
// Every emoji the app uses has a picture (src/art/coverage.test.ts checks), so
// an emoji with none draws nothing rather than showing as itself.

import { Fragment, useEffect } from 'react';
import { ART, ART_MOTION, GLYPH_ART, type ArtId } from './generated/manifest';
import { glyphKey, isEmoji, keycapText, splitEmoji } from './glyph';
import { useMotion } from './motion';
import { ensureSprite, useSpriteReady, type Sprite } from './sprites';
import './generated/art.css';

interface Props {
  /** A word: its own picture if it has one, otherwise its emoji's. */
  item?: { id: string; emoji?: string };
  id?: ArtId;
  glyph?: string;
  className?: string;
  /** Says what the picture is to a screen reader (otherwise it's decorative). */
  label?: string;
  /** 'loop': all its motion; 'idle': just its blink; unset: still. */
  motion?: 'loop' | 'idle';
}

/** Which moving symbol a picture uses for a kind of motion, if any. */
export function motionSymbol(art: ArtId, motion: 'loop' | 'idle' | undefined): string | undefined {
  const m = ART_MOTION[art];
  if (!m || !motion) return undefined;
  if (motion === 'loop') return `art-${art}--m`;
  if (!m.blink) return undefined;
  return m.loop ? `art-${art}--b` : `art-${art}--m`;
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

export default function Art({ item, id, glyph, className, label, motion }: Props) {
  const emoji = glyph ?? item?.emoji;
  const art = id ?? (item ? artForItem(item) : artForGlyph(glyph));
  const tile = art ? undefined : tileText(emoji);
  const group = art ? ART[art].group : tile ? ART.tile.group : undefined;
  const moving = useMotion();
  const wanted = art && moving ? motionSymbol(art, motion) : undefined;
  const motionReady = useSpriteReady('motion');
  useEffect(() => {
    const sprites: Sprite[] = [];
    if (group) sprites.push(group);
    if (wanted) sprites.push('motion');
    for (const s of sprites) void ensureSprite(s);
  }, [group, wanted]);
  // the still picture stands in until the moving one has arrived
  const symbolId = wanted && motionReady ? wanted : `art-${art}`;

  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
  const cls = (base: string) => (className ? `${base} ${className}` : base);
  if (art) {
    return (
      <svg className={cls('art')} data-art={art} data-emoji={emoji} data-motion={symbolId !== `art-${art}` ? motion : undefined} {...a11y}>
        <use href={`#${symbolId}`} />
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
  return null;
}

/** Text with its emoji drawn as pictures ("🔊 Kuuntele", "3 × 🍎"). */
export function ArtText({ text }: { text: string }) {
  return (
    <>
      {splitEmoji(text).map((p, i) => ('glyph' in p ? <Art key={i} glyph={p.glyph} /> : <Fragment key={i}>{p.text}</Fragment>))}
    </>
  );
}

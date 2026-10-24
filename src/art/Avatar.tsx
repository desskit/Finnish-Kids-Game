// A player's avatar. Profiles store it as an emoji (🦊); avatar spots show the
// head-portrait picture drawn for it (avatar-fox), blinking, or fall back to
// the emoji's own picture.

import Art from './Art';
import { ART, type ArtId } from './generated/manifest';

/** The avatar emoji the app offers, by name (src/state/storage.ts AVATARS). */
export const AVATAR_NAMES: Readonly<Record<string, string>> = {
  '🦊': 'fox',
  '🦉': 'owl',
  '🐻': 'bear',
  '🐱': 'cat',
  '🐶': 'dog',
  '🐰': 'bunny',
  '🐸': 'frog',
  '🐼': 'panda',
  '🦁': 'lion',
  '🐯': 'tiger',
  '🐨': 'koala',
  '🐧': 'penguin',
  '🧪': 'test tube',
  // faces won in math (src/game/faces.ts)
  '🤖': 'robot',
  '🤓': 'owl in glasses',
  '🐲': 'dragon',
};

/** What an avatar is called ("fox"), for labels. */
export function avatarName(glyph: string): string {
  return AVATAR_NAMES[glyph] ?? 'player';
}

export default function Avatar({ glyph, className, still }: { glyph: string; className?: string; still?: boolean }) {
  const id = `avatar-${avatarName(glyph).replace(/\s+/g, '-')}`;
  const portrait = id in ART ? (id as ArtId) : undefined;
  return portrait ? <Art id={portrait} glyph={glyph} className={className} motion={still ? undefined : 'idle'} /> : <Art glyph={glyph} className={className} />;
}

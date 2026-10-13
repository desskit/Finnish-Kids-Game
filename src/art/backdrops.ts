// Story backdrops: one SVG per setting and tone, still and (for most) moving.
// Each is drawn as an <img>, so the moving one runs its own animation.

import { BACKDROP_MOTION, type BackdropId } from './generated/manifest';

const FILES = import.meta.glob('./generated/scenes/*.svg', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

/** The backdrop for a setting in a tone (moving if it can and may), or undefined if there's none. */
export function backdropUrl(id: BackdropId, tone: string, moving: boolean): string | undefined {
  const still = FILES[`./generated/scenes/${id}-${tone}.svg`];
  if (moving && BACKDROP_MOTION[id]?.includes(tone)) return FILES[`./generated/scenes/${id}-${tone}.moving.svg`] ?? still;
  return still;
}

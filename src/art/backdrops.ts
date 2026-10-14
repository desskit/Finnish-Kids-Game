// Story backdrops: one SVG per setting and tone, still and (for most) moving.
// Each is drawn as an <img>, so the moving one runs its own animation. The
// app's own scenery (UI scenes) is drawn the same way, once per look.

import { BACKDROP_MOTION, UI_BACKDROP_MOTION, type BackdropId, type UiBackdropId } from './generated/manifest';

const FILES = import.meta.glob('./generated/scenes/*.svg', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const UI_FILES = import.meta.glob('./generated/scenery/*.svg', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

/** The backdrop for a setting in a tone (moving if it can and may), or undefined if there's none. */
export function backdropUrl(id: BackdropId, tone: string, moving: boolean): string | undefined {
  const still = FILES[`./generated/scenes/${id}-${tone}.svg`];
  if (moving && BACKDROP_MOTION[id]?.includes(tone)) return FILES[`./generated/scenes/${id}-${tone}.moving.svg`] ?? still;
  return still;
}

/** The app's scenery in a look (moving if it can and may), or undefined if there's none. */
export function uiBackdropUrl(id: UiBackdropId, look: string, moving: boolean): string | undefined {
  const still = UI_FILES[`./generated/scenery/${id}-${look}.svg`];
  if (moving && UI_BACKDROP_MOTION[id]?.includes(look)) return UI_FILES[`./generated/scenery/${id}-${look}.moving.svg`] ?? still;
  return still;
}

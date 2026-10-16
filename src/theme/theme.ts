// The three looks a player can pick: Day (the regular look), Night (dark) and
// Pink. A player who hasn't picked one follows the device's light or dark
// setting. A look is the data-theme attribute on <html>; src/styles/global.css
// holds each look's colors. An element with data-look shows one look inside
// another (the look picker's cards, each player's card).

import { useSyncExternalStore } from 'react';

export type ThemeId = 'day' | 'night' | 'pink';

export interface Theme {
  id: ThemeId;
  /** What the look is called (shown with its English). */
  fi: string;
  en: string;
  /** Its sign in the sky: the sun, the moon, hearts. */
  glyph: string;
  /** The browser bar's color: the top of the page in this look. */
  bar: string;
}

export const THEMES: readonly Theme[] = [
  { id: 'day', fi: 'Päivä', en: 'Day', glyph: '☀️', bar: '#d8ecf9' },
  { id: 'night', fi: 'Yö', en: 'Night', glyph: '🌙', bar: '#1e2550' },
  { id: 'pink', fi: 'Pinkki', en: 'Pink', glyph: '💕', bar: '#ffd3e7' },
];

export const isThemeId = (v: unknown): v is ThemeId => v === 'day' || v === 'night' || v === 'pink';

/** A player's look: the one they picked, or else the device's light or dark. */
export function resolveTheme(choice: ThemeId | undefined, prefersDark: boolean): ThemeId {
  return choice ?? (prefersDark ? 'night' : 'day');
}

const DARK = '(prefers-color-scheme: dark)';

function deviceDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(DARK).matches;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const media = window.matchMedia(DARK);
  media.addEventListener?.('change', onChange);
  return () => media.removeEventListener?.('change', onChange);
}

/** Is the device in dark mode? (Follows it when that changes.) */
export function useDeviceDark(): boolean {
  return useSyncExternalStore(subscribe, deviceDark, () => false);
}

/** May the screen animate? Not when the device or the app's setting asks for less motion. */
function motionAllowed(): boolean {
  if (document.documentElement.dataset.reducedMotion === 'true') return false;
  return !(typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/**
 * Show a look: html[data-theme], and the browser bar's color to match. A
 * change of look cross-fades where the browser can (a view transition) and
 * motion is allowed; otherwise it switches at once.
 */
export function applyTheme(id: ThemeId): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const show = () => {
    root.dataset.theme = id;
    const bar = THEMES.find((t) => t.id === id)?.bar;
    if (bar) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bar);
  };
  const changing = root.dataset.theme !== undefined && root.dataset.theme !== id;
  if (changing && typeof document.startViewTransition === 'function' && motionAllowed()) document.startViewTransition(show);
  else show();
}

// The pictures live in sprite files (one <symbol> per picture): the still ones
// in ui.svg and words.svg, the moving ones in motion.svg. Each is fetched once
// and put into the page, so every <use href="#art-…"> after that draws straight
// away. The files are ordinary build assets, so the service worker caches them
// for offline play.

import { useSyncExternalStore } from 'react';
import uiUrl from './generated/ui.svg?url';
import wordsUrl from './generated/words.svg?url';
import motionUrl from './generated/motion.svg?url';
import type { ArtGroup } from './generated/manifest';

export type Sprite = ArtGroup | 'motion';

const URLS: Record<Sprite, string> = { ui: uiUrl, words: wordsUrl, motion: motionUrl };
const loading = new Map<Sprite, Promise<void>>();
const ready = new Set<Sprite>();
const listeners = new Set<() => void>();

// Tests render the <svg><use> markup only: there's nothing to fetch, and every sprite counts as there.
const TESTING = import.meta.env.MODE === 'test';

/** Make sure a sprite's pictures are in the page (fetching it the first time). */
export function ensureSprite(sprite: Sprite): Promise<void> {
  if (TESTING || typeof document === 'undefined') return Promise.resolve();
  let pending = loading.get(sprite);
  if (!pending) {
    pending = fetch(URLS[sprite])
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status} for ${URLS[sprite]}`))))
      .then((svg) => {
        const holder = document.createElement('div');
        holder.setAttribute('aria-hidden', 'true');
        holder.dataset.artSprite = sprite;
        holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        holder.innerHTML = svg;
        document.body.prepend(holder);
        ready.add(sprite);
        listeners.forEach((l) => l());
      })
      .catch(() => {
        // Offline before the first visit finished caching: try again next time.
        loading.delete(sprite);
      });
    loading.set(sprite, pending);
  }
  return pending;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Is this sprite in the page yet? (A moving picture shows its still self until it is.) */
export function useSpriteReady(sprite: Sprite): boolean {
  return useSyncExternalStore(
    subscribe,
    () => TESTING || ready.has(sprite),
    () => false,
  );
}

// The pictures live in two sprite files (one <symbol> per picture). Each is
// fetched once and put into the page, so every <use href="#art-…"> after
// that draws straight away. The files are ordinary build assets, so the
// service worker caches them for offline play.

import uiUrl from './generated/ui.svg?url';
import wordsUrl from './generated/words.svg?url';
import type { ArtGroup } from './generated/manifest';

const URLS: Record<ArtGroup, string> = { ui: uiUrl, words: wordsUrl };
const loading = new Map<ArtGroup, Promise<void>>();

/** Make sure a sprite's pictures are in the page (fetching it the first time). */
export function ensureSprite(group: ArtGroup): Promise<void> {
  // Tests render the <svg><use> markup only; there's nothing to fetch.
  if (import.meta.env.MODE === 'test' || typeof document === 'undefined') return Promise.resolve();
  let pending = loading.get(group);
  if (!pending) {
    pending = fetch(URLS[group])
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status} for ${URLS[group]}`))))
      .then((svg) => {
        const holder = document.createElement('div');
        holder.setAttribute('aria-hidden', 'true');
        holder.dataset.artSprite = group;
        holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        holder.innerHTML = svg;
        document.body.prepend(holder);
      })
      .catch(() => {
        // Offline before the first visit finished caching: try again next time.
        loading.delete(group);
      });
    loading.set(group, pending);
  }
  return pending;
}

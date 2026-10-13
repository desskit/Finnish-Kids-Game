// Whether pictures may move. They stay still when the device asks for reduced
// motion, or when a grown-up turns on the app's own setting (which sets
// data-reduced-motion on the root element: src/state/profile.tsx).

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function allowed(): boolean {
  if (typeof document === 'undefined') return false;
  if (document.documentElement.dataset.reducedMotion === 'true') return false;
  return !(typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches);
}

// One watcher for every picture on the page, started by the first one.
const listeners = new Set<() => void>();
let stopWatching: (() => void) | null = null;

function watch(notify: () => void): () => void {
  const media = typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null;
  media?.addEventListener?.('change', notify);
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced-motion'] });
  return () => {
    media?.removeEventListener?.('change', notify);
    observer.disconnect();
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!stopWatching && typeof document !== 'undefined') stopWatching = watch(() => listeners.forEach((l) => l()));
  return () => {
    listeners.delete(listener);
    if (!listeners.size && stopWatching) {
      stopWatching();
      stopWatching = null;
    }
  };
}

/** May pictures move right now? */
export function useMotion(): boolean {
  return useSyncExternalStore(subscribe, allowed, () => false);
}

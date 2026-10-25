// Keep an open or installed app current. The service worker downloads a new
// version in the background, but a page already running keeps the old code
// until it reloads — and a child's tablet can keep the app open for days. So:
// look for a new version whenever the app comes back to the front (and
// hourly), and once one is ready, switch to it at the next calm moment (a menu
// screen — see updateSafe.ts), never mid-game. Every open tab follows the same
// rule: a tab in the middle of a game waits for its own calm moment.

import { calmToUpdate } from './updateSafe';

const HOUR = 60 * 60 * 1000;

export function keepAppUpdated(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  let registration: ServiceWorkerRegistration | undefined;
  // Was this page started under an older version (so a new one means: reload)?
  const hadController = !!navigator.serviceWorker.controller;
  let reloadPending = false;

  const calm = () => calmToUpdate(window.location.hash);

  /** A new version has taken over: reload now if calm, else at the next calm moment. */
  const reloadWhenCalm = () => {
    reloadPending = true;
    if (calm()) window.location.reload();
  };

  /** A new version is installed and waiting: let it take over when this page is calm. */
  const activateWhenCalm = (worker: ServiceWorker | null | undefined = registration?.waiting) => {
    if (worker && navigator.serviceWorker.controller && calm()) worker.postMessage({ type: 'SKIP_WAITING' });
  };

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) reloadWhenCalm();
  });

  window.addEventListener('hashchange', () => {
    if (reloadPending && calm()) window.location.reload();
    else activateWhenCalm();
  });

  const check = () => {
    if (navigator.onLine) registration?.update().catch(() => {});
  };

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .then((reg) => {
        registration = reg;
        activateWhenCalm();
        reg.addEventListener('updatefound', () => {
          const incoming = reg.installing;
          incoming?.addEventListener('statechange', () => {
            if (incoming.state === 'installed') activateWhenCalm(incoming);
          });
        });
        window.setInterval(check, HOUR);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check();
        });
      })
      .catch(() => {});
  });
}

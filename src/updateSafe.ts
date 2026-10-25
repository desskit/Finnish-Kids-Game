// When a new version of the app has downloaded, it is switched to only at a
// calm moment — on a menu screen, or just as a new screen opens (before
// anything on it has been answered) — never in the middle of a game, a story
// or a checkpoint (a reload there would lose the round). See src/pwaUpdate.ts.

/** Screens (HashRouter routes) where reloading loses nothing. */
const CALM = [/^#?\/?$/, /^#\/profiles$/, /^#\/notebook$/, /^#\/achievements$/, /^#\/sounds$/, /^#\/math$/, /^#\/grown-up(\/.*)?$/];

/**
 * How long a screen counts as "just opened". Play now runs on from screen to
 * screen without passing a menu (a story, a step, the lesson, the next step),
 * so a version that arrives mid-sitting is switched to as the next screen
 * opens — otherwise it would wait until the child went home.
 */
export const FRESH_MS = 2000;

/** Is this location a calm moment to switch to a new version? */
export function calmToUpdate(hash: string, msOnScreen = Infinity): boolean {
  const h = hash.split('?')[0];
  return msOnScreen < FRESH_MS || CALM.some((re) => re.test(h));
}

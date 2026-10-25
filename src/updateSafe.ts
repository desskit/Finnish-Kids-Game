// When a new version of the app has downloaded, it is switched to only at a
// calm moment — on a menu screen, never in the middle of a game, a story or a
// checkpoint (a reload there would lose the round). See src/pwaUpdate.ts.

/** Screens (HashRouter routes) where reloading loses nothing. */
const CALM = [/^#?\/?$/, /^#\/profiles$/, /^#\/notebook$/, /^#\/achievements$/, /^#\/sounds$/, /^#\/math$/, /^#\/grown-up(\/.*)?$/];

/** Is this location a calm moment to switch to a new version? */
export function calmToUpdate(hash: string): boolean {
  const h = hash.split('?')[0];
  return CALM.some((re) => re.test(h));
}

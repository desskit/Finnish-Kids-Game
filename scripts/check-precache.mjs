// After `vite build`: every file the app ships (the types the service worker
// is told to cache) must be in its precache list — or the installed app breaks
// offline, silently (Workbox leaves out files over its size limit, or of a
// type its globPatterns don't name). Fails the build if any is missing.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const cached = new Set([...readFileSync(join(dist, 'sw.js'), 'utf8').matchAll(/url:"([^"]+)"/g)].map((m) => m[1]));
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const shipped = walk(dist)
  .map((f) => relative(dist, f))
  .filter((f) => f !== 'sw.js' && !f.startsWith('workbox-') && !f.endsWith('.webmanifest'));
const missing = shipped.filter((f) => !cached.has(f));
if (missing.length > 0) {
  console.error(`✘ ${missing.length} file(s) the app ships are not cached for offline use:\n  ${missing.join('\n  ')}`);
  console.error('  (Too big for workbox.maximumFileSizeToCacheInBytes, or a type globPatterns leaves out — see vite.config.ts.)');
  process.exit(1);
}
console.log(`✓ precache covers all ${shipped.length} shipped files`);

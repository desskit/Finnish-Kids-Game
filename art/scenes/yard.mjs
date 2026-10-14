// The yard: a red wooden house with white corners and smoke from its
// chimney, a birch, a fence along the back, flowers by the path, the forest
// behind. The clouds drift and the smoke rises.

import { bush, cloud, flower, sceneLight, sceneSky } from './parts.mjs';
import { birch, fence, forestLine, grassland, morningLight, redHouse, skyTone, smoke, sun } from './outdoors.mjs';

export default {
  id: 'yard',
  title: 'the yard (a red house)',
  tones: ['day', 'morning', 'evening'],
  motion: { frames: 3, fps: 1.5 },
  drift(k, tone) {
    return cloud(k, 160, 44, 0.9) + cloud(k, 330, 22, 0.7) + (tone === 'evening' ? k.tint(k.P.orange, 0.12) : '');
  },
  draw(k, tone) {
    const c = k.P;
    const out = [sceneSky(k, skyTone(tone))];
    if (tone === 'day') out.push(sun(k, 238, 36));
    if (tone === 'morning') out.push(sun(k, 226, 90, 16, false));
    if (tone === 'evening') out.push(sun(k, 290, 92, 18, false, 'orange'));
    if (!k.moving) out.push(cloud(k, 160, 44, 0.9), cloud(k, 330, 22, 0.7));
    out.push(
      forestLine(k, 130),
      grassland(k, 128),
      fence(k, 160, 316, 146, 22),
      redHouse(k, 22, 148, 120, 64, smoke(k, 114, 46)),
      k.flat('M72 150H92L116 204H52Z', c.path),
      birch(k, 352, 150, 104),
      bush(k, 300, 150, 0.9),
      ...[[44, 162, 'pink'], [126, 166, 'yellow'], [134, 182, 'white'], [30, 182, 'yellow'], [306, 170, 'pink'], [376, 176, 'white']].map(([x, y, col]) => flower(k, x, y, c[col])),
      sceneLight(k, skyTone(tone)),
      morningLight(k, tone),
    );
    return out.join('');
  },
};

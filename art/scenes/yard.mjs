// The yard: a red wooden house with white corners and smoke from its
// chimney, a birch, a fence along the back, flowers by the path, the forest
// behind. The clouds drift and the smoke rises. In the rain the sky is grey
// and puddles lie on the path; in the snow the ground and the roof are white
// and more falls.

import { bush, cloud, flower, rainFall, sceneLight, sceneSky, snowCap, snowFall } from './parts.mjs';
import { birch, fence, forestLine, grassland, morningLight, redHouse, skyTone, smoke, snowOnRoof, sun } from './outdoors.mjs';

const CLEAR = ['day', 'morning', 'evening'];

export default {
  id: 'yard',
  title: 'the yard (a red house)',
  tones: ['day', 'morning', 'evening', 'rain', 'snow'],
  motion: { frames: 3, fps: 1.5, byTone: { rain: { fps: 5 }, snow: { fps: 3 } } },
  drift(k, tone) {
    if (!CLEAR.includes(tone)) return '';
    return cloud(k, 160, 44, 0.9) + cloud(k, 330, 22, 0.7) + (tone === 'evening' ? k.tint(k.P.orange, 0.12) : '');
  },
  draw(k, tone) {
    const c = k.P;
    const snow = tone === 'snow';
    const out = [sceneSky(k, skyTone(tone))];
    if (tone === 'day') out.push(sun(k, 238, 36));
    if (tone === 'morning') out.push(sun(k, 226, 90, 16, false));
    if (tone === 'evening') out.push(sun(k, 290, 92, 18, false, 'orange'));
    if (!k.moving && CLEAR.includes(tone)) out.push(cloud(k, 160, 44, 0.9), cloud(k, 330, 22, 0.7));
    out.push(
      forestLine(k, 130),
      grassland(k, 128, snow ? 'silver' : 'grass'),
      fence(k, 160, 316, 146, 22),
      redHouse(k, 22, 148, 120, 64, smoke(k, 114, 46)),
      k.flat('M72 150H92L116 204H52Z', snow ? c.silverShade : c.path),
      birch(k, 352, 150, 104),
      bush(k, 300, 150, 0.9),
    );
    if (snow) {
      out.push(snowOnRoof(k, 22, 148, 120, 64), k.rect(160, 126, 156, 3, 1, c.white), snowCap(k, 352, 70, 26, 30), snowCap(k, 300, 150, 13.5), snowFall(k));
    } else {
      out.push(...[[44, 162, 'pink'], [126, 166, 'yellow'], [134, 182, 'white'], [30, 182, 'yellow'], [306, 170, 'pink'], [376, 176, 'white']].map(([x, y, col]) => flower(k, x, y, c[col])));
    }
    if (tone === 'rain') out.push(k.ellipse(86, 176, 14, 3.4, c.water), k.ellipse(100, 194, 10, 2.6, c.water), rainFall(k));
    out.push(sceneLight(k, skyTone(tone)), morningLight(k, tone));
    return out.join('');
  },
};

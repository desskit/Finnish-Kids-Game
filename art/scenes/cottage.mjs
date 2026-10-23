// The cottage (mökki): the red cottage on the shore, smoke rising from its
// chimney, a birch beside it, a wooden dock out into the lake with the
// rowboat tied up, the forest on the far shore. By day the sun is high and
// the clouds drift; on a Midsummer evening the sun hangs low and orange over
// the water; in the snow the lake is frozen white and more snow falls.

import { cloud, sceneLight, sceneSky, snowCap, snowFall } from './parts.mjs';
import { birch, forestLine, redHouse, skyTone, smoke, snowOnRoof, sun } from './outdoors.mjs';

/** Ripples on the lake, sliding a little on each frame. */
function ripples(k) {
  const s = k.frames > 1 ? (k.frame % 3) * 4 : 0;
  return k.line(`M${196 + s} 120H214M${300 - s} 116H322M${340 + s} 140H362M${222 - s} 146H238`, { color: k.P.white, sw: 1.6 });
}

export default {
  id: 'cottage',
  title: 'the cottage (a red mökki by the lake)',
  tones: ['day', 'evening', 'snow'],
  motion: { frames: 3, fps: 1.5, byTone: { snow: { fps: 3 } } },
  drift(k, tone) {
    return tone === 'day' ? cloud(k, 200, 40, 0.8) + cloud(k, 352, 24, 0.6) : '';
  },
  draw(k, tone) {
    const c = k.P;
    const snow = tone === 'snow';
    const out = [sceneSky(k, skyTone(tone))];
    if (tone === 'day') out.push(sun(k, 300, 40));
    if (tone === 'evening') out.push(k.circle(330, 56, 18, c.orange));
    if (!k.moving && tone === 'day') out.push(cloud(k, 200, 40, 0.8), cloud(k, 352, 24, 0.6));
    out.push(
      // the far shore's forest, the lake (frozen white in the snow)
      forestLine(k, 108, 150, 400),
      k.flat('M150 104H400V170H150Z', snow ? c.white : c.water),
      k.flat('M150 104H400V109H150Z', snow ? c.silver : c.waterShade),
      snow ? '' : ripples(k),
      // the near shore, the path to the cottage door
      k.path('M-4 112C50 106 110 106 150 112C176 124 200 140 236 150C290 160 350 160 404 160V204H-4Z', snow ? c.silver : c.grass),
      k.flat('M-4 178C80 170 160 172 220 178C300 172 350 170 404 172V204H-4Z', snow ? c.silverShade : c.grassShade, { opacity: 0.5 }),
      k.flat('M70 152H90L112 204H48Z', snow ? c.silverShade : c.path),
      // the dock out into the lake, the rowboat tied up beside it
      k.poly([[252, 112], [278, 112], [292, 156], [236, 156]], 1, c.wood),
      k.line('M249 122H281M246 132H284M242 142H287', { color: c.woodShade, sw: 1.4 }),
      k.rect(250, 108, 4, 8, 0.6, c.brown),
      k.rect(276, 108, 4, 8, 0.6, c.brown),
      snow ? '' : k.path('M300 128H346C344 136 338 140 328 140H316C306 140 302 136 300 128Z', c.red) + k.line('M300 128L282 120', { color: c.charcoal, sw: 1.2 }),
      redHouse(k, 26, 150, 110, 58, smoke(k, 106, 52)),
      birch(k, 168, 154, 98),
      birch(k, 378, 176, 104),
    );
    if (snow) out.push(snowOnRoof(k, 26, 150, 110, 58), snowCap(k, 168, 80, 26, 30), snowCap(k, 378, 96, 26, 30), snowFall(k));
    out.push(sceneLight(k, skyTone(tone)));
    return out.join('');
  },
};

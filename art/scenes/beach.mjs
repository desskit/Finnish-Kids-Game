// The beach: the sun over the water, a little island with pines far out,
// waves rolling in, the sand with a striped umbrella and a sandcastle, a
// bucket and spade, a gull. The waves and the gull move; the clouds drift.

import { pine } from '../nature.mjs';
import { cloud, sceneSky } from './parts.mjs';
import { sun } from './outdoors.mjs';

export default {
  id: 'beach',
  title: 'beach',
  tones: ['day'],
  motion: { frames: 2, fps: 1.5 },
  drift: (k) => cloud(k, 190, 32, 0.8) + cloud(k, 340, 20, 0.6),
  draw(k) {
    const c = k.P;
    const f = k.frames > 1 ? k.frame % 2 : 0;
    const s = f ? 12 : 0;
    const foam = [];
    for (let x = -24 + s; x < 420; x += 48) foam.push(`M${x} 122Q${x + 12} 118 ${x + 24} 122`);
    for (let x = -12 - s; x < 420; x += 56) foam.push(`M${x} 108H${x + 16}`);
    return [
      sceneSky(k, 'day'),
      sun(k, 70, 40),
      k.moving ? '' : cloud(k, 190, 32, 0.8) + cloud(k, 340, 20, 0.6),
      // a gull
      k.line(f ? 'M246 50Q252 44 258 50Q264 44 270 50' : 'M246 46Q252 52 258 50Q264 52 270 46', { sw: 1.6 }),
      // the water, an island far out
      k.flat('M0 92H400V140H0Z', c.water),
      k.flat('M0 92H400V100H0Z', c.waterShade),
      k.path('M168 94Q194 84 220 94Z', c.grass),
      pine(k, 184, 92, 18),
      pine(k, 196, 92, 24),
      pine(k, 208, 92, 16),
      k.line(foam.join(''), { color: c.white, sw: 2 }),
      // the sand
      k.path('M-4 134C80 126 180 130 240 136C300 130 360 126 404 130V204H-4Z', c.tan),
      k.flat('M-4 170C80 164 170 168 220 172C300 166 350 164 404 168V204H-4Z', c.tanShade, { opacity: 0.6 }),
      // the sandcastle, a bucket and spade
      k.path('M28 172V128H33V123H38V128H43V123H48V128H50V146H78V128H80V123H85V128H90V123H95V128H100V172Z', c.amber),
      k.flat('M90 130H98V170H90Z', c.amberShade),
      k.path('M56 172V160A8 8 0 0 1 72 160V172Z', c.amberShade),
      k.flat('M36 134H42V140H36ZM86 134H92V140H86Z', c.amberShade),
      k.limb('M64 146V122', c.charcoal, 3.8),
      k.path('M65 122L78 126L65 130Z', c.red),
      k.path('M114 156H130L127 172H117Z', c.blue),
      k.line('M114 158Q122 146 130 158', { color: c.charcoal, sw: 1.4 }),
      // the umbrella
      k.limb('M330 180V102', c.white, 4.4),
      k.path('M286 104Q330 70 374 104Z', c.red),
      k.flat('M309 104Q318 86 330 84Q324 92 322 104ZM330 84Q342 86 351 104H338Q336 92 330 84Z', c.white),
    ].join('');
  },
};

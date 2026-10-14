// The station: a green-and-white train at the platform, the platform's roof
// with a clock hanging from it, a bench; behind it all a lake with the forest
// on its far shore. The lake glints; the clouds drift.

import { cloud, sceneSky } from './parts.mjs';
import { forestLine, sun } from './outdoors.mjs';

export default {
  id: 'station',
  title: 'train station',
  tones: ['day'],
  motion: { frames: 2, fps: 1.5 },
  drift: (k) => cloud(k, 160, 30, 0.8) + cloud(k, 320, 18, 0.6),
  draw(k) {
    const c = k.P;
    const s = k.frames > 1 && k.frame % 2 ? 10 : 0;
    const windows = [];
    for (let x = 10; x < 180; x += 30) windows.push(k.rect(x, 96, 20, 16, 2, c.skyDay));
    return [
      sceneSky(k, 'day'),
      sun(k, 360, 30, 12),
      k.moving ? '' : cloud(k, 160, 30, 0.8) + cloud(k, 320, 18, 0.6),
      // the far shore and the lake
      forestLine(k, 100),
      k.flat('M0 100H400V126H0Z', c.water),
      k.line(`M${40 + s} 108H${60 + s}M${150 - s} 116H${176 - s}M${250 + s} 110H${270 + s}M${330 - s} 118H${352 - s}`, { color: c.white, sw: 2 }),
      k.flat('M0 122H400V128H0Z', c.grass),
      // the train: a white car with a green stripe, its rounded nose at the front
      k.path('M-8 84H180C196 84 206 94 208 108L210 140H-8Z', c.white),
      k.flat('M-6 118H209.6V126H-6Z', c.green),
      ...windows,
      k.path('M190 92C198 94 203 100 204 108H188Z', c.skyDay),
      k.rect(34, 98, 14, 36, 1, c.silver),
      k.line('M41 98V134', { sw: 1 }),
      k.flat('M-8 140H212V146H-8Z', c.charcoal),
      // the platform, its yellow edge
      k.flat('M0 146H400V204H0Z', c.grey),
      k.flat('M0 146H400V151H0Z', c.yellow),
      k.line('M0 172H400M70 151V204M180 151V204M290 151V204', { color: c.greyShade, sw: 1 }),
      // the roof over the platform, its clock, a bench
      k.limb('M250 150V72M384 150V72', c.charcoal, 5),
      k.rect(230, 62, 176, 12, 1.6, c.teal),
      k.line('M300 74V82', { color: c.charcoal, sw: 1.6 }),
      k.circle(300, 92, 10, c.white),
      k.line('M300 92V85M300 92H305', { sw: 1.6 }),
      k.rect(322, 132, 52, 6, 1.4, c.wood),
      k.rect(322, 122, 52, 5, 1.4, c.wood),
      k.limb('M328 138V148M368 138V148', c.charcoal, 3.8),
    ].join('');
  },
};

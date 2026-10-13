// The app's own pictures: buttons, rewards, the number tile, avatars.

import { ringSector, roundPoly, starPoints } from '../kit.mjs';
import { foxHead } from '../animals.mjs';

export default [
  {
    id: 'speaker',
    title: 'speaker (listen)',
    group: 'ui',
    glyphs: ['🔊'],
    // the sound waves pulse outward: both, none, the near one
    motion: { frames: 3, fps: 3 },
    draw: (k) => {
      const c = k.P;
      const waves = [2, 0, 1][k.frame % 3];
      return [
        k.rect(10.6, 24.4, 10.4, 15.2, 2.4, c.silver),
        k.path('M20.2 25.2L31.4 15.8C33 14.4 34.6 15.2 34.6 17.2V46.8C34.6 48.8 33 49.6 31.4 48.2L20.2 38.8Z', c.white),
        waves >= 1 ? k.path(ringSector(35.4, 32, 6.6, 11.6, -44, 44), c.amber) : '',
        waves >= 2 ? k.path(ringSector(35.4, 32, 15, 20, -44, 44), c.amber) : '',
      ].join('');
    },
  },
  {
    id: 'trophy',
    title: 'trophy',
    group: 'ui',
    glyphs: ['🏆'],
    // a glint sweeps across the cup
    motion: { frames: 5, fps: 6 },
    draw: (k) => {
      const c = k.P;
      return [
        k.ground(32, 57.6, 15, 2.2),
        k.limb('M18.6 18.4C10.4 17.8 9.8 30.2 20.4 32.6', c.yellow, 7.2),
        k.limb('M45.4 18.4C53.6 17.8 54.2 30.2 43.6 32.6', c.yellow, 7.2),
        k.poly([[29, 37], [35, 37], [36, 46], [28, 46]], 1.2, c.yellowShade),
        k.path('M16.6 12.4H47.4V21.4C47.4 32.4 40.6 39.4 32 39.4C23.4 39.4 16.6 32.4 16.6 21.4Z', c.yellow),
        k.flat('M41.8 14.2H45.6V21.4C45.6 28.4 42.6 33.6 38.4 36.2C40.8 32 41.8 27.2 41.8 21.4Z', c.yellowShade),
        k.flat(roundPoly(starPoints(32, 24.6, 6.6, 3, 5, -90), 0.8), c.amber),
        k.frame >= 1 && k.frame <= 3 ? k.flat(`M${14 + k.frame * 7} 13L${19 + k.frame * 7} 13L${11 + k.frame * 7} 38L${6 + k.frame * 7} 38Z`, c.white) : '',
        k.shine('M21.4 17.8V24.6', 2.4),
        k.poly([[20.6, 45.4], [43.4, 45.4], [45.6, 55.4], [18.4, 55.4]], 2.2, c.wood),
        k.rect(25.6, 48.4, 12.8, 4, 1.2, c.cream, { sw: 1.5 }),
      ].join('');
    },
  },
  {
    id: 'tile',
    title: 'number tile (the numeral is live text on top)',
    group: 'ui',
    draw: (k) => {
      const c = k.P;
      return [
        k.rect(7.6, 10.6, 48.8, 46.8, 12, c.blueShade),
        k.rect(7.6, 7.6, 48.8, 45.6, 12, c.blue),
      ].join('');
    },
  },
  {
    id: 'avatar-fox',
    title: 'fox (avatar)',
    group: 'ui',
    draw: (k) => foxHead(k),
  },
];

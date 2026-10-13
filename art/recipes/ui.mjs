// The app's own pictures: buttons, rewards, the number tile, avatars.

import { fmt, ringSector, roundPoly, starPoints } from '../kit.mjs';
import { foxHead } from '../animals.mjs';

/** A party popper going off: the app's "well done!" (🎉). */
function popper(k) {
  const c = k.P;
  const f = k.frame % 3;
  const spread = [0.72, 0.86, 1][f];
  const bits = [
    [42, 8, 'red', 20],
    [54, 22, 'blue', -30],
    [30, 6, 'yellow', 45],
    [56, 38, 'green', 10],
    [44, 26, 'purple', -15],
  ];
  return [
    k.ground(20, 58.6, 14, 2),
    ...bits.map(([x, y, col, a]) => {
      const [bx, by] = [20 + (x - 20) * spread, 44 + (y - 44) * spread];
      return k.g(`rotate(${a + f * 30} ${fmt(bx)} ${fmt(by)})`, k.rect(bx - 3.4, by - 2, 6.8, 4, 0.6, c[col]));
    }),
    k.limb(`M26 36Q${fmt(32 + f * 2)} 22 ${fmt(40 + f * 3)} 26Q${fmt(46 + f * 2)} 30 ${fmt(48 + f * 3)} 16`, c.pink, 3.8),
    k.limb(`M28 42Q${fmt(38 + f * 2)} 38 ${fmt(44 + f * 3)} 46`, c.teal, 3.8),
    k.path('M4 58L16 30L34 46Z', c.yellow),
    k.flat('M8 50.4L20.4 56.6L15.6 57.4L6.6 53.6ZM11.4 42.4L28 50.6L23.6 52L9.6 46Z', c.red),
    k.g('rotate(39 25 38)', k.ellipse(25, 38, 11, 3.4, c.yellowShade)),
  ].join('');
}

export default [
  // well done! (a round all right, a conversation finished): it goes off
  { id: 'party-popper', title: 'party popper (well done!)', group: 'ui', glyphs: ['🎉'], motion: { frames: 3, fps: 4 }, draw: popper },
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

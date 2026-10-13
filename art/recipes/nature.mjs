// Nature words.

import { crescentPath, polar, pt, starPoints } from '../kit.mjs';

export default [
  {
    id: 'sun',
    title: 'sun',
    draw: (k) => {
      const c = k.P;
      const [cx, cy] = [32, 32];
      const rays = [];
      for (let i = 0; i < 8; i++) {
        const a = i * 45 - 90;
        rays.push(k.limb(`M${pt(polar(cx, cy, 19.4, a))}L${pt(polar(cx, cy, i % 2 ? 24.4 : 26.8, a))}`, c.amber, 8.2));
      }
      return [
        ...rays,
        k.circle(cx, cy, 15, c.yellow),
        k.flat(crescentPath(cx, cy, 15, -15, 125, 0.24), c.yellowShade),
        k.shine(`M${pt(polar(cx, cy, 10.4, 196))}A10.4 10.4 0 0 1 ${pt(polar(cx, cy, 10.4, 246))}`, 2.6),
      ].join('');
    },
  },
  {
    id: 'star',
    title: 'star',
    draw: (k) => {
      const c = k.P;
      const pts = starPoints(32, 33.6, 25.4, 11.6, 5, -90);
      const radii = pts.map((_, i) => (i % 2 ? 2.2 : 3.6));
      return [
        k.poly(pts, radii, c.yellow),
        k.flat(`M${pt([32, 46.2])}L${pt([46, 54.4])}L${pt([43.2, 39.4])}L${pt([55, 27])}L${pt([42.4, 28.4])}Z`, c.yellowShade),
        k.poly(pts, radii, 'none', { inRim: false }),
        k.shine('M21.6 31.6L26.6 31.4', 2.4),
        k.shineDot(31.4, 16.8, 1.3),
      ].join('');
    },
  },
];

// Nature and weather words.

import { crescentPath, polar, pt, roundPoly, starPoints } from '../kit.mjs';
import * as nature from '../nature.mjs';

export default [
  {
    id: 'sun',
    title: 'sun',
    // the long and short rays swap: the sun shimmers
    motion: { frames: 2, fps: 2.5 },
    draw: (k) => {
      const c = k.P;
      const [cx, cy] = [32, 32];
      const rays = [];
      for (let i = 0; i < 8; i++) {
        const a = i * 45 - 90;
        const long = (i + k.frame) % 2 === 0;
        rays.push(k.limb(`M${pt(polar(cx, cy, 19.4, a))}L${pt(polar(cx, cy, long ? 26.8 : 24.4, a))}`, c.amber, 8.2));
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
    // a sparkle flashes at its corner
    motion: { frames: 4, fps: 4 },
    draw: (k) => {
      const c = k.P;
      const pts = starPoints(32, 33.6, 25.4, 11.6, 5, -90);
      const radii = pts.map((_, i) => (i % 2 ? 2.2 : 3.6));
      const spark = [0, 3.2, 5.2, 3.2][k.frame % 4];
      return [
        spark ? k.flat(roundPoly(starPoints(50.4, 11.6, spark, spark * 0.32, 4), 0.3), c.amber) : '',
        k.poly(pts, radii, c.yellow),
        k.flat(`M${pt([32, 46.2])}L${pt([46, 54.4])}L${pt([43.2, 39.4])}L${pt([55, 27])}L${pt([42.4, 28.4])}Z`, c.yellowShade),
        k.poly(pts, radii, 'none'),
        k.shine('M21.6 31.6L26.6 31.4', 2.4),
        k.shineDot(31.4, 16.8, 1.3),
      ].join('');
    },
  },
  { id: 'moon', title: 'moon (stars twinkling by it)', motion: { frames: 4, fps: 4 }, draw: nature.moon },
  { id: 'cloud', title: 'cloud', motion: { frames: 2, fps: 1.5 }, draw: nature.cloud },
  { id: 'rain', title: 'rain', motion: { frames: 3, fps: 6 }, draw: nature.rain },
  { id: 'snow', title: 'snow (a snowflake, turning)', motion: { frames: 3, fps: 2.5 }, draw: nature.snow },
  { id: 'flower', title: 'flower', motion: { frames: 2, fps: 1.5 }, draw: nature.flower },
  { id: 'mountain', title: 'mountain', draw: nature.mountain },
  { id: 'stone', title: 'stone', draw: nature.stone },
  { id: 'lake', title: 'lake (in the forest)', motion: { frames: 2, fps: 1.5 }, draw: nature.lake },
  { id: 'sea', title: 'sea (a wave)', motion: { frames: 2, fps: 2 }, draw: nature.sea },
  { id: 'sky', title: 'sky', motion: { frames: 4, fps: 2.5 }, draw: nature.sky },
  { id: 'wind', title: 'wind', motion: { frames: 4, fps: 4 }, draw: nature.wind },
  // the glint crosses the cube, then a pause
  { id: 'ice', title: 'ice', motion: { frames: 8, fps: 6 }, draw: nature.ice },
  { id: 'leaf', title: 'leaf', motion: { frames: 2, fps: 1.5 }, draw: nature.leaf },
  { id: 'fire', title: 'fire (a campfire)', motion: { frames: 3, fps: 6 }, draw: nature.fire },
  { id: 'grass', title: 'grass', motion: { frames: 2, fps: 1.5 }, draw: nature.grass },
  { id: 'island', title: 'island (in a lake)', motion: { frames: 2, fps: 1.5 }, draw: nature.island },
];

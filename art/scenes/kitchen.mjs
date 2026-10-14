// The kitchen: a window over the sink, the counter along the wall with its
// cupboards above and below, the stove with a pot on it, the fridge with a
// drawing stuck on its door. The pot's steam rises.

import { fmt, pt } from '../kit.mjs';
import { roomLight, roomWindow, wallAndFloor } from './rooms.mjs';

/** A row of cupboard doors from x0 to x1, top to bottom, each with its knob. */
function doors(k, x0, x1, top, bottom, n, color = 'white') {
  const c = k.P;
  const w = (x1 - x0) / n;
  return Array.from({ length: n }, (_, i) => k.rect(x0 + i * w, top, w, bottom - top, 1.4, c[color]) + k.flatCircle(x0 + i * w + (i % 2 ? 6 : w - 6), (top + bottom) / 2, 2, c.silverShade)).join('');
}

/** Steam off the pot: three wisps, shifting up each frame. */
function steam(k, xs, base) {
  return xs
    .map((x, i) => {
      const f = (k.frame + i) % 3;
      const d = f === 1 ? -1 : 1;
      const y0 = base - [0, 3, 6][f];
      return k.line(`M${pt([x, y0])}C${pt([x + 5 * d, y0 - 6])} ${pt([x + 5 * d, y0 - 12])} ${pt([x, y0 - 16])}C${pt([x - 5 * d, y0 - 20])} ${pt([x - 5 * d, y0 - 26])} ${pt([x, y0 - 30])}`, { color: k.P.grey, sw: 2.4 });
    })
    .join('');
}

export default {
  id: 'kitchen',
  title: 'kitchen',
  tones: ['inside', 'morning', 'evening'],
  motion: { frames: 3, fps: 2 },
  draw(k, tone) {
    const c = k.P;
    const floorY = 150;
    const tiles = [];
    for (let x = 16; x < 330; x += 16) tiles.push(`M${x} 84V108`);
    tiles.push('M0 96H330');
    return [
      wallAndFloor(k, floorY),
      // tiles behind the counter
      k.flat('M0 84H330V108H0Z', c.white),
      k.line(tiles.join(''), { color: c.silverShade, sw: 1 }),
      // cupboards on the wall, the window over the sink
      doors(k, 8, 104, 16, 62, 2, 'wood'),
      doors(k, 206, 314, 16, 62, 2, 'wood'),
      roomWindow(k, 130, 22, 60, 52, tone, 'yellow'),
      // the counter: its top, the cupboards under it, the sink, the stove
      doors(k, 0, 206, 116, floorY, 4),
      doors(k, 270, 330, 116, floorY, 1),
      k.rect(206, 116, 64, 34, 1.4, c.charcoal),
      k.rect(214, 122, 48, 22, 1.4, c.charcoalShade),
      k.flat('M218 125H258V129H218Z', c.grey),
      k.rect(-4, 108, 334, 8, 1, c.tan),
      k.rect(140, 106, 40, 5, 1.6, c.silver),
      k.limb('M160 107V96Q160 92 164 92H170', c.silverShade, 4.4),
      k.ellipse(222, 108, 10, 2.4, c.charcoalShade),
      k.ellipse(252, 108, 10, 2.4, c.charcoalShade),
      // the pot, steaming
      k.rect(234, 88, 34, 19, 3, c.red),
      k.flat('M260 89H266V106H260Z', c.redShade),
      k.rect(230, 84, 42, 5, 2, c.redShade),
      k.rect(246, 79, 10, 5, 1.6, c.charcoal),
      steam(k, [240, 256], 76),
      // the fridge, a drawing on its door
      k.rect(336, 26, 58, 124, 5, c.white),
      k.flat('M337.6 74H392.4V77H337.6Z', c.silver),
      k.limb('M344 40V62M344 86V110', c.silverShade, 4.4),
      k.rect(356, 88, 26, 20, 0.6, c.cream),
      k.flatCircle(363, 96, 3, c.yellow),
      k.flat('M357 107L366 99L373 104L381 98V107Z', c.green),
      k.flatCircle(360, 86.6, 2, c.red),
      k.flatCircle(376, 40, 2.6, c.blue),
      k.flatCircle(384, 50, 2.6, c.yellow),
      roomLight(k, tone, `M130 22H190L${fmt(250)} 150H170Z`),
    ].join('');
  },
};

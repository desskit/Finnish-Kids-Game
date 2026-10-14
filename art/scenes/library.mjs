// The library: tall shelves packed with books on either side, a round window
// between them, a reading lamp, a stool with a pile of books, a green rug.
// It moves: the lamp's light breathes a little.

import { floorLamp, wallAndFloor } from './rooms.mjs';

const COLORS = ['red', 'blue', 'yellow', 'green', 'purple', 'teal', 'orange', 'pink', 'brown', 'coral'];

/** A tall bookcase from x0 to x1, its shelves full; `seed` varies the books. */
function bookcase(k, x0, x1, top, gy, seed) {
  const c = k.P;
  const out = [k.rect(x0, top, x1 - x0, gy - top, 2, c.wood), k.flat(`M${x0 + 5} ${top + 5}H${x1 - 5}V${gy - 5}H${x0 + 5}Z`, c.woodShade)];
  const rows = 4;
  const rowH = (gy - top - 10) / rows;
  for (let r = 0; r < rows; r++) {
    const base = top + 5 + rowH * (r + 1);
    let x = x0 + 6;
    let i = seed + r * 3;
    while (x < x1 - 12) {
      const w = 6 + ((i * 7) % 5);
      const h = rowH - 6 - ((i * 5) % 7);
      if (x + w > x1 - 6) break;
      out.push(k.rect(x, base - h, w, h, 0.6, c[COLORS[i % COLORS.length]]));
      x += w + 0.4;
      i++;
    }
    out.push(k.rect(x0, base, x1 - x0, 4, 0.6, c.wood));
  }
  return out.join('');
}

export default {
  id: 'library',
  title: 'library',
  tones: ['inside'],
  motion: { frames: 2, fps: 1 },
  draw(k) {
    const c = k.P;
    const floorY = 150;
    const glow = k.frames > 1 && k.frame % 2 ? 0.88 : 1;
    return [
      wallAndFloor(k, floorY, ['tan', 'tanShade']),
      bookcase(k, 0, 118, 10, floorY, 0),
      bookcase(k, 282, 400, 10, floorY, 5),
      // a round window between the shelves
      k.circle(200, 54, 30, c.white),
      k.circle(200, 54, 25, c.skyDay),
      k.flat('M175 62Q188 54 200 60Q212 52 225 60V80H175Z', c.green),
      k.rect(198.2, 29, 3.6, 50, 0, c.white),
      k.rect(175, 52.2, 50, 3.6, 0, c.white),
      // the reading lamp, its light
      k.flatCircle(256, 76, 34 * glow, c.starlight, { opacity: 0.16 }),
      floorLamp(k, 256, floorY, true),
      // a stool with a pile of books
      k.rect(128, 126, 30, 6, 1.6, c.wood),
      k.rect(131, 132, 5, 18, 1, c.woodShade),
      k.rect(150, 132, 5, 18, 1, c.woodShade),
      k.rect(130, 120, 26, 6, 1, c.red),
      k.rect(133, 114, 22, 6, 1, c.blue),
      k.rect(131, 108, 24, 6, 1, c.yellow),
      k.ellipse(200, 178, 104, 15, c.green),
      k.flatEllipse(200, 178, 92, 10, c.greenShade),
    ].join('');
  },
};

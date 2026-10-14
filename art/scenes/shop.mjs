// The shop: shelves of food along the back wall, crates of fruit at the
// front, the checkout with its till, and a sign hanging from the ceiling with
// a basket on it. The sign swings a little.

import { wallAndFloor } from './rooms.mjs';

/** A shelf unit from x0 to x1: three shelves of boxes, cans and bottles. */
function shelves(k, x0, x1, top, gy, seed) {
  const c = k.P;
  const out = [k.rect(x0, top, x1 - x0, gy - top, 1.6, c.white), k.flat(`M${x0 + 4} ${top + 4}H${x1 - 4}V${gy - 4}H${x0 + 4}Z`, c.silver)];
  const rowH = (gy - top - 8) / 3;
  const goods = [
    (x, b) => [12, 24, k.rect(x, b - 24, 12, 24, 1, c.red) + k.flat(`M${x + 2} ${b - 16}H${x + 10}V${b - 10}H${x + 2}Z`, c.yellow)],
    (x, b) => [10, 14, k.rect(x, b - 14, 10, 14, 1, c.orange) + k.flat(`M${x + 1} ${b - 13}H${x + 9}V${b - 11}H${x + 1}Z`, c.silverShade)],
    (x, b) => [9, 22, k.rect(x, b - 18, 9, 18, 1.6, c.white) + k.rect(x + 2.6, b - 22, 3.8, 4.4, 0.8, c.blue)],
    (x, b) => [12, 24, k.rect(x, b - 24, 12, 24, 1, c.blue) + k.flatCircle(x + 6, b - 14, 3, c.white)],
    (x, b) => [16, 10, k.ellipse(x + 8, b - 5, 8, 5, c.amber) + k.line(`M${x + 4} ${b - 8}L${x + 6} ${b - 3}M${x + 9} ${b - 9}L${x + 11} ${b - 4}`, { color: c.amberShade, sw: 1 })],
    (x, b) => [10, 14, k.rect(x, b - 14, 10, 14, 1, c.green) + k.flat(`M${x + 1} ${b - 13}H${x + 9}V${b - 11}H${x + 1}Z`, c.silverShade)],
  ];
  for (let r = 0; r < 3; r++) {
    const base = top + 4 + rowH * (r + 1);
    let x = x0 + 6;
    let i = seed + r * 2;
    for (;;) {
      const [w, , art] = goods[i % goods.length](x, base);
      if (x + w > x1 - 6) break;
      out.push(art);
      x += w + 2;
      i++;
    }
    out.push(k.rect(x0, base, x1 - x0, 4, 0.6, c.silverShade));
  }
  return out.join('');
}

/** A crate of fruit: `fruit` draws one fruit at (x, y). */
function crate(k, x, gy, w, fruit) {
  const c = k.P;
  const out = [];
  for (let fx = x + 7; fx < x + w - 4; fx += 9) out.push(fruit(fx, gy - 30));
  for (let fx = x + 11.5; fx < x + w - 8; fx += 9) out.push(fruit(fx, gy - 36));
  return out.join('') + k.rect(x, gy - 30, w, 30, 1.4, c.wood) + k.flat(`M${x + 2} ${gy - 16}H${x + w - 2}V${gy - 14}H${x + 2}Z`, c.woodShade);
}

export default {
  id: 'shop',
  title: 'shop',
  tones: ['inside'],
  motion: { frames: 2, fps: 1.2 },
  draw(k) {
    const c = k.P;
    const floorY = 150;
    const swing = k.frames > 1 && k.frame % 2 ? 3 : -2;
    const apple = (x, y) => k.circle(x, y, 4.6, c.red) + k.flatCircle(x - 1.4, y - 1.4, 1.2, c.white);
    const orange = (x, y) => k.circle(x, y, 4.6, c.orange);
    return [
      wallAndFloor(k, floorY, ['silver', 'silverShade']),
      shelves(k, 8, 128, 30, floorY, 0),
      shelves(k, 140, 260, 30, floorY, 3),
      shelves(k, 272, 392, 30, floorY, 1),
      // the sign over it all, swinging on its strings
      k.g(
        `rotate(${swing} 200 0)`,
        k.line('M182 0V14M218 0V14', { color: c.charcoal, sw: 1.4 }),
        k.rect(170, 12, 60, 22, 3, c.yellow),
        k.path('M188 20H212L208 30H192Z', c.red),
        k.limb('M192 21Q200 12 208 21', c.charcoal, 3.8),
      ),
      // crates of fruit at the front
      crate(k, 10, floorY, 44, apple),
      crate(k, 60, floorY, 44, orange),
      // the checkout: its counter and the till
      k.rect(312, 108, 92, 42, 2, c.blue),
      k.flat('M314 128H402V132H314Z', c.blueShade),
      k.rect(306, 102, 98, 8, 1.6, c.silver),
      k.rect(336, 78, 36, 24, 2, c.grey),
      k.rect(342, 82, 24, 9, 1, c.skyDay),
      k.flat('M343 95H365V98H343Z', c.greyShade),
    ].join('');
  },
};

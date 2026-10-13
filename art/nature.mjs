// Nature and weather words. Weather moves (rain falls, snow turns, wind blows,
// fire flickers, the sea rolls, stars twinkle); plants sway a little; rocks,
// mountains and ice keep still (the ice glints).

import { crescentPath, fmt, polar, pt, roundPoly, starPoints } from './kit.mjs';

/** A four-pointed twinkle of size r (nothing when r is 0). */
const twinkle = (k, x, y, r, color) => (r ? k.flat(roundPoly(starPoints(x, y, r, r * 0.34, 4), 0.3), color) : '');

/** A puffy cloud, its flat bottom at y, centred on x; `s` sizes it. */
export function puff(k, x, y, s, color, shade) {
  const c = k.P;
  const P = (dx, dy) => pt([x + dx * s, y + dy * s]);
  const r = (n) => fmt(n * s);
  return (
    k.path(`M${P(-17, 0)}A${r(7)} ${r(7)} 0 0 1 ${P(-15, -12)}A${r(9)} ${r(9)} 0 0 1 ${P(-2, -19)}A${r(11)} ${r(11)} 0 0 1 ${P(16, -11)}A${r(6)} ${r(6)} 0 0 1 ${P(17, 0)}Z`, c[color]) +
    k.flat(`M${P(-17, 0)}H${fmt(x + 17 * s)}V${fmt(y - 4 * s)}C${P(10, -2)} ${P(-10, -2)} ${P(-17, -4)}Z`, c[shade]) +
    k.shine(`M${P(-9, -12)}Q${P(-6, -16)} ${P(-1, -16)}`, 2)
  );
}

/** A pine tree on (x, base), h tall: tiers of dark green on a short trunk. */
export function pine(k, x, base, h) {
  const c = k.P;
  const w = h * 0.36;
  const y = (f) => base - h + h * f;
  return [
    k.rect(x - 1.8, y(0.78), 3.6, h * 0.24, 0.6, c.brown),
    k.poly(
      [[x, y(0)], [x + w * 0.62, y(0.4)], [x + w * 0.34, y(0.4)], [x + w, y(0.82)], [x - w, y(0.82)], [x - w * 0.34, y(0.4)], [x - w * 0.62, y(0.4)]],
      [1, 0.8, 0.6, 1, 1, 0.6, 0.8],
      c.greenShade,
    ),
  ].join('');
}

/** A crescent moon with two stars twinkling by it. */
export function moon(k) {
  const c = k.P;
  const f = k.frame % 4;
  return [
    k.path('M36 10.4A22 22 0 1 0 36 53.6A26 26 0 0 1 36 10.4Z', c.yellow),
    k.flat(crescentPath(32, 32, 22, 95, 190, 0.2), c.yellowShade),
    k.shine(`M${pt(polar(32, 32, 18, 196))}A18 18 0 0 1 ${pt(polar(32, 32, 18, 236))}`, 2.4),
    twinkle(k, 48.6, 18, [3.4, 5.2, 3.4, 2][f], c.amber),
    twinkle(k, 53, 41.6, [2, 3.4, 5.2, 3.4][f], c.amber),
  ].join('');
}

/** A white cloud, drifting up and down a little. */
export function cloud(k) {
  return k.g(`translate(0 ${k.frame % 2 ? -k.px : 0})`, k.ground(32, 58.6, 15, 2), puff(k, 32, 44, 1.5, 'white', 'silver'));
}

/** A grey cloud and its rain, falling. */
export function rain(k) {
  const c = k.P;
  const f = k.frame % 3;
  const drops = [[15, 0], [29, 0], [43, 0], [22, 8], [36, 8], [50, 8]].map(([x, y0]) => {
    const y = 38 + ((y0 + f * 16 / 3) % 16);
    return k.line(`M${pt([x, y])}L${pt([x - 1.6, y + 4.6])}`, { color: c.blue, sw: 2.4 });
  });
  return [...drops, puff(k, 32, 36, 1.36, 'silver', 'silverShade')].join('');
}

/** A snowflake, slowly turning. */
export function snow(k) {
  const c = k.P;
  const turn = [0, 20, 40][k.frame % 3];
  const arms = [];
  for (let i = 0; i < 6; i++) {
    const a = i * 60 - 90 + turn;
    const tip = polar(32, 32, 22, a);
    const knot = polar(32, 32, 13, a);
    arms.push(`M${pt([32, 32])}L${pt(tip)}`);
    arms.push(`M${pt(knot)}L${pt(polar(knot[0], knot[1], 6.4, a - 45))}M${pt(knot)}L${pt(polar(knot[0], knot[1], 6.4, a + 45))}`);
  }
  return [k.limb(arms.join(''), c.sky, 4.8), k.circle(32, 32, 4.6, c.white)].join('');
}

/** A flower on its stem, nodding. */
export function flower(k) {
  const c = k.P;
  const nod = k.frame % 2 ? 7 : -3;
  const petals = [0, 1, 2, 3, 4].map((i) => k.circle(...polar(32, 21, 7.6, -90 + i * 72), 6.4, c.pink)).join('');
  return [
    k.ground(32, 58.6, 11, 2),
    k.limb('M32 57V28', c.green, 4.6),
    k.g('rotate(-34 30.6 46)', k.ellipse(23.4, 46, 7.4, 3.4, c.green)),
    k.g('rotate(34 33.4 41)', k.ellipse(40.6, 41, 7, 3.2, c.green)),
    k.g(`rotate(${nod} 32 29)`, petals, k.circle(32, 21, 4.6, c.yellow), k.shineDot(30.6, 19.6, 1.2)),
  ].join('');
}

/** Two mountains with snowy tops. */
export function mountain(k) {
  const c = k.P;
  return [
    k.poly([[28, 55], [45.6, 20.6], [61, 55]], [1, 2.4, 1], c.silverShade),
    k.flat('M45.6 20.6L51.6 32.4L48.6 30.6L45.6 34.4L42.4 30.8L39.8 32.2Z', c.white),
    k.poly([[3, 55], [24.6, 10.6], [46, 55]], [1, 2.6, 1], c.grey),
    k.flat('M24.6 10.6L46 55H33.6C33 42 30.4 26 24.6 10.6Z', c.greyShade),
    k.flat('M24.6 10.6L31.8 25.4L28 23.4L24.6 27.6L21 23.6L17.4 25.8Z', c.white),
    k.path('M2 56.4C10 51.4 20 50 32 50C44 50 54 51.4 62 56.4V58.6H2Z', c.grass),
  ].join('');
}

/** A grey stone with a little moss on top. */
export function stone(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 22, 2.4),
    k.path('M10 49.6C7 41.6 11 31.6 18 26.6C24 22.2 30 19.8 37 20.6C46 21.6 53 28.6 55 37.6C56.6 44.6 55 49.6 52 51.6C50.6 52.6 49 53 47 53H14C12 53 10.8 51.6 10 49.6Z', c.grey),
    k.flat('M53.4 36.4C55 44 53 50 47.6 51.6H22C34 50 45 46 50 38C51 36.4 52 36 53.4 36.4Z', c.greyShade),
    k.flat('M21.6 25C26.6 21 33 19.6 39.4 21C44 22 47 24.6 48.6 27.6C44 25.6 39.6 25.4 35.4 26.4C31.6 27.4 28 26.6 25 28.6C24 27.4 22.6 26.4 21.6 25Z', c.green),
    k.line('M38.4 31.4L35.6 37L38.4 41.6', { color: c.greyShade, sw: 1.4 }),
    k.shine('M15.4 37.6Q16.6 32.4 20.6 29.4', 2),
  ].join('');
}

/** A lake in the forest: pines on the far shore, the water shimmering. */
export function lake(k) {
  const c = k.P;
  const s = k.frame % 2 ? 2.6 : 0;
  return [
    k.ellipse(32, 44.6, 29.4, 13.6, c.grass),
    pine(k, 13.6, 39.6, 18),
    pine(k, 22.6, 36, 23),
    pine(k, 44.6, 36.4, 21),
    pine(k, 52.6, 40.4, 15),
    k.ellipse(32, 46.6, 22, 8.4, c.water),
    k.flat(`M${fmt(19 + s)} 45.4H${fmt(27 + s)}V46.6H${fmt(19 + s)}Z`, c.white),
    k.flat(`M${fmt(33 - s)} 49.4H${fmt(43 - s)}V50.6H${fmt(33 - s)}Z`, c.white),
    k.flat(`M${fmt(36 + s)} 43H${fmt(41 + s)}V44.2H${fmt(36 + s)}Z`, c.waterShade),
  ].join('');
}

/** A big wave curling over, its spray flying. */
export function sea(k) {
  const c = k.P;
  const f = k.frame % 2;
  const spray = f ? [[53, 7.6, 1.8], [57.6, 13, 1.5], [47, 4.6, 1.4]] : [[55, 9.6, 1.8], [58.6, 16.4, 1.5], [50, 5.4, 1.4]];
  return [
    k.path('M3 58V48C14 46 20 36 24 26C28 16 36 10 45 10C53 10 59 16 59 23C59 28 55 31 51 30C54 27 53 22 49 21C44 20 40 25 41 32C42 40 49 45 61 46V58Z', c.blue),
    k.flat('M3 48C14 46 20 36 24 26C25.4 23 27 20.4 29 18.4C26 25 24 33 19.6 40.6C15.6 47.4 10 51.4 3 52Z', c.sky),
    k.flat('M24 26C28 16 36 10 45 10C53 10 59 16 59 23C59 28 55 31 51 30C55 27 55.4 20.6 51 16.6C45.6 12 36.6 13.4 31.4 20.6C29 24 27.4 27.6 25.6 30.6Z', c.white),
    k.flat('M3 53C12 52 18 50 24 47.4C30 50.4 38 51.6 46 50.6C52 49.8 56.6 49.8 61 50.6V58H3Z', c.sky),
    k.line(`M${fmt(10 + f * 2.6)} 55H${fmt(18 + f * 2.6)}M${fmt(34 - f * 2.6)} 54.6H${fmt(43 - f * 2.6)}`, { color: c.white, sw: 1.4 }),
    ...spray.map(([x, y, r]) => k.circle(x, y, r + 0.8, c.white)),
  ].join('');
}

/** A window of blue sky: the sun, a drifting cloud and two birds. */
export function sky(k) {
  const c = k.P;
  const f = k.frame % 4;
  const dx = [0, 1, 2, 1][f] * k.px;
  const bird = (x, y, up) =>
    k.line(up ? `M${pt([x - 5, y - 3.4])}Q${pt([x - 2.4, y - 3.4])} ${pt([x, y])}Q${pt([x + 2.4, y - 3.4])} ${pt([x + 5, y - 3.4])}` : `M${pt([x - 5, y + 1])}Q${pt([x - 2.4, y - 2.6])} ${pt([x, y])}Q${pt([x + 2.4, y - 2.6])} ${pt([x + 5, y + 1])}`, { sw: 1.6 });
  return [
    k.rect(5.6, 7.6, 52.8, 48.8, 9, c.sky),
    k.flat('M6.6 41H57.4V48C57.4 52.6 54 55.4 49.6 55.4H14.4C10 55.4 6.6 52.6 6.6 48Z', c.skyDay),
    k.circle(44.6, 21.6, 6.4, c.yellow),
    k.g(`translate(${fmt(dx)} 0)`, puff(k, 26, 44, 0.92, 'white', 'silver')),
    bird(17.6, 22, f % 2 === 0),
    bird(29, 16.6, f % 2 === 1),
  ].join('');
}

/** Wind: gusts curling, a leaf blown along. */
export function wind(k) {
  const c = k.P;
  const f = k.frame % 4;
  const [lx, ly, la] = [[30, 52, 0], [37, 49.6, 40], [44, 51, 80], [51, 48.6, 120]][f];
  return [
    k.limb('M7 22.6H37C43.4 22.6 45.6 14.6 40 12.6C35.6 11 33 15.4 36 17.6', c.sky, 4.8),
    k.limb('M13 33H47.6C54 33 56 41 50.4 43C46 44.6 43.4 40.2 46.4 38', c.sky, 4.8),
    k.limb(f % 2 ? 'M8 43.6H31' : 'M5 43.6H28', c.sky, 4.8),
    k.g(`rotate(${la} ${lx} ${ly})`, k.ellipse(lx, ly, 5, 2.6, c.green) + k.line(`M${pt([lx - 4, ly])}H${fmt(lx + 3.4)}`, { color: c.greenShade, sw: 1.4 })),
  ].join('');
}

/** An ice cube, a glint crossing it. */
export function ice(k) {
  const c = k.P;
  const f = k.frame;
  return [
    k.ground(32, 58.6, 18, 2.2),
    k.poly([[44, 26], [54, 18], [54, 44], [44, 54]], 1.6, c.sky),
    k.poly([[12, 26], [22, 18], [54, 18], [44, 26]], 1.6, c.skyDayLow),
    k.rect(12, 26, 32, 28, 2.4, c.skyDay),
    k.flat('M33 27.4H42.6V52.6H39.6C41.6 45 41.6 36 33 27.4Z', c.sky),
    f >= 1 && f <= 3 ? k.flat(`M${8 + f * 8} 27L${13 + f * 8} 27L${5 + f * 8} 53L${f * 8} 53Z`, c.white) : '',
    k.shine('M16.4 30V40', 2.2),
    k.shineDot(16.4, 44.2, 1.2),
  ].join('');
}

/** A green leaf, swaying on its stem. */
export function leaf(k) {
  const c = k.P;
  const sway = k.frame % 2 ? 8 : -4;
  return [
    k.ground(30, 58.6, 14, 2),
    k.g(
      `rotate(${sway} 18 52)`,
      k.limb('M22 48L15 55.6', c.greenShade, 3.8),
      k.path('M21 49C15.6 34.6 22.6 15.4 46.6 9.6C51.6 29.6 42.6 46.4 21 49Z', c.green),
      k.flat('M21 49C33.6 43 42.4 31.4 46.6 10.6C49.6 30.6 40.6 46.4 21 49Z', c.greenShade),
      k.line('M21.6 48.4Q33 33.6 44.6 13M27 40.4L24.6 32.6M32 34L31.6 25.4M37 27.4L37.6 20.4M30.6 37.4L38.6 36M35.4 30.6L42.4 28.6', { color: c.greenShade, sw: 1.4 }),
      k.shine('M24.6 34.4Q26 25.4 33 19.6', 1.6),
    ),
  ].join('');
}

/** A campfire on two logs, flickering, sparks rising. */
export function fire(k) {
  const c = k.P;
  const f = k.frame % 3;
  const [tip, lean] = [[8, 0], [10.6, 2.6], [9.2, -2.4]][f];
  const flame = (x, top, w, bottom) =>
    `M${pt([x + lean, top])}C${pt([x + lean * 0.6 + w * 0.3, top + (bottom - top) * 0.28])} ${pt([x + w, top + (bottom - top) * 0.42])} ${pt([x + w, top + (bottom - top) * 0.7])}C${pt([x + w, bottom - 2])} ${pt([x + w * 0.5, bottom])} ${pt([x, bottom])}C${pt([x - w * 0.5, bottom])} ${pt([x - w, bottom - 2])} ${pt([x - w, top + (bottom - top) * 0.7])}C${pt([x - w, top + (bottom - top) * 0.48])} ${pt([x - w * 0.5, top + (bottom - top) * 0.4])} ${pt([x - w * 0.4, top + (bottom - top) * 0.22])}C${pt([x - w * 0.1, top + (bottom - top) * 0.32])} ${pt([x + lean * 0.4, top + (bottom - top) * 0.12])} ${pt([x + lean, top])}Z`;
  const sparks = [[22, 18, 1.4], [42, 14, 1.2], [37, 6, 1]].map(([x, y, r], i) => k.flatCircle(x + (i - 1) * f, y - ((f + i) % 3) * 3, r + 0.4, c.amber));
  return [
    k.ground(32, 58.6, 21, 2.4),
    k.g('rotate(14 32 51)', k.rect(12, 47.4, 40, 7, 3.5, c.brown) + k.flatEllipse(49.4, 50.9, 1.8, 2.2, c.wood)),
    k.path(flame(32, tip, 15, 51), c.orange),
    k.flat(flame(32, tip + 12, 10, 51), c.amber),
    k.flat(flame(32, tip + 22, 6, 51), c.yellow),
    k.g('rotate(-14 32 51)', k.rect(12, 47.4, 40, 7, 3.5, c.brown) + k.flatEllipse(14.6, 50.9, 1.8, 2.2, c.wood)),
    ...sparks,
  ].join('');
}

/** A tuft of grass, swaying. */
export function grass(k) {
  const c = k.P;
  const sway = k.frame % 2 ? 2.4 : -1;
  const blades = [
    [21, 30, -10, 'greenShade'],
    [43, 32, 10, 'greenShade'],
    [27, 42, -4, 'green'],
    [37, 38, 5, 'green'],
    [15, 22, -11, 'green'],
    [49, 21, 12, 'green'],
  ];
  return [
    k.ground(32, 58.6, 22, 2.2),
    ...blades.map(([x, h, lean, color]) => {
      const tip = [x + lean + sway, 56.6 - h];
      return k.path(`M${pt([x - 4.6, 56.6])}Q${pt([x - 3 + lean * 0.3, 56.6 - h * 0.62])} ${pt(tip)}Q${pt([x + 4 + lean * 0.4, 56.6 - h * 0.5])} ${pt([x + 4.6, 56.6])}Z`, c[color]);
    }),
    k.circle(30 + sway * 0.6, 15.6, 3.2, c.white),
    k.flatCircle(30 + sway * 0.6, 15.6, 1.4, c.yellow),
  ].join('');
}

/** An island in a lake: rocks, grass and a pine; the water rippling round it. */
export function island(k) {
  const c = k.P;
  const s = k.frame % 2 ? 2.6 : 0;
  return [
    k.ellipse(32, 47.6, 29.4, 9.6, c.water),
    k.flat(`M${fmt(6 + s)} 49.4H${fmt(12 + s)}V50.6H${fmt(6 + s)}Z`, c.white),
    k.flat(`M${fmt(50 - s)} 51.4H${fmt(57 - s)}V52.6H${fmt(50 - s)}Z`, c.white),
    k.flat(`M${fmt(26 + s)} 54.2H${fmt(36 + s)}V55.4H${fmt(26 + s)}Z`, c.waterShade),
    k.path('M13.4 48.6C14.6 41.6 22 36.6 31.6 36.6C41.2 36.6 48.6 41.6 50 48.6C42 51 22 51 13.4 48.6Z', c.grass),
    k.ellipse(17.6, 47.6, 4.6, 2.8, c.grey),
    k.ellipse(45.4, 48, 4, 2.4, c.grey),
    pine(k, 31.6, 41.6, 34),
  ].join('');
}

// Time words: the four times of day as little windows onto the same lake
// country (morning, daytime, evening, night), the four seasons, the weekend
// and a birthday. Most of them move a little: the sun rises, the cloud drifts,
// windows light up, stars twinkle, leaves and snow fall, candles flicker.

import { fmt, polar, pt, roundPoly, starPoints } from './kit.mjs';
import { pine, puff } from './nature.mjs';

/** A rounded window onto a scene: its sky bands, whatever's in it, its frame. */
function windowScene(k, top, low, inner) {
  const c = k.P;
  return [
    k.rect(5.6, 5.6, 52.8, 52.8, 8, c[top]),
    k.flat('M6.6 30H57.4V57.4H6.6Z', c[low]),
    inner,
    k.rect(5.6, 5.6, 52.8, 52.8, 8, 'none'),
  ].join('');
}

/** Lit windows in a row of little houses (`lit` says which are on). */
function houses(k, lit, wall = 'charcoal') {
  const c = k.P;
  const out = [];
  const roofs = [[8, 40, 16], [22, 36, 16], [38, 39, 18]];
  roofs.forEach(([x, y, w], i) => {
    out.push(k.flat(`M${fmt(x)} ${fmt(y + 4)}L${fmt(x + w / 2)} ${fmt(y)}L${fmt(x + w)} ${fmt(y + 4)}V57.4H${fmt(x)}Z`, c[wall]));
    const on = lit[i];
    out.push(k.flat(`M${fmt(x + w / 2 - 2.6)} ${fmt(y + 7)}h5.2v4.6h-5.2Z`, on ? c.yellow : c.charcoalShade));
  });
  return out.join('');
}

/** The weekend: a party popper going off, confetti flying. */
export function weekend(k) {
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

/** Morning: the sun coming up over the lake and the forest. */
export function morning(k) {
  const c = k.P;
  const rise = k.frame % 2 ? -k.px : 0;
  return windowScene(
    k,
    'skyDay',
    'skyEveningLow',
    [
      k.flat('M6.6 30H57.4V37H6.6Z', c.skyEvening),
      k.circle(32, 39 + rise, 9, c.yellow),
      k.flat('M6.6 40H57.4V57.4H6.6Z', c.water),
      k.flat('M20 44H44V45.4H20ZM24 49H40V50.4H24Z', c.yellow),
      pine(k, 12, 41, 14),
      pine(k, 52, 41, 16),
    ].join(''),
  );
}

/** Daytime: the sun high over a green hill, a cloud drifting by. */
export function daytime(k) {
  const c = k.P;
  const dx = k.frame % 2 ? k.px : 0;
  return windowScene(
    k,
    'sky',
    'skyDay',
    [
      k.circle(43, 18, 6.6, c.yellow),
      k.g(`translate(${fmt(dx)} 0)`, puff(k, 21, 27, 0.66, 'white', 'silver')),
      k.flat('M6.6 44C16 37 30 36 40 40C46 38 52 38 57.4 40V57.4H6.6Z', c.grass),
      k.flat('M6.6 50C20 46 40 46 57.4 49V57.4H6.6Z', c.grassShade),
    ].join(''),
  );
}

/** Evening: the sun going down behind the houses, their windows lighting up. */
export function evening(k) {
  const c = k.P;
  const f = k.frame % 2;
  return windowScene(
    k,
    'skyEvening',
    'skyEveningLow',
    [k.circle(32, 40, 10, c.orange), houses(k, f ? [true, false, true] : [true, true, false])].join(''),
  );
}

/** Night: the moon and twinkling stars over the sleeping houses. */
export function night(k) {
  const c = k.P;
  const f = k.frame % 2;
  const star = (x, y, r) => k.flat(roundPoly(starPoints(x, y, r, r * 0.34, 4), 0.3), c.starlight);
  return windowScene(
    k,
    'skyNight',
    'skyNightLow',
    [
      k.path('M44.6 11A7 7 0 1 0 44.6 24.6A8.6 8.6 0 0 1 44.6 11Z', c.starlight),
      star(16, 14, f ? 2.6 : 1.6),
      star(26, 22, f ? 1.6 : 2.6),
      star(54, 30, f ? 1.8 : 2.8),
      houses(k, [false, true, false], 'charcoalShade'),
    ].join(''),
  );
}

/** Spring: a sprout coming up out of the soil, swaying. */
export function spring(k) {
  const c = k.P;
  const sway = k.frame % 2 ? 6 : -4;
  return [
    k.ground(32, 58.6, 18, 2),
    k.g(
      `rotate(${sway} 32 46)`,
      k.limb('M32 46V28', c.green, 4.4),
      k.g('rotate(-30 30 29)', k.ellipse(22.6, 29, 8, 4.4, c.green) + k.line('M16.6 29H28', { color: c.greenShade, sw: 1.2 })),
      k.g('rotate(26 34 26)', k.ellipse(41.4, 26, 8.6, 4.6, c.lime) + k.line('M35.6 26H47.6', { color: c.limeShade, sw: 1.2 })),
    ),
    k.path('M14 52C14 46 22 43 32 43C42 43 50 46 50 52C50 55 42 56.6 32 56.6C22 56.6 14 55 14 52Z', c.brown),
    k.flat('M18 49.6h3v2h-3ZM40 48.6h3v2h-3ZM29 52h3v2h-3Z', c.brownShade),
  ].join('');
}

/** Summer: a striped parasol on the beach in the sun. */
export function summer(k) {
  const c = k.P;
  const long = k.frame % 2 === 0;
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const a = i * 45;
    rays.push(k.limb(`M${pt(polar(48, 14, 8, a))}L${pt(polar(48, 14, (i % 2 === 0) === long ? 11.4 : 10, a))}`, c.amber, 3.8));
  }
  return [
    ...rays,
    k.circle(48, 14, 6, c.yellow),
    k.flatEllipse(30, 55, 28, 5, c.path),
    k.limb('M24 24V55', c.wood, 3.8),
    k.path('M6 28C6 16 15 9 24 9C33 9 42 16 42 28C39 26 36 26 33 28C30 26 27 26 24 28C21 26 18 26 15 28C12 26 9 26 6 28Z', c.red),
    k.flat('M13.4 26.6C13.4 17 16 11.6 20 10C17.4 14 17 20 17.2 26.4ZM28 10C32 11.6 34.6 17 34.6 26.6L30.8 26.4C31 20 30.6 14 28 10Z', c.white),
    k.rect(36, 46, 9, 8, 1.4, c.blue),
    k.limb('M37 46Q40.6 40 44 46', c.blueShade, 3.8),
  ].join('');
}

/** Autumn: leaves falling, a little pile of them below. */
export function autumn(k) {
  const c = k.P;
  const f = k.frame % 3;
  const leaf = (x, y, a, col) =>
    k.g(`rotate(${a} ${fmt(x)} ${fmt(y)})`, k.path(`M${pt([x - 6, y])}C${pt([x - 3, y - 4.4])} ${pt([x + 3, y - 4.4])} ${pt([x + 6, y])}C${pt([x + 3, y + 4.4])} ${pt([x - 3, y + 4.4])} ${pt([x - 6, y])}Z`, c[col]) + k.line(`M${pt([x - 5, y])}H${fmt(x + 5)}`, { color: c[`${col}Shade`], sw: 1.2 }));
  return [
    k.ground(32, 58.6, 22, 2),
    leaf(18 + f * 2, 12 + f * 5, -20 + f * 30, 'orange'),
    leaf(44 - f * 2, 22 + f * 5, 30 - f * 30, 'red'),
    leaf(30 + f, 32 + f * 4, f * 40, 'yellow'),
    leaf(16, 53, -10, 'red'),
    leaf(29, 54, 15, 'orange'),
    leaf(42, 53, -25, 'yellow'),
    leaf(36, 50, 40, 'red'),
  ].join('');
}

/** Winter: a snowman in a hat and scarf, snow falling round him. */
export function winter(k) {
  const c = k.P;
  const f = k.frame % 2;
  const flakes = [[10, 10], [52, 14], [14, 34], [54, 38], [8, 52], [44, 6], [24, 6]];
  return [
    ...flakes.map(([x, y], i) => k.flatCircle(x + (f && i % 2 ? 1.4 : 0), y + f * 3, 1.3, c.sky)),
    k.ground(32, 58.6, 18, 2.2),
    k.circle(32, 45, 12, c.white),
    k.limb('M20.6 36L11.6 30M43.4 36L52.4 30', c.brown, 3.8),
    k.circle(32, 26, 8.6, c.white),
    k.flat('M38 18.6C41.6 21 42.4 26 40.6 29.6C39.4 32 37 33.6 34.4 34.2C37.6 31.6 39 27.4 38 18.6Z', c.silver),
    k.flatCircle(32, 42, 1.2, c.charcoal),
    k.flatCircle(32, 47, 1.2, c.charcoal),
    k.rect(22.6, 31, 18.8, 4.4, 2, c.red),
    k.rect(33, 33, 4.4, 9, 1.6, c.red),
    k.rect(24, 15, 16, 3, 1, c.charcoal),
    k.rect(26.6, 6.6, 10.8, 9.4, 1, c.charcoal),
    k.eye(29, 24.4, 2),
    k.eye(35, 24.4, 2),
    k.poly([[31.4, 27.4], [38.6, 29.4], [31.4, 30]], [0.6, 0.6, 0.6], c.orange),
  ].join('');
}

/** A birthday cake with three candles, flickering. */
export function birthday(k) {
  const c = k.P;
  const f = k.frame % 3;
  const flame = (x, i) => {
    const lean = [[0, 1.2, -1], [1.2, -1, 0], [-1, 0, 1.2]][f][i];
    return (
      k.path(`M${pt([x + lean, 5])}C${pt([x + 3.6, 9])} ${pt([x + 3.6, 14.6])} ${pt([x, 15.4])}C${pt([x - 3.6, 14.6])} ${pt([x - 3.6, 9])} ${pt([x + lean, 5])}Z`, c.orange) +
      k.flatEllipse(x, 12.6, 1.4, 2, c.yellow)
    );
  };
  return [
    k.ground(32, 58.6, 24, 2),
    ...[22, 32, 42].map((x, i) => flame(x, i) + k.rect(x - 1.8, 15.6, 3.6, 10, 0.8, c[['blue', 'purple', 'lime'][i]])),
    k.rect(10, 34, 44, 20, 3, c.tan),
    k.flat('M10 40H54V43H10Z', c.pink),
    k.rect(14, 24, 36, 12, 3, c.pink),
    k.flat('M14.6 34.4C17 36.4 19 36.4 21 34.4C23 37 25 37 27 34.4C29 37 31 37 33 34.4C35 37 37 37 39 34.4C41 37 43 37 45 34.4C46.6 36.4 48 36.4 49.4 34.4V36H14.6Z', c.white),
    ...[[18, 28], [26, 30], [34, 28], [42, 30], [46, 27]].map(([x, y], i) => k.flatCircle(x, y, 1, c[['red', 'yellow', 'blue', 'green', 'purple'][i]])),
    k.ellipse(32, 54, 26, 3.6, c.white),
  ].join('');
}

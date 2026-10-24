// The math section's pictures (Lasketaan!): the crowns its stages win, the
// lightning of quick sums, the fox at its market stall (the home card), and
// the games' pieces — the apple tree and its empty basket, the scale's stand
// and pans, the train's engine and wagon, the rocket on its pad.
//
// None shows a digit, a price or a clock face: a number in the math section is
// only ever a Finnish word. The games lay the pieces out and put the words on
// them (src/components/math/MathScenes.tsx).

import { fox } from './animals-sitting.mjs';
import { tree as sceneTree } from './scenes/parts.mjs';

/** A stage's crown, in its color: a gold band and tips, a white gem. */
export function crown(color) {
  return (k) => {
    const c = k.P;
    return [
      k.ground(32, 56.6, 21, 2),
      k.poly(
        [
          [9.6, 21.4],
          [21, 33.4],
          [32, 15],
          [43, 33.4],
          [54.4, 21.4],
          [50.6, 51.4],
          [13.4, 51.4],
        ],
        [1, 1.6, 1, 1.6, 1, 2, 2],
        c[color],
      ),
      k.flat('M46.6 34L54 25.6L50.6 51H44.6Z', c[`${color}Shade`]),
      k.rect(12.4, 41.4, 39.2, 7.4, 1.2, c.yellow),
      k.flat('M13.4 45.6H50.6V47.8H13.4Z', c.yellowShade),
      k.circle(9.6, 19.4, 3.4, c.yellow),
      k.circle(32, 12.6, 3.8, c.yellow),
      k.circle(54.4, 19.4, 3.4, c.yellow),
      k.poly(
        [
          [32, 26.6],
          [36.6, 31.6],
          [32, 36.6],
          [27.4, 31.6],
        ],
        0.8,
        c.white,
      ),
      k.flatCircle(20.6, 45, 1.8, c.red),
      k.flatCircle(32, 45, 1.8, c.blue),
      k.flatCircle(43.4, 45, 1.8, c.green),
      k.shine('M14.6 27.4L17.6 37', 1.8),
      k.shineDot(30.6, 11.4, 1),
    ].join('');
  };
}

/** Lightning: quick sums (Nopeasti!). */
export function lightning(k) {
  const c = k.P;
  return [
    k.ground(32, 59, 12, 1.8),
    k.poly(
      [
        [38.6, 4],
        [13.4, 35.4],
        [28.6, 35.4],
        [21.4, 60],
        [50.6, 24.6],
        [35, 24.6],
        [45.4, 4],
      ],
      1.2,
      c.yellow,
    ),
    k.flat('M35 24.6H48.6L46.4 27.4H33.6Z', c.yellowShade),
    k.flat('M28.6 35.4H31.6L26 52Z', c.yellowShade),
    k.shine('M38.6 8.4L22.6 30', 2),
  ].join('');
}

/**
 * The fox at its market stall, counting apples into a basket: the math card
 * on the home screen. An apple drops from its paw into the basket and back.
 */
export function card(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 2 : 0;
  // the striped awning, scalloped along its edge
  const stripes = [];
  for (let i = 0; i < 6; i++) {
    const x = 4 + i * 9.4;
    stripes.push(k.flat(`M${x} 7H${x + 9.4}V16C${x + 9.4} 19.4 ${x} 19.4 ${x} 16Z`, i % 2 ? c.white : c.red));
  }
  const apple = (x, y, r = 3.4) =>
    k.circle(x, y, r, c.red) + k.flatCircle(x - r * 0.38, y - r * 0.38, r * 0.3, c.white) + k.flat(`M${x} ${y - r}L${x + 1.6} ${y - r - 2.4}`, c.green) + k.line(`M${x} ${y - r}L${x + 1} ${y - r - 2}`, { color: c.brown, sw: 1.2 });
  return [
    // the posts and the awning over the stall
    k.rect(5, 12, 4, 40, 1, c.woodShade),
    k.rect(55, 12, 4, 40, 1, c.woodShade),
    k.rect(2.6, 4.6, 58.8, 4.4, 1.4, c.redShade),
    ...stripes,
    k.path('M4 7H60.4V16C60.4 19.4 51 19.4 51 16C51 19.4 41.6 19.4 41.6 16C41.6 19.4 32.2 19.4 32.2 16C32.2 19.4 22.8 19.4 22.8 16C22.8 19.4 13.4 19.4 13.4 16C13.4 19.4 4 19.4 4 16Z', 'none'),
    // the fox behind the counter
    k.g('translate(17 12) scale(0.62)', fox(k)),
    // the counter
    k.rect(3, 41, 58, 6, 1.4, c.wood),
    k.rect(5, 46, 54, 13, 1, c.woodShade),
    k.line('M5 52.4H59', { color: c.brown, sw: 1.2 }),
    // apples on the counter, and the basket they go into
    apple(52, 37.6),
    apple(45.6, 38.4),
    k.limb('M7.6 33.6C7.6 21.6 25.4 21.6 25.4 33.6', c.wood, 4.6),
    k.path('M5.4 33.8H27.6L25.4 44.6H7.6Z', c.wood),
    k.line('M6.6 37.8H26.4M7.4 41.4H25.8', { color: c.woodShade, sw: 1.2 }),
    apple(12, 31.4, 3),
    apple(19.4, 31, 3),
    // the apple on its way down into the basket
    f ? apple(16, 24, 3.2) : apple(33, 30, 3.2),
  ].join('');
}

/** An apple tree: a round tree hung with red apples. */
export function appleTree(k) {
  const c = k.P;
  const apples = [
    [23.4, 15.4],
    [37, 11],
    [43.4, 22.4],
    [28.6, 25.6],
    [19.6, 26.4],
    [35.6, 19.6],
  ];
  return k.g(
    `translate(${k.frame % 2 ? k.px : 0} 0)`,
    k.ground(32, 58, 15, 2.2),
    sceneTree(k, 32, 58, 0.86),
    ...apples.map(([x, y]) => k.circle(x, y, 2.8, c.red) + k.flatCircle(x - 1, y - 1, 0.8, c.white)),
  );
}

/** An empty basket, waiting for apples. */
export function emptyBasket(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 21, 2.2),
    k.limb('M14.6 33C14.6 12 49.4 12 49.4 33', c.wood, 5),
    k.flat('M12.6 33.4H51.4L50.6 37H13.4Z', c.woodShade),
    k.path('M10 33.4H54L50 54.6C49.6 56.4 48.2 57.4 46.4 57.4H17.6C15.8 57.4 14.4 56.4 14 54.6Z', c.wood),
    k.line('M12 39.6H52M13.2 46H50.8M14.4 52H49.6', { color: c.woodShade, sw: 1.4 }),
    k.line('M19 34V57M26.6 34V57M34.4 34V57M42 34V57', { color: c.woodShade, sw: 1.4 }),
    k.rect(8.6, 30.6, 46.8, 4.8, 2, c.wood),
  ].join('');
}

/**
 * The scale's stand: a wooden post on its foot, a brass pivot on top (the
 * beam, drawn by the game, turns on it). The pivot sits near the top edge.
 */
export function scaleStand(k) {
  const c = k.P;
  return [
    k.ground(32, 59.4, 18, 2),
    k.poly(
      [
        [21.4, 51],
        [42.6, 51],
        [48, 58.4],
        [16, 58.4],
      ],
      1.4,
      c.wood,
    ),
    k.flat('M18 55.6H46L48 58.4H16Z', c.woodShade),
    k.rect(29, 7, 6, 45, 1.4, c.wood),
    k.flat('M32.6 9H34V50H32.6Z', c.woodShade),
    k.circle(32, 6, 4.6, c.yellow),
    k.shineDot(30.4, 4.6, 1.1),
  ].join('');
}

/** A pan of the scale: a shallow brass dish on two cords from a ring at the top. */
export function scalePan(k) {
  const c = k.P;
  return [
    k.line('M32 6.6L7.6 41.4M32 6.6L56.4 41.4', { color: c.charcoal, sw: 1.4 }),
    k.circle(32, 4.6, 2.6, c.yellow),
    k.path('M5 41H59C57.4 50.4 47.6 54.4 32 54.4C16.4 54.4 6.6 50.4 5 41Z', c.yellow),
    k.flat('M44.6 42.6H57.6C56 48.6 50.6 51.6 42 53C44.6 49.6 45.4 46.4 44.6 42.6Z', c.yellowShade),
    k.rect(3.4, 38.6, 57.2, 3.6, 1.6, c.yellowShade),
    k.shine('M11 45.4Q18 50 26 51', 1.6),
  ].join('');
}

/** The train's engine, facing right (the front): its smoke puffs, its wheels turn. */
export function engine(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 2 : 0;
  const wheel = (x, y, r) =>
    k.circle(x, y, r, c.charcoal) +
    k.flatCircle(x, y, r * 0.42, c.grey) +
    k.line(f ? `M${x - r * 0.7} ${y}H${x + r * 0.7}` : `M${x} ${y - r * 0.7}V${y + r * 0.7}`, { color: c.grey, sw: 1.4 });
  return [
    k.ground(32, 59, 27, 2),
    // smoke from the chimney
    k.circle(f ? 47 : 45, f ? 6 : 8, f ? 3.4 : 2.8, c.white),
    k.circle(f ? 53.6 : 51.4, f ? 2.4 : 4, f ? 2.4 : 3.2, c.white),
    // the chimney
    k.rect(39.4, 10.6, 9.2, 4, 1, c.charcoal),
    k.rect(41, 13.6, 6, 15, 0.8, c.charcoal),
    // the boiler, with its yellow bands, and the lamp at the front
    k.rect(23, 26.4, 31, 20, 2.6, c.red),
    k.flat('M24.4 41H52.6V45H24.4Z', c.redShade),
    k.rect(32, 26.4, 3.4, 20, 0.6, c.yellow),
    k.rect(43.4, 26.4, 3.4, 20, 0.6, c.yellow),
    k.circle(55.4, 33, 3, c.yellow),
    // the cab, its roof and window
    k.rect(5, 18.6, 21, 28, 1.4, c.red),
    k.flat('M21 20H24.6V45H21Z', c.redShade),
    k.rect(2.6, 14.4, 25.8, 5.4, 1.4, c.navy),
    k.rect(9, 23, 11, 9, 1, c.sky),
    k.shine('M11 25.4V29', 1.4),
    // the frame, the cowcatcher and the wheels
    k.rect(3, 45, 54.4, 4.6, 1, c.charcoal),
    k.poly(
      [
        [54.6, 44.6],
        [61.4, 51.4],
        [54.6, 51.4],
      ],
      0.6,
      c.charcoal,
    ),
    wheel(15, 51.4, 7),
    wheel(36, 53, 5.4),
    wheel(47.6, 53, 5.4),
  ].join('');
}

/** A train wagon: an open box on wheels (the game sets a word in it). */
export function wagon(k) {
  const c = k.P;
  return [
    k.ground(32, 59, 27, 2),
    k.rect(0.6, 42, 6, 3, 0.6, c.charcoal),
    k.rect(57.4, 42, 6, 3, 0.6, c.charcoal),
    k.rect(5, 26, 54, 21, 1.6, c.blue),
    k.flat('M48 27.4H57.6V45.6H48Z', c.blueShade),
    k.rect(5, 26, 54, 4.4, 1.2, c.yellow),
    k.line('M18.4 31V46M31.8 31V46M45.2 31V46', { color: c.blueShade, sw: 1.4 }),
    k.rect(3.4, 45, 57.2, 4.4, 1, c.charcoal),
    k.circle(17, 51.6, 5.6, c.charcoal),
    k.flatCircle(17, 51.6, 2.2, c.grey),
    k.circle(47, 51.6, 5.6, c.charcoal),
    k.flatCircle(47, 51.6, 2.2, c.grey),
  ].join('');
}

/** A rocket standing on its launch pad, its flame flickering: the countdown's. */
export function rocketOnPad(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 2 : 0;
  return [
    k.ground(32, 60, 24, 2),
    // the flame under it
    k.path(f ? 'M26 47Q32 62 38 47Z' : 'M27 47Q32 57 37 47Z', c.orange),
    k.path(f ? 'M28.6 47Q32 58 35.4 47Z' : 'M29.4 47Q32 54 34.6 47Z', c.yellow),
    // the fins and body
    k.path('M24.6 32.6L14.6 46.6L17.6 48.6L25.4 44Z', c.red),
    k.path('M39.4 32.6L49.4 46.6L46.4 48.6L38.6 44Z', c.red),
    k.path('M32 4C40.4 10.4 42.2 22 41.4 34L40 47.2H24L22.6 34C21.8 22 23.6 10.4 32 4Z', c.white),
    k.flat('M32 5C36 8 38.4 12.4 39.6 16.4H24.4C25.6 12.4 28 8 32 5Z', c.red),
    k.flat('M37.4 17.4H40.4C41.4 23.6 41.6 29.8 41 35.6L39.8 46.4H36.8C38 37 38.4 27.4 37.4 17.4Z', c.silverShade),
    k.line('M24.2 16.6H39.8', { sw: 1.4 }),
    k.circle(32, 27, 5.4, c.sky),
    k.shineDot(30.4, 25.6, 1.4),
    // the pad
    k.rect(12, 56, 40, 4, 1, c.charcoal),
    k.rect(17, 50, 4, 7, 0.6, c.grey),
    k.rect(43, 50, 4, 7, 0.6, c.grey),
  ].join('');
}

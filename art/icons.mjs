// The app's buttons and signs: arrows, play, add, settings, a bin, done and
// warning, again and mix, search, a box to put things in, a "new" sticker,
// the speaker with no sound, charts, players, the Finnish flag and a thumbs
// down. Flat signs, no ground shadow (things that stand, like the bin, cast one).

import { crescentPath, fmt, polar, pt, roundPoly } from './kit.mjs';
import { thumbHand } from './adjectives.mjs';

// --- Arrows ----------------------------------------------------------------------

/** A chunky blue arrow pointing right (turn it with `transform`), its shine along the top of the shaft. */
function arrow(k, transform = '') {
  const c = k.P;
  const body = k.poly(
    [
      [9, 25],
      [33, 25],
      [33, 12.6],
      [56, 32],
      [33, 51.4],
      [33, 39],
      [9, 39],
    ],
    [2.4, 1, 2, 3, 2, 1, 2.4],
    c.blue,
  );
  const inner = body + k.flat('M10 35.6H34V38H10ZM34 47.6L52.4 32H55.6L34 50Z', c.blueShade) + k.shine('M12.4 28.4H28', 2);
  return transform ? k.g(transform, inner) : inner;
}

export const arrowRight = (k) => arrow(k);
export const arrowLeft = (k) => arrow(k, 'translate(64 0) scale(-1 1)');
export const arrowUp = (k) => arrow(k, 'rotate(-90 32 32)');
export const arrowDown = (k) => arrow(k, 'translate(0 64) scale(1 -1) rotate(-90 32 32)');

/** Play (and turn the page): a rounded green triangle pointing right; `back` points it left. */
export function play(k, back = false) {
  const c = k.P;
  const inner =
    k.poly(
      [
        [17, 10],
        [54, 32],
        [17, 54],
      ],
      [4.4, 4.4, 4.4],
      c.green,
    ) +
    k.flat('M18.2 44L49 30.6L52 32L18.2 52Z', c.greenShade) +
    k.shine('M21.6 17V30', 2.2);
  return back ? k.g('translate(64 0) scale(-1 1)', inner) : inner;
}

/** A reply: an arrow that comes down, hooks and points right (↪). */
export function reply(k) {
  const c = k.P;
  return [
    k.poly(
      [
        [38, 30.4],
        [55.4, 42],
        [38, 53.6],
      ],
      [1.4, 2.4, 1.4],
      c.blue,
    ),
    k.limb('M17 10V30Q17 42 29 42H39.4', c.blue, 9.6),
  ].join('');
}

// --- Buttons ---------------------------------------------------------------------

/** Add: a rounded green plus. */
export function add(k) {
  const c = k.P;
  return [
    k.poly(
      [
        [25.6, 9],
        [38.4, 9],
        [38.4, 25.6],
        [55, 25.6],
        [55, 38.4],
        [38.4, 38.4],
        [38.4, 55],
        [25.6, 55],
        [25.6, 38.4],
        [9, 38.4],
        [9, 25.6],
        [25.6, 25.6],
      ],
      [2.6, 2.6, 1, 2.6, 2.6, 1, 2.6, 2.6, 1, 2.6, 2.6, 1],
      c.green,
    ),
    k.flat('M10 35H25.6V37.4H10ZM38.4 35H54V37.4H38.4ZM26.6 51.6H37.4V54H26.6Z', c.greenShade),
    k.shine('M28.6 12.6V24', 2),
  ].join('');
}

/** Settings: a grey cog with a hole through it. */
export function settings(k) {
  const c = k.P;
  const teeth = 8;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = (360 / teeth) * i;
    pts.push(polar(32, 32, 19.4, a - 15), polar(32, 32, 26.6, a - 9), polar(32, 32, 26.6, a + 9), polar(32, 32, 19.4, a + 15));
  }
  const ring = `${roundPoly(pts, 1.4)}M${pt([32 + 8.4, 32])}A8.4 8.4 0 1 0 ${pt([32 - 8.4, 32])}A8.4 8.4 0 1 0 ${pt([32 + 8.4, 32])}Z`;
  return [
    k.path(ring, c.grey),
    k.flat(crescentPath(32, 32, 19.4, -10, 120, 0.2), c.greyShade),
    k.shine(`M${pt(polar(32, 32, 15.4, 200))}A15.4 15.4 0 0 1 ${pt(polar(32, 32, 15.4, 240))}`, 2),
  ].join('');
}

/** A wastebasket: clear it all away. */
export function bin(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 15, 2),
    k.poly(
      [
        [15, 20],
        [49, 20],
        [45.6, 56.4],
        [18.4, 56.4],
      ],
      [1, 1, 2.6, 2.6],
      c.silver,
    ),
    k.flat('M40.4 21H48L44.8 55.4H38.8Z', c.silverShade),
    k.line('M24 25.6L25.4 51.4M32 25.6V51.4M40 25.6L38.6 51.4', { color: c.grey, sw: 1.6 }),
    k.rect(26, 7.6, 12, 6, 2.4, c.grey),
    k.rect(11, 12.4, 42, 7.6, 2.4, c.grey),
    k.flat('M12 17H52V19H12Z', c.greyShade),
  ].join('');
}

/** Done: a green tick on a green square. */
export function done(k) {
  const c = k.P;
  return [
    k.rect(8, 8, 48, 48, 10, c.green),
    k.flat('M9 44H55V46C55 51 51 55 46 55H18C13 55 9 51 9 46Z', c.greenShade),
    k.limb('M18.6 32.4L27.6 41.4L45.6 22.6', c.white, 8.4),
  ].join('');
}

/** Careful: a yellow warning triangle with an exclamation mark. */
export function warning(k) {
  const c = k.P;
  return [
    k.poly(
      [
        [32, 7],
        [58.4, 53.6],
        [5.6, 53.6],
      ],
      [4.6, 4.6, 4.6],
      c.yellow,
    ),
    k.flat('M8.4 47.6H55.6L57.4 50.6C57.6 51.8 56.8 52.6 55.6 52.6H8.4C7.2 52.6 6.4 51.8 6.6 50.6Z', c.yellowShade),
    k.rect(29.2, 21, 5.6, 17.4, 2.8, c.charcoal),
    k.circle(32, 44.8, 3, c.charcoal),
  ].join('');
}

/** Again: two arrows chasing each other round a loop. */
export function again(k) {
  const c = k.P;
  return [
    k.poly(
      [
        [41.4, 10.4],
        [53.6, 20.6],
        [41.4, 30.8],
      ],
      [1.4, 2.2, 1.4],
      c.blue,
    ),
    k.limb('M13.4 36V27.4Q13.4 20.6 20.4 20.6H43', c.blue, 8.6),
    k.poly(
      [
        [22.6, 33.2],
        [10.4, 43.4],
        [22.6, 53.6],
      ],
      [1.4, 2.2, 1.4],
      c.blue,
    ),
    k.limb('M50.6 28V36.6Q50.6 43.4 43.6 43.4H21', c.blue, 8.6),
  ].join('');
}

/** Mix: two arrows crossing over. */
export function mix(k) {
  const c = k.P;
  const head = (y) =>
    k.poly(
      [
        [43.6, y - 9.6],
        [55.4, y],
        [43.6, y + 9.6],
      ],
      [1.4, 2.2, 1.4],
      c.blue,
    );
  return [
    head(20),
    k.limb('M8.6 44H17.4C27.4 44 28.4 20 38.4 20H45', c.blue, 8.2),
    head(44),
    k.limb('M8.6 20H17.4C27.4 20 28.4 44 38.4 44H45', c.blue, 8.2),
  ].join('');
}

/** Search: a magnifying glass. */
export function search(k) {
  const c = k.P;
  return [
    k.limb('M38.6 38.6L53 53', c.wood, 8.6),
    k.circle(27, 27, 17.6, c.charcoal),
    k.circle(27, 27, 13, c.sky),
    k.flat(crescentPath(27, 27, 13, -10, 110, 0.18), c.skyShade),
    k.shine(`M${pt(polar(27, 27, 8.6, 200))}A8.6 8.6 0 0 1 ${pt(polar(27, 27, 8.6, 250))}`, 2.4),
  ].join('');
}

/** Into it: an arrow going down into an open box. */
export function intoBox(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 21, 2),
    // the box's far flap and inside, the arrow going in, then the front
    k.poly(
      [
        [13, 33],
        [51, 33],
        [55.4, 27],
        [8.6, 27],
      ],
      1,
      c.woodShade,
    ),
    k.g('translate(10.6 -6) scale(0.67)', arrowDown(k)),
    k.poly(
      [
        [13, 33],
        [51, 33],
        [51, 56],
        [13, 56],
      ],
      1.4,
      c.wood,
    ),
    k.flat('M40.6 34H50V55H40.6Z', c.woodShade),
    k.poly(
      [
        [13, 33],
        [5, 41.4],
        [8.6, 44],
        [13, 39.6],
      ],
      1,
      c.wood,
    ),
    k.poly(
      [
        [51, 33],
        [59, 41.4],
        [55.4, 44],
        [51, 39.6],
      ],
      1,
      c.wood,
    ),
    k.rect(28.4, 36, 7.2, 4, 0.8, c.tan),
  ].join('');
}

/** New!: a red sticker with NEW on it. */
export function fresh(k) {
  const c = k.P;
  const n = 12;
  const pts = [];
  for (let i = 0; i < n * 2; i++) pts.push(polar(32, 32, i % 2 ? 22.4 : 27.4, -90 + (180 / n) * i));
  const letter = (d) => k.line(d, { color: c.white, sw: 3 });
  return [
    k.poly(pts, 1, c.red),
    k.flat(crescentPath(32, 32, 22, -10, 120, 0.16), c.redShade),
    letter('M13.6 39V25L22 39V25'),
    letter('M34.6 25.6H27.4V38.4H34.6M27.4 32H33'),
    letter('M38 25L40.6 39L44.4 29.4L48.2 39L50.8 25'),
  ].join('');
}

// --- Sound -----------------------------------------------------------------------

/** The speaker on its own (as the listen button draws it). */
export const speakerBody = (k) =>
  k.rect(10.6, 24.4, 10.4, 15.2, 2.4, k.P.silver) +
  k.path('M20.2 25.2L31.4 15.8C33 14.4 34.6 15.2 34.6 17.2V46.8C34.6 48.8 33 49.6 31.4 48.2L20.2 38.8Z', k.P.white);

/** No sound: the speaker with a red cross. */
export function soundOff(k) {
  const c = k.P;
  return speakerBody(k) + k.limb('M40.6 24.6L54.6 39.4M54.6 24.6L40.6 39.4', c.red, 5.8);
}

/** Quiet: the speaker with one small wave. */
export function soundLow(k) {
  const c = k.P;
  return speakerBody(k) + k.path(`M${pt(polar(35.4, 32, 6.6, -40))}A6.6 6.6 0 0 1 ${pt(polar(35.4, 32, 6.6, 40))}L${pt(polar(35.4, 32, 11, 40))}A11 11 0 0 0 ${pt(polar(35.4, 32, 11, -40))}Z`, c.amber);
}

// --- Grown-ups' pages --------------------------------------------------------------

/** Progress: a bar chart on a white card. */
export function barChart(k) {
  const c = k.P;
  return [
    k.rect(7.6, 8.6, 48.8, 46.8, 4, c.white),
    k.line('M13.6 49.4H50.4', { color: c.grey, sw: 1.6 }),
    ...[
      [15.6, 33, 'coral'],
      [27.8, 22.6, 'amber'],
      [40, 14.6, 'green'],
    ].map(([x, y, col]) => k.rect(x, y, 8.6, 49.4 - y, 1, c[col]) + k.flat(`M${fmt(x + 5.6)} ${fmt(y + 1)}H${fmt(x + 7.6)}V48.4H${fmt(x + 5.6)}Z`, c[`${col}Shade`])),
  ].join('');
}

/** Stats: a line going up across a grid. */
export function lineChart(k) {
  const c = k.P;
  return [
    k.rect(7.6, 8.6, 48.8, 46.8, 4, c.white),
    k.line('M13.6 20.6H50.4M13.6 31H50.4M13.6 41.4H50.4M23.4 14V49.4M33.2 14V49.4M43 14V49.4', { color: c.silverShade, sw: 1.2 }),
    k.line('M13.6 49.4H50.4M13.6 14V49.4', { color: c.grey, sw: 1.6 }),
    k.limb('M14.6 44L25 33.4L33 38.6L46.4 19.4', c.green, 5),
    k.poly(
      [
        [42, 15.4],
        [50.6, 13.4],
        [49.6, 22.4],
      ],
      1,
      c.green,
    ),
  ].join('');
}

/** Players: two of them, one behind the other. */
export function people(k) {
  const c = k.P;
  const bust = (x, y, s, color, shade) =>
    k.path(`M${fmt(x - 13 * s)} ${fmt(y + 20 * s)}C${fmt(x - 13 * s)} ${fmt(y + 9 * s)} ${fmt(x - 7 * s)} ${fmt(y + 5 * s)} ${fmt(x)} ${fmt(y + 5 * s)}C${fmt(x + 7 * s)} ${fmt(y + 5 * s)} ${fmt(x + 13 * s)} ${fmt(y + 9 * s)} ${fmt(x + 13 * s)} ${fmt(y + 20 * s)}Z`, c[color]) +
    k.circle(x, y - 4 * s, 8 * s, c[color]) +
    k.flat(`M${fmt(x + 6 * s)} ${fmt(y + 6.4 * s)}C${fmt(x + 10 * s)} ${fmt(y + 8.6 * s)} ${fmt(x + 12 * s)} ${fmt(y + 13 * s)} ${fmt(x + 12 * s)} ${fmt(y + 19 * s)}H${fmt(x + 8 * s)}Z`, c[shade]);
  return [bust(42, 25, 0.86, 'grey', 'greyShade'), bust(26, 33, 1, 'blue', 'blueShade')].join('');
}

/** The Finnish check: Finland's flag on its pole. */
export function finland(k) {
  const c = k.P;
  return [
    k.ground(14, 58.6, 8, 1.8),
    k.limb('M12 9V58', c.silverShade, 3.8),
    k.circle(12, 7.6, 2.4, c.yellow),
    k.rect(14, 10, 42, 27, 0.6, c.white),
    k.flat('M25.7 10H32.7V37H25.7ZM14 19.8H56V27.2H14Z', c.brand),
  ].join('');
}

/** False: the thumbs-up hand turned over, giving a little shake. */
export function thumbsDown(k) {
  const f = k.frames > 1 ? k.frame % 2 : 0;
  return k.ground(33, 60.4, 12, 1.6) + k.g(`rotate(${180 + (f ? 6 : 0)} 32 34)`, thumbHand(k));
}

/** Pick your colors: a paintbrush, its tip dipped in pink. */
export function brush(k) {
  const c = k.P;
  return [
    k.ground(30, 58.6, 17, 2),
    k.g(
      'rotate(-38 32 32)',
      k.poly(
        [
          [30, 27.4],
          [58.4, 28.6],
          [58.4, 35.4],
          [30, 36.6],
        ],
        [0.6, 3, 3, 0.6],
        c.wood,
      ),
      k.flat('M31 34.2L57.6 33.2V35L31 36Z', c.woodShade),
      k.rect(21, 25, 10, 14, 1.2, c.silver),
      k.flat('M21.6 35H30.4V38.4H21.6Z', c.silverShade),
      k.path('M21.6 25C13 25 7 28.6 2.4 32C7 35.4 13 39 21.6 39Z', c.pink),
      k.flat('M21 34.6C14 34.8 9 35 4.6 33.6C9 36.6 14 38.4 21 38.4Z', c.pinkShade),
      k.shine('M34 30.2H53', 1.8),
    ),
  ].join('');
}

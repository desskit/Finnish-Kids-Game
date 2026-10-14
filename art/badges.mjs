// Rewards and badges: a glowing star, a medal and a gold medal, 100, a rocket,
// sparkles, a treasure map, a crown, a target, the notebook, a light bulb, a
// keyboard, an abacus, a ruler and abc. The bright ones glint or glow.

import { crescentPath, fmt, polar, pt, roundPoly, starPoints } from './kit.mjs';

/** A four-pointed sparkle (nothing when r is 0). */
const sparkle = (k, x, y, r, color = 'yellow') => (r ? k.flat(roundPoly(starPoints(x, y, r, r * 0.34, 4), 0.3), k.P[color]) : '');

/** A five-pointed star with its shade and shine, centred on (x, y). */
function star(k, x, y, R, color = 'yellow') {
  const c = k.P;
  const pts = starPoints(x, y, R, R * 0.46, 5, -90);
  const radii = pts.map((_, i) => (i % 2 ? R * 0.09 : R * 0.14));
  const at = (dx, dy) => pt([x + dx * R, y + dy * R]);
  return [
    k.poly(pts, radii, c[color]),
    k.flat(`M${at(0, 0.5)}L${at(0.55, 0.82)}L${at(0.44, 0.23)}L${at(0.9, -0.26)}L${at(0.41, -0.2)}Z`, c[`${color}Shade`]),
    k.poly(pts, radii, 'none'),
    k.shineDot(x - R * 0.02, y - R * 0.62, 1.2),
  ].join('');
}

/** A shining star: a star in a glow, its rays pulsing. */
export function glowingStar(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 2 : 0;
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const a = -90 + 22.5 + i * 45;
    rays.push(`M${pt(polar(32, 33, f ? 23.6 : 25, a))}L${pt(polar(32, 33, f ? 30.4 : 28.6, a))}`);
  }
  return [
    k.circle(32, 33, 22.4, c.starlight, { stroke: false }),
    k.line(rays.join(''), { color: c.amber, sw: 2.8 }),
    star(k, 32, 34.4, 19),
    sparkle(k, 52, 12, f ? 4.4 : 2.6, 'amber'),
    sparkle(k, 12.6, 52, f ? 2.6 : 4, 'amber'),
  ].join('');
}

/** The gold disc of a medal on its ribbon; `inner` goes on the disc. */
function medalOn(k, inner, glint) {
  const c = k.P;
  return [
    k.poly(
      [
        [16.6, 4],
        [27.4, 4],
        [36.4, 30],
        [27.6, 33],
      ],
      [1, 1, 1, 1],
      c.blue,
    ),
    k.poly(
      [
        [47.4, 4],
        [36.6, 4],
        [27.6, 30],
        [36.4, 33],
      ],
      [1, 1, 1, 1],
      c.red,
    ),
    k.flat('M40 5H46.2L42.6 15.6H36.6Z', c.redShade),
    k.circle(32, 42, 16, c.yellow),
    k.flat(crescentPath(32, 42, 16, -10, 120, 0.2), c.yellowShade),
    k.circle(32, 42, 10.6, 'none', { sw: 1.4 }),
    inner,
    k.shine(`M${pt(polar(32, 42, 13.2, 200))}A13.2 13.2 0 0 1 ${pt(polar(32, 42, 13.2, 240))}`, 2),
    glint ? sparkle(k, 47.4, 30.6, 4, 'white') : '',
  ].join('');
}

/** Achievements: a medal with a star on it, glinting. */
export function medal(k) {
  const c = k.P;
  return medalOn(k, k.flat(roundPoly(starPoints(32, 42.6, 7.4, 3.4, 5, -90), 0.6), c.amber), k.frames > 1 && k.frame % 2);
}

/** First: a gold medal with a 1 on it. */
export function goldMedal(k) {
  const c = k.P;
  return medalOn(k, k.line('M28.8 37.4L32.6 34.4V49.6', { color: c.amberShade, sw: 3.2 }), k.frames > 1 && k.frame % 2);
}

/** A hundred: a red 100 with two lines under it. */
export function hundred(k) {
  const c = k.P;
  const zero = (x) => `M${fmt(x)} 15.6C${fmt(x - 6.4)} 15.6 ${fmt(x - 7.4)} 23 ${fmt(x - 7.4)} 27.6C${fmt(x - 7.4)} 32.2 ${fmt(x - 6.4)} 39.6 ${fmt(x)} 39.6C${fmt(x + 6.4)} 39.6 ${fmt(x + 7.4)} 32.2 ${fmt(x + 7.4)} 27.6C${fmt(x + 7.4)} 23 ${fmt(x + 6.4)} 15.6 ${fmt(x)} 15.6Z`;
  return k.g('skewX(-8) translate(4 0)', k.limb(`M9.6 20L14.6 15.6V39.6${zero(30)}${zero(48.6)}`, c.red, 5.8), k.limb('M7.6 47.4H55.6M11.6 54.6H51.6', c.red, 5));
}

/** Level up: a rocket blasting off, its flame flickering. */
export function rocket(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 2 : 0;
  return k.g(
    'rotate(40 32 32)',
    k.path(f ? 'M26.4 45Q32 66 37.6 45Z' : 'M27.2 45Q32 60 36.8 45Z', c.orange),
    k.path(f ? 'M29 45Q32 58 35 45Z' : 'M29.4 45Q32 54 34.6 45Z', c.yellow),
    k.path('M24.6 30.6L15.4 44.6L18.6 46.6L25.4 42Z', c.red),
    k.path('M39.4 30.6L48.6 44.6L45.4 46.6L38.6 42Z', c.red),
    k.path('M32 4.6C40 10.6 41.8 21.6 41 33L39.6 45.4H24.4L23 33C22.2 21.6 24 10.6 32 4.6Z', c.white),
    k.flat('M32 5.6C35.8 8.6 38.2 12.6 39.4 16.4H24.6C25.8 12.6 28.2 8.6 32 5.6Z', c.red),
    k.flat('M37 17.4H40C41 23.4 41.2 29.4 40.6 35L39.4 44.4H36.4C37.6 35.4 38 26.4 37 17.4Z', c.silverShade),
    k.line('M24.4 16.6H39.6', { sw: 1.4 }),
    k.circle(32, 26.4, 5.2, c.sky),
    k.shineDot(30.6, 25, 1.4),
    k.rect(26.2, 44.6, 11.6, 3.6, 1, c.charcoal),
  );
}

/** Flawless: three sparkles, twinkling in turn. */
export function sparkles(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 3 : 0;
  const big = (x, y, r) => k.path(roundPoly(starPoints(x, y, r, r * 0.36, 4), r * 0.08), c.yellow);
  return [
    big(25, 36, [19, 17, 18][f]),
    k.flat(roundPoly(starPoints(25, 36, 7, 2.4, 4), 0.4), c.starlight),
    big(48, 14.6, [7.6, 9.6, 8][f]),
    big(49, 48, [6, 6.6, 7.8][f]),
  ].join('');
}

/** Halfway: a treasure map, its path dotted to the X. */
export function map(k) {
  const c = k.P;
  const panels = [
    [
      [7, 13.4],
      [23, 9],
      [23, 51],
      [7, 55.4],
    ],
    [
      [23, 9],
      [41, 13.4],
      [41, 55.4],
      [23, 51],
    ],
    [
      [41, 13.4],
      [57, 9],
      [57, 51],
      [41, 55.4],
    ],
  ];
  const dots = [
    [12.6, 46.4],
    [18, 40.6],
    [24.6, 38],
    [31, 35],
    [36.6, 30],
    [42.6, 26.4],
  ].map(([x, y]) => k.flatCircle(x, y, 1.7, c.red));
  return [
    k.ground(32, 58.6, 24, 2),
    ...panels.map((p, i) => k.poly(p, 0.6, i === 1 ? c.creamShade : c.cream)),
    k.flat('M9 17.6C14 15 19 17 21.6 21C22 26 18 29 13 28C9 27.4 8 22 9 17.6Z', c.grass),
    k.flat('M42.6 31C47 29.4 52 31.4 55.4 34.6V47.4C51 49.4 45 48 42.6 44Z', c.grass),
    k.flat('M24 30.6C29 28.4 34 32 39.6 30.6V39C34 41 29 37.4 24 39.6Z', c.water),
    ...dots,
    k.line('M44.6 20.4L50.6 26.4M50.6 20.4L44.6 26.4', { color: c.red, sw: 2.4 }),
  ].join('');
}

/** A crown, its gems glinting. */
export function crown(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 2 : 0;
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
      c.yellow,
    ),
    k.flat('M12.6 43.6H51.4L50.6 50.4H13.4Z', c.yellowShade),
    k.line('M12.4 42.6H51.6'),
    k.circle(9.6, 19.4, 3.4, c.yellow),
    k.circle(32, 12.6, 3.8, c.yellow),
    k.circle(54.4, 19.4, 3.4, c.yellow),
    k.circle(32, 35.4, 4, c.red),
    k.poly(
      [
        [20.6, 31.6],
        [24, 35.4],
        [20.6, 39.2],
        [17.2, 35.4],
      ],
      0.6,
      c.blue,
    ),
    k.poly(
      [
        [43.4, 31.6],
        [46.8, 35.4],
        [43.4, 39.2],
        [40, 35.4],
      ],
      0.6,
      c.blue,
    ),
    k.shineDot(30.8, 34, 1.1),
    sparkle(k, f ? 50 : 14, f ? 8 : 9, 3.6, 'amber'),
  ].join('');
}

/** Sharp: a dart in the middle of a target, still wobbling. */
export function target(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 2 : 0;
  return [
    k.circle(29, 35, 24, c.red),
    k.circle(29, 35, 17.6, c.white),
    k.circle(29, 35, 11.4, c.red),
    k.circle(29, 35, 5.4, c.white),
    k.flatCircle(29, 35, 2.4, c.red),
    k.g(
      `rotate(${f ? 4 : -2} 29 35)`,
      k.limb('M29 35L50.6 13.4', c.charcoal, 3.8),
      k.poly(
        [
          [47.4, 16.6],
          [47.4, 6],
          [53, 11],
          [58, 16.6],
          [52, 16.6],
        ],
        0.8,
        c.blue,
      ),
    ),
  ].join('');
}

/** The notebook: a teal cover with a label, a red ribbon marking the page. */
export function notebook(k) {
  const c = k.P;
  return [
    k.ground(33, 58.6, 18, 2),
    k.rect(17, 8.6, 34, 46.4, 2, c.cream),
    k.line('M48.6 12V52.4M46.6 11V53.4', { color: c.creamShade, sw: 1 }),
    k.path('M30.6 52V60L33.4 57.6L36.2 60V52Z', c.red),
    k.rect(13, 7, 33.6, 47.6, 2.6, c.teal),
    k.flat('M14 8H18.6V53.6H16C14.8 53.6 14 52.8 14 51.6Z', c.tealShade),
    k.rect(23, 17, 18, 11.6, 1.6, c.white),
    k.line('M26 21.4H38M26 24.4H34', { color: c.grey, sw: 1.2 }),
  ].join('');
}

/** A good idea: a light bulb, glowing. */
export function lightBulb(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 2 : 0;
  const rays = [-150, -110, -70, -30, 210].map((a) => `M${pt(polar(32, 25, f ? 21.6 : 22.6, a))}L${pt(polar(32, 25, f ? 28 : 26.4, a))}`);
  return [
    f ? k.circle(32, 25, 19, c.starlight, { stroke: false }) : '',
    k.line(rays.join(''), { color: c.amber, sw: 2.6 }),
    k.path('M32 7.4C41.6 7.4 47.4 14.6 47.4 23.4C47.4 30 43.6 33.6 41 37.4C39.6 39.4 39.2 41.4 39.2 43.4H24.8C24.8 41.4 24.4 39.4 23 37.4C20.4 33.6 16.6 30 16.6 23.4C16.6 14.6 22.4 7.4 32 7.4Z', c.yellow),
    k.flat('M42.6 13.4C45.6 16.6 46.4 20.6 46.4 23.4C46.4 29.6 42.8 33 40.2 36.8C39 38.6 38.4 40.4 38.2 42.4H34.6C35.4 37.6 39 34.2 41 30.4C43.4 25.8 44 19 42.6 13.4Z', c.yellowShade),
    k.line('M28 42.4V33L30 29.6L32 33L34 29.6L36 33V42.4', { color: c.amberShade, sw: 1.4 }),
    k.shine('M22.6 21.4Q23.4 15.4 28.4 12.6', 2.4),
    k.rect(24.4, 43, 15.2, 4.8, 1.4, c.grey),
    k.rect(25.4, 47.4, 13.2, 4.4, 1.4, c.grey),
    k.rect(28.4, 51.4, 7.2, 4, 1.6, c.charcoal),
  ].join('');
}

/** Typing: a keyboard. */
export function keyboard(k) {
  const c = k.P;
  const keys = [];
  const rows = [
    [12.6, 21.8, 7],
    [14.6, 29.4, 6],
    [12.6, 37, 7],
  ];
  for (const [x0, y, n] of rows) for (let i = 0; i < n; i++) keys.push(k.rect(x0 + i * 5.8, y, 4.6, 4.8, 0.8, c.white));
  return [
    k.ground(32, 58.6, 26, 2),
    k.rect(6, 16.4, 52, 36, 4, c.silverShade),
    k.flat('M7 47H57V48.4C57 50.2 55.6 51.4 53.8 51.4H10.2C8.4 51.4 7 50.2 7 48.4Z', c.grey),
    ...keys,
    k.rect(20.4, 44.4, 23.2, 4.6, 0.8, c.white),
  ].join('');
}

/** Counting: an abacus. */
export function abacus(k) {
  const c = k.P;
  const beads = [
    [0, 'red', [16, 21.6, 27.2, 44.6]],
    [1, 'yellow', [16, 21.6, 39, 44.6, 50.2]],
    [2, 'blue', [16, 33.4, 39, 44.6]],
    [3, 'green', [16, 21.6, 27.2, 33.4, 50.2]],
  ];
  return [
    k.ground(32, 58.6, 24, 2),
    k.limb('M10.6 56V14M53.4 56V14', c.wood, 4.6),
    ...beads.map(([i]) => k.line(`M12 ${fmt(19.4 + i * 9)}H52`, { color: c.grey, sw: 1.6 })),
    ...beads.flatMap(([i, col, xs]) => xs.map((x) => k.ellipse(x, 19.4 + i * 9, 2.8, 3.4, c[col]))),
    k.rect(6.6, 9.6, 50.8, 5.6, 2, c.wood),
    k.rect(6.6, 52.4, 50.8, 5.6, 2, c.wood),
    k.flat('M7.6 55.6H56.4V57H7.6Z', c.woodShade),
  ].join('');
}

/** Long or short: a ruler. */
export function ruler(k) {
  const c = k.P;
  const ticks = [];
  for (let i = 0; i <= 10; i++) ticks.push(`M${fmt(11.6 + i * 4)} 26V${fmt(i % 5 === 0 ? 33 : i % 2 === 0 ? 31 : 29.4)}`);
  return k.g(
    'rotate(-28 32 32)',
    k.ground(32, 44.6, 26, 1.6),
    k.rect(6, 25, 52, 15, 1.6, c.yellow),
    k.flat('M7 35.6H57V39H7Z', c.yellowShade),
    k.line(ticks.join(''), { color: c.charcoal, sw: 1.2 }),
  );
}

/** The alphabet: abc on a blue tile. */
export function abc(k) {
  const c = k.P;
  const letter = (d) => k.line(d, { color: c.white, sw: 3 });
  return [
    k.rect(6, 10, 52, 44, 8, c.blue),
    k.flat('M7 45H57V46C57 50 54 53 50 53H14C10 53 7 50 7 46Z', c.blueShade),
    letter('M20.2 26V40M20.2 30C19.2 27.4 17.4 26.2 15.4 26.2C12.4 26.2 10.6 29 10.6 33C10.6 37 12.4 39.8 15.4 39.8C17.4 39.8 19.2 38.6 20.2 36'),
    letter('M25.6 19V40M25.6 30C26.6 27.4 28.4 26.2 30.4 26.2C33.4 26.2 35.2 29 35.2 33C35.2 37 33.4 39.8 30.4 39.8C28.4 39.8 26.6 38.6 25.6 36'),
    letter('M50.4 28.4C49.4 27 47.8 26.2 46 26.2C42.8 26.2 40.6 29 40.6 33C40.6 37 42.8 39.8 46 39.8C47.8 39.8 49.4 39 50.4 37.6'),
  ].join('');
}

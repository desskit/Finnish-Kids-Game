// School words: the teacher and the children from the cast, and the things
// in a Finnish classroom. Some move: the clock ticks, the pencil writes the
// homework, an abacus bead slides, Leo does jumping jacks, the flag waves,
// the test gets its ticks.

import { fmt, polar, pt } from './kit.mjs';
import { CAST, person, POSES } from './people.mjs';

/** A person shrunk and placed: `x` is where their middle goes, `ground` where their feet go. */
const placed = (k, look, pose, x, ground, s) => k.g(`translate(${fmt(x - 32 * s)} ${fmt(ground - 60 * s)}) scale(${s})`, person(k, look, pose));

/** A book held at someone's hand. */
const heldBook = (k, x, y, color = 'red') => k.rect(x - 3.6, y - 5, 7.2, 9.4, 1.2, k.P[color]) + k.flat(`M${fmt(x + 1.6)} ${fmt(y - 4)}H${fmt(x + 2.8)}V${fmt(y + 3.4)}H${fmt(x + 1.6)}Z`, k.P.cream);

export function teacher(k) {
  return person(k, CAST.opettaja) + heldBook(k, 44.4, 44.6, 'red');
}

/** Two friends, Eero and Aino, holding hands; a heart floats between them. */
export function friend(k) {
  const c = k.P;
  const s = 0.78;
  const left = { ...POSES.stand, armFront: [[38.4, 34.8], [47.4, 41.6]], face: 'grin' };
  const right = { ...POSES.stand, armBack: [[25.6, 34.8], [16.6, 41.6]], face: 'grin' };
  const y = k.frame % 2 ? -k.px : 0;
  const heart = 'M32 21.6C28.6 19.2 26.6 17.4 26.6 15.2C26.6 13.6 27.8 12.6 29.2 12.6C30.4 12.6 31.4 13.4 32 14.4C32.6 13.4 33.6 12.6 34.8 12.6C36.2 12.6 37.4 13.6 37.4 15.2C37.4 17.4 35.4 19.2 32 21.6Z';
  return [placed(k, CAST.eero, left, 20.6, 60, s), placed(k, CAST.aino, right, 43.4, 60, s), k.g(`translate(0 ${fmt(y)})`, k.path(heart, c.pink))].join('');
}

/** A yellow pencil, sharpened. */
export function pencil(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 18, 2),
    k.g(
      'rotate(-36 32 32)',
      k.rect(7, 27, 7, 10, 1.6, c.pink),
      k.rect(13, 27, 4.4, 10, 0.6, c.silver),
      k.rect(17, 27, 27, 10, 0.6, c.yellow),
      k.flat('M17.6 33.6H43.4V36.4H17.6Z', c.yellowShade),
      k.path('M44 27L54 32L44 37Z', c.tan),
      k.flat('M50.4 30.2L54 32L50.4 33.8Z', c.charcoal),
      k.shine('M19 29.6H40', 1.6),
    ),
  ].join('');
}

/** A red school backpack, a reflector on its pocket. */
export function backpack(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 20, 2),
    k.limb('M25.4 12C25.4 5.6 38.6 5.6 38.6 12', c.redShade, 4.2),
    k.rect(13, 11, 38, 45, 9, c.red),
    k.flat('M42 13C46 15 49.6 19 49.6 25V47C49.6 51 47.4 54 44 55H40C43.4 50 44.6 44 44.6 37V21C44.6 18 43.6 15 42 13Z', c.redShade),
    k.rect(18.6, 33, 26.8, 18, 4, c.red),
    k.path('M18.6 37C18.6 34.6 20.4 33 22.6 33H41.4C43.6 33 45.4 34.6 45.4 37V39.6H18.6Z', c.redShade),
    k.rect(29.4, 37.6, 5.2, 4.4, 1, c.yellow),
    k.rect(23, 44, 8, 4.4, 1.6, c.silver),
    k.shine('M17.4 18.6V27', 2),
  ].join('');
}

/** A sheet of paper, its corner folded. */
export function paper(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 18, 2),
    k.g(
      'rotate(-6 32 32)',
      k.path('M14 8H40L50 18V56H14Z', c.white),
      k.flat('M44.6 19.4H49V55H44.6Z', c.silver),
      k.path('M40 8V18H50Z', c.silver),
      k.line('M19 25H44M19 31H44M19 37H44M19 43H40M19 49H34', { color: c.silverShade, sw: 1.4 }),
    ),
  ].join('');
}

/** A framed picture of a sunny hill, hanging on a nail. */
export function picture(k) {
  const c = k.P;
  return [
    k.line('M32 6L15 18M32 6L49 18', { color: c.charcoal, sw: 1.4 }),
    k.flatCircle(32, 6, 1.6, c.charcoal),
    k.rect(9, 16, 46, 38, 2, c.wood),
    k.rect(13.6, 20.6, 36.8, 28.8, 0.6, c.sky),
    k.flatCircle(42, 27, 3.6, c.yellow),
    k.flat('M14 41C21 34.6 29.6 34.6 35.4 38.4C40 35.4 46 35.2 50 37.4V49H14Z', c.green),
    k.flat('M14 46C24 42 38 42 50 45V49H14Z', c.greenShade),
    k.flat('M51 21H54V53H51Z', c.woodShade),
  ].join('');
}

/** An alarm clock, its long hand ticking round. */
export function clock(k) {
  const c = k.P;
  const hand = polar(32, 34, 10, -90 + (k.frame % 4) * 90);
  return [
    k.ground(32, 58.6, 16, 2),
    k.limb('M22 50L18.6 55.6M42 50L45.4 55.6', c.charcoal, 3.8),
    k.circle(18.6, 15.6, 6.4, c.red),
    k.circle(45.4, 15.6, 6.4, c.red),
    k.limb('M32 9.6V14', c.charcoal, 3.8),
    k.circle(32, 34, 18, c.red),
    k.flat('M43.6 21.6C48.6 26.6 50.4 34.6 47.6 41.6C45.4 46.6 41 50.4 35.6 51.6C41.6 47 44.6 40 44 33C43.6 28.6 42.4 24.6 43.6 21.6Z', c.redShade),
    k.circle(32, 34, 13.6, c.white),
    ...[[32, 23.4], [42.6, 34], [32, 44.6], [21.4, 34]].map(([x, y]) => k.flatCircle(x, y, 1, c.charcoal)),
    k.line(`M32 34L${pt(hand)}`, { sw: 1.6 }),
    k.line('M32 34L36.6 37.4', { sw: 2 }),
    k.flatCircle(32, 34, 1.4, c.ink),
  ].join('');
}

/** Homework: an open notebook, the pencil writing a line across it. */
export function homework(k) {
  const c = k.P;
  const f = k.frame % 3;
  const reach = [38, 44, 50][f];
  // a wavy line of writing, as plain curves (the rasterizer reads M, L, H, V, C, Q, A, Z)
  const wavy = (x0, y, n) => `M${fmt(x0)} ${fmt(y)}${Array.from({ length: n }, (_, i) => `Q${fmt(x0 + i * 3.2 + 1.6)} ${fmt(i % 2 ? y + 3 : y - 3)} ${fmt(x0 + (i + 1) * 3.2)} ${fmt(y)}`).join('')}`;
  const written = wavy(36, 30, 5);
  return [
    k.ground(32, 58.6, 25, 2),
    k.path('M7 20L31 23.6V53L7 49.4Z', c.white),
    k.path('M33 23.6L57 20V49.4L33 53Z', c.white),
    k.flat('M29 23.4L31 23.6V53L29 52.6Z', c.silver),
    k.line('M11 30.6L28 32.6M11 36.6L28 38.6M11 42.6L28 44.6M36 35.4L53 33.4M36 41.4L53 39.4M36 47.4L53 45.4', { color: c.silverShade, sw: 1.2 }),
    k.line(wavy(11, 24.6, 4), { color: c.blue, sw: 1.4 }),
    k.g(`translate(${fmt(reach - 52)} 0)`, k.line(written, { color: c.blue, sw: 1.4 })),
    k.flat(`M${fmt(reach)} 22H57V34H${fmt(reach)}Z`, c.white),
    k.g(`rotate(-50 ${fmt(reach)} 30)`, k.rect(reach, 27.6, 18, 4.8, 0.6, c.yellow) + k.path(`M${fmt(reach)} 27.6L${fmt(reach - 4)} 30L${fmt(reach)} 32.4Z`, c.tan)),
  ].join('');
}

/** Maths: an abacus, a bead sliding across. */
export function math(k) {
  const c = k.P;
  const moved = k.frame % 2 === 1;
  const rows = [
    [19.6, 'red'],
    [27.6, 'yellow'],
    [35.6, 'green'],
    [43.6, 'blue'],
  ];
  const beads = rows
    .map(([y, color], r) => {
      const left = r === 0 ? (moved ? 3 : 2) : [2, 4, 1, 3][r];
      const xs = [];
      for (let i = 0; i < left; i++) xs.push(16.6 + i * 5);
      for (let i = 0; i < 5 - left; i++) xs.push(47.4 - i * 5);
      return xs.map((x) => k.ellipse(x, y, 2.6, 3.2, c[color])).join('');
    })
    .join('');
  return [
    k.ground(32, 58.6, 24, 2),
    k.limb('M12 52V57M52 52V57', c.woodShade, 3.8),
    k.rect(8, 11, 48, 42, 2.6, c.wood),
    k.rect(12, 15, 40, 34, 0.6, c.cream),
    k.line('M12 19.6H52M12 27.6H52M12 35.6H52M12 43.6H52', { color: c.woodShade, sw: 1.4 }),
    beads,
  ].join('');
}

/** Gym: Leo doing jumping jacks. */
export function gym(k) {
  // arms up first: that's the still picture, too
  const open = k.frame % 2 === 0;
  const pose = open
    ? {
        ...POSES.stand,
        face: 'grin',
        bob: -k.px,
        armBack: [[25.6, 34.8], [17.6, 25]],
        armFront: [[38.4, 34.8], [46.4, 25]],
        legBack: [[28.6, 46], [22.6, 55]],
        legFront: [[35.4, 46], [41.4, 55]],
      }
    : { ...POSES.stand, face: 'grin', armBack: [[25.6, 34.8], [19.6, 43.6]], armFront: [[38.4, 34.8], [44.4, 43.6]] };
  return person(k, CAST.leo, pose);
}

/** English: a British flag on its pole, waving. */
export function english(k) {
  const c = k.P;
  const wave = k.frame % 2 ? 'matrix(1 0.05 0 1 0 -0.8)' : 'matrix(1 0 0 1 0 0)';
  return [
    k.ground(14, 58.6, 8, 1.8),
    k.limb('M12 9V58', c.silverShade, 3.8),
    k.circle(12, 7.6, 2.4, c.yellow),
    k.g(
      wave,
      k.rect(14, 10, 42, 27, 0.6, c.navy),
      k.flat('M14 10H19L56 33V37H51L14 14Z', c.white),
      k.flat('M56 10H51L14 33V37H19L56 14Z', c.white),
      k.flat('M14 10H16.4L56 34.8V37H53.6L14 12.2Z', c.red),
      k.flat('M56 10H53.6L14 34.8V37H16.4L56 12.2Z', c.red),
      k.flat('M14 19.4H56V27.6H14Z', c.white),
      k.flat('M30.8 10H39.2V37H30.8Z', c.white),
      k.flat('M14 21.4H56V25.6H14Z', c.red),
      k.flat('M32.8 10H37.2V37H32.8Z', c.red),
    ),
  ].join('');
}

/** A pupil: Eero with his backpack on and a book. */
export function pupil(k) {
  const c = k.P;
  return [
    k.rect(21, 25, 22, 10, 3.4, c.red),
    person(k, CAST.eero),
    k.limb('M27.2 32V43.6M36.8 32V43.6', c.red, 3.8),
    heldBook(k, 44.4, 44.6, 'green'),
  ].join('');
}

/** A test on a clipboard, the ticks going in one by one. */
export function test(k) {
  const c = k.P;
  // all three ticks first (the still picture), then cleared and ticked again one by one
  const f = [3, 0, 1, 2][k.frame % 4];
  const tick = (y) => k.line(`M20.6 ${fmt(y + 1)}L22.6 ${fmt(y + 3)}L26.4 ${fmt(y - 2)}`, { color: c.green, sw: 2 });
  return [
    k.ground(32, 58.6, 20, 2),
    k.rect(11, 10, 42, 48, 3, c.wood),
    k.rect(15, 16, 34, 38, 1, c.white),
    k.rect(23, 6.6, 18, 7, 2, c.silverShade),
    ...[23, 33, 43].map((y) => k.rect(19.6, y - 2.6, 5.4, 5.4, 0.6, c.white) + k.line(`M28.6 ${y}H44.6`, { color: c.silverShade, sw: 1.4 })),
    f >= 1 ? tick(23) : '',
    f >= 2 ? tick(33) : '',
    f >= 3 ? tick(43) : '',
  ].join('');
}

/** Customs: a passport with a stamp on it. */
export function customs(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 19, 2),
    k.rect(14, 7, 36, 49, 3, c.navy),
    k.flat('M46 8H48.6V55H46Z', c.blueShade),
    k.circle(32, 25, 7.4, c.yellow),
    k.flatCircle(32, 25, 4.4, c.navy),
    k.flatCircle(32, 25, 2, c.yellow),
    k.flat('M22 37H42V39H22ZM25 42H39V44H25Z', c.yellow),
    k.g('rotate(-14 44 47)', k.line('M35 42H53V53H35Z', { color: c.red, sw: 1.6 }), k.line('M38 46H50M38 49H47', { color: c.red, sw: 1.4 })),
  ].join('');
}

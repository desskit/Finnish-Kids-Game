// Adjectives. Feelings are the round face (tired, hungry, cute, kind, sad,
// angry, sick, calm, cold, hot, funny), each with its little loop; colors are
// crayons with a scribble of their color; sizes and speeds are something that
// has them (a dinosaur by a little tree, an ant by Leo's big shoe, a race car,
// a turtle, a giraffe next to Leo); proud, strong and good are Leo (a medal,
// a barbell, a thumbs up).

import { fmt, heartPath, pt, roundPoly, starPoints } from './kit.mjs';
import { cheeks, faceBase, tear } from './faces.mjs';
import { pine } from './nature.mjs';
import { CAST, hand, person, placed, POSES } from './people.mjs';

const leo = (k, pose) => person(k, CAST.leo, { ...POSES.stand, ...pose });

/** A four-pointed sparkle. */
const sparkle = (k, x, y, r, color = 'yellow') => k.flat(roundPoly(starPoints(x, y, r, r * 0.34, 4), 0.3), k.P[color]);

/** Half-shut eyes: open eyes with heavy lids over their top half (the lids the face's color). */
function heavyEyes(k, y = 28.4, color = 'yellow') {
  const c = k.P;
  return [
    k.eye(24.4, y, 3.2),
    k.eye(39.6, y, 3.2),
    k.flat(`M19.6 ${fmt(y - 5)}H29.2V${fmt(y - 0.2)}H19.6ZM34.8 ${fmt(y - 5)}H44.4V${fmt(y - 0.2)}H34.8Z`, c[color]),
    k.line(`M20.4 ${fmt(y - 0.2)}H28.4M35.6 ${fmt(y - 0.2)}H43.6`, { sw: 1.6 }),
  ].join('');
}

/** Worried brows (their inner ends up). */
const worried = (k) => k.line('M19.4 22.2L27.2 19.6M44.6 22.2L36.8 19.6', { sw: 1.6 });

// --- Feelings -------------------------------------------------------------------

/** Tired: a big yawn, the eyes half shut. */
export function tired(k) {
  const c = k.P;
  const wide = k.frame % 2 === 0;
  return [
    faceBase(k),
    heavyEyes(k),
    k.ellipse(32, 43.4, wide ? 5.2 : 3.6, wide ? 6.4 : 3.8, c.mouth),
    k.flatEllipse(32, wide ? 47 : 45.6, wide ? 3.2 : 2, wide ? 1.8 : 1, c.tongue),
    wide ? tear(k, 46.8, 31.6, 1.6) : '',
  ].join('');
}

/** Hungry: dreaming of food, drooling. */
export function hungry(k) {
  const c = k.P;
  const f = k.frame % 3;
  return [
    faceBase(k),
    k.line('M19.6 20.8Q24.4 18 29.2 20.8M34.8 20.8Q39.6 18 44.4 20.8', { sw: 1.4 }),
    k.eye(24.4, 26.6, 3.2),
    k.eye(39.6, 26.6, 3.2),
    cheeks(k),
    k.openSmile(32, 37.4, 15, 5),
    f < 2 ? k.line(`M38.6 38.6V${fmt([42, 45][f])}`, { color: c.skyShade, sw: 1.4 }) : '',
    tear(k, 38.6, [45.4, 48.8, 52.6][f], 1.9),
  ].join('');
}

/** Cute: all smiles, hearts floating round. */
export function cute(k) {
  const c = k.P;
  const hearts = k.frame % 2 ? [[10.4, 12.6, 8], [53.6, 9.6, 6.6], [55, 44.6, 6]] : [[9.6, 16, 7], [52.4, 13, 7.6], [53.4, 48, 5.2]];
  return [
    faceBase(k),
    k.happyEye(24.4, 28, 6.6),
    k.happyEye(39.6, 28, 6.6),
    cheeks(k),
    k.line('M25.6 38.6Q32 44.6 38.4 38.6', { sw: 1.8 }),
    ...hearts.map(([x, y, w]) => k.path(heartPath(x, y - w * 0.45, w, w * 0.9), c.red)),
  ].join('');
}

/** Kind: a gentle smile and a halo, bobbing. */
export function kind(k) {
  const c = k.P;
  const f = k.frame % 2;
  const y = f ? 4.6 : 5.8;
  return [
    faceBase(k),
    k.happyEye(24.4, 28.6, 6.4),
    k.happyEye(39.6, 28.6, 6.4),
    cheeks(k),
    k.line('M24.4 38.4Q32 45.6 39.6 38.4', { sw: 1.8 }),
    k.limb(`M19 ${fmt(y)}A13 3.4 0 1 0 45 ${fmt(y)}A13 3.4 0 1 0 19 ${fmt(y)}`, c.amber, 4),
    f ? '' : sparkle(k, 48.4, 2.6, 2.6),
  ].join('');
}

/** Sad: looking down, the frown wobbling. */
export function sad(k) {
  const f = k.frame % 2;
  return [
    faceBase(k),
    k.line(f ? 'M19.4 23.4L27.2 20.4M44.6 23.4L36.8 20.4' : 'M19.4 22.6L27.2 20.8M44.6 22.6L36.8 20.8', { sw: 1.6 }),
    k.eye(24.4, 29.4, 3.2),
    k.eye(39.6, 29.4, 3.2),
    k.line(f ? 'M25 44.6Q32 39.2 39 44.6' : 'M25.4 44Q32 40.2 38.6 44', { sw: 1.8 }),
  ].join('');
}

/** Angry: frowning brows, a cross mark throbbing. */
export function angry(k) {
  const c = k.P;
  const s = k.frame % 2 ? 1.6 : 1.25;
  return [
    faceBase(k),
    k.line('M18.6 21L28.4 25M45.4 21L35.6 25', { sw: 2 }),
    k.eye(24.4, 29.4, 3.2),
    k.eye(39.6, 29.4, 3.2),
    k.line('M24.4 44.6Q32 38.6 39.6 44.6', { sw: 1.8 }),
    k.g(`translate(50.4 11.6) scale(${s})`, k.line('M-4.4 -1.4Q-1.4 -1.4 -1.4 -4.4M1.4 -4.4Q1.4 -1.4 4.4 -1.4M4.4 1.4Q1.4 1.4 1.4 4.4M-1.4 4.4Q-1.4 1.4 -4.4 1.4', { color: c.red, sw: 1.6 })),
  ].join('');
}

/** Sick: a thermometer in, its red line climbing; a bead of sweat. */
export function sick(k) {
  const c = k.P;
  const f = k.frame % 2;
  return [
    faceBase(k),
    worried(k),
    heavyEyes(k, 28.6),
    k.ellipse(30, 42.4, 2.6, 2.2, c.mouth),
    k.g('rotate(28 30 42.4)', k.rect(30, 40.4, 22, 4, 2, c.white), k.flat(`M31 41.6H${fmt(f ? 47 : 40)}V43.2H31Z`, c.red), k.circle(31.6, 42.4, 2.4, c.red)),
    tear(k, 49, 24, 2.2),
  ].join('');
}

/** Calm: eyes shut, a little smile, a long breath out. */
export function calm(k) {
  const c = k.P;
  const f = k.frame % 2;
  return [
    faceBase(k),
    k.sleepyEye(24.4, 28.6, 7),
    k.sleepyEye(39.6, 28.6, 7),
    cheeks(k),
    k.line('M27 39.6Q32 43.6 37 39.6', { sw: 1.6 }),
    f ? k.path('M41.6 49A2.4 2.4 0 0 1 43.2 45A3 3 0 0 1 48.2 44.4A2.4 2.4 0 0 1 49.6 49Z', c.white) : '',
  ].join('');
}

/** Boring: flat eyes glancing about, a flat mouth, the chin propped on a fist. */
export function boring(k) {
  const c = k.P;
  const gaze = k.frame % 2 ? 1.8 : -1.8;
  return [
    faceBase(k),
    k.eye(24.4 + gaze, 29.2, 2.8),
    k.eye(39.6 + gaze, 29.2, 2.8),
    k.flat('M19.4 24H29.4V28.8H19.4ZM34.6 24H44.6V28.8H34.6Z', c.yellow),
    k.line('M19.8 28.8H29M35 28.8H44.2', { sw: 1.8 }),
    k.line('M26 43H38', { sw: 1.8 }),
    // the fist under the chin, its arm going down out of the picture
    k.limb('M45.4 57L49 66', c.yellow, 8.6),
    k.poly([[34.8, 49.4], [47.6, 47.6], [49.4, 57.4], [36.4, 59]], 4, c.yellow),
    k.line('M38.6 50.4Q38 54.4 39.4 58M43 49.6Q42.4 53.6 43.8 57.4', { sw: 1.4 }),
  ].join('');
}

/** Cold: blue with cold, teeth chattering, shivering; icicles hang off. */
export function cold(k) {
  const c = k.P;
  const dx = k.frame % 2 ? k.px : -k.px;
  return [
    k.g(
      `translate(${fmt(dx)} 0)`,
      faceBase(k, 'sky'),
      worried(k),
      k.eye(24.4, 28, 3.2),
      k.eye(39.6, 28, 3.2),
      k.rect(22.6, 38.4, 18.8, 7.6, 2.2, c.white),
      k.line('M23.2 42.2H40.8M27.6 38.8V45.6M32 38.8V45.6M36.4 38.8V45.6', { sw: 1.2 }),
      ...[[21.6, 53.2, 3], [32, 56, 3.6], [42.4, 53.2, 3]].map(([x, y, w]) => k.poly([[x - w / 2, y - 1], [x + w / 2, y - 1], [x, y + w * 1.8]], [0.4, 0.4, 0.6], c.white)),
    ),
    sparkle(k, 7, 10, 3, 'sky'),
    sparkle(k, 57, 6, 2.6, 'sky'),
  ].join('');
}

/** Hot: red-faced, tongue out, sweat dripping. */
export function hot(k) {
  const c = k.P;
  const f = k.frame % 3;
  return [
    faceBase(k, 'coral'),
    heavyEyes(k, 28.4, 'coral'),
    k.openSmile(32, 37.4, 16, 4.6),
    k.ellipse(32, 45.4, 4.8, 4.4, c.tongue),
    tear(k, 12.6, [20, 25, 30][f], 2.2),
    tear(k, 51.4, [26, 31, 21][f], 2.2),
  ].join('');
}

/** Funny: a silly face, one eye big and one small, tongue out, wobbling. */
export function funny(k) {
  const c = k.P;
  const f = k.frame % 2;
  return k.g(
    `rotate(${f ? 9 : -9} 32 32)`,
    faceBase(k),
    k.eye(f ? 39.6 : 24.4, 27.4, 5),
    k.eye(f ? 24.4 : 39.6, 28.4, 2),
    k.line('M22.4 39.6Q32 46.6 41.6 39.6', { sw: 1.8 }),
    k.path('M33.4 43C33.6 48.6 40.6 51 42.6 46.4C43.4 44 41.8 42 39.6 42.6Z', c.tongue),
    k.line('M38.6 43.6Q39.4 46 40.6 47.4', { color: c.mouth, sw: 1 }),
  );
}

// --- Leo -----------------------------------------------------------------------

/** Proud: Leo, hands on hips, a gold medal on his chest. */
export function proud(k) {
  const c = k.P;
  const f = k.frame % 2;
  const b = f ? -k.px : 0;
  return [
    leo(k, { face: 'grin', bob: b, armBack: [[25.6, 34.8], [17.6, 40.4], [23.4, 45.4]], armFront: [[38.4, 34.8], [46.4, 40.4], [40.6, 45.4]] }),
    k.g(
      `translate(0 ${fmt(b)})`,
      k.path('M27.6 31.6L31 38.4H33L36.4 31.6H33.6L32 35L30.4 31.6Z', c.blue),
      k.circle(32, 41.6, 4.4, c.yellow),
      k.flat(roundPoly(starPoints(32, 41.8, 2.6, 1.1, 5), 0.2), c.amber),
    ),
    f ? '' : sparkle(k, 40.6, 36.4, 2.6) + sparkle(k, 13.6, 16, 2.4) + sparkle(k, 51, 12, 3),
  ].join('');
}

/** Strong: Leo lifting a heavy barbell up to his shoulders. */
export function strong(k) {
  const c = k.P;
  const up = k.frame % 2 === 0;
  const y = up ? 36.4 : 46;
  const [hb, hf] = [[20.4, y], [43.6, y]];
  return [
    leo(k, {
      face: up ? 'grin' : 'o',
      armBack: up ? [[25.6, 34.8], [17.4, 42.4], hb] : [[25.6, 34.8], [21, 41], hb],
      armFront: up ? [[38.4, 34.8], [46.6, 42.4], hf] : [[38.4, 34.8], [43, 41], hf],
    }),
    k.limb(`M7 ${fmt(y)}H57`, c.silverShade, 4),
    k.rect(3.6, y - 8.4, 6.4, 16.8, 1.6, c.charcoal),
    k.rect(54, y - 8.4, 6.4, 16.8, 1.6, c.charcoal),
    k.rect(9.4, y - 6, 3.4, 12, 1, c.charcoal),
    k.rect(51.2, y - 6, 3.4, 12, 1, c.charcoal),
    hand(k, hb),
    hand(k, hf),
    up ? k.line('M12.6 18.6L15.4 21.4M10.4 24.6H14.4M51.4 18.6L48.6 21.4M53.6 24.6H49.6', { sw: 1.4 }) : '',
  ].join('');
}

/** Leo's hand with its thumb up, lifted by `b` (the thumbs down turns it over). */
export function thumbHand(k, b = 0) {
  const c = k.P;
  return k.g(
    `translate(0 ${fmt(b)})`,
    k.rect(21, 50, 22, 12, 2, c.green),
    k.flat('M22 53H42V55H22Z', c.greenShade),
    k.rect(15.6, 27.6, 30, 25, 7.6, c.skin3),
    ...[28.8, 34.8, 40.8].map((y) => k.rect(29.6, y, 17.6, 6.4, 3.2, c.skin3)),
    k.rect(29.6, 46.8, 15.4, 5.8, 2.9, c.skin3),
    k.rect(16.6, 7.6, 10.6, 26.4, 5.3, c.skin3),
    k.flat('M19 10.4H24.8V14.6H19Z', c.skin3Shade),
    k.flat('M16.8 40H28.4V51.6H22.4C19 51.6 16.8 49.6 16.8 46Z', c.skin3Shade),
  );
}

/** Good: a thumbs up, bouncing, with a sparkle. */
export function good(k) {
  const f = k.frame % 2;
  return [k.ground(31, 60, 16, 1.8), thumbHand(k, f ? -k.px : 0), f ? '' : sparkle(k, 36, 9.4, 3.4) + sparkle(k, 8.4, 14, 2.4)].join('');
}

// --- Colors: a crayon and a scribble ------------------------------------------

function crayon(k, color) {
  const c = k.P;
  const body = c[color];
  const shade = c[color === 'white' ? 'silver' : `${color}Shade`];
  return [
    k.ground(32, 59.6, 22, 1.8),
    k.limb('M8.6 52.6L16.6 45.6L23.4 53.4L30.6 45.6L37.4 53.4L44.6 45.6L52.4 52.6', body, 5.2),
    k.g(
      'rotate(-38 32 28)',
      k.path('M44 21.6L56.4 27Q58 28 56.4 29L44 34.4Z', body),
      k.flat('M44.8 30.4L52.6 30.4L44.8 33.6Z', shade),
      k.rect(8, 21.6, 36.4, 12.8, 2.4, body),
      k.rect(15, 21.6, 22, 12.8, 0.6, shade),
      k.flat('M15.6 24H36.4V25.6H15.6ZM15.6 30.4H36.4V32H15.6Z', c.white),
      k.shine('M9.8 24.6V31.4', 1.6),
    ),
  ].join('');
}

export const red = (k) => crayon(k, 'red');
export const blue = (k) => crayon(k, 'blue');
export const yellow = (k) => crayon(k, 'yellow');
export const green = (k) => crayon(k, 'green');
export const black = (k) => crayon(k, 'charcoal');
export const white = (k) => crayon(k, 'white');
export const brown = (k) => crayon(k, 'brown');
export const pink = (k) => crayon(k, 'pink');
// (the opposites: new, short, easy, hard, clean, dirty — see the end of the file)
export const purple = (k) => crayon(k, 'purple');
export const gray = (k) => crayon(k, 'grey');
export const orange = (k) => crayon(k, 'orange');

// --- Sizes and speeds ------------------------------------------------------------

/** Big: a huge friendly dinosaur, a little pine tree at its feet; its head bobs. */
export function big(k) {
  const c = k.P;
  const nod = k.frame % 2 ? 5 : 0;
  return [
    k.ground(30, 59, 26, 2.2),
    pine(k, 57, 59, 14),
    k.path('M14 37C8 39.4 4 45.6 0.6 52.6C6 50.6 12.4 47.4 17.4 45.6Z', c.green),
    k.rect(13.4, 44, 6.6, 14.6, 3, c.greenShade),
    k.rect(31.6, 44, 6.6, 14.6, 3, c.greenShade),
    k.ellipse(27, 38, 16, 11.4, c.green),
    k.flatEllipse(28, 45, 11, 4, c.lime),
    k.flatCircle(21, 31.4, 2.6, c.greenShade),
    k.flatCircle(29.6, 29.4, 2.2, c.greenShade),
    k.flatCircle(36, 32.6, 1.8, c.greenShade),
    k.rect(17.6, 46, 7, 13, 3, c.green),
    k.rect(35, 46, 7, 13, 3, c.green),
    k.g(
      `rotate(${nod} 38 33)`,
      k.limb('M37 35C42 28.4 44 18.6 48.6 12.4', c.green, 9.6),
      k.ellipse(51.4, 10.4, 7.2, 5, c.green),
      k.eye(53.6, 8.8, 2),
      k.line('M54.4 12.6Q56.4 13.6 58 12.2', { sw: 1.2 }),
    ),
  ].join('');
}

/** Small: a tiny ant walking past Leo's big shoe. */
export function small(k) {
  const c = k.P;
  const f = k.frame % 2;
  const x = f ? 46 : 45;
  const y = 49.4;
  const legs = f
    ? `M${x - 1} ${y}L${x - 3.4} ${y + 3.6}M${x} ${y}L${x + 0.4} ${y + 3.6}M${x + 1} ${y}L${x + 3.6} ${y + 3.6}`
    : `M${x - 1} ${y}L${x - 2.4} ${y + 3.6}M${x} ${y}L${x - 1} ${y + 3.6}M${x + 1} ${y}L${x + 2.6} ${y + 3.6}`;
  return [
    k.rect(-2, 52, 68, 14, 0, c.grass),
    k.line('M50 52L51 48.6M53 52L54.4 49M58.6 52L59.4 48.4', { color: c.grassShade, sw: 1.4 }),
    // Leo's leg and his big shoe, coming in from the top
    k.limb('M13 -4V30', c.skin3, 15),
    k.rect(4.6, 22, 17, 9, 2, c.white),
    k.path('M-4 33C-4 27 5 25.4 15 26.6C24 27.6 31 33.4 34 41C35.4 45 34 48.6 30 48.6H-4Z', c.orange),
    k.flat('M-3 44.6H34V48H-3Z', c.charcoal),
    k.line('M12 30L16 33.4M16 28.6L20 32', { color: c.white, sw: 1.4 }),
    // the ant
    k.line(legs, { sw: 1 }),
    k.ellipse(x - 4.4, y - 0.4, 3.2, 2.4, c.charcoal),
    k.circle(x, y - 0.8, 1.6, c.charcoal),
    k.circle(x + 3.4, y - 1.6, 2.2, c.charcoal),
    k.line(`M${x + 3.8} ${y - 3.6}Q${x + 4.6} ${y - 6.4} ${x + 6.6} ${y - 6.6}`, { sw: 1 }),
  ].join('');
}

/** Fast: a race car zooming along. */
export function fast(k) {
  const c = k.P;
  const f = k.frame % 2;
  const b = f ? -k.px : 0;
  const wheel = (x) => k.circle(x, 47, 6, c.charcoal) + k.flatCircle(x, 47, 2.6, c.silver);
  return [
    k.ground(37, 56.8, 24, 2),
    k.speed(9, f ? [28, 35, 42] : [31, 38, 45], 7),
    k.g(
      `translate(0 ${fmt(b)})`,
      k.rect(13, 25.6, 4, 13, 1, c.charcoal),
      k.rect(10, 23.4, 12, 4, 1.4, c.red),
      k.path('M13 46V40.4C13 37.6 15 36 18 36H29L35 30H43L47 36L58.4 39.6C61 40.4 62 42.4 62 44.6V46Z', c.red),
      k.flat('M13.4 42.8H61.6V45.6H13.4Z', c.redShade),
      k.circle(39.4, 30.4, 4.4, c.yellow),
      k.flat('M40.4 28.4H44V31.6H40.4Z', c.charcoal),
      k.circle(26.4, 40.6, 3.6, c.white),
      k.line('M26.4 38.8V42.6', { sw: 1.4 }),
    ),
    wheel(20),
    wheel(52),
  ].join('');
}

/** Slow: a turtle plodding along. */
export function slow(k) {
  const c = k.P;
  const f = k.frame % 2;
  const nod = f ? 1.4 : 0;
  return [
    k.ground(32, 56.4, 23, 2),
    k.limb(f ? 'M19 47.6L17 54.6M41.6 47.6L43.6 54.6' : 'M19 47.6L21 54.6M41.6 47.6L39.6 54.6', c.green, 6.4),
    k.poly([[12.6, 45], [6.4, 47.6], [12.6, 49.6]], 0.8, c.green),
    k.limb(`M47 44L${fmt(52.4)} ${fmt(41 + nod)}`, c.green, 7),
    k.circle(54.4, 39.4 + nod, 6, c.green),
    k.eye(56.6, 37.8 + nod, 1.8),
    k.line(`M56 ${fmt(42.6 + nod)}Q57.8 ${fmt(43.6 + nod)} 59.4 ${fmt(42.2 + nod)}`, { sw: 1.2 }),
    k.path('M11 47C11 34 20.4 25.6 31.6 25.6C42.8 25.6 52 34 52 47Z', c.brown),
    k.flat(roundPoly([[31.6, 29], [37, 32.4], [37, 38.6], [31.6, 42], [26.2, 38.6], [26.2, 32.4]], 1), c.wood),
    k.flat(roundPoly([[17.4, 38], [22.6, 34.6], [23.4, 41], [20, 45.4], [15, 44.4]], 1), c.wood),
    k.flat(roundPoly([[45.8, 38], [40.6, 34.6], [39.8, 41], [43.2, 45.4], [48.2, 44.4]], 1), c.wood),
    k.rect(9.4, 45.4, 44.2, 4, 2, c.brownShade),
  ].join('');
}

/** Tall: a giraffe, twice as tall as Leo standing next to it; its ear flicks. */
export function tall(k) {
  const c = k.P;
  const flick = k.frame % 2 ? -16 : 0;
  return [
    k.ground(29, 59, 15, 2),
    k.limb('M21.6 38.6V57.6M26 38.6V57.6M31.4 38.6V57.6M35.8 38.6V57.6', c.yellow, 4.4),
    k.line('M18.6 35Q16.4 39 16.6 43', { sw: 1.4 }),
    k.ellipse(28, 36.6, 10.4, 6.4, c.yellow),
    k.flat('M22 33H26.4L25.6 37H21.6ZM29.6 35.6H34L33.4 39.6H29.4Z', c.brown),
    k.path('M31 35C32.4 27 34 19 35.4 11.4L41 12.4C39.6 20 38.4 28 38 37Z', c.yellow),
    k.flat('M33.4 26.6H37.6L37 30.6H33ZM35 17.6H39L38.4 21H34.6Z', c.brown),
    k.limb('M38.6 8V3.6M44 8V3.6', c.brown, 3.8),
    k.g(`rotate(${flick} 35 11)`, k.ellipse(31.6, 10.6, 4, 2, c.yellow)),
    k.path('M35 11C35 6.6 39 5.4 43 6.4L53 9.6C57 11 58.6 14 57.6 17C56.6 20 53 20.6 49.6 19.6L40 17C36.6 16 35 14 35 11Z', c.yellow),
    k.flat('M50 11.6C53 12.4 56 13.6 57.6 16.4C56.6 19.4 53.6 20.2 50.4 19.4Z', c.tan),
    k.flatCircle(55, 14.4, 0.9, c.ink),
    k.eye(42.4, 10.4, 2.2),
    placed(k, CAST.leo, { face: 'grin', look: -1.4 }, 54.4, 59, 0.46),
  ].join('');
}

// --- Opposites ------------------------------------------------------------------

/** New: a brand-new red sneaker, its price tag still on, sparkling. */
export function newThing(k) {
  const c = k.P;
  const f = k.frame % 2;
  return [
    k.ground(32, 58.6, 24, 2),
    k.path('M8.6 46.6V30.6C8.6 27.6 10.6 25.6 13.6 25.6H23.6C26 25.6 27.6 27 28.6 29L31.6 35.4C33 38 35.6 39.4 38.6 39.6L50.6 40.6C55.6 41 58.6 44.4 58.6 48.6V46.6Z', c.red),
    k.path('M6.6 46.6H59.6V50.6C59.6 52.8 57.8 54.6 55.6 54.6H10.6C8.4 54.6 6.6 52.8 6.6 50.6Z', c.white),
    k.flat('M9.8 26.8H23V29.4H9.8Z', c.white),
    k.line('M29.6 33.6L34.6 31.4M32.6 37.4L37.6 35.4', { color: c.white, sw: 1.4 }),
    k.shine('M12.4 32V40', 1.8),
    k.line('M30 31.6Q32 22 38 19', { sw: 1.2 }),
    k.g('rotate(18 44 16)', k.rect(37.6, 11, 13, 9.6, 2, c.cream), k.flatCircle(40.4, 15.8, 1.2, c.white)),
    sparkle(k, f ? 54 : 50, f ? 28 : 30, 3.4),
    sparkle(k, f ? 10 : 14, f ? 16 : 19, 2.6),
    sparkle(k, 26, 9, f ? 2.8 : 2),
  ].join('');
}

/** Short: a pencil worn down to a stub — the dotted line is how long it was. */
export function short(k) {
  const c = k.P;
  const dashes = [];
  for (let x = 30; x < 56; x += 5) dashes.push(k.flat(`M${fmt(x)} 26.6H${fmt(x + 2.6)}V28H${fmt(x)}ZM${fmt(x)} 40H${fmt(x + 2.6)}V41.4H${fmt(x)}Z`, c.grey));
  return [
    k.ground(24, 52, 18, 2),
    ...dashes,
    k.flat('M55.4 26.6H56.8V41.4H55.4Z', c.grey),
    k.rect(8, 27, 6, 14, 1.6, c.pink),
    k.rect(13, 26.6, 3.6, 14.8, 0.6, c.silver),
    k.rect(16.4, 27, 9.6, 14, 0.6, c.yellow),
    k.flat('M16.8 36.6H25.6V40.6H16.8Z', c.yellowShade),
    k.path('M26 27L33.6 34L26 41Z', c.wood),
    k.path('M31.2 31.8L33.6 34L31.2 36.2Z', c.charcoal),
    k.shine('M9.6 30V36', 1.4),
  ].join('');
}

/** Easy: the last puzzle piece drops into its place — click! */
export function easy(k) {
  const c = k.P;
  const down = k.frame % 2 === 1;
  const y = down ? 0 : -12;
  const piece = (dy) =>
    `M24 ${fmt(30 + dy)}H29C29 ${fmt(26 + dy)} 35 ${fmt(26 + dy)} 35 ${fmt(30 + dy)}H40V${fmt(36 + dy)}C44 ${fmt(36 + dy)} 44 ${fmt(42 + dy)} 40 ${fmt(42 + dy)}V${fmt(48 + dy)}H24Z`;
  return [
    k.ground(32, 58.6, 26, 2),
    k.rect(8, 26, 48, 26, 2.4, c.blue),
    k.flat('M9 47H55V51H9Z', c.blueShade),
    k.flat(piece(0), c.navy),
    k.path(piece(y), c.lime),
    k.flat(`M36 ${fmt(31 + y)}H39V${fmt(47 + y)}H36Z`, c.limeShade),
    k.shine(`M26.6 ${fmt(33 + y)}V${fmt(41 + y)}`, 1.6),
    down ? sparkle(k, 52, 16, 3.6) + sparkle(k, 12, 18, 2.6) : k.line('M32 6V11M28 8L30 11.6M36 8L34 11.6', { sw: 1.4 }),
  ].join('');
}

/** Hard: a rope in a tangled knot. */
export function hard(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 24, 2),
    k.limb('M4 50C10 50 12 44 16 40', c.wood, 4.6),
    k.limb('M20 34C14 22 30 12 38 20C46 28 34 40 26 36C16 31 28 18 40 24C52 30 46 44 36 44C26 44 22 32 32 28', c.wood, 4.6),
    k.limb('M16 40C20 36 26 46 34 44', c.wood, 4.6),
    k.limb('M44 42C48 46 54 48 60 46', c.wood, 4.6),
    k.limb('M38 30C44 34 42 40 44 42', c.wood, 4.6),
    k.limb('M27 24C30 30 36 26 34 34', c.wood, 4.6),
  ].join('');
}

/** Clean: a plate washed so clean it sparkles. */
export function clean(k) {
  const c = k.P;
  const f = k.frame % 2;
  return [
    k.ground(32, 56, 24, 2),
    k.ellipse(32, 40, 26, 12, c.sky),
    k.flatEllipse(32, 41.6, 24, 9.6, c.skyShade),
    k.ellipse(32, 39, 18, 7.8, c.white),
    k.flatEllipse(32, 40.4, 16, 5.6, c.silver),
    k.flatEllipse(32, 38.6, 15, 4.6, c.white),
    k.shine('M20 36Q24 33 30 32.6', 1.8),
    k.circle(f ? 52 : 50, f ? 18 : 22, 4, c.sky),
    k.shineDot(f ? 50.8 : 48.8, f ? 16.8 : 20.8, 1),
    k.circle(f ? 12 : 13, f ? 24 : 20, 2.6, c.sky),
    sparkle(k, 28, f ? 16 : 18, f ? 4 : 3),
    sparkle(k, 40, f ? 22 : 24, f ? 2.4 : 3.2),
  ].join('');
}

/** Dirty: a green boot splashed with mud, a fly buzzing round it. */
export function dirty(k) {
  const c = k.P;
  const f = k.frame % 2;
  const [fx, fy] = f ? [50, 12] : [42, 6];
  return [
    k.ground(34, 58.6, 21, 2),
    k.path('M16.6 8.6H38.6V40.6C38.6 42.6 40 44 42 44.4L50.6 46C55.6 47 57.6 50.6 57.6 54.6V56.6H16.6Z', c.green),
    k.path('M15.6 52.6H58.6V56.6C58.6 58 57.6 59 56.2 59H18C16.6 59 15.6 58 15.6 56.6Z', c.charcoal),
    k.flat('M16.6 42C22 40 26 44 32 42C36 40.6 40 46 46 45.4C50 45 54 47 56.6 50V53H16.6Z', c.brown),
    k.flat('M22 30C24 28 27 29 27 31.6C27 34 24 35 22.4 33.4ZM31 20C32.6 19 34.6 20 34.4 22C34.2 24 31.6 24.4 30.8 22.6Z', c.brown),
    k.flat('M25.8 42V48.6C25.8 49.6 27 50 27.4 49L27.8 42Z', c.brownShade),
    k.ellipse(fx, fy, 2.4, 2, c.charcoal),
    k.ellipse(fx - 1.6, fy - 2.4, 1.8, 1.2, c.silver),
    k.ellipse(fx + 1.6, fy - 2.4, 1.8, 1.2, c.silver),
    k.line(f ? 'M44 9Q46 14 48 11' : 'M45 9Q47 4 50 7', { sw: 1.2 }),
  ].join('');
}

/** Warm: a thermometer, its red line up past the middle, the sun shining by it. */
export function warm(k) {
  const c = k.P;
  const level = k.frame % 2 ? 21.6 : 24.6;
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const a = ((i * 45 - 90) * Math.PI) / 180;
    const p = (r) => `${fmt(45 + r * Math.cos(a))} ${fmt(19 + r * Math.sin(a))}`;
    rays.push(`M${p(12.6)}L${p(i % 2 ? 15.6 : 17.6)}`);
  }
  return [
    k.limb(rays.join(''), c.amber, 4.4),
    k.circle(45, 19, 9.6, c.yellow),
    k.rect(15.6, 6.6, 13.6, 44, 6.8, c.white),
    k.circle(22.4, 51.4, 8.6, c.red),
    k.flat(`M19.8 ${level}H25V47H19.8Z`, c.red),
    k.line('M30.6 14H27.6M30.6 20H27.6M30.6 26H27.6M30.6 32H27.6M30.6 38H27.6', { sw: 1.4 }),
    k.shine('M18.6 12V19', 1.4),
  ].join('');
}

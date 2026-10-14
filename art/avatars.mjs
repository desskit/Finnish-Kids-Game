// Avatar heads: the twelve animals a player can be, and a test tube for the
// grown-ups' test profile. Each is one big head filling its spot, blinking.
// The animals that are also words reuse their own heads, drawn bigger.

import { catHead, dogHead, foxHead } from './animals.mjs';
import { bearHead, bunnyHead, frogHead, lionHead } from './animals-sitting.mjs';
import { crescentPath, fmt, pt } from './kit.mjs';

/** A sitting animal's head (its middle at height cy), scaled up and centred in the spot. */
const big = (k, inner, cy, s) => k.g(`translate(32 33) scale(${s}) translate(-32 ${-cy})`, inner);

export const avatarCat = (k) => big(k, catHead(k), 24.6, 1.5);
export const avatarDog = (k) => big(k, dogHead(k), 24.4, 1.4);
export const avatarBear = (k) => big(k, bearHead(k), 24.6, 1.52);
export const avatarBunny = (k) => big(k, bunnyHead(k), 20.4, 1.3);
export const avatarLion = (k) => big(k, lionHead(k), 25.4, 1.4);
export const avatarFrog = (k) => big(k, frogHead(k), 28.2, 1.55);

/** The usual face, big: eyes, rosy cheeks, a nose and a small mouth. */
function face(k, x, y, { eyeGap = 8.4, eyeY = -2.6, nose = 'ink', noseW = 3, mouth = true } = {}) {
  const c = k.P;
  return [
    k.eye(x - eyeGap, y + eyeY, 3.4),
    k.eye(x + eyeGap, y + eyeY, 3.4),
    k.blush(x - eyeGap - 5, y + 4.6, 3.2, 1.9),
    k.blush(x + eyeGap + 5, y + 4.6, 3.2, 1.9),
    k.ellipse(x, y + 4.2, noseW, noseW * 0.72, c[nose], { stroke: false }),
    mouth ? k.line(`M${pt([x - 3.4, y + 7.6])}Q${pt([x - 1.7, y + 9.6])} ${pt([x, y + 7.8])}Q${pt([x + 1.7, y + 9.6])} ${pt([x + 3.4, y + 7.6])}`, { sw: 1.4 }) : '',
  ].join('');
}

/** The owl: brown, with ear tufts and big pale eye discs. */
export function avatarOwl(k) {
  const c = k.P;
  const tuft = (s) =>
    k.poly(
      [
        [32 + s * 21.4, 8.6],
        [32 + s * 9.6, 17.6],
        [32 + s * 19.6, 22.6],
      ],
      1.4,
      c.hazel,
    );
  return [
    tuft(-1),
    tuft(1),
    k.ellipse(32, 34.4, 22.4, 21.4, c.hazel),
    k.flat(crescentPath(32, 34.4, 22.4, 10, 170, 0.2), c.hazelShade),
    k.line('M24.6 50.6L26.6 52.6L28.6 50.6M30 53.4L32 55.4L34 53.4M35.4 50.6L37.4 52.6L39.4 50.6', { color: c.hazelShade, sw: 1.2 }),
    k.circle(22.6, 30.4, 8.8, c.cream),
    k.circle(41.4, 30.4, 8.8, c.cream),
    k.eye(22.6, 30.6, 3.4),
    k.eye(41.4, 30.6, 3.4),
    k.poly(
      [
        [29, 36],
        [35, 36],
        [32, 42.6],
      ],
      1,
      c.amber,
    ),
  ].join('');
}

/** The panda: white, black ears and eye patches. */
export function avatarPanda(k) {
  const c = k.P;
  const patch = (s) => k.g(`rotate(${s * -28} ${fmt(32 + s * 8.6)} 31.4)`, k.flatEllipse(32 + s * 8.6, 31.4, 5.4, 7, c.charcoal));
  return [
    k.circle(14.6, 15.6, 7, c.charcoal),
    k.circle(49.4, 15.6, 7, c.charcoal),
    k.ellipse(32, 34, 22.6, 20.6, c.white),
    k.flat(crescentPath(32, 34, 22.6, 10, 170, 0.14), c.silver),
    patch(-1),
    patch(1),
    k.flatCircle(23.4, 30.6, 3.2, c.white),
    k.flatCircle(40.6, 30.6, 3.2, c.white),
    k.eye(23.4, 30.8, 2.6),
    k.eye(40.6, 30.8, 2.6),
    k.blush(16.6, 40, 3.2, 1.9),
    k.blush(47.4, 40, 3.2, 1.9),
    k.ellipse(32, 39, 3.2, 2.2, c.charcoal, { stroke: false }),
    k.line('M28.6 42.6Q30.3 44.6 32 42.8Q33.7 44.6 35.4 42.6', { sw: 1.4 }),
  ].join('');
}

/** The tiger: orange with dark stripes and a white muzzle. */
export function avatarTiger(k) {
  const c = k.P;
  const ear = (s) =>
    k.circle(32 + s * 15.4, 15.6, 6.4, c.orange) + k.flatCircle(32 + s * 15.4, 15.6, 3.2, c.cream);
  return [
    ear(-1),
    ear(1),
    k.ellipse(32, 34, 22.6, 20.4, c.orange),
    k.flat('M27.4 14.6Q28.4 19.6 30 21Q30.4 17 29.6 14ZM34.4 14Q33.6 17 34 21Q35.6 19.6 36.6 14.6ZM31 13.8H33L32.6 19H31.4Z', c.charcoal),
    k.flat('M9.8 30.6L17 32.4L10.2 34.6ZM9.8 38L16.4 38.6L11.4 41.6ZM54.2 30.6L47 32.4L53.8 34.6ZM54.2 38L47.6 38.6L52.6 41.6Z', c.charcoal),
    k.flat('M32 34.4C28 31.6 18.6 33 18.6 41C18.6 47.6 25 52.6 32 52.6C39 52.6 45.4 47.6 45.4 41C45.4 33 36 31.6 32 34.4Z', c.white),
    face(k, 32, 34, { eyeGap: 8.6, nose: 'coral', noseW: 3.2 }),
  ].join('');
}

/** The koala: grey, with big fluffy ears and a big dark nose. */
export function avatarKoala(k) {
  const c = k.P;
  const ear = (s) => k.circle(32 + s * 18.6, 19, 10, c.grey) + k.flatCircle(32 + s * 18.6, 19.6, 6, c.silver);
  return [
    ear(-1),
    ear(1),
    k.ellipse(32, 35, 20.4, 19.6, c.grey),
    k.flat(crescentPath(32, 35, 20.4, 10, 170, 0.14), c.greyShade),
    k.eye(23.6, 31.6, 3.4),
    k.eye(40.4, 31.6, 3.4),
    k.blush(17.4, 40.6, 3, 1.8),
    k.blush(46.6, 40.6, 3, 1.8),
    k.ellipse(32, 39, 4.6, 6, c.charcoal),
    k.shineDot(30.6, 36.6, 1.1),
    k.line('M28.6 47.6Q30.3 49.6 32 47.8Q33.7 49.6 35.4 47.6', { sw: 1.4 }),
  ].join('');
}

/** The penguin: dark, a white face, an orange beak. */
export function avatarPenguin(k) {
  const c = k.P;
  return [
    k.ellipse(32, 33.4, 22.4, 22, c.charcoal),
    k.path('M32 22.6C27.6 15.6 14.6 17.6 14.6 30.6C14.6 43 22.6 52.6 32 52.6C41.4 52.6 49.4 43 49.4 30.6C49.4 17.6 36.4 15.6 32 22.6Z', c.white),
    k.eye(24.4, 30.4, 3.4),
    k.eye(39.6, 30.4, 3.4),
    k.blush(19, 39, 3, 1.8),
    k.blush(45, 39, 3, 1.8),
    k.poly(
      [
        [26.6, 36],
        [37.4, 36],
        [32, 42.4],
      ],
      1.6,
      c.orange,
    ),
    k.flat('M27.6 38.4H36.4L34.4 40.8H29.6Z', c.orangeShade),
  ].join('');
}

/** The test profile's avatar: a test tube, bubbling. */
export function avatarTestTube(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 3 : 0;
  const bubbles = [
    [30, [44, 36, 28][f], 2.2],
    [35, [34, 26, 46][f], 1.6],
    [31.6, [24, 46, 38][f], 1.4],
  ];
  return k.g(
    'rotate(24 32 34)',
    k.rect(23.6, 6.6, 16.8, 6, 2, c.wood),
    k.path('M25 12.6H39V48.6A7 7 0 0 1 25 48.6Z', c.silver),
    k.path('M25 30H39V48.6A7 7 0 0 1 25 48.6Z', c.lime),
    k.flat('M34.6 31H38V48.6C38 51.4 36.4 54 34 55C35.4 52.4 34.6 50.4 34.6 48.6Z', c.limeShade),
    k.line('M25 30H39', { sw: 1.2 }),
    ...bubbles.map(([x, y, r]) => k.flatCircle(x, y, r, c.white)),
    k.shine('M28.4 15.4V25.6', 2),
  );
}

/** The mascot, over the moon: the fox jumping for joy, confetti flying. */
export function foxCheer(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 4 : 0;
  // the top of the jump (the still picture), coming down, landing, going up again
  const up = [-8, -3, 0, -5][f];
  const arms = [0, 8, 16, 4][f];
  const bits = [
    [10, 12, 'red', 20],
    [52, 8, 'blue', -30],
    [56, 30, 'yellow', 45],
    [8, 34, 'green', 10],
    [20, 4, 'purple', -15],
    [46, 22, 'pink', 30],
  ];
  return [
    k.ground(32, 59.4, [10, 13, 16, 12][f], 2),
    ...bits.map(([x, y, col, a]) => k.g(`rotate(${a + f * 40} ${x} ${y + f * 1.6})`, k.rect(x - 2.6, y + f * 1.6 - 1.6, 5.2, 3.2, 0.6, c[col]))),
    k.g(
      `translate(0 ${up})`,
      k.limb('M41 47C50.6 49 55 42 52.6 34', c.orange, 6.4),
      k.circle(52.4, 33.4, 3.6, c.white),
      k.limb(`M27 46L${f === 2 ? 24 : 25.4} 56.6`, c.orange, 6),
      k.limb(`M37 46L${f === 2 ? 40 : 38.6} 56.6`, c.orange, 6),
      k.ellipse(f === 2 ? 23.6 : 25, 57.4, 3.6, 2.2, c.charcoal),
      k.ellipse(f === 2 ? 40.4 : 39, 57.4, 3.6, 2.2, c.charcoal),
      k.poly(
        [
          [24.6, 30],
          [39.4, 30],
          [41, 50],
          [23, 50],
        ],
        [4, 4, 4, 4],
        c.orange,
      ),
      k.flatEllipse(32, 42, 5, 7, c.white),
      k.limb(`M26 33L${fmt(17 - arms * 0.2)} ${fmt(16 + arms)}`, c.orange, 6),
      k.limb(`M38 33L${fmt(47 + arms * 0.2)} ${fmt(16 + arms)}`, c.orange, 6),
      k.circle(17 - arms * 0.2, 15 + arms, 3.4, c.charcoal),
      k.circle(47 + arms * 0.2, 15 + arms, 3.4, c.charcoal),
      k.g('translate(13.4 3.6) scale(0.58)', foxHead(k)),
    ),
  ].join('');
}

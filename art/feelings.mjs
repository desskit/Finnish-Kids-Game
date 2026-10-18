// The feelings that happen TO you (Minua pelottaa — "it scares me"): the same
// round face as the other feelings, each with what gives it away. Scared
// peeks over a blanket, nervous grits its teeth, sleepy nods off behind a
// bubble, giggly hides a giggle behind a hand, teary holds back the tears.
// Each is kept apart from its look-alike (tired, laugh, cry, worried).

import { fmt, roundPoly, starPoints } from './kit.mjs';
import { cheeks, faceBase, tear } from './faces.mjs';

/** Worried brows (their inner ends up), at height y. */
const brows = (k, y = 22.2) => k.line(`M19.4 ${fmt(y)}L27.2 ${fmt(y - 2.6)}M44.6 ${fmt(y)}L36.8 ${fmt(y - 2.6)}`, { sw: 1.6 });

/** A little four-pointed twinkle. */
const twinkle = (k, x, y, r) => k.flat(roundPoly(starPoints(x, y, r, r * 0.34, 4), 0.3), k.P.yellow);

/** Scared: peeking over a blanket pulled up to the nose, wide-eyed and trembling. */
export function scared(k) {
  const c = k.P;
  const f = k.frame % 2;
  const shiver = (x, s) => k.line(`M${fmt(x)} 22.4L${fmt(x - s * 2.6)} 25.2L${fmt(x)} 28L${fmt(x - s * 2.6)} 30.8`, { sw: 1.4 });
  return [
    k.g(
      `translate(${f ? 0.8 : -0.8} 0)`,
      faceBase(k),
      k.line('M18.6 20.6L27 17.2M45.4 20.6L37 17.2', { sw: 1.6 }),
      // wide eyes: the whites round small pupils
      k.circle(24.4, 28, 4.8, c.white),
      k.circle(39.6, 28, 4.8, c.white),
      k.eye(24.4, 28.6, 2),
      k.eye(39.6, 28.6, 2),
    ),
    // the blanket, and the hands holding it up
    k.path('M3 40.6Q17.6 36.4 32 38.4Q46.4 36.4 61 40.6V62.4H3Z', c.blue),
    k.flat('M4 52.4H60V61.4H4Z', c.blueShade),
    k.flatCircle(13, 46.4, 1.6, c.white),
    k.flatCircle(30, 47.6, 1.6, c.white),
    k.flatCircle(47.4, 46.6, 1.6, c.white),
    k.flatCircle(21.6, 56.4, 1.6, c.white),
    k.flatCircle(40, 56.6, 1.6, c.white),
    k.circle(21.4, 39.2, 3.6, c.yellow),
    k.circle(42.6, 39.2, 3.6, c.yellow),
    f ? '' : shiver(6, 1) + shiver(58, -1),
  ].join('');
}

/** Nervous: teeth gritted, the eyes darting from side to side. */
export function nervous(k) {
  const c = k.P;
  const f = k.frame % 2;
  const look = f ? 1.8 : -1.8;
  return [
    faceBase(k),
    brows(k),
    k.eye(24.4 + look, 28.6, 3),
    k.eye(39.6 + look, 28.6, 3),
    // the grimace: a wide mouth of clenched teeth
    k.rect(20.4, 37.2, 23.2, 8.8, 3.2, c.white),
    k.line('M21.4 41.6H42.6M26.2 37.6V45.6M32 37.6V45.6M37.8 37.6V45.6', { sw: 1.4 }),
    // jitters, one side then the other
    k.line(f ? 'M57.4 26L60.6 28.4M56.6 33.6L60.4 34.6' : 'M6.6 26L3.4 28.4M7.4 33.6L3.6 34.6', { sw: 1.4 }),
  ].join('');
}

/** Sleepy: the eyelids drooping, a bubble growing as the head nods off. */
export function sleepy(k) {
  const c = k.P;
  const f = k.frame % 3;
  const r = [1.8, 3.4, 5][f];
  return k.g(
    `rotate(${[0, 6, 12][f]} 32 40)`,
    faceBase(k),
    // heavy lids: only a sliver of each eye shows
    k.eye(24.4, 30.4, 2.6),
    k.eye(39.6, 30.4, 2.6),
    k.flat('M19.6 23.6H29.2V30.2H19.6ZM34.8 23.6H44.4V30.2H34.8Z', c.yellow),
    k.line('M20.2 30.2Q24.4 31.6 28.6 30.2M35.4 30.2Q39.6 31.6 43.8 30.2', { sw: 1.6 }),
    k.ellipse(30.4, 44, 2.4, 1.8, c.mouth, { sw: 1.5 }),
    // the bubble, where a nose would be
    k.circle(36 + r * 0.7, 37.4, r, c.sky),
    k.shineDot(35.4 + r * 0.5, 36.2 - r * 0.3, Math.max(0.8, r * 0.3)),
  );
}

/** Giggly: a hand over the mouth, trying not to laugh out loud. */
export function giggly(k) {
  const c = k.P;
  const f = k.frame % 2;
  return k.g(
    `translate(0 ${f ? -k.px : 0})`,
    faceBase(k),
    k.happyEye(24.4, 27.2, 6.4),
    k.happyEye(39.6, 27.2, 6.4),
    cheeks(k),
    // the hand: fingers to the left, over the mouth
    k.poly([[19.6, 36], [41.4, 35.2], [44.6, 46.8], [21.6, 48.4]], [5.4, 3, 4, 5.4], c.yellow),
    k.line('M22.6 39.6H33M22.4 43.4H33.6', { sw: 1.4 }),
    k.limb('M42.6 45L50.6 58', c.yellow, 8.6),
    twinkle(k, f ? 54 : 10, f ? 14 : 16, 3),
    twinkle(k, f ? 9 : 55, f ? 20 : 18, 2.2),
  );
}

/** Teary: brimming eyes, a wobbly mouth, one tear getting away. */
export function teary(k) {
  const c = k.P;
  const f = k.frame % 2;
  return [
    faceBase(k),
    brows(k, 21.6),
    k.eye(24.4, 28.6, 4),
    k.eye(39.6, 28.6, 4),
    // the water pooling at the bottom of each eye (not while blinking)
    k.blink ? '' : k.flat('M21.4 30.2Q24.4 34.6 27.4 30.2Q24.4 32 21.4 30.2ZM36.6 30.2Q39.6 34.6 42.6 30.2Q39.6 32 36.6 30.2Z', c.sky),
    k.blink ? '' : k.shineDot(25.8, 30.6, 0.9) + k.shineDot(41, 30.6, 0.9),
    k.line('M25.4 43Q27.8 40.8 29.8 42.8Q32 44.8 34.2 42.8Q36.2 40.8 38.6 43', { sw: 1.6 }),
    tear(k, 19.4, f ? 37.4 : 34.6, f ? 2 : 1.6),
  ].join('');
}

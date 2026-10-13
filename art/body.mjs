// Body words: each part on its own, big and simple, in Eero's skin tone (the
// head, hair and tummy are the cast's own). A few of them move: the eye looks
// around, the ear hears, the hand waves, the toes wiggle, the heart beats.

import { CAST, portrait } from './people.mjs';
import { pt, roundPoly, starPoints } from './kit.mjs';

const SKIN = 'skin2';

/** A part scaled about a point. */
const grow = (k, s, [x, y], inner) => (s === 1 ? inner : k.g(`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`, inner));

/** A cast member's head, scaled up and centred at (32, y). */
const bigHead = (k, look, s, y, face) => k.g(`translate(32 ${y}) scale(${s}) translate(-32 -20.5)`, portrait(k, look, face));

/** An eye that looks left and right, and now and then blinks. */
export function eye(k) {
  const c = k.P;
  const f = k.frame % 8;
  const lid = 'M7 32C15 18.4 49 18.4 57 32C49 45.6 15 45.6 7 32Z';
  const brow = k.limb('M17.6 13.6Q32 6.4 46.4 13.6', c.hazel, 4.6);
  if (f === 5) {
    return [
      brow,
      k.path(lid, c[SKIN]),
      k.line('M9 33Q32 44.6 55 33'),
      k.line('M20.6 39.4L18.6 43.4M32 41.4V45.6M43.4 39.4L45.4 43.4', { sw: 1.4 }),
    ].join('');
  }
  const dx = [0, 0, -4.4, -4.4, 0, 0, 4.4, 4.4][f];
  return [
    brow,
    k.line('M19.8 24.4L16.8 19.2M32 21.6V15.6M44.2 24.4L47.2 19.2', { sw: 1.4 }),
    k.path(lid, c.white),
    k.flatCircle(32 + dx, 32, 9.8, c.blueShade),
    k.flatCircle(32 + dx, 32, 8.2, c.blue),
    k.flatCircle(32 + dx, 32, 4.6, c.ink),
    k.flatCircle(29 + dx, 28.6, 2, c.white),
  ].join('');
}

/** An ear, side on, hearing a sound (the waves pulse in from the left). */
export function ear(k) {
  const c = k.P;
  const waves = [0, 1, 2][k.frame % 3];
  const arc = (r) => k.line(`M${pt([18 - r, 21 - r * 0.5])}Q${pt([12 - r * 1.4, 32])} ${pt([18 - r, 43 + r * 0.5])}`, { color: c.amber, sw: 2.6 });
  return [
    waves >= 1 ? arc(0) : '',
    waves >= 2 ? arc(5.6) : '',
    k.path('M26 10.6C34 4.6 49.4 7.6 51 20.6C52.2 30.6 46 35.4 42.4 40.6C39.6 44.6 40 50.6 35 54.6C30.6 58 23.4 56.6 22.4 50.6C21.8 46.6 25.2 44.4 27.6 41C30.2 37.4 27.6 33.2 25.4 29.6C22 24.2 20.4 14.8 26 10.6Z', c[SKIN]),
    k.limb('M30 17.6C35.6 12.8 44.4 15.4 44.6 23.4C44.8 29.4 40.4 32.6 37.4 35.6', c[`${SKIN}Shade`], 4.2),
    k.flatEllipse(34.4, 27.6, 3.4, 4, c[`${SKIN}Shade`]),
    k.shine('M29.2 13.4Q33 10.4 37.4 10.8', 2),
  ].join('');
}

/** A nose, front on, with a shine on its tip. */
export function nose(k) {
  const c = k.P;
  return [
    k.path(
      'M32 9.6C34.6 9.6 35.8 14 36.8 22C37.8 30 40.2 34 44.8 37.4C49.8 41.2 48.8 50.4 42 50.8C39.4 51 37.4 49.6 36 48C34.2 50.2 29.8 50.2 28 48C26.6 49.6 24.6 51 22 50.8C15.2 50.4 14.2 41.2 19.2 37.4C23.8 34 26.2 30 27.2 22C28.2 14 29.4 9.6 32 9.6Z',
      c[SKIN],
    ),
    k.flat('M36.4 20C37.6 29.6 40.4 34.4 45.2 38C48.6 41 48.4 47.6 43.6 49.4C46 45 43.4 40.6 39.8 38.2C36.6 35.6 35.8 28 36.4 20Z', c[`${SKIN}Shade`]),
    k.flatEllipse(27.4, 46, 2.8, 1.6, c.skin3Shade),
    k.flatEllipse(36.6, 46, 2.8, 1.6, c.skin3Shade),
    k.shineDot(30.4, 39.4, 1.8),
  ].join('');
}

/** A big smile: lips, teeth and a tongue. */
export function mouth(k) {
  const c = k.P;
  return [
    k.path('M7 25.6C13.4 21.4 21.6 20.6 25.8 23C28.2 21.4 30 21 32 22.4C34 21 35.8 21.4 38.2 23C42.4 20.6 50.6 21.4 57 25.6C53.4 40.6 43 48.4 32 48.4C21 48.4 10.6 40.6 7 25.6Z', c.coral),
    k.path('M12 27.4C20 29.6 44 29.6 52 27.4C48 37.8 40.4 43 32 43C23.6 43 16 37.8 12 27.4Z', c.mouth),
    k.flat('M13.6 28C22.8 30.4 41.2 30.4 50.4 28L49.2 32.6C41.4 34.4 22.6 34.4 14.8 32.6Z', c.white),
    k.flatEllipse(32, 41.6, 8.6, 4.4, c.tongue),
    k.shine('M24.4 44.4Q29 46 33.4 45.8', 2),
  ].join('');
}

/** An open hand, waving. */
export function hand(k) {
  const c = k.P;
  const skin = c[SKIN];
  const turn = k.frame % 2 ? 9 : -5;
  return [
    k.ground(32, 58.6, 11, 2.2),
    k.g(
      `rotate(${turn} 32 56)`,
      k.g('rotate(-38 22.6 41)', k.rect(16.4, 27, 7, 17, 3.5, skin)),
      k.rect(19.4, 11.4, 6.6, 24, 3.3, skin),
      k.rect(26.6, 7.6, 6.6, 26, 3.3, skin),
      k.rect(33.8, 9.4, 6.6, 24, 3.3, skin),
      k.rect(40.6, 15, 6, 19, 3, skin),
      k.rect(19, 27, 28, 25.6, 9, skin),
      k.flat('M42 31.6C45 38 44.6 46 39.4 51.6C44.6 50 47 45 47 38.6Z', c[`${SKIN}Shade`]),
      k.line('M26 40.6Q31.4 43.6 37.4 41.4', { color: c[`${SKIN}Shade`], sw: 1.4 }),
      k.rect(21, 49.6, 22, 8, 2.4, c.blue),
    ),
  ].join('');
}

/** A bare foot, sole up, its toes wiggling. */
export function foot(k) {
  const c = k.P;
  const skin = c[SKIN];
  const wiggle = (i) => (k.frame % 2 && i % 2 ? -k.px : 0);
  const toes = [
    [24.4, 17.4, 4.8],
    [32, 13, 3.6],
    [38.2, 13.4, 3.2],
    [43.2, 16.2, 2.9],
    [46.8, 20.6, 2.6],
  ];
  return [
    k.ground(34, 58.6, 13, 2.2),
    ...toes.map(([x, y, r], i) => k.circle(x, y + wiggle(i), r, skin)),
    k.path('M22 26.6C27 20.6 41.6 20 45.4 28.4C48.6 35.4 44.6 41.6 42.6 47.4C40.8 52.8 37.6 57 31.6 56.6C25.2 56.2 24.2 50.6 24.6 45.2C25 40.6 24 38.6 21.8 35.2C20 32.2 20 29 22 26.6Z', skin),
    k.flat('M24.6 36C27.4 39 28.2 42 28 46.4C27.8 50 28.8 53.2 31.6 54.4C26.4 54.4 25.6 50.2 26 45.6C26.2 41.6 25.8 38.8 24.6 36Z', c[`${SKIN}Shade`]),
    k.shine('M29.4 26.4Q35 24.6 40 26.8', 2),
  ].join('');
}

/** A head: Eero's, big, on his shoulders. */
export function head(k) {
  const c = k.P;
  const look = CAST.eero;
  return [
    k.path('M10.6 64C10.6 54.6 19.4 50.4 32 50.4C44.6 50.4 53.4 54.6 53.4 64Z', c[look.top.color]),
    k.rect(27.2, 40, 9.6, 12.6, 2.4, c[look.skin]),
    bigHead(k, look, 1.42, 26.4),
  ].join('');
}

/** A tooth with a smile, sparkling clean. */
export function tooth(k) {
  const c = k.P;
  const spark = [0, 3.4, 5.6, 3.4][k.frame % 4];
  return [
    k.ground(32, 58.6, 12, 2.2),
    spark ? k.flat(roundPoly(starPoints(50, 12.4, spark, spark * 0.32, 4), 0.3), c.skyShade) : '',
    k.path(
      'M15.6 20.4C15.6 12.4 21.6 8.8 26.8 10.6C29.2 11.6 30.6 13 32 13C33.4 13 34.8 11.6 37.2 10.6C42.4 8.8 48.4 12.4 48.4 20.4C48.4 28.4 45.8 33.2 45.2 38.4C44.6 44.4 44.2 52 40.8 54.6C37.4 57.2 35.6 50.4 34.4 46.2C33.6 43.2 30.4 43.2 29.6 46.2C28.4 50.4 26.6 57.2 23.2 54.6C19.8 52 19.4 44.4 18.8 38.4C18.2 33.2 15.6 28.4 15.6 20.4Z',
      c.white,
    ),
    k.flat('M43.6 15.4C46.6 18.6 46.4 26 44 31.6C42.8 34.6 42.4 39.6 42 44.2C41.6 48.6 41 52.4 40 53.6C43 50.4 43.2 44 43.8 38.4C44.4 33 47.4 27.6 46.8 20.8C46.6 18.6 45.4 16.6 43.6 15.4Z', c.silver),
    k.shine('M20.6 17.6Q21.6 14 25.4 13.6', 2.2),
    k.eye(26.6, 25, 2.3),
    k.eye(37.4, 25, 2.3),
    k.blush(22.6, 30.4, 2.2, 1.4),
    k.blush(41.4, 30.4, 2.2, 1.4),
    k.smile(32, 30.6, 4.6, 1.4),
  ].join('');
}

/**
 * Hair: the back of a head of long ginger hair (just the ears peeking out),
 * falling over the shoulders, a comb going down it.
 */
export function hair(k) {
  const c = k.P;
  const y = k.frame % 2 ? 6 : 0;
  const teeth = [23.6, 26.6, 29.6, 32.6, 35.6].map((t) => `M47.4 ${t + y}H44.4`).join('');
  const comb = k.g(`rotate(-16 51 ${30 + y})`, k.line(teeth, { sw: 1.4 }), k.rect(47.4, 21.4 + y, 6.4, 17, 2, c.purple));
  return [
    k.path('M8 64C8 54.6 17 49 32 49C47 49 56 54.6 56 64Z', c.teal),
    k.circle(18, 24, 3.2, c.skin1),
    k.circle(46, 24, 3.2, c.skin1),
    // a round crown, then the hair falls straight down the back to a wavy end
    k.path('M32 7C41 7 46.6 13.4 46.6 22V44.6Q49.4 50.4 45.4 52.6Q42.4 57 38.6 53.2Q35.4 58 32 53.8Q28.6 58 25.4 53.2Q21.6 57 18.6 52.6Q14.6 50.4 17.4 44.6V22C17.4 13.4 23 7 32 7Z', c.ginger),
    k.flat('M42 10C45 13 46.6 17 46.6 22V44.6Q48.6 48.6 46.4 51.6C44 48 43.6 42 43.4 36V22C43.4 17 43 13 42 10Z', c.gingerShade),
    k.line('M32 7.8V15.6', { color: c.gingerShade, sw: 1.4 }),
    k.line('M27.6 13C24.6 22 23.6 34 23.6 48M36.4 13C39.4 22 40.4 34 40.4 48M32 18.6V50', { color: c.gingerShade, sw: 1.4 }),
    k.shine('M22.4 16.6Q24.6 11.6 29.4 10', 2),
    k.rect(34, 10, 6.4, 3.2, 1.2, c.pink),
    comb,
  ].join('');
}

/** A tummy: Leo with his shirt pulled up, patting it. */
export function tummy(k) {
  const c = k.P;
  const skin = c.skin3;
  const pat = k.frame % 2 ? -k.px : 0;
  const hand = (s) => k.limb(`M${pt([32 + s * 10.6, 28.4])}Q${pt([32 + s * 16.4, 34])} ${pt([32 + s * 11.6, 41 + pat])}`, c.green, 6.6) + k.circle(32 + s * 10.8, 41.6 + pat, 3.2, skin);
  return [
    k.ground(32, 58.6, 14, 2.4),
    k.limb('M27.4 52V56.6', skin, 6.4),
    k.limb('M36.6 52V56.6', skin, 6.4),
    k.ellipse(27, 57.4, 4, 2.4, c.orange),
    k.ellipse(37, 57.4, 4, 2.4, c.orange),
    k.poly([[20.6, 47.4], [43.4, 47.4], [44.2, 54], [19.8, 54]], 2, c.brand),
    // the tummy carries on from the shirt's sides, a little rounder
    k.path('M21.6 31C19 37.4 18.8 45.4 22.6 50C26 53.6 38 53.6 41.4 50C45.2 45.4 45 37.4 42.4 31Z', skin),
    k.flat('M39.4 33C43.2 38 43.4 45.2 40 49.6C41.6 44.4 41.4 38.6 39.4 33Z', c.skin3Shade),
    k.line('M30.6 43.2Q32 45.6 33.4 43.2', { color: c.skin4Shade, sw: 1.4 }),
    k.path('M21.4 30.4C21.4 27.4 23.8 25.6 26.4 25.6H37.6C40.2 25.6 42.6 27.4 42.6 30.4V32.6C38.6 34 25.4 34 21.4 32.6Z', c.green),
    hand(-1),
    hand(1),
    grow(k, 0.86, [32, 13], portrait(k, CAST.leo, 'grin')),
  ].join('');
}

/** A finger, pointing up. */
export function finger(k) {
  const c = k.P;
  const skin = c[SKIN];
  return [
    k.ground(32, 58.6, 11, 2.2),
    k.rect(22.6, 6.6, 7.6, 30, 3.8, skin),
    k.rect(20.4, 27.4, 25, 24, 8, skin),
    k.rect(28.4, 30, 17.4, 6.4, 3.2, skin),
    k.rect(28.4, 36.2, 17, 6.4, 3.2, skin),
    k.rect(28.4, 42.4, 15.6, 6.2, 3.1, skin),
    k.g('rotate(-24 22 44)', k.rect(17, 39.6, 15, 6.6, 3.3, skin)),
    k.shine('M24.6 10.6V17', 2),
    k.rect(21.6, 49.4, 22, 8.6, 2.4, c.blue),
  ].join('');
}

/** A knee: a leg bent at it, with a plaster on. */
export function knee(k) {
  const c = k.P;
  const skin = c[SKIN];
  return [
    k.ground(32, 58.6, 15, 2.2),
    k.limb('M12 23.6L37.4 29.4L31.6 51', skin, 12.4),
    k.ellipse(34.6, 53.6, 8.4, 4, c.red),
    k.flat('M27.4 51.6Q34.4 50.2 41.6 53.2', c.white),
    k.poly([[4, 13], [20.6, 15.4], [18.6, 32.4], [3.4, 31]], [2, 2, 2, 2], c.blue),
    k.g('rotate(-62 37.6 29.6)', k.rect(31, 26.6, 13.2, 6, 2.4, c.tan) + k.flat('M35.4 27.8H39.8V31.4H35.4Z', c.creamShade)),
  ].join('');
}

/** A tongue, stuck out and wiggling. */
export function tongue(k) {
  const c = k.P;
  const turn = k.frame % 2 ? 10 : -6;
  return [
    k.ellipse(32, 24.4, 19.4, 13, c.coral),
    k.ellipse(32, 25.4, 13.2, 7.6, c.mouth),
    k.flat('M20 22.6C24 19.6 40 19.6 44 22.6L43.4 24.6C38.4 22.6 25.6 22.6 20.6 24.6Z', c.white),
    k.g(
      `rotate(${turn} 32 28)`,
      k.path('M21.6 27.4C21.4 43 24.8 54.4 32 54.4C39.2 54.4 42.6 43 42.4 27.4Z', c.tongue),
      k.line('M32 33.4V46.4', { color: c.pinkShade, sw: 1.4 }),
      k.shineDot(26.8, 44.8, 1.6),
    ),
  ].join('');
}

/** A heart, beating. */
export function heart(k) {
  const c = k.P;
  const beat = k.frame % 2 ? 1.1 : 1;
  const d = 'M32 53.6C18 43.6 8 35.4 8 24.4C8 16.4 14 10.6 21.2 10.6C25.8 10.6 29.6 13 32 16.8C34.4 13 38.2 10.6 42.8 10.6C50 10.6 56 16.4 56 24.4C56 35.4 46 43.6 32 53.6Z';
  return grow(
    k,
    beat,
    [32, 32],
    k.path(d, c.red) +
      k.flat('M50.4 17.4C53.6 21.8 53.8 28.8 49.8 34.6C45.4 41 39 45.8 32 51C39.4 44 45.6 38 48.6 32C51 27.2 51.6 21.6 50.4 17.4Z', c.redShade) +
      k.shine('M14.2 22Q15.4 16.6 20.8 15.8', 2.6),
  );
}

/** A bone. */
export function bone(k) {
  const c = k.P;
  const d = 'M18 27.6H46A5.4 5.4 0 1 1 50.6 32A5.4 5.4 0 1 1 46 36.4H18A5.4 5.4 0 1 1 13.4 32A5.4 5.4 0 1 1 18 27.6Z';
  return [
    k.ground(32, 58.6, 16, 2.2),
    k.g(
      'translate(32 31) rotate(-34) scale(1.12) translate(-32 -32)',
      k.path(d, c.cream) + k.flat('M18.6 34.2H45.4V36.4H18.6Z', c.creamShade) + k.shine('M20.4 30H34.6', 1.8),
    ),
  ].join('');
}

/** A strong arm, flexing. */
export function muscle(k) {
  const c = k.P;
  const skin = c[SKIN];
  const flex = k.frame % 2 === 1;
  return [
    k.ground(30, 58.6, 18, 2.2),
    k.limb('M10 46.4H35.4L43.6 21', skin, 13),
    k.ellipse(22.4, flex ? 38 : 39.4, flex ? 10 : 8.8, flex ? 7.8 : 6.4, skin),
    k.circle(44.8, 17.2, 7, skin),
    k.line('M41.4 14.4H46.4M41.4 18.2H46.4', { color: c[`${SKIN}Shade`], sw: 1.4 }),
    k.shine(flex ? 'M17.4 34.4Q21.4 31.4 26.4 32.4' : 'M17.4 35.6Q21.4 33.4 26 34', 2),
    flex ? k.line('M13.4 25.4L16.4 28.6M20.8 22.6L21.6 26.8M28.6 23.4L27.2 27.4', { sw: 1.4 }) : '',
    k.poly([[3.2, 35], [13.4, 35], [14.8, 57.8], [3.2, 57.8]], [2, 2, 2, 2], c.red),
  ].join('');
}

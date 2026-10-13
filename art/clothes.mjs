// Clothes: each one laid flat (or standing, for the shoes), in the same
// soft colors as the cast's clothes, with a shade on the right and a shine
// at the top left. The ring sparkles; everything else keeps still.

import { fmt, pt, roundPoly, starPoints } from './kit.mjs';

/** A four-pointed sparkle of size r (nothing when r is 0). */
const sparkle = (k, x, y, r, color) => (r ? k.flat(roundPoly(starPoints(x, y, r, r * 0.32, 4), 0.3), color) : '');

/** A T-shirt's outline: body, short sleeves and a round neck. */
const TEE = 'M22.6 9.6L13.6 12.6L4.6 22.4L11.4 30.4L17.4 26.4V54.6C17.4 55.6 18.2 56.4 19.2 56.4H44.8C45.8 56.4 46.6 55.6 46.6 54.6V26.4L52.6 30.4L59.4 22.4L50.4 12.6L41.4 9.6C39.6 13.6 36 15.6 32 15.6C28 15.6 24.4 13.6 22.6 9.6Z';

export function shirt(k) {
  const c = k.P;
  return [
    k.path(TEE, c.blue),
    k.flat('M41.6 11.6L46.6 13.4V54.8H42.6C43.6 40 43.4 24 41.6 11.6Z', c.blueShade),
    k.line('M24.4 11.4C26.6 14.6 29 16.4 32 16.4C35 16.4 37.4 14.6 39.6 11.4', { color: c.blueShade, sw: 2 }),
    k.flat(roundPoly(starPoints(32, 34, 7, 3, 5, -90), 0.8), c.yellow),
    k.shine('M21.4 22.6V31.4', 2),
  ].join('');
}

/** A blouse: pink, with a white collar and buttons down the front. */
export function blouse(k) {
  const c = k.P;
  return [
    k.path(TEE, c.pink),
    k.flat('M41.6 11.6L46.6 13.4V54.8H42.6C43.6 40 43.4 24 41.6 11.6Z', c.pinkShade),
    k.path('M22.6 9.6C24.6 14 27.6 16.6 32 16.6L27 22.4C24.4 20.4 22.4 16 22.6 9.6Z', c.white),
    k.path('M41.4 9.6C39.4 14 36.4 16.6 32 16.6L37 22.4C39.6 20.4 41.6 16 41.4 9.6Z', c.white),
    ...[26, 34, 42, 50].map((y) => k.flatCircle(32, y, 1.4, c.white)),
    k.line('M32 17.4V55.6', { color: c.pinkShade, sw: 1.4 }),
  ].join('');
}

/** A puffy winter coat with its hood up behind. */
export function coat(k) {
  const c = k.P;
  return [
    k.path('M20.6 12.6C20.6 6.6 25.6 3.6 32 3.6C38.4 3.6 43.4 6.6 43.4 12.6Z', c.redShade),
    k.path('M20.6 10.6L11.6 14.6L5.6 44.6C5.4 46 6.4 47 7.8 47H13.2L16.6 30.6V57.6C16.6 58.6 17.4 59.4 18.4 59.4H45.6C46.6 59.4 47.4 58.6 47.4 57.6V30.6L50.8 47H56.2C57.6 47 58.6 46 58.4 44.6L52.4 14.6L43.4 10.6C40.6 13.6 36.6 15.2 32 15.2C27.4 15.2 23.4 13.6 20.6 10.6Z', c.red),
    k.line('M17.2 24.6H46.8M17.2 36.6H46.8M17.2 48.6H46.8M8.6 30.4H15M49 30.4H55.4', { color: c.redShade, sw: 1.4 }),
    k.flat('M42.4 12.8L47.2 15V58.6H43.6C44.6 42 44.2 26 42.4 12.8Z', c.redShade),
    k.line('M32 15.4V59', { sw: 1.4 }),
    k.path('M20.6 10.6C23.4 13.6 27.4 15.2 32 15.2C36.6 15.2 40.6 13.6 43.4 10.6L45.6 12C42.6 16.4 37.6 18.6 32 18.6C26.4 18.6 21.4 16.4 18.4 12Z', c.cream),
    k.shine('M21 22V30', 2),
  ].join('');
}

/** A trainer, side on, toe to the right. */
export function shoe(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 24, 2),
    k.path('M8.6 46.6V28.6C8.6 25.6 10.6 23.6 13.6 23.6H23.6C26 23.6 27.6 25 28.6 27L31.6 33.4C33 36 35.6 37.4 38.6 37.6L50.6 38.6C55.6 39 58.6 42.4 58.6 46.6Z', c.white),
    k.path('M6.6 46.6H59.6V50.6C59.6 52.8 57.8 54.6 55.6 54.6H10.6C8.4 54.6 6.6 52.8 6.6 50.6Z', c.silverShade),
    k.flat('M14.6 31.6L22.6 46.6H18L11.6 34.6Z', c.blue),
    k.flat('M20.6 29.6L29.6 46.6H25L17.6 32.6Z', c.blue),
    k.line('M29.6 31.6L34.6 29.4M32.6 35.4L37.6 33.4M36.6 37.6L40.6 36', { sw: 1.4 }),
    k.flat('M9.8 24.8H23V27.4H9.8Z', c.blue),
    k.shine('M12.4 30V38', 1.8),
  ].join('');
}

/** A striped sock. */
export function sock(k) {
  const c = k.P;
  const d = 'M22.6 6.6H40.6V36.6C40.6 38.6 41.6 40 43.4 41L50.6 45C55.6 47.8 56.6 53.6 53.4 57C50.6 60 46 60.4 42.6 58.4L28.6 50.4C24.8 48.2 22.6 44.6 22.6 40.6Z';
  return [
    k.path(d, c.white),
    k.flat('M21 6H42V12.6H21Z', c.red),
    k.flat('M21 18.6H42V22.6H21Z', c.red),
    k.flat('M21 28.6H42V32.6H21Z', c.red),
    k.flat('M42.6 41.6L50.6 45C55.6 47.8 56.6 53.6 53.4 57C51.4 59.2 48.6 60 46 59.6C49.6 55.6 48.6 48.6 42.6 41.6Z', c.red),
    k.flat('M22.6 38.6C22.6 44.6 25.6 48.6 30.6 51.4L33.6 46.6C29.6 45 27.6 42 27.6 38.6Z', c.red),
    k.flat('M37.6 7.8H40.2V36H37.6Z', c.silver),
  ].join('');
}

/** A straw sun hat with a ribbon. */
export function hat(k) {
  const c = k.P;
  return [
    k.ground(32, 56, 25, 2.2),
    k.ellipse(32, 41.6, 27, 9.4, c.tan),
    k.flatEllipse(32, 44.4, 23, 5.4, c.tanShade),
    k.path('M16.6 40.6C16.6 26.6 22.6 17.6 32 17.6C41.4 17.6 47.4 26.6 47.4 40.6C42.6 43 21.4 43 16.6 40.6Z', c.tan),
    k.flat('M16.8 34.6C24 37 40 37 47.2 34.6L47.4 40.4C42.6 42.8 21.4 42.8 16.6 40.4Z', c.pink),
    k.path('M41.6 37.4C45.6 33.6 51.6 33.4 52.4 36.6C52.8 38.6 50.2 40 47 39.6C50 41 51.6 44 49.6 45.6C47.4 47.4 43.6 43.4 41.6 37.4Z', c.pink),
    k.flat('M40.8 22.4C44.4 26 46.6 30.6 47 34.6L43.6 35C43.4 30.6 42.4 26.4 40.8 22.4Z', c.tanShade),
    k.shine('M21.4 31.6Q22.6 25.4 26.6 21.6', 2),
  ].join('');
}

/** A dress with a flared skirt. */
export function dress(k) {
  const c = k.P;
  return [
    k.path('M24.6 6.6H28.6V14.6H35.4V6.6H39.4V17.6C42.6 19.4 44.4 23 43.6 27.4L42.6 31.6L53.6 53.6C54.6 55.6 53.4 57.6 51.2 57.6H12.8C10.6 57.6 9.4 55.6 10.4 53.6L21.4 31.6L20.4 27.4C19.6 23 21.4 19.4 24.6 17.6Z', c.purple),
    k.flat('M20.6 29.4H43.4V33.4H20.6Z', c.white),
    k.flat('M38.6 33.6L52.6 53.6C53.6 55.2 52.8 56.4 51 56.4H45.6C45.4 48 42.6 40 38.6 33.6Z', c.purpleShade),
    ...[16, 24, 32, 40, 48].map((x) => k.flatCircle(x, 53.2, 1.4, c.white)),
    k.shine('M25.6 20.6V26', 1.8),
  ].join('');
}

/** A pair of knitted mittens on a string. */
export function glove(k) {
  const c = k.P;
  const mitten = (x, turn) =>
    k.g(
      `rotate(${turn} ${x} 40)`,
      k.path(`M${pt([x - 8.6, 50])}V${fmt(26.6)}C${pt([x - 8.6, 20])} ${pt([x - 4.6, 16.6])} ${pt([x, 16.6])}C${pt([x + 4.6, 16.6])} ${pt([x + 8.6, 20])} ${pt([x + 8.6, 26.6])}V${fmt(50)}Z`, c.red) +
        k.path(`M${pt([x + 8, 31.6])}C${pt([x + 13.6, 30])} ${pt([x + 15, 36])} ${pt([x + 11.4, 40.6])}L${pt([x + 8.4, 43.6])}Z`, c.red) +
        k.flat(`M${pt([x - 8.6, 33.6])}L${pt([x - 5.6, 36.6])}L${pt([x - 2.6, 33.6])}L${pt([x + 0.4, 36.6])}L${pt([x + 3.4, 33.6])}L${pt([x + 6.4, 36.6])}L${pt([x + 8.6, 34.4])}V${fmt(37.6)}L${pt([x + 6.4, 39.8])}L${pt([x + 3.4, 36.8])}L${pt([x + 0.4, 39.8])}L${pt([x - 2.6, 36.8])}L${pt([x - 5.6, 39.8])}L${pt([x - 8.6, 36.8])}Z`, c.white) +
        k.rect(x - 9.6, 48.6, 19.2, 7, 2, c.cream),
    );
  return [
    k.line('M18 49.6C20 60 44 60 46 49.6', { color: c.redShade, sw: 1.6 }),
    mitten(19.6, -10),
    mitten(44.4, 10),
  ].join('');
}

/** A striped scarf. */
export function scarf(k) {
  const c = k.P;
  return [
    k.path('M14.6 20.6C14.6 12.6 22.6 8.6 32 8.6C41.4 8.6 49.4 12.6 49.4 20.6C49.4 26.6 42.6 30.6 32 30.6C21.4 30.6 14.6 26.6 14.6 20.6ZM22.6 19.6C22.6 22.6 26.6 23.6 32 23.6C37.4 23.6 41.4 22.6 41.4 19.6C41.4 16.6 37.4 15.6 32 15.6C26.6 15.6 22.6 16.6 22.6 19.6Z', c.green),
    k.path('M33.6 26.6H44.6L47.6 52.6H36.6Z', c.green),
    k.path('M22.6 25.6H33.6L29.6 50.6H18.6Z', c.green),
    k.flat('M20.8 33.6H32.4L31.8 37.6H20.2Z', c.white),
    k.flat('M19.8 41.6H31.2L30.6 45.6H19.2Z', c.white),
    k.flat('M35 34.6H45.6L46 38.6H35.4Z', c.white),
    k.flat('M35.8 42.6H46.6L47 46.6H36.2Z', c.white),
    k.line('M20 51.4V56.6M23.4 51.4V56.6M26.8 51.4V56.6M38 53.4V58.6M41.4 53.4V58.6M44.8 53.4V58.6', { color: c.greenShade, sw: 1.6 }),
  ].join('');
}

/** A cap with its peak to the right. */
export function cap(k) {
  const c = k.P;
  return [
    k.ground(32, 52.6, 23, 2),
    k.path('M36.6 40.6C44.6 38.6 54.6 39 59.6 42.6C60.6 44.6 59 46.6 56.6 46.6H36.6Z', c.blueShade),
    k.path('M8.6 44.6C8.6 28.6 18.6 18.6 31.6 18.6C44.6 18.6 50.6 28.6 50.6 42.6C42.6 46 18.6 47 8.6 44.6Z', c.blue),
    k.line('M30.6 19.6C27.6 26 26.6 36 27.6 45.4M30.6 19.6C36 25 39 34 39.6 44.8', { color: c.blueShade, sw: 1.4 }),
    k.circle(31, 18.4, 2.6, c.blueShade),
    k.flat('M44.6 26.6C48.4 31 50 37 49.6 42.6L45.6 43.6C46.4 37.4 46 31.6 44.6 26.6Z', c.blueShade),
    k.shine('M15.6 36.6Q17.6 28.6 23.6 24.6', 2),
  ].join('');
}

/** A rubber boot. */
export function boot(k) {
  const c = k.P;
  return [
    k.ground(34, 58.6, 21, 2),
    k.path('M16.6 6.6H38.6V40.6C38.6 42.6 40 44 42 44.4L50.6 46C55.6 47 57.6 50.6 57.6 54.6V56.6H16.6Z', c.yellow),
    k.path('M14.6 6.6C14.6 4.6 16.2 3.6 18 3.6H37.4C39.2 3.6 40.6 4.6 40.6 6.6V10.6H14.6Z', c.yellowShade),
    k.path('M15.6 52.6H58.6V56.6C58.6 58 57.6 59 56.2 59H18C16.6 59 15.6 58 15.6 56.6Z', c.charcoal),
    k.flat('M33.6 11.6H37.6V40.6C37.6 42 38 43 39 43.6L34 43C33.6 32 33.6 22 33.6 11.6Z', c.yellowShade),
    k.shine('M20.6 14.6V30.6', 2.2),
  ].join('');
}

/** A gold ring with a gem, sparkling. */
export function ring(k) {
  const c = k.P;
  const f = k.frame % 4;
  return [
    k.ground(32, 58.6, 15, 2),
    k.path('M32 22.6C43.6 22.6 50.6 30.6 50.6 39.6C50.6 48.6 42.6 55.6 32 55.6C21.4 55.6 13.4 48.6 13.4 39.6C13.4 30.6 20.4 22.6 32 22.6ZM32 28.6C24.6 28.6 19.6 33.6 19.6 39.6C19.6 45.6 24.6 49.6 32 49.6C39.4 49.6 44.4 45.6 44.4 39.6C44.4 33.6 39.4 28.6 32 28.6Z', c.yellow),
    k.flat('M44.6 30C48.6 34 49.6 40 47.6 45C45.6 50 40.6 53.4 34.6 54.4C41 51 44.6 46 45.4 40.4C45.8 36.6 45.6 33 44.6 30Z', c.yellowShade),
    k.poly([[24.6, 21.6], [27.6, 14.6], [36.4, 14.6], [39.4, 21.6], [32, 29.6]], [1, 1, 1, 1, 1], c.sky),
    k.flat('M27.6 15.6H31L29.4 21.4H25.8Z', c.white),
    k.line('M25 21.4H39', { color: c.skyShade, sw: 1.4 }),
    sparkle(k, 46.6, 12, [0, 3.2, 5, 3.2][f], c.amber),
    sparkle(k, 16, 18, [4, 2.4, 0, 2.4][f], c.amber),
  ].join('');
}

/** A tie under a shirt collar. */
export function tie(k) {
  const c = k.P;
  return [
    k.path('M27.6 16.6H36.4L38.6 21.6L35.6 24.6H28.4L25.4 21.6Z', c.red),
    k.path('M28.4 24.6H35.6L39.6 48.6L32 57.6L24.4 48.6Z', c.red),
    k.flat('M27 30.6L37 26.6L37.6 30.6L26.6 34.6Z', c.redShade),
    k.flat('M25.8 40.6L38.6 35.6L39.2 39.6L25.6 44.6Z', c.redShade),
    k.path('M14.6 8.6L27.6 16.6L23.6 26.6L12.6 14.6Z', c.white),
    k.path('M49.4 8.6L36.4 16.6L40.4 26.6L51.4 14.6Z', c.white),
    k.line('M14.6 8.6H49.4', { color: c.silverShade, sw: 1.4 }),
  ].join('');
}

/** A reflective vest, the kind children wear on walks. */
export function vest(k) {
  const c = k.P;
  return [
    k.path('M20.6 6.6H27.6C27.6 14.6 29.6 22.6 32 26.6C34.4 22.6 36.4 14.6 36.4 6.6H43.4L48.6 14.6V53.6C48.6 55.6 47 57.2 45 57.2H19C17 57.2 15.4 55.6 15.4 53.6V14.6Z', c.lime),
    k.line('M32 26.6V57', { sw: 1.4 }),
    k.flat('M15.6 36.6H48.4V40.6H15.6Z', c.silver),
    k.flat('M15.6 46.6H48.4V50.6H15.6Z', c.silver),
    k.flat('M43.6 15.6L47.4 15.6V55.8H44.6C45.4 42 45 28 43.6 15.6Z', c.limeShade),
    k.shine('M19.4 18.6V30.6', 2),
  ].join('');
}

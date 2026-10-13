// Food words: each one a single thing with an outline, a flat shade on its
// right (away from the light) and a shine at its top left. The hot things
// steam; everything else keeps still.

import { fmt, polar, pt, roundPoly, starPoints } from './kit.mjs';

/** A shape squashed (or stretched) vertically about a line y. */
const squash = (k, sy, y, inner) => k.g(`translate(0 ${y}) scale(1 ${sy}) translate(0 ${-y})`, inner);

/** Steam: soft wavy lines rising off something hot, shifting with each frame. */
function steam(k, xs, base) {
  const c = k.P;
  return xs
    .map((x, i) => {
      const f = (k.frame + i) % 3;
      const d = f === 1 ? -1 : 1;
      const y0 = base - [0, 1.4, 2.8][f];
      const h = i === 1 ? 17 : 13;
      const wave = `M${pt([x, y0])}C${pt([x + 3.2 * d, y0 - h * 0.2])} ${pt([x + 3.2 * d, y0 - h * 0.4])} ${pt([x, y0 - h * 0.5])}C${pt([x - 3.2 * d, y0 - h * 0.6])} ${pt([x - 3.2 * d, y0 - h * 0.8])} ${pt([x, y0 - h])}`;
      return k.line(wave, { color: c.grey, sw: 2.2 });
    })
    .join('');
}

/** A bowl (its foot, body and a shine) with something in it, seen from a little above. */
function bowl(k, color, shade, inside, top = 31.6) {
  const c = k.P;
  return [
    k.rect(24, top + 21, 16, 3.6, 1.4, c[shade]),
    k.path(`M7 ${fmt(top)}H57C57 ${fmt(top + 13)} 46.6 ${fmt(top + 23)} 32 ${fmt(top + 23)}C17.4 ${fmt(top + 23)} 7 ${fmt(top + 13)} 7 ${fmt(top)}Z`, c[color]),
    k.flat(`M48.6 ${fmt(top + 2)}C51.6 ${fmt(top + 2)} 54.6 ${fmt(top + 2)} 55.4 ${fmt(top + 2)}C54.4 ${fmt(top + 12)} 47.6 ${fmt(top + 20)} 38 ${fmt(top + 22)}C45.6 ${fmt(top + 17)} 49.4 ${fmt(top + 10)} 48.6 ${fmt(top + 2)}Z`, c[shade]),
    k.shine(`M12.6 ${fmt(top + 5.4)}Q15 ${fmt(top + 13)} 21.4 ${fmt(top + 17.4)}`, 2.2),
    inside,
  ].join('');
}

export function apple(k) {
  const c = k.P;
  return [
    k.ground(32, 58.4, 15, 2.4),
    k.path('M30.6 22.6C30.4 17.6 31.4 13.2 33.8 10L37.6 12.2C35.8 14.8 35.4 18.2 35.6 22.6Z', c.brown),
    k.path('M32 21.6C26 15.6 11.6 16.6 11.6 32.6C11.6 45.6 20.6 56.2 27.6 55.2C29.8 54.8 30.8 54.2 32 54.2C33.2 54.2 34.2 54.8 36.4 55.2C43.4 56.2 52.4 45.6 52.4 32.6C52.4 16.6 38 15.6 32 21.6Z', c.red),
    k.flat('M47.4 22.8C51.8 28.4 51.6 41.4 43.6 50.4C40.8 53.4 38.2 54 36.6 53.8C42.6 47.6 46.8 37.4 45 24.8C45.8 24.2 46.6 23.6 47.4 22.8Z', c.redShade),
    k.shine('M17.8 31.2C18 27 20.6 23.6 24.6 22.6'),
    k.shineDot(17.8, 35.6, 1.3),
    k.path('M35.2 15.4C38.2 9.4 45.2 7.4 51 9.2C48.6 15.4 41.4 18.4 35.2 15.4Z', c.green),
    k.line('M37.4 14.2Q43 12.4 47.6 10.4', { color: c.greenShade, sw: 1.5 }),
  ].join('');
}

/** A slice of bread: a golden crust round a soft middle. */
export function bread(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 17, 2.2),
    k.path('M15.6 27.4C10.6 26.4 8.6 20.4 11.6 15.6C15 10.2 23 8.6 32 8.6C41 8.6 49 10.2 52.4 15.6C55.4 20.4 53.4 26.4 48.4 27.4V50.6C48.4 53.6 46.4 55.6 43.4 55.6H20.6C17.6 55.6 15.6 53.6 15.6 50.6Z', c.wood),
    k.flat('M19.4 29.4C15.2 28.2 13.8 23.6 16 19.8C18.8 15 24.8 12.4 32 12.4C39.2 12.4 45.2 15 48 19.8C50.2 23.6 48.8 28.2 44.6 29.4V49.8C44.6 51 43.8 51.8 42.6 51.8H21.4C20.2 51.8 19.4 51 19.4 49.8Z', c.tan),
    k.flat('M40.6 31.6H44.6V49.8C44.6 51 43.8 51.8 42.6 51.8H38.6C40.4 45.4 41 38.6 40.6 31.6Z', c.tanShade),
    ...[[25.4, 23], [35.4, 20.6], [29.6, 33.4], [38.4, 38.4], [25, 44.6]].map(([x, y]) => k.flatEllipse(x, y, 1.4, 1, c.tanShade)),
    k.shine('M16.4 20.6Q19.6 14.6 26.4 12.8', 1.6),
  ].join('');
}

/** A glass of milk. */
export function milk(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 13, 2.2),
    k.path('M16.6 10.6H47.4L43.8 53.4C43.6 55 42.4 56 40.8 56H23.2C21.6 56 20.4 55 20.2 53.4Z', c.sky),
    k.flat('M17.4 20.4H46.6L43 53C42.8 54 42.2 54.6 41.2 54.6H22.8C21.8 54.6 21.2 54 21 53Z', c.white),
    k.flat('M39.8 22H46.4L43 53C42.8 54 42.2 54.6 41.2 54.6H38.6C40.6 44 41 32 39.8 22Z', c.silver),
    k.line('M17.4 20.4H46.6', { color: c.silverShade, sw: 1.4 }),
    k.shine('M20.6 12.8V17.6', 2),
  ].join('');
}

/** A drop of water. */
export function water(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 13, 2.2),
    k.path('M32 7C34.4 12 50.4 28.6 50.4 39.4C50.4 49.6 42.2 56.6 32 56.6C21.8 56.6 13.6 49.6 13.6 39.4C13.6 28.6 29.6 12 32 7Z', c.sky),
    k.flat('M44.6 30C48.6 36 49.6 42.6 46.6 48.4C43.6 53.6 37.6 55.6 32.6 55.4C40.6 51 45.6 41.6 44.6 30Z', c.skyShade),
    k.shine('M19.6 41.4Q19.4 35.6 23.6 30', 2.6),
    k.shineDot(21.4, 46.4, 1.4),
  ].join('');
}

export function banana(k) {
  const c = k.P;
  return [
    k.ground(34, 58.6, 18, 2.2),
    k.poly([[15.6, 18.6], [16, 10.4], [20.6, 10.4], [21.8, 18.8]], 1, c.brown),
    k.path('M13.6 16.6C11.4 35.8 25.6 53.4 47.6 53C51.6 53 54.8 51.6 56 49.4C54 47.4 50.2 46.6 46.4 45.8C35.2 43.4 25.6 34.6 23.6 16.8Z', c.yellow),
    k.flat('M23.6 18.6C26.4 33 35.6 42.8 46.4 45.8C50.2 46.6 54 47.4 56 49.4C53.4 48.4 49.6 48.6 45.6 48.4C31.6 47.4 23.6 35.6 23.6 18.6Z', c.yellowShade),
    k.flatEllipse(54.4, 49.4, 2.4, 1.8, c.brown),
    k.shine('M18.6 27.4Q19.6 34.6 23.8 39.4', 2),
  ].join('');
}

/** A wedge of cheese with holes. */
export function cheese(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 22, 2.2),
    k.poly([[7.6, 31.6], [45.6, 15.4], [56.4, 26.8]], [2, 2, 2], c.yellow),
    k.flatEllipse(41.4, 22.4, 2.6, 1.5, c.yellowShade),
    k.poly([[7.6, 31.6], [56.4, 26.8], [56.4, 47], [7.6, 50.6]], [2, 2, 2, 2], c.yellow),
    k.flat('M49.4 28.4L55.2 27.8V46L49.4 46.4Z', c.yellowShade),
    k.flatEllipse(19.6, 40.4, 3.4, 2.8, c.yellowShade),
    k.flatEllipse(33.6, 36.6, 2.4, 2.2, c.yellowShade),
    k.flatEllipse(42.6, 41.6, 3, 2.6, c.yellowShade),
    k.flatEllipse(28, 46.2, 1.8, 1.4, c.yellowShade),
  ].join('');
}

/** A slice of strawberry cake. */
export function cake(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 21, 2.2),
    k.poly([[8.6, 30], [55.4, 25.6], [55.4, 52], [8.6, 55]], 1.6, c.tan),
    k.flat('M8 39.6L56 35.6V40L8 44Z', c.white),
    k.flat('M8 44L56 40V42.4L8 46.4Z', c.pink),
    k.flat('M49.6 26.2L55 25.6V51.6L49.6 52Z', c.tanShade),
    k.flat('M8.6 30L55.4 25.6V29.4C51.4 29.6 50.2 32.4 46.8 31.6C43.2 30.8 41.8 33.2 38.2 32.4C34.6 31.6 32.2 34.8 28.8 33.8C25.6 32.8 22.8 35.6 19.6 34.4C16.6 33.4 12.8 35.2 8.6 33.6Z', c.white),
    k.poly([[8.6, 30], [40.6, 14.6], [55.4, 25.6]], [1.6, 2, 1.6], c.white),
    k.circle(38.6, 15.4, 5, c.red),
    k.flat(roundPoly(starPoints(38.6, 11.2, 4, 1.6, 5, -90), 0.4), c.green),
    k.shineDot(36.6, 14.4, 1.2),
  ].join('');
}

/** A chocolate-chip cookie with a bite out of it. */
export function cookie(k) {
  const c = k.P;
  const R = 22;
  const p1 = polar(32, 32, R, -75);
  const p2 = polar(32, 32, R, -18);
  const mid = polar(32, 32, R - 6.4, -46.5);
  const d = `M${pt(p2)}A${R} ${R} 0 1 1 ${pt(p1)}A7 7 0 0 0 ${pt(mid)}A7 7 0 0 0 ${pt(p2)}Z`;
  return [
    k.ground(32, 58.6, 17, 2.2),
    k.path(d, c.wood),
    k.flat('M48.6 40C45.6 47.6 38.4 52.4 30.4 52.6C22.4 52.8 15.4 48.4 12.4 41.4C17.6 46.6 24.6 49.4 31.6 49C39 48.6 45 45 48.6 40Z', c.woodShade),
    ...[[22, 22.6], [31.6, 26.6], [19.6, 35.4], [28.6, 40.6], [40.6, 36.6], [37, 46], [44.6, 27.6]].map(([x, y]) => k.flatEllipse(x, y, 2.2, 1.8, c.brownShade)),
    k.shine('M14.4 27.4Q16.6 19.6 23.4 15.2', 1.6),
  ].join('');
}

/** A juice box with a straw. */
export function juice(k) {
  const c = k.P;
  return [
    k.ground(34, 58.6, 15, 2.2),
    k.limb('M38.4 15.6V7.4L44.6 4.4', c.red, 4),
    k.poly([[44.6, 17.6], [50.6, 13.6], [50.6, 50.6], [44.6, 55.6]], 1, c.orangeShade),
    k.poly([[19.6, 17.6], [25.6, 13.6], [50.6, 13.6], [44.6, 17.6]], 1, c.orange),
    k.rect(19.6, 17.6, 25, 38, 1.6, c.orange),
    k.circle(32.1, 37.6, 8.4, c.white),
    k.flatCircle(32.1, 38.6, 4.8, c.amber),
    k.flatEllipse(34, 33, 2.2, 1.2, c.green),
    k.shine('M22.6 21.6V29.4', 2),
  ].join('');
}

/** A strawberry ice cream in a cone. */
export function iceCream(k) {
  const c = k.P;
  const tier = (cy, rx, ry) => k.ellipse(32, cy, rx, ry, c.pink) + k.flatEllipse(32 + rx * 0.62, cy + ry * 0.2, rx * 0.34, ry * 0.6, c.pinkShade);
  return [
    k.ground(32, 58.8, 8, 1.8),
    k.path('M19.6 34.6H44.4L33.8 57C33 58.6 31 58.6 30.2 57Z', c.wood),
    k.flat('M23.4 36.2L25.4 36.2L35.2 52.4L34.2 54.6Z', c.woodShade),
    k.flat('M31.6 36.2L33.6 36.2L38.6 44.6L37.6 46.8Z', c.woodShade),
    k.flat('M40.6 36.2L38.6 36.2L29.8 52.2L30.8 54.4Z', c.woodShade),
    k.flat('M32.4 36.2L30.4 36.2L25.6 44.4L26.6 46.6Z', c.woodShade),
    k.path('M27.6 18.6C27.6 12.6 33 9.2 37 10.2C34.6 12.4 34.6 15.6 36.8 18.6Z', c.pink),
    tier(33.4, 15.4, 5.6),
    tier(26.6, 12.4, 5),
    tier(20.4, 9, 4.4),
    k.shineDot(25.4, 25, 1.3),
    k.shineDot(21.6, 31.8, 1.3),
  ].join('');
}

/** A bar of chocolate, half out of its wrapper. */
export function chocolate(k) {
  const c = k.P;
  return [
    k.ground(32, 59, 15, 2),
    k.rect(17, 7.4, 30, 40, 2.4, c.brown),
    k.line('M17 19.4H47M32 7.4V31', { color: c.brownShade, sw: 1.4 }),
    k.flat('M42.6 8.6H45.8V30.6H42.6Z', c.brownShade),
    k.shine('M20.6 10.6V16', 1.8),
    k.path('M15.6 32.4L20 30.4L24.4 32.6L28.6 30.4L32.8 32.6L37 30.4L41.2 32.6L45.4 30.4L48.4 32V55.6C48.4 57 47.4 58 46 58H18C16.6 58 15.6 57 15.6 55.6Z', c.red),
    k.flat('M15.6 41.6H48.4V47.4H15.6Z', c.white),
    k.flat('M43.6 33H48V57H43.6Z', c.redShade),
  ].join('');
}

export function potato(k) {
  const c = k.P;
  return [
    k.ground(33, 58.6, 19, 2.4),
    k.path('M10.6 37.6C9.4 28.4 16.2 20.4 26.6 19.4C34.6 18.6 39.4 21.6 46 21.6C53.4 21.6 57 27.6 55.4 35.2C53.6 44 45.6 50.8 34.4 51.4C20.8 52.2 11.8 46.4 10.6 37.6Z', c.wood),
    k.flat('M53.4 34C52 42.4 44.6 48.6 34.4 49.2C24.6 49.8 17.4 46.6 14 41.2C18.6 44.6 25.4 46.4 33.6 46C43.6 45.6 50.6 41 53.4 34Z', c.woodShade),
    ...[[21.6, 30.6], [38.6, 27.6], [32.6, 39.6], [47.4, 34]].map(([x, y]) => k.flatEllipse(x, y, 1.6, 1.1, c.woodShade)),
    k.shine('M15.4 32.4Q17.6 26 24 23.6', 2),
  ].join('');
}

export function strawberry(k) {
  const c = k.P;
  const seeds = [[22, 28], [30, 26], [38, 27.4], [45, 30], [18.6, 35.6], [26.4, 34.6], [34.4, 34], [42, 36.6], [24, 42], [31.6, 41.6], [38.6, 43.4], [29.6, 48.6], [35.4, 49.6]];
  return [
    k.ground(32, 58.6, 13, 2.2),
    k.path('M32 56.6C22.4 51.6 12.6 40.6 12.6 29.6C12.6 21.6 18.4 17.4 24.6 18C27.6 18.4 30.2 19.4 32 20.6C33.8 19.4 36.4 18.4 39.4 18C45.6 17.4 51.4 21.6 51.4 29.6C51.4 40.6 41.6 51.6 32 56.6Z', c.red),
    k.flat('M46.6 20.6C50.4 24.4 50.6 32.4 46.8 39.6C43.4 46.2 37.6 51.6 32.6 55C38 49.6 42.6 43.4 45 37C47.4 30.6 48 25 46.6 20.6Z', c.redShade),
    ...seeds.map(([x, y]) => k.flatEllipse(x, y, 0.8, 1, c.yellow)),
    squash(k, 0.6, 20, k.poly(starPoints(32, 20, 11, 4, 5, -90), 1, c.green)),
    k.limb('M32 18.4Q32.4 13 35.6 10.4', c.greenShade, 3.8),
    k.shine('M17.4 30.6Q18 26.4 21 24', 1.6),
  ].join('');
}

export function carrot(k) {
  const c = k.P;
  const leaf = (turn, x, y, rx, ry, color) => k.g(`rotate(${turn} 45.6 17)`, k.ellipse(x, y, rx, ry, c[color]));
  return [
    k.ground(30, 58.6, 15, 2.2),
    leaf(-28, 45.6, 9.4, 3.4, 7.6, 'green'),
    leaf(22, 47.6, 9, 3.2, 7.4, 'green'),
    leaf(62, 51, 12.6, 3.2, 6.8, 'greenShade'),
    k.path('M38.4 16.6C43.8 13 51 18.4 48.6 24.4C47.6 27 44 31 38.6 36.6C32 43.4 24.4 50.8 17.8 55.8C15.6 57.4 13.6 55.6 15 53.4C19.6 46.4 26.2 37.2 31.6 29.2C34.4 25 35.8 18.4 38.4 16.6Z', c.orange),
    k.flat('M48.4 23.6C47 26.8 43.4 31 38.6 36C32.2 42.6 25 49.8 18.6 54.6C24.6 48.6 31 41.6 37 35C41.6 30 45.6 26.6 48.4 23.6Z', c.orangeShade),
    k.line('M33.6 31.2L37.2 33.2M27.6 40.2L31 42.2M22.4 47.8L25.4 49.4', { color: c.orangeShade, sw: 1.4 }),
    k.shine('M34.4 23.6Q36 19.6 39.4 18.4', 1.6),
  ].join('');
}

export function egg(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 14, 2.2),
    k.path('M32 7.6C42 7.6 50.4 23.6 50.4 37.6C50.4 48.6 42.6 56.4 32 56.4C21.4 56.4 13.6 48.6 13.6 37.6C13.6 23.6 22 7.6 32 7.6Z', c.cream),
    k.flat('M44 18.6C47.6 24 49.2 31.6 49 38C48.8 47.4 42 54.8 32.6 55.2C40.6 51.6 45.4 44 45.8 35.6C46.2 29 45.6 23.4 44 18.6Z', c.creamShade),
    k.shine('M21.4 31.4Q22.6 22.6 27.4 16.6', 2.4),
  ].join('');
}

/** A bowl of rice. */
export function rice(k) {
  const c = k.P;
  const grains = [[20, 26.4, -30], [27.6, 21.4, 10], [36.6, 21, -20], [44, 26.6, 30], [31.6, 27.8, 0], [24, 30.6, 20], [39.4, 30.4, -10], [15.6, 31, 40], [48.6, 31.4, -40]];
  return [
    k.ground(32, 58.6, 18, 2.2),
    k.path('M9.6 33C9.6 21.4 19.6 14.6 32 14.6C44.4 14.6 54.4 21.4 54.4 33Z', c.white),
    ...grains.map(([x, y, a]) => k.g(`rotate(${a} ${x} ${y})`, k.flatEllipse(x, y, 1.8, 0.9, c.silverShade))),
    bowl(k, 'blue', 'blueShade', [[16, 42.6], [24, 46], [32, 47.4], [40, 46], [48, 42.6]].map(([x, y]) => k.flatCircle(x, y, 1.2, c.white)).join('')),
  ].join('');
}

/** A bowl of tomato soup, steaming. */
export function soup(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 18, 2.2),
    steam(k, [22, 32, 42], 25.6),
    k.limb('M40.4 30.4L50.6 10.6', c.silver, 4.6),
    bowl(
      k,
      'red',
      'redShade',
      k.ellipse(32, 31.6, 24.4, 5.2, c.orange) +
        k.flatEllipse(23.4, 31.6, 2.2, 1.2, c.green) +
        k.flatEllipse(31.4, 33, 2, 1.1, c.cream) +
        k.flatEllipse(38.4, 30.6, 2.2, 1.2, c.green) +
        k.limb('M40.4 30.4L42.6 26.2', c.silver, 4.6),
    ),
  ].join('');
}

/** A grilled sausage with mustard. */
export function sausage(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 21, 2.2),
    k.limb('M11.6 42.6Q32 22.6 52.4 42.6', c.ginger, 14),
    k.flat('M10.6 46.6Q32 27.4 53.4 46.6L52 49.4Q32 32 12 49.4Z', c.gingerShade),
    k.line('M23 31.6L26.4 38.2M31 28.8L33.6 35.6M39 30L41.2 36.6', { color: c.gingerShade, sw: 2 }),
    k.line('M15.6 37.2Q18.6 33.6 21 36Q23.6 31.4 26.6 33.6Q29.6 29.6 32.6 32.4Q35.6 29.4 38.6 33Q41.6 30.4 44.4 34.4Q47 32.6 48.8 35.8', { color: c.yellow, sw: 2.2 }),
  ].join('');
}

export function tomato(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 17, 2.4),
    k.path('M32 19.6C22 15.6 9.6 20.6 9.6 34.6C9.6 46.6 20 54.6 32 54.6C44 54.6 54.4 46.6 54.4 34.6C54.4 20.6 42 15.6 32 19.6Z', c.red),
    k.flat('M47.6 21.6C52.4 25.6 53.6 33 51.6 39.6C49 47.8 41.6 53 33 53.6C42.4 49 47.6 41.6 48.6 34C49.2 29.4 48.8 25 47.6 21.6Z', c.redShade),
    k.shine('M16.6 31Q18 25.4 23 23.4', 2.4),
    squash(k, 0.62, 20.6, k.poly(starPoints(32, 20.6, 11, 4, 5, -90), 1, c.green)),
    k.limb('M32 20Q32 14.6 35.4 12.6', c.greenShade, 3.8),
  ].join('');
}

/** A wrapped sweet. */
export function candy(k) {
  const c = k.P;
  const end = (s) => k.path(`M${pt([32 + s * 10, 32])}L${pt([32 + s * 22.6, 22.4])}C${pt([32 + s * 24.6, 21])} ${pt([32 + s * 26.2, 22.6])} ${pt([32 + s * 25.4, 24.6])}L${pt([32 + s * 23.4, 32])}L${pt([32 + s * 25.4, 39.4])}C${pt([32 + s * 26.2, 41.4])} ${pt([32 + s * 24.6, 43])} ${pt([32 + s * 22.6, 41.6])}Z`, c.purple);
  return [
    k.ground(32, 58.6, 18, 2.2),
    end(-1),
    end(1),
    k.circle(32, 32, 12.6, c.pink),
    k.flat('M22.6 24.4L26.6 21.4L41 37.6L37.6 41.6Z', c.white),
    k.flat('M19.6 31.6L21 28L34.6 43.4L30.2 44.4Z', c.white),
    k.flat('M30.4 19.6L34.6 19.8L44.4 30.6L44 34.6Z', c.white),
    k.flat('M41.4 26C44.6 31.4 43.6 38.6 38.6 42.4C41 37.6 42 31.6 41.4 26Z', c.pinkShade),
  ].join('');
}

/** A bowl of porridge with a melting butter eye and blueberries, steaming. */
export function porridge(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 18, 2.2),
    steam(k, [22, 32, 42], 25.6),
    k.limb('M41 30.4L51.4 11.4', c.silver, 4.6),
    bowl(
      k,
      'wood',
      'woodShade',
      k.ellipse(32, 31.6, 24.4, 5.2, c.tan) +
        k.flatEllipse(32, 31.6, 3.6, 1.6, c.yellow) +
        k.flatCircle(21.6, 31.4, 1.4, c.navy) +
        k.flatCircle(25, 33, 1.4, c.navy) +
        k.flatCircle(39.6, 33, 1.4, c.navy) +
        k.limb('M41 30.4L43.2 26.4', c.silver, 4.6),
    ),
  ].join('');
}

/** A block of butter on a plate. */
export function butter(k) {
  const c = k.P;
  return [
    k.ellipse(32, 47.6, 25, 7.6, c.white),
    k.flatEllipse(32, 47.4, 19, 5, c.silver),
    k.poly([[42.6, 34], [50.6, 28], [50.6, 42.6], [42.6, 48.6]], 1.6, c.yellowShade),
    k.poly([[13.4, 34], [21.4, 28], [50.6, 28], [42.6, 34]], 1.6, c.yellow),
    k.poly([[13.4, 34], [42.6, 34], [42.6, 48.6], [13.4, 48.6]], 1.6, c.yellow),
    k.shine('M17.4 37.4V43.4', 1.8),
  ].join('');
}

/** A slice of pizza. */
export function pizza(k) {
  const c = k.P;
  return [
    k.ground(32, 58.8, 9, 1.8),
    k.path('M10 16.6C24 10.6 40 10.6 54 16.6L33.6 56.6C32.8 58 31.2 58 30.4 56.6Z', c.yellow),
    k.flat('M47.6 17C49.6 17.4 51.4 18 53 18.6L33.4 56C38 45 43.4 30.6 47.6 17Z', c.yellowShade),
    k.limb('M10.6 16.4Q32 8 53.4 16.4', c.wood, 7.6),
    k.circle(25, 25.6, 4.4, c.red),
    k.circle(38.4, 25, 4, c.red),
    k.circle(31.4, 38.6, 3.8, c.red),
    k.flatEllipse(31.4, 22, 1.6, 1, c.green),
    k.flatEllipse(38.6, 33.6, 1.6, 1, c.green),
    k.flatEllipse(24.4, 33, 1.4, 0.9, c.green),
  ].join('');
}

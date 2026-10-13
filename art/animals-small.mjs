// Small animals: the birds, the fish, the snake and two insects. Side on and
// facing right where they have a front; each one flaps, swims, pecks, flicks
// or buzzes.

import { fmt, pt } from './kit.mjs';

/** A part turned about a point by `turn` degrees. */
const turned = (k, turn, [x, y], inner) => (turn ? k.g(`rotate(${turn} ${fmt(x)} ${fmt(y)})`, inner) : inner);

/** A little blue bird in flight, flapping. */
export function bird(k) {
  const c = k.P;
  const up = k.frame % 2 === 0;
  return [
    k.ground(30, 58.6, 11, 2),
    k.poly([[17, 31.6], [6.8, 26.4], [7.8, 37.4]], [1.2, 1.6, 1.6], c.blueShade),
    k.poly([[43.6, 27], [51.6, 30.4], [43.6, 33.6]], [1, 1, 1], c.amber),
    k.ellipse(30, 32, 15.4, 13.2, c.blue),
    k.flatEllipse(33.6, 39, 10, 7, c.sky),
    k.eye(38.4, 26.8, 2.2),
    k.blush(40.6, 32.6, 2, 1.3),
    up
      ? k.path('M21.6 31.4C19.6 24.6 22.6 18.4 28.4 15.8C30.4 20.6 30 26.4 27.4 31.8Z', c.blueShade)
      : k.path('M20.4 31.4C21.6 38.4 26.4 42.4 32 41.6C30.8 35.6 26.6 31.6 20.4 31.4Z', c.blueShade),
  ].join('');
}

/** A sorsa: a wild mallard drake afloat, the water rippling past. */
export function mallard(k) {
  const c = k.P;
  const shift = k.frame % 2 ? 2.6 : 0;
  const ripple = (x, y, w) => k.line(`M${pt([x + shift, y])}H${fmt(x + shift + w)}`, { color: c.waterShade, sw: 1.4 });
  return [
    k.poly([[15.4, 37.4], [8.4, 33.2], [13.2, 41.6]], 1.2, c.charcoal),
    k.ellipse(30.4, 44, 17.6, 10, c.silver),
    k.flatEllipse(44.4, 40.6, 5.6, 4.8, c.brown),
    k.flatEllipse(26.6, 41.4, 9.4, 4.4, c.grey),
    k.flatEllipse(23, 42.6, 3, 1.6, c.blue),
    k.path('M50 24.6C55.4 24.2 59.6 25.8 59.4 28.2C59.2 30.4 55.2 30.6 50.4 29.8Z', c.yellow),
    k.ellipse(43, 33.6, 5.6, 2.2, c.white),
    k.circle(44, 25.6, 8.2, c.greenShade),
    k.eye(46.4, 23.6, 2.3),
    k.flatEllipse(32, 54.8, 27.4, 4.8, c.water),
    ripple(10, 52.6, 7),
    ripple(27, 55, 8),
    ripple(42, 52.4, 7),
  ].join('');
}

/**
 * An ankka: a white farmyard duck standing on its orange feet, quacking now
 * and then. (The wild duck on the lake is the sorsa, drawn above.)
 */
export function farmDuck(k) {
  const c = k.P;
  const quack = k.frame % 2 === 1;
  return [
    k.ground(29, 58.6, 17, 2.2),
    k.limb('M25 48V55.2M34 48V55.2', c.orange, 3.8),
    k.ellipse(28, 56.4, 4.4, 1.7, c.orange),
    k.ellipse(37, 56.4, 4.4, 1.7, c.orange),
    quack
      ? k.path('M52.6 20.4C56 17.6 60.4 16.4 62 17.8C63 19 60.6 21.4 56.6 22.6L53.4 23.4Z', c.orange) +
        k.path('M53.4 24.6L57 25.6C59.6 26.4 60.6 28 59.2 28.8C57.6 29.6 54.6 28.6 53 26.6Z', c.orange) +
        k.line('M59.6 13.6L61.6 11.6M61 23.6H63.4', { sw: 1.4 })
      : k.path('M52.6 20.6C56.4 19.6 60.6 20 61.8 22.2C62.6 24 60 25.6 56.4 25.6C55 25.6 53.8 25.2 53 24.6Z', c.orange),
    k.path(
      'M8.6 29C10.6 33 15 35 20 35H33.6C33.6 33 33.2 31.4 33.4 29.4C34 20.4 39 14 45.4 14C51.6 14 55.6 19 54.6 25.4C54 29 51.6 31.6 48.6 32.4C48.4 34.4 49 36.4 49.8 38.4C51.4 42.6 50.6 47 47.2 50C44.2 52.6 39.6 53.6 34.6 53.6H22C14 53.6 9 49.2 8 42.6C7.4 38.4 7.6 33.4 8.6 29Z',
      c.white,
    ),
    k.flat('M45.6 39.6C48.4 42.6 48.4 47.4 45 50.2C42.2 52.6 38.4 53.4 34.4 53.4C40.4 50.6 44.6 45.8 45.6 39.6Z', c.silver),
    k.path('M17.6 39.6C23.6 36.6 33.6 36.6 37.6 40.6C35.6 46.6 27.6 49.6 19.6 47.6C15.6 46.6 14.6 42.6 17.6 39.6Z', c.white),
    k.flat('M16.4 44C20.4 47.6 28.6 48.6 35 45.4C32 48.4 25.6 49.6 19.6 48C17.8 47.4 16.8 45.8 16.4 44Z', c.creamShade),
    k.eye(46.6, 21.6, 2.3),
    k.blush(50, 27.2, 1.8, 1.2),
  ].join('');
}

/** A white hen with a red comb, flapping a wing. */
export function chicken(k) {
  const c = k.P;
  const flap = k.frame % 2 ? -26 : 0;
  return [
    k.ground(30, 58.6, 15, 2.4),
    k.limb('M27 49V55.6H29.2', c.amber, 3.8),
    k.limb('M33.2 49V55.6H35.4', c.amber, 3.8),
    k.path('M37.6 17.4C36.6 14.4 38.6 12.4 40.6 13.6C41 11 44.6 10.8 44.8 13.6C47 13 48.4 15.6 46.6 17.6Z', c.red),
    k.poly([[46.2, 18.6], [53.6, 21.4], [46.6, 24.2]], [0.8, 1, 0.8], c.amber),
    k.path(
      'M47.4 19.4C46.4 15.6 42.6 14.2 39.4 15.2C36.2 16.2 34.8 19.4 35.2 23C35.4 26 32 27.4 27 27.4C23.4 27.4 21.2 26 19.6 23.6C18.4 21.6 16.6 18.8 15 17.2C12.4 22.4 11.6 28.4 13 33.6C14.8 43.6 21.8 50 30.4 50C39.6 50 46.4 44.4 46.8 37C47.2 32 45.6 29.6 46.6 27.2C47.4 25.2 48.2 23.4 48.4 22.2Z',
      c.white,
    ),
    k.ellipse(48, 27.2, 1.6, 2.4, c.red),
    k.g(
      `rotate(${flap} 35.4 37)`,
      k.path('M35.4 37C33.2 33.2 25.8 32.6 20.6 35.6C17.4 37.6 17.6 41.8 21 43.2C26.4 45.4 33.2 42.8 35.4 37Z', c.white) +
        k.flat('M18.8 40C22.4 43.6 29.2 43.6 33.6 40.4C31 44.4 23.6 45.4 18.8 40Z', c.creamShade),
    ),
    k.eye(42.4, 20.8, 2.3),
    k.blush(44.2, 25.2, 1.8, 1.2),
  ].join('');
}

/** A fish swimming, its tail swishing and bubbles rising. Fish don't blink. */
export function fish(k) {
  const c = k.P;
  const f = k.frame % 4;
  const bubble = (x, y, r) => k.circle(x, y, r, c.sky);
  return [
    turned(k, [0, 12, 0, -12][f], [17, 32], k.poly([[18.6, 32], [6.6, 22.4], [6.6, 41.6]], [1.4, 1.8, 1.8], c.blueShade)),
    k.poly([[27.4, 22], [33.6, 14.4], [39.6, 21.4]], [1.2, 1.6, 1.2], c.blueShade),
    k.poly([[30.4, 42.4], [34.4, 48.4], [38.6, 42.4]], [1, 1.4, 1], c.blueShade),
    k.path('M14.6 32C19.4 22.4 29 18.6 38.6 20.4C46 21.8 51.4 27 52.6 32C51.4 37 46 42.2 38.6 43.6C29 45.4 19.4 41.6 14.6 32Z', c.blue),
    k.flat('M16.6 34.6C22 40.6 30 43.6 38.6 42.4C45 41.4 49.6 37.8 51.6 34.6Z', c.sky),
    k.line('M36.6 25.6Q39.2 32 36.6 38.4', { color: c.blueShade, sw: 1.4 }),
    k.eye(44, 28.6, 2.3),
    k.blush(45.6, 34, 1.8, 1.2),
    bubble(56, 22 - f * 3, 2.4),
    f % 2 ? bubble(58.6, 12 - f * 2, 1.9) : '',
  ].join('');
}

/** A coiled green snake, flicking its forked tongue. */
export function snake(k) {
  const c = k.P;
  const out = k.frame % 2 === 1;
  return [
    k.ground(32, 58.6, 19, 2.2),
    k.poly([[44, 50.4], [57, 54.6], [46, 55.4]], [1, 1.2, 1], c.green),
    k.ellipse(31.6, 50.4, 18, 6.4, c.green),
    k.flatEllipse(31.6, 53.6, 13, 2.2, c.lime),
    k.ellipse(32, 42.4, 14, 5.8, c.green),
    k.flatEllipse(32, 45.2, 9.6, 2, c.lime),
    k.limb('M30.4 41.4C27.2 36.6 28.2 31.6 32 28.6', c.green, 8),
    out ? k.line('M33.6 30.4V34.6M33.6 34.6L31.8 36.4M33.6 34.6L35.4 36.4', { color: c.red, sw: 1.4 }) : '',
    k.ellipse(33.6, 23.6, 9.2, 7.2, c.green),
    k.flatCircle(28, 46, 1.6, c.greenShade),
    k.flatCircle(37.4, 41.4, 1.6, c.greenShade),
    k.flatCircle(41.8, 49.4, 1.6, c.greenShade),
    k.eye(29.6, 22.4, 2.3),
    k.eye(37.6, 22.4, 2.3),
    k.blush(26.4, 26.4, 1.8, 1.2),
    k.blush(40.8, 26.4, 1.8, 1.2),
    k.smile(33.6, 26.6, 4, 1),
  ].join('');
}

/** A blue butterfly, front on, flapping (its wings fold in to half width). */
export function butterfly(k) {
  const c = k.P;
  const wing = (s) =>
    k.g(`rotate(${s * -28} ${pt([32 + s * 11.6, 22.4])})`, k.ellipse(32 + s * 11.6, 22.4, 10.4, 8, c.blue) + k.flatEllipse(32 + s * 13, 21.4, 4.4, 3.2, c.sky)) +
    k.g(`rotate(${s * 30} ${pt([32 + s * 9.6, 38.4])})`, k.ellipse(32 + s * 9.6, 38.4, 7.6, 6, c.purple) + k.flatEllipse(32 + s * 10.6, 39, 2.8, 2.2, c.pink));
  const wings = wing(-1) + wing(1);
  return [
    k.ground(32, 58.6, 10, 2),
    k.frame % 2 ? k.g('translate(32 0) scale(0.5 1) translate(-32 0)', wings) : wings,
    k.line('M30.6 15.6C29.6 12 27.4 9.6 24.6 9M33.4 15.6C34.4 12 36.6 9.6 39.4 9', { sw: 1.4 }),
    k.flatCircle(24.4, 9, 1.6, c.ink),
    k.flatCircle(39.6, 9, 1.6, c.ink),
    k.ellipse(32, 33.6, 3.2, 12.4, c.charcoal),
    k.circle(32, 18.6, 4, c.charcoal),
  ].join('');
}

/** A round bumblebee, front on, its wings buzzing. */
export function bee(k) {
  const c = k.P;
  const buzz = k.frame % 2 === 1;
  // teardrop wings angled up and out from the back; buzzing, they flick lower
  const wing = (s) => {
    const [x, y] = [32 + s * 10.4, 17.4];
    return k.g(
      `rotate(${s * (buzz ? 62 : 34)} ${pt([32 + s * 4, 24])})`,
      k.ellipse(x, y, 4.6, 7.8, c.sky) + k.flatEllipse(x - s * 1.2, y - 2.6, 1.4, 2.6, c.white),
    );
  };
  return [
    k.ground(32, 58.6, 13, 2.2),
    k.poly([[29.4, 46.6], [32, 53.6], [34.6, 46.6]], [0.8, 1, 0.8], c.charcoal),
    wing(-1),
    wing(1),
    k.line('M28.4 21.8C27.6 18 26 15.4 23.4 14.2M35.6 21.8C36.4 18 38 15.4 40.6 14.2', { sw: 1.4 }),
    k.flatCircle(23.2, 14, 1.7, c.ink),
    k.flatCircle(40.8, 14, 1.7, c.ink),
    k.circle(32, 34.4, 14, c.yellow),
    k.flat('M17 37.2H47V40.8H17Z', c.charcoal),
    k.flat('M21 43.6H43V46.8H21Z', c.charcoal),
    k.eye(27, 29.2, 2.3),
    k.eye(37, 29.2, 2.3),
    k.blush(23.4, 33, 1.8, 1.2),
    k.blush(40.6, 33, 1.8, 1.2),
    k.smile(32, 32.2, 3.8, 1),
  ].join('');
}

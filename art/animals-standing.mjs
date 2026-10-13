// Standing animals, side on and facing right: a long body on four short legs
// (the far two a shade darker), the head at the front. The farm animals turn
// their faces to you; the horse and the elephant show their profile, since
// that's how you know them. Each one swishes, wiggles or swings something.

import { fmt, polar, pt, scallops } from './kit.mjs';

/** A short leg from `top` to `bottom`, centred on x; `hoof` colors its foot. */
function leg(k, x, top, bottom, color, { hoof, w = 5.4 } = {}) {
  const c = k.P;
  const [l, r] = [fmt(x - w / 2), fmt(x + w / 2)];
  return k.rect(x - w / 2, top, w, bottom - top, 1.6, color) + (hoof ? k.flat(`M${l} ${fmt(bottom - 2.8)}H${r}V${fmt(bottom)}H${l}Z`, c[hoof] ?? hoof) : '');
}

/** Four legs: the far pair (a shade darker, a step to the right, a pixel apart) and the near pair. */
function legs(k, [back, front], top, bottom, near, far, o = {}) {
  const step = o.step ?? (o.w ?? 5.4) + 1.8;
  return [leg(k, back + step, top, bottom, far, o), leg(k, front + step, top, bottom, far, o), leg(k, back, top, bottom, near, o), leg(k, front, top, bottom, near, o)].join('');
}

/** A tail swung about its base by `turn` degrees. */
const swing = (k, turn, [x, y], inner) => (turn ? k.g(`rotate(${turn} ${fmt(x)} ${fmt(y)})`, inner) : inner);

/** Mirror points across the vertical line x = mid. */
const mirror = (pts, mid) => pts.map(([x, y]) => [2 * mid - x, y]);

/** The cow: white with brown patches, like a Finnish Ayrshire. Her tail swishes. */
export function cow(k) {
  const c = k.P;
  const hx = 46.4;
  const horn = (s) => k.limb(`M${pt([hx + s * 4.6, 16.4])}L${pt([hx + s * 6, 10.8])}`, c.cream, 4.2);
  const ear = (s) => k.ellipse(hx + s * 10.8, 19.6, 4.6, 2.6, c.white) + k.flatEllipse(hx + s * 11.2, 19.6, 2.4, 1.1, c.pink);
  return [
    k.ground(30, 58.6, 21, 2.4),
    legs(k, [15.4, 34.6], 42, 56.6, c.white, c.silverShade, { hoof: 'charcoal' }),
    swing(k, [0, 10, 18, 10][k.frame % 4], [12, 33.6], k.limb('M12 33.6C8.4 36 7.6 41.4 8.4 46.4', c.white, 3.8) + k.ellipse(8.6, 47.8, 2.2, 2.8, c.brown)),
    k.rect(10.6, 28.6, 38, 18.4, 8.4, c.white),
    k.flatEllipse(20.4, 34.4, 5, 3.8, c.brown),
    k.flatEllipse(33.6, 42, 4.4, 3, c.brown),
    horn(-1),
    horn(1),
    ear(-1),
    ear(1),
    k.ellipse(hx, 22.8, 9.6, 9.2, c.white),
    k.flatEllipse(hx + 4.4, 15.6, 3.6, 2.4, c.brown),
    k.ellipse(hx, 29.6, 7.4, 4.6, c.pink),
    k.flatEllipse(hx - 2.8, 29.8, 1, 1.4, c.pinkShade),
    k.flatEllipse(hx + 2.8, 29.8, 1, 1.4, c.pinkShade),
    k.eye(hx - 4, 21.4, 2.3),
    k.eye(hx + 4, 21.4, 2.3),
  ].join('');
}

/** The pig: round and pink, a snout to the front and a curly tail that wiggles. */
export function pig(k) {
  const c = k.P;
  const hx = 45.6;
  const ear = [[37.8, 21.4], [37.4, 12.4], [44, 16.4]];
  return [
    k.ground(30, 58.6, 20, 2.4),
    legs(k, [15.4, 34.6], 42, 56.6, c.pink, c.pinkShade, { w: 5.6 }),
    swing(k, k.frame % 2 ? -16 : 0, [11.4, 35], k.limb('M11.4 35C6.6 36.2 4 31.4 6.8 28.6C9.4 26 13 28.8 11 31.6', c.pink, 3.8)),
    k.rect(10.6, 29.6, 37.6, 17, 8.4, c.pink),
    k.flatEllipse(20, 43.2, 6.4, 2.2, c.pinkShade),
    k.poly(ear, [1.4, 1.6, 1.4], c.pink),
    k.poly(mirror(ear, hx), [1.4, 1.6, 1.4], c.pink),
    k.ellipse(hx, 25.4, 10.2, 9.4, c.pink),
    k.ellipse(hx, 29.4, 4.8, 3.4, c.pinkShade),
    k.flatEllipse(hx - 1.8, 29.4, 0.9, 1.4, c.mouth),
    k.flatEllipse(hx + 1.8, 29.4, 0.9, 1.4, c.mouth),
    k.eye(hx - 4.4, 23, 2.3),
    k.eye(hx + 4.4, 23, 2.3),
  ].join('');
}

/** The sheep: a woolly cloud on dark legs, a soft face, ears that flick. */
export function sheep(k) {
  const c = k.P;
  const hx = 44.6;
  const flick = k.frame % 2 ? 14 : 0;
  const ear = (s, turn) => k.g(`rotate(${s * (-16 + turn)} ${pt([hx + s * 6, 26])})`, k.ellipse(hx + s * 10, 26, 4.4, 2.2, c.skin1) + k.flatEllipse(hx + s * 10.4, 26, 2.4, 1, c.pink));
  const wool = (cx, cy, r, n, bump) => `M${pt(polar(cx, cy, r, -90))}${scallops(cx, cy, r, -90, 270, n, bump)}Z`;
  return [
    k.ground(30, 58.6, 19, 2.4),
    legs(k, [16.4, 33.6], 42, 56.6, c.charcoal, c.charcoalShade, { w: 4.8 }),
    k.g('translate(27 36.6) scale(1.45 1) translate(-27 -36.6)', k.path(wool(27, 36.6, 11.6, 9, 1.5), c.white)),
    ear(-1, 0),
    ear(1, flick),
    k.ellipse(hx, 29.4, 7.8, 7.8, c.skin1),
    k.path(wool(hx, 22.4, 4.6, 7, 1.5), c.white),
    k.eye(hx - 3.4, 29.4, 2.2),
    k.eye(hx + 3.4, 29.4, 2.2),
    k.blush(hx - 5.4, 33.2, 1.7, 1.1),
    k.blush(hx + 5.4, 33.2, 1.7, 1.1),
    k.smile(hx, 33.4, 3.4, 0.9),
  ].join('');
}

/** The horse: a Finnhorse, chestnut with a flaxen mane and tail. The tail swishes. */
export function horse(k) {
  const c = k.P;
  return [
    k.ground(30, 58.6, 21, 2.4),
    legs(k, [14.6, 33.4], 39, 56.6, c.hazel, c.hazelShade, { hoof: 'charcoal', w: 5 }),
    swing(
      k,
      [0, 8, 14, 8][k.frame % 4],
      [12.4, 31],
      k.path('M13.4 29.8C7 30.6 4.2 37.6 5.6 45.6C7 45 8.2 43.4 8.8 41.6C9.4 44.2 10.2 45.8 11.6 46.6C10.8 40.6 12.2 35.4 15.4 32Z', c.blonde),
    ),
    k.rect(10.4, 26.4, 34, 17.4, 8.2, c.hazel),
    k.path('M33.4 33C34.2 25.6 37.6 18.4 42.6 13.2L51 18.6C47.6 23 45.8 28.6 45.6 35.4Z', c.hazel),
    k.path('M33.2 31.4C33.6 24.2 36.6 17.4 41.4 12.2L45 14.8C40.8 19.4 38.4 25.2 37.8 31.4Z', c.blonde),
    k.poly([[46.6, 10.6], [47.6, 3.8], [51.2, 9]], [1, 1.2, 1], c.hazel),
    k.path('M43.4 14.6C43.4 9.4 48.6 7 53 9.4L59.8 15.6C62.4 18.2 61.8 22.6 58 23.4C55.4 24 52.6 23.6 50.2 22.2L46.4 20C44.6 18.8 43.4 16.8 43.4 14.6Z', c.hazel),
    k.flatEllipse(58.4, 19.8, 3.6, 3.8, c.hazelShade),
    k.flatEllipse(59.4, 19.2, 0.9, 1.2, c.ink),
    k.path('M43.8 11.2C45.4 8.2 49 7.4 51.6 9C49.8 10.6 47.4 12 45 12.6Z', c.blonde),
    k.eye(51.2, 14.2, 2.2),
    k.blush(53.4, 19, 1.8, 1.2),
  ].join('');
}

/** The elephant: grey, with a big pink-lined ear. The trunk swings up and down. */
export function elephant(k) {
  const c = k.P;
  const trunk = [
    'M55 27.6C59.4 29.4 60.4 35.2 58.6 40.6',
    'M55 27.6C60 28 61.6 32.6 60.6 37',
    'M55 27.6C60.4 26.6 62 22 60 17.6',
    'M55 27.6C60 28 61.6 32.6 60.6 37',
  ][k.frame % 4];
  return [
    k.ground(30, 58.6, 21, 2.4),
    legs(k, [15.4, 32.6], 41, 56.6, c.grey, c.greyShade, { w: 6.4 }),
    swing(k, k.frame % 2 ? 10 : 0, [10.4, 32], k.limb('M10.4 32C7.8 34.6 7.2 38.2 7.8 41.2', c.grey, 3.8) + k.flatCircle(7.8, 42, 1.7, c.charcoal)),
    k.rect(9.4, 24, 36.4, 22.6, 10.6, c.grey),
    k.limb(trunk, c.grey, 7),
    k.ellipse(47.6, 24.4, 10.6, 10.2, c.grey),
    k.ellipse(41.6, 26.6, 6.6, 8.6, c.grey),
    k.flatEllipse(41.4, 27, 3.2, 5, c.pink),
    k.eye(51.6, 21.6, 2.3),
    k.blush(54, 26.8, 1.8, 1.2),
  ].join('');
}

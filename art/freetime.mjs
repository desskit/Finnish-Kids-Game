// Free-time words: toys, instruments and gadgets. The ball bounces, the bike's
// wheels spin, music floats off the guitar and the piano, the notes bob, the
// clapperboard claps, the balloon sways, the candle flickers.

import { fmt, polar, pt } from './kit.mjs';

/** A floating note (♪) at (x, y). */
const note = (k, x, y, color = 'navy') =>
  k.ellipse(x, y, 2.6, 2, k.P[color]) + k.limb(`M${pt([x + 2, y])}V${fmt(y - 9)}L${pt([x + 5.4, y - 6.6])}`, k.P[color], 3.8);

/** A beach ball, bouncing: down (squashed), up, coming down. */
export function ball(k) {
  const c = k.P;
  // in the air (the still picture), up, in the air, landing squashed
  const f = [1, 2, 1, 0][k.frame % 4];
  const [lift, squash] = [[0, 0.9], [-5, 1], [-10, 1]][f];
  const cx = 32;
  const cy = 40 + lift;
  const R = 14;
  const colors = ['red', 'white', 'yellow', 'white', 'blue', 'white'];
  const wedges = colors.map((col, i) => {
    const a1 = -90 + i * 60;
    return k.flat(`M${pt([cx, cy])}L${pt(polar(cx, cy, R + 1, a1))}A${R + 1} ${R + 1} 0 0 1 ${pt(polar(cx, cy, R + 1, a1 + 60))}Z`, c[col]);
  });
  return [
    k.ground(32, 56.6, [14, 11, 8][f], 2.2),
    k.g(
      `translate(${cx} 54) scale(${f === 0 ? 1.08 : 1} ${squash}) translate(${-cx} -54)`,
      k.circle(cx, cy, R, c.white),
      ...wedges,
      k.flatCircle(cx, cy, 3, c.white),
      k.circle(cx, cy, R, 'none'),
      k.shineDot(cx - 6, cy - 7, 1.6),
    ),
  ].join('');
}

/** A bike, its wheels spinning. */
export function bike(k) {
  const c = k.P;
  const turn = k.frame % 2 ? 45 : 0;
  const wheel = (x) => {
    const spokes = [0, 60, 120].map((a) => `M${pt(polar(x, 44, 8.4, a + turn))}L${pt(polar(x, 44, 8.4, a + turn + 180))}`).join('');
    return k.circle(x, 44, 10.6, c.charcoal) + k.circle(x, 44, 8.6, c.white) + k.line(spokes, { color: c.silverShade, sw: 1.2 }) + k.flatCircle(x, 44, 1.6, c.charcoal);
  };
  return [
    k.ground(32, 56.6, 26, 2),
    wheel(15),
    wheel(49),
    k.limb('M15 44L30 44L25.6 27.6M15 44L25.6 27.6H42.6M30 44L42.6 27.6L49 44', c.red, 3.8),
    k.limb('M42.6 27.6L41 21H46.6', c.charcoal, 3.8),
    k.ellipse(24.6, 26, 4.6, 1.8, c.charcoal),
    k.circle(30, 44, 2.6, c.silverShade),
    k.limb(`M${pt(polar(30, 44, 5, 60 + turn * 2))}L${pt(polar(30, 44, 5, 240 + turn * 2))}`, c.charcoal, 3.8),
  ].join('');
}

/** A game controller. */
export function game(k) {
  const c = k.P;
  return [
    k.ground(32, 56.6, 23, 2),
    k.path('M13 29C13 22.6 17 20 23 20H41C47 20 51 22.6 51 29L55 43C56.2 47.6 52.6 50.6 48.6 48L42 42.6H22L15.4 48C11.4 50.6 7.8 47.6 9 43Z', c.purple),
    k.flat('M47.6 23C50 25 50.6 27.6 50.6 29.6L54.4 43.4C55 46.2 53.6 48 51.6 48.4C52.4 44 50.6 37.6 47.6 23Z', c.purpleShade),
    k.flat('M18.6 30.4H22V27H25V30.4H28.4V33.4H25V36.8H22V33.4H18.6Z', c.charcoal),
    k.circle(40, 27.6, 1.8, c.yellow),
    k.circle(44, 31.4, 1.8, c.red),
    k.circle(36, 31.4, 1.8, c.green),
    k.circle(40, 35.2, 1.8, c.blue),
    k.shine('M17.6 24.6Q20 22.6 24 22.6', 1.6),
  ].join('');
}

/** An acoustic guitar, a note floating off it. */
export function guitar(k) {
  const c = k.P;
  const f = k.frame % 2;
  return [
    k.ground(28, 58.6, 18, 2),
    note(k, f ? 48 : 46, f ? 18 : 22),
    k.g(
      'rotate(-36 30 38)',
      k.rect(27.6, 4, 4.8, 28, 0.8, c.brown),
      k.rect(26, 0.6, 8, 6, 1.4, c.brownShade),
      k.path('M30 26C36 26 39.6 30 39 35C38.6 38 37 39.4 37 41C37 43 42 45 42 52C42 59 36.6 62 30 62C23.4 62 18 59 18 52C18 45 23 43 23 41C23 39.4 21.4 38 21 35C20.4 30 24 26 30 26Z', c.wood),
      k.flat('M35.6 28.4C38.6 30.4 39.4 34 38.4 37C38 38.6 37 39.6 37 41C37 43 41.6 45.6 41.6 52C41.6 57.4 38.6 60.6 34 61.6C37.6 58 38.6 53 37.4 48C36.6 45 34.4 43 34.6 40C34.8 37 36.6 33 35.6 28.4Z', c.woodShade),
      k.circle(30, 43, 3.6, c.charcoal),
      k.rect(26, 52, 8, 2.6, 0.6, c.brown),
      k.line('M28.8 4V53M31.2 4V53', { color: c.cream, sw: 1 }),
    ),
  ].join('');
}

/** A keyboard, one key pressed and a note floating up. */
export function piano(k) {
  const c = k.P;
  const f = k.frame % 2;
  const pressed = f ? 3 : -1;
  const white = [0, 1, 2, 3, 4, 5, 6].map((i) => k.rect(9.4 + i * 6.6, 28, 6.6, 20, 0.6, i === pressed ? c.silver : c.white)).join('');
  const black = [0, 1, 3, 4, 5].map((i) => k.rect(13.6 + i * 6.6, 28, 4, 12, 0.6, c.charcoal)).join('');
  return [
    k.ground(32, 58.6, 26, 2),
    note(k, f ? 34 : 30, f ? 16 : 20, 'purple'),
    k.rect(6, 23, 52, 28, 2, c.charcoal),
    white,
    black,
    k.flat('M7 24H57V27H7Z', c.charcoalShade),
  ].join('');
}

/** Music: two notes joined by a beam, bobbing. */
export function music(k) {
  const c = k.P;
  const f = k.frame % 2;
  const [a, b] = f ? [-1.4, 1.4] : [1.4, -1.4];
  return [
    k.ground(32, 58.6, 14, 2),
    k.limb(`M${pt([25.6, 46 + a])}V${fmt(18 + a)}L${pt([45.6, 14 + b])}V${fmt(42 + b)}`, c.blue, 4.4),
    k.limb(`M${pt([25.6, 24.6 + a])}L${pt([45.6, 20.6 + b])}`, c.blue, 4.4),
    k.g(`rotate(-20 21 ${fmt(46 + a)})`, k.ellipse(21, 46 + a, 6, 4.4, c.blue)),
    k.g(`rotate(-20 41 ${fmt(42 + b)})`, k.ellipse(41, 42 + b, 6, 4.4, c.blue)),
    k.shineDot(18.6, 44.6 + a, 1.2),
    k.shineDot(38.6, 40.6 + b, 1.2),
  ].join('');
}

/** A movie: a clapperboard, clapping. */
export function movie(k) {
  const c = k.P;
  const open = k.frame % 2 === 0;
  const stripes = [0, 1, 2, 3].map((i) => `M${fmt(16 + i * 9)} 0L${fmt(21 + i * 9)} 0L${fmt(17 + i * 9)} 7L${fmt(12 + i * 9)} 7Z`).join('');
  const clapper = k.rect(10, 0, 44, 7, 1, c.white) + k.flat(stripes, c.charcoal);
  return [
    k.ground(32, 58.6, 24, 2),
    k.rect(10, 24, 44, 31, 2, c.charcoal),
    k.flat('M15 32H49V33.6H15ZM15 39H40V40.6H15ZM15 46H44V47.6H15Z', c.white),
    k.g(`translate(0 17) rotate(${open ? -18 : 0} 10 7)`, clapper),
    k.circle(11.6, 23.4, 1.6, c.silverShade),
  ].join('');
}

/** A phone, its apps on the screen. */
export function phone(k) {
  const c = k.P;
  const apps = [];
  const colors = ['red', 'yellow', 'green', 'blue', 'purple', 'orange', 'teal', 'pink', 'coral'];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) apps.push(k.flat(`M${fmt(25.4 + i * 5)} ${fmt(15 + r * 6)}h3.6v3.6h-3.6Z`, c[colors[r * 3 + i]]));
  return [
    k.ground(32, 58.6, 15, 2),
    k.rect(19.6, 5, 24.8, 51, 4.4, c.navy),
    k.rect(22.6, 10, 18.8, 38, 1, c.sky),
    ...apps,
    k.flat('M28 51.4H36V53H28Z', c.silverShade),
    k.shine('M24.6 37V45', 1.6),
  ].join('');
}

/** A laptop computer. */
export function computer(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 26, 2),
    k.rect(12, 9, 40, 30, 2, c.charcoal),
    k.rect(15, 12, 34, 24, 0.6, c.sky),
    k.rect(19, 16, 20, 13, 0.6, c.white),
    k.flat('M19.6 16.6H38.4V19H19.6Z', c.blue),
    k.flat('M41 26h5v6h-5Z', c.yellow),
    k.path('M8 41H56L60 50C60.6 51.6 59.6 52.6 58 52.6H6C4.4 52.6 3.4 51.6 4 50Z', c.silver),
    k.flat('M14 43.4H50L51.4 46.6H12.6Z', c.silverShade),
    k.rect(26, 48, 12, 3, 0.6, c.silverShade),
  ].join('');
}

/** A spoon. */
export function spoon(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 18, 2),
    k.g('rotate(40 32 32)', k.limb('M32 26V58', c.silver, 5), k.ellipse(32, 15, 8, 11, c.silver), k.flatEllipse(33.6, 16.4, 4.4, 7, c.silverShade), k.shine('M28.4 11.6Q28.4 8.6 30.6 7.6', 1.6)),
  ].join('');
}

/** A gold key. */
export function key(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 18, 2),
    k.g(
      'rotate(-38 32 32)',
      k.path('M18 32C18 25.4 22 21.6 27 21.6C32 21.6 36 25.4 36 32C36 38.6 32 42.4 27 42.4C22 42.4 18 38.6 18 32ZM23.4 32C23.4 34.6 25 36.4 27 36.4C29 36.4 30.6 34.6 30.6 32C30.6 29.4 29 27.6 27 27.6C25 27.6 23.4 29.4 23.4 32Z', c.yellow),
      k.rect(35, 29.2, 23, 5.6, 1, c.yellow),
      k.rect(47, 34, 3.4, 6, 0.6, c.yellow),
      k.rect(53, 34, 3.4, 4.4, 0.6, c.yellow),
      k.flat('M36 32.6H57V34.2H36Z', c.yellowShade),
    ),
  ].join('');
}

/** A red balloon on its string, swaying. */
export function balloon(k) {
  const c = k.P;
  const sway = k.frame % 2 ? 6 : -4;
  return [
    k.g(
      `rotate(${sway} 32 58)`,
      k.line('M32 40Q28 46 32 50Q36 54 32 58', { color: c.charcoal, sw: 1.4 }),
      k.poly([[29.6, 41.6], [34.4, 41.6], [32, 37.6]], 0.6, c.red),
      k.path('M32 39C23 39 16 31 16 21C16 11.6 23 5.6 32 5.6C41 5.6 48 11.6 48 21C48 31 41 39 32 39Z', c.red),
      k.flat('M41.6 10C46 13.6 47.4 19 46.4 24.6C45 31.6 39.6 37 33 38.4C38.6 34.6 42 28.6 42.4 22C42.6 17.6 42.4 13.4 41.6 10Z', c.redShade),
      k.shine('M21.6 20Q22 13.6 27.6 10.6', 2.4),
    ),
  ].join('');
}

/** A candle on its holder, the flame flickering. */
export function candle(k) {
  const c = k.P;
  const f = k.frame % 3;
  const [tip, lean] = [[10, 0], [8.6, 1.4], [9.6, -1.2]][f];
  return [
    k.ground(32, 58.6, 15, 2),
    k.ellipse(32, 52, 15, 4.6, c.yellow),
    k.flatEllipse(32, 51, 10, 2.4, c.yellowShade),
    k.rect(25.6, 26, 12.8, 25, 1.6, c.cream),
    k.flat('M34.6 27H37.4V50H34.6Z', c.creamShade),
    k.path('M25.6 27C25.6 31 27.6 33 27.6 36C27.6 38 30 38 30 36V27Z', c.white),
    k.limb('M32 26V22.6', c.charcoal, 3.8),
    k.path(`M${pt([32 + lean, tip])}C${pt([35.4 + lean * 0.6, tip + 4])} ${pt([36.4, 17])} ${pt([35.6, 19.6])}C${pt([35, 22.4])} ${pt([33.6, 23.4])} ${pt([32, 23.4])}C${pt([30.4, 23.4])} ${pt([29, 22.4])} ${pt([28.4, 19.6])}C${pt([27.6, 17])} ${pt([28.6 + lean * 0.6, tip + 4])} ${pt([32 + lean, tip])}Z`, c.orange),
    k.flat(`M${pt([32 + lean * 0.6, tip + 5])}C${pt([34 + lean * 0.4, tip + 8])} ${pt([34, 20.6])} ${pt([32, 22.4])}C${pt([30, 20.6])} ${pt([30 - lean * 0.2, tip + 8])} ${pt([32 + lean * 0.6, tip + 5])}Z`, c.yellow),
  ].join('');
}

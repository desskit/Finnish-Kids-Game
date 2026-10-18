// Free-time words: toys, instruments and gadgets. The ball bounces, the bike's
// wheels spin, music floats off the guitar and the piano, the notes bob, the
// clapperboard claps, the balloon sways, the candle flickers.

import { fmt, polar, pt } from './kit.mjs';

/** A floating note (♪) at (x, y). */
export const note = (k, x, y, color = 'navy') =>
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

// --- Play: toys, instruments and games -------------------------------------------

/** A teddy bear (a golden plush, so it's never the real bear), tilting its head. */
export function teddy(k) {
  const c = k.P;
  const tilt = k.frame % 2 ? 8 : 0;
  return [
    k.ground(32, 58.6, 20, 2.2),
    k.ellipse(21, 51.6, 7, 5.6, c.amber),
    k.ellipse(43, 51.6, 7, 5.6, c.amber),
    k.flatEllipse(18.6, 52.4, 3.4, 3.2, c.tan),
    k.flatEllipse(45.4, 52.4, 3.4, 3.2, c.tan),
    k.g('rotate(28 18 40)', k.ellipse(18, 40, 4.4, 7.4, c.amber)),
    k.g('rotate(-28 46 40)', k.ellipse(46, 40, 4.4, 7.4, c.amber)),
    k.ellipse(32, 43, 12.6, 11.6, c.amber),
    k.flatEllipse(32, 45.4, 7.2, 7, c.tan),
    k.g(
      `rotate(${tilt} 32 30)`,
      k.circle(21.6, 12.6, 4.6, c.amber),
      k.circle(42.4, 12.6, 4.6, c.amber),
      k.flatCircle(21.6, 12.6, 2.2, c.tan),
      k.flatCircle(42.4, 12.6, 2.2, c.tan),
      k.circle(32, 22, 12, c.amber),
      k.flat('M42 15C44 19 44 25 42 29C40.4 31.4 37.6 33 35 33.6C39.6 30 41.8 23 42 15Z', c.amberShade),
      k.ellipse(32, 26.8, 5.6, 4.2, c.tan),
      k.ellipse(32, 24.8, 2.2, 1.6, c.charcoal),
      k.line('M32 26.4V28.2M29.8 28.4Q32 30 34.2 28.4', { sw: 1.4 }),
      k.eye(27, 20.4, 2),
      k.eye(37, 20.4, 2),
      k.shine('M24.6 14.6Q27 12.6 30 12.4', 1.6),
    ),
    k.poly([[32, 34], [25.4, 30.6], [25.4, 37.4]], 0.8, c.red),
    k.poly([[32, 34], [38.6, 30.6], [38.6, 37.4]], 0.8, c.red),
    k.circle(32, 34, 1.8, c.redShade),
  ].join('');
}

/** A rag doll: orange yarn hair, a pink dotted dress, red stockings; she waves. */
export function doll(k) {
  const c = k.P;
  const up = k.frame % 2 === 1;
  const hand = up ? [48.6, 25.4] : [47.4, 40.6];
  return [
    k.ground(32, 59, 13, 2),
    k.limb('M27.6 47L26.6 55.6', c.red, 5),
    k.limb('M36.4 47L37.4 55.6', c.red, 5),
    k.ellipse(25.6, 57, 3.6, 2.2, c.charcoal),
    k.ellipse(38.4, 57, 3.6, 2.2, c.charcoal),
    k.limb('M25 33L16.6 40.6', c.skin1, 5),
    k.circle(16, 41, 2.6, c.skin1),
    k.limb(`M39 33L${pt(hand)}`, c.skin1, 5),
    k.circle(...hand, 2.6, c.skin1),
    k.poly([[25, 30], [39, 30], [46, 49], [18, 49]], [3, 3, 2.4, 2.4], c.pink),
    k.flatCircle(27, 38, 1.2, c.white),
    k.flatCircle(35, 41, 1.2, c.white),
    k.flatCircle(30, 45, 1.2, c.white),
    k.flatCircle(40, 46, 1.2, c.white),
    k.poly([[27, 30.4], [37, 30.4], [32, 34.4]], 1, c.white, { sw: 1.5 }),
    k.circle(21.6, 16.6, 4.6, c.orange),
    k.circle(42.4, 16.6, 4.6, c.orange),
    k.circle(32, 19.6, 10.4, c.skin1),
    k.path('M22.4 15.6C23 8.6 41 8.6 41.6 15.6C38 12.6 35 13.6 32 12C29 13.6 26 12.6 22.4 15.6Z', c.orange),
    k.eye(28, 20.4, 1.8),
    k.eye(36, 20.4, 1.8),
    k.blush(25, 24, 2, 1.2),
    k.blush(39, 24, 2, 1.2),
    k.line('M29.6 25.6Q32 27.4 34.4 25.6', { sw: 1.3 }),
  ].join('');
}

/** A toy: a wooden pull-along train with a block on its wagon, wheels turning. */
export function toy(k) {
  const c = k.P;
  const turn = k.frame % 2 ? 90 : 0;
  const wheel = (x, r, col) => k.circle(x, 48.4, r, c[col]) + k.flatCircle(...polar(x, 48.4, r * 0.5, turn - 45), 1, c.charcoal);
  return [
    k.ground(33, 54.6, 27, 2),
    k.line('M56.6 39.6Q60 44 61.4 50', { color: c.charcoal, sw: 1.4 }),
    k.circle(61.4, 51.6, 1.8, c.red),
    // the wagon and its block
    k.rect(5.6, 36.6, 16, 10, 1.4, c.blue),
    k.rect(8.4, 29.4, 9, 7.6, 1, c.green),
    k.flat('M14.4 30H16.8V36.4H14.4Z', c.greenShade),
    k.line('M21.6 43H26', { color: c.charcoal, sw: 1.6 }),
    // the engine
    k.rect(26, 33, 30, 13.6, 1.6, c.red),
    k.rect(42, 21.6, 13, 12.6, 1.6, c.red),
    k.rect(44.8, 24.2, 7.4, 5.6, 1, c.sky),
    k.rect(29, 24.6, 5.4, 8.8, 1, c.yellow),
    k.rect(27.6, 22.4, 8.2, 3, 1, c.yellow),
    k.flat('M27 42.6H55V45.6H27Z', c.redShade),
    k.shine('M29.4 36V40', 1.6),
    wheel(10, 3.8, 'yellow'),
    wheel(17.4, 3.8, 'yellow'),
    wheel(32, 4.6, 'yellow'),
    wheel(49.4, 4.6, 'yellow'),
  ].join('');
}

/** A violin and its bow, the bow drawing across the strings. */
export function violin(k) {
  const c = k.P;
  const f = k.frame % 2;
  const slide = f ? 3 : -3;
  return [
    k.ground(30, 59, 18, 2),
    note(k, f ? 50 : 52, f ? 14 : 18, 'purple'),
    k.g(
      'rotate(-32 32 36)',
      k.rect(30.2, 7.4, 3.6, 21, 1, c.charcoal),
      k.circle(32, 6.4, 2.8, c.brown),
      k.path('M32 25C38 25 41 27 41 31C41 34 38 36 38 39C38 42 43 44 43 49C43 54 38 57.6 32 57.6C26 57.6 21 54 21 49C21 44 26 42 26 39C26 36 23 34 23 31C23 27 26 25 32 25Z', c.orange),
      k.flat('M37 26.6C39.6 27.6 40.4 29.4 40.4 31.4C40.4 34 37.6 36 37.6 39C37.6 42.4 42.4 44 42.4 49C42.4 53.4 38.6 56.6 34 57.2C38.4 54 39.4 49.6 38.2 46C37 42.6 35.4 41.4 35.6 38.6C35.8 35 38.4 31 37 26.6Z', c.orangeShade),
      k.line('M27.6 40.6Q26.8 43.4 28.2 46.4M36.4 40.6Q37.2 43.4 35.8 46.4', { sw: 1.3 }),
      k.rect(28.4, 44.2, 7.2, 1.8, 0.6, c.tan),
      k.poly([[30, 49], [34, 49], [33.4, 55], [30.6, 55]], 0.8, c.charcoal),
      k.line('M31.2 9V49M32.8 9V49', { color: c.cream, sw: 1 }),
    ),
    k.g(
      `translate(${slide * 0.8} ${-slide * 0.6})`,
      k.line('M10 47L55 13', { color: c.brown, sw: 2.6 }),
      k.line('M11.8 49.4L56.4 15.6', { color: c.cream, sw: 1.4 }),
    ),
  ].join('');
}

/** A card suit drawn at (x, y): a heart, a spade or a diamond (no numbers). */
function suit(k, kind, x, y, s = 1) {
  const c = k.P;
  if (kind === 'diamond') return k.poly([[x, y - 5 * s], [x + 3.6 * s, y], [x, y + 5 * s], [x - 3.6 * s, y]], 0.6, c.red, { sw: 1.2 });
  const heart = (top) => `M${fmt(x)} ${fmt(top + 9 * s)}C${fmt(x - 2.7 * s)} ${fmt(top + 6.6 * s)} ${fmt(x - 4.6 * s)} ${fmt(top + 5.4 * s)} ${fmt(x - 4.6 * s)} ${fmt(top + 2.6 * s)}C${fmt(x - 4.6 * s)} ${fmt(top + 0.6 * s)} ${fmt(x - 3.2 * s)} ${fmt(top)} ${fmt(x - 2.1 * s)} ${fmt(top)}C${fmt(x - 0.9 * s)} ${fmt(top)} ${fmt(x)} ${fmt(top + 0.7 * s)} ${fmt(x)} ${fmt(top + 2 * s)}C${fmt(x)} ${fmt(top + 0.7 * s)} ${fmt(x + 0.9 * s)} ${fmt(top)} ${fmt(x + 2.1 * s)} ${fmt(top)}C${fmt(x + 3.2 * s)} ${fmt(top)} ${fmt(x + 4.6 * s)} ${fmt(top + 0.6 * s)} ${fmt(x + 4.6 * s)} ${fmt(top + 2.6 * s)}C${fmt(x + 4.6 * s)} ${fmt(top + 5.4 * s)} ${fmt(x + 2.7 * s)} ${fmt(top + 6.6 * s)} ${fmt(x)} ${fmt(top + 9 * s)}Z`;
  if (kind === 'heart') return k.path(heart(y - 4.6 * s), c.red, { sw: 1.2 });
  // a spade: the heart upside down, with a stem
  return k.g(`rotate(180 ${fmt(x)} ${fmt(y)})`, k.path(heart(y - 4.6 * s), c.charcoal, { sw: 1.2 })) + k.poly([[x, y + 2 * s], [x + 2.4 * s, y + 6.4 * s], [x - 2.4 * s, y + 6.4 * s]], 0.4, c.charcoal);
}

/** Playing cards, fanned out: a heart, a spade and a diamond. */
export function cards(k) {
  const c = k.P;
  const card = (rot, kind) =>
    k.g(`rotate(${rot} 32 56)`, k.rect(23, 18, 18, 26, 2.4, c.white), k.flat('M24.4 39.4H39.6V42.6H24.4Z', c.silver), suit(k, kind, 32, 30, 1), suit(k, kind, 26.6, 22.4, 0.4));
  return [k.ground(32, 58.6, 20, 2), card(-24, 'heart'), card(0, 'spade'), card(24, 'diamond')].join('');
}

/** A chess pawn (white or black) standing with its base at (x, ground). */
function pawn(k, x, ground, color) {
  const c = k.P;
  const fill = c[color];
  const shade = color === 'cream' ? c.creamShade : c.charcoalShade;
  return [
    k.ellipse(x, ground - 1.6, 6.4, 2.6, fill),
    k.path(`M${fmt(x - 4.4)} ${fmt(ground - 2.6)}L${fmt(x - 2.2)} ${fmt(ground - 10)}H${fmt(x + 2.2)}L${fmt(x + 4.4)} ${fmt(ground - 2.6)}Z`, fill),
    k.ellipse(x, ground - 10.4, 4, 1.6, fill),
    k.circle(x, ground - 14.6, 3.8, fill),
    k.flat(`M${fmt(x + 1.6)} ${fmt(ground - 17.6)}A3 3 0 0 1 ${fmt(x + 1.6)} ${fmt(ground - 11.8)}Z`, shade),
  ].join('');
}

/** Chess: a board in perspective, a white pawn and a black pawn; the white one steps. */
export function chess(k) {
  const c = k.P;
  const step = k.frame % 2 ? -3 : 0;
  const rows = [38, 44.6, 51.4, 58];
  const xAt = (row, t) => {
    const half = 22 + (row - 38) * 0.55;
    return 32 - half + 2 * half * t;
  };
  const squares = [];
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 4; i++) {
      if ((r + i) % 2) continue;
      const [y0, y1] = [rows[r], rows[r + 1]];
      squares.push(k.flat(`M${fmt(xAt(y0, i / 4))} ${y0}L${fmt(xAt(y0, (i + 1) / 4))} ${y0}L${fmt(xAt(y1, (i + 1) / 4))} ${y1}L${fmt(xAt(y1, i / 4))} ${y1}Z`, c.woodShade));
    }
  }
  return [
    k.poly([[xAt(38, 0), 38], [xAt(38, 1), 38], [xAt(58, 1), 58], [xAt(58, 0), 58]], 1.4, c.cream),
    ...squares,
    k.poly([[xAt(38, 0), 38], [xAt(38, 1), 38], [xAt(58, 1), 58], [xAt(58, 0), 58]], 1.4, 'none'),
    pawn(k, 41.6, 46, 'charcoal'),
    pawn(k, 23.4, 54 + step, 'cream'),
  ].join('');
}

/** Hockey: a stick and a puck, the puck sliding off over the ice. */
export function hockey(k) {
  const c = k.P;
  const f = k.frame % 2;
  const px = f ? 48 : 40;
  return [
    k.flatEllipse(34, 52, 28, 7, c.sky),
    k.limb('M50 4L24.4 46.4', c.wood, 4.6),
    k.limb('M24.4 46.4Q22.6 50.6 18 50.6H6.4', c.wood, 5.4),
    k.limb('M10.6 50.6H18', c.charcoal, 5.4),
    k.limb('M47.2 8.6L44.2 13.6', c.charcoal, 4.6),
    k.ellipse(px, 51, 5.6, 2.4, c.charcoal),
    k.path(`M${fmt(px - 5.6)} 51V53C${fmt(px - 5.6)} 54.4 ${fmt(px - 3)} 55.4 ${fmt(px)} 55.4C${fmt(px + 3)} 55.4 ${fmt(px + 5.6)} 54.4 ${fmt(px + 5.6)} 53V51`, c.charcoalShade),
    f ? k.speed(41, [50.6, 54], 5) : '',
  ].join('');
}

/** A euro coin: gold ring, silver middle, the € sign. */
export function euro(k) {
  const c = k.P;
  return [
    k.ground(32, 58, 17, 2),
    k.circle(32, 32, 22, c.amber),
    k.flat('M48 16C53 21 55 28 53.6 35C52 43 46 49 38 51.6C45 46 49.6 39 49.6 31C49.6 25.6 48.6 20.4 48 16Z', c.amberShade),
    k.circle(32, 32, 15, c.silver),
    k.line('M38.4 24.6A9 9 0 1 0 38.4 39.4', { sw: 3 }),
    k.line('M21.6 29.6H33.4M21.6 34.4H32.4', { sw: 2 }),
    k.shine('M17.6 24Q20 17 27 13.6', 2),
  ].join('');
}

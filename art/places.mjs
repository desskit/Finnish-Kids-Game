// Places, furniture and ways to travel. Buildings face us; vehicles go to
// the right and bob along; furniture stands a little turned. Finnish where it
// helps: a blue city bus, a green-and-white train, a red rowboat, a ferry.

import { fmt, pt, roundPoly } from './kit.mjs';
import { pine, puff } from './nature.mjs';
import { tree as sceneTree } from './scenes/parts.mjs';

/** A wheel: a dark tyre and a silver hub. */
const wheel = (k, x, y, r = 5) => k.circle(x, y, r, k.P.charcoal) + k.flatCircle(x, y, r * 0.42, k.P.silver);

/** A window: sky glass in a frame. */
const pane = (k, x, y, w, h, rx = 1) => k.rect(x, y, w, h, rx, k.P.sky);

/** A part raised by the bob of a moving vehicle on alternate frames. */
const bobbing = (k, inner) => k.g(`translate(0 ${k.frame % 2 ? -k.px : 0})`, inner);

/** Water a boat sits in: a flat band in front, ripples shifting. */
function waterFront(k, y = 50.4) {
  const c = k.P;
  const s = k.frame % 2 ? 2.6 : 0;
  return [
    k.flatEllipse(32, y + 4.6, 30, 5.4, c.water),
    k.flat(`M${fmt(8 + s)} ${fmt(y + 4)}H${fmt(15 + s)}V${fmt(y + 5.2)}H${fmt(8 + s)}Z`, c.white),
    k.flat(`M${fmt(40 - s)} ${fmt(y + 6)}H${fmt(49 - s)}V${fmt(y + 7.2)}H${fmt(40 - s)}Z`, c.white),
  ].join('');
}

/** Wisps of steam rising off a cup (they shift each frame). */
function wisps(k, xs, base) {
  const c = k.P;
  return xs
    .map((x, i) => {
      const f = (k.frame + i) % 3;
      const d = f === 1 ? -1 : 1;
      const y0 = base - [0, 1.4, 2.8][f];
      return k.line(`M${pt([x, y0])}C${pt([x + 2.8 * d, y0 - 2.6])} ${pt([x + 2.8 * d, y0 - 5])} ${pt([x, y0 - 6.4])}C${pt([x - 2.8 * d, y0 - 7.8])} ${pt([x - 2.8 * d, y0 - 10])} ${pt([x, y0 - 12])}`, { color: c.grey, sw: 2 });
    })
    .join('');
}

export function house(k) {
  const c = k.P;
  return [
    k.ground(32, 57.4, 23, 2.2),
    k.rect(39.6, 10.6, 7, 13, 1.4, c.brown),
    k.poly([[14.6, 26], [49.4, 26], [49.4, 55.4], [14.6, 55.4]], 2.4, c.cream),
    k.flat('M43.6 30H48.2V54.2H43.6Z', c.creamShade),
    k.poly([[32, 7.6], [56, 30.6], [8, 30.6]], [3.4, 2.6, 2.6], c.red),
    k.flat('M9.8 29.4H54.2L52.4 27.6H11.6Z', c.redShade),
    k.shine('M21.6 22.4L29.4 15', 2.2),
    k.path('M26.4 55.4V45.2A5.6 5.6 0 0 1 37.6 45.2V55.4Z', c.blue),
    k.flatCircle(34.6, 50, 1.2, c.yellow),
    k.rect(17.4, 35, 6.8, 6.8, 1.4, c.sky, { sw: 2 }),
    k.rect(39.8, 35, 6.8, 6.8, 1.4, c.sky, { sw: 2 }),
    k.px < 2 ? k.line('M20.8 35V41.8M17.4 38.4H24.2M43.2 35V41.8M39.8 38.4H46.6', { sw: 1.5 }) : '',
  ].join('');
}

/** A cardboard box, taped shut. */
export function box(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 22, 2.2),
    k.poly([[44, 26], [54, 18], [54, 46], [44, 55]], 1.4, c.woodShade),
    k.poly([[10, 26], [20, 18], [54, 18], [44, 26]], 1.4, c.tan),
    k.flat('M24.4 26L34.4 18.2H39.4L29.4 26Z', c.tanShade),
    k.rect(10, 26, 34, 29, 1.6, c.wood),
    k.flat('M24.4 26.6H29.4V40H24.4Z', c.tanShade),
    k.flat('M38.6 27.4H43V54H38.6Z', c.woodShade),
  ].join('');
}

/** A wooden table with a vase of flowers on it. */
export function table(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 25, 2.2),
    k.rect(12, 30, 5, 26, 1.2, c.woodShade),
    k.rect(47, 30, 5, 26, 1.2, c.woodShade),
    k.rect(17, 30, 5, 22, 1.2, c.wood),
    k.rect(42, 30, 5, 22, 1.2, c.wood),
    k.limb('M32 18V8', c.green, 3.8),
    k.circle(32, 7.4, 3.6, c.yellow),
    k.flatCircle(32, 7.4, 1.4, c.amber),
    k.path('M27.6 13.6H36.4L35.4 21C35.2 22.6 34 23.6 32 23.6C30 23.6 28.8 22.6 28.6 21Z', c.blue),
    k.poly([[14.6, 22], [49.4, 22], [58.6, 28.6], [5.4, 28.6]], 1.2, c.wood),
    k.rect(5.4, 28.6, 53.2, 4.4, 1.2, c.woodShade),
  ].join('');
}

/** A room: a wall and a floor, a window, a door, a rug and a plant. */
export function room(k) {
  const c = k.P;
  return [
    k.rect(6, 6, 52, 52, 4, c.wall),
    k.flat('M7 40H57V57H7Z', c.floor),
    k.line('M7 40H57', { color: c.floorShade, sw: 1.4 }),
    k.rect(11, 12, 15, 13, 1.4, c.sky),
    k.line('M18.5 12V25M11 18.5H26', { sw: 1.4 }),
    k.rect(42, 15, 11, 25, 1, c.wood),
    k.flatCircle(44.6, 28.6, 1, c.yellow),
    k.poly([[20, 47], [42, 47], [45, 53], [17, 53]], 1, c.blue),
    k.flat('M21.4 49.4H41.4L42.4 51.2H20.4Z', c.sky),
    k.path('M8.6 46C8.6 40 11 36 14 36C17 36 19.4 40 19.4 46Z', c.green),
    k.rect(10, 44.6, 8, 7.4, 1.2, c.coral),
    k.rect(6, 6, 52, 52, 4, 'none'),
  ].join('');
}

/** A car, going right. */
export function car(k, color = 'red', sign = false) {
  const c = k.P;
  return [
    k.ground(32, 56.6, 24, 2),
    bobbing(
      k,
      [
        sign ? k.rect(26, 15.6, 9, 4.6, 1.2, c.yellowShade) : '',
        k.path('M10.6 46.6V38.6C10.6 36.4 12 34.8 14.2 34.4L19.6 33.4L24.6 24.6C25.6 22.8 27.4 21.6 29.6 21.6H39.6C41.6 21.6 43.4 22.6 44.4 24.4L48.6 32.6L53.4 34C55.6 34.6 57 36.4 57 38.6V46.6Z', c[color]),
        k.path('M22.4 33.6L26.6 25.6C27.2 24.6 28.2 24 29.4 24H33.4V33.6Z', c.sky),
        k.path('M36 24H39.4C40.6 24 41.6 24.6 42.2 25.6L46.2 33.6H36Z', c.sky),
        k.flat('M10.8 41H56.8V46.4H10.8Z', c[`${color}Shade`]),
        k.flatEllipse(55, 38.4, 1.6, 1.2, c.yellow),
        k.line('M34.6 37H38.6', { sw: 1.4 }),
      ].join(''),
    ),
    wheel(k, 20.6, 47.4, 5.4),
    wheel(k, 46.4, 47.4, 5.4),
  ].join('');
}

export function taxi(k) {
  return car(k, 'yellow', true);
}

/** A bed with a blue blanket. */
export function bed(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 26, 2),
    k.rect(6, 16, 7, 40, 2, c.wood),
    k.rect(51, 30, 7, 26, 2, c.wood),
    k.rect(9, 36, 46, 10, 2, c.white),
    k.ellipse(19.6, 32.6, 7.6, 4.4, c.white),
    k.path('M26 34.6C34 32.6 46 32.6 55 34.6V44.6H26Z', c.blue),
    k.flat('M26 42H55V44.4H26Z', c.blueShade),
    k.rect(9, 46, 46, 4, 1, c.woodShade),
  ].join('');
}

/** A wooden chair. */
export function chair(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 16, 2),
    k.rect(19, 36, 4, 21, 1, c.woodShade),
    k.rect(40, 36, 4, 21, 1, c.woodShade),
    k.rect(17, 8, 4.4, 30, 1.6, c.wood),
    k.rect(36.6, 8, 4.4, 30, 1.6, c.wood),
    k.rect(17, 10, 24, 6, 1.6, c.wood),
    k.rect(17, 20, 24, 4, 1.4, c.wood),
    k.poly([[14, 33], [44, 33], [49, 38.6], [19, 38.6]], 1, c.wood),
    k.rect(19, 38.6, 30, 3.6, 1, c.woodShade),
    k.rect(19, 42, 4.4, 15, 1, c.wood),
    k.rect(44.6, 42, 4.4, 15, 1, c.wood),
  ].join('');
}

/** A school: brick walls, a clock on its middle, a Finnish flag on top. */
export function school(k) {
  const c = k.P;
  const windows = [12, 19.6, 40.4, 48].map((x) => pane(k, x, 34, 4.8, 6) + pane(k, x, 44, 4.8, 6)).join('');
  return [
    k.ground(32, 57.6, 27, 2),
    k.line('M32 4V16', { sw: 1.4 }),
    k.rect(32.6, 4.4, 9, 6, 0.4, c.white),
    k.flat('M33.6 6.8H41.4V8H33.6Z', c.blue),
    k.flat('M35 4.8H36.4V10H35Z', c.blue),
    k.rect(8, 28, 48, 28, 1.6, c.coral),
    k.poly([[22, 28], [22, 16], [32, 10.6], [42, 16], [42, 28]], [1, 1.4, 2, 1.4, 1], c.coral),
    k.flat('M48.6 29H55V55H48.6Z', c.coralShade),
    k.circle(32, 20.6, 4.6, c.white),
    k.line('M32 20.6V17.6M32 20.6H34.6', { sw: 1.4 }),
    windows,
    k.path('M27.4 56V45A4.6 4.6 0 0 1 36.6 45V56Z', c.blue),
  ].join('');
}

/** A round leafy tree, swaying a little. */
export function tree(k) {
  return k.g(`translate(${k.frame % 2 ? k.px : 0} 0)`, k.ground(32, 58, 15, 2.2), sceneTree(k, 32, 58, 0.86));
}

/** A forest: three pines of different heights. */
export function forest(k) {
  const c = k.P;
  return [k.flatEllipse(32, 56.6, 28, 3.4, c.grass), pine(k, 16, 55, 34), pine(k, 47, 54, 38), pine(k, 31.4, 58, 46)].join('');
}

/** A basket of blueberries. */
export function basket(k) {
  const c = k.P;
  const berries = [[20, 30.6], [25, 28.4], [30, 30], [35, 28.2], [40, 30], [44, 29], [22.6, 33.4], [32.4, 33], [41.4, 33.4]];
  return [
    k.ground(32, 58.6, 21, 2.2),
    k.limb('M14.6 33C14.6 12 49.4 12 49.4 33', c.wood, 5),
    ...berries.map(([x, y], i) => k.circle(x, y, 3, c.navy) + (i % 2 ? '' : k.flatCircle(x - 0.9, y - 0.9, 0.7, c.white))),
    k.path('M10 33.4H54L50 54.6C49.6 56.4 48.2 57.4 46.4 57.4H17.6C15.8 57.4 14.4 56.4 14 54.6Z', c.wood),
    k.line('M12 39.6H52M13.2 46H50.8M14.4 52H49.6', { color: c.woodShade, sw: 1.4 }),
    k.line('M19 34V57M26.6 34V57M34.4 34V57M42 34V57', { color: c.woodShade, sw: 1.4 }),
    k.rect(8.6, 30.6, 46.8, 4.8, 2, c.wood),
  ].join('');
}

/** A handbag. */
export function bag(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 21, 2.2),
    k.limb('M20 28C20 12 44 12 44 28', c.purpleShade, 4.6),
    k.path('M12.6 27.6H51.4L55 52.6C55.4 55.4 53.6 57.4 50.8 57.4H13.2C10.4 57.4 8.6 55.4 9 52.6Z', c.purple),
    k.flat('M47 28.8H51L54.2 52.8C54.4 54.6 53.4 56 51.6 56.2H48.6C49.6 47 49 37.4 47 28.8Z', c.purpleShade),
    k.line('M12.2 35.6H51.8', { color: c.purpleShade, sw: 1.4 }),
    k.rect(28.4, 32.6, 7.2, 6, 1.6, c.yellow),
    k.shine('M15 41V50', 2),
  ].join('');
}

/** A blue city bus. */
export function bus(k) {
  const c = k.P;
  return [
    k.ground(32, 57, 27, 2),
    bobbing(
      k,
      [
        k.rect(8, 16, 50, 34, 4, c.blue),
        k.flat('M9 41H57V49H9Z', c.blueShade),
        pane(k, 12, 21, 8, 10),
        pane(k, 22.4, 21, 8, 10),
        pane(k, 32.8, 21, 8, 10),
        k.path('M44 21H54.4C55.4 21 56 21.6 56 22.6V40H44Z', c.sky),
        k.line('M50 21V40', { sw: 1.4 }),
        k.rect(8, 34, 36, 3, 0.6, c.white),
        k.flatEllipse(56.4, 45, 1.2, 1.4, c.yellow),
      ].join(''),
    ),
    wheel(k, 19, 50.4, 5),
    wheel(k, 46, 50.4, 5),
  ].join('');
}

/** A green-and-white train on its rails. */
export function train(k) {
  const c = k.P;
  return [
    k.rect(2, 53, 60, 2.6, 0.6, c.brown),
    k.flat('M8 55.6H11V58H8ZM20 55.6H23V58H20ZM32 55.6H35V58H32ZM44 55.6H47V58H44ZM56 55.6H59V58H56Z', c.brownShade),
    bobbing(
      k,
      [
        k.path('M4 48V20C4 17.8 5.8 16 8 16H44C51 16 57 21 59 28L61 36V48C61 49.6 59.6 51 58 51H7C5.4 51 4 49.6 4 48Z', c.white),
        k.flat('M4.6 38H60.6V43H4.6Z', c.green),
        k.path('M48 20.6C52 21.6 55 24.6 56.4 29H48Z', c.sky),
        pane(k, 9, 22, 8, 9),
        pane(k, 20, 22, 8, 9),
        pane(k, 31, 22, 8, 9),
        k.flatEllipse(58.6, 45, 1.4, 1.2, c.yellow),
      ].join(''),
    ),
    k.circle(14, 51.6, 3.2, c.charcoal),
    k.circle(24, 51.6, 3.2, c.charcoal),
    k.circle(46, 51.6, 3.2, c.charcoal),
  ].join('');
}

/** A red rowboat, side on, its oar dipping into the lake, rocking. */
export function boat(k) {
  const c = k.P;
  const dip = k.frame % 2 ? 6 : 0;
  return [
    bobbing(
      k,
      [
        k.path('M6 30H51C54 30 57 28 59 25C59 37 53 47 42 48.6H17C11 48.6 7 42 6 30Z', c.red),
        k.flat('M6.4 30.6H51C53.6 30.6 56.4 29 58.6 26.6L58.4 29.6C56 32.4 53.4 34 50.4 34H6.8Z', c.white),
        k.flat('M49 36C52.6 34.6 55.6 32.4 58.4 29.6C57 39 51.6 46 43.6 48.2C47 45 48.6 40.6 49 36Z', c.redShade),
        k.g(`rotate(${dip} 30 29)`, k.limb('M30 29L14 53', c.wood, 3.8), k.ellipse(13, 54.6, 2.6, 4, c.wood)),
        k.circle(30, 29, 2, c.charcoal),
      ].join(''),
    ),
    waterFront(k, 46.4),
  ].join('');
}

/** A white plane with a blue tail, flying right. */
export function plane(k) {
  const c = k.P;
  const y = k.frame % 2 ? -k.px : 0;
  return [
    puff(k, 12, 54 - y, 0.5, 'white', 'silver'),
    k.g(
      `translate(0 ${y})`,
      k.path('M7 28L4 13H11L20 27Z', c.blue),
      k.path('M6 33H18L13 38H5Z', c.silverShade),
      k.path('M6 30C6 27.6 8 26 10.4 26H47C54 26 59 28.8 59 31.6C59 34.4 54 37.6 47 37.6H10.4C8 37.6 6 36 6 34Z', c.white),
      k.flat('M6.4 33.6H58.4C57.2 35.8 52.8 37.4 47 37.4H10.4C8.4 37.4 6.8 35.8 6.4 33.6Z', c.silver),
      k.path('M24 33H38L28 47H21Z', c.silverShade),
      ...[22, 28, 34, 40].map((x) => k.flatCircle(x, 30.4, 1.3, c.blue)),
      k.path('M50 27.4C53.6 27.8 56.6 29.4 57.6 31H50Z', c.sky),
    ),
  ].join('');
}

/** A big white ferry with a red stripe, steaming along. */
export function ship(k) {
  const c = k.P;
  const f = k.frame % 2;
  return [
    k.ellipse(40 + f * 1.4, 7 - f * 1.4, 3.6 + f, 2.6 + f * 0.6, c.silver),
    bobbing(
      k,
      [
        k.rect(36, 10, 7, 12, 1, c.red),
        k.rect(36, 10, 7, 3, 0.6, c.navy),
        k.rect(14, 20, 38, 9, 1.6, c.white),
        k.rect(18, 13.6, 22, 7.4, 1.4, c.white),
        ...[19, 24, 29, 34].map((x) => k.flatCircle(x, 17.4, 1.2, c.blue)),
        ...[17, 23, 29, 35, 41, 47].map((x) => k.flatCircle(x, 24.6, 1.3, c.blue)),
        k.path('M4 29H60L54 47H10Z', c.white),
        k.flat('M4.8 33.6H58.6L57.4 37.6H6Z', c.red),
        k.flat('M7.4 41H56.6L54.4 46.6H9.6Z', c.navy),
      ].join(''),
    ),
    waterFront(k, 46),
  ].join('');
}

/** A corner shop with a striped awning. */
export function shop(k) {
  const c = k.P;
  const stripes = [0, 1, 2, 3, 4, 5].map((i) => k.flat(`M${fmt(8 + i * 8)} 18H${fmt(12 + i * 8)}V27H${fmt(8 + i * 8)}Z`, c.white)).join('');
  return [
    k.ground(32, 57.6, 26, 2),
    k.rect(9, 22, 46, 34, 1.6, c.cream),
    k.flat('M48 27H54V55H48Z', c.creamShade),
    k.rect(13, 32, 20, 16, 1.4, c.sky),
    k.flatCircle(18, 44, 2.6, c.red),
    k.flatCircle(24, 44.6, 2.6, c.orange),
    k.flatCircle(29, 44, 2.6, c.lime),
    k.rect(38, 33, 12, 23, 1.4, c.green),
    k.flatCircle(47, 45, 1.1, c.yellow),
    k.path('M6 16H58L56 27H8Z', c.red),
    stripes,
    k.path('M6 16H58L56 27H8Z', 'none'),
  ].join('');
}

/** A library: a bookshelf full of books. */
export function library(k) {
  const c = k.P;
  const row = (y, books) => {
    let x = 10;
    return books
      .map(([w, h, color, lean]) => {
        const b = lean
          ? k.g(`rotate(${lean} ${x + w} ${y})`, k.rect(x, y - h, w, h, 0.8, c[color]))
          : k.rect(x, y - h, w, h, 0.8, c[color]) + k.flat(`M${fmt(x + 1.2)} ${fmt(y - h * 0.7)}H${fmt(x + w - 1.2)}V${fmt(y - h * 0.55)}H${fmt(x + 1.2)}Z`, c.white);
        x += w;
        return b;
      })
      .join('');
  };
  return [
    k.ground(32, 58.6, 25, 2),
    k.rect(6, 6, 52, 52, 2, c.wood),
    k.rect(9, 9, 46, 19, 0.6, c.woodShade),
    k.rect(9, 33, 46, 19, 0.6, c.woodShade),
    row(28, [[5, 15, 'red'], [5, 17, 'blue'], [4, 13, 'yellow'], [6, 16, 'green'], [5, 15, 'purple'], [5, 17, 'orange'], [6, 14, 'teal']]),
    row(52, [[6, 16, 'teal'], [5, 14, 'coral'], [5, 17, 'navy'], [6, 15, 'yellow'], [5, 16, 'red'], [6, 13, 'blue', 18]]),
  ].join('');
}

/** A park: a slide on the grass. */
export function park(k) {
  const c = k.P;
  return [
    k.flatEllipse(32, 56, 29, 4.6, c.grass),
    k.limb('M14 56V16M24 56V16', c.blue, 4),
    k.line('M14 24H24M14 32H24M14 40H24M14 48H24', { color: c.blueShade, sw: 2 }),
    k.rect(11, 13, 16, 4, 1.4, c.blue),
    k.path('M24 15H30C34 15 36 17 38 21L50 47C51.6 50.6 54 52 57 52V56H50C47 56 45 54.6 43.6 51.6L32 25C31 23 29.6 22 27.6 22H24Z', c.red),
    k.flat('M33 24L44.6 50.6C45.6 53 47.4 54.6 50 54.8V53.4C48.4 53 47 52 46 50L34.6 23Z', c.redShade),
  ].join('');
}

/** A hospital with a red cross. */
export function hospital(k) {
  const c = k.P;
  const windows = [12, 21.4, 36, 45.4].map((x) => pane(k, x, 27, 6.6, 6.6, 0.6) + pane(k, x, 37.4, 6.6, 6.6, 0.6)).join('');
  return [
    k.ground(32, 57.6, 26, 2),
    k.rect(8, 18, 48, 38, 1.6, c.white),
    k.flat('M48.6 19H55V55H48.6Z', c.silver),
    k.rect(25, 8, 14, 14, 1.6, c.white),
    k.flat('M30.4 10H33.6V20H30.4ZM27 13.4H37V16.6H27Z', c.red),
    windows,
    k.path('M26 56V46H38V56Z', c.sky),
    k.line('M32 46V56', { sw: 1.4 }),
  ].join('');
}

/** A railway station with a clock tower. */
export function station(k) {
  const c = k.P;
  return [
    k.ground(32, 57.6, 27, 2),
    k.rect(39, 6, 12, 30, 1.4, c.silverShade),
    k.circle(45, 15, 3.8, c.white),
    k.line('M45 15V12.6M45 15H47', { sw: 1.4 }),
    k.poly([[38, 7], [45, 2], [52, 7]], 1, c.green),
    k.rect(6, 26, 50, 30, 1.6, c.silver),
    k.path('M17 56V42C17 36 21 32 27 32C33 32 37 36 37 42V56Z', c.sky),
    k.line('M27 32V56M17 44H37', { sw: 1.4 }),
    k.rect(42, 40, 9, 16, 1.4, c.wood),
    k.flat('M6.6 26.6H55.4V29.6H6.6Z', c.green),
  ].join('');
}

/** A museum: steps, columns and a pediment. */
export function museum(k) {
  const c = k.P;
  const columns = [14, 23, 32, 41, 50].map((x) => k.rect(x - 2.6, 27, 5.2, 21, 0.8, c.cream)).join('');
  return [
    k.ground(32, 58.6, 28, 2),
    k.poly([[32, 8], [58, 21], [6, 21]], [2, 1.4, 1.4], c.cream),
    k.flat('M32 12.6L49 20H15Z', c.creamShade),
    k.rect(7, 21, 50, 6, 1, c.cream),
    columns,
    k.rect(6, 48, 52, 4.6, 1, c.creamShade),
    k.rect(3, 52.6, 58, 4.6, 1, c.cream),
  ].join('');
}

/** A restaurant: a plate set with a fork and a knife. */
export function restaurant(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 25, 2),
    k.ellipse(32, 38, 17, 15.4, c.white),
    k.flatEllipse(32, 38, 11, 10, c.silver),
    k.flatEllipse(31, 37, 9.4, 8.6, c.white),
    k.line('M5 11V20M7.8 11V20M10.6 11V20', { color: c.silverShade, sw: 1.4 }),
    k.limb('M5 20Q7.8 24 10.6 20', c.silverShade, 3.8),
    k.limb('M7.8 22V57', c.silverShade, 4.4),
    k.path('M54.6 11C57.6 13 58.6 20 57.8 30H54.6Z', c.silverShade),
    k.limb('M56.2 30V57', c.silverShade, 4.4),
  ].join('');
}

/** A café: a cup of coffee, steaming, and a cinnamon bun. */
export function cafe(k) {
  const c = k.P;
  return [
    k.ground(28, 58.6, 25, 2),
    wisps(k, [22, 30], 24),
    k.ellipse(27, 50.6, 21, 5.4, c.white),
    k.limb('M41 33C47.6 33 47.6 43 41 43', c.white, 5),
    k.path('M12 28H42V40C42 47 37 52 30 52H24C17 52 12 47 12 40Z', c.white),
    k.ellipse(27, 28.6, 15, 3.4, c.brown),
    k.flat('M37.4 31H41.6V40C41.6 45.6 38.6 50 34 51.4C36.6 47.4 37.6 41 37.4 31Z', c.silver),
    k.ellipse(52, 50, 8.4, 6.4, c.tan),
    k.line('M46 49Q49 45.4 52.6 47.6Q55.4 50 52.4 52.4', { color: c.brown, sw: 1.6 }),
  ].join('');
}

/** A city: tall buildings with lit windows. */
export function city(k) {
  const c = k.P;
  const lights = (x0, y0, cols, rows, dx = 5, dy = 6) => {
    const out = [];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) out.push(k.flat(`M${fmt(x0 + i * dx)} ${fmt(y0 + j * dy)}h2.6v3h-2.6Z`, c.yellow));
    return out.join('');
  };
  return [
    k.rect(5, 26, 14, 31, 1, c.silverShade),
    lights(8, 30, 2, 4),
    k.rect(42, 18, 14, 39, 1, c.grey),
    lights(45, 22, 2, 5),
    k.rect(17, 10, 16, 47, 1, c.blueShade),
    lights(20, 14, 2, 7),
    k.rect(30, 30, 14, 27, 1, c.skyShade),
    lights(33, 34, 2, 3),
    k.flat('M3 56.6H61V58H3Z', c.charcoal),
  ].join('');
}

/** A market stall: a striped awning over crates of fruit and carrots. */
export function market(k) {
  const c = k.P;
  const stripes = [0, 1, 2, 3, 4, 5].map((i) => k.flat(`M${fmt(6 + i * 9)} 8H${fmt(10.6 + i * 9)}V19H${fmt(6 + i * 9)}Z`, c.white)).join('');
  return [
    k.ground(32, 58.6, 27, 2),
    k.limb('M9 18V57M55 18V57', c.wood, 3.8),
    k.path('M5 8H59L56 19H8Z', c.red),
    stripes,
    k.path('M5 8H59L56 19H8Z', 'none'),
    ...[15, 21, 27].map((x, i) => k.circle(x, 36, 3, c.red) + (i < 2 ? k.circle(x + 3, 32.6, 3, c.red) : '')),
    k.rect(10, 37, 22, 10, 1.2, c.wood),
    ...[37, 41, 45, 49].map((x) => k.g(`rotate(-20 ${x} 34)`, k.ellipse(x, 34, 1.8, 4.4, c.orange))),
    k.rect(33, 37, 21, 10, 1.2, c.wood),
    k.rect(8, 47, 48, 10, 1.2, c.woodShade),
  ].join('');
}

/** The zoo: a giraffe looking over its fence. */
export function zoo(k) {
  const c = k.P;
  const flick = k.frame % 2 ? -16 : 0;
  return [
    k.path('M25 58V30C25 24 27 19 30 15L37 17C35 21 33.6 26 33.6 31V58Z', c.yellow),
    k.flat('M26 40H31.6L31 45.6H26Z', c.brown),
    k.flat('M28 28.6H33L32.4 33.6H27.4Z', c.brown),
    k.flat('M30 20H34.6L33.4 24H29Z', c.brown),
    k.flat('M25.6 50H32.6V54H25.6Z', c.brown),
    k.limb('M31.6 9V4.6M37 9V4.6', c.brown, 3.8),
    k.g(`rotate(${flick} 28 12)`, k.ellipse(24.6, 11.6, 4, 2, c.yellow)),
    k.path('M28 12C28 7.6 32 6.4 36 7.4L46 10.6C50 12 51.6 15 50.6 18C49.6 21 46 21.6 42.6 20.6L33 18C29.6 17 28 15 28 12Z', c.yellow),
    k.flat('M43 12.6C46 13.4 49 14.6 50.6 17.4C49.6 20.4 46.6 21.2 43.4 20.4Z', c.tan),
    k.flatCircle(48, 15.4, 0.9, c.ink),
    k.eye(35.4, 11.4, 2.2),
    k.rect(4, 42, 56, 3.6, 0.8, c.wood),
    k.rect(4, 50, 56, 3.6, 0.8, c.wood),
    ...[8, 20, 44, 56].map((x) => k.rect(x - 2, 38, 4, 20, 1, c.woodShade)),
  ].join('');
}

/** A sports field with its lines and a goal. */
export function field(k) {
  const c = k.P;
  return [
    k.path('M14 18H50L60 56H4Z', c.grass),
    k.flat('M14.4 19H22L18 55.4H6Z', c.grassShade),
    k.flat('M30 19H38L40 55.4H28Z', c.grassShade),
    k.flat('M46 19H50.2L59.4 55.4H52Z', c.grassShade),
    k.line('M32 18.6V56M15.6 25H48.4M11 42H53', { color: c.white, sw: 1.4 }),
    k.line('M24.6 46C24.6 50 39.4 50 39.4 46', { color: c.white, sw: 1.4 }),
    k.limb('M24 18V8H40V18', c.white, 3.8),
    k.line('M26 10H38M26 13H38M26 16H38', { color: c.silverShade, sw: 1 }),
  ].join('');
}

/** A bedroom at night: someone fast asleep, a Z floating up. */
export function bedroom(k) {
  const c = k.P;
  const z = (x, y, s) => k.line(`M${pt([x, y])}h${fmt(s)}l${fmt(-s)} ${fmt(s)}h${fmt(s)}`, { sw: 1.6 });
  const f = k.frame % 3;
  return [
    k.rect(6, 6, 52, 52, 4, c.wall),
    k.flat('M7 46H57V57H7Z', c.floor),
    k.rect(38, 10, 15, 13, 1.4, c.skyNight),
    k.flatCircle(47, 15, 2.6, c.starlight),
    k.flatCircle(48.6, 13.8, 2.2, c.skyNight),
    k.rect(8, 26, 5, 26, 1.2, c.wood),
    k.rect(10, 38, 44, 10, 1.6, c.white),
    k.circle(20, 33.4, 6.4, c.skin2),
    k.path('M13.8 31.6C13.4 26 26.6 26 26.2 31.6C23 29.6 17 29.6 13.8 31.6Z', c.hazel),
    k.sleepyEye(20, 34.4, 3.4),
    k.path('M24.4 35.4C33 32.6 45 32.6 54 35.4V47H24.4Z', c.blue),
    k.flat('M24.6 44.4H53.6V46.6H24.6Z', c.blueShade),
    k.rect(10, 48, 44, 3.6, 0.8, c.woodShade),
    z(28 + f * 2.4, 22 - f * 3.4, 3.8 + f * 0.8),
    f > 0 ? z(24, 25.4, 3) : '',
    k.rect(6, 6, 52, 52, 4, 'none'),
  ].join('');
}

/** A bathroom: a bathtub full of bubbles, a duck on top. */
export function bathroom(k) {
  const c = k.P;
  const f = k.frame % 2;
  const bubbles = f ? [[18, 27, 3.6], [26, 25, 4.2], [34, 26.4, 3.4], [44, 27, 3.8], [22, 19, 2], [40, 18, 2.4]] : [[18, 27.4, 3.4], [26, 25.4, 4.4], [34, 26, 3.6], [44, 27.4, 3.6], [24, 16, 2.2], [42, 20, 2]];
  return [
    k.ground(32, 58.6, 26, 2),
    k.limb('M52 30V12C52 9 49 8 46 9', c.silverShade, 3.8),
    k.ellipse(45, 10.4, 2.6, 1.4, c.silverShade),
    ...bubbles.map(([x, y, r]) => k.circle(x, y, r, c.white)),
    k.ellipse(36.4, 26.6, 3.6, 3, c.yellow),
    k.ellipse(36, 22.6, 2.4, 2.2, c.yellow),
    k.flatEllipse(38.6, 23, 1.4, 0.8, c.orange),
    k.path('M6 30H58V38C58 46 52 52 44 52H20C12 52 6 46 6 38Z', c.white),
    k.flat('M48 31H57.4V38C57.4 45 52.4 50.6 45 51.4C49.4 46.6 49.6 38.6 48 31Z', c.silver),
    k.rect(4, 28, 56, 4, 1.4, c.white),
    k.limb('M14 52L12 57M50 52L52 57', c.silverShade, 3.8),
  ].join('');
}

/** A sofa with two cushions. */
export function sofa(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 27, 2),
    k.rect(10, 18, 44, 22, 4, c.teal),
    k.rect(12, 33, 20, 10, 2.4, c.teal),
    k.rect(32, 33, 20, 10, 2.4, c.teal),
    k.rect(4, 26, 9, 24, 3, c.tealShade),
    k.rect(51, 26, 9, 24, 3, c.tealShade),
    k.rect(8, 43, 48, 8, 2, c.tealShade),
    k.rect(10, 51, 4, 5, 1, c.woodShade),
    k.rect(50, 51, 4, 5, 1, c.woodShade),
    k.g('rotate(-12 18 28)', k.rect(13, 22, 11, 10, 2.6, c.yellow)),
  ].join('');
}

/** A yard: a little house behind a picket fence, a tree by it. */
export function yard(k) {
  const c = k.P;
  const pickets = [6, 13, 20, 27, 34, 41, 48, 55].map((x) => k.poly([[x - 2.6, 56], [x - 2.6, 42], [x, 39], [x + 2.6, 42], [x + 2.6, 56]], [0.6, 0.6, 0.8, 0.6, 0.6], c.white)).join('');
  return [
    k.flatEllipse(32, 55, 30, 5.4, c.grass),
    k.g('translate(4 2) scale(0.66)', house(k)),
    sceneTree(k, 52, 46, 0.5),
    k.rect(2, 45, 60, 3, 0.6, c.white),
    pickets,
  ].join('');
}

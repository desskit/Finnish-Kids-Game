// The Finnish year: Christmas (joulu's presents under a spruce garland,
// joulupukki with his sack, a tonttu waving), Easter (a chick hatching, a
// little Easter witch, willow catkins) and Midsummer (the flag flying by the
// lake, the bonfire). The Christmas tree is in props.mjs, the snowman in
// time.mjs; the cottage and the sauna are places, the bun and the blueberries
// food.

import { fmt, pt, roundPoly, starPoints } from './kit.mjs';
import { CAST, hand, person, POSES } from './people.mjs';

/** A four-pointed sparkle (nothing when r is 0). */
const sparkle = (k, x, y, r, color = 'yellow') => (r ? k.flat(roundPoly(starPoints(x, y, r, r * 0.34, 4), 0.3), k.P[color]) : '');

/** A wrapped present at (x, y), w × h: the box, its ribbon both ways and a bow on top. */
export function present(k, x, y, w, h, box, ribbon) {
  const c = k.P;
  const mx = x + w / 2;
  return [
    k.rect(x, y, w, h, 1.6, c[box]),
    k.flat(`M${fmt(x + w - 4.4)} ${fmt(y + 1)}H${fmt(x + w - 1)}V${fmt(y + h - 1)}H${fmt(x + w - 4.4)}Z`, c[`${box}Shade`]),
    k.rect(mx - 2.2, y, 4.4, h, 0.4, c[ribbon]),
    k.rect(x, y + h * 0.45 - 2.2, w, 4.4, 0.4, c[ribbon]),
    k.ellipse(mx - 4.4, y - 2.8, 4.4, 3, c[ribbon]),
    k.ellipse(mx + 4.4, y - 2.8, 4.4, 3, c[ribbon]),
    k.circle(mx, y - 1.8, 2, c[ribbon]),
  ].join('');
}

/** A bauble hanging from (x, y) on its string: a cap and a shine. */
function bauble(k, x, y, r, color) {
  const c = k.P;
  return [
    k.line(`M${fmt(x)} ${fmt(y)}V${fmt(y + 4)}`, { color: c.charcoal, sw: 1.4 }),
    k.circle(x, y + 4 + r, r, c[color]),
    k.rect(x - 2, y + 3, 4, 2.6, 0.6, c.amber),
    k.shine(`M${fmt(x - r * 0.5)} ${fmt(y + 4 + r * 0.6)}Q${fmt(x - r * 0.4)} ${fmt(y + 4 + r * 0.2)} ${fmt(x)} ${fmt(y + 4 + r * 0.1)}`, 1.6),
  ].join('');
}

/** Christmas (joulu): a spruce garland across the top with two baubles hanging from it, and two presents under it. A sparkle twinkles. */
export function christmas(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 2 : 0;
  // the garland: a branch with its needles hanging in points
  let fringe = 'M-1 4.6';
  for (let x = -1; x < 64; x += 6) fringe += `L${fmt(x + 3)} ${x % 12 === 5 ? 13.4 : 12}L${fmt(x + 6)} 5.6`;
  fringe += 'V-1H-1Z';
  return [
    k.ground(32, 58.6, 25, 2.2),
    k.path(fringe, c.green),
    k.flat('M-1 4.6H65V7.4H-1Z', c.greenShade),
    bauble(k, 17, 11.4, 5, 'red'),
    bauble(k, 45, 11.4, 4.4, 'blue'),
    present(k, 7, 34, 28, 22, 'red', 'amber'),
    present(k, 36.6, 40, 21, 16, 'green', 'red'),
    sparkle(k, 31, 22, f ? 3.4 : 2.4, 'amber'),
    f ? sparkle(k, 57, 26, 2.4, 'amber') : '',
  ].join('');
}

/** Joulupukki: a white beard, a red coat and trousers. */
const SANTA = { skin: 'skin1', hair: { style: 'beard', color: 'white' }, top: { kind: 'shirt', color: 'red' }, bottom: { kind: 'trousers', color: 'red' }, shoes: 'charcoal' };

/** Santa's hat over a standing person's head: the red cap flopping to the side, its white fur band, a white pompom. */
function santaHat(k) {
  const c = k.P;
  return [
    k.path('M19.4 11.6C19.8 3.6 27.6 -0.4 37.6 1C44.6 2 49.6 6.6 52 13.4L47.6 14.6C46.4 11 43.4 8.6 40.2 8C41.6 9.6 43.2 11 44.6 11.8Z', c.red),
    k.flat('M41.4 3.2C45.4 4.6 48.6 7.6 50.4 11.8L48 12.4C46.6 9 44.4 6.6 41.4 5.4Z', c.redShade),
    k.rect(17.2, 9, 29.6, 5.6, 2.8, c.white),
    k.circle(51.4, 15.6, 3.4, c.white),
  ].join('');
}

/** Joulupukki: Santa in his red coat and hat, his white beard, a belt with a gold buckle; one hand holds the sack over his shoulder, the other waves. */
export function santa(k) {
  const c = k.P;
  const wave = k.frames > 1 && k.frame % 2 ? [[38.4, 34.8], [46.6, 29.4], [50.4, 23.4]] : [[38.4, 34.8], [45.4, 29.6], [47.6, 22.4]];
  return [
    // the sack, slung over his back
    k.path('M11.6 18.6C4.6 24 3.6 40 11.6 45.6C17.6 49.6 24.6 44.6 24.6 34.6C24.6 27.6 21.6 21.6 16.6 18.6Z', c.tan),
    k.flat('M7.4 32C7.4 38.6 9.4 43 13.4 45C10.4 41.6 8.8 37.4 8.6 32Z', c.tanShade),
    person(k, SANTA, { ...POSES.stand, face: 'laugh', armsInFront: false, armBack: [[25.6, 34.8], [19.4, 28.6], [16.6, 21.6]], armFront: wave }),
    k.rect(22.6, 40.2, 18.8, 3.8, 0.6, c.charcoal),
    k.rect(29.6, 39.6, 4.8, 5, 0.8, c.amber),
    k.flat('M31.2 41.2H32.8V43.4H31.2Z', c.charcoal),
    k.flat('M23 45.6H41V47.2H23Z', c.white),
    santaHat(k),
  ].join('');
}

/** A tonttu: a small elf with a ginger tuft and freckles, in a grey tunic. */
const ELF = { skin: 'skin1', hair: { style: 'short', color: 'ginger' }, top: { kind: 'shirt', color: 'grey' }, bottom: { kind: 'trousers', color: 'red' }, shoes: 'charcoal', freckles: true };

/** The tonttu's tall pointed cap, its tip flopping over to the side, a white pompom; no fur band. */
function elfCap(k) {
  const c = k.P;
  return [
    k.path('M18.6 14C17.6 6 24.6 2.4 31.6 1.2C38.6 0 46 1.6 50.6 6.8L54.6 4.6L56.6 8.6L50.4 11.4C47 8.8 43 8.4 40.4 9.6C43 10.6 45 12.4 46 14.6Z', c.red),
    k.flat('M40.4 2.6C44.6 3 48 4.6 50.6 6.8L51.6 9.4C48.6 7 45 5.6 41 5.4Z', c.redShade),
    k.circle(57, 6.6, 3.2, c.white),
  ].join('');
}

/** Tonttu: a little Christmas elf in his pointed red cap, waving. */
export function elf(k) {
  const wave = k.frames > 1 && k.frame % 2 ? [[38.4, 34.8], [45.6, 31.4], [49.4, 25.6]] : [[38.4, 34.8], [44.6, 31], [46.4, 24.6]];
  return [person(k, ELF, { ...POSES.stand, face: 'grin', armFront: wave }), elfCap(k)].join('');
}

/** Easter (pääsiäinen): a yellow chick hatching from its shell (bobbing up), a painted egg beside it. */
export function easter(k) {
  const c = k.P;
  const up = k.frames > 1 && k.frame % 2 ? -1.4 * k.px : 0;
  let rim = 'M10.4 41';
  [[13.6, 37], [17.4, 41.4], [21.4, 36.6], [25.4, 41.4], [29.4, 36.6], [33.2, 41.2], [36.6, 37.6]].forEach(([x, y]) => (rim += `L${x} ${y}`));
  return [
    k.ground(30, 58.6, 25, 2.2),
    // the painted egg, right: pink, a zigzag band and dots
    k.ellipse(48.6, 44, 9, 11.6, c.pink),
    k.flat('M40 43.2L43 40.6L46 43.2L49 40.6L52 43.2L55 40.6L57.4 42.6V45.6L55 43.6L52 46.2L49 43.6L46 46.2L43 43.6L40 46.2Z', c.white),
    k.flatCircle(45, 35.6, 1.3, c.purple),
    k.flatCircle(51.6, 36.6, 1.3, c.purple),
    k.flatCircle(48.6, 51.6, 1.3, c.purple),
    k.shine('M42.6 37Q43.4 34 45.6 33', 1.6),
    // the chick, its top shell on its head
    k.g(
      `translate(0 ${fmt(up)})`,
      k.circle(23.6, 33.4, 11, c.yellow),
      k.flat('M30.6 26.4C33.6 29 34.6 33.6 33.4 37.6L30.4 38.6C31.6 34.6 31.6 30 30.6 26.4Z', c.yellowShade),
      k.eye(19.6, 31.6, 1.6),
      k.eye(27.6, 31.6, 1.6),
      k.blush(17, 35.6, 1.6, 1),
      k.blush(30.2, 35.6, 1.6, 1),
      k.poly([[21.4, 35.4], [25.8, 35.4], [23.6, 38.6]], 0.5, c.orange),
      k.path('M14 25.4C15 19.4 19.4 16.4 23.6 16.4C27.8 16.4 32.2 19.4 33.2 25.4L30.4 23.4L27.6 26L24.4 22.8L21.4 26L18.6 23L16 25.6Z', c.cream),
    ),
    // the bottom of the shell, its jagged rim
    k.path(`${rim}V48.6C36.6 54.6 31.6 57.6 23.6 57.6C15.6 57.6 10.4 54.6 10.4 48.6Z`, c.cream),
    k.flat('M31.4 41.6L33.2 42L36 39V48.6C36 52.6 33.6 55.4 29.6 56.6C32.4 54 33.4 50.6 33.4 46.6Z', c.creamShade),
  ].join('');
}

/** Aino as an Easter witch: freckles painted on. */
const WITCH = { ...CAST.aino, freckles: true };

/** Noita: a little Easter witch — Aino in a polka-dot headscarf knotted under her chin, freckles painted on, holding her broom. */
export function witch(k) {
  const c = k.P;
  const grip = [45.6, 39.6];
  const dots = [[24, 9.6], [31.6, 7.4], [39.4, 9.6], [19.6, 17.4], [44.4, 17.4], [21, 26.6], [43, 26.6]];
  return [
    // the broom, behind her: its handle, its twigs on the ground
    k.limb('M51.6 6.6L45.4 50', c.wood, 3.8),
    k.path('M40.4 48.6H51.6L54.6 59H37.4Z', c.amber),
    k.line('M42.6 51V58.4M46 51V58.6M49.4 51V58.4', { color: c.amberShade, sw: 1.4 }),
    k.rect(39.8, 46.6, 12.4, 3.4, 1, c.red),
    person(k, WITCH, { ...POSES.stand, face: 'grin', armFront: [[38.4, 34.8], [42.6, 41.6], grip] }),
    // the headscarf: over her hair and down her cheeks, knotted under her chin
    k.path('M17.6 30C15.4 20 18.4 6.8 32 6.4C45.6 6.8 48.6 20 46.4 30L42.6 30.4C43.6 22.6 41.4 13.8 32 13.4C22.6 13.8 20.4 22.6 21.4 30.4Z', c.coral),
    ...dots.map(([x, y]) => k.flatCircle(x, y, 1.2, c.white)),
    k.poly([[28.4, 31.6], [35.6, 31.6], [32, 36.4]], 0.8, c.coral),
    hand(k, grip, 'skin1'),
  ].join('');
}

/** Willow catkins (pajunkissa): three twigs in a little jar, the soft grey catkins along them. */
export function catkin(k) {
  const c = k.P;
  const twigs = ['M31.4 46Q29.4 26 21 6.4', 'M32.6 46Q33.4 25 34.4 4.6', 'M33.6 46Q37.4 28 47 10.4'];
  const buds = [
    [27.4, 33, -12],
    [24.8, 22.6, -18],
    [22.6, 13, -22],
    [32, 31, 0],
    [33.2, 20.4, 0],
    [34, 10, 0],
    [36.8, 33.4, 18],
    [40, 24.6, 24],
    [44, 16, 28],
  ];
  return [
    k.ground(32, 58.6, 14, 2.2),
    ...twigs.map((d) => k.limb(d, c.brown, 3.8)),
    ...buds.map(([x, y, a]) => k.g(`rotate(${a} ${x} ${y})`, k.ellipse(x, y, 3, 4.4, c.silver), k.flatEllipse(x - 0.8, y - 1, 1, 1.8, c.white))),
    k.path('M21.6 41.6H42.4L40 57.6H24Z', c.sky),
    k.flat('M37 43.6H41.6L39.2 55.6H35.4Z', c.skyShade),
    k.shine('M25 45V52', 1.6),
  ].join('');
}

/** The Finnish flag on a pole from (x, top), flying to the right; its free end waves. */
function flag(k, x, top, w, h, wave) {
  const c = k.P;
  const r = x + w;
  return [
    k.limb(`M${x} ${top - 2}V60`, c.silver, 3.8),
    k.circle(x, top - 3, 2, c.amber),
    k.path(`M${x + 1.6} ${top}H${r}Q${r + 1} ${fmt(top + h / 2 + wave)} ${r} ${top + h}H${x + 1.6}Z`, c.white),
    k.flat(`M${x + 1.6 + w * 0.3} ${top + 0.6}H${x + 1.6 + w * 0.3 + 4.4}V${top + h - 0.6}H${x + 1.6 + w * 0.3}Z`, c.blue),
    k.flat(`M${x + 2} ${top + h / 2 - 2.2}H${r - 0.4}V${top + h / 2 + 2.2}H${x + 2}Z`, c.blue),
  ].join('');
}

/** Midsummer (juhannus): the Finnish flag flying by the lake, a birch on the shore, the sun low over the water. */
export function midsummer(k) {
  const c = k.P;
  const wave = k.frames > 1 && k.frame % 2 ? 2.6 : -1.4;
  return [
    // the sun low over the lake, the water, the shore
    k.circle(51, 41.6, 8, c.orange),
    k.path('M-1 41.6H65V65H-1Z', c.water),
    k.line('M40 47H58M44 51H54M6 47H14', { color: c.white, sw: 1.4 }),
    k.path('M-1 49.6C10 45.6 22 46 32 50.4C36 52.4 38 55 38.6 58H-1Z', c.grass),
    // a birch on the shore: its white trunk with dark marks, a round green crown
    k.rect(10, 22, 5.6, 30, 1.6, c.white),
    k.flat('M10.8 30H13.6V32H10.8ZM12.8 38H15V40H12.8ZM10.8 45H13.4V47H10.8Z', c.charcoal),
    k.ellipse(12.8, 16, 11.6, 13, c.lime),
    k.flatEllipse(17.4, 20.4, 5.6, 7.4, c.limeShade),
    flag(k, 28.6, 8, 22, 15, wave),
  ].join('');
}

/** Kokko: a Midsummer bonfire — a tall pile of logs ablaze by the lake, sparks flying up. */
export function bonfire(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 3 : 0;
  const [lean, tipY] = [[0, 4.6], [2.6, 6.4], [-2.4, 5.4]][f];
  const flame = (top, w, bottom) =>
    `M${pt([32 + lean, top])}C${pt([32 + w * 0.5, top + (bottom - top) * 0.3])} ${pt([32 + w, top + (bottom - top) * 0.46])} ${pt([32 + w, top + (bottom - top) * 0.72])}C${pt([32 + w, bottom - 2])} ${pt([32 + w * 0.5, bottom])} ${pt([32, bottom])}C${pt([32 - w * 0.5, bottom])} ${pt([32 - w, bottom - 2])} ${pt([32 - w, top + (bottom - top) * 0.72])}C${pt([32 - w, top + (bottom - top) * 0.5])} ${pt([32 - w * 0.4, top + (bottom - top) * 0.32])} ${pt([32 + lean, top])}Z`;
  const sparks = [[18, 16], [46, 12], [40, 4.4], [24, 6]].map(([x, y], i) => k.flatCircle(x + ((f + i) % 2) * 1.4, y - ((f + i) % 3) * 2.6, 1.3, c.amber));
  return [
    // the lake behind, the shore under the pile
    k.path('M-1 44H65V65H-1Z', c.water),
    k.line('M2 50H12M50 49H62M54 54H62', { color: c.white, sw: 1.4 }),
    k.path('M6 58.6C10 50.6 20 48.6 32 48.6C44 48.6 54 50.6 58 58.6Z', c.grey),
    // the pile of logs, leaning together
    k.limb('M14 54L28 26', c.brown, 5.6),
    k.limb('M50 54L36 26', c.brown, 5.6),
    k.limb('M24 55L31 22', c.wood, 5.6),
    k.limb('M40 55L33 22', c.wood, 5.6),
    k.path(flame(tipY, 15, 50), c.orange),
    k.flat(flame(tipY + 13, 10, 50), c.amber),
    k.flat(flame(tipY + 24, 5.6, 50), c.yellow),
    k.limb('M10 56L54 48', c.brown, 5.6),
    ...sparks,
  ].join('');
}

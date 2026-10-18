// Verbs. Most are Leo (the "action kid") doing them, in a short loop whose
// first frame is the clearest moment (it's the still picture too). The
// feelings (smile, cry, laugh, like, sleep) are the round yellow face; a few
// are the thing their emoji shows, at work: an hourglass running, scissors
// cutting, a padlock springing open, a speech bubble.

import { arcPath, fmt, heartPath, polar, pt, roundPoly, starPoints } from './kit.mjs';
import { cheeks, faceBase, tear } from './faces.mjs';
import { steam } from './food.mjs';
import { note } from './freetime.mjs';
import { fire as campfire } from './nature.mjs';
import { arm, CAST, hand, person, placed, poseAt, portrait, POSES, runPose, walkPose } from './people.mjs';

const leo = (k, pose) => person(k, CAST.leo, { ...POSES.stand, ...pose });

/** A pose moved down by dy (up when negative), arms and legs too: a hop, or sinking into water. */
function lifted(pose, dy) {
  const mv = (pts) => pts.map(([x, y]) => [x, y + dy]);
  const base = { ...POSES.stand, ...pose };
  return { ...base, bob: (base.bob ?? 0) + dy, armBack: mv(base.armBack), armFront: mv(base.armFront), legBack: mv(base.legBack), legFront: mv(base.legFront) };
}

/** A wavy water line across the picture at height y (moved along by `shift`), as the start of a path. */
function waves(y, amp, len, shift) {
  let d = `M${fmt(-len - 2 + shift)} ${fmt(y)}`;
  for (let x = -len - 2 + shift, i = 0; x < 66; x += len, i++) d += `Q${fmt(x + len / 2)} ${fmt(y + (i % 2 ? 2 : -2) * amp)} ${fmt(x + len)} ${fmt(y)}`;
  return d;
}

/** A line of scribbled writing from x0 to x1 at height y. */
function scribble(x0, y, x1) {
  let d = `M${fmt(x0)} ${fmt(y)}`;
  for (let x = x0, i = 0; x < x1 - 0.2; x += 2.4, i++) d += `Q${fmt(Math.min(x + 1.2, x1))} ${fmt(y + (i % 2 ? 1.2 : -1.2))} ${fmt(Math.min(x + 2.4, x1))} ${fmt(y)}`;
  return d;
}

/** A Z (for sleep), s across. */
const zed = (k, x, y, s) => k.line(`M${pt([x, y])}h${fmt(s)}l${fmt(-s)} ${fmt(s)}h${fmt(s)}`, { color: k.P.navy, sw: 1.6 });

/** A four-pointed sparkle. */
const sparkle = (k, x, y, r, color = 'yellow') => k.flat(roundPoly(starPoints(x, y, r, r * 0.34, 4), 0.3), k.P[color]);

/** A wheel: a dark tyre and a silver hub. */
const wheel = (k, x, y, r) => k.circle(x, y, r, k.P.charcoal) + k.flatCircle(x, y, r * 0.42, k.P.silver);

/** A ring (a circle drawn as a chunky line). */
const ringPath = (x, y, r) => `M${pt([x - r, y])}A${fmt(r)} ${fmt(r)} 0 1 0 ${pt([x + r, y])}A${fmt(r)} ${fmt(r)} 0 1 0 ${pt([x - r, y])}`;

// --- Eating, sleeping, playing ------------------------------------------------

/** Eat: Leo eating soup, the spoonful going to his open mouth, then back to the bowl. */
export function eat(k) {
  const c = k.P;
  const up = k.frame % 2 === 0;
  const h = up ? [39.4, 33.4] : [38.4, 39.4];
  const tip = up ? [35, 29.6] : [32, 42];
  const spoon = k.limb(`M${pt(h)}L${pt(tip)}`, c.silver, 4) + k.ellipse(tip[0], tip[1], 3, 2.2, c.silver) + (up ? k.flatEllipse(tip[0], tip[1] - 0.2, 1.8, 1, c.orange) : '');
  return [
    leo(k, {
      face: up ? 'o' : 'grin',
      armBack: [[25.6, 34.8], [20, 42.4], [21.4, 46.4]],
      armFront: up ? [[38.4, 34.8], [46, 39.4], h] : [[38.4, 34.8], [45, 42.4], h],
    }),
    up ? '' : spoon,
    k.path('M18.6 42.6H41.4C41.4 49.4 36.4 54 30 54C23.6 54 18.6 49.4 18.6 42.6Z', c.white),
    k.flat('M34.6 43.6H40.2C39.8 48.6 37.4 52 33 53.2C35.6 50.4 35.4 46.8 34.6 43.6Z', c.silver),
    k.ellipse(30, 42.6, 11.4, 2.6, c.orange),
    k.flat('M25 42.2H28.4V43.2H25Z', c.amber),
    up ? spoon : '',
    hand(k, [21.4, 46.4]),
    hand(k, h),
  ].join('');
}

/** Drink: Leo sipping juice through a bendy straw, the glass emptying. */
export function drink(k) {
  const c = k.P;
  const level = [34.4, 38, 41.6][k.frame % 3];
  return [
    leo(k, {
      face: 'smile',
      armBack: [[25.6, 34.8], [23, 42.4], [31.4, 45.6]],
      armFront: [[38.4, 34.8], [45.4, 40], [41.4, 44.6]],
    }),
    k.limb('M38.2 36V29.4Q38.2 27.6 36.4 27.6H33.4', c.red, 4),
    k.rect(30.4, 32.4, 11.6, 15.4, 1.8, c.silver),
    k.flat(`M31.4 ${fmt(level)}H41V45.6C41 46.4 40.4 46.8 39.6 46.8H32.8C32 46.8 31.4 46.4 31.4 45.6Z`, c.orange),
    k.shine('M33 35V40', 1.4),
    hand(k, [31.4, 45.6]),
    hand(k, [41.4, 44.6]),
  ].join('');
}

/** Sleep: the face fast asleep, its Zs floating up. */
export function sleep(k) {
  const c = k.P;
  const n = [3, 1, 2][k.frame % 3];
  const zs = [
    [48.8, 10.6, 3],
    [52.4, 5.4, 3.8],
    [56.4, 0.6, 4.6],
  ].slice(0, n);
  return [
    faceBase(k),
    k.sleepyEye(24.4, 28.6, 7),
    k.sleepyEye(39.6, 28.6, 7),
    cheeks(k),
    k.ellipse(32, 42, 3, 2.6, c.mouth, { sw: 1.5 }),
    ...zs.map(([x, y, s]) => zed(k, x, y, s)),
  ].join('');
}

/** Play: Leo playing with a yo-yo, down and up again. */
export function play(k) {
  const c = k.P;
  const drop = [8, 13, 8, 3][k.frame % 4];
  const h = [46.4, 35.4];
  const y = 39.6 + drop;
  return [
    leo(k, { face: 'grin', look: 1.4, armFront: [[38.4, 34.8], [46.6, 38.4], h] }),
    k.line(`M${pt(h)}V${fmt(y - 4)}`, { color: c.charcoal, sw: 1.4 }),
    k.circle(46.4, y, 5.2, c.red),
    k.flat(`M${fmt(42)} ${fmt(y + 0.8)}H${fmt(50.8)}V${fmt(y + 2.4)}H${fmt(42)}Z`, c.redShade),
    k.circle(46.4, y, 1.8, c.yellow),
    k.shineDot(44.4, y - 2.6, 0.9),
  ].join('');
}

/** Hug: Leo squeezing his teddy bear. */
export function hug(k) {
  const c = k.P;
  const f = k.frame % 2;
  const pose = {
    face: 'laugh',
    bob: f ? -k.px : 0,
    armBack: [[25.6, 34.8], [18.6, 44], [28.6, 50]],
    armFront: [[38.4, 34.8], [45.4, 44], [35.4, 50]],
  };
  const teddy = [
    k.ellipse(32, 50.4, 9, 7.4, c.brown),
    k.flatEllipse(32, 52, 4.6, 4, c.tan),
    k.circle(25.4, 32.4, 3, c.brown),
    k.circle(38.6, 32.4, 3, c.brown),
    k.flatCircle(25.4, 32.4, 1.4, c.tan),
    k.flatCircle(38.6, 32.4, 1.4, c.tan),
    k.circle(32, 38.4, 7.6, c.brown),
    k.ellipse(32, 41.2, 3.6, 2.8, c.tan),
    k.flatEllipse(32, 40.2, 1.3, 0.9, c.ink),
    k.flatCircle(28.8, 36.6, 1, c.ink),
    k.flatCircle(35.2, 36.6, 1, c.ink),
  ].join('');
  return [
    leo(k, pose),
    k.g(f ? 'translate(32 56) scale(1.06 .94) translate(-32 -56)' : 'translate(0 0)', teddy),
    arm(k, CAST.leo, pose.armBack),
    arm(k, CAST.leo, pose.armFront),
    k.path(heartPath(51, f ? 6.6 : 9.4, 8, 7.2), c.pink),
  ].join('');
}

/** Love: Leo holding a big heart that beats. */
export function love(k) {
  const c = k.P;
  const beat = k.frame % 2 === 1;
  return [
    leo(k, { face: 'laugh', armBack: [[25.6, 34.8], [19, 40], [21.4, 44.6]], armFront: [[38.4, 34.8], [45, 40], [42.6, 44.6]] }),
    k.g(beat ? 'translate(32 45) scale(1.08) translate(-32 -45)' : 'translate(0 0)', k.path(heartPath(32, 33, 27, 24), c.red), k.shine('M22.4 39Q22.6 36.4 25 35.6', 2)),
    hand(k, [21.4, 44.6]),
    hand(k, [42.6, 44.6]),
    beat ? k.path(heartPath(51.6, 9, 7.2, 6.4), c.pink) : '',
  ].join('');
}

// --- Moving about ---------------------------------------------------------------

/** Jump: Leo up in the air, then crouched for the next jump. */
export function jump(k) {
  const up = k.frame % 2 === 0;
  return leo(
    k,
    up
      ? lifted(
          {
            face: 'grin',
            armBack: [[25.6, 34.8], [18.6, 24]],
            armFront: [[38.4, 34.8], [45.4, 24]],
            legBack: [[28.6, 46], [24.6, 50], [27, 54.4]],
            legFront: [[35.4, 46], [39.4, 50], [37, 54.4]],
          },
          -6,
        )
      : lifted(
          {
            face: 'smile',
            armBack: [[25.6, 34.8], [21, 42]],
            armFront: [[38.4, 34.8], [43, 42]],
            legBack: [[28.6, 46], [25, 50.6], [28.2, 55.4]],
            legFront: [[35.4, 46], [39, 50.6], [35.8, 55.4]],
          },
          1.4,
        ),
  );
}

/** Walk: Leo walking along. */
export function walk(k) {
  return leo(k, walkPose(k));
}

/** Stand: Leo standing still on a spot, side on, his arms at his sides. */
export function stand(k) {
  const c = k.P;
  return [
    k.ellipse(32, 57.4, 13, 2.8, c.yellow),
    leo(k, {
      head: [33, 20.5],
      look: 2.4,
      toes: 0.8,
      armsInFront: false,
      armBack: [[29, 35.4], [28.6, 45.4]],
      armFront: [[38.6, 35.4], [38.8, 45.4]],
      legBack: [[30.6, 46.2], [30.6, 55.6]],
      legFront: [[34.6, 46.2], [34.6, 55.6]],
    }),
  ].join('');
}

/** Sit: Leo on a chair, swinging his legs. */
export function sit(k) {
  const c = k.P;
  const f = k.frame % 2;
  const legs = f
    ? { legBack: [[28.6, 46], [38, 48.4], [36.4, 56.4]], legFront: [[35.4, 46], [44, 48.4], [48.4, 54]] }
    : { legBack: [[28.6, 46], [38, 48.4], [39.4, 56.4]], legFront: [[35.4, 46], [44, 48.4], [44.4, 56.6]] };
  return [
    // the chair, side on (the same chair as the word's): the back leg going on
    // up as the backrest, with its rail and slat; the seat; the front leg
    k.rect(15.8, 14.6, 4.6, 44, 1.4, c.wood),
    k.rect(14, 13.4, 8.2, 5.4, 2, c.wood),
    k.rect(14.8, 27, 6.6, 3.6, 1.2, c.wood),
    k.rect(20.4, 53.6, 21.6, 2.2, 0.6, c.woodShade),
    k.rect(42, 50.8, 4.4, 7.8, 1, c.wood),
    k.rect(15.8, 46.6, 30.6, 4.4, 1.2, c.wood),
    k.flat('M17 47.6H45.2V48.4H17Z', c.tan),
    leo(k, { face: 'smile', look: 1.4, toes: 0.8, ...legs, armBack: [[25.6, 34.8], [24.6, 42], [29.4, 46]], armFront: [[38.4, 34.8], [41.6, 41], [40.4, 45.6]] }),
  ].join('');
}

/** Dance: Aino dancing in her red dress, one arm up, then the other. */
export function dance(k) {
  const f = k.frame % 2;
  const pose = f
    ? {
        face: 'laugh',
        look: 1.6,
        armBack: [[25.6, 34.8], [19, 40], [23.4, 44.4]],
        armFront: [[38.4, 34.8], [44, 27], [45.6, 19.4]],
        legBack: [[28.6, 46], [23, 50], [19.4, 53.4]],
        legFront: [[35.4, 46], [35.6, 55.4]],
      }
    : {
        face: 'grin',
        look: -1.6,
        armBack: [[25.6, 34.8], [20, 27], [18.4, 19.4]],
        armFront: [[38.4, 34.8], [45, 40], [40.6, 44.4]],
        legBack: [[28.6, 46], [28.4, 55.4]],
        legFront: [[35.4, 46], [41, 50], [44.6, 53.4]],
      };
  return person(k, CAST.aino, { ...POSES.stand, ...pose }) + (f ? note(k, 10, 18, 'blue') : note(k, 50, 18, 'purple'));
}

/** Swim: Leo in the water, his arms taking turns to stroke over it. */
export function swim(k) {
  const c = k.P;
  const f = k.frame % 2;
  const arms = f
    ? { armBack: [[25.6, 34.8], [18, 20.6], [11.4, 24.4]], armFront: [[38.4, 34.8], [42, 42]] }
    : { armBack: [[25.6, 34.8], [22, 42]], armFront: [[38.4, 34.8], [46, 20.6], [52.6, 24.4]] };
  const s = f ? 4 : 0;
  const drops = f
    ? [[7.4, 40.6, 1.6], [4.4, 44, 1.2]]
    : [[56.6, 40.6, 1.6], [59.6, 44, 1.2]];
  return [
    leo(k, lifted({ face: 'grin', look: f ? -1.6 : 1.6, ...arms }, 9)),
    k.path(`${waves(45.6, 0.7, 8, s)}V66H-12Z`, c.water),
    k.flat(`M${fmt(12 + s)} 51H${fmt(20 + s)}V52.4H${fmt(12 + s)}ZM${fmt(40 - s)} 55H${fmt(50 - s)}V56.4H${fmt(40 - s)}Z`, c.white),
    ...drops.map(([x, y, r]) => k.circle(x, y, r, c.white)),
  ].join('');
}

/** Climb: Leo high up a climbing wall, hand over hand, the crash mat far below. */
export function climb(k) {
  const c = k.P;
  const f = k.frame % 2;
  const s = 0.82;
  // where his hands and feet are on the wall: [x, y] on the picture, from his pose
  const at = ([px, py]) => [32 - 32 * s + px * s, 50 - 60 * s + py * s];
  const pose = f
    ? {
        bob: -k.px,
        armBack: [[25.6, 34.8], [20, 40], [20.6, 44]],
        armFront: [[38.4, 34.8], [45, 30], [46.4, 24]],
        legBack: [[28.6, 46], [28, 55.4]],
        legFront: [[35.4, 46], [41, 48.4], [40, 53]],
      }
    : {
        armBack: [[25.6, 34.8], [19, 30], [17.6, 24]],
        armFront: [[38.4, 34.8], [44, 40], [43.4, 44]],
        legBack: [[28.6, 46], [23, 48.4], [24, 53]],
        legFront: [[35.4, 46], [36, 55.4]],
      };
  const grips = [pose.armBack.at(-1), pose.armFront.at(-1)].map((p) => at(p)).map(([x, y]) => [x, y - 1.4]);
  const steps = [pose.legBack.at(-1), pose.legFront.at(-1)].map((p) => at(p)).map(([x, y]) => [x, y + 3.6]);
  const others = [[9, 8], [55, 6], [31, 3], [6.6, 30], [58, 27], [12, 44], [53, 42], [20, 52], [44, 52]];
  const colors = ['red', 'yellow', 'blue', 'green', 'orange', 'purple'];
  return [
    k.rect(3, -2, 58, 59.6, 3, c.tan),
    k.line('M20 2L16 14L22 24M50 30L46 40L52 48', { color: c.tanShade, sw: 1.4 }),
    ...[...grips, ...steps, ...others].map(([x, y], i) => k.ellipse(x, y, 3.4, 2.6, c[colors[i % colors.length]])),
    k.rect(1, 55.6, 62, 7, 2.4, c.blue),
    k.flat('M2 59H62V61.4H2Z', c.blueShade),
    placed(k, CAST.leo, { ...pose, face: 'grin', shadow: false }, 32, 50, s),
  ].join('');
}

/** Fly: a bird flapping its wings, the clouds going by. */
export function fly(k) {
  const c = k.P;
  const f = k.frame % 3;
  const wing = [
    'M27 30C22 22 20.4 12.6 23.6 6.4C30 10.4 34 20 34.4 30Z',
    'M27 29.6C19.6 29.6 11.6 27.6 7.4 23.6C13.6 21.4 26.4 22 34.4 28Z',
    'M27 31.4C22 38.4 20.6 46.4 23.6 52.6C30 46.6 34.2 38.4 34.4 31.4Z',
  ][f];
  const lift = f === 2 ? -k.px : 0;
  const cloud = (x, y, s) =>
    k.path(
      `M${pt([x - 7 * s, y])}A${fmt(3 * s)} ${fmt(3 * s)} 0 0 1 ${pt([x - 4 * s, y - 4 * s])}A${fmt(4.4 * s)} ${fmt(4.4 * s)} 0 0 1 ${pt([x + 4 * s, y - 4 * s])}A${fmt(3 * s)} ${fmt(3 * s)} 0 0 1 ${pt([x + 7 * s, y])}Z`,
      c.white,
    );
  return [
    cloud(20 - f * 5, 58, 1.2),
    cloud(58 - f * 5, 13, 0.9),
    k.g(
      `translate(0 ${fmt(lift)})`,
      k.poly([[18.6, 31], [7, 26], [8.6, 37.4]], [1.2, 1.6, 1.6], c.blueShade),
      k.ellipse(31, 33, 13.4, 9.4, c.blue),
      k.flatEllipse(33, 38.6, 9, 4.2, c.sky),
      k.circle(43, 26.6, 7.2, c.blue),
      k.poly([[49.4, 24.6], [56, 27.4], [49.4, 30.2]], [1, 1, 1], c.amber),
      k.eye(45.4, 25.2, 2.2),
      k.blush(46.2, 29.8, 1.8, 1.2),
      k.path(wing, c.blueShade),
    ),
  ].join('');
}

/** Drive: Leo at the wheel of a little open car. */
export function drive(k) {
  const c = k.P;
  const b = k.frame % 2 ? -k.px : 0;
  const s = 0.72;
  return [
    k.ground(32, 56.6, 25, 2),
    k.speed(7, [31, 38.6], 5),
    k.g(
      `translate(0 ${fmt(b)})`,
      k.rect(21.4, 27.4, 14, 10, 4, c.green),
      k.g(`translate(${fmt(28 - 32 * s)} ${fmt(19.6 - 20.5 * s)}) scale(${s})`, portrait(k, CAST.leo, 'grin')),
      k.limb('M44.4 34.6L41 29.6', c.charcoal, 3.8),
      k.ellipse(40.4, 28.8, 1.6, 3.6, c.charcoal),
      k.limb('M32 31.4Q36.4 33.4 39.6 29.8', c.green, 5.4),
      hand(k, [39.8, 29.6], 'skin3', 0.76),
      k.path('M44.8 34.6L48.2 27.2H51.4L50.4 34.6Z', c.sky),
      k.path('M7 46V38.6C7 36.2 8.6 34.6 11 34.6H53.6C55.8 34.6 57.4 36.2 57.4 38.6V46Z', c.blue),
      k.flat('M7.4 41.6H57V45.6H7.4Z', c.blueShade),
      k.flatEllipse(55.4, 38.4, 1.4, 1.2, c.yellow),
      k.line('M23.6 37.8H27.6', { sw: 1.4 }),
    ),
    wheel(k, 18, 47, 5.6),
    wheel(k, 46.6, 47, 5.6),
  ].join('');
}

/** Run away: Leo running off, looking back at the bee that's after him. */
export function runAway(k) {
  const c = k.P;
  const f = k.frame % 4;
  const by = [0, -1.4, 0, 1.4][f];
  const flap = f % 2;
  return [
    person(k, CAST.leo, { ...runPose(k), look: -2.4, face: 'o' }),
    k.g(
      `translate(0 ${fmt(by)})`,
      k.ellipse(flap ? 7.6 : 8.6, 11.6, 2.4, 3.8, c.sky),
      k.ellipse(flap ? 11.4 : 10.4, 11.6, 2.4, 3.8, c.sky),
      k.poly([[3.4, 18.4], [0.6, 17.4], [3.4, 16.4]], 0.4, c.charcoal),
      k.ellipse(9, 17.4, 5.6, 4.4, c.yellow),
      k.flat('M6.4 13H8.4V22H6.4ZM10.2 13H12.2V22H10.2Z', c.charcoal),
      k.flatCircle(13, 16.6, 0.9, c.ink),
    ),
  ].join('');
}

// --- Using the hands --------------------------------------------------------------

/** Give: Leo holding out a present to Aino, who reaches for it. */
export function give(k) {
  const c = k.P;
  const s = 0.78;
  const d = k.frame % 2 ? 1.6 : 0;
  const [lh, ah] = [[27.4 + d, 42.6], [36.6 + d, 42.6]];
  const x = 26.6 + d;
  return [
    placed(k, CAST.leo, { face: 'grin', look: 2, armFront: [[38.4, 34.8], [44, 41], poseAt(18, 60, s)(lh)] }, 18, 60, s),
    placed(k, CAST.aino, { face: d ? 'laugh' : 'grin', look: -2, armBack: [[25.6, 34.8], [20, 41], poseAt(46, 60, s)(ah)] }, 46, 60, s),
    k.rect(x, 33.6, 10.8, 10, 1.2, c.red),
    k.flat(`M${fmt(x + 4.6)} 34.2H${fmt(x + 6.2)}V43H${fmt(x + 4.6)}Z`, c.yellow),
    k.flat(`M${fmt(x + 0.6)} 37.6H${fmt(x + 10.2)}V39.2H${fmt(x + 0.6)}Z`, c.yellow),
    k.path(`M${fmt(x + 5.4)} 33.6C${fmt(x + 3)} 29.6 ${fmt(x)} 31.4 ${fmt(x + 2.4)} 33.6ZM${fmt(x + 5.4)} 33.6C${fmt(x + 7.8)} 29.6 ${fmt(x + 10.8)} 31.4 ${fmt(x + 8.4)} 33.6Z`, c.yellow),
    hand(k, lh, 'skin3', s),
    hand(k, ah, 'skin1', s),
  ].join('');
}

/** Help: Leo and Eero carrying a box together. */
export function help(k) {
  const c = k.P;
  const s = 0.78;
  const f = k.frame % 2;
  const bob = (i) => (f === i ? -k.px : 0);
  return [
    k.g(`translate(0 ${fmt(bob(0))})`, placed(k, CAST.leo, { face: 'grin', look: 1.6, armFront: [[38.4, 34.8], [44, 41.4], [44.3, 38.2]] }, 17, 60, s)),
    k.g(`translate(0 ${fmt(bob(1))})`, placed(k, CAST.eero, { face: 'grin', look: -1.6, armBack: [[25.6, 34.8], [20, 41.4], [19.7, 38.2]] }, 47, 60, s)),
    k.rect(24.8, 33.4, 14.4, 13.8, 1.4, c.wood),
    k.flat('M25.6 38.4H38.4V40.6H25.6Z', c.tan),
    k.flat('M35.6 34.2H38.4V46.4H35.6Z', c.woodShade),
    hand(k, [26.6, 43 + bob(0)], 'skin3', s),
    hand(k, [37.4, 43 + bob(1)], 'skin2', s),
  ].join('');
}

/** Throw: Leo throwing a frisbee: it's away; then he winds up for the next throw. */
export function toss(k) {
  const c = k.P;
  const frisbee = (x, y, rot) => k.g(`rotate(${rot} ${pt([x, y])})`, k.ellipse(x, y, 7, 2.8, c.red), k.flatEllipse(x, y - 0.6, 4, 1.1, c.redShade));
  if (k.frame % 2 === 0) {
    return [leo(k, { face: 'grin', look: 2, armFront: [[38.4, 34.8], [45.4, 31.6], [50.4, 28]] }), k.speed(48, [9.6, 13.6], 5), frisbee(55, 11.6, -12)].join('');
  }
  return [leo(k, { face: 'smile', look: 2, armFront: [[38.4, 34.8], [32, 40], [24.6, 36]] }), frisbee(22.6, 34.6, 0), hand(k, [24.6, 36])].join('');
}

/** Make: Leo hammering a nail into a block of wood. Bang! */
export function make(k) {
  const c = k.P;
  const down = k.frame % 2 === 0;
  const h = down ? [38.6, 40.6] : [36.6, 30.6];
  return [
    k.ground(50, 58.6, 11, 1.8),
    k.rect(39.4, 46.6, 21, 10.6, 1.4, c.wood),
    k.flat('M40.4 53.4H59.4V56.2H40.4Z', c.woodShade),
    k.limb('M48.4 46.8V43', c.silver, 4),
    placed(k, CAST.leo, { face: 'grin', look: 2, armFront: [[38.4, 34.8], [45, 41], [h[0] + 8, h[1]]] }, 24, 60, 1),
    k.g(`rotate(${down ? 0 : -60} ${pt(h)})`, k.limb(`M${pt(h)}H${fmt(h[0] + 9.4)}`, c.wood, 4.4), k.rect(h[0] + 7.4, h[1] - 7.4, 5.2, 9.4, 1, c.charcoal)),
    hand(k, h),
    down ? k.line('M54.6 37.4L57.6 34.4M55.6 41.4H59.6M52 34.6L52.6 30.6', { sw: 1.4 }) : '',
  ].join('');
}

/** Build: Leo putting the last brick on a wall. */
export function build(k) {
  const c = k.P;
  const down = k.frame % 2 === 1;
  const bricks = [];
  const [x0, x1, w, h] = [33, 61, 8, 5.6];
  for (let r = 0; r < 4; r++) {
    const y = 58 - h * (r + 1);
    for (let x = x0 - (r % 2 ? w / 2 : 0); x < x1; x += w) {
      const a = Math.max(x, x0);
      const b = Math.min(x + w, x1);
      if (r === 3 && a === x0) continue; // the gap the new brick goes in
      bricks.push(k.rect(a, y, b - a, h, 0.6, r % 2 ? c.coral : c.red));
    }
  }
  const by = down ? 58 - h * 4 : 58 - h * 4 - 5;
  const h1 = [36.4, by + 3.4];
  return [
    k.ground(47, 58.6, 15, 1.8),
    ...bricks,
    placed(k, CAST.leo, { face: 'grin', look: 2, armFront: [[38.4, 34.8], [44, 40], [h1[0] + 10, h1[1]]] }, 22, 60, 1),
    k.rect(x0, by, w, h, 0.6, c.red),
    hand(k, h1),
  ].join('');
}

/** Fix: a wrench turning a nut on a plank. */
export function fix(k) {
  const c = k.P;
  const turned = k.frame % 2 === 1;
  const a = turned ? -14 : -38;
  const [nx, ny] = [21, 40];
  const P = (dx, dy) => pt([nx + dx, ny + dy]);
  // the open end: a C round the nut, its mouth to the left
  const jaw = `M${P(-7.2, 4.4)}A8.6 8.6 0 1 0 ${P(-7.2, -4.4)}L${P(-4.2, -4)}H${fmt(nx + 1.4)}Q${P(3.6, -4)} ${P(3.6, 0)}Q${P(3.6, 4)} ${P(1.4, 4)}H${fmt(nx - 4.2)}Z`;
  return [
    k.ground(32, 58.6, 24, 2),
    k.rect(3, 30, 34, 22, 2, c.wood),
    k.flat('M4 46.4H36V51H4Z', c.woodShade),
    k.line('M8 35H16M24 47H32', { color: c.woodShade, sw: 1.2 }),
    k.g(
      `rotate(${a} ${nx} ${ny})`,
      k.rect(nx + 6, ny - 3.2, 29, 6.4, 3.2, c.silver),
      k.shine(`M${nx + 10} ${ny - 0.8}H${nx + 30}`, 1.4),
      k.circle(nx + 36.4, ny, 5.2, c.silver),
      k.circle(nx + 36.4, ny, 2.2, c.silverShade),
      k.path(jaw, c.silver),
    ),
    k.poly([0, 60, 120, 180, 240, 300].map((d) => polar(nx, ny, 4.6, d)), 0.6, c.grey),
    k.flatCircle(nx, ny, 1.6, c.greyShade),
    turned ? k.line(arcPath(nx, ny, 40, -32, -20), { sw: 1.4 }) + k.line(arcPath(nx, ny, 34, -30, -22), { sw: 1.4 }) : '',
  ].join('');
}

/** Draw: Leo drawing a sun at the easel with a red crayon. */
export function draw(k) {
  const c = k.P;
  const f = k.frame % 3;
  const s = 0.82;
  const h = [[37.4, 32.6], [41.6, 29.8], [39.8, 31.2]][f];
  const rays = [225, 270, 315, 0, 45, 90, 180, 135].slice(0, [8, 0, 4][f]);
  return [
    k.limb('M38 40L34.6 58M54 40L57.4 58', c.wood, 4.4),
    k.rect(31.4, 8.4, 29.2, 33.6, 1.6, c.wood),
    k.rect(33.4, 10.4, 25.2, 29.6, 0.6, c.white),
    k.rect(30, 40.6, 32, 3.6, 1.2, c.woodShade),
    k.circle(46, 24.6, 5, c.yellow),
    ...rays.map((a) => k.line(`M${pt(polar(46, 24.6, 7.4, a))}L${pt(polar(46, 24.6, 10.4, a))}`, { color: c.amber, sw: 2 })),
    placed(k, CAST.leo, { face: 'grin', look: 2, armFront: [[38.4, 34.8], [46, 31], poseAt(23, 60, s)(h)] }, 23, 60, s),
    k.limb(`M${pt(h)}L${pt([h[0] + 2.6, h[1] - 3])}`, c.red, 4),
    hand(k, h, 'skin3', s),
  ].join('');
}

/** Write: Leo at his desk, writing in a notebook. */
export function write(k) {
  const c = k.P;
  const x = [40, 30.6, 35.2][k.frame % 3];
  const h = [x, 44.4];
  const pose = {
    face: 'smile',
    armBack: [[25.6, 34.8], [20.4, 41], [22.6, 45.4]],
    armFront: [[38.4, 34.8], [44, 40], h],
  };
  return [
    leo(k, pose),
    k.poly([[12, 40.6], [52, 40.6], [60, 50], [4, 50]], 1.2, c.wood),
    k.rect(4, 50, 56, 4, 1, c.woodShade),
    k.rect(7, 54, 4, 6, 0.8, c.woodShade),
    k.rect(53, 54, 4, 6, 0.8, c.woodShade),
    k.poly([[20.6, 41.6], [44.4, 41.6], [46.2, 48.6], [18.8, 48.6]], 0.8, c.white),
    k.line(scribble(22.4, 43.8, 42.2), { color: c.navy, sw: 1.2 }),
    k.line(scribble(22, 46.4, x - 1.6), { color: c.navy, sw: 1.2 }),
    arm(k, CAST.leo, pose.armBack),
    k.limb(`M${pt([x - 1.4, 46.4])}L${pt([x + 3.4, 38.6])}`, c.yellow, 4.2),
    arm(k, CAST.leo, pose.armFront),
  ].join('');
}

/** Paint: a palette of paints, the brush dabbing at the blue. */
export function paint(k) {
  const c = k.P;
  const up = k.frame % 2 === 1;
  return [
    k.ground(32, 58.6, 22, 2),
    k.path('M8 33C8 19.6 19.6 11 33.6 11C47.6 11 57 19 57 29.6C57 37 51.6 39.4 45.4 38.6C40 38 37.6 41.4 39.4 46.4C41.4 52 37 56 30.4 56C17 56 8 46.6 8 33Z', c.wood),
    k.flat('M10 37C12 47 20 54 30.4 54C35 54 38 52.4 38.6 49.4C33 51.4 27 51 21.6 48.6C16.4 46.4 12.6 42 10 37Z', c.woodShade),
    k.circle(20.4, 44.2, 3.6, c.woodShade),
    k.circle(19, 27, 4.2, c.red),
    k.circle(29.6, 19.6, 4.2, c.yellow),
    k.circle(41.6, 19.4, 4.2, c.blue),
    k.circle(49.4, 28.6, 3.8, c.green),
    k.circle(30.4, 31.4, 3.6, c.white),
    k.g(
      up ? 'translate(3 3)' : 'translate(0 0)',
      k.limb('M60 55L47.6 35.6', c.red, 4.6),
      k.limb('M47.6 35.6L45.6 32.4', c.silver, 4.8),
      k.path('M43.8 33.8C42.2 31 41.8 28 42.6 25.4C44.8 27 46.6 29.6 47.4 31.2Z', c.blue),
    ),
  ].join('');
}

/** Cook: Leo in a chef's hat, stirring a pot; steam rises. */
export function cook(k) {
  const c = k.P;
  const f = k.frame % 3;
  const h = [[39.6, 37.6], [34.4, 38.4], [29.4, 37.6]][f];
  const pose = lifted({ face: 'grin', armFront: [[38.4, 34.8], [44, 38], [h[0], h[1] - 6]] }, 6);
  return [
    leo(k, pose),
    k.path('M21.6 13C17.4 13 16.4 7 20.6 5.4C21.6 1.8 27 1 29 3.4C30.6 0.8 36 0.8 37.4 3.6C40 1.8 45.4 3.4 44 7.8C46.8 9.4 45.6 13 42.4 13Z', c.white),
    k.rect(22.4, 11, 19.2, 5.4, 1.4, c.white),
    k.limb(`M${pt([h[0] - 4, 50])}L${pt([h[0] + 2.4, h[1] - 6])}`, c.wood, 4.4),
    k.rect(5.6, 48, 6.4, 3.4, 1.4, c.charcoal),
    k.rect(52, 48, 6.4, 3.4, 1.4, c.charcoal),
    k.path('M12 46.4H52V55.4C52 58.8 49.4 61.4 46 61.4H18C14.6 61.4 12 58.8 12 55.4Z', c.red),
    k.flat('M44 47.4H51V55.4C51 58 49.2 60.2 46.4 60.4C48.6 57 46 51 44 47.4Z', c.redShade),
    k.rect(10, 43, 44, 3.8, 1.4, c.redShade),
    hand(k, h),
    steam(k, [13, 51], 41),
  ].join('');
}

/** Clean: Leo sweeping with a broom, the dust flying. */
export function clean(k) {
  const c = k.P;
  const f = k.frame % 2;
  const top = [48, 26];
  const bot = f ? [24, 54] : [18, 52];
  const on = (t) => [top[0] + (bot[0] - top[0]) * t, top[1] + (bot[1] - top[1]) * t];
  const [hf, hb] = [on(0.25), on(0.55)];
  const ang = (Math.atan2(top[0] - bot[0], bot[1] - top[1]) * 180) / Math.PI;
  const dust = f
    ? [[31, 57, 2.2], [35.4, 55, 1.6]]
    : [[8.4, 55.4, 2.4], [12.4, 58.6, 1.8], [5, 51.6, 1.4]];
  return [
    leo(k, { face: 'grin', look: -1.4, armFront: [[38.4, 34.8], [43, 38], hf], armBack: [[25.6, 34.8], [24, 42], hb] }),
    k.limb(`M${pt(top)}L${pt(bot)}`, c.wood, 4.4),
    k.g(
      `rotate(${fmt(ang)} ${pt(bot)})`,
      k.poly([[bot[0] - 3.4, bot[1] - 1], [bot[0] + 3.4, bot[1] - 1], [bot[0] + 6, bot[1] + 7.4], [bot[0] - 6, bot[1] + 7.4]], [1, 1, 1.4, 1.4], c.amber),
      k.flat(`M${fmt(bot[0] - 3.6)} ${fmt(bot[1] + 1)}H${fmt(bot[0] + 3.6)}V${fmt(bot[1] + 2.6)}H${fmt(bot[0] - 3.6)}Z`, c.red),
    ),
    hand(k, hf),
    hand(k, hb),
    ...dust.map(([x, y, r]) => k.circle(x, y, r, c.silver)),
  ].join('');
}

/** Wash: Leo washing his hands at the sink, soap bubbles floating up. */
export function wash(k) {
  const c = k.P;
  const f = k.frame % 2;
  const hb = f ? [29.4, 40.4] : [29.4, 42.6];
  const hf = f ? [34.6, 42.6] : [34.6, 40.4];
  const bubble = ([x, y, r]) => k.circle(x, y, r, c.white) + k.flatCircle(x - r * 0.36, y - r * 0.36, Math.max(r * 0.34, 0.7), c.sky);
  const bubbles = f
    ? [[21.6, 32.6, 2.8], [43, 30.6, 2.2], [26.6, 25, 1.8], [46.6, 22, 1.6], [16.6, 22.4, 1.4]]
    : [[22.6, 36.4, 2.4], [42.6, 35.4, 2.8], [45.4, 26.4, 1.8], [18.6, 27.4, 1.8], [14, 18.6, 1.4]];
  return [
    leo(k, { face: 'grin', armBack: [[25.6, 34.8], [22.4, 42.4], hb], armFront: [[38.4, 34.8], [41.6, 42.4], hf] }),
    k.circle(26.4, 43.4, 2, c.white),
    k.circle(37.6, 43.4, 2, c.white),
    k.circle(32, 38.6, 1.8, c.white),
    ...bubbles.map(bubble),
    k.rect(12, 45.4, 40, 3.6, 1.6, c.silver),
    k.path('M14.4 49H49.6V50C49.6 55.2 45.6 58.8 40.4 58.8H23.6C18.4 58.8 14.4 55.2 14.4 50Z', c.white),
    k.flat('M41.4 50H48.6C48 54.4 45 57.6 40.6 57.8C43 55.6 42.6 52.6 41.4 50Z', c.silver),
    k.rect(27.6, 58.8, 8.8, 5.6, 0.8, c.silver),
    k.rect(15.6, 42.4, 7.4, 3.2, 1, c.pink),
  ].join('');
}

/** Cut: scissors snipping along a line on a sheet of paper. */
export function cut(k) {
  const c = k.P;
  const a = k.frame % 2 === 0 ? 15 : 3;
  const [px, py] = [41, 31];
  const piece = (s) => {
    const [rx, ry] = [px + 12, py - s * 7.4];
    return k.g(
      `rotate(${s * a} ${px} ${py})`,
      k.limb(`M${px + 1} ${py}L${pt([rx - 5, ry])}${ringPath(rx, ry, 5)}`, c.red, 5),
      k.path(`M${px + 3} ${py - 2.6}L${px - 26} ${py - 0.8}Q${px - 27.6} ${py} ${px - 26} ${py + 0.8}L${px + 3} ${py + 2.6}Z`, c.silver),
    );
  };
  return [
    k.ground(32, 58.6, 26, 2),
    k.g('rotate(-6 19 31)', k.rect(3, 11, 32, 40, 1.4, c.white), k.flat('M4 45.4H34V50H4Z', c.silver), k.line('M6 31H9M11.6 31H14.6', { color: c.greyShade, sw: 1.6 })),
    piece(1),
    piece(-1),
    k.flatCircle(px, py, 1.6, c.charcoal),
  ].join('');
}

/** Wait: an hourglass, the sand running down. */
export function wait(k) {
  const c = k.P;
  const f = k.frame % 4;
  const level = [17, 22, 26.6, 30.4][f];
  const pile = [50, 46.6, 43, 39.6][f];
  const top = 'M18.4 9.6H45.6C45.6 21.6 36 27.6 33.6 32H30.4C28 27.6 18.4 21.6 18.4 9.6Z';
  return [
    k.ground(32, 58.6, 18, 2),
    k.limb('M14.6 8V56M49.4 8V56', c.wood, 4.4),
    // the top bulb: sand filling it, then the glass clear down to the sand
    k.path(top, c.white),
    k.flat(top, c.amber),
    k.flat(`M18 9H46V${fmt(level)}H18Z`, c.white),
    k.shine('M21.6 12.6Q22.4 18 26 22', 1.6),
    k.path('M30.4 32H33.6C36 36.4 45.6 42.4 45.6 54.4H18.4C18.4 42.4 28 36.4 30.4 32Z', c.white),
    k.flat(`M17 55C22 55 26 ${fmt(pile)} 32 ${fmt(pile)}C38 ${fmt(pile)} 42 55 47 55Z`, c.amber),
    k.flat(`M31.3 31H32.7V${fmt(pile + 1)}H31.3Z`, c.amber),
    k.rect(10.6, 4.4, 42.8, 5.6, 1.6, c.wood),
    k.rect(10.6, 53.8, 42.8, 5.6, 1.6, c.wood),
  ].join('');
}

// --- Seeing, hearing, talking ---------------------------------------------------

/** See: a pair of big eyes, looking this way and that. */
export function see(k) {
  const c = k.P;
  const [dx, dy] = [[2.8, 0.6], [-2.8, 0.6], [0, -3]][k.frame % 3];
  const eyeball = (x) =>
    k.ellipse(x, 32, 10.4, 13.6, c.white) +
    k.flat(`M${pt([x - 9.4, 40])}Q${pt([x, 48.6])} ${pt([x + 9.4, 40])}V47H${fmt(x - 9.4)}Z`, c.silver) +
    k.flatCircle(x + dx, 33 + dy, 5.2, c.ink) +
    k.flatCircle(x + dx - 1.8, 31 + dy, 1.7, c.white);
  return eyeball(21.2) + eyeball(42.8);
}

/** Look: Leo watching TV, the picture on it changing. */
export function look(k) {
  const c = k.P;
  const f = k.frame % 2;
  return [
    placed(k, CAST.leo, { look: 2.6, armBack: [[25.6, 34.8], [21.6, 44]], armFront: [[38.4, 34.8], [42.4, 44]] }, 17, 60, 0.8),
    k.rect(30.6, 44.6, 31, 13.4, 1.6, c.wood),
    k.line('M46 47V56', { color: c.woodShade, sw: 1.4 }),
    k.line('M44 21L39.4 13.4M48 21L52.6 13.4', { sw: 1.4 }),
    k.rect(32, 21, 28, 24, 2.6, c.charcoal),
    k.rect(35, 24, 22, 18, 1.4, f ? c.water : c.sky),
    f
      ? k.ellipse(46.6, 33, 5, 3.2, c.orange) + k.poly([[42, 33], [38.2, 30], [38.2, 36]], 0.6, c.orange) + k.flatCircle(49, 32.2, 0.8, c.ink)
      : k.flat('M35.6 37C41 33 46 33 50 36C53 34.4 55.4 34.4 56.4 35V41.4H35.6Z', c.green) + k.flatCircle(51, 29, 3, c.yellow),
    k.flatCircle(57.6, 43.2, 0.8, c.red),
  ].join('');
}

/** Read: Leo reading a book, a page turning. */
export function read(k) {
  const c = k.P;
  const turning = k.frame % 2 === 1;
  return [
    leo(k, { face: 'smile', armBack: [[25.6, 34.8], [20.6, 42.6], [21, 40.4]], armFront: [[38.4, 34.8], [43.4, 42.6], [43, 40.4]] }),
    k.path('M18.6 34.4L32 37L45.4 34.4V46.6L32 49.2L18.6 46.6Z', c.red),
    k.path('M20 35L32 37.6V47.8L20 45.4Z', c.white),
    k.path('M44 35L32 37.6V47.8L44 45.4Z', c.white),
    k.line('M22.6 39L29.6 40.4M22.6 41.8L29.6 43.2M34.4 40.4L41.4 39M34.4 43.2L41.4 41.8', { color: c.silverShade, sw: 1.2 }),
    turning ? k.path('M32 37.6Q36 32.6 39.6 31.4L40.4 42Q36 43 32 47.8Z', c.cream) : '',
    hand(k, [21, 40.4]),
    hand(k, [43, 40.4]),
  ].join('');
}

/** Search (look for): Leo peering through a magnifying glass, his eye huge in it. */
export function search(k) {
  const c = k.P;
  const f = k.frame % 2;
  const [lx, ly] = f ? [38.4, 24.6] : [37, 22.6];
  const h = [lx + 8.4, ly + 12.6];
  return [
    leo(k, { face: 'smile', look: f ? 1.4 : 0, armFront: [[38.4, 34.8], [46, 41], h] }),
    k.limb(`M${pt([lx + 5.4, ly + 5.4])}L${pt(h)}`, c.brown, 5.2),
    k.circle(lx, ly, 8, c.skin3),
    k.eye(lx + 0.4, ly + 0.6, 4.2),
    k.limb(ringPath(lx, ly, 8), c.amber, 4.4),
    k.shine(`M${pt([lx - 4.4, ly - 1])}Q${pt([lx - 4, ly - 4.2])} ${pt([lx - 1, ly - 4.8])}`, 1.6),
    hand(k, h),
  ].join('');
}

/** Sing: Leo singing into a microphone, notes floating up. */
export function sing(k) {
  const c = k.P;
  const f = k.frame % 2;
  return [
    leo(k, { face: f ? 'o' : 'laugh', armFront: [[38.4, 34.8], [45.6, 40], [39.4, 36.4]] }),
    k.limb('M37.4 32.4L40 37.6', c.charcoal, 4.4),
    k.circle(36, 30, 3, c.silverShade),
    hand(k, [39.4, 36.4]),
    note(k, f ? 52 : 50, f ? 15 : 19, 'purple'),
    note(k, f ? 10 : 12, f ? 21 : 17, 'blue'),
  ].join('');
}

/** Listen: Leo in headphones, eyes shut, nodding along to the music. */
export function listen(k) {
  const c = k.P;
  const f = k.frame % 2;
  const b = f ? -k.px : 0;
  return [
    leo(k, { face: 'sleepy', bob: b }),
    k.g(`translate(0 ${fmt(b)})`, k.limb('M16.6 22A15.4 15.4 0 0 1 47.4 22', c.charcoal, 4.4), k.rect(13.6, 16.6, 6.4, 11.6, 2.6, c.red), k.rect(44, 16.6, 6.4, 11.6, 2.6, c.red)),
    note(k, f ? 54 : 52, f ? 13 : 17, 'purple'),
    note(k, f ? 8 : 10, f ? 13 : 9, 'blue'),
  ].join('');
}

/** Speak: Leo talking, the sound going out from him. */
export function speak(k) {
  const f = k.frame % 2;
  return [leo(k, { face: f ? 'smile' : 'o', look: 2.6 }), ...[8.6, 12.4, 16.2].slice(0, f ? 2 : 3).map((r) => k.line(arcPath(38.6, 27, r, -36, 36), { sw: 1.6 }))].join('');
}

/** Say: a speech bubble, its dots coming one by one. */
export function say(k) {
  const c = k.P;
  const n = [3, 1, 2][k.frame % 3];
  return [
    k.path(roundPoly([[6, 10], [58, 10], [58, 44], [27, 44], [15.4, 55], [17.6, 44], [6, 44]], [9, 9, 9, 1.6, 1, 1.6, 9]), c.white),
    k.flat('M7 39H57V43H7Z', c.silver),
    k.shine('M11.6 21Q12.4 15.6 18 14.6', 2.2),
    ...[20, 32, 44].slice(0, n).map((x) => k.circle(x, 27.6, 3.6, c.brand)),
  ].join('');
}

/** Ask: a speech bubble with a big question mark in it, wobbling. */
export function ask(k) {
  const c = k.P;
  const tilt = k.frame % 2 ? 10 : -4;
  return [
    k.path(roundPoly([[6, 6], [58, 6], [58, 46], [47, 46], [49.6, 57], [37.4, 46], [6, 46]], [9, 9, 9, 1.6, 1, 1.6, 9]), c.white),
    k.flat('M7 41H57V45H7Z', c.silver),
    k.shine('M11.6 17Q12.4 11.6 18 10.6', 2.2),
    k.g(`rotate(${tilt} 32 40)`, k.limb('M25 20.6C25 12.4 39 12.4 39 20.6C39 25.6 32 26 32 31.6V32.6', c.red, 7.6), k.circle(32, 38.4, 3.6, c.red)),
  ].join('');
}

/** Answer: Leo putting his hand up. Me! Me! */
export function answer(k) {
  const f = k.frame % 2;
  const h = f ? [50.4, 17.6] : [47.4, 15.6];
  return [
    leo(k, { face: 'grin', look: 1, armFront: [[38.4, 34.8], [f ? 46.4 : 45, 27], h] }),
    f ? '' : k.line('M51.6 11.4L54.4 8.4M53.4 15.6H57.4M49.2 9.6L49.6 5.6', { sw: 1.4 }),
  ].join('');
}

// --- Feelings: the round face ---------------------------------------------------

/** Smile: the face smiling, the smile growing. */
export function smile(k) {
  const f = k.frame % 2;
  return [
    faceBase(k),
    k.eye(24.4, 27.4, 3.2),
    k.eye(39.6, 27.4, 3.2),
    cheeks(k),
    k.line(f ? 'M25 38.6Q32 44.4 39 38.6' : 'M22 37.4Q32 46.4 42 37.4', { sw: 1.8 }),
  ].join('');
}

/** Like: the face going "yum", licking its lips. */
export function like(k) {
  const c = k.P;
  const f = k.frame % 2;
  return [
    faceBase(k),
    k.happyEye(24.4, 27, 6.4),
    k.happyEye(39.6, 27, 6.4),
    cheeks(k),
    k.line('M23.6 38Q32 46 40.4 38', { sw: 1.6 }),
    k.ellipse(f ? 36.6 : 34.2, 43.2, 3.4, 2.8, c.tongue),
  ].join('');
}

/** Cry: the face crying, a tear rolling down. */
export function cry(k) {
  const f = k.frame % 3;
  return [
    faceBase(k),
    k.line('M19.4 22.2L27.2 19.6M44.6 22.2L36.8 19.6', { sw: 1.6 }),
    k.eye(24.4, 28, 3.2),
    k.eye(39.6, 28, 3.2),
    k.line('M24.4 44.4Q32 37.6 39.6 44.4', { sw: 1.8 }),
    tear(k, 41, 36.6, 2.2),
    tear(k, 22.6, [37, 42.4, 47.8][f], 2.6),
  ].join('');
}

/** Laugh: the face laughing so hard it shakes, tears flying. */
export function laugh(k) {
  const f = k.frame % 2;
  return k.g(
    `rotate(${f ? 7 : -7} 32 34)`,
    faceBase(k),
    k.line('M18.6 25.6L27.4 28.4L18.6 31.2M45.4 25.6L36.6 28.4L45.4 31.2', { sw: 1.8 }),
    k.openSmile(32, 36.4, 20, 7.6),
    tear(k, 12.6, f ? 22 : 25, 2.4),
    tear(k, 51.4, f ? 25 : 22, 2.4),
  );
}

// --- Things --------------------------------------------------------------------

/** The padlock's body (close has the same). */
function padlockBody(k) {
  const c = k.P;
  return [
    k.poly([[14.4, 28.4], [49.6, 28.4], [49.6, 55.4], [14.4, 55.4]], 5.4, c.amber),
    k.flat('M15.8 47.6H48.2V50.4C48.2 52.4 46.8 54.1 44.8 54.1H19.2C17.2 54.1 15.8 52.4 15.8 50.4Z', c.amberShade),
    k.shine('M19.6 34.6V40.6', 2.4),
  ].join('');
}

/** Open: a padlock springing open. */
export function open(k) {
  const c = k.P;
  const f = k.frame % 2;
  const lift = f ? 2.4 : 0;
  return [
    k.limb(`M22.6 31V${fmt(15.6 + lift)}A9.4 9.4 0 0 1 41.4 ${fmt(15.6 + lift)}V${fmt(21 + lift)}`, c.silver, 8.6),
    padlockBody(k),
    k.flatCircle(32, 38.8, 3.4, c.ink),
    k.flat('M30.4 40.4L29.4 47H34.6L33.6 40.4Z', c.ink),
    f ? '' : k.line('M47.6 17.6L51.4 14.6M48.6 22.6H53M46.6 12.4L48 8.6', { sw: 1.4 }),
  ].join('');
}

/** Lock: a padlock, the key in it turning. */
export function lock(k) {
  const c = k.P;
  const turned = k.frame % 2 === 1;
  return [
    k.limb('M22.6 30.4V22.6A9.4 9.4 0 0 1 41.4 22.6V30.4', c.silver, 8.6),
    padlockBody(k),
    turned ? k.rect(24.4, 38.4, 15.2, 5.6, 2.8, c.silver) + k.flatCircle(27.6, 41.2, 1.2, c.charcoal) : k.rect(29.2, 33.4, 5.6, 15.2, 2.8, c.silver) + k.flatCircle(32, 36.6, 1.2, c.charcoal),
    turned ? k.line(arcPath(32, 41.2, 11.4, 200, 250), { sw: 1.4 }) : '',
  ].join('');
}

/** Choose: Leo pointing at the balloon he wants: the red one, or the blue one? */
export function choose(k) {
  const c = k.P;
  const f = k.frame % 2;
  const s = 0.8;
  const h = f ? [35, 38.6] : [33, 32];
  const to = f ? [52, 36] : [46, 16];
  const len = Math.hypot(to[0] - h[0], to[1] - h[1]);
  const tip = [h[0] + ((to[0] - h[0]) / len) * 3.6, h[1] + ((to[1] - h[1]) / len) * 3.6];
  const balloon = (x, y, rx, ry, color) =>
    k.line(`M${pt([x, y + ry])}Q${pt([x - 3, y + ry + 6])} ${pt([x - 1, y + ry + 14])}`, { color: c.charcoal, sw: 1.2 }) +
    k.ellipse(x, y, rx, ry, c[color]) +
    k.flat(`M${pt([x + rx * 0.3, y - ry * 0.8])}C${pt([x + rx * 0.9, y - ry * 0.4])} ${pt([x + rx * 0.9, y + ry * 0.4])} ${pt([x + rx * 0.2, y + ry * 0.9])}C${pt([x + rx * 0.6, y + ry * 0.2])} ${pt([x + rx * 0.6, y - ry * 0.3])} ${pt([x + rx * 0.3, y - ry * 0.8])}Z`, c[`${color}Shade`]) +
    k.shine(`M${pt([x - rx * 0.55, y - ry * 0.05])}Q${pt([x - rx * 0.5, y - ry * 0.55])} ${pt([x - rx * 0.1, y - ry * 0.72])}`, 1.6);
  return [
    // the one he picks gets a ring round it
    f ? '' : k.line(ringPath(46, 16, 10), { color: c.yellow, sw: 2.2 }),
    balloon(46, 16, 6, 7.4, 'red'),
    balloon(52, 37, 5.4, 6.6, 'blue'),
    f ? '' : sparkle(k, 57.6, 5, 3.4) + sparkle(k, 35, 6, 2.2),
    placed(k, CAST.leo, { face: f ? 'smile' : 'grin', look: 1.6, armFront: [[38.4, 34.8], [44, f ? 36 : 30], poseAt(20, 60, s)(h)] }, 20, 60, s),
    k.limb(`M${pt(h)}L${pt(tip)}`, c.skin3, 4.4),
    hand(k, h, 'skin3', s),
  ].join('');
}

/** Teach: the teacher at the blackboard, pointing at the shapes. */
export function teach(k) {
  const c = k.P;
  const f = k.frame % 2;
  const s = 0.85;
  const h = [36.6, 30.6];
  const to = f ? [24.4, 19.4] : [15.4, 18.4];
  const chalk = { color: c.white, sw: 1.4 };
  return [
    k.rect(2, 6, 32.6, 30, 1.6, c.wood),
    k.rect(4.4, 8.4, 27.8, 25.2, 0.6, c.charcoal),
    k.line(ringPath(12, 16.6, 3.6), chalk),
    k.line('M20.6 22.6L25 14.2L29.4 22.6Z', chalk),
    k.line('M8.4 24.4H15.4V30.4H8.4Z', chalk),
    k.line('M20.6 27.4H28.4M24.5 23.6V31.2', chalk),
    k.rect(2, 36, 32.6, 2.6, 1, c.woodShade),
    placed(k, CAST.opettaja, { face: 'grin', look: -2, armBack: [[25.6, 34.8], [19.6, 31], poseAt(46, 60, s)(h)] }, 46, 60, s),
    k.limb(`M${pt(h)}L${pt(to)}`, c.brown, 3.8),
    hand(k, h, 'skin2', s),
  ].join('');
}

/** Learn: Leo in a graduation cap, holding up his diploma; the tassel swings. */
export function learn(k) {
  const c = k.P;
  const f = k.frame % 2;
  const tx = f ? 43.4 : 45.6;
  return [
    leo(k, { face: f ? 'smile' : 'grin', armFront: [[38.4, 34.8], [45, 30], [47.4, 21.4]] }),
    k.path('M22.4 8.4H41.6V12.8C38.6 14.2 25.4 14.2 22.4 12.8Z', c.navy),
    k.poly([[32, 1], [50, 6.4], [32, 11.8], [14, 6.4]], [1, 1.4, 1, 1.4], c.navy),
    k.line('M32 6.4L44.6 8.6', { color: c.yellow, sw: 1.6 }),
    k.limb(`M44.6 8.6L${fmt(tx)} 15`, c.yellow, 4),
    k.g('rotate(-24 49 16)', k.rect(41, 13.4, 16, 5.4, 2.6, c.white), k.flat('M47.6 13.8H50V18.4H47.6Z', c.red)),
    hand(k, [47.4, 21.4]),
    f ? '' : sparkle(k, 58, 8, 3.2) + sparkle(k, 38.6, 3.6, 2),
  ].join('');
}

/** Wake up: Leo sitting up in bed and stretching, the alarm clock ringing. */
export function wakeUp(k) {
  const c = k.P;
  const f = k.frame % 2;
  const pose = f
    ? { face: 'sleepy', armBack: [[25.6, 34.8], [21, 40], [22, 44]], armFront: [[38.4, 34.8], [44, 33], [36.4, 25]] }
    : { face: 'o', armBack: [[25.6, 34.8], [19.6, 28], [18.4, 21.6]], armFront: [[38.4, 34.8], [44.4, 28], [45.6, 21.6]] };
  return [
    k.rect(2, 26, 6, 34, 1.6, c.wood),
    k.ellipse(15, 39.6, 8.4, 4.6, c.white),
    placed(k, CAST.leo, pose, 24, 60, 1),
    k.path('M4 47.4Q4 43.6 8 43.6H46V58H4Z', c.blue),
    k.flat('M5 44.6H45V47.6H5Z', c.sky),
    k.rect(2, 57, 46, 4, 1, c.wood),
    k.rect(48, 44, 14, 16, 1.4, c.wood),
    k.g(
      `rotate(${f ? 8 : -8} 55 42)`,
      k.line('M51.4 41.4L50 44M58.6 41.4L60 44', { sw: 1.4 }),
      k.circle(51, 30.4, 2.6, c.yellow),
      k.circle(59, 30.4, 2.6, c.yellow),
      k.circle(55, 36, 6.4, c.red),
      k.circle(55, 36, 4.4, c.white),
      k.line('M55 36V32.8M55 36H57.4', { sw: 1.2 }),
    ),
    f ? '' : k.line('M47.6 26.4L45.6 24.4M62 26.4L64 24.4M55 26L55 23', { sw: 1.4 }),
  ].join('');
}

const GROWN = { skin: 'skin1', hair: { style: 'long', color: 'blonde' }, top: { kind: 'shirt', color: 'red' }, bottom: { kind: 'skirt', color: 'navy' }, shoes: 'charcoal' };
const OLD = { skin: 'skin1', hair: { style: 'bun', color: 'greyHair' }, top: { kind: 'cardigan', color: 'red', trim: 'white' }, bottom: { kind: 'skirt', color: 'navy' }, shoes: 'brown', glasses: true };

/** Grow old: a girl, then a woman, then a grandma, coming one after another. */
export function growOld(k) {
  // all three (the still picture), then the girl, then the girl and the woman
  const shown = [3, 1, 2][k.frame % 3];
  const arms = { armBack: [[25.6, 34.8], [22.8, 44.6]], armFront: [[38.4, 34.8], [41.2, 44.6]] };
  const people = [
    [CAST.aino, 10.6, 0.46],
    [GROWN, 29, 0.6],
    [OLD, 50, 0.74],
  ].slice(0, shown);
  const arrows = ['M18.6 41.6L21 44L18.6 46.4', 'M37.6 39.6L40 42L37.6 44.4'].slice(0, shown - 1);
  return [...people.map(([look, x, s]) => placed(k, look, { ...arms, face: 'grin' }, x, 58, s)), ...arrows.map((d) => k.line(d, { sw: 1.6 }))].join('');
}

/** Warm up: Leo in his hat and scarf, warming his hands at a campfire. */
export function warmUp(k) {
  const c = k.P;
  const s = 0.85;
  const pose = { face: 'laugh', look: 2, armBack: [[25.6, 34.8], [34, 40], [44, 37.6]], armFront: [[38.4, 34.8], [45, 38], [47.4, 35]] };
  const wear = [
    k.path('M18.6 19.6A13.4 13.4 0 0 1 45.4 19.6Z', c.red),
    k.rect(18, 15.6, 28, 5.4, 2.2, c.redShade),
    k.circle(32, 5.4, 3.4, c.white),
    k.rect(23.4, 30.4, 17.2, 4.8, 2.2, c.blue),
    k.rect(33.4, 33.6, 4.6, 9.4, 1.6, c.blue),
  ];
  return [
    k.g(`translate(${fmt(48 - 32 * 0.56)} ${fmt(58 - 58.6 * 0.56)}) scale(.56)`, campfire(k)),
    placed(k, CAST.leo, pose, 20, 60, s, ...wear, arm(k, CAST.leo, pose.armBack), arm(k, CAST.leo, pose.armFront)),
  ].join('');
}

/** Buy: Leo pushing his shopping cart along, full of food. */
export function buy(k) {
  const c = k.P;
  const walking = walkPose(k);
  const grip = [44.5, 29.25];
  const pose = {
    ...walking,
    torso: 5,
    face: 'grin',
    armBack: [[29, 35.4 + walking.bob], [38, 38], grip],
    armFront: [[38.6, 35.4 + walking.bob], [44, 37], grip],
  };
  return [
    k.ground(46, 57.6, 15, 1.8),
    k.ellipse(40.4, 30, 6.4, 3.6, c.amber),
    k.line('M37 28.6L38.4 31M40.4 28L41.8 30.4M43.8 28.6L45 31', { color: c.amberShade, sw: 1.2 }),
    k.circle(48.6, 29.4, 3.4, c.red),
    k.rect(51.6, 21.6, 5.4, 10.6, 0.8, c.white),
    k.flat('M52.2 25H56.4V28H52.2Z', c.blue),
    k.poly([[30, 31.6], [60, 31.6], [56.4, 47], [34.4, 47]], 1, c.silver),
    k.line('M39.4 32.6L40.4 46M45.4 32.6V46M51.4 32.6L50.4 46M32 38.6H58.4', { color: c.silverShade, sw: 1.2 }),
    k.limb('M34.4 47L36 52.4H55L56.4 47', c.charcoal, 3.8),
    wheel(k, 37, 54.4, 2.8),
    wheel(k, 54, 54.4, 2.8),
    k.limb('M23.4 34.6L31.4 32.4', c.charcoal, 4),
    placed(k, CAST.leo, pose, 16, 60, 0.8),
  ].join('');
}

// --- More verbs: hearing, getting, taking, remembering, living, the captain's ---

/** A bell hanging from (x, y), its clapper below. */
function bell(k, x, y) {
  const c = k.P;
  const at = (dx, dy) => pt([x + dx, y + dy]);
  return [
    k.circle(x, y + 1.6, 1.8, c.amberShade),
    k.circle(x, y + 23.4, 2.4, c.charcoal),
    k.path(`M${at(-8, 18)}C${at(-8, 8)} ${at(-6, 3)} ${at(0, 3)}C${at(6, 3)} ${at(8, 8)} ${at(8, 18)}L${at(10, 21.4)}H${fmt(x - 10)}Z`, c.yellow),
    k.flat(`M${at(3.6, 4.4)}C${at(6.4, 6.6)} ${at(7, 11)} ${at(7, 18.4)}L${at(8.6, 20.4)}H${fmt(x + 4.6)}C${at(5.4, 13)} ${at(5.2, 7.6)} ${at(3.6, 4.4)}Z`, c.yellowShade),
    k.shine(`M${at(-4.6, 16)}Q${at(-4.8, 9)} ${at(-1.6, 6.6)}`, 1.8),
  ].join('');
}

/** Hear: a bell rings — Leo turns to it, all ears. */
export function hear(k) {
  const c = k.P;
  const f = k.frame % 2;
  return [
    placed(k, CAST.leo, { face: 'o', look: 2.6 }, 22, 60, 0.86),
    k.limb('M9.4 3.2V9.2', c.red, 4.4),
    k.circle(9.4, 13.2, 2, c.red),
    k.g(`translate(51 6) rotate(${f ? 10 : -10}) scale(.84) translate(-51 -6)`, bell(k, 51, 6)),
    ...(f ? [14.6] : [11, 14.6]).map((r) => k.line(arcPath(51, 18, r, 160, 200), { sw: 1.8 })),
  ].join('');
}

/** A present, its top-left corner at (x, y). */
function present(k, x, y) {
  const c = k.P;
  return [
    k.rect(x, y, 10.8, 10, 1.2, c.red),
    k.flat(`M${fmt(x + 4.6)} ${fmt(y + 0.6)}H${fmt(x + 6.2)}V${fmt(y + 9.4)}H${fmt(x + 4.6)}Z`, c.yellow),
    k.flat(`M${fmt(x + 0.6)} ${fmt(y + 4)}H${fmt(x + 10.2)}V${fmt(y + 5.6)}H${fmt(x + 0.6)}Z`, c.yellow),
    k.path(`M${fmt(x + 5.4)} ${fmt(y)}C${fmt(x + 3)} ${fmt(y - 4)} ${fmt(x)} ${fmt(y - 2.2)} ${fmt(x + 2.4)} ${fmt(y)}ZM${fmt(x + 5.4)} ${fmt(y)}C${fmt(x + 7.8)} ${fmt(y - 4)} ${fmt(x + 10.8)} ${fmt(y - 2.2)} ${fmt(x + 8.4)} ${fmt(y)}Z`, c.yellow),
  ].join('');
}

/** Get: a present drops into Leo's open hands. */
export function get(k) {
  const caught = k.frame % 2 === 1;
  const hands = [[45.6, 41.2], [53.4, 39.8]];
  const y = caught ? 29.4 : 11.4;
  return [
    leo(k, {
      face: caught ? 'laugh' : 'o',
      look: 1.8,
      armBack: [[25.6, 34.8], [34, 45], hands[0]],
      armFront: [[38.4, 34.8], [48, 44.4], hands[1]],
    }),
    present(k, 44.6, y),
    caught ? sparkle(k, 59.4, 25, 3.2) + sparkle(k, 41, 26, 2.4) : k.line('M47.6 2.6V7M52.4 3.4V7.8', { sw: 1.4 }),
    hand(k, hands[0]),
    hand(k, hands[1]),
  ].join('');
}

/** Carry (take somewhere): Leo walking off with a box, an arrow showing the way. */
export function carry(k) {
  const c = k.P;
  const pose = walkPose(k);
  const b = pose.bob;
  const hands = [[39.8, 41.4 + b], [52.4, 40.4 + b]];
  const nudge = k.frame % 2 ? 1.4 : 0;
  return [
    k.g(
      'translate(-7 0)',
      person(k, CAST.leo, {
        ...pose,
        face: 'grin',
        armBack: [[29, 35.4 + b], [34, 42.4 + b], hands[0]],
        armFront: [[38.6, 35.4 + b], [46.6, 42.6 + b], hands[1]],
      }),
      k.rect(39.4, 28.4 + b, 13.6, 12.6, 1.4, c.wood),
      k.flat(`M44.6 ${fmt(29 + b)}H47.8V${fmt(40.4 + b)}H44.6Z`, c.tan),
      k.flat(`M50.4 ${fmt(29 + b)}H52.4V${fmt(40.4 + b)}H50.4Z`, c.woodShade),
      hand(k, hands[0]),
      hand(k, hands[1]),
    ),
    k.poly([[49 + nudge, 12.6], [55 + nudge, 12.6], [55 + nudge, 9], [62 + nudge, 15.2], [55 + nudge, 21.4], [55 + nudge, 17.8], [49 + nudge, 17.8]], 1, c.brand),
  ].join('');
}

/** A thought bubble at (x, y), w × h, and the little puffs leading up to it. */
function thought(k, x, y, w, h) {
  const c = k.P;
  return [
    k.circle(31.6, 19.2, 1.5, c.white),
    k.circle(34.4, 16.6, 2.3, c.white),
    k.path(roundPoly([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], Math.min(w, h) / 2), c.white),
    k.shine(`M${pt([x - w / 2 + 2.6, y + 1])}Q${pt([x - w / 2 + 2.8, y - h / 2 + 2.4])} ${pt([x - w / 2 + 6.4, y - h / 2 + 2])}`, 1.4),
  ].join('');
}

/** Leo, smaller, on the picture's left: where his head is, and a hand drawn again over it. */
const SMALL = { x: 21, ground: 60, s: 0.8 };
const smallLeo = (k, pose, ...extra) => placed(k, CAST.leo, pose, SMALL.x, SMALL.ground, SMALL.s, ...extra);
const smallAt = poseAt(SMALL.x, SMALL.ground, SMALL.s);

/** Remember: a hand to his chin, Leo thinks… and the bulb lights up. */
export function remember(k) {
  const c = k.P;
  const on = k.frame % 2 === 1;
  const chin = [26.4, 37.4];
  return [
    smallLeo(k, { face: on ? 'grin' : 'smile', look: 1, armFront: [[38.4, 34.8], [45.4, 41], smallAt(chin)] }),
    hand(k, chin, 'skin3', SMALL.s),
    thought(k, 48.6, 12, 24, 18),
    on ? k.line('M40.6 10.6H42.4M54.8 10.6H56.6M42.8 4.8L44 6M54.4 4.8L53.2 6', { color: c.amber, sw: 1.6 }) : '',
    k.circle(48.6, 10.6, 4, on ? c.yellow : c.silver),
    on ? k.shineDot(47.2, 9.2, 1.1) : '',
    k.rect(46.6, 14.2, 4, 3.2, 1, c.grey),
  ].join('');
}

/** Forget: Leo scratching his head — the thought has gone, all but a "?". */
export function forget(k) {
  const c = k.P;
  const f = k.frame % 2;
  const scratch = f ? [24.6, 18.4] : [27.4, 19.4];
  return [
    smallLeo(k, { face: 'o', look: 1, armFront: [[38.4, 34.8], [48.4, 26.4], smallAt(scratch)] }),
    hand(k, scratch, 'skin3', SMALL.s),
    thought(k, 48.6, 12, 22, 20),
    k.g(`rotate(${f ? 10 : -6} 48.6 12)`, k.limb('M44.8 8.2C44.8 3.4 52.4 3.4 52.4 8.2C52.4 11.2 48.6 11.4 48.6 14.8V15.4', c.greyShade, 4.4), k.circle(48.6, 19, 2, c.greyShade)),
  ].join('');
}

/** Live: Leo at home, waving from his window. */
export function live(k) {
  const c = k.P;
  const f = k.frame % 2;
  const wave = f ? [46.2, 31.6] : [44.2, 34.4];
  return [
    k.ground(32, 59, 25, 2.2),
    k.poly([[6.6, 19], [57.4, 19], [57.4, 57.4], [6.6, 57.4]], 2, c.cream),
    k.flat('M50.6 22H56.2V56.2H50.6Z', c.creamShade),
    k.poly([[32, 2.4], [62, 22.4], [2, 22.4]], [3, 2, 2], c.red),
    k.flat('M3.8 21.2H60.2L58.4 19.6H5.6Z', c.redShade),
    k.shine('M17.6 15.6L26.4 9.6', 2),
    // the window, Leo in it
    k.rect(16.4, 27, 31.2, 22.4, 2, c.sky, { sw: 2 }),
    k.flat('M17.6 28.2H23L17.6 37.4Z', c.pink),
    k.flat('M46.4 28.2H41L46.4 37.4Z', c.pink),
    k.g('translate(8.96 25.6) scale(.72)', portrait(k, CAST.leo, 'grin')),
    k.limb(`M43 47.4L${pt(wave)}`, c.green, 6.4),
    k.circle(...wave, 2.6, c.skin3),
    k.line(f ? 'M48.8 27.4L51.4 25M50.2 31.4H53.6' : 'M47.4 30.4L50 28M48.4 34.6H51.8', { sw: 1.4 }),
    // the sill and its flowers
    k.rect(14.6, 48.4, 34.8, 3.6, 1.2, c.wood),
    k.circle(21, 46.6, 1.8, c.red),
    k.circle(26.4, 46.2, 1.8, c.yellow),
    k.circle(37.6, 46.2, 1.8, c.red),
    k.circle(43, 46.6, 1.8, c.yellow),
  ].join('');
}

/** Order: a megaphone calling out loud. */
export function order(k) {
  const c = k.P;
  const f = k.frame % 2;
  return [
    k.limb('M21.4 37.4L17.6 49.6', c.charcoal, 5.4),
    k.rect(7.4, 27.2, 9, 9.6, 2.2, c.charcoal),
    k.poly([[15, 26.4], [44, 12.6], [44, 51.4], [15, 37.6]], [1.4, 2, 2, 1.4], c.red),
    k.flat('M24.6 22.2L29.2 20V44L24.6 41.8Z', c.white),
    k.flat('M15.8 34.6L43.2 47.6V50.4L15.8 37Z', c.redShade),
    k.ellipse(44, 32, 3.8, 19.4, c.redShade),
    k.shine('M18.6 29.4L36.2 20.6', 1.8),
    ...[10.4, 15.6].slice(0, f ? 2 : 1).map((r) => k.line(arcPath(44, 32, r, -42, 42), { sw: 2 })),
  ].join('');
}

/** Touch: a fingertip touches the water, and the ripples spread. */
export function touch(k) {
  const c = k.P;
  const f = k.frame % 3;
  const ring = (rx, ry) => k.line(`M${pt([31 - rx, 49])}A${fmt(rx)} ${fmt(ry)} 0 1 0 ${pt([31 + rx, 49])}A${fmt(rx)} ${fmt(ry)} 0 1 0 ${pt([31 - rx, 49])}`, { color: c.white, sw: 1.6 });
  return [
    k.ellipse(32, 50, 28, 10.4, c.water),
    k.flat('M6 52.4Q32 64 58 52.4Q50 60.4 32 60.6Q14 60.4 6 52.4Z', c.waterShade),
    ...[[5.6, 2], [11, 3.8], [16.6, 5.8]].slice(0, f + 1).map(([rx, ry]) => ring(rx, ry)),
    k.limb('M60.4 12.4L44.6 30.4', c.green, 9.4),
    k.limb('M39.4 36.6L32 46.8', c.skin3, 4.6),
    k.circle(41.4, 33.4, 5, c.skin3),
    k.circle(45.4, 35.4, 2.2, c.skin3),
  ].join('');
}

/** An arrow pointing up, its tip at (x, y). */
const arrowUp = (k, x, y) => k.poly([[x, y], [x + 5.4, y + 6], [x + 2, y + 6], [x + 2, y + 12], [x - 2, y + 12], [x - 2, y + 6], [x - 5.4, y + 6]], 1, k.P.brand);

/** Lift: Leo lifting a box up over his head. */
export function lift(k) {
  const c = k.P;
  const up = k.frame % 2 === 1;
  const x = 32;
  const ground = 62;
  const s = 0.76;
  const at = poseAt(x, ground, s);
  const hy = up ? 16.6 : 20.4;
  const hands = [[22.4, hy], [41.6, hy]];
  return [
    placed(k, CAST.leo, { face: up ? 'grin' : 'o', armBack: [[25.6, 34.8], [16.4, 22.6], at(hands[0])], armFront: [[38.4, 34.8], [47.6, 22.6], at(hands[1])] }, x, ground, s),
    k.rect(20, hy - 13.6, 24, 13.6, 1.6, c.wood),
    k.flat(`M29.6 ${fmt(hy - 13)}H34.4V${fmt(hy - 0.6)}H29.6Z`, c.tan),
    k.flat(`M40.6 ${fmt(hy - 13)}H43.4V${fmt(hy - 0.6)}H40.6Z`, c.woodShade),
    hand(k, hands[0], 'skin3', s),
    hand(k, hands[1], 'skin3', s),
    arrowUp(k, 8, up ? 20 : 24),
    arrowUp(k, 56, up ? 20 : 24),
  ].join('');
}

// --- Play: games and music ---------------------------------------------------------

/** A die, its top-left at (x, y), w wide, turned `rot` degrees, showing `n` pips. */
function die(k, x, y, w, rot, n) {
  const c = k.P;
  const cx = x + w / 2;
  const cy = y + w / 2;
  const spots = {
    3: [[0.26, 0.26], [0.5, 0.5], [0.74, 0.74]],
    5: [[0.26, 0.26], [0.74, 0.26], [0.5, 0.5], [0.26, 0.74], [0.74, 0.74]],
  }[n];
  return k.g(
    `rotate(${rot} ${pt([cx, cy])})`,
    k.rect(x, y, w, w, w * 0.22, c.white),
    k.flat(`M${pt([x + w * 0.12, y + w * 0.8])}H${fmt(x + w * 0.88)}V${fmt(y + w * 0.88)}H${fmt(x + w * 0.12)}Z`, c.silver),
    ...spots.map(([u, v]) => k.flatCircle(x + w * u, y + w * v, w * 0.085, c.charcoal)),
  );
}

/** Play games: a board game, the die tumbling, the pieces on their path. */
export function playGame(k) {
  const c = k.P;
  const rolling = k.frame % 2 === 0;
  const path = [];
  const colors = ['red', 'yellow', 'green', 'blue'];
  for (let i = 0; i < 8; i++) {
    const x0 = 9.4 + i * 5.8;
    path.push(k.flat(`M${fmt(x0)} 46.6H${fmt(x0 + 5)}L${fmt(x0 + 5.6)} 52H${fmt(x0 + 0.6)}Z`, c[colors[i % 4]]));
  }
  const piece = (x, y, col) =>
    k.path(`M${fmt(x - 3.4)} ${fmt(y)}L${fmt(x)} ${fmt(y - 9)}L${fmt(x + 3.4)} ${fmt(y)}Z`, c[col]) + k.circle(x, y - 9.6, 2.6, c[col]);
  return [
    k.ground(32, 58.6, 28, 2),
    k.poly([[10, 34], [54, 34], [60, 55], [4, 55]], 2, c.cream),
    k.flat('M6.4 53H57.6L58.4 54.4H5.6Z', c.creamShade),
    ...path,
    k.circle(32, 40.6, 3.6, c.purple),
    piece(17, 48, 'red'),
    piece(41, 48, 'blue'),
    rolling ? die(k, 38, 10, 12, 24, 3) + k.speed(37, [14, 18], 5) : die(k, 22, 28.6, 10, -8, 5),
  ].join('');
}

/** Play music: Leo playing a recorder, eyes shut, the notes rising. */
export function playMusic(k) {
  const c = k.P;
  const f = k.frame % 2;
  return [
    leo(k, {
      face: 'sleepy',
      armBack: [[25.6, 34.8], [28, 42], [36.4, 36.6]],
      armFront: [[38.4, 34.8], [45.4, 42.6], [43, 43.4]],
    }),
    k.limb('M33.6 27.4L46 47', c.sky, 4.4),
    k.ellipse(46.6, 48, 3.4, 2.2, c.sky),
    k.flatCircle(39.4, 37.8, 0.9, c.navy),
    k.flatCircle(42.4, 42.4, 0.9, c.navy),
    hand(k, [36.4, 36.6]),
    hand(k, [43, 43.4]),
    note(k, f ? 52 : 50, f ? 16 : 20, 'purple'),
    note(k, f ? 12 : 10, f ? 12 : 16, 'blue'),
  ].join('');
}

/** Brush: Leo brushing his teeth, the brush going back and forth, foam at his mouth. */
export function brush(k) {
  const c = k.P;
  const f = k.frame % 2;
  const dx = f ? -1.6 : 1.4;
  const h = [43.6 + dx, 30.6];
  const foam = f ? [[27.4, 30.4, 1.8], [24.6, 27.4, 1.4], [29.6, 33.4, 1.3]] : [[28.4, 31.4, 1.6], [25.6, 29.4, 1.8], [23.6, 26.4, 1.3]];
  return [
    leo(k, { face: 'grin', armFront: [[38.4, 34.8], [47.6, 38.6], h] }),
    k.limb(`M${fmt(35.6 + dx)} 28.6L${fmt(50.6 + dx)} 31.6`, c.blue, 4.4),
    k.rect(30.6 + dx, 25.4, 6, 3.4, 1.2, c.white),
    hand(k, h),
    ...foam.map(([x, y, r]) => k.circle(x, y, r, c.white, { sw: 1.5 })),
  ].join('');
}

/** Put on: Leo pulling on a sweater — his arms up in its sleeves, his head
 *  through the neck, the sweater sliding down over his shirt. */
export function putOn(k) {
  const c = k.P;
  const hem = k.frame % 2 ? 46 : 40.6;
  const hb = [16.6, 11.6];
  const hf = [47.4, 11.6];
  return [
    leo(k, { face: 'grin', armBack: [[25.6, 34.8], [19.6, 24.6], hb], armFront: [[38.4, 34.8], [44.4, 24.6], hf] }),
    // the sleeves, up the raised arms
    k.limb(`M25.6 32.6L19.6 24.6L${fmt(hb[0] + 0.4)} ${fmt(hb[1] + 4)}`, c.red, 8.6),
    k.limb(`M38.4 32.6L44.4 24.6L${fmt(hf[0] - 0.4)} ${fmt(hf[1] + 4)}`, c.red, 8.6),
    // the body of the sweater, sliding down, its white band and ribbed hem
    k.path(`M23.4 28.6H40.6L41.4 ${fmt(hem)}H22.6Z`, c.red),
    k.flat('M23.2 32.6H40.8L41 35.6H23Z', c.white),
    k.flat(`M22.8 ${fmt(hem - 2.6)}H41.2L41.4 ${fmt(hem)}H22.6Z`, c.redShade),
    hand(k, hb),
    hand(k, hf),
    // the head, through the neck
    portrait(k, CAST.leo, 'grin'),
  ].join('');
}

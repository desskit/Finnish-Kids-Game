// Story props: what the stories show that isn't a word of its own. Three more
// faces (worried, surprised, shh!), clocks at the hours the stories ask about,
// a microphone, a window, a red ball, Leo bowing (sorry!), a waving hand,
// pressed hands (thank you), meat on the bone, a tulip for May, a Christmas
// tree for December, and the signs the stories share with the rest of the app:
// a calendar page, 1 2 3, a "no" sign and a chequered finish flag.

import { crescentPath, fmt, polar, pt, roundPoly, starPoints } from './kit.mjs';
import { cheeks, faceBase, tear } from './faces.mjs';
import { note } from './freetime.mjs';
import { CAST, person, POSES } from './people.mjs';

/** A four-pointed sparkle (nothing when r is 0). */
const sparkle = (k, x, y, r, color = 'yellow') => (r ? k.flat(roundPoly(starPoints(x, y, r, r * 0.34, 4), 0.3), k.P[color]) : '');

// --- Faces -----------------------------------------------------------------------

/** Worried: brows up in the middle, a wobbly mouth, a bead of sweat sliding down. */
export function worried(k) {
  const f = k.frame % 2;
  const zig = f ? [42.8, 40.6] : [40.6, 42.8];
  const xs = [24.4, 28.2, 32, 35.8, 39.6];
  return [
    faceBase(k),
    k.line('M19.4 22.2L27.2 19.6M44.6 22.2L36.8 19.6', { sw: 1.6 }),
    k.eye(24.4, 28.4, 3.2),
    k.eye(39.6, 28.4, 3.2),
    k.line(`M${xs.map((x, i) => `${fmt(x)} ${fmt(zig[i % 2])}`).join('L')}`, { sw: 1.8 }),
    tear(k, 49.2, f ? 26 : 22.6, 2.2),
  ].join('');
}

/** Surprised: brows shot up, the mouth a round "oh!". */
export function surprised(k) {
  const c = k.P;
  const f = k.frame % 2;
  const up = f ? 1.4 : 0;
  const y = (n) => fmt(n - up);
  return [
    faceBase(k),
    k.line(`M18.6 ${y(20.4)}Q23.6 ${y(15.4)} 28.6 ${y(19.4)}M35.4 ${y(19.4)}Q40.4 ${y(15.4)} 45.4 ${y(20.4)}`, { sw: 1.6 }),
    k.eye(24.4, 27.8, 3.2),
    k.eye(39.6, 27.8, 3.2),
    k.ellipse(32, 42.6, f ? 4.4 : 3.6, f ? 5.8 : 4.8, c.mouth),
    // a jolt of surprise
    f ? k.line('M6.6 13.4L11 17.4M10.6 7.4L13.4 13M57.4 13.4L53 17.4M53.4 7.4L50.6 13', { sw: 1.8 }) : '',
  ].join('');
}

/** Shh!: a finger to the lips, the eyes glancing round to see who's listening. */
export function shush(k) {
  const c = k.P;
  const look = k.frames > 1 ? [0, -2.6, 0, 2.6][k.frame % 4] : 0;
  return [
    faceBase(k),
    k.line('M19.6 21.6Q24.4 19.2 29.2 21.6M34.8 21.6Q39.6 19.2 44.4 21.6', { sw: 1.4 }),
    k.eye(24.4 + look, 28.2, 3.2),
    k.eye(39.6 + look, 28.2, 3.2),
    cheeks(k),
    k.ellipse(32.4, 42.6, 5, 2.8, c.mouth),
    // the hand: a fist at the chin, one finger up over the lips
    k.rect(27.8, 32.6, 6, 18, 3, c.yellow),
    k.rect(22.6, 45.4, 17, 13.2, 5.4, c.yellow),
    k.flat('M23.6 52.4H39.4V53C39.4 55.4 37.6 57.6 35 57.6H28C25.4 57.6 23.6 55.4 23.6 53Z', c.yellowShade),
    k.line('M28.6 49.4H38.4', { sw: 1.2 }),
  ].join('');
}

// --- Clocks ----------------------------------------------------------------------

/** A round wall clock at a whole hour: the long hand up at twelve, the short one at the hour. */
export function oclock(k, hour) {
  const c = k.P;
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const [x, y] = polar(32, 32, 18.4, -90 + i * 30);
    ticks.push(i % 3 === 0 ? k.flatCircle(x, y, 1.7, c.charcoal) : k.flatCircle(x, y, 1, c.grey));
  }
  return [
    k.circle(32, 32, 26, c.blue),
    k.flat(crescentPath(32, 32, 26, -10, 120, 0.14), c.blueShade),
    k.shine(`M${pt(polar(32, 32, 23.4, 200))}A23.4 23.4 0 0 1 ${pt(polar(32, 32, 23.4, 236))}`, 2),
    k.circle(32, 32, 21.2, c.white),
    ...ticks,
    k.line('M32 32V15.4', { sw: 2 }),
    k.line(`M32 32L${pt(polar(32, 32, 10.6, -90 + hour * 30))}`, { sw: 3.2 }),
    k.flatCircle(32, 32, 2.2, c.red),
  ].join('');
}

// --- Things ----------------------------------------------------------------------

/** A microphone; notes float up when someone sings into it. */
export function microphone(k) {
  const c = k.P;
  const n = k.frame % 3;
  // the mesh: lines across the head, each cut to the circle
  const [hx, hy, hr] = [32, 17.4, 11];
  const mesh = [];
  for (const d of [-5, 0, 5]) {
    const h = Math.sqrt(hr * hr - d * d) - 1.2;
    mesh.push(`M${fmt(hx + d - 0.6)} ${fmt(hy - h)}H${fmt(hx + d + 0.6)}V${fmt(hy + h)}H${fmt(hx + d - 0.6)}Z`);
    mesh.push(`M${fmt(hx - h)} ${fmt(hy + d - 0.6)}V${fmt(hy + d + 0.6)}H${fmt(hx + h)}V${fmt(hy + d - 0.6)}Z`);
  }
  return [
    k.ground(30, 58.6, 11, 2),
    k.g(
      'rotate(28 32 38)',
      k.path('M26.4 30H37.6L35.4 55.4Q32 58.4 28.6 55.4Z', c.charcoal),
      k.flat('M33.8 31H36.6L34.6 54.8Q34 55.6 33 56.2Z', c.charcoalShade),
      k.rect(25, 26.6, 14, 5.6, 1.6, c.red),
      k.circle(hx, hy, hr, c.silver),
      k.flat(mesh.join(''), c.grey),
      k.shine(`M${pt(polar(hx, hy, 8, 200))}A8 8 0 0 1 ${pt(polar(hx, hy, 8, 250))}`, 2.2),
    ),
    n >= 1 ? note(k, 55, 12.6, 'purple') : '',
    n >= 2 ? note(k, 10, 22, 'blue') : '',
  ].join('');
}

/** A window: four panes of sky in a white frame, the curtains tied back. */
export function windowpane(k) {
  const c = k.P;
  const pane = (x, y, w, h) => k.rect(x, y, w, h, 0.8, c.sky);
  const glint = (x, y) => k.flat(`M${fmt(x)} ${fmt(y + 7)}L${fmt(x + 7)} ${fmt(y)}H${fmt(x + 10)}L${fmt(x)} ${fmt(y + 10)}Z`, c.white);
  const curtain = (s) => {
    const X = (x) => fmt(32 + s * x);
    return (
      k.path(`M${X(29)} 6.4H${X(19.4)}C${X(18.6)} 16 ${X(17.6)} 26 ${X(21.4)} 32.4C${X(18.4)} 40 ${X(19.6)} 48 ${X(21.4)} 52.6H${X(29)}Z`, c.coral) +
      k.flat(`M${X(26.4)} 8H${X(24.6)}V51H${X(26.4)}Z`, c.coralShade) +
      k.rect(s < 0 ? 32 - 23.4 : 32 + 19.4, 30.6, 4, 3.6, 1, c.yellow)
    );
  };
  return [
    k.ground(32, 58.6, 24, 2),
    k.rect(11, 7.4, 42, 45.2, 1.6, c.white),
    pane(14.4, 10.8, 15.8, 18.4),
    pane(33.8, 10.8, 15.8, 18.4),
    pane(14.4, 32.6, 15.8, 16.6),
    pane(33.8, 32.6, 15.8, 16.6),
    k.flat('M16.8 25.6A3.4 3.4 0 0 1 19.6 20.6A4.4 4.4 0 0 1 27.4 21.4A3 3 0 0 1 28.8 25.6Z', c.white),
    glint(36.4, 12.6),
    glint(15.6, 36.4),
    curtain(-1),
    curtain(1),
    k.limb('M4.6 6.4H59.4', c.wood, 3.8),
    k.rect(7.6, 51.6, 48.8, 5.4, 1.2, c.wood),
    k.flat('M8.6 55H55.4V56H8.6Z', c.woodShade),
  ].join('');
}

/** A red rubber ball, bouncing: down (squashed), up, coming down. */
export function redBall(k) {
  const c = k.P;
  const f = [1, 2, 1, 0][k.frame % 4];
  const [lift, squash] = [[0, 0.9], [-5, 1], [-10, 1]][f];
  const cy = 40 + lift;
  return [
    k.ground(32, 56.6, [14, 11, 8][f], 2.2),
    k.g(
      `translate(32 54) scale(${f === 0 ? 1.08 : 1} ${squash}) translate(-32 -54)`,
      k.circle(32, cy, 14, c.red),
      k.flat(crescentPath(32, cy, 14, -10, 130, 0.24), c.redShade),
      k.shine(`M${pt(polar(32, cy, 9.6, 200))}A9.6 9.6 0 0 1 ${pt(polar(32, cy, 9.6, 244))}`, 2.4),
    ),
  ].join('');
}

/** Meat on the bone. */
export function meat(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 21, 2.4),
    k.g(
      'rotate(-26 32 38)',
      k.circle(54.4, 33.4, 4.6, c.cream),
      k.circle(54.4, 41.6, 4.6, c.cream),
      k.rect(36, 34, 19, 7.2, 3, c.cream),
      k.flat('M37 38.8H54.4V40.2H37Z', c.creamShade),
      k.path('M8 37.6C8 27 17 21.4 26.6 22.4C35.4 23.4 41.6 29.6 41.6 37.6C41.6 45.6 35.4 51.8 26.6 52.8C17 53.8 8 48.2 8 37.6Z', c.ginger),
      k.flat('M9 41.4C11.4 47.8 18 51.8 26.6 51.4C34.2 51 39.6 46.6 40.8 41.4C37.4 46 31.6 48.4 25 48.4C17.6 48.4 11.8 45.6 9 41.4Z', c.gingerShade),
      k.line('M19.6 34.6L23 38.6M26.6 31.6L30 35.6M24.6 41L27.6 44.4', { color: c.gingerShade, sw: 2 }),
      k.shine('M13.6 31.4Q17.4 26 24 25.6', 2.4),
    ),
  ].join('');
}

/** A tulip, swaying a little. */
export function tulip(k) {
  const c = k.P;
  const sway = k.frames > 1 && k.frame % 2 ? 5 : -2;
  return [
    k.ground(32, 58.6, 11, 2),
    k.path('M31.4 57.4C23 53 18.6 43 20.4 30.6C26 37.6 30 46 32.6 56.4Z', c.green),
    k.path('M32.6 57.4C40.6 51.6 45 43 43.6 33.4C38 39.6 34 47.6 31.6 56.4Z', c.green),
    k.flat('M22 35.6C23.4 43 26.6 49.6 31.4 55.4L30 55.6C25.4 51 22.6 44 22 35.6Z', c.greenShade),
    k.g(
      `rotate(${sway} 32 57)`,
      k.limb('M32 57V30', c.green, 3.8),
      k.path('M21.6 13.6L27 19.6L32 11.4L37 19.6L42.4 13.6C45 24.6 41.4 32.6 32 33.6C22.6 32.6 19 24.6 21.6 13.6Z', c.red),
      k.flat('M38.6 21.4C40.4 19 41.4 16.6 41.8 15.2C43.4 23.6 40.6 30.6 33.6 32.6C37.6 29.6 39.2 25.6 38.6 21.4Z', c.redShade),
      k.path('M26.4 20.6Q32 16.4 37.6 20.6L36.4 30.4Q32 33.2 27.6 30.4Z', c.red),
      k.shine('M24.4 18.6Q23.6 23.6 25 27.6', 1.8),
    ),
  ].join('');
}

/** A Christmas tree: a star on top, its lights blinking. */
export function christmasTree(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 2 : 0;
  const tiers = [
    [32, 9.6, 9.6, 23],
    [32, 18.6, 14.4, 35.4],
    [32, 29.6, 19.6, 48.6],
  ];
  const lights = [
    [27.4, 20.4],
    [36.6, 22],
    [24.4, 31.6],
    [32, 33.4],
    [40, 31],
    [20.4, 44.6],
    [28.4, 45.6],
    [36.4, 45.4],
    [43.6, 43.6],
  ];
  const colors = ['red', 'blue', 'yellow'];
  return [
    k.ground(32, 58.6, 17, 2.4),
    k.rect(28.8, 47, 6.4, 6, 1, c.brown),
    k.poly([[22, 51], [42, 51], [40.4, 58], [23.6, 58]], 1.2, c.red),
    k.flat('M36.4 52H41L39.6 57H35.4Z', c.redShade),
    ...tiers.map(([x, top, w, bottom]) =>
      k.poly([[x, top], [x + w, bottom], [x - w, bottom]], [2, 2.4, 2.4], c.green) +
      k.flat(`M${fmt(x + 1)} ${fmt(top + 3.4)}L${fmt(x + w - 1.6)} ${fmt(bottom - 1)}H${fmt(x + 3)}Z`, c.greenShade),
    ),
    ...lights.map(([x, y], i) => k.circle(x, y, 1.9, c[colors[(i + f) % 3]], { sw: 1 })),
    k.path(roundPoly(starPoints(32, 9, 6.4, 2.8), 0.5), c.yellow),
    f ? sparkle(k, 44.6, 7, 3.4, 'starlight') + sparkle(k, 18.4, 13, 2.6, 'starlight') : '',
  ].join('');
}

// --- People and hands ----------------------------------------------------------

/** Sorry!: Leo bowing low, eyes squeezed shut (and coming up a little). */
export function bow(k) {
  const low = !(k.frames > 1 && k.frame % 2);
  const deep = low ? 50 : 30;
  const a = (deep * Math.PI) / 180;
  const rot = ([x, y]) => [32 + (x - 32) * Math.cos(a) - (y - 46) * Math.sin(a), 46 + (x - 32) * Math.sin(a) + (y - 46) * Math.cos(a)];
  const shoulderF = rot([34, 34.6]);
  const shoulderB = rot([30.6, 34.6]);
  const hang = ([x, y]) => [
    [x, y],
    [x + 0.6, y + 5],
    [x + 1.4, y + 10],
  ];
  const head = rot([32.6, 23]);
  return k.g(
    `translate(${fmt(-(head[0] - 32) * 0.5)} 0)`,
    person(k, CAST.leo, {
      ...POSES.stand,
      head: [head[0], head[1] + (low ? 2.4 : 1)],
      tilt: low ? 34 : 16,
      hips: low ? 10 : 6,
      look: 2.6,
      torso: deep,
      armsInFront: false,
      armBack: hang(shoulderB),
      armFront: hang(shoulderF),
      legBack: [[30.4, 46], [30, 55.4]],
      legFront: [[33.6, 46], [34, 55.4]],
      toes: 0.8,
      face: 'shut',
    }),
  );
}

/** An open hand, palm to you, fingers up, in its blue cuff (on the 64 canvas, wrist at the bottom). */
export function palm(k) {
  const c = k.P;
  const skin = c.skin2;
  return [
    k.g('rotate(-38 22.6 41)', k.rect(16.4, 27, 7, 17, 3.5, skin)),
    k.rect(19.4, 11.4, 6.6, 24, 3.3, skin),
    k.rect(26.6, 7.6, 6.6, 26, 3.3, skin),
    k.rect(33.8, 9.4, 6.6, 24, 3.3, skin),
    k.rect(40.6, 15, 6, 19, 3, skin),
    k.rect(19, 27, 28, 25.6, 9, skin),
    k.flat('M42 31.6C45 38 44.6 46 39.4 51.6C44.6 50 47 45 47 38.6Z', c.skin2Shade),
    k.line('M26 40.6Q31.4 43.6 37.4 41.4', { color: c.skin2Shade, sw: 1.4 }),
    k.rect(21, 49.6, 22, 8, 2.4, c.blue),
  ].join('');
}

/** Hi! and bye!: a hand waving, wave lines beside it. */
export function wave(k) {
  const f = k.frames > 1 ? k.frame % 2 : 0;
  return [
    k.g(`rotate(${f ? 12 : -14} 32 56)`, palm(k)),
    f
      ? k.line('M8.6 12.6Q5.6 18.6 7.6 25.4M13.4 9.6Q9.6 15.6 11.4 21.4', { sw: 1.8 })
      : k.line('M53.6 8.6Q58.6 13.6 58 21M48.6 6.6Q53 10.6 53.4 16.6', { sw: 1.8 }),
  ].join('');
}

/** Thank you: two hands pressed together, fingers up, sparkles of thanks round them. */
export function thanks(k) {
  const c = k.P;
  const f = k.frames > 1 ? k.frame % 2 : 0;
  // each hand: the fingers step down and out from the fingertips at the top
  const hand = (s) => {
    const X = (x) => fmt(32 + s * x);
    return k.path(
      `M${X(0)} 9.6Q${X(3.6)} 9.6 ${X(4)} 13.4V15.4Q${X(7.4)} 14.6 ${X(7.8)} 18.4V20.6Q${X(10.6)} 20 ${X(11)} 23.6V26.4Q${X(13.2)} 26.2 ${X(13.4)} 29.6V36C${X(13.4)} 42 ${X(11)} 46 ${X(7)} 48H${X(0)}Z`,
      c.skin2,
    );
  };
  return [
    k.ground(32, 58.6, 15, 2.2),
    hand(-1),
    hand(1),
    k.flat('M41.6 35.6C41.4 41 39.4 44.6 36.4 46.6H33V44C37.4 43.2 40.6 40.4 41.6 35.6Z', c.skin2Shade),
    // the thumbs, pressed together in front
    k.rect(28.6, 29.4, 6.8, 15.4, 3.4, c.skin2),
    k.line('M32 32.4V44.4', { color: c.skin2Shade, sw: 1.2 }),
    k.poly([[21.4, 47.4], [31.4, 47.4], [30.6, 58], [19, 58]], 1.6, c.blue),
    k.poly([[32.6, 47.4], [42.6, 47.4], [45, 58], [33.4, 58]], 1.6, c.blue),
    sparkle(k, 13, f ? 14 : 17, f ? 4.4 : 3),
    sparkle(k, 51, f ? 17 : 13, f ? 3 : 4.4),
    sparkle(k, 52.6, 34, f ? 0 : 2.4),
    sparkle(k, 10.6, 32, f ? 2.4 : 0),
  ].join('');
}

// --- Signs -----------------------------------------------------------------------

/** A calendar page: binder rings on a red top, a month of days with one ringed. */
export function calendar(k) {
  const c = k.P;
  const days = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 7; col++) {
      const [x, y] = [14.6 + col * 5.6, 29.6 + row * 6];
      if (row === 2 && col === 4) continue;
      days.push(`M${fmt(x - 1.6)} ${fmt(y - 1.6)}H${fmt(x + 1.6)}V${fmt(y + 1.6)}H${fmt(x - 1.6)}Z`);
    }
  }
  return [
    k.ground(32, 58.6, 22, 2.2),
    k.rect(8.6, 9.6, 46.8, 46.4, 3, c.white),
    k.flat('M9.6 13.4A2.8 2.8 0 0 1 12.4 10.6H51.6A2.8 2.8 0 0 1 54.4 13.4V22.4H9.6Z', c.red),
    k.line('M9.6 22.6H54.4'),
    k.flat('M10.6 17.4H53.4V21.4H10.6Z', c.redShade),
    k.flat(days.join(''), c.grey),
    k.rect(35.4, 39.8, 4, 3.6, 0.6, c.blue),
    k.line('M37.4 36.2A4.8 4.8 0 1 1 37.39 36.2', { color: c.red, sw: 1.6 }),
    k.rect(17.4, 5.6, 4, 9.6, 2, c.silver),
    k.rect(42.6, 5.6, 4, 9.6, 2, c.silver),
  ].join('');
}

/** 1 2 3 on a blue tile: numbers, counting. */
export function oneTwoThree(k) {
  const c = k.P;
  const digit = (d) => k.line(d, { color: c.white, sw: 3 });
  return [
    k.ground(32, 58.6, 24, 2.2),
    k.rect(5.4, 14, 53.2, 38.6, 5, c.blue),
    k.flat('M6.4 46.6H57.6V47.6C57.6 49.6 56 51.6 53.6 51.6H10.4C8 51.6 6.4 49.6 6.4 47.6Z', c.blueShade),
    digit('M13.4 25.8L17.6 22.6V43.8M13.4 43.8H21.8'),
    digit('M26 27Q26.6 22.6 31.2 22.6Q36 22.6 36 27.4Q36 30.8 32 34.4L25.8 43.8H36.8'),
    digit('M41 24.8Q42.4 22.6 45.6 22.6Q50.6 22.6 50.6 27.4Q50.6 32 45.8 32.8Q51 33.4 51 38.4Q51 43.8 45.6 43.8Q41.8 43.8 40.4 41'),
  ].join('');
}

/** No!: a red ring with a bar across it. */
export function noSign(k) {
  const c = k.P;
  const r = 18.4;
  const half = 3.8;
  const x = Math.sqrt(r * r - half * half);
  const seg = (s) => k.path(`M${pt([-x, s * half])}A${r} ${r} 0 0 ${s < 0 ? 1 : 0} ${pt([x, s * half])}Z`, c.white);
  return [
    k.circle(32, 32, 26, c.red),
    k.flat(crescentPath(32, 32, 26, -10, 120, 0.14), c.redShade),
    k.shine(`M${pt(polar(32, 32, 23.6, 200))}A23.6 23.6 0 0 1 ${pt(polar(32, 32, 23.6, 236))}`, 2),
    k.g('translate(32 32) rotate(45)', seg(-1), seg(1)),
  ].join('');
}

/** The finish: a chequered flag flapping on its pole. */
export function finishFlag(k) {
  const c = k.P;
  const ph = k.frames > 1 && k.frame % 2 ? Math.PI : 0;
  const [x0, x1, y0, y1] = [17.4, 56.6, 8.6, 35.6];
  // the flag ripples more the further it is from the pole
  const at = (u, v) => {
    const x = x0 + (x1 - x0) * u;
    return [x, y0 + (y1 - y0) * v + 3 * u * Math.sin(u * Math.PI * 1.8 + ph)];
  };
  const N = 12;
  const edge = [...Array.from({ length: N + 1 }, (_, i) => at(i / N, 0)), ...Array.from({ length: N + 1 }, (_, i) => at(1 - i / N, 1))];
  const [cols, rows] = [5, 3];
  const checks = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if ((i + j) % 2) continue;
      const q = [at(i / cols, j / rows), at((i + 0.5) / cols, j / rows), at((i + 1) / cols, j / rows), at((i + 1) / cols, (j + 1) / rows), at((i + 0.5) / cols, (j + 1) / rows), at(i / cols, (j + 1) / rows)];
      checks.push(`M${q.map(pt).join('L')}Z`);
    }
  }
  return [
    k.ground(16, 58.6, 8, 2),
    k.path(`M${edge.map(pt).join('L')}Z`, c.white),
    k.flat(checks.join(''), c.charcoal),
    k.limb('M16 58V7', c.wood, 4.4),
    k.circle(16, 6, 3, c.yellow),
  ].join('');
}

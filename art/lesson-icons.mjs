// Lesson, unit, can-do and conversation icons: music notes, a bell and a drum
// for the alphabet corner; a compass, a map pin, a thinking face, rewind, heart
// hands, open hands, crossed arms, a spiral calendar, scales, a finger pointing
// at you, a mirror, the shopkeeper, a bus stop sign, a monkey hiding its eyes,
// heart eyes, two hearts and Mirri out walking.

import { crescentPath, fmt, heartPath, polar, pt } from './kit.mjs';
import { cheeks, faceBase } from './faces.mjs';
import { catHead } from './animals.mjs';
import { CAST, person, portrait, POSES } from './people.mjs';
import { palm } from './props.mjs';

const frameOf = (k, n = 2) => (k.frames > 1 ? k.frame % n : 0);

// --- The alphabet corner ------------------------------------------------------------

/** A song: two notes joined by a beam and one on its own, bobbing. */
export function musicNotes(k) {
  const c = k.P;
  const b = frameOf(k) ? -1.6 : 1.6;
  return [
    k.g(
      `translate(0 ${fmt(b)})`,
      k.limb('M20.6 44V17.4M42.6 39.6V12.8', c.purple, 4.4),
      k.poly(
        [
          [18.4, 15.4],
          [44.8, 10.6],
          [44.8, 18.2],
          [18.4, 23],
        ],
        1,
        c.purple,
      ),
      k.ellipse(15.8, 45, 6.4, 4.8, c.purple),
      k.ellipse(37.8, 40.6, 6.4, 4.8, c.purple),
    ),
    k.g(
      `translate(0 ${fmt(-b)})`,
      k.limb('M55.4 49V29.4Q60.6 31.4 60 38.4', c.blue, 4.4),
      k.ellipse(50.6, 50, 6, 4.6, c.blue),
    ),
  ].join('');
}

/** A bell, swinging and ringing. */
export function bell(k) {
  const c = k.P;
  const f = frameOf(k);
  return [
    f ? k.line('M8.4 22Q5 29 8.4 36M13.4 18.6Q9 27 13.4 36', { sw: 1.8 }) : k.line('M55.6 22Q59 29 55.6 36M50.6 18.6Q55 27 50.6 36', { sw: 1.8 }),
    k.g(
      `rotate(${f ? 14 : -10} 32 9)`,
      k.circle(32, 8.6, 3.6, c.amber),
      k.circle(32, 51.4, 4.8, c.amberShade),
      k.path('M32 11.4C21.6 11.4 18.4 20.6 18.4 29.4V39.4C18.4 42.4 14.4 44 12.4 46.6V50.6H51.6V46.6C49.6 44 45.6 42.4 45.6 39.4V29.4C45.6 20.6 42.4 11.4 32 11.4Z', c.yellow),
      k.flat('M39.4 14.6C43 17.6 44.6 23 44.6 29.4V39.4C44.6 42.6 47.6 44.4 50.6 46.6V49.6H42C42 46 40.6 43 40.6 39.4V29.4C40.6 23.6 40.4 18.6 39.4 14.6Z', c.yellowShade),
      k.rect(10.6, 46.4, 42.8, 5, 2.4, c.amber),
      k.shine('M24.4 20Q22.6 26 23 34', 2.4),
    ),
  ].join('');
}

/** A drum, the sticks taking turns. */
export function drum(k) {
  const c = k.P;
  const f = frameOf(k);
  const cords = [];
  for (let i = 0; i < 5; i++) cords.push(`M${fmt(12 + i * 10)} ${i % 2 ? 51 : 34}L${fmt(17 + i * 10)} ${i % 2 ? 34 : 51}`);
  return [
    k.ground(32, 58.6, 23, 2.2),
    k.path('M10 31V47.6C10 52.6 19.8 56.4 32 56.4C44.2 56.4 54 52.6 54 47.6V31Z', c.red),
    k.flat('M44 33.4C48 33 51 32.4 53 31.4V47.6C53 50.6 49.6 53 44 54.4Z', c.redShade),
    k.line(cords.join(''), { color: c.white, sw: 1.6 }),
    k.path('M10 48C10 53 20 56.4 32 56.4C44 56.4 54 53 54 48V51C54 55.6 44 59 32 59C20 59 10 55.6 10 51Z', c.amber),
    k.ellipse(32, 31, 22, 7.2, c.cream),
    k.g(`rotate(${f ? 14 : -4} 9 9)`, k.limb('M9 9L27.6 25', c.wood, 4.2), k.circle(28.4, 25.6, 2.8, c.woodShade)),
    k.g(`rotate(${f ? 4 : -14} 55 9)`, k.limb('M55 9L36.4 25', c.wood, 4.2), k.circle(35.6, 25.6, 2.8, c.woodShade)),
  ].join('');
}

// --- Where -----------------------------------------------------------------------

/** Around: a compass, its needle settling. */
export function compass(k) {
  const c = k.P;
  const turn = frameOf(k) ? 9 : -5;
  const marks = [0, 90, 180, 270].map((a) => k.flatCircle(...polar(32, 34, 16.4, a - 90), 1.7, c.charcoal));
  const small = [45, 135, 225, 315].map((a) => k.flatCircle(...polar(32, 34, 16.4, a - 90), 1, c.grey));
  return [
    k.limb('M28.4 7.6A3.6 3.6 0 0 1 35.6 7.6', c.amber, 3.8),
    k.circle(32, 34, 24.6, c.amber),
    k.flat(crescentPath(32, 34, 24.6, -10, 120, 0.14), c.amberShade),
    k.shine(`M${pt(polar(32, 34, 22.2, 200))}A22.2 22.2 0 0 1 ${pt(polar(32, 34, 22.2, 236))}`, 2),
    k.circle(32, 34, 19.4, c.white),
    ...marks,
    ...small,
    k.g(
      `rotate(${turn} 32 34)`,
      k.poly(
        [
          [32, 18],
          [36.6, 34],
          [27.4, 34],
        ],
        0.6,
        c.red,
      ),
      k.poly(
        [
          [27.4, 34],
          [36.6, 34],
          [32, 50],
        ],
        0.6,
        c.silverShade,
      ),
    ),
    k.circle(32, 34, 2.4, c.charcoal),
  ].join('');
}

/** Where: a red map pin, bouncing down onto its spot. */
export function locationPin(k) {
  const c = k.P;
  const up = frameOf(k) ? -3 : 0;
  return [
    k.ground(32, 57.6, up ? 6.6 : 9, 2),
    k.g(
      `translate(0 ${up})`,
      k.path('M32 55C27 46 15 37 15 25C15 15.4 22.6 8 32 8C41.4 8 49 15.4 49 25C49 37 37 46 32 55Z', c.red),
      k.flat('M42.6 12.6C46.2 15.4 48 19.8 48 25C48 35.6 38.6 44 33.4 52.4C36 45 44 37 45 27.4C45.6 21.6 45 16.6 42.6 12.6Z', c.redShade),
      k.circle(32, 24.6, 6.6, c.white),
      k.shine('M20.6 20Q22.4 14 28 11.8', 2.4),
    ),
  ].join('');
}

// --- Faces, hands and people --------------------------------------------------------

/** Question words: a thinking face, its hand at its chin, a question popping up. */
export function thinking(k) {
  const c = k.P;
  const f = frameOf(k);
  return [
    faceBase(k),
    k.line('M18.6 21Q23.6 16.6 28.8 19M35.4 22.4L44.6 21.4', { sw: 1.6 }),
    k.eye(24.4, 27.8, 3.2),
    k.eye(39.6, 28, 3.2),
    k.line('M30 42.6L39.6 40', { sw: 1.8 }),
    k.rect(15.6, 44.2, 15.6, 12.6, 5.6, c.yellow),
    k.rect(22.6, 40.4, 13.4, 5.6, 2.8, c.yellow),
    k.flat('M16.6 51.4H30.2V52.4C30.2 54.4 28.6 55.8 26.6 55.8H20.2C18.2 55.8 16.6 54.4 16.6 52.4Z', c.yellowShade),
    k.line('M20.6 49.6H29', { sw: 1.2 }),
    f ? k.line('M50.4 6.6Q50.4 2.6 54.2 2.6Q58 2.6 58 6.4Q58 9 54.6 10.6V13', { sw: 2.4 }) + k.flatCircle(54.6, 16.4, 1.5, c.ink) : '',
  ].join('');
}

/** What happened: the rewind button. */
export function rewind(k) {
  const c = k.P;
  const tri = (x) =>
    k.poly(
      [
        [x, 32],
        [x + 14.4, 21.4],
        [x + 14.4, 42.6],
      ],
      1,
      c.white,
    );
  return [
    k.rect(8, 10, 48, 44, 9, c.blue),
    k.flat('M9 45H55V46C55 50 52 53 48 53H16C12 53 9 50 9 46Z', c.blueShade),
    k.rect(15.4, 21.4, 5.2, 21.2, 1, c.white),
    tri(34),
    tri(21.4),
  ].join('');
}

/** Me and you: two hands holding up a heart, the heart beating. */
export function heartHands(k) {
  const c = k.P;
  const s = frameOf(k) ? 1.1 : 1;
  const hand = (m) => k.g(`translate(${m < 0 ? 64 : 0} 0) scale(${m} 1)`, k.g('translate(45.4 47.6) rotate(-62) scale(0.5) translate(-32 -40)', palm(k)));
  return [
    hand(-1),
    hand(1),
    k.g(`translate(32 25) scale(${s}) translate(-32 -25)`, k.path(heartPath(32, 8.6, 34, 31), c.red), k.shine('M20.4 16.4Q21.8 13 25.4 12.6', 2.4)),
  ].join('');
}

/** These are…: two open hands. */
export function openHands(k) {
  return [
    k.g('translate(4.4 8) rotate(-16 22 40) scale(0.6) translate(0 6)', k.g('translate(64 0) scale(-1 1)', palm(k))),
    k.g('translate(21.2 8) rotate(16 42 40) scale(0.6) translate(0 6)', palm(k)),
  ].join('');
}

/** No!: Aino with her arms crossed in a big X. */
export function armsCrossed(k) {
  const c = k.P;
  const look = CAST.aino;
  const skin = c[look.skin];
  return [
    k.poly(
      [
        [22.6, 32],
        [41.4, 32],
        [50, 64],
        [14, 64],
      ],
      [5, 5, 1, 1],
      c.red,
    ),
    portrait(k, look, 'sad'),
    k.limb('M14.4 61.6L43.6 32.4', skin, 8.6),
    k.circle(44.6, 31.4, 3.6, skin),
    k.limb('M49.6 61.6L20.4 32.4', skin, 8.6),
    k.circle(19.4, 31.4, 3.6, skin),
  ].join('');
}

/** Mine and yours: a finger pointing at you. */
export function pointingAtYou(k) {
  const c = k.P;
  const skin = c.skin2;
  return [
    k.g('rotate(-30 46 54)', k.rect(37, 44, 18, 14, 2.4, c.blue)),
    k.g(
      'rotate(-24 36 38)',
      k.rect(24.6, 28.4, 24.4, 20.6, 8, skin),
      k.line('M29 40.6Q31.6 43.6 34.4 41M33.6 44Q36.6 47 39.4 44.4M38.6 46.4Q41.4 49 44 46.6', { color: c.skin2Shade, sw: 1.4 }),
      k.rect(30, 24.6, 17, 8.2, 4.1, skin),
    ),
    k.limb('M33 33L22.6 23', skin, 15.4),
    k.circle(21, 21.4, 8.6, skin),
    k.ellipse(19.6, 19.2, 4.4, 3.8, c.skin1),
    k.flat('M14.4 26.6C17.6 30 22.6 30.6 26.4 28.6C24.2 30.6 19.4 31.4 15.6 29Z', c.skin2Shade),
  ].join('');
}

/** Describing words copy: a mirror, a glint crossing it. */
export function mirror(k) {
  const c = k.P;
  const x = [19, 25, 31][k.frames > 1 ? k.frame % 3 : 0];
  const glint = (x0, w) => `M${fmt(x0)} 40L${fmt(x0 + 10)} 19H${fmt(x0 + 10 + w)}L${fmt(x0 + w)} 40Z`;
  return [
    k.ground(32, 58.6, 14, 2),
    k.rect(26, 50, 12, 7, 1.4, c.wood),
    k.ellipse(32, 29.4, 19.4, 24, c.wood),
    k.ellipse(32, 29.4, 14.4, 19, c.skyDay),
    k.flat('M38.6 13.4C43.6 17 46.4 23 46.4 29.4C46.4 38 41.4 45 34.6 47.8C39.6 43 42.6 36.6 42.6 29.4C42.6 23.6 41 18 38.6 13.4Z', c.sky),
    k.flat(glint(x, 4.4), c.white),
    k.flat(glint(x + 7, 2.2), c.white),
  ].join('');
}

/** At the shop: the shopkeeper, in a smart jacket and tie. */
export function shopkeeper(k) {
  const c = k.P;
  const look = { skin: 'skin2', hair: { style: 'short', color: 'darkHair' }, top: { kind: 'cardigan', color: 'navy', trim: 'white' }, bottom: { kind: 'trousers', color: 'charcoal' }, shoes: 'charcoal' };
  return [
    person(k, look, POSES.stand),
    k.poly(
      [
        [27.6, 31.8],
        [36.4, 31.8],
        [32, 37.8],
      ],
      0.6,
      c.white,
      { sw: 1.4 },
    ),
    k.poly(
      [
        [30.8, 33.4],
        [33.2, 33.4],
        [34.2, 42.6],
        [32, 45.4],
        [29.8, 42.6],
      ],
      0.6,
      c.red,
      { sw: 1.4 },
    ),
  ].join('');
}

// --- Places and things ----------------------------------------------------------------

/** A spiral-bound calendar. */
export function spiralCalendar(k) {
  const c = k.P;
  const coils = [];
  for (let i = 0; i < 7; i++) coils.push(k.rect(13.4 + i * 6.2, 5.6, 2.8, 9.4, 1.4, c.grey));
  return [
    k.ground(32, 58.6, 22, 2),
    k.rect(8.6, 10, 46.8, 46, 3, c.white),
    k.flat('M9.6 13A2 2 0 0 1 11.6 11H52.4A2 2 0 0 1 54.4 13V21.6H9.6Z', c.blue),
    k.flat('M9.6 18.4H54.4V21.6H9.6Z', c.blueShade),
    k.line('M9.6 21.8H54.4'),
    k.line('M14 30.4H50M14 38.4H50M14 46.4H50M21.2 25.6V51.4M28.4 25.6V51.4M35.6 25.6V51.4M42.8 25.6V51.4', { color: c.silverShade, sw: 1.2 }),
    k.rect(29.4, 31.6, 5.2, 5.2, 1, c.green),
    k.rect(37, 39.6, 4.8, 5, 1, c.coral),
    ...coils,
  ].join('');
}

/** Have or not, which is more: scales, tipping. */
export function scales(k) {
  const c = k.P;
  const tilt = frameOf(k) ? 7 : -7;
  const a = (tilt * Math.PI) / 180;
  const hook = (dx) => [32 + dx * Math.cos(a), 15 + dx * Math.sin(a)];
  const pan = ([x, y]) =>
    k.line(`M${pt([x, y])}L${pt([x - 8, y + 16])}M${pt([x, y])}L${pt([x + 8, y + 16])}`, { color: c.charcoal, sw: 1.2 }) +
    k.path(`M${pt([x - 11, y + 16])}H${fmt(x + 11)}C${fmt(x + 10)} ${fmt(y + 23)} ${fmt(x - 10)} ${fmt(y + 23)} ${fmt(x - 11)} ${fmt(y + 16)}Z`, c.yellow);
  return [
    k.ground(32, 58.6, 15, 2),
    k.poly(
      [
        [21, 57.4],
        [43, 57.4],
        [39, 51.6],
        [25, 51.6],
      ],
      1,
      c.amber,
    ),
    k.limb('M32 52V13', c.amber, 4.6),
    pan(hook(-21)),
    pan(hook(21)),
    k.g(`rotate(${tilt} 32 15)`, k.limb('M10 15H54', c.amber, 4.4)),
    k.circle(32, 11.4, 3.6, c.amber),
  ].join('');
}

/** At the bus stop: the stop's sign, a bus on it, a timetable under it. */
export function busStopSign(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 10, 2),
    k.limb('M32 58V24', c.grey, 4.6),
    k.rect(25.4, 33, 13.2, 15, 1, c.white),
    k.line('M28 37H36M28 40.4H36M28 43.8H33.6', { color: c.grey, sw: 1.2 }),
    k.rect(14, 4.6, 36, 24.4, 4, c.blue),
    k.flat('M15 24H49V25C49 26.6 47.6 28 46 28H18C16.4 28 15 26.6 15 25Z', c.blueShade),
    k.rect(20.6, 9.6, 22.8, 12.2, 2.4, c.white),
    k.flat('M23 11.6H28.6V15.6H23ZM30.6 11.6H36.2V15.6H30.6ZM38 11.6H41.6V15.6H38Z', c.sky),
    k.circle(26, 21.8, 2.2, c.charcoal),
    k.circle(38, 21.8, 2.2, c.charcoal),
  ].join('');
}

/** Hiding: a monkey with its hands over its eyes, peeking now and then. */
export function seeNoEvil(k) {
  const c = k.P;
  const peek = frameOf(k) === 1;
  const fingers = (x, y) => k.line(`M${fmt(x + 4)} ${fmt(y + 1.2)}V${fmt(y + 4.6)}M${fmt(x + 7.6)} ${fmt(y + 1.2)}V${fmt(y + 4.6)}M${fmt(x + 11.2)} ${fmt(y + 1.2)}V${fmt(y + 4.6)}`, { color: c.tanShade, sw: 1.2 });
  return [
    k.circle(11.6, 30, 7, c.brown),
    k.flatCircle(11.6, 30, 3.8, c.tan),
    k.circle(52.4, 30, 7, c.brown),
    k.flatCircle(52.4, 30, 3.8, c.tan),
    k.ellipse(32, 31, 21, 22.4, c.brown),
    k.path('M32 22.4C27 16.6 15.4 18.6 15.4 30C15.4 42 22.6 51.6 32 51.6C41.4 51.6 48.6 42 48.6 30C48.6 18.6 37 16.6 32 22.4Z', c.tan),
    k.flatEllipse(29.4, 38.4, 1, 1.4, c.brownShade),
    k.flatEllipse(34.6, 38.4, 1, 1.4, c.brownShade),
    k.line('M26 43.6Q32 48.4 38 43.6', { sw: 1.6 }),
    k.blush(20.6, 39, 2.4, 1.4),
    k.blush(43.4, 39, 2.4, 1.4),
    peek ? k.eye(39.6, 30.4, 3) : '',
    k.limb('M9 60L18 38', c.brown, 7.4),
    k.limb(peek ? 'M55 60L47.6 44' : 'M55 60L46 38', c.brown, 7.4),
    k.rect(13.6, 23.4, 16.6, 12.6, 5.4, c.tan),
    fingers(13.6, 23.4),
    peek ? k.rect(38, 40.6, 16.6, 12.6, 5.4, c.tan) + fingers(38, 40.6) : k.rect(33.8, 23.4, 16.6, 12.6, 5.4, c.tan) + fingers(33.8, 23.4),
  ].join('');
}

/** Loving it: a face with hearts for eyes, the hearts beating. */
export function heartEyes(k) {
  const c = k.P;
  const s = frameOf(k) ? 1.16 : 1;
  const heartEye = (x) => k.g(`translate(${fmt(x)} 28) scale(${s}) translate(${fmt(-x)} -28)`, k.path(heartPath(x, 23, 12.6, 11.4), c.red), k.shineDot(x - 3, 25.6, 0.9));
  return [faceBase(k), heartEye(24.4), heartEye(39.6), cheeks(k), k.openSmile(32, 38.6, 16, 5.4)].join('');
}

/** I love…: two hearts, bobbing. */
export function twoHearts(k) {
  const c = k.P;
  const f = frameOf(k);
  return [
    k.g(`translate(0 ${f ? -1.6 : 0}) rotate(-14 25 36)`, k.path(heartPath(25, 21, 34, 31), c.pink), k.shine('M14.4 28.4Q15.4 24.4 19.4 23.4', 2.4)),
    k.g(`translate(0 ${f ? 0 : -1.6}) rotate(14 46 19)`, k.path(heartPath(46, 9.6, 20, 18), c.red), k.shineDot(40.4, 14, 1.2)),
  ].join('');
}

/** Where's the cat going?: Mirri walking, tail up. */
export function walkingCat(k) {
  const c = k.P;
  const f = frameOf(k);
  const leg = (x, color) => k.rect(x - 2.7, 40, 5.4, 15.6, 2.4, color) + k.flatEllipse(x + 0.6, 54.4, 2.6, 1.4, c.white);
  const s = f ? 2.6 : -2.6;
  return [
    k.ground(30, 58.6, 21, 2.2),
    k.limb(f ? 'M14 34C8 30 6.6 21 10.6 13.4' : 'M14 34C7.4 31.4 5.6 22.6 8.6 15', c.grey, 5.6),
    leg(21 - s, c.greyShade),
    leg(41 + s, c.greyShade),
    leg(17 + s, c.grey),
    leg(37 - s, c.grey),
    k.rect(11.6, 29, 35, 15.6, 7.6, c.grey),
    k.flat('M20 30H23.4L22.6 35.4H20.6ZM27 30H30.4L29.6 36H27.6ZM34 30H37.4L36.6 35.4H34.6Z', c.greyShade),
    k.flatEllipse(29, 41.6, 9, 2.4, c.white),
    k.g('translate(45.4 21.6) scale(0.78) translate(-32 -26)', catHead(k)),
  ].join('');
}

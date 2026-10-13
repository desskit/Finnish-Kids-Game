// Sitting animals, front view: the same pear-shaped body as Mirri and Musti
// (sittingBody), each with its own head and tail. All of them blink; most
// move their tail, ears or throat a little.

import { pt, polar, roundPoly, scallops } from './kit.mjs';
import { foxHead, sittingBody } from './animals.mjs';

/** The usual face: eyes, blush, a nose and a small mouth, centred on (x, y). */
function face(k, x, y, { nose = 'ink', noseW = 2.4, eyeGap = 5.6, eyeY = -1.4, mouth = true, mouthY = 5.4 } = {}) {
  const c = k.P;
  const m = (dx, dy) => pt([x + dx, y + mouthY + dy]);
  return [
    k.eye(x - eyeGap, y + eyeY, 2.3),
    k.eye(x + eyeGap, y + eyeY, 2.3),
    k.blush(x - eyeGap - 3.8, y + 3.6, 2.2, 1.4),
    k.blush(x + eyeGap + 3.8, y + 3.6, 2.2, 1.4),
    k.ellipse(x, y + 3.2, noseW, noseW * 0.72, c[nose], { stroke: false }),
    mouth && k.px < 2 ? k.line(`M${m(-2.4, 0)}Q${m(-1.2, 1.4)} ${m(0, 0.2)}Q${m(1.2, 1.4)} ${m(2.4, 0)}`) : '',
  ].join('');
}

/** A tail that swings about its base by `turn` degrees. */
const swing = (k, turn, base, inner) => (turn ? k.g(`rotate(${turn} ${pt(base)})`, inner) : inner);

export function bear(k) {
  const c = k.P;
  const ear = (s) => k.circle(32 + s * 11, 15.4, 4.6, c.brown) + k.flatCircle(32 + s * 11, 15.4, 2.2, c.tan);
  return [
    k.ground(32, 58.6, 14, 2.4),
    sittingBody(k, c.brown, { chest: c.tan, paws: 'tan' }),
    ear(-1),
    ear(1),
    k.ellipse(32, 26, 14, 12.6, c.brown),
    k.flatEllipse(32, 31.2, 6.4, 4.8, c.tan),
    face(k, 32, 26.6, { eyeY: -2.2 }),
  ].join('');
}

export function bunny(k) {
  const c = k.P;
  const twitch = k.frame % 2 ? 14 : 6;
  const ear = (s, turn) =>
    k.g(`rotate(${s * turn} ${pt([32 + s * 5.6, 17])})`, k.ellipse(32 + s * 5.6, 8.6, 3.8, 9.4, c.white) + k.flatEllipse(32 + s * 5.6, 9.4, 1.8, 6.6, c.pink));
  return [
    k.ground(32, 58.6, 14, 2.4),
    k.circle(43, 52.4, 3.6, c.white),
    sittingBody(k, c.white, { chest: c.cream, paws: 'white' }),
    ear(-1, 6),
    ear(1, twitch),
    k.ellipse(32, 27, 13.4, 11.8, c.white),
    face(k, 32, 27.6, { nose: 'pink', noseW: 1.8, eyeY: -2 }),
  ].join('');
}

export function fox(k) {
  const c = k.P;
  const sway = [0, -6, -10, -6][k.frame % 4];
  const tail = swing(
    k,
    sway,
    [40.4, 54],
    k.path('M40.4 54C49.6 55.6 56.4 47.6 52.4 38.6C50.4 34.4 45.6 35.6 46.6 40.2C48 46.4 44.6 50 39.6 49.6Z', c.orange) +
      k.flat('M52.6 39.2C51 35 47 35.2 46.6 39.4C48.4 39 50.8 39.2 52.6 39.2Z', c.white),
  );
  return [
    k.ground(32, 58.6, 15, 2.4),
    tail,
    sittingBody(k, c.orange, { chest: c.white, paws: 'charcoal' }),
    k.flatEllipse(32, 44.6, 4.6, 8, c.white),
    k.g('translate(10.6 4.8) scale(0.67)', foxHead(k)),
  ].join('');
}

export function mouse(k) {
  const c = k.P;
  const flick = k.frame % 2 ? -10 : 0;
  const ear = (s) => k.circle(32 + s * 10.6, 15.6, 6, c.silverShade) + k.flatCircle(32 + s * 10.6, 15.6, 3.6, c.pink);
  return [
    k.ground(32, 58.6, 14, 2.4),
    swing(k, flick, [40.6, 55], k.limb('M40.6 55C48 56.4 53.2 52 51.6 45.6C50.6 41.8 46.6 41.4 46 44.6', c.pink, 4.8)),
    sittingBody(k, c.silverShade, { chest: c.white, paws: 'pink' }),
    ear(-1),
    ear(1),
    k.ellipse(32, 27, 12.6, 11.2, c.silverShade),
    face(k, 32, 27.4, { nose: 'pink', noseW: 1.9, eyeGap: 5, eyeY: -2 }),
    k.px < 2
      ? k.line('M27 30.6L20.4 29.6M27 32.2L20.8 33.4M37 30.6L43.6 29.6M37 32.2L43.2 33.4')
      : '',
  ].join('');
}

export function lion(k) {
  const c = k.P;
  const tuft = k.frame % 2 ? -12 : 0;
  const mane = `M${pt(polar(32, 25.4, 17, -90))}${scallops(32, 25.4, 17, -90, 270, 12, 1.2)}Z`;
  return [
    k.ground(32, 58.6, 15, 2.4),
    swing(k, tuft, [40.6, 54.6], k.limb('M40.6 54.6C47.6 55.2 51 50 50.2 44', c.blonde, 5.4) + k.circle(50.2, 42.6, 3.2, c.orange)),
    sittingBody(k, c.blonde, { chest: c.cream, paws: 'blonde' }),
    k.path(mane, c.orange),
    k.circle(22.4, 15.6, 3.6, c.blonde),
    k.circle(41.6, 15.6, 3.6, c.blonde),
    k.ellipse(32, 26.4, 11.6, 10.6, c.blonde),
    k.flatEllipse(32, 31, 5.6, 4.2, c.cream),
    face(k, 32, 26.8, { nose: 'brown', noseW: 2.2, eyeGap: 5, eyeY: -2.2 }),
  ].join('');
}

export function monkey(k) {
  const c = k.P;
  const curl = k.frame % 2 ? -14 : 0;
  const ear = (s) => k.circle(32 + s * 14.2, 26, 4.4, c.brown) + k.flatCircle(32 + s * 14.2, 26, 2.4, c.tan);
  return [
    k.ground(32, 58.6, 14, 2.4),
    swing(k, curl, [40.4, 54.8], k.limb('M40.4 54.8C48.6 56 53.4 49.6 51.6 43C50.4 38.8 45.6 38.8 45.8 42.6C46 45 48.6 45.2 49 43.6', c.brown, 5.2)),
    sittingBody(k, c.brown, { chest: c.tan, paws: 'tan' }),
    ear(-1),
    ear(1),
    k.ellipse(32, 25.6, 13, 12, c.brown),
    k.flat('M32 22.6C29 18.6 22.4 19.6 22.6 25.4C22.8 30.6 26.6 34.2 32 34.2C37.4 34.2 41.2 30.6 41.4 25.4C41.6 19.6 35 18.6 32 22.6Z', c.tan),
    face(k, 32, 26.4, { nose: 'brown', noseW: 1.6, eyeGap: 4.6, eyeY: -1.6 }),
  ].join('');
}

/**
 * The wolf: sitting side on, head thrown back, howling at the moon. Its eyes
 * are shut while it howls (so it doesn't blink); the howl ripples out and the
 * bushy tail lifts.
 */
export function wolf(k) {
  const c = k.P;
  const f = k.frame % 3;
  // the howl ripples out from the snout's tip
  const howl = (r) => k.line(`M${pt(polar(55.4, 2.8, r, -10))}A${r} ${r} 0 0 1 ${pt(polar(55.4, 2.8, r, 80))}`, { color: c.greyShade, sw: 1.6 });
  return [
    k.path('M15.4 6.2A7.4 7.4 0 1 0 15.4 20.2A9 9 0 0 1 15.4 6.2Z', c.yellow),
    k.ground(28, 58.6, 21, 2.4),
    swing(
      k,
      f === 2 ? -7 : 0,
      [21, 51.6],
      k.path('M22 55.6C15 57 8 55.2 5.4 50.2C4.2 47.8 5.6 45.6 8 46.6C10.6 48 14.6 49.2 21 48.6Z', c.grey) +
        k.flat('M5.4 50.2C4.2 47.8 5.6 45.6 8 46.6C9.2 47.2 10.4 47.8 11.6 48.2L9.6 54C7.6 53.2 6.2 51.8 5.4 50.2Z', c.charcoal),
    ),
    k.limb('M42.8 42V55.6', c.greyShade, 5.2),
    k.path('M16 56C14 50 15 44 19 40C23 36 27 33 30 28C32 25 33 22 34 18H42C43.4 23 44 29 43.4 34C43 38 42 42 42 46V56Z', c.grey),
    k.flat('M41.6 20C43.4 24 44 30 43 35C42.4 38.6 41 41 39.6 43C39 35 39.4 27 41.6 20Z', c.silver),
    k.flat('M16 44C19 39 24 36 28 32.6C30.4 30.4 32 27 33.4 22.6L35.4 23.2C34.4 27.6 32.4 31.6 29.6 34.4C25.4 38.4 20.6 41 17 46Z', c.greyShade),
    k.ellipse(22.4, 48.6, 8.6, 7.6, c.grey),
    k.ellipse(29.6, 56, 4.6, 2, c.grey),
    k.limb('M38.4 42V55.6', c.grey, 5.2),
    k.ellipse(39.6, 56.2, 3.6, 1.8, c.grey),
    // the head, a little bigger than life, thrown back
    k.g(
      'translate(38 22) scale(1.22) translate(-38 -21)',
      k.poly([[35.4, 13], [33.2, 4.4], [39.8, 9.4]], [1, 1.2, 1], c.grey),
      k.flat(roundPoly([[35.8, 11.4], [34.6, 6.8], [38.2, 9.4]], 0.6), c.silver),
      k.path('M33.6 20C32.6 14.6 35 9.6 39.6 8.4L47.6 3.4C49.6 2.2 52 3 52.4 5C52.8 6.8 51.6 8.2 50 9L46.6 11.4C47.4 15.4 45.6 19.4 42.4 21.4Z', c.grey),
      k.flat('M42.4 21.4C45.6 19.4 47.4 15.4 46.6 11.4L50 9C48.6 13.6 46.6 18 43.4 21.6Z', c.silver),
      k.flat('M45 10.8L50.4 8.4L47.2 12.8Z', c.mouth),
      k.flatCircle(52.2, 4.4, 1.3, c.ink),
      k.line('M39.4 12.6Q41.4 14 43.2 12', { sw: 1.6 }),
    ),
    f >= 1 ? howl(4) : '',
    f >= 2 ? howl(7) : '',
  ].join('');
}

export function frog(k) {
  const c = k.P;
  const puff = k.frame % 2 === 1;
  const eyeBump = (s) => k.circle(32 + s * 8.6, 20.4, 5.8, c.green) + k.circle(32 + s * 8.6, 20.6, 3.9, c.white, { stroke: false }) + k.eye(32 + s * 8.6, 20.8, 2.1);
  return [
    k.ground(32, 58.6, 16, 2.4),
    k.path('M21.6 56.6C17.6 50.2 19.4 41.6 25.8 37.6H38.2C44.6 41.6 46.4 50.2 42.4 56.6Z', c.green),
    k.flatEllipse(32, 48.6, 7, 6.6, c.lime),
    k.ellipse(23.4, 56.4, 5, 2.6, c.green),
    k.ellipse(40.6, 56.4, 5, 2.6, c.green),
    k.ellipse(32, 30.6, 15.6, 10.4, c.green),
    puff ? k.ellipse(32, 38.6, 5.4, 3.4, c.lime) : '',
    eyeBump(-1),
    eyeBump(1),
    k.blush(21.6, 32.6, 2.6, 1.5),
    k.blush(42.4, 32.6, 2.6, 1.5),
    k.line('M25.4 32.6Q32 37.4 38.6 32.6'),
  ].join('');
}

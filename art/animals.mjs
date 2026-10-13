// Animals share one plan too: a big round head on a small sitting body, the
// kit's eyes and blush, and a white muzzle or chest where the animal has one.
// Heads are separate functions so the player avatars reuse them.

import { pt, roundPoly } from './kit.mjs';

/** A sitting body (pear shape) with paws, centred under the head. `tailTurn` swings the tail about its base (degrees). */
function sittingBody(k, fur, { chest, paws = 'white', tail, tailTurn = 0 } = {}) {
  const c = k.P;
  const out = [];
  if (tail) {
    const [, bx, by] = /^M([\d.]+) ([\d.]+)/.exec(tail);
    out.push(tailTurn ? k.g(`rotate(${tailTurn} ${bx} ${by})`, k.limb(tail, fur, 7.4)) : k.limb(tail, fur, 7.4));
  }
  out.push(k.path('M22.6 56.6C19 50 21.2 40.4 26.8 36.4H37.2C42.8 40.4 45 50 41.4 56.6Z', fur));
  if (chest) out.push(k.flatEllipse(32, 47.4, 5.6, 7, chest));
  out.push(k.ellipse(27.2, 56.2, 3.8, 2.6, c[paws] ?? paws));
  out.push(k.ellipse(36.8, 56.2, 3.8, 2.6, c[paws] ?? paws));
  return out.join('');
}

/** Mirri's head: a round grey tabby face with pointy ears. Centre (x, y). */
export function catHead(k, x = 32, y = 26) {
  const c = k.P;
  const at = (dx, dy) => [x + dx, y + dy];
  const ear = (s) =>
    k.poly([at(s * -12.6, -3.4), at(s * -11.4, -16.4), at(s * -2.6, -10.6)], [2, 2.4, 2], c.grey) +
    k.flat(roundPoly([at(s * -10.2, -6.4), at(s * -9.8, -12.8), at(s * -5, -9.8)], 1.2), c.pink);
  const whiskers = (s) =>
    k.line(`M${pt(at(s * -8.8, 4.8))}L${pt(at(s * -15.6, 3.8))}M${pt(at(s * -8.8, 6.6))}L${pt(at(s * -15, 7.8))}`, { sw: 1.5 });
  return [
    ear(1),
    ear(-1),
    k.ellipse(x, y, 15, 12.8, c.grey),
    // tabby stripes on the forehead
    k.flat(`M${pt(at(-4.6, -12.2))}Q${pt(at(-4.2, -8.4))} ${pt(at(-3.2, -7.6))}Q${pt(at(-2.6, -9.6))} ${pt(at(-2.4, -12.6))}Z`, c.greyShade),
    k.flat(`M${pt(at(-1.2, -12.8))}Q${pt(at(-0.8, -8.6))} ${pt(at(0, -7.6))}Q${pt(at(0.8, -8.6))} ${pt(at(1.2, -12.8))}Z`, c.greyShade),
    k.flat(`M${pt(at(4.6, -12.2))}Q${pt(at(4.2, -8.4))} ${pt(at(3.2, -7.6))}Q${pt(at(2.6, -9.6))} ${pt(at(2.4, -12.6))}Z`, c.greyShade),
    // muzzle
    k.flatEllipse(x - 2.9, y + 5.6, 3.4, 2.6, c.white),
    k.flatEllipse(x + 2.9, y + 5.6, 3.4, 2.6, c.white),
    k.eye(x - 5.6, y - 0.4, 2.5),
    k.eye(x + 5.6, y - 0.4, 2.5),
    k.blush(x - 9.6, y + 4.4, 2.4, 1.5),
    k.blush(x + 9.6, y + 4.4, 2.4, 1.5),
    k.poly([at(-2.2, 2.8), at(2.2, 2.8), at(0, 5.4)], 0.9, c.pink, { sw: 1.5 }),
    k.line(`M${pt(at(-2.6, 6.6))}Q${pt(at(-1.2, 7.8))} ${pt(at(0, 6.2))}Q${pt(at(1.2, 7.8))} ${pt(at(2.6, 6.6))}`, { sw: 1.5 }),
    // whiskers need a fine grid; on a coarse one they're only clutter
    k.px < 2 ? whiskers(1) + whiskers(-1) : '',
  ].join('');
}

/** Musti's head: black with tan eyebrows and a tan muzzle (like a Finnish Lapphund), floppy ears. */
export function dogHead(k, x = 32, y = 24.5) {
  const c = k.P;
  const at = (dx, dy) => [x + dx, y + dy];
  const ear = (s) =>
    k.path(
      `M${pt(at(s * -10.6, -9.6))}C${pt(at(s * -18.6, -10.4))} ${pt(at(s * -21, 2.4))} ${pt(at(s * -17.2, 8))}C${pt(at(s * -14, 9.4))} ${pt(at(s * -11, 4.6))} ${pt(at(s * -10, -2))}Z`,
      c.charcoal,
    );
  return [
    k.ellipse(x, y, 13.4, 12.2, c.charcoal),
    ear(1),
    ear(-1),
    k.flatEllipse(x - 5.4, y - 6.2, 2.4, 1.5, c.tan),
    k.flatEllipse(x + 5.4, y - 6.2, 2.4, 1.5, c.tan),
    k.eye(x - 5.4, y - 1.2, 2.4),
    k.eye(x + 5.4, y - 1.2, 2.4),
    k.blush(x - 9.4, y + 4.2, 2.2, 1.4),
    k.blush(x + 9.4, y + 4.2, 2.2, 1.4),
    k.flatEllipse(x - 3, y + 6, 4, 3.6, c.tan),
    k.flatEllipse(x + 3, y + 6, 4, 3.6, c.tan),
    k.path(`M${pt(at(0.4, 8.2))}L${pt(at(0.4, 9.8))}Q${pt(at(1.8, 11.6))} ${pt(at(3.2, 9.8))}L${pt(at(3.2, 8.2))}Z`, c.tongue, { sw: 1.5 }),
    k.px < 2 ? k.line(`M${pt(at(0, 5.4))}L${pt(at(0, 7.4))}M${pt(at(-3, 7.2))}Q${pt(at(-1.5, 9))} ${pt(at(0, 7.4))}Q${pt(at(1.5, 9))} ${pt(at(3, 7.2))}`, { sw: 1.5 }) : '',
    k.ellipse(x, y + 3.6, 3, 2.2, c.ink, { stroke: false }),
    k.shineDot(x - 1.1, y + 2.9, 0.8),
  ].join('');
}

/** The fox's head: orange, white cheeks, dark ear tips. Fills the canvas (avatar size). */
export function foxHead(k, x = 32, y = 31) {
  const c = k.P;
  const at = (dx, dy) => [x + dx, y + dy];
  const P = (dx, dy) => pt(at(dx, dy));
  const face = `M${P(0, 19)}C${P(-8, 18)} ${P(-18, 11.4)} ${P(-21, 2)}C${P(-17.6, 1.8)} ${P(-15, 0.6)} ${P(-13, -1.2)}C${P(-16.6, -5.6)} ${P(-17, -13.6)} ${P(-15, -21)}C${P(-10, -18)} ${P(-6.4, -14.6)} ${P(-4.2, -12.4)}C${P(-1.4, -13.2)} ${P(1.4, -13.2)} ${P(4.2, -12.4)}C${P(6.4, -14.6)} ${P(10, -18)} ${P(15, -21)}C${P(17, -13.6)} ${P(16.6, -5.6)} ${P(13, -1.2)}C${P(15, 0.6)} ${P(17.6, 1.8)} ${P(21, 2)}C${P(18, 11.4)} ${P(8, 18)} ${P(0, 19)}Z`;
  const cheeks = `M${P(0, 19)}C${P(-8, 18)} ${P(-18, 11.4)} ${P(-21, 2)}C${P(-14.4, 3.2)} ${P(-8.6, 6.6)} ${P(-4.4, 10.6)}L${P(0, 12.8)}L${P(4.4, 10.6)}C${P(8.6, 6.6)} ${P(14.4, 3.2)} ${P(21, 2)}C${P(18, 11.4)} ${P(8, 18)} ${P(0, 19)}Z`;
  const innerEar = (s) => k.flat(roundPoly([at(s * -13.4, -17.4), at(s * -12.8, -7.6), at(s * -6.6, -12.6)], 1.4), c.charcoal);
  return [
    k.path(face, c.orange),
    innerEar(1),
    innerEar(-1),
    k.flat(cheeks, c.white),
    k.path(face, 'none'),
    k.eye(x - 6.6, y + 0.4, 2.4),
    k.eye(x + 6.6, y + 0.4, 2.4),
    k.blush(x - 10.4, y + 6.2, 2.4, 1.4),
    k.blush(x + 10.4, y + 6.2, 2.4, 1.4),
    k.ellipse(x, y + 15.2, 2.8, 2, c.ink, { stroke: false }),
    k.shineDot(x - 0.9, y + 14.6, 0.7),
  ].join('');
}

/** Mirri: sitting, her tail swaying slowly (4 frames). */
export function cat(k) {
  const sway = [0, -6, -11, -6][k.frame % 4];
  return [
    k.ground(32, 58.6, 14, 2.4),
    sittingBody(k, k.P.grey, { chest: k.P.white, tail: 'M41.6 53.4C49.6 53.6 52.4 46.6 50.6 40.6C49.8 38.2 47.6 37.6 46.4 39', tailTurn: sway }),
    catHead(k),
  ].join('');
}

/** Musti: sitting, wagging (2 frames, quick). */
export function dog(k) {
  const c = k.P;
  const wag = [-6, 14][k.frame % 2];
  return [
    k.ground(32, 58.6, 14, 2.4),
    sittingBody(k, c.charcoal, { chest: c.white, paws: 'tan', tail: 'M41.6 52.6C47.6 52.2 50.6 47 50.8 41.4', tailTurn: k.frames > 1 ? wag : 0 }),
    // collar and tag
    k.poly([[24.8, 36.6], [39.2, 36.6], [38.8, 40.4], [25.2, 40.4]], 1.6, c.red),
    k.circle(32, 42.6, 2.3, c.yellow, { sw: 1.5 }),
    dogHead(k),
  ].join('');
}

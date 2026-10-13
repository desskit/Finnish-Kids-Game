// People: one chibi body plan (big head, short body, chunky limbs) for the whole
// cast and every action word, so a person always looks like they belong to the
// same picture book. A person is a LOOK (who: skin, hair, clothes) in a POSE
// (what they're doing: where the limbs go, which face).

import { polar, pt, roundPoly, scallops } from './kit.mjs';

// --- The cast (fixed looks: keep these when drawing them anywhere) ---------

/** @typedef {{ skin: string, hair: { style: string, color: string, tie?: string }, top: { kind: 'shirt' | 'dress' | 'cardigan', color: string, trim?: string }, bottom?: { kind: 'shorts' | 'trousers' | 'skirt', color: string }, legs?: string, shoes: string, glasses?: boolean }} Look */

/** @type {Record<string, Look>} */
export const CAST = {
  // Aino (👧): golden pigtails with red ties, a red dress.
  aino: { skin: 'skin1', hair: { style: 'pigtails', color: 'blonde', tie: 'red' }, top: { kind: 'dress', color: 'red', trim: 'white' }, shoes: 'navy' },
  // Eero (👦): brown hair with a tuft, a blue shirt, sandy shorts.
  eero: { skin: 'skin2', hair: { style: 'short', color: 'hazel' }, top: { kind: 'shirt', color: 'blue' }, bottom: { kind: 'shorts', color: 'tan' }, shoes: 'red' },
  // Leo (🧒): dark curls, a green shirt, blue shorts. Also the "action kid" of the verb pictures.
  leo: { skin: 'skin3', hair: { style: 'curly', color: 'darkHair' }, top: { kind: 'shirt', color: 'green' }, bottom: { kind: 'shorts', color: 'brand' }, shoes: 'orange' },
  // Äiti (👩): long brown hair, a purple top, a navy skirt.
  aiti: { skin: 'skin1', hair: { style: 'long', color: 'hazel' }, top: { kind: 'shirt', color: 'purple' }, bottom: { kind: 'skirt', color: 'navy' }, shoes: 'charcoal' },
  // Isä (👨): ginger hair and beard, a teal shirt, navy trousers.
  isa: { skin: 'skin1', hair: { style: 'beard', color: 'ginger' }, top: { kind: 'shirt', color: 'teal' }, bottom: { kind: 'trousers', color: 'navy' }, shoes: 'brown' },
  // Isoäiti (👵): a grey bun, glasses, a pink cardigan.
  isoaiti: { skin: 'skin1', hair: { style: 'bun', color: 'greyHair' }, top: { kind: 'cardigan', color: 'pink', trim: 'white' }, bottom: { kind: 'skirt', color: 'purple' }, shoes: 'brown', glasses: true },
  // Opettaja (🧑‍🏫): a dark bob, glasses, a mustard cardigan.
  opettaja: { skin: 'skin2', hair: { style: 'bob', color: 'darkHair' }, top: { kind: 'cardigan', color: 'amber', trim: 'cream' }, bottom: { kind: 'trousers', color: 'charcoal' }, shoes: 'charcoal', glasses: true },
};

/** Family words that aren't story characters. */
export const FAMILY = {
  // brother (🧑): an older boy in a red cap and a yellow hoodie.
  brother: { skin: 'skin1', hair: { style: 'cap', color: 'hazel', cap: 'red' }, top: { kind: 'shirt', color: 'yellow' }, bottom: { kind: 'trousers', color: 'brand' }, shoes: 'charcoal' },
  // grandfather (👴): grey tufts and a moustache, glasses, a brown cardigan.
  grandfather: { skin: 'skin1', hair: { style: 'bald', color: 'greyHair' }, top: { kind: 'cardigan', color: 'wood', trim: 'cream' }, bottom: { kind: 'trousers', color: 'grey' }, shoes: 'brown', glasses: true },
};

// --- Poses -------------------------------------------------------------------

/**
 * Where everything goes. Points are on the 64×64 canvas.
 * - head: centre; look: how far the face turns right (+) or left (−);
 * - torso: degrees the body leans (rotated about the hips' middle);
 * - arms/legs: [shoulder|hip, elbow|knee?, hand|foot] for the picture's left
 *   (back) and right (front) limb. Legs are always behind the body; the back
 *   arm is too, unless `armsInFront` (a person facing us);
 * - toes: how far the shoes point forward (0 when facing us);
 * - bob: how far the body and head rise (negative) this frame, in canvas units;
 * - face: 'smile' | 'grin' | 'laugh' | 'o' | 'sleepy' | 'sad'.
 */
export const POSES = {
  stand: {
    head: [32, 20.5],
    look: 0,
    torso: 0,
    armBack: [[25.6, 34.8], [20.6, 44]],
    armFront: [[38.4, 34.8], [43.4, 44]],
    armsInFront: true,
    legBack: [[28.6, 46], [28.2, 55.4]],
    legFront: [[35.4, 46], [35.8, 55.4]],
    toes: 0,
    face: 'smile',
  },
  run: {
    head: [34, 19.5],
    look: 2.2,
    torso: 9,
    armBack: [[28.4, 35.4], [23.2, 39.6], [20.6, 34.4]],
    armFront: [[39.4, 35.6], [43.4, 41.4], [48.6, 38.6]],
    legBack: [[30, 46.2], [23.8, 49.4], [18.6, 45.2]],
    legFront: [[35.6, 46.4], [41.8, 50.4], [40.6, 55.8]],
    toes: 0.8,
    face: 'grin',
    speed: true,
  },
};

/**
 * A run cycle (4 frames: contact, passing, contact, passing). Legs and arms
 * swing in opposition; on the passing frames the body rises one pixel.
 */
export function runPose(k) {
  const f = k.frame % 4;
  const up = f % 2 ? -k.px : 0;
  const hip = { back: [30, 46.2 + up], front: [35.6, 46.4 + up] };
  const sh = { back: [28.4, 35.4 + up], front: [39.4, 35.6 + up] };
  const ground = 56.2;
  const legs = {
    fwd: (h) => [h, [h[0] + 6.2, h[1] + 4], [h[0] + 5, ground - 0.4]],
    back: (h) => [h, [h[0] - 6.2, h[1] + 3.2], [h[0] - 11.4, h[1] - 1]],
    support: (h) => [h, [h[0] + 1, h[1] + 5], [h[0] + 0.4, ground]],
    lift: (h) => [h, [h[0] + 5.6, h[1] + 2.6], [h[0] + 1.2, h[1] + 6.4]],
  };
  const arms = {
    fwd: (s) => [s, [s[0] + 4, s[1] + 6], [s[0] + 9.2, s[1] + 3.2]],
    back: (s) => [s, [s[0] - 5.2, s[1] + 4.2], [s[0] - 7.8, s[1] - 1]],
    mid: (s) => [s, [s[0] + 1.2, s[1] + 6.2], [s[0] + 4.6, s[1] + 8]],
  };
  const [legFront, legBack, armFront, armBack] = [
    ['fwd', 'back', 'back', 'fwd'],
    ['support', 'lift', 'mid', 'mid'],
    ['back', 'fwd', 'fwd', 'back'],
    ['lift', 'support', 'mid', 'mid'],
  ][f];
  return {
    ...POSES.run,
    bob: up,
    legFront: legs[legFront](hip.front),
    legBack: legs[legBack](hip.back),
    armFront: arms[armFront](sh.front),
    armBack: arms[armBack](sh.back),
  };
}

/**
 * A walk cycle (4 frames), seen from the side going right: smaller steps than
 * the run, the body upright, the arms swinging a little.
 */
export function walkPose(k) {
  const f = k.frame % 4;
  const up = f % 2 ? -k.px : 0;
  const hip = { back: [30.4, 46.2 + up], front: [34.8, 46.4 + up] };
  const sh = { back: [29, 35.4 + up], front: [38.6, 35.4 + up] };
  const ground = 55.8;
  const legs = {
    fwd: (h) => [h, [h[0] + 3.6, h[1] + 5], [h[0] + 4.8, ground]],
    back: (h) => [h, [h[0] - 2.4, h[1] + 5], [h[0] - 4.6, ground - 0.4]],
    support: (h) => [h, [h[0] + 0.6, h[1] + 5], [h[0] + 0.4, ground]],
    lift: (h) => [h, [h[0] + 3.4, h[1] + 3.6], [h[0] + 1, h[1] + 8]],
  };
  const arms = {
    fwd: (s) => [s, [s[0] + 2.6, s[1] + 5], [s[0] + 5.2, s[1] + 8]],
    back: (s) => [s, [s[0] - 2.4, s[1] + 5], [s[0] - 4.4, s[1] + 7.8]],
    mid: (s) => [s, [s[0] + 0.4, s[1] + 5.4], [s[0] + 1.2, s[1] + 9]],
  };
  const [legFront, legBack, armFront, armBack] = [
    ['fwd', 'back', 'back', 'fwd'],
    ['support', 'lift', 'mid', 'mid'],
    ['back', 'fwd', 'fwd', 'back'],
    ['lift', 'support', 'mid', 'mid'],
  ][f];
  return {
    ...POSES.stand,
    head: [33, 20.5],
    look: 2,
    toes: 0.8,
    armsInFront: false,
    bob: up,
    legFront: legs[legFront](hip.front),
    legBack: legs[legBack](hip.back),
    armFront: arms[armFront](sh.front),
    armBack: arms[armBack](sh.back),
  };
}

// --- Drawing -------------------------------------------------------------------

const R = 12.5; // head radius

/** Rotate a point about a pivot. */
function rot([x, y], [px, py], deg) {
  const a = (deg * Math.PI) / 180;
  const dx = x - px;
  const dy = y - py;
  return [px + dx * Math.cos(a) - dy * Math.sin(a), py + dx * Math.sin(a) + dy * Math.cos(a)];
}

const limbPath = (pts) => (pts.length === 2 ? `M${pt(pts[0])}L${pt(pts[1])}` : `M${pt(pts[0])}Q${pt(pts[1])} ${pt(pts[2])}`);

/** Draw a person. `k` is the kit; `look` from CAST (or a one-off); `pose` from POSES. */
export function person(k, look, pose = POSES.stand) {
  const c = k.P;
  const skin = c[look.skin];
  const bob = pose.bob ?? 0;
  const [hx, hy] = [pose.head[0], pose.head[1] + bob];
  const pivot = [32, 46];
  const lean = (p) => {
    const [x, y] = rot(p, pivot, pose.torso);
    return [x, y + bob];
  };
  const out = [];

  // the shadow on the ground (none when they're up off it, on a climbing wall)
  if (pose.shadow !== false) out.push(k.ground(pose.speed ? 31 : 32, 58.6, pose.speed ? 15 : 13.5, 2.4));
  if (pose.speed) out.push(k.speed(15, [27, 32.5, 38], 6));

  // Long hair and pigtails, the legs (and a turned-away arm) go behind the body
  const hair = c[look.hair.color];
  out.push(hairBack(k, look.hair, hx, hy, hair, c[`${look.hair.color}Shade`] ?? hair));
  out.push(leg(k, look, pose.legBack, skin, pose.toes));
  out.push(leg(k, look, pose.legFront, skin, pose.toes));
  if (!pose.armsInFront) out.push(arm(k, look, pose.armBack, skin));

  out.push(body(k, look, lean));

  if (pose.armsInFront) out.push(arm(k, look, pose.armBack, skin));
  out.push(arm(k, look, pose.armFront, skin));

  // Head
  out.push(head(k, look, hx, hy, pose.look, pose.face));
  return out.join('');
}

/** Just the head (and any hair that falls behind it), where a standing person's head goes: (32, 20.5). */
export function portrait(k, look, face = 'smile') {
  const c = k.P;
  const [hx, hy] = POSES.stand.head;
  const hair = c[look.hair.color];
  return hairBack(k, look.hair, hx, hy, hair, c[`${look.hair.color}Shade`] ?? hair) + head(k, look, hx, hy, 0, face);
}

function leg(k, look, pts, skin, toes = 0) {
  const c = k.P;
  const legColor = look.bottom?.kind === 'trousers' ? c[look.bottom.color] : look.legs ? c[look.legs] : skin;
  const foot = pts[pts.length - 1];
  const from = pts[pts.length - 2];
  // the shoe lines up with the last bone; toes point forward (right) when walking
  const ang = (Math.atan2(foot[1] - from[1], foot[0] - from[0]) * 180) / Math.PI - 90;
  return (
    k.limb(limbPath(pts), legColor, 8.6) +
    k.g(`rotate(${Math.round(ang)} ${pt(foot)})`, k.ellipse(foot[0] + toes, foot[1] + 1.4, 3.9, 2.7, c[look.shoes]))
  );
}

/** An arm ([shoulder, elbow?, hand]) in the look's sleeve, with its hand: for drawing one again over something held. */
export function arm(k, look, pts, skin = k.P[look.skin]) {
  const c = k.P;
  const sleeve = look.top.kind === 'dress' ? skin : c[look.top.color];
  const hand = pts[pts.length - 1];
  return k.limb(limbPath(pts), sleeve, 8.2) + k.circle(hand[0], hand[1], 2.9, skin);
}

function body(k, look, lean) {
  const c = k.P;
  const top = c[look.top.color];
  const out = [];
  const poly = (pts, r, fill, o) => k.poly(pts.map(lean), r, fill, o);
  // bottoms first (under the shirt hem)
  if (look.bottom?.kind === 'shorts') {
    out.push(poly([[23, 45], [41, 45], [41.8, 51.6], [33.4, 51.6], [32, 48.6], [30.6, 51.6], [22.2, 51.6]], 1.6, c[look.bottom.color]));
  } else if (look.bottom?.kind === 'skirt') {
    out.push(poly([[23.4, 44.5], [40.6, 44.5], [43.8, 52], [20.2, 52]], [1.5, 1.5, 2.5, 2.5], c[look.bottom.color]));
  } else if (look.bottom?.kind === 'trousers') {
    out.push(poly([[23, 45], [41, 45], [41, 48.5], [23, 48.5]], 1.6, c[look.bottom.color]));
  }
  if (look.top.kind === 'dress') {
    out.push(poly([[25.2, 31.4], [38.8, 31.4], [45, 51], [19, 51]], [4, 4, 3, 3], top));
    // a collar
    out.push(poly([[26.6, 31.6], [32, 31.6], [29.6, 35.2]], 1.2, c[look.top.trim ?? 'white'], { sw: 1.5 }));
    out.push(poly([[32, 31.6], [37.4, 31.6], [34.4, 35.2]], 1.2, c[look.top.trim ?? 'white'], { sw: 1.5 }));
  } else {
    out.push(poly([[24.6, 31.4], [39.4, 31.4], [41.4, 47.4], [22.6, 47.4]], [4, 4, 2.6, 2.6], top));
    if (look.top.kind === 'cardigan') {
      // the open front and two buttons
      out.push(k.line(`M${pt(lean([32, 33]))}L${pt(lean([32, 47]))}`, { sw: 1.5 }));
      out.push(k.flatCircle(...lean([34.4, 38]), 1, c[look.top.trim ?? 'white']));
      out.push(k.flatCircle(...lean([34.4, 42.6]), 1, c[look.top.trim ?? 'white']));
    }
  }
  return out.join('');
}

function head(k, look, hx, hy, lookDx, face) {
  const c = k.P;
  const skin = c[look.skin];
  const hair = c[look.hair.color];
  const hairShade = c[`${look.hair.color}Shade`] ?? hair;
  const out = [];
  // ears
  out.push(k.circle(hx - R + 0.3 + lookDx * 0.3, hy + 2, 2.8, skin));
  out.push(k.circle(hx + R - 0.3 + lookDx * 0.3, hy + 2, 2.8, skin));
  out.push(k.circle(hx, hy, R, skin));
  out.push(faceOf(k, hx + lookDx, hy, face));
  out.push(hairFront(k, look.hair, hx, hy, hair, hairShade));
  if (look.glasses) out.push(glasses(k, hx + lookDx, hy));
  return out.join('');
}

function faceOf(k, x, y, face) {
  const out = [];
  const ey = y + 2.2;
  if (face === 'sleepy') {
    out.push(k.sleepyEye(x - 4.4, ey, 4), k.sleepyEye(x + 4.4, ey, 4));
  } else if (face === 'laugh') {
    out.push(k.happyEye(x - 4.4, ey, 4.2), k.happyEye(x + 4.4, ey, 4.2));
  } else {
    out.push(k.eye(x - 4.4, ey, 2.15), k.eye(x + 4.4, ey, 2.15));
  }
  out.push(k.blush(x - 7.6, y + 6.2), k.blush(x + 7.6, y + 6.2));
  if (face === 'grin' || face === 'laugh') out.push(k.openSmile(x, y + 6.4, 5.6, 2.6));
  else if (face === 'o') out.push(k.ellipse(x, y + 7.4, 1.6, 2, k.P.mouth, { sw: 1.5 }));
  else if (face === 'sad') out.push(k.smile(x, y + 8.4, 4, -1.1));
  else out.push(k.smile(x, y + 6.6, 4.2, 1.3));
  return out.join('');
}

/** Round glasses: one-pixel rims wide enough to show the eyes inside. */
function glasses(k, x, y) {
  const ey = y + 2.2;
  const r = 4.1;
  const rim = (cx) => k.line(`M${pt([cx - r, ey])}A${r} ${r} 0 1 0 ${pt([cx + r, ey])}A${r} ${r} 0 1 0 ${pt([cx - r, ey])}`);
  return rim(x - 4.4) + rim(x + 4.4);
}

/** Hair that sits behind the head (pigtails, long hair, a bun). */
function hairBack(k, hair, hx, hy, color, shade) {
  const at = (dx, dy) => [hx + dx, hy + dy];
  switch (hair.style) {
    case 'pigtails': {
      const tail = (s) =>
        k.path(
          `M${pt(at(s * -11.2, -5))}C${pt(at(s * -19.5, -4.6))} ${pt(at(s * -22.4, 7.4))} ${pt(at(s * -19.2, 13.6))}C${pt(at(s * -16.6, 10.2))} ${pt(at(s * -12.2, 6.4))} ${pt(at(s * -10.4, 1.6))}Z`,
          color,
        );
      return tail(1) + tail(-1);
    }
    case 'long':
      return k.path(
        `M${pt(at(-13.4, 1))}C${pt(at(-14.4, -16))} ${pt(at(14.4, -16))} ${pt(at(13.4, 1))}L${pt(at(14.6, 16))}Q${pt(at(14.8, 19.2))} ${pt(at(11.6, 19.2))}L${pt(at(-11.6, 19.2))}Q${pt(at(-14.8, 19.2))} ${pt(at(-14.6, 16))}Z`,
        color,
      );
    case 'bun':
      return k.circle(hx, hy - 13.6, 5.2, color) + k.shine(`M${pt(at(-2.8, -15.4))}Q${pt(at(-2.2, -17.6))} ${pt(at(0, -18))}`, 1.6);
    case 'bob':
      return k.path(roundPoly([at(-14.6, -7), at(14.6, -7), at(15, 11), at(-15, 11)], [9, 9, 3.4, 3.4]), color);
    default:
      return '';
  }
}

/** Hair over the forehead (the cap, bangs, beard). */
function hairFront(k, hair, hx, hy, color, shade) {
  const at = (dx, dy) => [hx + dx, hy + dy];
  const cap = (fringe, a1 = 172, a2 = 368) => {
    const s = polar(hx, hy, R + 1, a1);
    const e = polar(hx, hy, R + 1, a2);
    return k.path(`M${pt(s)}A${R + 1} ${R + 1} 0 1 1 ${pt(e)}${fringe}Z`, color);
  };
  switch (hair.style) {
    case 'pigtails': {
      const tie = (s) => k.circle(...at(s * -12.4, -3.4), k.px >= 2 ? 1.3 : 2.3, k.P[hair.tie ?? 'red']);
      return (
        cap(
          `Q${pt(at(12.6, -3.6))} ${pt(at(10.4, -6.2))}Q${pt(at(7.6, -3.2))} ${pt(at(4.2, -6.8))}Q${pt(at(0.4, -3))} ${pt(at(-3.6, -6.8))}Q${pt(at(-7, -3.2))} ${pt(at(-10.4, -6.2))}Q${pt(at(-12.8, -3.4))} ${pt(polar(hx, hy, R + 1, 172))}`,
        ) +
        tie(1) +
        tie(-1)
      );
    }
    case 'short':
      return (
        k.path(`M${pt(at(-2.6, -12.4))}Q${pt(at(-1.8, -18.2))} ${pt(at(4.4, -17.4))}Q${pt(at(0.8, -15.6))} ${pt(at(1.6, -12.4))}Z`, color) +
        cap(`Q${pt(at(12.8, -4.4))} ${pt(at(9.8, -7))}C${pt(at(5, -3.4))} ${pt(at(-4.4, -3.8))} ${pt(at(-9.4, -7.4))}Q${pt(at(-12.6, -4.6))} ${pt(polar(hx, hy, R + 1, 172))}`)
      );
    case 'curly': {
      const s = polar(hx, hy, R + 0.6, 165);
      const e = polar(hx, hy, R + 0.6, 375);
      const fringe = `L${pt(at(10.8, -4.4))}Q${pt(at(8.6, -2.2))} ${pt(at(6.2, -4.8))}Q${pt(at(3.4, -2.2))} ${pt(at(0.6, -4.8))}Q${pt(at(-2.4, -2.2))} ${pt(at(-5.2, -4.8))}Q${pt(at(-8, -2.2))} ${pt(at(-10.8, -4.4))}Z`;
      return k.path(`M${pt(s)}${scallops(hx, hy, R + 0.6, 165, 375, 8, 1.15)}${fringe}`, color);
    }
    case 'long':
      return cap(`Q${pt(at(12.8, -4.2))} ${pt(at(10.2, -7))}Q${pt(at(5, -6.2))} ${pt(at(1.2, -9.6))}Q${pt(at(-3.4, -4))} ${pt(at(-10.6, -4.6))}Q${pt(at(-12.8, -2.6))} ${pt(polar(hx, hy, R + 1, 172))}`);
    case 'beard':
      return (
        cap(`Q${pt(at(12.8, -4.6))} ${pt(at(10, -7.2))}Q${pt(at(3, -5.2))} ${pt(at(-3.6, -7.6))}Q${pt(at(-10.8, -6))} ${pt(at(-12.2, -2))}L${pt(polar(hx, hy, R + 1, 172))}`, 172, 368) +
        k.path(
          `M${pt(at(-12.4, 2.2))}Q${pt(at(-12, 13.4))} ${pt(at(0, 13.8))}Q${pt(at(12, 13.4))} ${pt(at(12.4, 2.2))}Q${pt(at(9.4, 7.6))} ${pt(at(5.2, 7.6))}Q${pt(at(0, 6.2))} ${pt(at(-5.2, 7.6))}Q${pt(at(-9.4, 7.6))} ${pt(at(-12.4, 2.2))}Z`,
          color,
        )
      );
    case 'bun':
      return cap(`Q${pt(at(12.4, -6))} ${pt(at(7, -8.4))}Q${pt(at(0, -9.6))} ${pt(at(-7, -8.4))}Q${pt(at(-12.4, -6))} ${pt(polar(hx, hy, R + 1, 172))}`);
    case 'bob':
      return cap(`Q${pt(at(13.2, -3.6))} ${pt(at(11.2, -5.6))}L${pt(at(-11.2, -5.6))}Q${pt(at(-13.2, -3.6))} ${pt(polar(hx, hy, R + 1, 172))}`);
    case 'cap': {
      // short hair showing at the sides, a cap on top with its peak to the front (right)
      const capColor = k.P[hair.cap ?? 'red'];
      return (
        k.path(`M${pt(at(-12.8, 2))}Q${pt(at(-13.4, -4))} ${pt(at(-10, -6))}L${pt(at(-8.6, -1))}Q${pt(at(-11, 0))} ${pt(at(-12.8, 2))}Z`, color) +
        k.path(`M${pt(at(12.8, 2))}Q${pt(at(13.4, -4))} ${pt(at(10, -6))}L${pt(at(8.6, -1))}Q${pt(at(11, 0))} ${pt(at(12.8, 2))}Z`, color) +
        k.path(`M${pt(at(-13.4, -3))}A13.6 13.6 0 0 1 ${pt(at(13.4, -3))}Q${pt(at(0, -6.2))} ${pt(at(-13.4, -3))}Z`, capColor) +
        k.poly([at(4, -5.6), at(19.4, -4), at(18.6, -1.2), at(3.6, -2.6)], [1, 1.8, 1.8, 1], capColor) +
        k.circle(...at(0, -13.4), 1.6, capColor)
      );
    }
    case 'bald':
      // grey tufts over the ears, and a moustache
      return (
        k.ellipse(...at(-12, -0.6), 3.2, 4.6, color) +
        k.ellipse(...at(12, -0.6), 3.2, 4.6, color) +
        k.shine(`M${pt(at(-5.6, -9.6))}Q${pt(at(-3.4, -11.4))} ${pt(at(-0.4, -11.6))}`, 2) +
        k.path(`M${pt(at(-5.6, 6.4))}Q${pt(at(-3, 3.8))} ${pt(at(0, 5))}Q${pt(at(3, 3.8))} ${pt(at(5.6, 6.4))}Q${pt(at(3, 7.6))} ${pt(at(0, 6.4))}Q${pt(at(-3, 7.6))} ${pt(at(-5.6, 6.4))}Z`, color)
      );
    default:
      return '';
  }
}

/** The baby: sitting in a sky-blue onesie, one curl on top. Waves its arms on the second frame. */
export function baby(k) {
  const c = k.P;
  const skin = c.skin1;
  const up = k.frame % 2 === 1;
  const arm = (s) => {
    const sh = [32 + s * 8.6, 41];
    const hand = up ? [32 + s * 15, 33.6] : [32 + s * 13.4, 46.6];
    return k.limb(`M${pt(sh)}L${pt(hand)}`, c.sky, 7.6) + k.circle(...hand, 2.8, skin);
  };
  return [
    k.ground(32, 58.6, 15, 2.4),
    k.limb('M27.6 50.6L22.4 56.4', c.sky, 8.2),
    k.limb('M36.4 50.6L41.6 56.4', c.sky, 8.2),
    k.circle(21.6, 57, 2.9, skin),
    k.circle(42.4, 57, 2.9, skin),
    k.path('M21.6 53.6C20 44.6 23.6 38.4 32 38.4C40.4 38.4 44 44.6 42.4 53.6C38.8 55.6 25.2 55.6 21.6 53.6Z', c.sky),
    k.flatEllipse(32, 46.6, 3, 2.2, c.white),
    arm(-1),
    arm(1),
    k.circle(19.2, 27.4, 2.8, skin),
    k.circle(44.8, 27.4, 2.8, skin),
    k.circle(32, 25.6, 13.6, skin),
    k.path('M30.6 12.4C29 9 31.8 6.4 34.6 7.6C36.6 8.6 36 11.2 34 11.2C32.8 11.2 32.6 10 33.4 9.6', 'none'),
    k.eye(27.2, 27.6, 2.2),
    k.eye(36.8, 27.6, 2.2),
    k.blush(23.4, 32, 2.6, 1.6),
    k.blush(40.6, 32, 2.6, 1.6),
    k.ellipse(32, 34, 1.7, 1.5, c.mouth, { sw: 1.5 }),
  ].join('');
}

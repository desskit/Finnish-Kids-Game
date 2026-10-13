// The drawing kit. Every picture is a recipe: a small function that draws on a
// 64×64 canvas with these helpers, so all of them share one look — the same
// outline, the same eyes, blush and shine, the same chunky limbs. Change a rule
// here and every picture follows.
//
// The drawing is vector, but the set is pixel art: the build samples it onto a
// pixel grid (art/pixel.mjs). So the kit is told how big a pixel is (`px`, in
// canvas units) and draws its lines one pixel wide.
//
// Pictures move, too. A recipe with `motion: { frames, fps }` is drawn once per
// frame, with `k.frame` (0, 1, …) and `k.t` (0 → 1 around the loop) telling it
// which. Anything with the kit's eyes also blinks: the build draws it once more
// with `k.blink` set, and eye() draws the eyes shut.

import { P } from './palette.mjs';

const round2 = (n) => {
  const v = Math.round(n * 100) / 100;
  return Object.is(v, -0) ? 0 : v;
};
/** A number as short as it can be written ("0.5" → ".5"). */
export const fmt = (n) => String(round2(n)).replace(/^(-?)0\./, '$1.');
/** A point for a path ("12 34.5"). */
export const pt = ([x, y]) => `${fmt(x)} ${fmt(y)}`;

/** The point at `deg` degrees (clockwise from 3 o'clock) on a circle. */
export function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function toward(from, to, dist) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const t = Math.min(dist, len / 2) / len;
  return [from[0] + dx * t, from[1] + dy * t];
}

/** A closed polygon with every corner rounded off (radius `r`, or one per corner). */
export function roundPoly(pts, r) {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const rr = Array.isArray(r) ? r[i] : r;
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const a = toward(cur, prev, rr);
    const b = toward(cur, next, rr);
    d += `${i === 0 ? 'M' : 'L'}${pt(a)}Q${pt(cur)} ${pt(b)}`;
  }
  return `${d}Z`;
}

/** The corners of a star (or any spiky n-gon), alternating outer and inner radius. */
export function starPoints(cx, cy, R, r, n = 5, rot = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) pts.push(polar(cx, cy, i % 2 ? r : R, rot + (180 / n) * i));
  return pts;
}

/** An open arc along a circle, from angle a1 to a2 (degrees, clockwise when a2 > a1). */
export function arcPath(cx, cy, r, a1, a2) {
  const s = polar(cx, cy, r, a1);
  const e = polar(cx, cy, r, a2);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  const sweep = a2 > a1 ? 1 : 0;
  return `M${pt(s)}A${fmt(r)} ${fmt(r)} 0 ${large} ${sweep} ${pt(e)}`;
}

/** A thick ring segment (between radii r1 < r2), from angle a1 to a2. */
export function ringSector(cx, cy, r1, r2, a1, a2) {
  const o1 = polar(cx, cy, r2, a1);
  const o2 = polar(cx, cy, r2, a2);
  const i2 = polar(cx, cy, r1, a2);
  const i1 = polar(cx, cy, r1, a1);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  return `M${pt(o1)}A${fmt(r2)} ${fmt(r2)} 0 ${large} 1 ${pt(o2)}L${pt(i2)}A${fmt(r1)} ${fmt(r1)} 0 ${large} 0 ${pt(i1)}Z`;
}

/**
 * A crescent of shade just inside a circle of radius `r`, from angle a1 to a2:
 * thickest in the middle (`depth` of the radius).
 */
export function crescentPath(cx, cy, r, a1, a2, depth = 0.28) {
  const ri = r - 1;
  const s = polar(cx, cy, ri, a1);
  const e = polar(cx, cy, ri, a2);
  const span = ((a2 - a1) * Math.PI) / 180;
  const half = ri * Math.sin(span / 2);
  const sag = ri * (1 - Math.cos(span / 2)) - depth * ri;
  // the inner arc: a flatter circle through the same two ends
  const R = sag > 0.01 ? (half * half + sag * sag) / (2 * sag) : 1e4;
  const large = a2 - a1 > 180 ? 1 : 0;
  return `M${pt(s)}A${fmt(ri)} ${fmt(ri)} 0 ${large} 1 ${pt(e)}A${fmt(R)} ${fmt(R)} 0 0 0 ${pt(s)}Z`;
}

/** A wavy (scalloped) edge along a circle: `n` bumps from a1 to a2. Continues a path. */
export function scallops(cx, cy, r, a1, a2, n, bump = 1) {
  let d = '';
  for (let i = 1; i <= n; i++) {
    const p = polar(cx, cy, r, a1 + ((a2 - a1) * i) / n);
    const chord = 2 * r * Math.sin((((a2 - a1) / n) * Math.PI) / 360);
    const br = (chord / 2) * bump;
    d += `A${fmt(br)} ${fmt(br)} 0 0 ${a2 > a1 ? 1 : 0} ${pt(p)}`;
  }
  return d;
}

/**
 * The kit for drawing one frame at a given pixel size: `px` is how many canvas
 * units one pixel of the finished picture covers (64 / grid). Outlines are one
 * pixel. `moving` is set when the build draws a backdrop's moving version (its
 * drifting layer is drawn separately then).
 */
export function makeKit({ px = 2, frame = 0, frames = 1, blink = false, moving = false } = {}) {
  const line1 = px;
  /** What the recipe used: the build checks `eyes` to know whether it can blink. */
  const used = { eyes: 0 };

  function el(tag, attrs) {
    let s = `<${tag}`;
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      s += ` ${k}="${typeof v === 'number' ? fmt(v) : v}"`;
    }
    return `${s}/>`;
  }

  /**
   * Paint for a filled shape. Options: stroke: false for a flat shape with no
   * outline (a shade or patch); sw: outline width (default one pixel); opacity.
   */
  function paint(fill, o = {}) {
    const { stroke = true, sw, opacity } = o;
    return { fill, stroke: stroke ? P.ink : undefined, 'stroke-width': stroke && sw !== undefined ? Math.max(sw, line1) : undefined, opacity };
  }

  const shape = (tag, geom, fill, o) => el(tag, { ...geom, ...paint(fill, o) });

  /** An unfilled line, one pixel wide unless `sw` says wider. */
  function line(d, o = {}) {
    const { color = P.ink, sw = line1, opacity } = o;
    return el('path', { d, fill: 'none', stroke: color, 'stroke-width': Math.max(sw, line1), opacity });
  }

  return {
    P,
    /** Canvas units per pixel of the finished picture. */
    px,
    /** Which frame of the loop is being drawn, of how many; `t` runs 0 → 1 around the loop. */
    frame,
    frames,
    t: frames > 1 ? frame / frames : 0,
    /** Set when the build draws the blink frame (eyes shut). */
    blink,
    /** Set when the build draws a backdrop's moving version. */
    moving,
    used,

    // --- shapes (outlined unless { stroke: false }) ---
    circle: (cx, cy, r, fill, o) => shape('circle', { cx, cy, r }, fill, o),
    ellipse: (cx, cy, rx, ry, fill, o) => shape('ellipse', { cx, cy, rx, ry }, fill, o),
    rect: (x, y, w, h, rx, fill, o) => shape('rect', { x, y, width: w, height: h, rx: rx || undefined }, fill, o),
    path: (d, fill, o) => shape('path', { d }, fill, o),
    /** A polygon with rounded corners. */
    poly: (pts, r, fill, o) => shape('path', { d: roundPoly(pts, r) }, fill, o),
    /** A flat inner patch with no outline (shades, spots, stripes). */
    flat: (d, fill, o = {}) => shape('path', { d }, fill, { ...o, stroke: false }),
    flatCircle: (cx, cy, r, fill, o = {}) => shape('circle', { cx, cy, r }, fill, { ...o, stroke: false }),
    flatEllipse: (cx, cy, rx, ry, fill, o = {}) => shape('ellipse', { cx, cy, rx, ry }, fill, { ...o, stroke: false }),

    line,
    /** A group, e.g. to rotate or move a part (never scale: lines would change width). */
    g: (transform, ...children) => {
      const inner = children.join('');
      return inner ? `<g transform="${transform}">${inner}</g>` : '';
    },

    // --- the shared pieces ---

    /**
     * A chunky outlined limb (arm, leg, tail, stem): ink underneath, color on
     * top, leaving a one-pixel outline down each side.
     */
    limb(d, color, T = 8) {
      return el('path', { d, fill: 'none', stroke: P.ink, 'stroke-width': T }) + el('path', { d, fill: 'none', stroke: color, 'stroke-width': T - 2 * line1 });
    },

    /** An open eye: an ink oval with a catchlight. In the blink frame, shut: a short line. */
    eye(cx, cy, r = 2.2) {
      used.eyes++;
      if (blink) return line(`M${pt([cx - r * 0.95, cy + r * 0.2])}H${fmt(cx + r * 0.95)}`);
      return el('ellipse', { cx, cy, rx: r * 0.82, ry: r, fill: P.ink }) + el('circle', { cx: cx - r * 0.3, cy: cy - r * 0.4, r: r * 0.36, fill: P.white });
    },
    /** A happy closed eye (^). */
    happyEye: (cx, cy, w = 4.4) => line(`M${pt([cx - w / 2, cy + w * 0.12])}Q${pt([cx, cy - w * 0.62])} ${pt([cx + w / 2, cy + w * 0.12])}`),
    /** A sleepy closed eye (‿). */
    sleepyEye: (cx, cy, w = 4.4) => line(`M${pt([cx - w / 2, cy - w * 0.1])}Q${pt([cx, cy + w * 0.5])} ${pt([cx + w / 2, cy - w * 0.1])}`),
    blush: (cx, cy, rx = 2.5, ry = 1.5) => el('ellipse', { cx, cy, rx, ry, fill: P.blush }),
    /** A closed smile (on a coarse grid, a small straight mouth: a curve that size is just noise). */
    smile: (cx, cy, w = 4.4, depth = 1.4) =>
      px >= 2
        ? line(`M${pt([cx - w * 0.26, cy + depth * 0.8])}H${fmt(cx + w * 0.26)}`)
        : line(`M${pt([cx - w / 2, cy])}Q${pt([cx, cy + depth * 2])} ${pt([cx + w / 2, cy])}`),
    /** An open, laughing mouth (a D on its back) with a tongue. */
    openSmile(cx, cy, w = 7, h = 4.2) {
      const l = [cx - w / 2, cy];
      const r = [cx + w / 2, cy];
      return (
        el('path', { d: `M${pt(l)}Q${pt([cx, cy + h * 2])} ${pt(r)}Z`, fill: P.mouth, stroke: P.ink, 'stroke-width': line1 }) +
        el('path', {
          d: `M${pt([cx - w * 0.26, cy + h * 0.78])}Q${pt([cx, cy + h * 0.28])} ${pt([cx + w * 0.26, cy + h * 0.78])}Q${pt([cx, cy + h * 1.08])} ${pt([cx - w * 0.26, cy + h * 0.78])}Z`,
          fill: P.tongue,
        })
      );
    },
    /** A white highlight stroke (top-left, where the light comes from). */
    shine: (d, w = 2.4) => el('path', { d, fill: 'none', stroke: P.white, 'stroke-width': Math.max(w, line1) }),
    /** A white highlight dot. */
    shineDot: (cx, cy, r = 1.4) => el('circle', { cx, cy, r, fill: P.white }),
    /** The soft shadow a standing thing casts on the ground. */
    ground: (cx = 32, cy = 58.6, rx = 17, ry = 2.6) => el('ellipse', { cx, cy, rx, ry, fill: P.ink, opacity: 0.13 }),
    /**
     * A wash of light over everything drawn so far (a backdrop's evening glow or
     * night): it only colors pixels that are already there, never empty ones.
     */
    tint: (color, opacity, w = 400, h = 200) => `<path class="tint" d="M0 0H${fmt(w)}V${fmt(h)}H0Z" fill="${color}" opacity="${fmt(opacity)}"/>`,
    /** Motion lines behind something moving (to the left of x, at the given heights). */
    speed: (x, ys, len = 6) => ys.map((y, i) => line(`M${pt([x - len + i * 1.5, y])}H${fmt(x)}`)).join(''),
  };
}

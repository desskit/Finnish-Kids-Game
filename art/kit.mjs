// The drawing kit. Every picture is a recipe: a small function that draws on a
// 64×64 canvas with these helpers, so all of them share one look — the same ink
// outline, the same eyes, blush and shine, the same chunky limbs. Change a rule
// here and every picture follows.
//
// A recipe is drawn more than once. The "art" pass draws the picture. The
// "rim" pass (sticker variant only) draws just its silhouette, fattened and in
// one color, which the build lays underneath as the white die-cut border and
// its soft shadow. Details (eyes, blush, shine, patterns) skip the rim pass.

import { P } from './palette.mjs';

/** The main outline: every filled shape gets it. */
export const STROKE = 2.5;
/** Facial features and other strong inner lines (mouths, closed eyes). */
export const FEATURE = 2;
/** Fine inner details (whiskers, seams, page lines). */
export const DETAIL = 1.5;
/** Width of the sticker variant's white border, beyond the outline. */
export const RIM = 2.75;

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
 * A crescent of shade inside a circle of radius `r` (already inside its
 * outline), from angle a1 to a2: thickest in the middle (`depth` of the radius).
 */
export function crescentPath(cx, cy, r, a1, a2, depth = 0.28) {
  const ri = r - STROKE / 2;
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
 * The kit for one pass of one recipe.
 * - variant: 'A' (classic outline + soft ground shadow) or 'B' (die-cut sticker).
 * - pass: 'art' draws the picture; 'rim' draws its fattened silhouette in `rimColor`.
 */
export function makeKit({ variant = 'A', pass = 'art', rimColor = P.white } = {}) {
  const rim = pass === 'rim';

  function el(tag, attrs) {
    let s = `<${tag}`;
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      s += ` ${k}="${typeof v === 'number' ? fmt(v) : v}"`;
    }
    return `${s}/>`;
  }

  /**
   * Paint for a filled shape. Options:
   * - stroke: false for a flat shape with no outline (a shade or patch);
   * - sw: outline width (default STROKE);
   * - inRim: false keeps the shape out of the sticker rim (inner pieces);
   * - opacity.
   */
  function paint(fill, o = {}) {
    const { stroke = true, sw = STROKE, inRim = stroke, opacity } = o;
    if (rim) {
      if (!inRim) return null;
      return { fill: rimColor, stroke: rimColor, 'stroke-width': (stroke ? sw : 0) + 2 * RIM };
    }
    return {
      fill,
      stroke: stroke ? P.ink : undefined,
      'stroke-width': stroke && sw !== STROKE ? sw : undefined,
      opacity,
    };
  }

  const shape = (tag, geom, fill, o) => {
    const p = paint(fill, o);
    return p ? el(tag, { ...geom, ...p }) : '';
  };

  /** An unfilled line. Options: color, sw, inRim (lines sticking out of the shape join the rim). */
  function line(d, o = {}) {
    const { color = P.ink, sw = DETAIL, inRim = false, opacity } = o;
    if (rim) return inRim ? el('path', { d, fill: 'none', stroke: rimColor, 'stroke-width': sw + 2 * RIM }) : '';
    return el('path', { d, fill: 'none', stroke: color, 'stroke-width': sw, opacity });
  }

  /** Something only the art pass draws. */
  const detail = (s) => (rim ? '' : s);

  const kit = {
    variant,
    rim,
    P,

    // --- shapes (outlined unless { stroke: false }) ---
    circle: (cx, cy, r, fill, o) => shape('circle', { cx, cy, r }, fill, o),
    ellipse: (cx, cy, rx, ry, fill, o) => shape('ellipse', { cx, cy, rx, ry }, fill, o),
    rect: (x, y, w, h, rx, fill, o) => shape('rect', { x, y, width: w, height: h, rx: rx || undefined }, fill, o),
    path: (d, fill, o) => shape('path', { d }, fill, o),
    /** A polygon with rounded corners. */
    poly: (pts, r, fill, o) => shape('path', { d: roundPoly(pts, r) }, fill, o),
    /** A flat inner patch: no outline, not in the rim (shades, spots, stripes). */
    flat: (d, fill, o = {}) => shape('path', { d }, fill, { ...o, stroke: false, inRim: false }),
    flatCircle: (cx, cy, r, fill, o = {}) => shape('circle', { cx, cy, r }, fill, { ...o, stroke: false, inRim: false }),
    flatEllipse: (cx, cy, rx, ry, fill, o = {}) =>
      shape('ellipse', { cx, cy, rx, ry }, fill, { ...o, stroke: false, inRim: false }),

    line,
    /** A group, e.g. to rotate or move a part (never scale: outlines would change width). */
    g: (transform, ...children) => {
      const inner = children.join('');
      return inner ? `<g transform="${transform}">${inner}</g>` : '';
    },

    // --- the shared pieces ---

    /**
     * A chunky outlined limb (arm, leg, tail, stem): ink underneath, color on
     * top, so the color reads `T - 2·STROKE` wide inside an outline like any shape's.
     */
    limb(d, color, T = 8) {
      if (rim) return el('path', { d, fill: 'none', stroke: rimColor, 'stroke-width': T + 2 * RIM });
      return (
        el('path', { d, fill: 'none', stroke: P.ink, 'stroke-width': T }) +
        el('path', { d, fill: 'none', stroke: color, 'stroke-width': T - 2 * STROKE })
      );
    },

    /** An open eye: an ink oval with a catchlight. */
    eye: (cx, cy, r = 2.2) =>
      detail(
        el('ellipse', { cx, cy, rx: r * 0.82, ry: r, fill: P.ink }) +
          el('circle', { cx: cx - r * 0.28, cy: cy - r * 0.4, r: r * 0.36, fill: P.white }),
      ),
    /** A happy closed eye (^). */
    happyEye: (cx, cy, w = 4.4) =>
      detail(line(`M${pt([cx - w / 2, cy + w * 0.12])}Q${pt([cx, cy - w * 0.62])} ${pt([cx + w / 2, cy + w * 0.12])}`, { sw: FEATURE })),
    /** A sleepy closed eye (‿). */
    sleepyEye: (cx, cy, w = 4.4) =>
      detail(line(`M${pt([cx - w / 2, cy - w * 0.1])}Q${pt([cx, cy + w * 0.5])} ${pt([cx + w / 2, cy - w * 0.1])}`, { sw: FEATURE })),
    blush: (cx, cy, rx = 2.5, ry = 1.5) => detail(el('ellipse', { cx, cy, rx, ry, fill: P.blush })),
    /** A closed smile. */
    smile: (cx, cy, w = 4.4, depth = 1.4) =>
      detail(line(`M${pt([cx - w / 2, cy])}Q${pt([cx, cy + depth * 2])} ${pt([cx + w / 2, cy])}`, { sw: FEATURE })),
    /** An open, laughing mouth (a D on its back) with a tongue. */
    openSmile(cx, cy, w = 7, h = 4.2) {
      if (rim) return '';
      const l = [cx - w / 2, cy];
      const r = [cx + w / 2, cy];
      const mouth = `M${pt(l)}Q${pt([cx, cy + h * 2])} ${pt(r)}Z`;
      return (
        el('path', { d: mouth, fill: P.mouth, stroke: P.ink, 'stroke-width': FEATURE }) +
        el('path', {
          d: `M${pt([cx - w * 0.26, cy + h * 0.78])}Q${pt([cx, cy + h * 0.28])} ${pt([cx + w * 0.26, cy + h * 0.78])}Q${pt([cx, cy + h * 1.08])} ${pt([cx - w * 0.26, cy + h * 0.78])}Z`,
          fill: P.tongue,
        })
      );
    },
    /** A white highlight stroke (top-left, where the light comes from). */
    shine: (d, w = 2.4) => detail(el('path', { d, fill: 'none', stroke: P.white, 'stroke-width': w })),
    /** A white highlight dot. */
    shineDot: (cx, cy, r = 1.4) => detail(el('circle', { cx, cy, r, fill: P.white })),
    /** The soft shadow a standing thing casts (the classic variant only; the sticker has its own). */
    ground: (cx = 32, cy = 58.6, rx = 17, ry = 2.6) =>
      variant === 'A' && !rim ? el('ellipse', { cx, cy, rx, ry, fill: P.ink, opacity: 0.13 }) : '',
    /** Motion lines behind something moving (to the left of x, at the given heights). */
    speed: (x, ys, len = 6) => detail(ys.map((y, i) => line(`M${pt([x - len + i * 1.5, y])}H${fmt(x)}`, { sw: FEATURE })).join('')),
  };
  return kit;
}

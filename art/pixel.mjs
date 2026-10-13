// Pixel art from the kit's vector drawings. Every shape is sampled at the
// centre of each pixel of a small grid — no blending at the edges, so every
// pixel is one clean color — lines are at least one pixel wide, and tiny
// features (a catchlight, a button) keep one pixel instead of vanishing. The
// result is written back out as squares: one path per color.
//
// The parser only needs to read what the kit writes: <g transform> groups and
// <path>, <circle>, <ellipse> and <rect> with fill, stroke, stroke-width and
// opacity, in absolute or relative path commands.

// --- Geometry --------------------------------------------------------------

const IDENTITY = [1, 0, 0, 1, 0, 0];

function multiply(m, n) {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

function parseTransform(t) {
  let m = IDENTITY;
  for (const [, op, args] of t.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const a = args.split(/[\s,]+/).filter(Boolean).map(Number);
    if (op === 'translate') m = multiply(m, [1, 0, 0, 1, a[0], a[1] ?? 0]);
    else if (op === 'rotate') {
      const r = (a[0] * Math.PI) / 180;
      const [cx, cy] = [a[1] ?? 0, a[2] ?? 0];
      m = multiply(m, [1, 0, 0, 1, cx, cy]);
      m = multiply(m, [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]);
      m = multiply(m, [1, 0, 0, 1, -cx, -cy]);
    } else if (op === 'scale') m = multiply(m, [a[0], 0, 0, a[1] ?? a[0], 0, 0]);
    else if (op === 'matrix') m = multiply(m, a);
  }
  return m;
}

const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

function ellipsePoints(cx, cy, rx, ry) {
  const n = Math.max(24, Math.ceil(Math.max(rx, ry) * 4));
  return Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((2 * Math.PI * i) / n), cy + ry * Math.sin((2 * Math.PI * i) / n)]);
}

function roundRectPoints(x, y, w, h, rx) {
  const r = Math.min(rx, w / 2, h / 2);
  if (!r) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const pts = [];
  const corner = (cx, cy, a0) => {
    for (let i = 0; i <= 6; i++) {
      const a = ((a0 + (90 * i) / 6) * Math.PI) / 180;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  corner(x + w - r, y + r, -90);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, 90);
  corner(x + r, y + r, 180);
  return pts;
}

function arcPoints(x1, y1, rxIn, ryIn, phiDeg, large, sweep, x2, y2) {
  if (!rxIn || !ryIn) return [[x2, y2]];
  const phi = (phiDeg * Math.PI) / 180;
  const [cos, sin] = [Math.cos(phi), Math.sin(phi)];
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;
  let [rx, ry] = [Math.abs(rxIn), Math.abs(ryIn)];
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let coef = den ? Math.sqrt(Math.max(0, num / den)) : 0;
  if (large === sweep) coef = -coef;
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angle = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dt = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  else if (sweep && dt < 0) dt += 2 * Math.PI;
  const n = Math.max(2, Math.ceil(Math.abs(dt) / (Math.PI / 24)));
  const pts = [];
  for (let i = 1; i <= n; i++) {
    const t = t1 + (dt * i) / n;
    pts.push([cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin, cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos]);
  }
  return pts;
}

/** A path's subpaths as point lists ({ pts, closed }). */
function pathPoints(d) {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
  const subs = [];
  let cur = null;
  let [x, y] = [0, 0];
  let [sx, sy] = [0, 0];
  let cmd = '';
  let i = 0;
  const num = () => Number(tokens[i++]);
  const start = () => {
    cur = { pts: [[x, y]], closed: false };
    subs.push(cur);
  };
  while (i < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    if (C === 'Z') {
      if (cur) cur.closed = true;
      [x, y] = [sx, sy];
      cur = null;
      continue;
    }
    if (C === 'M') {
      [x, y] = [ox + num(), oy + num()];
      [sx, sy] = [x, y];
      start();
      cmd = rel ? 'l' : 'L'; // more pairs after M are lines
      continue;
    }
    if (!cur) start();
    if (C === 'L') [x, y] = [ox + num(), oy + num()];
    else if (C === 'H') x = (rel ? x : 0) + num();
    else if (C === 'V') y = (rel ? y : 0) + num();
    else if (C === 'Q') {
      const c1 = [ox + num(), oy + num()];
      const e = [ox + num(), oy + num()];
      for (let k = 1; k <= 12; k++) {
        const t = k / 12;
        cur.pts.push([(1 - t) ** 2 * x + 2 * (1 - t) * t * c1[0] + t * t * e[0], (1 - t) ** 2 * y + 2 * (1 - t) * t * c1[1] + t * t * e[1]]);
      }
      [x, y] = e;
      continue;
    } else if (C === 'C') {
      const c1 = [ox + num(), oy + num()];
      const c2 = [ox + num(), oy + num()];
      const e = [ox + num(), oy + num()];
      for (let k = 1; k <= 16; k++) {
        const t = k / 16;
        const u = 1 - t;
        cur.pts.push([u ** 3 * x + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * e[0], u ** 3 * y + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * e[1]]);
      }
      [x, y] = e;
      continue;
    } else if (C === 'A') {
      const [rx, ry, rot, large, sweep] = [num(), num(), num(), num(), num()];
      const e = [ox + num(), oy + num()];
      cur.pts.push(...arcPoints(x, y, rx, ry, rot, large, sweep, e[0], e[1]));
      [x, y] = e;
      continue;
    } else throw new Error(`pixel.mjs: path command ${cmd} isn't supported`);
    cur.pts.push([x, y]);
  }
  return subs;
}

// --- Reading the kit's markup ----------------------------------------------

/** Every drawn element, in paint order: { subs, fill, stroke, width, opacity }. */
export function parseMarkup(markup) {
  const items = [];
  const stack = [{ m: IDENTITY, width: 1, opacity: 1 }];
  for (const [, close, tag, attrText, selfClose] of markup.matchAll(/<(\/?)(\w+)([^>]*?)(\/?)>/g)) {
    if (close) {
      if (tag === 'g') stack.pop();
      continue;
    }
    const a = Object.fromEntries([...attrText.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]));
    const top = stack[stack.length - 1];
    const state = {
      m: a.transform ? multiply(top.m, parseTransform(a.transform)) : top.m,
      width: a['stroke-width'] !== undefined ? Number(a['stroke-width']) : top.width,
      opacity: top.opacity * (a.opacity !== undefined ? Number(a.opacity) : 1),
    };
    if (tag === 'g' || tag === 'svg' || tag === 'symbol') {
      if (!selfClose) stack.push(state);
      continue;
    }
    let subs;
    const n = (k) => Number(a[k] ?? 0);
    if (tag === 'circle') subs = [{ pts: ellipsePoints(n('cx'), n('cy'), n('r'), n('r')), closed: true }];
    else if (tag === 'ellipse') subs = [{ pts: ellipsePoints(n('cx'), n('cy'), n('rx'), n('ry')), closed: true }];
    else if (tag === 'rect') subs = [{ pts: roundRectPoints(n('x'), n('y'), n('width'), n('height'), n('rx')), closed: true }];
    else if (tag === 'path') subs = pathPoints(a.d);
    else continue;
    items.push({
      tint: a.class === 'tint',
      d: tag === 'path' ? a.d : null,
      subs: subs.map((sp) => ({ pts: sp.pts.map((p) => apply(state.m, p)), closed: sp.closed })),
      fill: a.fill && a.fill !== 'none' ? a.fill : null,
      stroke: a.stroke && a.stroke !== 'none' ? a.stroke : null,
      width: state.width,
      opacity: state.opacity,
    });
  }
  return items;
}

// --- Sampling ------------------------------------------------------------------

function windingAt(subs, x, y) {
  let w = 0;
  for (const { pts } of subs) {
    for (let i = 0, n = pts.length; i < n; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % n];
      if (y1 <= y) {
        if (y2 > y && (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1) > 0) w++;
      } else if (y2 <= y && (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1) < 0) w--;
    }
  }
  return w;
}

function distanceTo(subs, x, y, closedToo) {
  let best = Infinity;
  for (const { pts, closed } of subs) {
    const n = pts.length;
    if (n === 1) best = Math.min(best, Math.hypot(x - pts[0][0], y - pts[0][1]));
    for (let i = 0; i < (closed || closedToo ? n : n - 1); i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % n];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      const t = len2 ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2)) : 0;
      best = Math.min(best, Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)));
    }
  }
  return best;
}

function bounds(subs, pad) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const { pts } of subs) {
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
}

const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgbToHex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()}`;

/**
 * Sample a drawing onto a grid of `cols × rows` pixels covering `width × height`
 * canvas units. Returns rows × cols of { rgb, a } (or null for empty).
 *
 * How each element becomes pixels:
 * - an outlined shape: every pixel it covers (its fill and its outline) takes
 *   the fill color, and its edge pixels — the ones beside a pixel it doesn't
 *   cover — take the outline color, so outlines are exactly one pixel;
 * - a shape too small or thin to have an inside keeps its fill color only
 *   (a nose, a collar: an outline would swallow it);
 * - a chunky limb (an ink stroke followed by a colored one along the same
 *   path) is an outlined shape too;
 * - a flat shape or a plain line takes its color, at least one pixel of it.
 */
export function rasterize(markup, { cols, rows, width, height }) {
  const items = parseMarkup(markup);
  const s = width / cols; // units per pixel
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(null));
  const paint = (px, py, rgb, alpha) => {
    const cur = grid[py][px];
    if (alpha >= 1 || !cur) grid[py][px] = { rgb, a: alpha >= 1 ? 1 : alpha };
    else grid[py][px] = { rgb: cur.rgb.map((v, i) => v + (rgb[i] - v) * alpha), a: cur.a + alpha * (1 - cur.a) };
  };

  /** The pixels an element covers, as a set of "x,y" plus its bounding box in pixels. */
  function cover(item, test, pad) {
    const [bx0, by0, bx1, by1] = bounds(item.subs, pad);
    const px0 = Math.max(0, Math.floor(bx0 / s));
    const py0 = Math.max(0, Math.floor(by0 / s));
    const px1 = Math.min(cols - 1, Math.floor(bx1 / s));
    const py1 = Math.min(rows - 1, Math.floor(by1 / s));
    const cells = new Set();
    for (let py = py0; py <= py1; py++) {
      for (let px = px0; px <= px1; px++) if (test((px + 0.5) * s, (py + 0.5) * s)) cells.add(px + py * cols);
    }
    if (cells.size > 4) {
      // a lone pixel at a sharp tip is noise
      for (const c of [...cells]) {
        const [x, y] = [c % cols, Math.floor(c / cols)];
        const has = (nx, ny) => cells.has(nx + ny * cols) && nx >= 0 && nx < cols;
        if (!has(x - 1, y) && !has(x + 1, y) && !has(x, y - 1) && !has(x, y + 1)) cells.delete(c);
      }
    }
    if (!cells.size && bx1 > 0 && by1 > 0 && bx0 < width && by0 < height) {
      // a feature smaller than a pixel keeps the pixel it sits in
      const cx = Math.min(cols - 1, Math.max(0, Math.floor((bx0 + bx1) / 2 / s)));
      const cy = Math.min(rows - 1, Math.max(0, Math.floor((by0 + by1) / 2 / s)));
      cells.add(cx + cy * cols);
    }
    return cells;
  }

  /** Pixels of a covered area that touch an uncovered one (the canvas edge doesn't count). */
  function edgeOf(cells) {
    const edge = new Set();
    for (const c of cells) {
      const [x, y] = [c % cols, Math.floor(c / cols)];
      const out = (nx, ny) => nx >= 0 && ny >= 0 && nx < cols && ny < rows && !cells.has(nx + ny * cols);
      if (out(x - 1, y) || out(x + 1, y) || out(x, y - 1) || out(x, y + 1)) edge.add(c);
    }
    return edge;
  }

  // The inside of the last outlined shape: a flat patch drawn on it (a shade,
  // a spot) stays inside its outline.
  let lastInside = null;

  function outlined(cells, fill, stroke, opacity) {
    const edge = edgeOf(cells);
    const inside = cells.size - edge.size;
    // too small or thin for an outline: just the color
    const outline = inside >= Math.max(2, edge.size * 0.3);
    const [frgb, srgb] = [hexToRgb(fill), hexToRgb(stroke)];
    for (const c of cells) paint(c % cols, Math.floor(c / cols), outline && edge.has(c) ? srgb : frgb, opacity);
    lastInside = outline ? new Set([...cells].filter((c) => !edge.has(c))) : null;
  }

  function flat(cells, color, opacity) {
    let keep = cells;
    if (lastInside) {
      const within = [...cells].filter((c) => lastInside.has(c));
      if (within.length >= cells.size * 0.5) keep = within;
    }
    const rgb = hexToRgb(color);
    for (const c of keep) paint(c % cols, Math.floor(c / cols), rgb, opacity);
  }

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const next = items[i + 1];
    const half = Math.max(it.width, s) / 2;
    if (it.fill && it.stroke) {
      const cells = cover(it, (x, y) => windingAt(it.subs, x, y) !== 0 || distanceTo(it.subs, x, y, true) <= half + 1e-9, half);
      outlined(cells, it.fill, it.stroke, it.opacity);
    } else if (it.tint) {
      // light over the picture: only where something is drawn already
      const rgb = hexToRgb(it.fill);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (grid[y][x]) paint(x, y, rgb, it.opacity);
    } else if (it.fill) {
      flat(cover(it, (x, y) => windingAt(it.subs, x, y) !== 0, 0), it.fill, it.opacity);
    } else if (it.stroke && it.subs.every((sp) => sp.closed)) {
      // an outline drawn again on its own: just the shape's edge, one pixel
      const cells = cover(it, (x, y) => windingAt(it.subs, x, y) !== 0 || distanceTo(it.subs, x, y, true) <= half + 1e-9, half);
      const rgb = hexToRgb(it.stroke);
      for (const c of edgeOf(cells)) paint(c % cols, Math.floor(c / cols), rgb, it.opacity);
    } else if (it.stroke) {
      // a limb: this ink stroke and a narrower colored one along the same path
      if (next && !next.fill && next.stroke && next.d && next.d === it.d && next.width < it.width) {
        const cells = cover(it, (x, y) => distanceTo(it.subs, x, y, false) <= half + 1e-9, half);
        outlined(cells, next.stroke, it.stroke, it.opacity);
        i++;
        continue;
      }
      const cells = cover(it, (x, y) => distanceTo(it.subs, x, y, false) <= half + 1e-9, half);
      const rgb = hexToRgb(it.stroke);
      for (const c of cells) paint(c % cols, Math.floor(c / cols), rgb, it.opacity);
    }
  }
  return grid;
}

/** A pixel grid as SVG: one path of squares per color (runs merged into rectangles). */
export function gridToSvg(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const byKey = new Map();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const p = grid[y][x];
      if (!p || p.a <= 0.02) continue;
      const key = `${rgbToHex(p.rgb)}|${p.a >= 1 ? 1 : Math.round(p.a * 100) / 100}`;
      if (!byKey.has(key)) byKey.set(key, Array.from({ length: rows }, () => new Array(cols).fill(false)));
      byKey.get(key)[y][x] = true;
    }
  }
  let out = '';
  for (const [key, mask] of byKey) {
    const [color, alpha] = key.split('|');
    // rectangles: a run along a row, grown down while the rows below match
    const used = mask.map((r) => r.map(() => false));
    let d = '';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!mask[y][x] || used[y][x]) continue;
        let w = 1;
        while (x + w < cols && mask[y][x + w] && !used[y][x + w]) w++;
        let h = 1;
        while (y + h < rows && Array.from({ length: w }, (_, i) => mask[y + h][x + i] && !used[y + h][x + i]).every(Boolean)) h++;
        for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) used[yy][xx] = true;
        d += `M${x} ${y}h${w}v${h}h-${w}z`;
      }
    }
    out += `<path fill="${color}"${alpha === '1' ? '' : ` opacity="${String(alpha).replace(/^0\./, '.')}"`} d="${d}"/>`;
  }
  return out;
}

// --- Frames ----------------------------------------------------------------------

const samePixel = (p, q) => (!p && !q) || (!!p && !!q && p.a === q.a && p.rgb.every((v, i) => Math.round(v) === Math.round(q.rgb[i])));

/** Do two pixel grids look the same? */
export function sameGrid(a, b) {
  return a.every((row, y) => row.every((p, x) => samePixel(p, b[y][x])));
}

/**
 * Split a loop's frames into what never changes and what each frame adds:
 * `common` holds the pixels that are the same in every frame, `own[k]` the
 * rest of frame k (its pixels that aren't common).
 */
export function splitFrames(grids) {
  const [first] = grids;
  const common = first.map((row, y) => row.map((p, x) => (grids.every((g) => samePixel(g[y][x], p)) ? p : null)));
  const own = grids.map((g) => g.map((row, y) => row.map((p, x) => (common[y][x] ? null : p))));
  return { common, own };
}

/** The pixels of `b` that differ from `a`, as a grid (empty elsewhere); null if none differ. */
export function changes(a, b) {
  let any = false;
  const out = b.map((row, y) =>
    row.map((p, x) => {
      if (samePixel(a[y][x], p)) return null;
      any = true;
      // a pixel that empties can't be drawn on top: callers check for that
      return p ?? { rgb: [0, 0, 0], a: 0, gone: true };
    }),
  );
  return any ? out : null;
}

/** Are all the set pixels of `patch` on pixels that are the same in every one of `grids`? */
export function patchFits(patch, grids) {
  return patch.every((row, y) => row.every((p, x) => !p || (!p.gone && grids.every((g) => samePixel(g[y][x], grids[0][y][x])))));
}

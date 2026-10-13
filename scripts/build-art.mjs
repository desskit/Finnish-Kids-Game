// Builds the picture set from the recipes in art/.
//
//   node scripts/build-art.mjs           write src/art/generated/ and the review gallery
//   node scripts/build-art.mjs --check   exit 1 if src/art/generated/ is out of date
//
// Each recipe draws a vector picture with the kit; the build checks it (only
// the palette's colors, only outlined shapes — no text, raster, gradients,
// filters or masks — sensible line widths) and then turns it into pixel art on
// the style's grid (art/pixel.mjs). Pictures that move are drawn once per
// frame; anything with eyes is drawn once more with them shut, to blink.
//
// The outputs:
//   src/art/generated/words.svg, ui.svg   one still <symbol> per picture (art-<id>)
//   src/art/generated/motion.svg          the moving ones: art-<id>--m (everything that
//                                         moves) and, for a picture with a loop and a
//                                         blink, art-<id>--b (the blink alone)
//   src/art/generated/scenes/             each story backdrop, still (<id>-<tone>.svg)
//                                         and moving (<id>-<tone>.moving.svg)
//   src/art/generated/manifest.ts         ids, groups, titles, emoji → picture, motion
//   src/art/generated/art.css             the pixel size and the reaction animations
//   art-gallery/index.html                the review gallery (and publish.html, the
//                                         same page without a document wrapper)
//
// Motion is SMIL inside the SVG: each frame's own pixels are a group shown in
// its turn (calcMode="discrete"), so a frame never blends into the next.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECIPES, SCENES } from '../art/index.mjs';
import { fmt, makeKit } from '../art/kit.mjs';
import { P, PALETTE } from '../art/palette.mjs';
import { changes, gridToSvg, patchFits, rasterize, sameGrid, splitFrames } from '../art/pixel.mjs';
import { SCENE_H, SCENE_W } from '../art/scenes/parts.mjs';
import { STYLE } from '../art/style.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GEN = join(ROOT, 'src', 'art', 'generated');
const GALLERY = join(ROOT, 'art-gallery');
const CHECK = process.argv.includes('--check');

/** The pixel grids the gallery compares (the app uses STYLE.grid). */
const COMPARE = [
  { key: 'L', grid: 48, name: 'Light', blurb: '48 pixels across a picture. Pixel edges you notice up close, with rounder shapes and finer faces.' },
  { key: 'M', grid: 32, name: 'Medium', blurb: '32 pixels across a picture. Clearly pixel art, like a classic handheld game, but not chunky.' },
];

/** Bytes a picture or backdrop may take once it's pixel art (still, and with its motion). */
const BUDGET = { picture: 6000, motion: 12000, scene: 40000, sceneMotion: 60000 };

/** How fast a backdrop's clouds drift, in pixels a second. */
const DRIFT_PX_PER_S = 2;

const VS = String.fromCharCode(0xfe0e) + String.fromCharCode(0xfe0f);
const KEYCAP = String.fromCharCode(0x20e3);
const ZWJ = String.fromCharCode(0x200d);
/** An emoji: a pictograph sequence, a keycap or a flag. */
const EMOJI = new RegExp(`^(?:[0-9#*][${VS}]?${KEYCAP}|\\p{Regional_Indicator}{2}|\\p{Extended_Pictographic}[${VS}]?(?:${ZWJ}\\p{Extended_Pictographic}[${VS}]?)*)$`, 'u');
/** The lookup key for an emoji: the same glyph with or without a variation selector. */
const glyphKey = (s) => s.replace(new RegExp(`[${VS}]`, 'g'), '');

/** A number for SMIL timing (which wants a leading zero: "0.5s"). */
const num = (n) => String(Math.round(n * 1000) / 1000);
/** A stable number from a string, for blink timing. */
const hash = (s) => [...s].reduce((h, ch) => (h * 31 + ch.codePointAt(0)) >>> 0, 7);

// --- Inputs ------------------------------------------------------------------

function vocabulary() {
  const dir = join(ROOT, 'src', 'content', 'data');
  const words = new Map();
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.sourced.json'))) {
    const data = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    for (const w of data.words ?? []) words.set(w.id, { emoji: w.emoji, theme: f.split('.')[0] });
  }
  return words;
}

// --- Drawing -------------------------------------------------------------------

/** One frame of a picture on a grid: its vector drawing and its pixels. */
function drawPicture(recipe, grid, opts = {}) {
  const px = 64 / grid;
  const k = makeKit({ px, ...opts });
  const vector = `<g stroke-width="${fmt(px)}">${recipe.draw(k)}</g>`;
  return { vector, eyes: k.used.eyes, grid: rasterize(vector, { cols: grid, rows: grid, width: 64, height: 64 }) };
}

/** A picture on a grid: its still pixels, its loop (if its frames differ) and its blink (if it has eyes). */
function picture(recipe, grid) {
  const still = drawPicture(recipe, grid);
  const vectors = [still.vector];
  const n = recipe.motion?.frames ?? 1;
  let loop = null;
  if (n > 1) {
    const frames = Array.from({ length: n }, (_, frame) => drawPicture(recipe, grid, { frame, frames: n }));
    vectors.push(...frames.map((f) => f.vector));
    if (frames.some((f) => !sameGrid(f.grid, frames[0].grid))) loop = { grids: frames.map((f) => f.grid), fps: recipe.motion.fps ?? 4 };
  }
  let blink = null;
  if (still.eyes > 0) {
    const shut = drawPicture(recipe, grid, { blink: true });
    vectors.push(shut.vector);
    const patch = changes(still.grid, shut.grid);
    // a blink lays shut eyes over open ones, so the eyes mustn't move in the loop
    if (patch && patchFits(patch, loop ? [still.grid, ...loop.grids] : [still.grid])) blink = patch;
  }
  const stillSvg = gridToSvg(still.grid);
  const motion = loop || blink ? (loop ? loopMarkup(loop) : stillSvg) + (blink ? blinkMarkup(blink, recipe.id) : '') : null;
  const blinkOnly = loop && blink ? stillSvg + blinkMarkup(blink, recipe.id) : null;
  return { vectors, still: stillSvg, motion, blinkOnly, loop: !!loop, blink: !!blink };
}

const showAnim = (values, keyTimes, dur, begin) =>
  `<animate attributeName="visibility" values="${values}" keyTimes="${keyTimes}" dur="${num(dur)}s"${begin ? ` begin="${num(begin)}s"` : ''} calcMode="discrete" repeatCount="indefinite"/>`;

/** A loop: the pixels every frame shares, then each frame's own pixels, shown in turn. */
function loopMarkup({ grids, fps }) {
  const { common, own } = splitFrames(grids);
  const n = own.length;
  const keyTimes = own.map((_, j) => num(j / n)).join(';');
  return (
    gridToSvg(common) +
    own
      .map((g, i) => {
        const pixels = gridToSvg(g);
        if (!pixels) return '';
        const values = own.map((_, j) => (j === i ? 'visible' : 'hidden')).join(';');
        return `<g visibility="${i === 0 ? 'visible' : 'hidden'}">${showAnim(values, keyTimes, n / fps, 0)}${pixels}</g>`;
      })
      .join('')
  );
}

/** Shut eyes, shown for a moment every few seconds (each picture on its own beat). */
function blinkMarkup(patch, id) {
  const h = hash(id);
  const cycle = 3.2 + (h % 12) / 10;
  const shut = 0.16;
  const begin = -(((h >>> 4) % 30) / 10);
  return `<g visibility="hidden">${showAnim('hidden;visible', `0;${num(1 - shut / cycle)}`, cycle, begin)}${gridToSvg(patch)}</g>`;
}

/** One frame of a backdrop: its vector drawing and its pixels (pixels the same size as the pictures'). */
function drawScene(scene, tone, grid, opts = {}, layer = 'draw') {
  const px = 64 / grid;
  const [cols, rows] = [Math.round(SCENE_W / px), Math.round(SCENE_H / px)];
  const k = makeKit({ px, ...opts });
  const inner = scene[layer](k, tone);
  const vector = `<g stroke-width="${fmt(px)}">${inner}</g>`;
  return { vector, cols, rows, empty: !inner, grid: rasterize(vector, { cols, rows, width: SCENE_W, height: SCENE_H }) };
}

/** A backdrop on a grid: still, and moving (its frames, plus what drifts across the sky). */
function backdrop(scene, tone, grid) {
  const still = drawScene(scene, tone, grid);
  const vectors = [still.vector];
  let moving = null;
  if (scene.motion || scene.drift) {
    const n = scene.motion?.frames ?? 1;
    const frames = Array.from({ length: n }, (_, frame) => drawScene(scene, tone, grid, { frame, frames: n, moving: true }));
    vectors.push(...frames.map((f) => f.vector));
    const looped = n > 1 && frames.some((f) => !sameGrid(f.grid, frames[0].grid));
    const base = looped ? loopMarkup({ grids: frames.map((f) => f.grid), fps: scene.motion.fps }) : gridToSvg(frames[0].grid);
    let drift = '';
    if (scene.drift) {
      const d = drawScene(scene, tone, grid, { moving: true }, 'drift');
      if (!d.empty) {
        vectors.push(d.vector);
        const layer = gridToSvg(d.grid);
        // one pixel at a time, round and round: a second copy follows the first
        const steps = Array.from({ length: d.cols }, (_, i) => `${-i} 0`).join(';');
        drift = `<g><animateTransform attributeName="transform" type="translate" values="${steps}" dur="${num(d.cols / DRIFT_PX_PER_S)}s" calcMode="discrete" repeatCount="indefinite"/>${layer}<g transform="translate(${d.cols} 0)">${layer}</g></g>`;
      }
    }
    if (looped || drift) moving = base + drift;
  }
  return { vectors, cols: still.cols, rows: still.rows, still: gridToSvg(still.grid), moving };
}

const symbol = (id, viewBox, inner) => `<symbol id="${id}" viewBox="${viewBox}"><g shape-rendering="crispEdges">${inner}</g></symbol>`;
const sceneFile = (cols, rows, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols} ${rows}" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges">${inner}</svg>\n`;

// --- Lint ----------------------------------------------------------------------

const ALLOWED_TAGS = new Set(['g', 'path', 'circle', 'ellipse', 'rect']);

function lint(vector) {
  const errors = [];
  for (const [, tag] of vector.matchAll(/<(\w+)/g)) if (!ALLOWED_TAGS.has(tag)) errors.push(`<${tag}> is not allowed`);
  for (const [, attr, value] of vector.matchAll(/\b(fill|stroke)="([^"]*)"/g)) {
    if (value !== 'none' && !PALETTE.has(value.toUpperCase())) errors.push(`${attr}="${value}" is not in the palette`);
  }
  for (const [, w] of vector.matchAll(/stroke-width="([^"]*)"/g)) {
    const n = Number(w);
    if (!(n >= 1 && n <= 16)) errors.push(`stroke-width="${w}" (allowed: 1–16)`);
  }
  for (const [, o] of vector.matchAll(/opacity="([^"]*)"/g)) {
    const n = Number(o);
    if (!(n > 0 && n <= 1)) errors.push(`opacity="${o}"`);
  }
  if (/NaN|undefined|Infinity|null/.test(vector)) errors.push('a coordinate is not a number');
  return [...new Set(errors)];
}

// --- Build ---------------------------------------------------------------------

function build() {
  const words = vocabulary();
  const problems = [];
  const pictures = [];
  const glyphs = new Map(); // key → id
  const seen = new Set();
  // checking only needs the app's grid; the gallery compares more
  const grids = CHECK ? [STYLE.grid] : [...new Set([STYLE.grid, ...COMPARE.map((c) => c.grid)])];

  for (const r of RECIPES) {
    const where = `picture "${r.id}"`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.id)) problems.push(`${where}: ids are lower-case words joined by single hyphens`);
    if (seen.has(r.id)) problems.push(`${where}: id used twice`);
    seen.add(r.id);
    const group = r.group ?? 'words';
    const word = words.get(r.id);
    if (group === 'words' && !word) problems.push(`${where}: a word picture's id must be a word id (src/content/data)`);
    if (group !== 'words' && word) problems.push(`${where}: "${r.id}" is a word id — draw it as a word picture, or rename it`);
    if (r.motion && !(r.motion.frames >= 2 && r.motion.frames <= 8 && r.motion.fps > 0 && r.motion.fps <= 12)) problems.push(`${where}: motion needs 2–8 frames at up to 12 fps`);
    const claims = [...(r.glyphs ?? [])];
    if (word && r.glyph !== false && word.emoji && EMOJI.test(word.emoji) && !claims.includes(word.emoji)) claims.push(word.emoji);
    for (const g of claims) {
      if (!EMOJI.test(g)) problems.push(`${where}: "${g}" is not an emoji`);
      const key = glyphKey(g);
      if (glyphs.has(key)) problems.push(`${where}: ${g} is already drawn by "${glyphs.get(key)}"`);
      else glyphs.set(key, r.id);
    }
    const byGrid = {};
    for (const grid of grids) {
      byGrid[grid] = picture(r, grid);
      for (const v of byGrid[grid].vectors) for (const e of lint(v)) problems.push(`${where} (${grid}px): ${e}`);
      if (r.motion && !byGrid[grid].loop) problems.push(`${where} (${grid}px): its motion frames all look the same`);
    }
    const p = byGrid[STYLE.grid];
    if (p.still.length > BUDGET.picture) problems.push(`${where}: ${p.still.length} bytes (budget ${BUDGET.picture})`);
    if (p.motion && p.motion.length > BUDGET.motion) problems.push(`${where}: moving, ${p.motion.length} bytes (budget ${BUDGET.motion})`);
    pictures.push({ id: r.id, title: r.title, group, glyphs: claims, byGrid });
  }

  const scenes = [];
  for (const s of SCENES) {
    for (const tone of s.tones) {
      const byGrid = {};
      for (const grid of grids) {
        byGrid[grid] = backdrop(s, tone, grid);
        for (const v of byGrid[grid].vectors) for (const e of lint(v)) problems.push(`backdrop "${s.id}-${tone}" (${grid}px): ${e}`);
      }
      const b = byGrid[STYLE.grid];
      if (b.still.length > BUDGET.scene) problems.push(`backdrop "${s.id}-${tone}": ${b.still.length} bytes (budget ${BUDGET.scene})`);
      if (b.moving && b.moving.length > BUDGET.sceneMotion) problems.push(`backdrop "${s.id}-${tone}": moving, ${b.moving.length} bytes (budget ${BUDGET.sceneMotion})`);
      scenes.push({ id: s.id, title: s.title, tone, byGrid });
    }
  }

  if (problems.length) {
    console.error(`The picture set has ${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }

  pictures.sort((a, b) => a.id.localeCompare(b.id));
  const files = new Map();
  const g = STYLE.grid;
  const box = `0 0 ${g} ${g}`;
  for (const group of ['ui', 'words']) {
    const inGroup = pictures.filter((p) => p.group === group);
    files.set(`${group}.svg`, `<svg xmlns="http://www.w3.org/2000/svg">${inGroup.map((p) => symbol(`art-${p.id}`, box, p.byGrid[g].still)).join('')}</svg>\n`);
  }
  files.set(
    'motion.svg',
    `<svg xmlns="http://www.w3.org/2000/svg">${pictures
      .map((p) => {
        const { motion, blinkOnly } = p.byGrid[g];
        return (motion ? symbol(`art-${p.id}--m`, box, motion) : '') + (blinkOnly ? symbol(`art-${p.id}--b`, box, blinkOnly) : '');
      })
      .join('')}</svg>\n`,
  );
  for (const s of scenes) {
    const { cols, rows, still, moving } = s.byGrid[g];
    files.set(`scenes/${s.id}-${s.tone}.svg`, sceneFile(cols, rows, still));
    if (moving) files.set(`scenes/${s.id}-${s.tone}.moving.svg`, sceneFile(cols, rows, moving));
  }
  files.set('manifest.ts', manifest(pictures, glyphs, scenes));
  files.set('art.css', artCss(g));
  return { files, pictures, scenes };
}

function manifest(pictures, glyphs, scenes) {
  const g = STYLE.grid;
  const q = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const key = (s) => (/^[a-z]+$/.test(s) ? s : q(s));
  const tones = new Map();
  const moving = new Map();
  for (const s of scenes) {
    tones.set(s.id, [...(tones.get(s.id) ?? []), s.tone]);
    if (s.byGrid[g].moving) moving.set(s.id, [...(moving.get(s.id) ?? []), s.tone]);
  }
  const moves = pictures.filter((p) => p.byGrid[g].motion);
  return [
    '// Generated by scripts/build-art.mjs from the recipes in art/. Do not edit.',
    '',
    '/** Pixels across a picture. */',
    `export const ART_GRID = ${g};`,
    '',
    '/** Every picture in the set. */',
    `export type ArtId =\n${pictures.map((p) => `  | ${q(p.id)}`).join('\n')};`,
    '',
    "export type ArtGroup = 'ui' | 'words';",
    '',
    '/** Which sprite each picture is in, and what it shows. */',
    'export const ART: Readonly<Record<ArtId, { group: ArtGroup; title: string }>> = {',
    ...pictures.map((p) => `  ${key(p.id)}: { group: ${q(p.group)}, title: ${q(p.title)} },`),
    '};',
    '',
    '/**',
    ' * The pictures that move: an action `loop`, a `blink`, or both. In motion.svg,',
    ' * art-<id>--m has all of it; a picture with both also has art-<id>--b, the blink alone.',
    ' */',
    'export const ART_MOTION: Readonly<Partial<Record<ArtId, { loop: boolean; blink: boolean }>>> = {',
    ...moves.map((p) => `  ${key(p.id)}: { loop: ${p.byGrid[g].loop}, blink: ${p.byGrid[g].blink} },`),
    '};',
    '',
    '/** An emoji (variation selectors removed) → the picture drawn for it. */',
    'export const GLYPH_ART: Readonly<Record<string, ArtId>> = {',
    ...[...glyphs.entries()].sort(([, a], [, b]) => a.localeCompare(b)).map(([gl, id]) => `  ${q(gl)}: ${q(id)},`),
    '};',
    '',
    '/** Story backdrops, and the tones each is drawn in. */',
    'export const BACKDROPS = {',
    ...[...tones.entries()].map(([id, ts]) => `  ${key(id)}: [${ts.map(q).join(', ')}],`),
    '} as const;',
    '',
    'export type BackdropId = keyof typeof BACKDROPS;',
    '',
    '/** The backdrops (and tones) with a moving version: scenes/<id>-<tone>.moving.svg. */',
    'export const BACKDROP_MOTION: Readonly<Partial<Record<BackdropId, readonly string[]>>> = {',
    ...[...moving.entries()].map(([id, ts]) => `  ${key(id)}: [${ts.map(q).join(', ')}],`),
    '};',
    '',
  ].join('\n');
}

/** The pictures' pixel size, and the reactions (moving in whole pixels, one step at a time). */
function artCss(grid) {
  return `/* Generated by scripts/build-art.mjs. Do not edit. */
.art {
  --art-px: calc(1em / ${grid});
}

/* Reactions: once each, in whole pixels (the reduced-motion setting makes them instant). */
.art--pop {
  animation: art-pop 0.32s steps(1, end) 1;
}

.art--hop {
  animation: art-hop 0.48s steps(1, end) 1;
}

.art--shake {
  animation: art-shake 0.4s steps(1, end) 1;
}

@keyframes art-pop {
  0% { transform: scale(0.4); }
  25% { transform: scale(0.75); }
  50% { transform: scale(1.12); }
  75% { transform: scale(0.96); }
  100% { transform: scale(1); }
}

@keyframes art-hop {
  0%, 100% { transform: translateY(0); }
  14% { transform: translateY(calc(var(--art-px) * -2)); }
  28% { transform: translateY(calc(var(--art-px) * -4)); }
  42% { transform: translateY(calc(var(--art-px) * -5)); }
  57% { transform: translateY(calc(var(--art-px) * -4)); }
  71% { transform: translateY(calc(var(--art-px) * -2)); }
}

@keyframes art-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(calc(var(--art-px) * -2)); }
  40% { transform: translateX(calc(var(--art-px) * 2)); }
  60% { transform: translateX(calc(var(--art-px) * -2)); }
  80% { transform: translateX(calc(var(--art-px) * 1)); }
}
`;
}

// --- Write or check --------------------------------------------------------

function listGenerated(dir, prefix = '') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? listGenerated(join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`]));
}

const { files, pictures, scenes } = build();

if (CHECK) {
  const stale = [];
  for (const [name, content] of files) {
    const path = join(GEN, name);
    if (!existsSync(path) || readFileSync(path, 'utf8') !== content) stale.push(name);
  }
  for (const name of listGenerated(GEN)) if (!files.has(name)) stale.push(`${name} (no longer built)`);
  if (stale.length) {
    console.error(`src/art/generated is out of date — run \`npm run art\`:\n  ${stale.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`src/art/generated is up to date (${pictures.length} pictures, ${scenes.length} backdrops).`);
} else {
  rmSync(GEN, { recursive: true, force: true });
  for (const [name, content] of files) {
    mkdirSync(dirname(join(GEN, name)), { recursive: true });
    writeFileSync(join(GEN, name), content);
  }
  mkdirSync(GALLERY, { recursive: true });
  const { page, body } = gallery(pictures, scenes);
  writeFileSync(join(GALLERY, 'index.html'), page);
  writeFileSync(join(GALLERY, 'publish.html'), body);
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  console.log(`Built ${pictures.length} pictures (${pictures.filter((p) => p.byGrid[STYLE.grid].motion).length} moving) and ${scenes.length} backdrops as ${STYLE.grid}-pixel art.`);
  for (const [n, c] of files) console.log(`  ${n.padEnd(34)} ${kb(c.length)}`);
  console.log('Gallery: art-gallery/index.html');
}

// --- The review gallery ------------------------------------------------------

function gallery(pictures, scenes) {
  const [one, two] = COMPARE;
  const sprite = COMPARE.map(({ key, grid }) => {
    const box = `0 0 ${grid} ${grid}`;
    return (
      pictures
        .map((p) => {
          const v = p.byGrid[grid];
          return symbol(`${key}-${p.id}`, box, v.still) + (v.motion ? symbol(`${key}-${p.id}--m`, box, v.motion) : '') + (v.blinkOnly ? symbol(`${key}-${p.id}--b`, box, v.blinkOnly) : '');
        })
        .join('') +
      scenes
        .map((s) => {
          const b = s.byGrid[grid];
          const vb = `0 0 ${b.cols} ${b.rows}`;
          return symbol(`scene-${key}-${s.id}-${s.tone}`, vb, b.still) + (b.moving ? symbol(`scene-${key}-${s.id}-${s.tone}--m`, vb, b.moving) : '');
        })
        .join('')
    );
  }).join('');
  /** A picture: `mode` 'loop' (all its motion), 'idle' (just its blink), or still. */
  const art = (v, id, cls = '', mode) => {
    const p = pictures.find((x) => x.id === id);
    const grid = COMPARE.find((c) => c.key === v).grid;
    const m = p.byGrid[grid];
    let ref = `${v}-${id}`;
    if (mode === 'loop' && m.motion) ref += '--m';
    if (mode === 'idle' && m.blink) ref += m.blinkOnly ? '--b' : '--m';
    return `<svg class="art${cls ? ` ${cls}` : ''}" data-grid="${grid}" aria-hidden="true"><use href="#${ref}"/></svg>`;
  };
  const shown = (p) => p.glyphs.map((gl) => `<span class="was" title="The emoji it replaces">${gl}</span>`).join('');
  const movesNote = (p) => {
    const m = p.byGrid[STYLE.grid];
    const what = [m.loop && 'moves', m.blink && 'blinks'].filter(Boolean).join(' and ');
    return what ? `<span class="moves">${what}</span>` : '';
  };

  const cards = pictures
    .map(
      (p) => `
      <figure class="pic">
        <figcaption><span class="pic__name">${esc(p.title)}</span>${movesNote(p)}${shown(p)}</figcaption>
        <div class="pic__pair">
          ${COMPARE.map(
            ({ key }) => `<div class="pic__one">
            <span class="tag tag--${key}">${key}</span>
            ${art(key, p.id, 'art--96', 'loop')}
            <div class="pic__small">${art(key, p.id, 'art--40')}${art(key, p.id, 'art--24')}</div>
          </div>`,
          ).join('')}
        </div>
      </figure>`,
    )
    .join('');

  const question = (v) => `
      <div class="mock mock--question">
        <div class="speaker">${art(v, 'speaker', 'art--speaker', 'loop')}<span>Kuuntele</span></div>
        <div class="cards">${['cat', 'dog', 'apple', 'football'].map((id) => `<div class="card">${art(v, id, '', 'idle')}</div>`).join('')}</div>
        <p class="hint">The cards only blink. The speaker plays its loop while the word is spoken.</p>
      </div>`;
  const stage = (v, tone) => {
    const s = scenes.find((x) => x.id === 'park' && x.tone === tone);
    const b = s.byGrid[COMPARE.find((c) => c.key === v).grid];
    return `
      <div class="stage">
        <svg class="stage__bg" viewBox="0 0 ${b.cols} ${b.rows}" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-${v}-park-${tone}${b.moving ? '--m' : ''}"/></svg>
        <div class="stage__cast">${art(v, 'sister', '', 'loop')}${art(v, 'dog', '', 'loop')}${art(v, 'cat', '', 'loop')}</div>
        <span class="stage__tone">${tone}</span>
      </div>`;
  };
  const map = (v) => `
      <div class="mock mock--map">
        <div class="topbar">${art(v, 'avatar-fox', 'art--avatar', 'idle')}<span class="topbar__name">Lilli</span><span class="topbar__stars">${art(v, 'star')} 24</span></div>
        ${[
          ['house', 'Koti ja perhe', 'Home and family'],
          ['sun', 'Mitä teet?', 'Doing things'],
          ['book', 'Koulupäivä', 'School day'],
        ]
          .map(([id, fi, en]) => `<div class="unit"><span class="unit__icon">${art(v, id)}</span><span class="unit__text"><b>${fi}</b><small>${en}</small></span>${art(v, 'close', 'unit__lock')}</div>`)
          .join('')}
        <div class="badges">${['trophy', 'star', 'happy'].map((id) => `<span class="badge">${art(v, id)}</span>`).join('')}</div>
        <p class="hint">Small icons stay still.</p>
      </div>`;
  const counting = (v) => `
      <div class="mock mock--count">
        <div class="count">${Array.from({ length: 5 }, () => art(v, 'apple')).join('')}</div>
        <div class="tiles">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `<span class="tile">${art(v, 'tile')}<b>${n}</b></span>`).join('')}</div>
        <div class="count count--doing">${art(v, 'run', '', 'loop')}${art(v, 'happy', '', 'loop')}${art(v, 'sun', '', 'loop')}${art(v, 'trophy', '', 'loop')}</div>
      </div>`;
  const reactions = (v) => `
      <div class="mock mock--react" data-react>
        <div class="react__row">${art(v, 'apple', 'react__pic', 'idle')}${art(v, 'cat', 'react__pic', 'idle')}${art(v, 'star', 'react__pic', 'idle')}</div>
        <div class="react__buttons">
          <button type="button" data-anim="art--pop">Pop in</button>
          <button type="button" data-anim="art--hop">Right answer</button>
          <button type="button" data-anim="art--shake">Wrong answer</button>
        </div>
      </div>`;

  const swatches = Object.entries(P)
    .filter(([name]) => !/Shade$/.test(name))
    .map(([name, hex]) => `<span class="swatch"><i style="background:${hex}"></i>${name}</span>`)
    .join('');

  const body = `<title>Kielipesä Art Sample</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;800&display=swap">
<style>
/* Layout: the app's own light-blue ground and white cards, one column of review sections; every comparison shows the light grid beside the medium grid. */
:root {
  --bg: #eff6ff;
  --card: #ffffff;
  --ink: #0f172a;
  --ink-soft: #475569;
  --brand: #1d4ed8;
  --brand-soft: #dbeafe;
  --accent: #f59e0b;
  --line: #d6e4fa;
  --radius: 22px;
  --shadow: 0 10px 25px rgba(15, 23, 42, 0.1);
  --display: 'Baloo 2', 'Nunito', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --body: 'Baloo 2', 'Nunito', system-ui, -apple-system, 'Segoe UI', sans-serif;
  color-scheme: light;
}
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--ink); font-family: var(--body); font-size: 16px; line-height: 1.5; }
.page { max-width: 1080px; margin: 0 auto; padding: 28px 16px 72px; display: grid; gap: 44px; }
h1, h2 { font-family: var(--display); line-height: 1.1; margin: 0; text-wrap: balance; }
h1 { font-size: clamp(2rem, 6vw, 3rem); font-weight: 800; color: var(--brand); }
h2 { font-size: 1.5rem; font-weight: 800; }
p { margin: 0; max-width: 64ch; }
.eyebrow { font-size: .8rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-soft); }
.intro { display: grid; gap: 14px; }
.lead { font-size: 1.15rem; }
.done { display: flex; flex-wrap: wrap; gap: 8px; }
.done span { font-size: .85rem; font-weight: 600; padding: 4px 12px; border-radius: 999px; background: var(--brand-soft); color: var(--brand); }
.finishes { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
.finish { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 16px 18px; display: grid; gap: 4px; }
.finish b { font-family: var(--display); font-size: 1.2rem; }
.tag { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; font-weight: 800; font-size: .9rem; color: #fff; background: var(--brand); }
.tag--M { background: var(--accent); color: var(--ink); }
section { display: grid; gap: 16px; }
.section-head { display: grid; gap: 6px; }
.art { display: block; width: 1em; height: 1em; overflow: visible; }
.art--96 { font-size: 96px; }
.art--40 { font-size: 40px; }
.art--24 { font-size: 24px; }
.pics { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 14px; }
.pic { margin: 0; background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px 16px 16px; display: grid; gap: 10px; }
.pic figcaption { display: flex; align-items: center; gap: 8px; min-width: 0; }
.pic__name { font-weight: 600; flex: 1; min-width: 0; }
.moves { font-size: .72rem; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; padding: 1px 8px; border-radius: 999px; background: #fef3c7; color: #92400e; }
.was { font-size: 1.4rem; line-height: 1; }
.pic__pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.pic__one { position: relative; display: grid; justify-items: center; gap: 8px; padding: 10px 6px 8px; border-radius: 16px; background: var(--bg); }
.pic__one .tag { position: absolute; top: 8px; left: 8px; width: 22px; height: 22px; font-size: .75rem; }
.pic__small { display: flex; align-items: end; gap: 12px; }
.pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 16px; }
.col { display: grid; gap: 12px; align-content: start; }
.col__head { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.mock { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 16px; display: grid; gap: 14px; }
.mock--question { justify-items: center; }
.hint { font-size: .85rem; color: var(--ink-soft); text-align: center; }
.speaker { width: 124px; height: 124px; border-radius: 50%; background: var(--brand); color: #fff; display: grid; place-items: center; align-content: center; gap: 2px; font-weight: 800; font-size: 3.2rem; box-shadow: var(--shadow); }
.speaker span { font-size: .9rem; }
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; max-width: 320px; }
.card { aspect-ratio: 1; background: var(--card); border: 2px solid var(--line); border-radius: var(--radius); display: grid; place-items: center; font-size: clamp(4rem, 17vw, 5.6rem); }
.stage { position: relative; width: 100%; max-width: 100%; aspect-ratio: 2 / 1; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); background: var(--brand-soft); }
.stage__bg { position: absolute; inset: 0; width: 100%; height: 100%; }
.stage__cast { position: absolute; left: 0; right: 0; bottom: 3%; display: flex; justify-content: center; align-items: flex-end; gap: 2%; }
.stage__cast .art { width: 16%; height: auto; aspect-ratio: 1; }
.stage__tone { position: absolute; top: 10px; left: 12px; font-size: .75rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; padding: 2px 10px; border-radius: 999px; background: rgba(255, 255, 255, .85); color: var(--ink); }
.topbar { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 999px; background: var(--bg); }
.art--avatar { font-size: 40px; }
.topbar__name { font-weight: 800; flex: 1; }
.topbar__stars { display: flex; align-items: center; gap: 6px; font-weight: 800; font-size: 1.4rem; }
.topbar__stars .art { font-size: 1.3rem; }
.unit { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 16px; border: 2px solid var(--line); }
.unit__icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--brand-soft); font-size: 1.7rem; flex: none; }
.unit__text { display: grid; flex: 1; min-width: 0; line-height: 1.2; }
.unit__text small { color: var(--ink-soft); }
.unit__lock { font-size: 1.4rem; }
.badges { display: flex; gap: 10px; }
.badge { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; background: #fff7e0; border: 3px solid #f6c453; font-size: 2.3rem; }
.count { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; font-size: clamp(2.6rem, 10vw, 3.4rem); }
.count--doing { font-size: 4rem; gap: 14px; }
.tiles { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.tile { position: relative; font-size: 52px; }
.tile b { position: absolute; left: 0; right: 0; top: 0; height: 83%; display: grid; place-items: center; color: #fff; font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; }
.mock--react { justify-items: center; }
.react__row { display: flex; gap: 18px; font-size: 4.4rem; }
.react__buttons { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.react__buttons button { font: inherit; font-weight: 600; padding: 8px 14px; border-radius: 999px; border: 2px solid var(--line); background: var(--bg); color: var(--ink); cursor: pointer; }
.react__buttons button:focus-visible { outline: 3px solid var(--brand); outline-offset: 2px; }
.swatches { display: flex; flex-wrap: wrap; gap: 8px; }
.swatch { display: inline-flex; align-items: center; gap: 6px; font-size: .8rem; padding: 3px 10px 3px 4px; border-radius: 999px; background: var(--card); box-shadow: 0 1px 3px rgba(15, 23, 42, .12); }
.swatch i { width: 18px; height: 18px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px rgba(15, 23, 42, .25); }
.ask { background: var(--brand); color: #fff; border-radius: var(--radius); padding: 22px; display: grid; gap: 10px; }
.ask h2 { color: #fff; }
.ask ul { margin: 0; padding-left: 1.2em; display: grid; gap: 4px; }
${artCss(32)
  .replace(/^\/\*.*\*\/\n/, '')
  .replace(/\.art \{\n  --art-px: calc\(1em \/ 32\);\n\}\n/, '')}
.art[data-grid="48"] { --art-px: calc(1em / 48); }
.art[data-grid="32"] { --art-px: calc(1em / 32); }
</style>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${sprite}</defs></svg>
<main class="page">
  <header class="intro">
    <span class="eyebrow">Kielipesä · the picture set · sample 2</span>
    <h1>How much pixel?</h1>
    <p class="lead">The same ${pictures.length} pictures and story backdrop, redrawn the way you asked: the classic finish, thinner one-pixel outlines, softer colors, pixel art, and now animation. Faces blink, Mirri's tail sways, Musti wags, Leo runs, the sun shimmers, and the park's clouds drift. Here are two levels of pixel. Pick one, and I'll draw the rest in it.</p>
    <div class="done"><span>Classic finish</span><span>Thinner outlines</span><span>Softer colors</span><span>Pixel art</span><span>Animated</span></div>
    <div class="finishes">
      ${COMPARE.map(({ key, name, blurb }) => `<div class="finish"><span class="tag tag--${key}">${key}</span><b>${name}</b><span>${blurb}</span></div>`).join('\n      ')}
    </div>
  </header>

  <section>
    <div class="section-head">
      <h2>Side by side</h2>
      <p>Each picture at card size, moving, and at the two small sizes the course map uses, where pictures stay still. The emoji in the corner is the one it replaces.</p>
    </div>
    <div class="pics">${cards}
    </div>
  </section>

  <section>
    <div class="section-head">
      <h2>In the app</h2>
      <p>A listening question, a story page in the three light settings, the course map, a counting game, and the little reactions to an answer. The backdrop's pixels are the same size as the pictures', so the cast belongs in the scene.</p>
    </div>
    <div class="pair">
      ${COMPARE.map(
        ({ key, name }) => `<div class="col">
        <div class="col__head"><span class="tag tag--${key}">${key}</span>${name}</div>
        ${question(key)}
        ${stage(key, 'day')}${stage(key, 'evening')}${stage(key, 'night')}
        ${map(key)}
        ${counting(key)}
        ${reactions(key)}
      </div>`,
      ).join('')}
    </div>
  </section>

  <section>
    <div class="section-head">
      <h2>The same either way</h2>
      <p>Both levels use one softer palette, one-pixel outlines, the same eyes, blush and shine, and the same big-head people. Pictures stay still for anyone who has reduced motion turned on. Mirri is a grey tabby. Musti is black with tan markings, because his name means "blackie". The rest of the cast (Eero, Leo, Äiti, Isä, Isoäiti and the teacher) has a fixed look too, drawn in the next batch.</p>
    </div>
    <div class="swatches">${swatches}</div>
  </section>

  <section class="ask">
    <h2>What I need from you</h2>
    <ul>
      <li>${one.key} (${one.name.toLowerCase()}) or ${two.key} (${two.name.toLowerCase()}).</li>
      <li>Anything else to change before the other ~350 get drawn.</li>
    </ul>
  </section>
</main>
<script>
document.querySelectorAll('[data-react]').forEach(function (box) {
  box.querySelectorAll('button[data-anim]').forEach(function (button) {
    button.addEventListener('click', function () {
      var cls = button.getAttribute('data-anim');
      box.querySelectorAll('.react__pic').forEach(function (pic) {
        pic.classList.remove('art--pop', 'art--hop', 'art--shake');
        void pic.getBoundingClientRect();
        pic.classList.add(cls);
      });
    });
  });
});
</script>
`;
  const split = body.indexOf('<svg width="0"');
  const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${body.slice(0, split)}</head>
<body>
${body.slice(split)}</body>
</html>
`;
  return { page, body };
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Builds the picture set from the recipes in art/.
//
//   node scripts/build-art.mjs           write src/art/generated/ and the review gallery
//   node scripts/build-art.mjs --check   exit 1 if src/art/generated/ is out of date
//
// Every picture is linted: only the palette's colors, only outlined shapes
// (no text, raster, gradients, filters or masks), sensible stroke widths and
// a size budget. The outputs:
//   src/art/generated/words.svg, ui.svg   one <symbol> per picture (art-<id>)
//   src/art/generated/scenes/<id>-<tone>.svg   one file per story backdrop
//   src/art/generated/manifest.ts         ids, groups, titles, emoji → picture
//   art-gallery/index.html                every picture in both finishes, and
//                                         the same page as publish.html (no
//                                         document wrapper) for sharing

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECIPES, SCENES } from '../art/index.mjs';
import { STROKE, makeKit } from '../art/kit.mjs';
import { P, PALETTE } from '../art/palette.mjs';
import { SCENE_H, SCENE_W } from '../art/scenes/parts.mjs';
import { STYLE } from '../art/style.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GEN = join(ROOT, 'src', 'art', 'generated');
const GALLERY = join(ROOT, 'art-gallery');
const CHECK = process.argv.includes('--check');

/** Bytes a picture may take (its symbol, in the chosen finish). */
const BUDGET = { picture: STYLE === 'B' ? 6000 : 3600, scene: 16000 };

/** An emoji: a pictograph sequence, a keycap or a flag. */
const EMOJI = /^(?:[0-9#*]\uFE0F?\u20E3|\p{Regional_Indicator}{2}|\p{Extended_Pictographic}[\uFE0E\uFE0F]?(?:\u200D\p{Extended_Pictographic}[\uFE0E\uFE0F]?)*)$/u;
/** The lookup key for an emoji: the same glyph with or without a variation selector. */
const glyphKey = (s) => s.replace(/[\uFE0E\uFE0F]/g, '');

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

// --- Rendering ---------------------------------------------------------------

const GROUP_ATTRS = `stroke-linejoin="round" stroke-linecap="round" stroke-width="${STROKE}"`;

/** A picture's markup in one finish. The sticker finish lays a soft shadow and a white rim under it. */
function render(recipe, variant) {
  const art = recipe.draw(makeKit({ variant }));
  if (variant !== 'B') return art;
  const shadow = recipe.draw(makeKit({ variant, pass: 'rim', rimColor: P.ink }));
  const rim = recipe.draw(makeKit({ variant, pass: 'rim', rimColor: P.white }));
  return `<g opacity=".16" transform="translate(.6 1.5)">${shadow}</g>${rim}${art}`;
}

const symbol = (id, viewBox, inner) => `<symbol id="${id}" viewBox="${viewBox}"><g ${GROUP_ATTRS}>${inner}</g></symbol>`;

// --- Lint ----------------------------------------------------------------------

const ALLOWED_TAGS = new Set(['g', 'path', 'circle', 'ellipse', 'rect']);

function lint(markup, budget) {
  const errors = [];
  for (const [, tag] of markup.matchAll(/<(\w+)/g)) if (!ALLOWED_TAGS.has(tag)) errors.push(`<${tag}> is not allowed`);
  for (const [, attr, value] of markup.matchAll(/\b(fill|stroke)="([^"]*)"/g)) {
    if (value !== 'none' && !PALETTE.has(value.toUpperCase())) errors.push(`${attr}="${value}" is not in the palette`);
  }
  for (const [, w] of markup.matchAll(/stroke-width="([^"]*)"/g)) {
    const n = Number(w);
    if (!(n >= 1.5 && n <= 16)) errors.push(`stroke-width="${w}" (allowed: 1.5–16)`);
  }
  for (const [, o] of markup.matchAll(/opacity="([^"]*)"/g)) {
    const n = Number(o);
    if (!(n > 0 && n <= 1)) errors.push(`opacity="${o}"`);
  }
  if (/NaN|undefined|Infinity|null/.test(markup)) errors.push('a coordinate is not a number');
  if (markup.length > budget) errors.push(`${markup.length} bytes (budget ${budget})`);
  return errors;
}

// --- Build ---------------------------------------------------------------------

function build() {
  const words = vocabulary();
  const problems = [];
  const pictures = [];
  const glyphs = new Map(); // key → id
  const seen = new Set();

  for (const r of RECIPES) {
    const where = `picture "${r.id}"`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.id)) problems.push(`${where}: ids are lower-case words joined by hyphens`);
    if (seen.has(r.id)) problems.push(`${where}: id used twice`);
    seen.add(r.id);
    const group = r.group ?? 'words';
    const word = words.get(r.id);
    if (group === 'words' && !word) problems.push(`${where}: a word picture's id must be a word id (src/content/data)`);
    if (group !== 'words' && word) problems.push(`${where}: "${r.id}" is a word id — draw it as a word picture, or rename it`);
    const claims = [...(r.glyphs ?? [])];
    if (word && r.glyph !== false && word.emoji && EMOJI.test(word.emoji) && !claims.includes(word.emoji)) claims.push(word.emoji);
    for (const g of claims) {
      if (!EMOJI.test(g)) problems.push(`${where}: "${g}" is not an emoji`);
      const key = glyphKey(g);
      if (glyphs.has(key)) problems.push(`${where}: ${g} is already drawn by "${glyphs.get(key)}"`);
      else glyphs.set(key, r.id);
    }
    const markup = { A: render(r, 'A'), B: render(r, 'B') };
    for (const v of ['A', 'B']) for (const e of lint(markup[v], v === STYLE ? BUDGET.picture : Infinity)) problems.push(`${where} (${v}): ${e}`);
    pictures.push({ id: r.id, title: r.title, group, glyphs: claims, markup });
  }

  const scenes = [];
  for (const s of SCENES) {
    for (const tone of s.tones) {
      const markup = s.draw(makeKit({ variant: 'A' }), tone);
      for (const e of lint(markup, BUDGET.scene)) problems.push(`backdrop "${s.id}-${tone}": ${e}`);
      scenes.push({ id: s.id, title: s.title, tone, markup });
    }
  }

  if (problems.length) {
    console.error(`The picture set has ${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }

  pictures.sort((a, b) => a.id.localeCompare(b.id));
  const files = new Map();
  for (const group of ['ui', 'words']) {
    const inGroup = pictures.filter((p) => p.group === group);
    files.set(
      `${group}.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg">${inGroup.map((p) => symbol(`art-${p.id}`, '0 0 64 64', p.markup[STYLE])).join('')}</svg>\n`,
    );
  }
  for (const s of scenes) {
    files.set(
      `scenes/${s.id}-${s.tone}.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SCENE_W} ${SCENE_H}" preserveAspectRatio="xMidYMax slice"><g ${GROUP_ATTRS}>${s.markup}</g></svg>\n`,
    );
  }
  files.set('manifest.ts', manifest(pictures, glyphs, scenes));
  return { files, pictures, scenes };
}

function manifest(pictures, glyphs, scenes) {
  const q = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const tones = new Map();
  for (const s of scenes) tones.set(s.id, [...(tones.get(s.id) ?? []), s.tone]);
  const glyphLines = [...glyphs.entries()].sort(([, a], [, b]) => a.localeCompare(b)).map(([g, id]) => `  ${q(g)}: ${q(id)},`);
  return [
    '// Generated by scripts/build-art.mjs from the recipes in art/. Do not edit.',
    '',
    '/** Every picture in the set. */',
    `export type ArtId =\n${pictures.map((p) => `  | ${q(p.id)}`).join('\n')};`,
    '',
    "export type ArtGroup = 'ui' | 'words';",
    '',
    '/** Which sprite each picture is in, and what it shows. */',
    'export const ART: Readonly<Record<ArtId, { group: ArtGroup; title: string }>> = {',
    ...pictures.map((p) => `  ${/^[a-z]+$/.test(p.id) ? p.id : q(p.id)}: { group: ${q(p.group)}, title: ${q(p.title)} },`),
    '};',
    '',
    '/** An emoji (variation selectors removed) → the picture drawn for it. */',
    'export const GLYPH_ART: Readonly<Record<string, ArtId>> = {',
    ...glyphLines,
    '};',
    '',
    '/** Story backdrops, and the tones each is drawn in. */',
    'export const BACKDROPS = {',
    ...[...tones.entries()].map(([id, ts]) => `  ${/^[a-z]+$/.test(id) ? id : q(id)}: [${ts.map(q).join(', ')}],`),
    '} as const;',
    '',
    'export type BackdropId = keyof typeof BACKDROPS;',
    '',
  ].join('\n');
}

// --- Write or check --------------------------------------------------------

function listGenerated(dir, prefix = '') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listGenerated(join(dir, e.name), `${prefix}${e.name}/`) : [`${prefix}${e.name}`],
  );
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
  const sizes = [...files].map(([n, c]) => [n, c.length]);
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  console.log(`Built ${pictures.length} pictures and ${scenes.length} backdrops in the ${STYLE} finish.`);
  for (const [n, s] of sizes) console.log(`  ${n.padEnd(28)} ${kb(s)}`);
  console.log(`Gallery: art-gallery/index.html`);
}

// --- The review gallery ------------------------------------------------------

/** What each sample stands in for, in the order the gallery shows them. */
function gallery(pictures, scenes) {
  const byId = new Map(pictures.map((p) => [p.id, p]));
  const sprite = (v) =>
    pictures.map((p) => symbol(`${v}-${p.id}`, '0 0 64 64', p.markup[v])).join('') +
    scenes.map((s) => symbol(`scene-${s.id}-${s.tone}`, `0 0 ${SCENE_W} ${SCENE_H}`, s.markup)).join('');
  const art = (v, id, cls = '') => `<svg class="art${cls ? ` ${cls}` : ''}" aria-hidden="true"><use href="#${v}-${id}"/></svg>`;
  const shown = (p) => p.glyphs.map((g) => `<span class="was" title="The emoji it replaces">${g}</span>`).join('');

  const cards = pictures
    .map(
      (p) => `
      <figure class="pic">
        <figcaption><span class="pic__name">${esc(p.title)}</span>${shown(p)}</figcaption>
        <div class="pic__pair">
          ${['A', 'B']
            .map(
              (v) => `<div class="pic__one">
            <span class="tag tag--${v}">${v}</span>
            ${art(v, p.id, 'art--96')}
            <div class="pic__small">${art(v, p.id, 'art--40')}${art(v, p.id, 'art--24')}</div>
          </div>`,
            )
            .join('')}
        </div>
      </figure>`,
    )
    .join('');

  const question = (v) => `
      <div class="mock mock--question">
        <div class="speaker">${art(v, 'speaker', 'art--speaker')}<span>Kuuntele</span></div>
        <div class="cards">${['cat', 'dog', 'apple', 'football'].map((id) => `<div class="card">${art(v, id)}</div>`).join('')}</div>
      </div>`;
  const stage = (v, tone) => `
      <div class="stage">
        <svg class="stage__bg" viewBox="0 0 ${SCENE_W} ${SCENE_H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-park-${tone}"/></svg>
        <div class="stage__cast">${art(v, 'sister')}${art(v, 'cat')}</div>
        <span class="stage__tone">${tone}</span>
      </div>`;
  const map = (v) => `
      <div class="mock mock--map">
        <div class="topbar">${art(v, 'avatar-fox', 'art--avatar')}<span class="topbar__name">Lilli</span><span class="topbar__stars">${art(v, 'star')} 24</span></div>
        ${[
          ['house', 'Koti ja perhe', 'Home and family'],
          ['sun', 'Mitä teet?', 'Doing things'],
          ['book', 'Koulupäivä', 'School day'],
        ]
          .map(
            ([id, fi, en]) =>
              `<div class="unit">${byId.has(id) ? `<span class="unit__icon">${art(v, id)}</span>` : ''}<span class="unit__text"><b>${fi}</b><small>${en}</small></span>${art(v, 'close', 'unit__lock')}</div>`,
          )
          .join('')}
        <div class="badges">${['trophy', 'star', 'happy'].map((id) => `<span class="badge">${art(v, id)}</span>`).join('')}</div>
      </div>`;
  const counting = (v) => `
      <div class="mock mock--count">
        <div class="count">${Array.from({ length: 5 }, () => art(v, 'apple')).join('')}</div>
        <div class="tiles">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `<span class="tile">${art(v, 'tile')}<b>${n}</b></span>`).join('')}</div>
        <div class="count count--doing">${art(v, 'run')}${art(v, 'happy')}${art(v, 'house')}</div>
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
/* Layout: the app's own light-blue ground and white cards, one column of review sections; every comparison shows finish A beside finish B. */
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
.finishes { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
.finish { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 16px 18px; display: grid; gap: 4px; }
.finish b { font-family: var(--display); font-size: 1.2rem; }
.tag { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; font-weight: 800; font-size: .9rem; color: #fff; background: var(--brand); }
.tag--B { background: var(--accent); color: var(--ink); }
section { display: grid; gap: 16px; }
.section-head { display: grid; gap: 6px; }
.art { display: block; width: 1em; height: 1em; overflow: visible; }
.art--96 { font-size: 96px; }
.art--40 { font-size: 40px; }
.art--24 { font-size: 24px; }
.pics { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 14px; }
.pic { margin: 0; background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px 16px 16px; display: grid; gap: 10px; }
.pic figcaption { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; }
.pic__name { font-weight: 600; }
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
.speaker { width: 124px; height: 124px; border-radius: 50%; background: var(--brand); color: #fff; display: grid; place-items: center; align-content: center; gap: 2px; font-weight: 800; font-size: 3.2rem; box-shadow: var(--shadow); }
.speaker span { font-size: .9rem; }
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; max-width: 320px; }
.card { aspect-ratio: 1; background: var(--card); border: 2px solid var(--line); border-radius: var(--radius); display: grid; place-items: center; font-size: clamp(4rem, 17vw, 5.6rem); }
.stage { position: relative; width: 100%; max-width: 100%; aspect-ratio: 2 / 1; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); background: var(--brand-soft); }
.stage__bg { position: absolute; inset: 0; width: 100%; height: 100%; }
.stage__cast { position: absolute; left: 0; right: 0; bottom: 4%; display: flex; justify-content: center; align-items: flex-end; gap: 4%; font-size: clamp(3.4rem, 15vw, 5.6rem); }
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
.badge { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; background: radial-gradient(circle at 50% 40%, #fff7e0, #fde7a8); border: 3px solid #f6c453; font-size: 2.3rem; }
.count { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; font-size: clamp(2.4rem, 9vw, 3.2rem); }
.count--doing { font-size: 4.2rem; gap: 20px; }
.tiles { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.tile { position: relative; font-size: 52px; }
.tile b { position: absolute; left: 0; right: 0; top: 0; height: 83%; display: grid; place-items: center; color: #fff; font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; }
.swatches { display: flex; flex-wrap: wrap; gap: 8px; }
.swatch { display: inline-flex; align-items: center; gap: 6px; font-size: .8rem; padding: 3px 10px 3px 4px; border-radius: 999px; background: var(--card); box-shadow: 0 1px 3px rgba(15, 23, 42, .12); }
.swatch i { width: 18px; height: 18px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px rgba(15, 23, 42, .25); }
.ask { background: var(--brand); color: #fff; border-radius: var(--radius); padding: 22px; display: grid; gap: 10px; }
.ask h2 { color: #fff; }
.ask ul { margin: 0; padding-left: 1.2em; display: grid; gap: 4px; }
@media (prefers-reduced-motion: no-preference) { .pic, .mock { transition: transform .15s ease; } }
</style>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${sprite('A')}${sprite('B')}</defs></svg>
<main class="page">
  <header class="intro">
    <span class="eyebrow">Kielipesä · the picture set</span>
    <h1>Style sample: A or B?</h1>
    <p class="lead">These are ${pictures.length} of the roughly 370 pictures that will replace the emoji, plus one story backdrop. They're bold and rounded with dark outlines, as you chose, and they come in two finishes. Pick one, and I'll draw everything else in it.</p>
    <div class="finishes">
      <div class="finish"><span class="tag tag--A">A</span><b>Classic</b><span>A dark outline, flat colors, and a soft shadow on the ground.</span></div>
      <div class="finish"><span class="tag tag--B">B</span><b>Sticker</b><span>The same drawing with a white die-cut border and a small lift shadow, like a sticker.</span></div>
    </div>
  </header>

  <section>
    <div class="section-head">
      <h2>Side by side</h2>
      <p>Each picture at card size and at the two small sizes the course map uses. The emoji in the corner is the one it replaces.</p>
    </div>
    <div class="pics">${cards}
    </div>
  </section>

  <section>
    <div class="section-head">
      <h2>In the app</h2>
      <p>The same pictures in a listening question, on a story page in the three light settings, on the course map and in a counting game.</p>
    </div>
    <div class="pair">
      ${['A', 'B']
        .map(
          (v) => `<div class="col">
        <div class="col__head"><span class="tag tag--${v}">${v}</span>${v === 'A' ? 'Classic' : 'Sticker'}</div>
        ${question(v)}
        ${stage(v, 'day')}${stage(v, 'evening')}${stage(v, 'night')}
        ${map(v)}
        ${counting(v)}
      </div>`,
        )
        .join('')}
    </div>
  </section>

  <section>
    <div class="section-head">
      <h2>The same either way</h2>
      <p>Both finishes use one palette, one outline (2.5 units on a 64-unit square), the same eyes, blush and shine, and the same big-head people. Mirri is a grey tabby and Musti is a black dog, because his name means "blackie". The rest of the cast (Eero, Leo, Äiti, Isä, Isoäiti and the teacher) has a fixed look too, drawn in the next batch.</p>
    </div>
    <div class="swatches">${swatches}</div>
  </section>

  <section class="ask">
    <h2>What I need from you</h2>
    <ul>
      <li>A or B.</li>
      <li>Anything to change before the other ~350 get drawn. For example: colors, outline weight, faces, how big the heads are, or a cast member's look.</li>
    </ul>
  </section>
</main>
`;
  const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${body.slice(0, body.indexOf('<svg width="0"'))}</head>
<body>
${body.slice(body.indexOf('<svg width="0"'))}</body>
</html>
`;
  return { page, body };
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

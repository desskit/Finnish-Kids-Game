// Art asset tracker generator.
//
// Builds a LIVE checklist of every custom-art asset the app needs and reconciles
// it against what's actually been dropped into `public/`. Emits:
//   - docs/art/art-tracker.csv  (open in Google Sheets / Excel / Numbers)
//   - docs/art/art-tracker.md   (grouped tables, renders on GitHub)
//
// The bulk (per-word item illustrations) is DATA-DRIVEN from
// src/content/data/*.sourced.json, so the list grows automatically as themes are
// added. The non-item categories (icons, mascot, avatars, badges, app icons)
// mirror the source-of-truth files noted beside each block — re-sync if those change.
//
// Status is derived by checking whether each asset's file exists under public/.
// A manual `approved` / `wired` status in the existing CSV is PRESERVED across runs
// (so human curation isn't clobbered); everything else is recomputed needed/uploaded.
//
//   node scripts/art-manifest.mjs            # regenerate
//   node scripts/art-manifest.mjs --check    # exit 1 if any required asset is still needed
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'src', 'content', 'data');
const PUBLIC_DIR = join(ROOT, 'public');
const OUT_DIR = join(ROOT, 'docs', 'art');
const CSV_PATH = join(OUT_DIR, 'art-tracker.csv');
const MD_PATH = join(OUT_DIR, 'art-tracker.md');

const COLUMNS = [
  'category',
  'group',
  'id',
  'filename', // path relative to public/
  'format',
  'priority',
  'placeholder',
  'status',
  'notes',
];

// --- Source-of-truth constants (mirror the cited files) --------------------

// Registry themes, in home/journey order (src/content/index.ts `themes`).
// Anything else found in data/ that isn't here and isn't a known pool is ignored.
const REGISTRY_ORDER = [
  'animals',
  'numbers',
  'food',
  'family',
  'places',
  'body',
  'nature',
  'clothes',
];
// Exported but NOT playable themes (src/content/index.ts) — content pools only.
const POOL_THEMES = new Set(['adjectives', 'verbs']);
// Of the adjectives pool, only the colors get an (optional) swatch.
const COLOR_IDS = ['red', 'blue', 'yellow', 'green', 'black', 'white', 'brown'];

// Journey-path chapters (src/game/path.tsx CHAPTERS).
const CHAPTER_ICONS = [
  ['first-words', '🔊'],
  ['naming', '🧩'],
  ['where', '📍'],
  ['likes', '❤️'],
  ['numbers-describe', '🔢'],
  ['actions', '🏃'],
  ['together', '🔀'],
  ['sentences', '📝'],
];

// Activity kinds (src/game/path.tsx ActivityKind).
const ACTIVITY_ICONS = [
  ['listen', '🔊', ''],
  ['build', '🧩', ''],
  ['count', '🔢', 'make visually distinct from the numbers theme icon'],
  ['match', '🎨', ''],
  ['conjugate', '🏃', ''],
  ['order', '🔀', ''],
  ['spell', '⌨️', ''],
  ['review', '🔁', ''],
  ['sentence', '📝', ''],
];

// Owl mascot poses. idle/celebrate/wave/icon-master already generated (re-cut
// transparent); the rest expand emotional range. icon-master is a PNG master.
const MASCOT = [
  ['owl-idle', 'webp', 'required', '🦉', 'already generated — re-cut transparent'],
  ['owl-celebrate', 'webp', 'required', '🦊🎉', 'already generated — re-cut transparent'],
  ['owl-wave', 'webp', 'required', '🦉', 'already generated — re-cut transparent'],
  ['owl-icon-master', 'png', 'required', '🦉', 'high-res transparent master → feeds app icons'],
  ['owl-happy', 'webp', 'optional', '🦉', 'correct-answer pose'],
  ['owl-encourage', 'webp', 'optional', '🦉', 'wrong-answer pose — warm, never scolding'],
  ['owl-listening', 'webp', 'optional', '🦉', 'wing to ear — ties to the 🔊 prompt'],
  ['owl-reading', 'webp', 'optional', '🦉', 'book — Spelling / Word-order'],
  ['owl-pointing', 'webp', 'optional', '🦉', 'directs attention'],
  ['owl-sleeping', 'webp', 'optional', '🦉', 'idle / attract state'],
];

// Player avatars (src/state/storage.ts AVATARS, in order). slug → emoji.
const AVATARS = [
  ['fox', '🦊', 'reuse animals art'],
  ['owl', '🦉', 'reuse mascot'],
  ['bear', '🐻', 'reuse animals art'],
  ['cat', '🐱', 'reuse animals art'],
  ['dog', '🐶', 'reuse animals art'],
  ['bunny', '🐰', 'reuse animals art'],
  ['frog', '🐸', 'reuse animals art'],
  ['panda', '🐼', 'net-new'],
  ['lion', '🦁', 'net-new'],
  ['tiger', '🐯', 'net-new'],
  ['koala', '🐨', 'net-new'],
  ['penguin', '🐧', 'net-new'],
];

// Achievement badges (src/game/badges.ts BADGES).
const BADGES = [
  ['first-steps', '🌱'],
  ['stars-25', '⭐'],
  ['stars-100', '🌟'],
  ['words-10', '📚'],
  ['mastered-10', '🏆'],
  ['sharp', '🎯'],
  ['level-up', '🚀'],
  ['explorer', '🗺️'],
  ['all-games', '🎮'],
];

// Optional UI-glyph polish (in-app chrome; today plain emoji/text).
const UI_GLYPHS = [
  ['speaker', '🔊', 'replay/hear button — in every game'],
  ['back', '⬅︎', 'activity header back'],
  ['settings', '⚙', 'grown-up button'],
  ['lock', '🔒', 'parent gate'],
  ['add', '➕', 'add child'],
  ['check', '✓', 'correct feedback'],
  ['crown', '👑', 'mastered node'],
  ['sparkle', '✨', 'coming-soon'],
  ['star', '⭐', 'reward star / counter'],
  ['mute', '🔇', 'audio unavailable'],
];

// Generated PWA icons (scripts/make-icons.mjs, rewritten to sharp from the owl master).
const APP_ICONS = [
  ['icon-192', 'icons/icon-192.png'],
  ['icon-512', 'icons/icon-512.png'],
  ['icon-maskable-512', 'icons/icon-maskable-512.png'],
  ['apple-touch', 'icons/apple-touch-icon.png'],
  ['favicon', 'favicon.svg'],
];

// --- Build the desired-asset rows ------------------------------------------

function readTheme(themeId) {
  const file = join(DATA_DIR, `${themeId}.sourced.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** @returns {Array<Record<string,string>>} desired rows (status filled later) */
function buildRows() {
  const rows = [];
  const push = (r) => rows.push({ status: '', notes: '', placeholder: '', ...r });

  // 1. Item illustrations (data-driven) + numerals + color swatches.
  for (const themeId of REGISTRY_ORDER) {
    const theme = readTheme(themeId);
    if (!theme) {
      console.warn(`! missing data file for registry theme "${themeId}"`);
      continue;
    }
    for (const w of theme.words) {
      if (themeId === 'numbers') {
        push({
          category: 'numeral',
          group: 'numbers',
          id: w.id,
          filename: `art/numbers/${w.id}.svg`,
          format: 'svg',
          priority: 'optional',
          placeholder: w.emoji ?? '',
          notes: 'styled numeral — SVG or pure CSS',
        });
      } else {
        push({
          category: 'item',
          group: themeId,
          id: w.id,
          filename: `art/${themeId}/${w.id}.webp`,
          format: 'webp',
          priority: 'required',
          placeholder: w.emoji ?? '',
          notes: themeId === 'family' ? 'kawaii human' : '',
        });
      }
    }
  }

  // Color swatches from the adjectives pool (optional).
  const adjectives = readTheme('adjectives');
  if (adjectives) {
    const byId = new Map(adjectives.words.map((w) => [w.id, w]));
    for (const id of COLOR_IDS) {
      const w = byId.get(id);
      if (!w) continue;
      push({
        category: 'color',
        group: 'colors',
        id,
        filename: `art/colors/${id}.svg`,
        format: 'svg',
        priority: 'optional',
        placeholder: w.emoji ?? '',
        notes: 'optional swatch',
      });
    }
  }

  // 2. Theme icons (one per registry theme; emoji from its header).
  for (const themeId of REGISTRY_ORDER) {
    const theme = readTheme(themeId);
    if (!theme) continue;
    push({
      category: 'theme-icon',
      group: 'theme-icons',
      id: themeId,
      filename: `art/themes/${themeId}.svg`,
      format: 'svg',
      priority: 'required',
      placeholder: theme.theme?.emoji ?? '',
    });
  }

  // 3. Chapter banner icons.
  for (const [id, emoji] of CHAPTER_ICONS) {
    push({
      category: 'chapter-icon',
      group: 'chapter-icons',
      id,
      filename: `art/chapters/${id}.svg`,
      format: 'svg',
      priority: 'required',
      placeholder: emoji,
    });
  }

  // 4. Activity icons.
  for (const [id, emoji, note] of ACTIVITY_ICONS) {
    push({
      category: 'activity-icon',
      group: 'activity-icons',
      id,
      filename: `art/ui/${id}.svg`,
      format: 'svg',
      priority: 'required',
      placeholder: emoji,
      notes: note,
    });
  }

  // 5. Mascot poses.
  for (const [id, format, priority, placeholder, notes] of MASCOT) {
    const ext = format === 'png' ? 'png' : 'webp';
    push({
      category: 'mascot',
      group: 'mascot',
      id,
      filename: `art/mascot/${id}.${ext}`,
      format,
      priority,
      placeholder,
      notes,
    });
  }

  // 6. Player avatars.
  for (const [id, emoji, note] of AVATARS) {
    push({
      category: 'avatar',
      group: 'avatars',
      id,
      filename: `art/avatars/${id}.webp`,
      format: 'webp',
      priority: 'future',
      placeholder: emoji,
      notes: note,
    });
  }

  // 7. Achievement badges.
  for (const [id, emoji] of BADGES) {
    push({
      category: 'badge',
      group: 'badges',
      id,
      filename: `art/badges/${id}.svg`,
      format: 'svg',
      priority: 'future',
      placeholder: emoji,
    });
  }

  // 8. Optional UI glyphs.
  for (const [id, emoji, note] of UI_GLYPHS) {
    push({
      category: 'ui-glyph',
      group: 'ui-glyphs',
      id,
      filename: `art/ui/${id}.svg`,
      format: 'svg',
      priority: 'optional',
      placeholder: emoji,
      notes: note,
    });
  }

  // 9. Generated app icons.
  for (const [id, filename] of APP_ICONS) {
    push({
      category: 'app-icon',
      group: 'app-icons',
      id,
      filename,
      format: filename.endsWith('.svg') ? 'svg' : 'png',
      priority: 'required',
      placeholder: '',
      notes: 'generated from owl-icon-master via make-icons; placeholder present until then',
    });
  }

  return rows;
}

// --- Reconcile status against public/ and the previous CSV -----------------

function parseCsv(text) {
  // Minimal RFC-4180-ish parser (handles quoted fields with commas/quotes).
  const records = [];
  let field = '';
  let record = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { record.push(field); field = ''; }
    else if (c === '\n') { record.push(field); records.push(record); field = ''; record = []; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || record.length) { record.push(field); records.push(record); }
  return records;
}

function loadPreviousStatus() {
  const map = new Map(); // `${category}|${id}` -> previous status
  if (!existsSync(CSV_PATH)) return map;
  const records = parseCsv(readFileSync(CSV_PATH, 'utf8'));
  if (!records.length) return map;
  const header = records[0];
  const ci = (name) => header.indexOf(name);
  for (let i = 1; i < records.length; i++) {
    const r = records[i];
    if (!r.length || r.every((x) => x === '')) continue;
    map.set(`${r[ci('category')]}|${r[ci('id')]}`, r[ci('status')]);
  }
  return map;
}

const STICKY_STATUSES = new Set(['approved', 'wired']);

function reconcile(rows) {
  const prev = loadPreviousStatus();
  for (const row of rows) {
    const previous = prev.get(`${row.category}|${row.id}`);
    if (previous && STICKY_STATUSES.has(previous)) {
      row.status = previous; // preserve human-curated status
      continue;
    }
    row.status = existsSync(join(PUBLIC_DIR, row.filename)) ? 'uploaded' : 'needed';
  }
  return rows;
}

// --- Emit CSV + Markdown ---------------------------------------------------

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function writeCsv(rows) {
  const lines = [COLUMNS.join(',')];
  for (const r of rows) lines.push(COLUMNS.map((c) => csvCell(r[c])).join(','));
  writeFileSync(CSV_PATH, lines.join('\n') + '\n');
}

const STATUS_MARK = { uploaded: '✅', approved: '🟢', wired: '🔗', needed: '⬜' };

function writeMarkdown(rows) {
  const cats = [...new Set(rows.map((r) => r.category))];
  const out = [];
  out.push('# Art tracker');
  out.push('');
  out.push('Live checklist of every custom-art asset. **Do not edit the status column by hand for');
  out.push('needed/uploaded** — it is recomputed from `public/` by `npm run art:manifest`. You *may*');
  out.push('set a status to `approved` or `wired`; those are preserved across runs. The CSV');
  out.push('(`art-tracker.csv`) opens in any spreadsheet.');
  out.push('');
  // Summary table.
  out.push('| Category | Total | ✅ Uploaded | ⬜ Needed |');
  out.push('| --- | ---: | ---: | ---: |');
  let tAll = 0, tUp = 0, tNeed = 0;
  for (const cat of cats) {
    const g = rows.filter((r) => r.category === cat);
    const up = g.filter((r) => r.status === 'uploaded' || STICKY_STATUSES.has(r.status)).length;
    const need = g.filter((r) => r.status === 'needed').length;
    tAll += g.length; tUp += up; tNeed += need;
    out.push(`| ${cat} | ${g.length} | ${up} | ${need} |`);
  }
  out.push(`| **total** | **${tAll}** | **${tUp}** | **${tNeed}** |`);
  out.push('');
  // Per-category detail.
  for (const cat of cats) {
    const g = rows.filter((r) => r.category === cat);
    out.push(`## ${cat} (${g.length})`);
    out.push('');
    out.push('| | id | file | fmt | priority | placeholder | notes |');
    out.push('| :-: | --- | --- | --- | --- | :-: | --- |');
    for (const r of g) {
      const mark = STATUS_MARK[r.status] ?? r.status;
      out.push(`| ${mark} | ${r.id} | \`${r.filename}\` | ${r.format} | ${r.priority} | ${r.placeholder} | ${r.notes} |`);
    }
    out.push('');
  }
  writeFileSync(MD_PATH, out.join('\n') + '\n');
}

// --- Run -------------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });
const rows = reconcile(buildRows());
writeCsv(rows);
writeMarkdown(rows);

// Summary to stdout.
const byCat = new Map();
for (const r of rows) {
  const s = byCat.get(r.category) ?? { total: 0, uploaded: 0, needed: 0 };
  s.total++;
  if (r.status === 'uploaded' || STICKY_STATUSES.has(r.status)) s.uploaded++;
  else if (r.status === 'needed') s.needed++;
  byCat.set(r.category, s);
}
console.log('Art assets — needed vs uploaded:');
for (const [cat, s] of byCat) {
  console.log(`  ${cat.padEnd(14)} ${String(s.uploaded).padStart(3)} / ${s.total}  (${s.needed} needed)`);
}
const total = rows.length;
const uploaded = rows.filter((r) => r.status === 'uploaded' || STICKY_STATUSES.has(r.status)).length;
console.log(`  ${'TOTAL'.padEnd(14)} ${String(uploaded).padStart(3)} / ${total}  (${total - uploaded} needed)`);
console.log(`\nWrote ${CSV_PATH.replace(ROOT + '/', '')} and ${MD_PATH.replace(ROOT + '/', '')}`);

if (process.argv.includes('--check')) {
  const missingRequired = rows.filter((r) => r.priority === 'required' && r.status === 'needed');
  if (missingRequired.length) {
    console.error(`\n--check: ${missingRequired.length} required asset(s) still needed.`);
    process.exit(1);
  }
}

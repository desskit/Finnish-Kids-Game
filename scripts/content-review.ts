// Generates docs/FINNISH_REVIEW.md: EVERY piece of hand-authored Finnish in the
// game, as one proofing sheet for the native reviewer — the vetting workflow
// that replaces the scattered "⚠️ NEEDS NATIVE FINNISH VETTING" code comments.
//
// The entries come from src/game/reviewEntries.ts — the SAME list the
// grown-ups' in-app "Finnish check" screen shows, under the same stable keys.
// A reviewer approves entries either here (add the Key to
// data/finnish-vetted.json) or in the app (then `npm run review:import
// <downloaded file>` merges the approvals into that ledger). Approved entries
// show ✅; entries a reviewer flagged (data/finnish-flags.json) show 🚩 with
// their note. Short entries a dictionary can settle were checked against
// Wiktionary (data/finnish-wiktionary-checked.json) and show 📖 while their
// Finnish reads as it did when checked. "Start here" counts what's left to
// check unit by unit, in the order the children meet it.
//
// Run: npm run review:content  (vite-node — imports the real TS content)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { placeLabel, placeRank, reviewSections, type ReviewEntry, type ReviewPlace } from '../src/game/reviewEntries';
import { PATH } from '../src/game/path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const vettedFile = JSON.parse(readFileSync(join(root, 'data', 'finnish-vetted.json'), 'utf8')) as {
  vetted: string[];
};
const vetted = new Set(vettedFile.vetted);
const flagsPath = join(root, 'data', 'finnish-flags.json');
const flags: Record<string, { note?: string; suggestion?: string }> = existsSync(flagsPath)
  ? (JSON.parse(readFileSync(flagsPath, 'utf8')) as { flags: Record<string, { note?: string; suggestion?: string }> }).flags
  : {};

const wiktionary = JSON.parse(readFileSync(join(root, 'data', 'finnish-wiktionary-checked.json'), 'utf8')) as {
  checked: Record<string, { fi: string; how: string }>;
  notes: Record<string, string>;
};
/** Checked against Wiktionary, and the Finnish still reads as it did then. */
const inWiktionary = (r: ReviewEntry) => wiktionary.checked[r.key]?.fi === r.fi;
/** Nothing left for the native reviewer: approved, or checked against Wiktionary. */
const done = (r: ReviewEntry) => vetted.has(r.key) || inWiktionary(r);

const status = (r: ReviewEntry) => (flags[r.key] ? '🚩' : vetted.has(r.key) ? '✅' : inWiktionary(r) ? '📖' : '⚠️');
const esc = (s: string) => s.replace(/\|/g, '\\|');
const flagText = (key: string) => {
  const f = flags[key];
  if (!f) return wiktionary.notes[key] && !vetted.has(key) ? ` 📝 _Dictionary check: ${esc(wiktionary.notes[key])}_` : '';
  return ` 🚩 ${esc([f.note, f.suggestion && `→ ${f.suggestion}`].filter(Boolean).join(' '))}`;
};
const table = (rows: ReviewEntry[]) => [
  '| Status | Where | Key | Finnish | English |',
  '| --- | --- | --- | --- | --- |',
  ...rows.map((r) => `| ${status(r)} | ${placeLabel(r.where)} | \`${r.key}\` | ${esc(r.fi)}${flagText(r.key)} | ${esc(r.en)} |`),
];

const sections = reviewSections();
const all = sections.flatMap((s) => s.rows);
const approved = all.filter((r) => vetted.has(r.key)).length;
const checkedInWiktionary = all.filter((r) => !vetted.has(r.key) && inWiktionary(r)).length;
const flagged = all.filter((r) => flags[r.key]).length;

// What's left to check, place by place, in course order — and in which sections.
const places = new Map<string, { place: ReviewPlace; total: number; left: number; where: Map<string, number> }>();
for (const s of sections) {
  for (const r of s.rows) {
    const p = places.get(String(r.where)) ?? { place: r.where, total: 0, left: 0, where: new Map<string, number>() };
    p.total++;
    if (!done(r)) {
      p.left++;
      p.where.set(s.title, (p.where.get(s.title) ?? 0) + 1);
    }
    places.set(String(r.where), p);
  }
}
const placeName = (p: ReviewPlace) =>
  typeof p === 'number' ? `${placeLabel(p)}: ${PATH[p - 1].titleEn} (*${PATH[p - 1].titleFi}*)` : placeLabel(p);
const startHere = [
  '## Start here',
  '',
  'In the order the children meet it: the words on every screen first, then unit by unit. The kids start with',
  'the first units, so check those first. The app (Grown-ups → Finnish check) lists entries in this same order,',
  'and its **Where** menu shows one unit at a time.',
  '',
  '| Where | Entries | Left to check | In |',
  '| --- | --- | --- | --- |',
  ...[...places.values()]
    .sort((a, b) => placeRank(a.place) - placeRank(b.place))
    .map((p) => `| ${placeName(p.place)} | ${p.total} | ${p.left} | ${[...p.where].map(([t, n]) => `${t} ${n}`).join(', ')} |`),
  '',
];

const lines: string[] = [
  '# Finnish content review sheet',
  '',
  `- Generated: ${new Date().toISOString()} · regenerate with \`npm run review:content\``,
  '- ⚠️ = awaiting native review · ✅ = approved · 📖 = checked against Wiktionary · 🚩 = flagged by the reviewer (their note follows the Finnish).',
  '- Approve here by adding a **Key** to `data/finnish-vetted.json`, or in the app (Grown-ups → Finnish check),',
  '  then `npm run review:import <downloaded review>.json`.',
  `- **Approved: ${approved} of ${all.length} entries. Checked against Wiktionary: ${checkedInWiktionary}. Left for the native reviewer: ${all.length - approved - checkedInWiktionary}.** Flagged: ${flagged}.`,
  '- 📖 entries are short enough for a dictionary to settle — a word, a form, a letter name, a short label or pattern',
  '  whose every word is a Wiktionary form in the grammar used. The evidence for each is in',
  '  `data/finnish-wiktionary-checked.json`; 📝 notes say why a dictionary couldn\x27t settle an entry. A native reviewer\x27s',
  '  ✓ or ✎ always wins.',
  '- The exhaustive carrier × word and template × candidate expansions are in',
  '  `docs/SENTENCE_AUDIT.md` (`npm run audit:sentences`); this sheet reviews the authored text itself.',
  '',
  ...startHere,
  ...sections.flatMap((s) => [`## ${s.title} (${s.rows.length})`, '', `_${s.hint}_`, '', ...table(s.rows), '']),
];

const out = join(root, 'docs', 'FINNISH_REVIEW.md');
writeFileSync(out, lines.join('\n'));
console.log(
  `Wrote ${out}: ${all.length} entries (${approved} approved, ${checkedInWiktionary} checked against Wiktionary, ${flagged} flagged, ${all.length - approved - checkedInWiktionary} awaiting review).`,
);

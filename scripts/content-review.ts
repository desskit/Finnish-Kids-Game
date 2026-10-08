// Generates docs/FINNISH_REVIEW.md: EVERY piece of hand-authored Finnish in the
// game, as one proofing sheet for the native reviewer — the vetting workflow
// that replaces the scattered "⚠️ NEEDS NATIVE FINNISH VETTING" code comments.
//
// The entries come from src/content/reviewEntries.ts — the SAME list the
// grown-ups' in-app "Finnish check" screen shows, under the same stable keys.
// A reviewer approves entries either here (add the Key to
// data/finnish-vetted.json) or in the app (then `npm run review:import
// <downloaded file>` merges the approvals into that ledger). Approved entries
// show ✅; entries a reviewer flagged (data/finnish-flags.json) show 🚩 with
// their note.
//
// Run: npm run review:content  (vite-node — imports the real TS content)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { reviewSections, type ReviewEntry } from '../src/content/reviewEntries';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const vettedFile = JSON.parse(readFileSync(join(root, 'data', 'finnish-vetted.json'), 'utf8')) as {
  vetted: string[];
};
const vetted = new Set(vettedFile.vetted);
const flagsPath = join(root, 'data', 'finnish-flags.json');
const flags: Record<string, { note?: string; suggestion?: string }> = existsSync(flagsPath)
  ? (JSON.parse(readFileSync(flagsPath, 'utf8')) as { flags: Record<string, { note?: string; suggestion?: string }> }).flags
  : {};

const status = (key: string) => (flags[key] ? '🚩' : vetted.has(key) ? '✅' : '⚠️');
const esc = (s: string) => s.replace(/\|/g, '\\|');
const flagText = (key: string) => {
  const f = flags[key];
  if (!f) return '';
  return ` 🚩 ${esc([f.note, f.suggestion && `→ ${f.suggestion}`].filter(Boolean).join(' '))}`;
};
const table = (rows: ReviewEntry[]) => [
  '| Status | Key | Finnish | English |',
  '| --- | --- | --- | --- |',
  ...rows.map((r) => `| ${status(r.key)} | \`${r.key}\` | ${esc(r.fi)}${flagText(r.key)} | ${esc(r.en)} |`),
];

const sections = reviewSections();
const all = sections.flatMap((s) => s.rows);
const approved = all.filter((r) => vetted.has(r.key)).length;
const flagged = all.filter((r) => flags[r.key]).length;

const lines: string[] = [
  '# Finnish content review sheet',
  '',
  `- Generated: ${new Date().toISOString()} · regenerate with \`npm run review:content\``,
  '- ⚠️ = awaiting native review · ✅ = approved · 🚩 = flagged by the reviewer (their note follows the Finnish).',
  '- Approve here by adding a **Key** to `data/finnish-vetted.json`, or in the app (Grown-ups → Finnish check),',
  '  then `npm run review:import <downloaded review>.json`.',
  `- **Approved: ${approved} of ${all.length} entries.** Flagged: ${flagged}.`,
  '- The exhaustive carrier × word and template × candidate expansions are in',
  '  `docs/SENTENCE_AUDIT.md` (`npm run audit:sentences`); this sheet reviews the authored text itself.',
  '',
  ...sections.flatMap((s) => [`## ${s.title} (${s.rows.length})`, '', `_${s.hint}_`, '', ...table(s.rows), '']),
];

const out = join(root, 'docs', 'FINNISH_REVIEW.md');
writeFileSync(out, lines.join('\n'));
console.log(`Wrote ${out}: ${all.length} entries (${approved} approved, ${flagged} flagged, ${all.length - approved} awaiting review).`);

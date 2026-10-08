// Folds a native reviewer's in-app "Finnish check" (the file they downloaded
// from Grown-ups → Finnish check) into the reviewer's ledger:
//   - ✓ entries whose Finnish still reads exactly as reviewed → added to
//     data/finnish-vetted.json (the ledger the app and the sheet show as ✅);
//   - ✎ entries → removed from the ledger and written, with the note and
//     suggested fix, to data/finnish-flags.json (shown as 🚩 in the sheet);
//   - entries whose Finnish changed since they were reviewed are skipped and
//     listed (they need a fresh look).
//
// Run: npm run review:import path/to/finnish-review-2026-10-08.json
//      then: npm run review:content
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { reviewEntries } from '../src/game/reviewEntries';
import { applyReviewToLedger, parseReviewFile, type LedgerUpdate } from '../src/game/review';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = process.argv[2];
if (!path) {
  console.error('Usage: npm run review:import <finnish-review.json>');
  process.exit(1);
}
const file = parseReviewFile(readFileSync(path, 'utf8'));
if (!file) {
  console.error(`${path} is not a Finnish review file from this app.`);
  process.exit(1);
}

const vettedPath = join(root, 'data', 'finnish-vetted.json');
const flagsPath = join(root, 'data', 'finnish-flags.json');
const vettedFile = JSON.parse(readFileSync(vettedPath, 'utf8')) as { _readme?: string; vetted: string[] };
const flagsFile: { _readme?: string; flags: LedgerUpdate['flags'] } = existsSync(flagsPath)
  ? JSON.parse(readFileSync(flagsPath, 'utf8'))
  : { flags: {} };

const before = new Set(vettedFile.vetted);
const update = applyReviewToLedger(vettedFile.vetted, file, reviewEntries(), flagsFile.flags);

writeFileSync(vettedPath, JSON.stringify({ ...vettedFile, vetted: update.vetted }, null, 2) + '\n');
writeFileSync(
  flagsPath,
  JSON.stringify(
    {
      _readme:
        'Entries a native reviewer marked as needing a fix (Grown-ups → Finnish check), with their note and suggestion. Written by `npm run review:import`; shown as 🚩 in docs/FINNISH_REVIEW.md. Fix the content, then remove the entry (or have it re-reviewed).',
      flags: update.flags,
    },
    null,
    2,
  ) + '\n',
);

const added = update.vetted.filter((k) => !before.has(k)).length;
console.log(`Reviewer: ${file.reviewer ?? '(no name)'} · ${file.decisions.length} decisions`);
console.log(`  ✓ ${added} newly approved (ledger now ${update.vetted.length})`);
console.log(`  ✎ ${Object.keys(update.flags).length} flagged in data/finnish-flags.json`);
if (update.stale.length) console.log(`  ↻ skipped ${update.stale.length} changed since review: ${update.stale.join(', ')}`);
if (update.unknown.length) console.log(`  ? ${update.unknown.length} keys no longer exist: ${update.unknown.join(', ')}`);
console.log('Now run: npm run review:content');

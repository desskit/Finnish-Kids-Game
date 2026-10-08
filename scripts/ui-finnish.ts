// Generates data/ui-finnish.json: the Finnish written into the app's screens
// (button labels, game titles, prompts — "Jatka", "Mitä kuulit?"), pulled out
// of the component sources by src/test/uiFinnish.ts. The native review lists
// them (Grown-ups → Finnish check, docs/FINNISH_REVIEW.md), and a test fails
// if this file falls out of date.
//
// Run: npm run review:content  (runs this first, then the review sheet)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { UI_FINNISH_README, extractUiFinnish } from '../src/test/uiFinnish';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const labels = extractUiFinnish();
const out = join(root, 'data', 'ui-finnish.json');
writeFileSync(out, JSON.stringify({ _readme: UI_FINNISH_README, labels }, null, 2) + '\n');
console.log(`Wrote ${out}: ${labels.length} labels.`);

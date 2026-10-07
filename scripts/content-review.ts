// Generates docs/FINNISH_REVIEW.md: EVERY piece of hand-authored Finnish in the
// game, as one proofing sheet for the native reviewer — the vetting workflow
// that replaces the scattered "⚠️ NEEDS NATIVE FINNISH VETTING" code comments.
//
// Each entry has a stable Key. The reviewer approves an entry by adding its Key
// to data/finnish-vetted.json (their ledger; the build never reads it) and
// re-running this export — approved entries then show ✅ instead of ⚠️.
//
// Covers the authored registries: dialogues, small-talk scenes, stories, the
// carrier phrases' fixed texts, the sentence templates, and the Finnish
// snippets quoted inside lesson prose (lessons' worked examples are lookups of
// these same vetted sources, so only the prose snippets are new text). The exhaustive
// carrier × word and template × candidate EXPANSIONS live in
// docs/SENTENCE_AUDIT.md (npm run audit:sentences) — this sheet reviews the
// authored text itself, that one reviews every machine-assembled pairing.
//
// Run: npm run review:content  (vite-node — imports the real TS content)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { dialogues } from '../src/content/dialogues';
import { conversations } from '../src/content/conversations';
import { stories } from '../src/content/stories';
import { nounConstructions } from '../src/content/constructions';
import { sentenceConstructions } from '../src/content/sentences';
import { lessons } from '../src/content/lessons';
import { YOU_QUESTION } from '../src/content/questions';
import { PRONOUNS, PRONOUN_FRAMES } from '../src/content/pronouns';
import { ALPHABET } from '../src/content/alphabet';
import {
  animals,
  food,
  family,
  places,
  body,
  nature,
  clothes,
  school,
  freetime,
  verbs,
} from '../src/content';
import { formFor, sentenceFor, suitsSlot } from '../src/content/types';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const vettedFile = JSON.parse(readFileSync(join(root, 'data', 'finnish-vetted.json'), 'utf8')) as {
  vetted: string[];
};
const vetted = new Set(vettedFile.vetted);

interface Row {
  key: string;
  fi: string;
  en: string;
}

const status = (key: string) => (vetted.has(key) ? '✅' : '⚠️');
const esc = (s: string) => s.replace(/\|/g, '\\|');
const table = (rows: Row[]) => [
  '| Status | Key | Finnish | English |',
  '| --- | --- | --- | --- |',
  ...rows.map((r) => `| ${status(r.key)} | \`${r.key}\` | ${esc(r.fi)} | ${esc(r.en)} |`),
];

// --- Collect every authored entry, in stable registry order ----------------

const dialogueRows: Row[] = dialogues.map((d) => ({
  key: `dialogue:${d.id}`,
  fi: `${d.prompt.fi} → ${d.reply.fi}`,
  en: `${d.prompt.en} → ${d.reply.en}`,
}));

const conversationRows: Row[] = conversations.flatMap((c) =>
  c.turns.map((t, i) => ({
    key: `conversation:${c.id}:${i + 1}`,
    fi: `${t.partner.fi} → ${t.reply.fi}`,
    en: `${t.partner.en} → ${t.reply.en}`,
  })),
);

const storyRows: Row[] = stories.flatMap((s) => [
  ...s.pages.map((p, i) => ({
    key: `story:${s.id}:page-${i + 1}`,
    fi: p.fi,
    en: p.en,
  })),
  ...s.questions.map((q, i) => ({
    key: `story:${s.id}:q${i + 1}`,
    fi: `${q.promptFi} (${q.options.map((o) => o.fi).join(' / ')})`,
    en: `${q.promptEn} (${q.options.map((o) => o.en).join(' / ')})`,
  })),
]);

// One deterministic example fill per carrier: the first suitable word by id.
const ALL_NOUNS = [
  ...animals.items,
  ...food.items,
  ...family.items,
  ...places.items,
  ...body.items,
  ...nature.items,
  ...clothes.items,
  ...school.items,
  ...freetime.items,
  ...verbs.items,
].sort((a, b) => (a.id < b.id ? -1 : 1));

const carrierRows: Row[] = nounConstructions.map((con) => {
  const sampleItem = ALL_NOUNS.find((i) => formFor(i, con) && suitsSlot(i, con));
  const skeleton = [con.before, '___', con.after].filter(Boolean).join(' ') + (con.punct ?? '');
  const sample = sampleItem ? ` — e.g. ${sentenceFor(sampleItem, con)}` : '';
  return { key: `carrier:${con.id}`, fi: `${skeleton}${sample}`, en: con.en };
});

// Hand-authored grammar tables (not in the sourced data): question forms and
// the pronoun paradigm. One row each, so a reviewer can approve them line by line.
const questionRows: Row[] = verbs.items.map((v) => ({
  key: `question:${v.id}`,
  fi: `${YOU_QUESTION[v.id]}?`,
  en: `Do you ${v.en}?`,
}));
const pronounRows: Row[] = [
  ...Object.entries(PRONOUNS).map(([person, f]) => ({
    key: `pronoun:${person}`,
    fi: [f.nominative, f.partitive, f.accusative, f.allative, f.elative, f.adessive, f.genitive].join(', '),
    en: `${f.enObject} — nom, part, acc, all, ela, ade, gen`,
  })),
  ...PRONOUN_FRAMES.map((fr) => ({ key: `pronoun-frame:${fr.id}`, fi: `${fr.before} ___${fr.punct}`, en: fr.en })),
];

const letterRows: Row[] = ALPHABET.map((l) => ({
  key: `letter:${l.ch}`,
  fi: `${l.ch.toUpperCase()}${l.ch} — "${l.nameFi}"`,
  en: l.tip,
}));

const templateRows: Row[] = sentenceConstructions.map((t) => ({
  key: `template:${t.id}`,
  fi: t.tokens
    .map((tok) => ('fixed' in tok && tok.fixed ? tok.fixed : `⟨${'slot' in tok ? tok.slot : '?'}⟩`))
    .join(' '),
  en: t.en,
}));

// Finnish quoted in lesson prose (*like this*), one row per card that has any.
const fiSnippets = (text: string) => [...text.matchAll(/(?<!\*)\*([^*]+)\*(?!\*)/g)].map((m) => m[1]);
const lessonRows: Row[] = lessons.flatMap((l) =>
  l.cards.flatMap((c, i) => {
    const prose = [
      'text' in c ? (c.text ?? '') : '',
      c.kind === 'check' ? `${c.question}\n${c.explain}` : '',
    ].join('\n');
    const snippets = [...new Set(fiSnippets(prose))];
    if (snippets.length === 0) return [];
    return [
      {
        key: `lesson:${l.id}:${i + 1}`,
        fi: snippets.join(' · '),
        en: `${l.titleEn} — ${c.title ?? c.kind}`,
      },
    ];
  }),
);

// Any distractor line that never appears as a reply elsewhere would slip
// through the exchange rows above — collect the distinct ones for completeness.
const knownFi = new Set(
  [...dialogueRows, ...conversationRows].flatMap((r) => r.fi.split(' → ')),
);
const strayLines = new Map<string, string>();
for (const d of dialogues) {
  for (const line of d.distractors) if (!knownFi.has(line.fi)) strayLines.set(line.fi, line.en);
}
for (const c of conversations) {
  for (const t of c.turns) {
    for (const line of t.distractors) if (!knownFi.has(line.fi)) strayLines.set(line.fi, line.en);
  }
}
const strayRows: Row[] = [...strayLines.entries()]
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([fi, en], i) => ({ key: `line:${i + 1}-${fi.toLowerCase().replace(/[^a-zäöå]+/g, '-').slice(0, 24)}`, fi, en }));

// --- Emit -------------------------------------------------------------------

const all = [
  ...dialogueRows,
  ...conversationRows,
  ...storyRows,
  ...carrierRows,
  ...templateRows,
  ...questionRows,
  ...pronounRows,
  ...letterRows,
  ...lessonRows,
  ...strayRows,
];
const approved = all.filter((r) => vetted.has(r.key)).length;

const lines: string[] = [
  '# Finnish content review sheet',
  '',
  `- Generated: ${new Date().toISOString()} · regenerate with \`npm run review:content\``,
  '- ⚠️ = awaiting native review · ✅ = approved. To approve an entry, add its **Key** to',
  '  `data/finnish-vetted.json` and re-run the export.',
  `- **Approved: ${approved} of ${all.length} entries.**`,
  '- The exhaustive carrier × word and template × candidate expansions are in',
  '  `docs/SENTENCE_AUDIT.md` (`npm run audit:sentences`); this sheet reviews the authored text itself.',
  '',
  `## Greetings & dialogues (${dialogueRows.length})`,
  '',
  ...table(dialogueRows),
  '',
  `## Small-talk scenes, turn by turn (${conversationRows.length})`,
  '',
  ...table(conversationRows),
  '',
  `## Stories (${storyRows.length})`,
  '',
  ...table(storyRows),
  '',
  `## Carrier phrases — authored fixed texts (${carrierRows.length})`,
  '',
  ...table(carrierRows),
  '',
  `## Sentence templates — authored skeletons (${templateRows.length})`,
  '',
  ...table(templateRows),
  '',
  `## Question forms — "do you…?" (${questionRows.length})`,
  '',
  ...table(questionRows),
  '',
  `## Pronoun forms and frames (${pronounRows.length})`,
  '',
  ...table(pronounRows),
  '',
  `## Alphabet — letter names and sound tips (${letterRows.length})`,
  '',
  ...table(letterRows),
  '',
  `## Lesson prose — Finnish quoted in the explanations (${lessonRows.length})`,
  '',
  ...table(lessonRows),
  '',
  `## Other authored lines (distractor-only) (${strayRows.length})`,
  '',
  ...table(strayRows),
  '',
];

const out = join(root, 'docs', 'FINNISH_REVIEW.md');
writeFileSync(out, lines.join('\n'));
console.log(
  `Wrote ${out}: ${all.length} entries (${approved} approved, ${all.length - approved} awaiting review).`,
);

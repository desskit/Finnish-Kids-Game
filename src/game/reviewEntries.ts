// Every piece of hand-authored Finnish in the game, as one list for the
// native reviewer — shared by the proofing sheet (scripts/content-review.ts →
// docs/FINNISH_REVIEW.md) and the grown-ups' in-app "Finnish check" screen, so
// both show the same entries under the same stable keys.
//
// Covers the authored registries: dialogues, scenes, stories, the carrier
// phrases' fixed texts AND the forms each carrier marks as wrong ("slips"),
// sentence templates, comparison / date patterns, the hand-authored ordinals,
// question forms, pronoun forms and frames, the alphabet, and the Finnish quoted
// in lesson prose. (Machine-assembled pairings live in docs/SENTENCE_AUDIT.md.)

import { dialogues } from './dialogues';
import { conversations } from './conversations';
import { stories } from './stories';
import { nounConstructions } from './constructions';
import { sentenceConstructions } from './sentences';
import { lessons } from './lessons';
import { YOU_QUESTION } from './questions';
import { PRONOUNS, PRONOUN_FRAMES } from './pronouns';
import { ALPHABET } from './alphabet';
import { comparisonSentence, superlativeSentence, whichIsMost, whichOfTwo } from './compare';
import { BIRTHDAY_FRAME, ageSentence, dateFi } from './dates';
import { HIGHER_ORDINALS } from './higherOrdinals';
import { itemById } from './lookup';
import { slipForms } from './contrasts';
import { animals, food, family, places, body, nature, clothes, school, freetime, verbs } from '.';
import { formFor, sentenceFor, suitsSlot } from './types';

export interface ReviewEntry {
  /** Stable key — what the reviewer's ledger (data/finnish-vetted.json) lists. */
  key: string;
  fi: string;
  en: string;
}

export interface ReviewSection {
  id: string;
  title: string;
  /** One line on what to look for. */
  hint: string;
  rows: ReviewEntry[];
}

function collect(): ReviewSection[] {
  const dialogueRows: ReviewEntry[] = dialogues.map((d) => ({
    key: `dialogue:${d.id}`,
    fi: `${d.prompt.fi} → ${d.reply.fi}`,
    en: `${d.prompt.en} → ${d.reply.en}`,
  }));

  const conversationRows: ReviewEntry[] = conversations.flatMap((c) =>
    c.turns.map((t, i) => ({
      key: `conversation:${c.id}:${i + 1}`,
      fi: `${t.partner.fi} → ${t.reply.fi}`,
      en: `${t.partner.en} → ${t.reply.en}`,
    })),
  );

  const storyRows: ReviewEntry[] = stories.flatMap((s) => [
    ...s.pages.map((p, i) => ({ key: `story:${s.id}:page-${i + 1}`, fi: p.fi, en: p.en })),
    ...s.questions.map((q, i) => ({
      key: `story:${s.id}:q${i + 1}`,
      fi: `${q.promptFi} (${q.options.map((o) => o.fi).join(' / ')})`,
      en: `${q.promptEn} (${q.options.map((o) => o.en).join(' / ')})`,
    })),
  ]);

  // One deterministic example fill per carrier: the first suitable word by id.
  const ALL = [...animals.items, ...food.items, ...family.items, ...places.items, ...body.items, ...nature.items, ...clothes.items, ...school.items, ...freetime.items, ...verbs.items].sort(
    (a, b) => (a.id < b.id ? -1 : 1),
  );
  type Con = (typeof nounConstructions)[number];
  const sampleFor = (con: Con) => ALL.find((i) => formFor(i, con) && suitsSlot(i, con));
  const slipSampleFor = (con: Con) =>
    ALL.find((i) => formFor(i, con) && suitsSlot(i, con) && slipForms(i, con).length > 0);

  const carrierRows: ReviewEntry[] = nounConstructions.map((con) => {
    const item = sampleFor(con);
    const skeleton = [con.before, '___', con.after].filter(Boolean).join(' ') + (con.punct ?? '');
    return { key: `carrier:${con.id}`, fi: `${skeleton}${item ? ` — e.g. ${sentenceFor(item, con)}` : ''}`, en: con.en };
  });

  // The forms each carrier marks WRONG (pick-the-ending, Review, Find the
  // mistake). A native should flag any that would actually be fine here.
  const slipRows: ReviewEntry[] = nounConstructions.flatMap((con) => {
    const item = slipSampleFor(con);
    const slips = item ? slipForms(item, con) : [];
    if (!item || slips.length === 0) return [];
    return [
      {
        key: `slip:${con.id}`,
        fi: `${sentenceFor(item, con)} ✓ — marked wrong: ${slips.join(', ')}`,
        en: `${con.en} (the other forms must NOT fit this meaning)`,
      },
    ];
  });

  const questionRows: ReviewEntry[] = verbs.items.map((v) => ({
    key: `question:${v.id}`,
    fi: `${YOU_QUESTION[v.id]}?`,
    en: `Do you ${v.en}?`,
  }));

  const pronounRows: ReviewEntry[] = [
    ...Object.entries(PRONOUNS).map(([person, f]) => ({
      key: `pronoun:${person}`,
      fi: [f.nominative, f.partitive, f.accusative, f.allative, f.elative, f.adessive, f.genitive].join(', '),
      en: `${f.enObject} — nom, part, acc, all, ela, ade, gen`,
    })),
    ...PRONOUN_FRAMES.map((fr) => ({ key: `pronoun-frame:${fr.id}`, fi: `${fr.before} ___${fr.punct}`, en: fr.en })),
  ];

  const letterRows: ReviewEntry[] = ALPHABET.map((l) => ({
    key: `letter:${l.ch}`,
    fi: `${l.ch.toUpperCase()}${l.ch} — "${l.nameFi}"`,
    en: l.tip,
  }));

  const w = (id: string) => itemById(id)!;
  const patternRows: ReviewEntry[] = [
    { key: 'pattern:compare', fi: `${comparisonSentence(w('big'), w('elephant'), w('mouse'))} (X on ⟨-mpi⟩ kuin Y)`, en: 'The elephant is bigger than the mouse.' },
    { key: 'pattern:superlative', fi: `${superlativeSentence(w('big'), w('elephant'))} (X on ⟨-in⟩)`, en: 'The elephant is the biggest.' },
    { key: 'pattern:which-of-two', fi: whichOfTwo(w('big'))!, en: 'Which one is bigger?' },
    { key: 'pattern:which-most', fi: `${whichIsMost(w('big'), false)} / ${whichIsMost(w('old'), true)}`, en: 'Which one is the biggest? / Who is the oldest?' },
    { key: 'pattern:date', fi: `${dateFi(w('fifth'), w('may'))} (⟨ordinal⟩ ⟨month-partitive⟩)`, en: 'the 5th of May' },
    { key: 'pattern:birthday-date', fi: `${BIRTHDAY_FRAME.before} ${dateFi(w('fifth'), w('may'))}.`, en: `${BIRTHDAY_FRAME.en} May 5th.` },
    { key: 'pattern:age', fi: ageSentence(w('eight'))!, en: "I'm 8 years old." },
  ];

  const ordinalRows: ReviewEntry[] = HIGHER_ORDINALS.map((o) => ({
    key: `ordinal:${o.id}`,
    fi: o.fi,
    en: `${o.en} (${o.value}.)`,
  }));

  const templateRows: ReviewEntry[] = sentenceConstructions.map((t) => ({
    key: `template:${t.id}`,
    fi: t.tokens.map((tok) => ('fixed' in tok && tok.fixed ? tok.fixed : `⟨${'slot' in tok ? tok.slot : '?'}⟩`)).join(' '),
    en: t.en,
  }));

  // Finnish quoted in lesson prose (*like this*), one row per card that has any.
  const fiSnippets = (text: string) => [...text.matchAll(/(?<!\*)\*([^*]+)\*(?!\*)/g)].map((m) => m[1]);
  const lessonRows: ReviewEntry[] = lessons.flatMap((l) =>
    l.cards.flatMap((c, i) => {
      const prose = ['text' in c ? (c.text ?? '') : '', c.kind === 'check' ? `${c.question}\n${c.explain}` : ''].join('\n');
      const snippets = [...new Set(fiSnippets(prose))];
      if (snippets.length === 0) return [];
      return [{ key: `lesson:${l.id}:${i + 1}`, fi: snippets.join(' · '), en: `${l.titleEn} — ${c.title ?? c.kind}` }];
    }),
  );

  // Distractor lines that never appear as a reply elsewhere.
  const knownFi = new Set([...dialogueRows, ...conversationRows].flatMap((r) => r.fi.split(' → ')));
  const strayLines = new Map<string, string>();
  for (const d of dialogues) for (const line of d.distractors) if (!knownFi.has(line.fi)) strayLines.set(line.fi, line.en);
  for (const c of conversations) {
    for (const t of c.turns) for (const line of t.distractors) if (!knownFi.has(line.fi)) strayLines.set(line.fi, line.en);
  }
  const strayRows: ReviewEntry[] = [...strayLines.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([fi, en], i) => ({ key: `line:${i + 1}-${fi.toLowerCase().replace(/[^a-zäöå]+/g, '-').slice(0, 24)}`, fi, en }));

  return [
    { id: 'dialogues', title: 'Greetings & dialogues', hint: 'A line someone says → the reply.', rows: dialogueRows },
    { id: 'conversations', title: 'Scenes, turn by turn', hint: 'Each turn of a short conversation.', rows: conversationRows },
    { id: 'stories', title: 'Stories', hint: 'Story pages, then each question with its options.', rows: storyRows },
    { id: 'carriers', title: 'Sentence patterns', hint: 'The fixed words around the slot, with one example.', rows: carrierRows },
    { id: 'slips', title: 'Forms marked wrong', hint: 'Flag any "wrong" form that is actually fine Finnish for this meaning.', rows: slipRows },
    { id: 'templates', title: 'Sentence templates', hint: 'Longer sentence skeletons.', rows: templateRows },
    { id: 'patterns', title: 'Comparisons & dates', hint: 'Sourced words joined by authored glue.', rows: patternRows },
    { id: 'ordinals', title: 'Ordinals 11th–31st', hint: 'Hand-written words (the source stops at the 10th).', rows: ordinalRows },
    { id: 'questions', title: '"Do you…?" questions', hint: 'One question form per verb.', rows: questionRows },
    { id: 'pronouns', title: 'Pronoun forms & frames', hint: 'minä, minua, minulle…', rows: pronounRows },
    { id: 'letters', title: 'Alphabet', hint: 'Letter names and sound tips.', rows: letterRows },
    { id: 'lessons', title: 'Finnish in the lessons', hint: 'Words quoted in the explanations.', rows: lessonRows },
    { id: 'lines', title: 'Other lines (wrong replies)', hint: 'Lines only offered as wrong answers.', rows: strayRows },
  ];
}

let cached: ReviewSection[] | null = null;

/** Every reviewable entry, by section, in stable order. */
export function reviewSections(): ReviewSection[] {
  if (!cached) cached = collect();
  return cached;
}

/** Every entry, flat. */
export function reviewEntries(): (ReviewEntry & { section: string })[] {
  return reviewSections().flatMap((s) => s.rows.map((r) => ({ ...r, section: s.id })));
}

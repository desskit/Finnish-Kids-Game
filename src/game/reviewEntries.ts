// Every piece of hand-authored Finnish in the game, as one list for the
// native reviewer — shared by the proofing sheet (scripts/content-review.ts →
// docs/FINNISH_REVIEW.md) and the grown-ups' in-app "Finnish check" screen, so
// both show the same entries under the same stable keys.
//
// Covers the authored registries: dialogues, scenes, stories, the carrier
// phrases' fixed texts AND the forms each carrier marks as wrong ("slips"),
// sentence templates, comparison / date patterns, the hand-authored ordinals,
// question forms, pronoun forms and frames, the alphabet, the Finnish quoted
// in lesson prose, and the math section's problem frames (Lasketaan!: its
// stories, lessons and titles are placed under "Math") — plus what the child
// reads around them: unit, step, lesson
// and badge titles, and the screens' own labels ("Jatka", "Mitä kuulit?"),
// pulled from the components into data/ui-finnish.json (src/test/uiFinnish.ts).
// (Machine-assembled pairings live in docs/SENTENCE_AUDIT.md.)

import { dialogues } from '../content/dialogues';
import { conversations } from '../content/conversations';
import { CAST, stories } from '../content/stories';
import { nounConstructions } from '../content/constructions';
import { sentenceConstructions } from '../content/sentences';
import { lessons } from '../content/lessons';
import { YOU_QUESTION } from '../content/questions';
import { SPOKEN_FOR_LESSON, SPOKEN_PAIRS } from '../content/spoken';
import { PRONOUNS, PRONOUN_FRAMES } from '../content/pronouns';
import { ALPHABET } from '../content/alphabet';
import { comparisonSentence, superlativeSentence, whichIsMost, whichOfTwo } from '../content/compare';
import { BIRTHDAY_FRAME, ageSentence, dateFi } from '../content/dates';
import { HIGHER_ORDINALS } from '../content/higherOrdinals';
import { itemById } from '../content/lookup';
import { slipForms } from '../content/contrasts';
import { animals, food, family, places, body, nature, clothes, school, freetime, verbs } from '../content';
import { formFor, sentenceFor, suitsSlot } from '../content/types';
import uiFinnish from '../../data/ui-finnish.json';
import { PATH } from './path';
import { BADGES, BADGE_CATEGORIES } from './badges';
import { AUDIT_ENTRIES } from './audit';
import { MATH_STAGES, isMathId } from './mathPath';
import { numberEn, numberForm, numberWord, problemFor, wordProblemFor, type MathProblem, type MathSet } from './math';
import { LIFT_OFF, MISSING, WORD_FRAMES, compareFrame, neighborFrame, sumFrame } from '../content/mathProblems';

/**
 * Where a child first meets an entry, so a reviewer can check the course in
 * the order the children play it: a unit (its number on the course map), the
 * screens all around the games ("everywhere": buttons, badges, the alphabet),
 * the optional math section, only the grown-ups' section, or nowhere yet
 * (written, but no game shows it).
 */
/** A problem of one kind (its key's prefix) from a set, drawn the same way every time. */
function sampleProblem(set: MathSet, prefix: string): MathProblem {
  let seed = 7;
  const rng = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 500; i++) {
    const p = problemFor(set, { optionCount: 3, rng });
    if (p.key.startsWith(prefix)) return p;
  }
  throw new Error(`No ${prefix} problem in ${set}`);
}

export type ReviewPlace = number | 'everywhere' | 'math' | 'grown-ups' | 'not-yet';

export interface ReviewEntry {
  /** Stable key — what the reviewer's ledger (data/finnish-vetted.json) lists. */
  key: string;
  fi: string;
  en: string;
  where: ReviewPlace;
}

export interface ReviewSection {
  id: string;
  title: string;
  /** One line on what to look for. */
  hint: string;
  rows: ReviewEntry[];
}

/** Course order: the screens first, then unit by unit, then the math section, then what no game shows yet, then the grown-ups' own. */
export function placeRank(place: ReviewPlace): number {
  if (typeof place === 'number') return place;
  return { everywhere: 0, math: 900, 'not-yet': 1000, 'grown-ups': 1001 }[place];
}

/** "Unit 3", "Everywhere"… */
export function placeLabel(place: ReviewPlace): string {
  if (typeof place === 'number') return `Unit ${place}`;
  return { everywhere: 'Everywhere', math: 'Math (Lasketaan!)', 'not-yet': 'Not in the course yet', 'grown-ups': 'Grown-ups only' }[place];
}

/** The earliest of some places, in course order. */
const earliest = (places: ReviewPlace[]): ReviewPlace | undefined =>
  [...places].sort((a, b) => placeRank(a) - placeRank(b))[0];

// The screens only a grown-up opens; a label found only in these is "grown-ups only".
const GROWN_UP_SCREENS = new Set(
  ['FinnishReview', 'GrownUp', 'Settings', 'StatsView', 'ProgressView', 'AuditView', 'ParentGate'].map((c) => `components/${c}.tsx`),
);

// The game each comparison and date pattern is played in.
const PATTERN_GAME: Record<string, string> = {
  compare: 'choose:compare',
  'which-of-two': 'choose:compare',
  superlative: 'choose:superlative',
  'which-most': 'choose:superlative',
  date: 'choose:date',
  'birthday-date': 'choose:date',
  age: 'choose:age',
};

/** Where each thing first turns up in the course: its lessons, steps, games and words. */
function courseMap() {
  const firstAt = new Map<string, number>();
  // PATH is in course order, so the first unit to list a thing is where it's met
  const meet = (what: string, unit: number) => {
    if (!firstAt.has(what)) firstAt.set(what, unit);
  };
  PATH.forEach((unit, i) => {
    const n = i + 1;
    meet(`lesson:${unit.lessonId}`, n);
    for (const m of unit.midLessons ?? []) meet(`lesson:${m.lessonId}`, n);
    for (const step of unit.skills) {
      const c = step.content;
      // a dialogue, scene or story step lists its ids; the expert band's plays every one
      if (step.activity === 'dialogue' || step.activity === 'conversation' || step.activity === 'story') {
        for (const id of c.ids ?? ['*']) meet(`${step.activity}:${id}`, n);
      }
      for (const id of c.constructionIds ?? []) meet(`carrier:${id}`, n);
      if (c.choose) meet(`choose:${c.choose}`, n);
      for (const kind of [step.activity, ...(step.activities ?? [])]) meet(`activity:${kind}`, n);
      for (const id of c.wordIds ?? []) meet(`word:${id}`, n);
    }
  });
  const at = (what: string | undefined): ReviewPlace => (what && firstAt.get(what)) || 'not-yet';
  // "Syötkö?" is asked only of the verbs known by the asking unit
  const askedFrom = PATH.flatMap((unit, i) =>
    unit.skills
      .filter((step) => step.content.choose === 'ask' || step.content.choose === 'answer')
      .map((step) => ({ unit: i + 1, verbs: new Set(step.content.wordIds ?? []) })),
  );

  /** Where an entry is first met, from its key (undefined: a kind of key this doesn't know). */
  return (key: string): ReviewPlace | undefined => {
    const [kind, id] = key.split(':');
    // the math section's own stories and lessons, and its frames
    if (kind === 'math' || ((kind === 'story' || kind === 'lesson') && id && isMathId(id))) return 'math';
    switch (kind) {
      case 'dialogue':
      case 'conversation':
      case 'story':
        return firstAt.get(`${kind}:${id}`) ?? at(`${kind}:*`);
      case 'carrier':
      case 'slip':
        return at(`carrier:${id}`);
      case 'template':
        return at('activity:sentence');
      case 'question':
        return askedFrom.find((a) => a.verbs.has(id))?.unit ?? 'not-yet';
      case 'pronoun':
      case 'pronoun-frame':
        return at('choose:pronoun');
      case 'ordinal':
        return firstAt.get(`word:${id}`) ?? at('choose:date');
      case 'pattern':
        return at(PATTERN_GAME[id]);
      case 'letter':
        return 'everywhere';
      case 'lesson':
        return at(`lesson:${id}`);
      default:
        return undefined;
    }
  };
}

type Row = Omit<ReviewEntry, 'where'> & { where?: ReviewPlace };

function collect(): ReviewSection[] {
  const placeOf = courseMap();
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

  // A page is its lines in order, each with who says it ("Aino: Hei!").
  const storyRows: Row[] = stories.flatMap((s) => [
    ...s.pages.map((p, i) => ({
      key: `story:${s.id}:page-${i + 1}`,
      fi: p.lines.map((l) => (l.by ? `${CAST[l.by].nameFi}: ` : '') + l.fi).join(' / '),
      en: p.lines.map((l) => (l.by ? `${CAST[l.by].nameEn}: ` : '') + l.en).join(' / '),
    })),
    ...s.questions.map((q, i) => ({
      key: `story:${s.id}:q${i + 1}`,
      fi: `${q.promptFi} (${q.options.map((o) => (o.correct ? `✓ ${o.fi}` : o.fi)).join(' / ')})`,
      en: `${q.promptEn} (${q.options.map((o) => o.en).join(' / ')})`,
    })),
    ...s.facts.map((f, i) => ({
      key: `story:${s.id}:t${i + 1}`,
      fi: `${f.fi} (${f.isTrue ? 'totta' : 'tarua'})`,
      en: `True or false: ${f.en} (${f.isTrue ? 'true' : 'false'})`,
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

  const carrierRows: Row[] = nounConstructions.map((con) => {
    const item = sampleFor(con);
    const skeleton = [con.before, '___', con.after].filter(Boolean).join(' ') + (con.punct ?? '');
    return { key: `carrier:${con.id}`, fi: `${skeleton}${item ? ` — e.g. ${sentenceFor(item, con)}` : ''}`, en: con.en };
  });

  // The forms each carrier marks WRONG (pick-the-ending, Review, Find the
  // mistake). A native should flag any that would actually be fine here.
  const slipRows: Row[] = nounConstructions.flatMap((con) => {
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

  const questionRows: Row[] = verbs.items.map((v) => ({
    key: `question:${v.id}`,
    fi: `${YOU_QUESTION[v.id]}?`,
    // "be" asks "Are you?", never "Do you be?"
    en: v.en === 'be' ? 'Are you?' : `Do you ${v.en}?`,
  }));

  const pronounRows: Row[] = [
    ...Object.entries(PRONOUNS).map(([person, f]) => ({
      key: `pronoun:${person}`,
      fi: [f.nominative, f.partitive, f.accusative, f.allative, f.elative, f.adessive, f.genitive].join(', '),
      en: `${f.enObject} — nom, part, acc, all, ela, ade, gen`,
    })),
    ...PRONOUN_FRAMES.map((fr) => ({ key: `pronoun-frame:${fr.id}`, fi: `${fr.before} ___${fr.punct}`, en: fr.en })),
  ];

  // Everyday spoken forms, shown to recognise (content/spoken.ts).
  // Met where the first lesson showing it is.
  const spokenWhere = (id: string): ReviewPlace => {
    const places = Object.entries(SPOKEN_FOR_LESSON)
      .filter(([, ids]) => ids.includes(id))
      .map(([lessonId]) => placeOf(`lesson:${lessonId}`))
      .filter((w): w is number => typeof w === 'number');
    return places.length > 0 ? Math.min(...places) : 'not-yet';
  };
  const spokenRows: Row[] = SPOKEN_PAIRS.map((p) => ({
    key: `spoken:${p.id}`,
    fi: `${p.written} → ${p.spoken}`,
    en: `${p.en} — written → spoken`,
    where: spokenWhere(p.id),
  }));

  const letterRows: Row[] = ALPHABET.map((l) => ({
    key: `letter:${l.ch}`,
    fi: `${l.ch.toUpperCase()}${l.ch} — "${l.nameFi}"`,
    en: l.tip,
  }));

  const w = (id: string) => itemById(id)!;
  const patternRows: Row[] = [
    { key: 'pattern:compare', fi: `${comparisonSentence(w('big'), w('elephant'), w('mouse'))} (X on ⟨-mpi⟩ kuin Y)`, en: 'The elephant is bigger than the mouse.' },
    { key: 'pattern:superlative', fi: `${superlativeSentence(w('big'), w('elephant'))} (X on ⟨-in⟩)`, en: 'The elephant is the biggest.' },
    { key: 'pattern:which-of-two', fi: whichOfTwo(w('big'))!, en: 'Which one is bigger?' },
    { key: 'pattern:which-most', fi: `${whichIsMost(w('big'), false)} / ${whichIsMost(w('old'), true)}`, en: 'Which one is the biggest? / Who is the oldest?' },
    { key: 'pattern:date', fi: `${dateFi(w('fifth'), w('may'))} (⟨ordinal⟩ ⟨month-partitive⟩)`, en: 'the 5th of May' },
    { key: 'pattern:birthday-date', fi: `${BIRTHDAY_FRAME.before} ${dateFi(w('fifth'), w('may'))}.`, en: `${BIRTHDAY_FRAME.en} May 5th.` },
    { key: 'pattern:age', fi: ageSentence(w('eight'))!, en: "I'm 8 years old." },
  ];

  const ordinalRows: Row[] = HIGHER_ORDINALS.map((o) => ({
    key: `ordinal:${o.id}`,
    fi: o.fi,
    en: `${o.en} (${o.value}.)`,
  }));

  const templateRows: Row[] = sentenceConstructions.map((t) => ({
    key: `template:${t.id}`,
    fi: t.tokens.map((tok) => ('fixed' in tok && tok.fixed ? tok.fixed : `⟨${'slot' in tok ? tok.slot : '?'}⟩`)).join(' '),
    en: t.en,
  }));

  // Finnish quoted in lesson prose (*like this*), one row per card that has any.
  const fiSnippets = (text: string) => [...text.matchAll(/(?<!\*)\*([^*]+)\*(?!\*)/g)].map((m) => m[1]);
  const lessonRows: Row[] = lessons.flatMap((l) =>
    l.cards.flatMap((c, i) => {
      const prose = ['text' in c ? (c.text ?? '') : '', c.kind === 'check' ? `${c.question}\n${c.explain}` : ''].join('\n');
      const snippets = [...new Set(fiSnippets(prose))];
      if (snippets.length === 0) return [];
      return [{ key: `lesson:${l.id}:${i + 1}`, fi: snippets.join(' · '), en: `${l.titleEn} — ${(c.title ?? c.kind).replace(/\*/g, '')}` }];
    }),
  );

  // The math section's problem frames, each with one example fill. The English
  // is for the reviewer only: the section itself never shows a word of it.
  const n = (v: number) => numberWord(v);
  const frame = (key: string, said: { ask: { fi: string; en: string }; tell: { fi: string; en: string } }): Row => ({
    key: `math:${key}`,
    fi: `${said.ask.fi} → ${said.tell.fi}`,
    en: `${said.ask.en} → ${said.tell.en}`,
  });
  const en3 = (a: number, b: number, c: number): [string, string, string] => [numberEn(a), numberEn(b), numberEn(c)];
  const mathRows: Row[] = [
    frame('plus', sumFrame('plus', n(3), n(2), n(5), en3(3, 2, 5))),
    frame('minus', sumFrame('minus', n(6), n(2), n(4), en3(6, 2, 4))),
    frame('more', compareFrame(true, n(3), n(5), n(5), en3(3, 5, 5))),
    frame('less', compareFrame(false, n(3), n(5), n(3), en3(3, 5, 3))),
    frame('after', neighborFrame(true, numberForm(5, 'genitive'), n(6), [numberEn(5), numberEn(6)])),
    frame('before', neighborFrame(false, numberForm(5, 'partitive'), n(4), [numberEn(5), numberEn(4)])),
    { key: 'math:missing', fi: MISSING.fi, en: MISSING.en },
    { key: 'math:lift-off', fi: LIFT_OFF.fi, en: LIFT_OFF.en },
    ...WORD_FRAMES.map((f) => {
      const p = wordProblemFor(f, w(f.edible ? 'apple' : 'ball'), 5, 2);
      return {
        key: `math:${f.id}`,
        fi: `${p.ask.map((x) => x.fi).join(' ')} → ${p.tell.fi}`,
        en: `${p.ask.map((x) => x.en).join(' ')} → ${p.tell.en}`,
      };
    }),
    // stages 5–8: one problem of each kind, the same every time (a seeded draw)
    ...(
      [
        ['times', 'times', 'times:'],
        ['half', 'halves', 'half:'],
        ['shop-total', 'shop-totals', 'total:'],
        ['shop-pay', 'shop-pay', 'pay:'],
        ['clock-later', 'clock-hour', 'clock:later'],
        ['clock-earlier', 'clock-hour', 'clock:earlier'],
        ['clock-half', 'clock-half', 'clock:half'],
      ] as [string, MathSet, string][]
    ).map(([key, set, prefix]) => {
      const p = sampleProblem(set, prefix);
      return {
        key: `math:${key}`,
        fi: `${p.ask.map((x) => x.fi).join(' ')} → ${p.tell.fi}`,
        en: `${p.ask.map((x) => x.en).join(' ')} → ${p.tell.en}`,
      };
    }),
  ];

  // Distractor lines that never appear as a reply elsewhere.
  const knownFi = new Set([...dialogueRows, ...conversationRows].flatMap((r) => r.fi.split(' → ')));
  const strayLines = new Map<string, string>();
  // …and where each is offered: it's met where its dialogue or scene first is
  const offeredIn = new Map<string, ReviewPlace[]>();
  const stray = (fi: string, en: string, from: string) => {
    if (knownFi.has(fi)) return;
    strayLines.set(fi, en);
    offeredIn.set(fi, [...(offeredIn.get(fi) ?? []), placeOf(from) ?? 'not-yet']);
  };
  for (const d of dialogues) for (const line of d.distractors) stray(line.fi, line.en, `dialogue:${d.id}`);
  for (const c of conversations) {
    for (const t of c.turns) for (const line of t.distractors) stray(line.fi, line.en, `conversation:${c.id}`);
  }
  // Keyed by the line itself, like the titles below: a key that counted its
  // place in the list moved whenever a line came or went, and the reviewer's
  // ticks were lost with it.
  const strayRows: Row[] = [...strayLines.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([fi, en]) => ({
      key: `line:${fi}`,
      fi,
      en,
      where: earliest(offeredIn.get(fi) ?? []),
    }));

  // What the child reads around the content: unit, step and lesson titles, the
  // examples under steps, badge and game names. One entry per distinct Finnish
  // text (every words step is "Uudet sanat"), keyed by the text itself — so a
  // changed title is a new entry to check.
  // The screens' own labels: on every screen, or only in the grown-ups' section.
  const labels = (uiFinnish as { labels: { fi: string; en: string; where: string[] }[] }).labels;
  const labelPlace = new Map<string, ReviewPlace>(
    labels.map((l) => [l.fi, l.where.every((file) => GROWN_UP_SCREENS.has(file)) ? 'grown-ups' : 'everywhere']),
  );
  const byText = (pairs: [string | undefined, string, ReviewPlace][]): Row[] => {
    const glosses = new Map<string, { ens: Set<string>; places: ReviewPlace[] }>();
    for (const [fi, en, place] of pairs) {
      if (!fi) continue;
      const g = glosses.get(fi) ?? { ens: new Set<string>(), places: [] };
      g.ens.add(en);
      g.places.push(place);
      glosses.set(fi, g);
    }
    return [...glosses]
      .sort(([a], [b]) => a.localeCompare(b, 'fi'))
      .map(([fi, g]) => {
        const label = labelPlace.get(fi);
        return { key: fi, fi, en: [...g.ens].join(' / '), where: earliest(label ? [...g.places, label] : g.places) };
      });
  };
  const titleRows = byText([
    ...PATH.flatMap((unit, i) => [
      [unit.titleFi, unit.titleEn, i + 1] as [string, string, ReviewPlace],
      ...unit.skills.flatMap((s): [string | undefined, string, ReviewPlace][] => [
        [s.titleFi, s.titleEn, i + 1],
        [s.exampleFi, `${s.titleEn} — example`, i + 1],
      ]),
    ]),
    ...lessons.map((l): [string, string, ReviewPlace] => [l.titleFi, l.titleEn, placeOf(`lesson:${l.id}`) ?? 'not-yet']),
    ...MATH_STAGES.flatMap((stage): [string, string, ReviewPlace][] => [
      [stage.titleFi, stage.titleEn, 'math'],
      ...stage.skills.map((s): [string, string, ReviewPlace] => [s.titleFi, s.titleEn, 'math']),
    ]),
    ...BADGE_CATEGORIES.map((c): [string, string, ReviewPlace] => [c.titleFi, c.titleEn, 'everywhere']),
    ...BADGES.map((b): [string, string, ReviewPlace] => [b.titleFi, b.titleEn, 'everywhere']),
    ...AUDIT_ENTRIES.map((a): [string, string, ReviewPlace] => [a.titleFi, a.titleEn, 'grown-ups']),
  ]).map((r) => ({ ...r, key: `title:${r.key}` }));
  // The screens' own labels, minus any already listed as a title.
  const titled = new Set(titleRows.map((r) => r.fi));
  const uiRows: Row[] = labels
    .filter((l) => !titled.has(l.fi))
    .map((l) => ({ key: `ui:${l.fi}`, fi: l.fi, en: l.en || '(no English shown)', where: labelPlace.get(l.fi) }));

  const sections: (Omit<ReviewSection, 'rows'> & { rows: Row[] })[] = [
    { id: 'dialogues', title: 'Greetings & dialogues', hint: 'A line someone says → the reply.', rows: dialogueRows },
    { id: 'conversations', title: 'Scenes, turn by turn', hint: 'Each turn of a short conversation.', rows: conversationRows },
    { id: 'stories', title: 'Stories', hint: 'Each page (who says what), then the questions (✓ = the right answer) and the true-or-false statements.', rows: storyRows },
    { id: 'carriers', title: 'Sentence patterns', hint: 'The fixed words around the slot, with one example.', rows: carrierRows },
    { id: 'slips', title: 'Forms marked wrong', hint: 'Flag any "wrong" form that is actually fine Finnish for this meaning.', rows: slipRows },
    { id: 'templates', title: 'Sentence templates', hint: 'Longer sentence skeletons.', rows: templateRows },
    { id: 'patterns', title: 'Comparisons & dates', hint: 'Sourced words joined by authored glue.', rows: patternRows },
    { id: 'ordinals', title: 'Ordinals 11th–31st', hint: 'Hand-written words (the source stops at the 10th).', rows: ordinalRows },
    { id: 'questions', title: '"Do you…?" questions', hint: 'One question form per verb.', rows: questionRows },
    { id: 'pronouns', title: 'Pronoun forms & frames', hint: 'minä, minua, minulle…', rows: pronounRows },
    { id: 'spoken', title: 'Spoken Finnish', hint: 'Everyday spoken forms, shown beside the written ones to recognize — never asked for.', rows: spokenRows },
    { id: 'letters', title: 'Alphabet', hint: 'Letter names and sound tips.', rows: letterRows },
    { id: 'lessons', title: 'Finnish in the lessons', hint: 'Words quoted in the explanations.', rows: lessonRows },
    {
      id: 'math',
      title: 'Math in Finnish (Lasketaan!)',
      hint: 'The problems’ sentence frames, each with one example. The numbers and things change; the frame stays.',
      rows: mathRows,
    },
    { id: 'lines', title: 'Other lines (wrong replies)', hint: 'Lines only offered as wrong answers.', rows: strayRows },
    {
      id: 'titles',
      title: 'Course titles',
      hint: 'Unit, step, lesson, badge and game names, and the examples under steps.',
      rows: titleRows,
    },
    {
      id: 'ui',
      title: 'Buttons & screen labels',
      hint: 'What the screens say around the games ("Jatka", "Mitä kuulit?"). ⟨…⟩ is filled in by the app.',
      rows: uiRows,
    },
  ];
  // Every row says where a child first meets it (review.test.ts checks none is left out).
  return sections.map((section) => ({
    ...section,
    rows: section.rows.map((row) => ({ ...row, where: (row.where ?? placeOf(row.key))! })),
  }));
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

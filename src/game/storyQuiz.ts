// The questions after a story. Each story has a BANK: its picture questions
// and true-or-false statements, plus two kinds built from the pages themselves
// (so no new Finnish is needed): "put the pictures in order" and "who says
// this?". A read draws a few, of mixed kinds, preferring questions it didn't
// ask last time — so reading a story again is never the same quiz again.
//
// Pure apart from the shuffles.

import { CAST, type CastId, type Story, type StoryLine, type StoryOption, type StoryScene } from '../content/storyKit';
import { shuffle } from '../util/shuffle';

export type QuizKind = 'choice' | 'truefalse' | 'who' | 'order';

/** "Mitä Mirri juo?" — tap the right picture. */
export interface ChoiceItem {
  kind: 'choice';
  id: string;
  promptFi: string;
  promptEn: string;
  options: StoryOption[];
}

/** "Totta vai tarua?" — did this happen in the story? */
export interface TrueFalseItem {
  kind: 'truefalse';
  id: string;
  fi: string;
  en: string;
  answer: boolean;
}

/** "Kuka sanoo näin?" — a line from the story; tap who said it. */
export interface WhoItem {
  kind: 'who';
  id: string;
  line: StoryLine;
  speaker: CastId;
  options: CastId[];
}

export interface OrderCard {
  /** Page index — the card's place in the story. */
  page: number;
  scene: StoryScene;
  line: StoryLine;
}

/** "Laita kuvat järjestykseen!" — tap the pages in the order they happened. */
export interface OrderItem {
  kind: 'order';
  id: 'order';
  /** In story order (the game shows them shuffled). */
  cards: OrderCard[];
}

export type QuizItem = ChoiceItem | TrueFalseItem | WhoItem | OrderItem;

/** How many pages an order question asks about. */
export const ORDER_CARDS = 3;

/** Where each kind sits in a quiz: the pictures first, putting it in order last (a recap). */
const PRESENT_ORDER: QuizKind[] = ['choice', 'truefalse', 'who', 'order'];

const norm = (s: string) => s.toLowerCase().replace(/[.,!?…]/g, '').trim();

/** Fallback names for a "who said it?" that needs more choices than the story has people. */
const MAIN_CAST: CastId[] = ['aino', 'eero', 'aiti', 'isa', 'isoaiti', 'mirri'];

function whoItems(story: Story): WhoItem[] {
  const lines = story.pages.flatMap((p, pi) => p.lines.map((line, li) => ({ line, pi, li })));
  const inStory = [
    ...new Set([...lines.flatMap(({ line }) => (line.by ? [line.by] : [])), ...(story.narrator ? [story.narrator] : [])]),
  ];
  const out: WhoItem[] = [];
  const asked = new Set<string>();
  for (const { line, pi, li } of lines) {
    const by = line.by;
    if (!by) continue;
    const text = norm(line.fi);
    // Once per speaker and line ("Miau!" may come twice).
    if (asked.has(`${by}:${text}`)) continue;
    // Too easy: "Minä olen Aino." names its own speaker.
    if (text.split(/\s+/).includes(CAST[by].nameFi.toLowerCase())) continue;
    // Not fair: someone else says the same thing too.
    const clash = lines.some(({ line: o }) => o.by && o.by !== by && (norm(o.fi).includes(text) || text.includes(norm(o.fi))));
    if (clash) continue;
    asked.add(`${by}:${text}`);
    const others = inStory.filter((c) => c !== by);
    const fill = MAIN_CAST.filter((c) => c !== by && !others.includes(c));
    out.push({ kind: 'who', id: `w${pi}-${li}`, line, speaker: by, options: [by, ...others, ...fill].slice(0, 3) });
  }
  return out;
}

const wordsOf = (s: string) => norm(s).split(/\s+/).filter(Boolean);

/**
 * The page's most telling line for an order card: the one with the most words
 * no other page has ("Onko Eerolla hattu?" over "Äiti! Minulla ei ole
 * hattua!"; "Mirri! Sinulla on hattu!" over a bare "Miau!") — then a line of
 * more than one word, the larger share of such words, the longer line.
 */
function tellingLine(story: Story, page: number): StoryLine {
  const elsewhere = new Set(story.pages.flatMap((p, i) => (i === page ? [] : p.lines.flatMap((l) => wordsOf(l.fi)))));
  const score = (l: StoryLine) => {
    const w = wordsOf(l.fi);
    const own = w.filter((x) => !elsewhere.has(x)).length;
    // A one-word line ("Miau!") only if nothing longer says as much.
    return [own, w.length > 1 ? 1 : 0, own / Math.max(1, w.length), l.fi.length];
  };
  return [...story.pages[page].lines].sort((a, b) => {
    const [x, y] = [score(a), score(b)];
    return y[0] - x[0] || y[1] - x[1] || y[2] - x[2] || y[3] - x[3];
  })[0];
}

function orderItem(story: Story): OrderItem | undefined {
  if (story.pages.length < ORDER_CARDS) return undefined;
  const cards = story.pages.map((p, page) => ({ page, scene: p.scene, line: tellingLine(story, page) }));
  return { kind: 'order', id: 'order', cards };
}

/** Every question a story can ask. */
export function questionBank(story: Story): QuizItem[] {
  const order = orderItem(story);
  return [
    ...story.questions.map(
      (q, i): ChoiceItem => ({ kind: 'choice', id: `c${i}`, promptFi: q.promptFi, promptEn: q.promptEn, options: q.options }),
    ),
    ...story.facts.map((f, i): TrueFalseItem => ({ kind: 'truefalse', id: `t${i}`, fi: f.fi, en: f.en, answer: f.isTrue })),
    ...whoItems(story),
    ...(order ? [order] : []),
  ];
}

function prepare(q: QuizItem): QuizItem {
  switch (q.kind) {
    case 'choice':
      return { ...q, options: shuffle(q.options) };
    case 'who':
      return { ...q, options: shuffle(q.options) };
    case 'order':
      return { ...q, cards: shuffle(q.cards).slice(0, ORDER_CARDS).sort((a, b) => a.page - b.page) };
    default:
      return q;
  }
}

/**
 * Draw `n` questions for a read: one of each kind first (picture, true or
 * false, who said it, and — on a full read — putting it in order), then any,
 * always preferring questions not in `avoid` (last time's). Never two order
 * questions. Shown pictures first, the order question last.
 */
export function drawQuiz(story: Story, n: number, avoid: readonly string[] = []): QuizItem[] {
  const bank = questionBank(story);
  const avoided = new Set(avoid);
  const fresh = shuffle(bank.filter((q) => !avoided.has(q.id)));
  const stale = shuffle(bank.filter((q) => avoided.has(q.id)));
  const wanted: QuizKind[] = n >= 4 ? ['choice', 'truefalse', 'who', 'order'] : ['choice', 'truefalse', 'who'];
  const picks: QuizItem[] = [];
  const canTake = (q: QuizItem) => !picks.includes(q) && !(q.kind === 'order' && picks.some((p) => p.kind === 'order'));
  const takeFrom = (list: QuizItem[], ok: (q: QuizItem) => boolean): boolean => {
    const q = list.find((x) => canTake(x) && ok(x));
    if (q) picks.push(q);
    return !!q;
  };
  for (const list of [fresh, stale]) {
    for (const kind of wanted) if (picks.length < n) takeFrom(list, (q) => q.kind === kind);
    while (picks.length < n && takeFrom(list, () => true));
  }
  return picks
    .sort((a, b) => PRESENT_ORDER.indexOf(a.kind) - PRESENT_ORDER.indexOf(b.kind))
    .map(prepare);
}

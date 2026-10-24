// The Finnish of the math section (Lasketaan!): the problem frames, authored
// and flagged ⚠️ for the Finnish check, with SOURCED forms filled in — the
// number words and their genitive and partitive (viiden, viittä), and the
// counted nouns (kolme omenaa). Nothing here builds a form.
//
// The frames are written so the Finnish itself sets the math: *plus* and
// *miinus*, *enemmän* and *vähemmän*, what comes *jälkeen* or *ennen*, and in a
// word problem the verb — *saan* (I get) adds, *syön* (I eat) and *annan* (I
// give) take away. Each frame has its English for the grown-ups' review only;
// the section itself never shows a word of it.
//
// One rule the frames keep: *yksi* as an object is *yhden* ("Syön yhden
// omenan"), so a frame never puts a number in an object slot unless it is two
// or more — then the basic form is right ("Syön kaksi omenaa").

/** A sentence's first letter in capitals. */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A frame's Finnish and its English (for the review only). */
export interface Said {
  fi: string;
  en: string;
}

// --- Plus and minus ⚠️ -----------------------------------------------------

/** "Paljonko on kolme plus kaksi?" — and, once answered, "Kolme plus kaksi on viisi." */
export function sumFrame(op: 'plus' | 'minus', a: string, b: string, c: string, en: [string, string, string]): { ask: Said; tell: Said } {
  const word = op === 'plus' ? 'plus' : 'miinus';
  return {
    ask: { fi: `Paljonko on ${a} ${word} ${b}?`, en: `What is ${en[0]} ${op} ${en[1]}?` },
    tell: { fi: `${cap(a)} ${word} ${b} on ${c}.`, en: `${cap(en[0])} ${op} ${en[1]} is ${en[2]}.` },
  };
}

// --- More or less ⚠️ --------------------------------------------------------

/** "Kumpi on enemmän: kolme vai viisi?" — and "Viisi on enemmän." */
export function compareFrame(more: boolean, a: string, b: string, answer: string, en: [string, string, string]): { ask: Said; tell: Said } {
  const word = more ? 'enemmän' : 'vähemmän';
  const enWord = more ? 'more' : 'less';
  return {
    ask: { fi: `Kumpi on ${word}: ${a} vai ${b}?`, en: `Which is ${enWord}: ${en[0]} or ${en[1]}?` },
    tell: { fi: `${cap(answer)} on ${word}.`, en: `${cap(en[2])} is ${enWord}.` },
  };
}

/**
 * "Mikä luku tulee viiden jälkeen?" (after: the genitive) and "Mikä luku tulee
 * ennen viittä?" (before: the partitive) — and "Kuusi tulee viiden jälkeen."
 */
export function neighborFrame(
  after: boolean,
  form: string,
  answer: string,
  en: [string, string],
): { ask: Said; tell: Said } {
  return after
    ? {
        ask: { fi: `Mikä luku tulee ${form} jälkeen?`, en: `What number comes after ${en[0]}?` },
        tell: { fi: `${cap(answer)} tulee ${form} jälkeen.`, en: `${cap(en[1])} comes after ${en[0]}.` },
      }
    : {
        ask: { fi: `Mikä luku tulee ennen ${form}?`, en: `What number comes before ${en[0]}?` },
        tell: { fi: `${cap(answer)} tulee ennen ${form}.`, en: `${cap(en[1])} comes before ${en[0]}.` },
      };
}

/** The train's question: "Mikä luku puuttuu?" */
export const MISSING: Said = { fi: 'Mikä luku puuttuu?', en: 'Which number is missing?' };

/** The rocket's countdown, ending in lift-off: "Lähtö!" */
export const LIFT_OFF: Said = { fi: 'Lähtö!', en: 'Lift-off!' };

// --- Word problems ⚠️ --------------------------------------------------------

/**
 * A word problem: three sentences, then the answer said in full. The verb
 * decides the math — having it together adds, getting more adds, eating and
 * giving take away. `verb` is the verb the course must have taught first.
 */
export interface WordFrame {
  id: 'have-have' | 'have-get' | 'have-eat' | 'have-give';
  /** The verb (item id) the child must know; unset = only "Minulla on", always known. */
  verb?: 'get' | 'eat' | 'give';
  op: 'plus' | 'minus';
  /** The second number is an object (eaten, given, got): two or more, never yksi. */
  bMin: number;
  /** Something to eat, or any thing. */
  edible: boolean;
}

export const WORD_FRAMES: WordFrame[] = [
  { id: 'have-have', op: 'plus', bMin: 1, edible: false },
  { id: 'have-get', verb: 'get', op: 'plus', bMin: 2, edible: false },
  { id: 'have-eat', verb: 'eat', op: 'minus', bMin: 2, edible: true },
  { id: 'have-give', verb: 'give', op: 'minus', bMin: 2, edible: false },
];

/** The words a word problem is filled with: numbers and the counted noun's forms. */
export interface WordFill {
  a: string;
  b: string;
  c: string;
  /** The noun after a, after b, after c (yksi omena · kaksi omenaa). */
  nounA: string;
  nounB: string;
  nounC: string;
  /** "Montako omenaa?" */
  nounPart: string;
  en: { a: string; b: string; c: string; nounA: string; nounB: string; nounC: string; plural: string };
}

/** The problem's sentences (spoken one by one) and the answer in full. */
export function wordProblem(frame: WordFrame, f: WordFill): { ask: Said[]; tell: Said } {
  const e = f.en;
  const have: Said = { fi: `Minulla on ${f.a} ${f.nounA}.`, en: `I have ${e.a} ${e.nounA}.` };
  switch (frame.id) {
    case 'have-have':
      return {
        ask: [
          have,
          { fi: `Sinulla on ${f.b} ${f.nounB}.`, en: `You have ${e.b} ${e.nounB}.` },
          { fi: `Montako ${f.nounPart} meillä on yhteensä?`, en: `How many ${e.plural} do we have in all?` },
        ],
        tell: { fi: `Meillä on yhteensä ${f.c} ${f.nounC}.`, en: `We have ${e.c} ${e.nounC} in all.` },
      };
    case 'have-get':
      return {
        ask: [
          have,
          { fi: `Saan ${f.b} lisää.`, en: `I get ${e.b} more.` },
          { fi: `Montako ${f.nounPart} minulla on nyt?`, en: `How many ${e.plural} do I have now?` },
        ],
        tell: { fi: `Minulla on nyt ${f.c} ${f.nounC}.`, en: `Now I have ${e.c} ${e.nounC}.` },
      };
    case 'have-eat':
      return {
        ask: [
          have,
          { fi: `Syön ${f.b} ${f.nounB}.`, en: `I eat ${e.b} ${e.nounB}.` },
          { fi: `Montako ${f.nounPart} minulla on nyt?`, en: `How many ${e.plural} do I have now?` },
        ],
        tell: { fi: `Minulla on nyt ${f.c} ${f.nounC}.`, en: `Now I have ${e.c} ${e.nounC}.` },
      };
    case 'have-give':
      return {
        ask: [
          have,
          { fi: `Annan sinulle ${f.b} ${f.nounB}.`, en: `I give you ${e.b} ${e.nounB}.` },
          { fi: `Montako ${f.nounPart} minulla on jäljellä?`, en: `How many ${e.plural} do I have left?` },
        ],
        tell: { fi: `Minulla on jäljellä ${f.c} ${f.nounC}.`, en: `I have ${e.c} ${e.nounC} left.` },
      };
  }
}

/** Things to eat, for "Syön…" (every one counted as one whole thing). */
export const EDIBLE_THINGS = ['apple', 'banana', 'cookie', 'strawberry', 'candy', 'bun'];
/** Things to have, get and give. */
export const THINGS = ['ball', 'pencil', 'book', 'car', 'apple', 'cookie'];

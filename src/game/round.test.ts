import { describe, it, expect } from 'vitest';
import {
  buildListenRound,
  buildPhraseRound,
  buildSpellingRound,
  buildSpellingPhraseRound,
  buildWordOrderRound,
  buildCountingRound,
  buildAgreementRound,
  buildConjugationRound,
  buildCommandRound,
  buildYesNoRound,
  buildGrammarReviewQuestion,
  buildReviewRound,
  buildComprehensionRound,
  buildSayRound,
  buildDialogueRound,
  buildConversation,
  buildReadingRound,
} from './round';
import { COMMAND_VERB_IDS } from '../content/semantics';
import { commandFor, suitsSlot } from '../content/types';
import { dialogues } from '../content/dialogues';
import { conversations } from '../content/conversations';
import { kidSafeExamples } from '../content/examples';
import {
  animals,
  numbers,
  adjectives,
  verbs,
  food,
  family,
  places,
  body,
  nature,
  clothes,
} from '../content';
import { nounConstructions } from '../content/constructions';
import { formFor } from '../content/types';

// Round builders are random, so each invariant is checked over many runs. They
// use the real sourced content, so these double as an integration check that the
// builders + data agree.
const RUNS = 100;

describe('buildListenRound', () => {
  it('holds its invariants across many runs', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildListenRound(animals.items, 6, 3);
      expect(round).toHaveLength(Math.min(6, animals.items.length));
      for (const q of round) {
        expect(q.options).toHaveLength(3);
        // the target appears exactly once...
        expect(q.options.filter((o) => o.id === q.target.id)).toHaveLength(1);
        // ...options are distinct...
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        // ...and every option is a real item from the pool.
        q.options.forEach((o) => expect(animals.items).toContain(o));
      }
    }
  });

  it('never asks for more questions than there are items', () => {
    expect(buildListenRound(animals.items, 999, 3)).toHaveLength(animals.items.length);
  });
});

describe('buildPhraseRound', () => {
  it('keeps the answer present and never offers a blank tile', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildPhraseRound(animals.items, animals.constructions, 6, 3);
      for (const q of round) {
        expect(q.options.some((o) => o.id === q.item.id)).toBe(true);
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        expect(q.options.length).toBeGreaterThanOrEqual(1);
        expect(q.options.length).toBeLessThanOrEqual(3);
        // every tile must resolve a Finnish form for this construction
        q.options.forEach((o) => expect(formFor(o, q.construction)).toBeTruthy());
      }
    }
  });
});

describe('buildSpellingRound', () => {
  it('returns distinct items from the pool', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildSpellingRound(animals.items, 6);
      expect(round).toHaveLength(Math.min(6, animals.items.length));
      expect(new Set(round.map((i) => i.id)).size).toBe(round.length);
      round.forEach((i) => expect(animals.items).toContain(i));
    }
  });
});

describe('buildWordOrderRound', () => {
  it('produces a real puzzle that reorders back to the sentence', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildWordOrderRound(animals.items, animals.constructions, 6);
      for (const q of round) {
        // tokens in id order reconstruct the spoken sentence
        const ordered = [...q.tokens]
          .sort((a, b) => a.id - b.id)
          .map((t) => t.text)
          .join(' ');
        expect(ordered).toBe(q.sentence);
        // the shuffled set is a permutation of the same tokens
        expect([...q.shuffled].map((t) => t.id).sort((a, b) => a - b)).toEqual(
          [...q.tokens].map((t) => t.id).sort((a, b) => a - b),
        );
        // ...and it isn't already solved (when there's more than one token)
        if (q.tokens.length > 1) {
          expect(q.shuffled.every((t, i) => t.id === q.tokens[i].id)).toBe(false);
        }
      }
    }
  });
});

describe('buildCountingRound', () => {
  it('pairs an in-range count with a noun, each with distinct options', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildCountingRound(numbers.items, animals.items, 6, 3, 5);
      expect(round).toHaveLength(6);
      for (const q of round) {
        expect(q.numberOptions).toHaveLength(3);
        expect(q.nounOptions).toHaveLength(3);
        expect(q.numberOptions.some((n) => n.id === q.number.id)).toBe(true);
        expect(q.nounOptions.some((n) => n.id === q.noun.id)).toBe(true);
        expect(new Set(q.numberOptions.map((n) => n.id)).size).toBe(3);
        expect(new Set(q.nounOptions.map((n) => n.id)).size).toBe(3);
        const v = q.number.value ?? 0;
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(5);
      }
    }
  });

  it('keeps the tens out below the top of the ladder (maxCount 12)', () => {
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildCountingRound(numbers.items, animals.items, 6, 3, 12)) {
        expect(q.number.value ?? 0).toBeLessThanOrEqual(12);
      }
    }
  });

  it('draws the round tens (30…100) at the top of the ladder (maxCount 20)', () => {
    let tensSeen = 0;
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildCountingRound(numbers.items, animals.items, 6, 3, 20)) {
        const v = q.number.value ?? 0;
        // Everything drawn is either a countable 1..20 or a round ten ≤ 100.
        expect(v <= 20 || (v % 10 === 0 && v <= 100)).toBe(true);
        if (v > 20) tensSeen++;
      }
    }
    // With 9 tens among 29 eligible numbers, 600 draws must hit some.
    expect(tensSeen).toBeGreaterThan(0);
  });
});

describe('buildCommandRound (TPR commands)', () => {
  it('speaks a sourced imperative ("Hyppää!") with the answer among actable pictures', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildCommandRound(verbs.items, 6, 3);
      expect(round.length).toBeGreaterThan(0);
      for (const q of round) {
        // The utterance is exactly the sourced imperative, capitalized + "!".
        expect(q.sentence).toBe(commandFor(q.item));
        expect(q.sentence).toMatch(/^[A-ZÄÖÅ].*!$/);
        // Every option: picturable AND on the kid-actable allow-list.
        expect(q.options.filter((o) => o.id === q.item.id)).toHaveLength(1);
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        for (const o of q.options) {
          expect(o.emoji).toBeTruthy();
          expect(COMMAND_VERB_IDS).toContain(o.id);
        }
      }
    }
  });

  it('never commands a state or feeling (love, cry, remember are not actable)', () => {
    for (const banned of ['love', 'cry', 'remember', 'forget', 'want']) {
      expect(COMMAND_VERB_IDS).not.toContain(banned);
    }
  });
});

describe('buildYesNoRound (Onko tämä…?)', () => {
  const isThis = nounConstructions.find((c) => c.id === 'is-this')!;

  it('asks the is-this question over the ASKED word, mixing yes and no', () => {
    let yes = 0;
    let no = 0;
    for (let r = 0; r < RUNS; r++) {
      const round = buildYesNoRound(animals.items, isThis, 6);
      expect(round.length).toBeGreaterThan(0);
      for (const q of round) {
        expect(q.question).toMatch(/^Onko tämä \S+\?$/);
        // The question is about the ASKED word (never silently the shown one).
        expect(q.question).toContain(formFor(q.asked, isThis)!);
        expect(q.isMatch).toBe(q.asked.id === q.shown.id);
        expect(q.shown.emoji).toBeTruthy();
        if (q.isMatch) yes++;
        else no++;
      }
    }
    // Both answers genuinely occur — never an all-yes (or all-no) game.
    expect(yes).toBeGreaterThan(0);
    expect(no).toBeGreaterThan(0);
  });

  it('tricky no-questions ask about a same-topic word (cat shown, "Onko tämä koira?")', () => {
    // Mixed pool so a cross-topic asked word WOULD be possible without the gate.
    const mixed = [...animals.items, ...food.items];
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildYesNoRound(mixed, isThis, 6, true)) {
        if (!q.isMatch) expect(q.asked.topic).toBe(q.shown.topic);
      }
    }
  });
});

describe('buildGrammarReviewQuestion (a due carrier in Review)', () => {
  const iLike = nounConstructions.find((c) => c.id === 'i-like')!;

  it('tests the carrier’s case: the answer is the sourced slot form among the same word’s other cases', () => {
    for (let r = 0; r < RUNS; r++) {
      const q = buildGrammarReviewQuestion(iLike, animals.items, 4);
      expect(q).not.toBeNull();
      // The paired item makes sense in the slot, and the answer is ITS form.
      expect(suitsSlot(q!.item, iLike)).toBe(true);
      expect(q!.answer).toBe(formFor(q!.item, iLike));
      // Options: distinct forms, the answer present exactly once.
      expect(q!.options).toHaveLength(4);
      expect(new Set(q!.options).size).toBe(4);
      expect(q!.options.filter((f) => f === q!.answer)).toHaveLength(1);
    }
  });

  it('returns null when no item can fill the slot', () => {
    expect(buildGrammarReviewQuestion(iLike, [], 4)).toBeNull();
  });
});

describe('buildAgreementRound', () => {
  it('offers exactly one agreeing form per question', () => {
    let produced = 0;
    for (let r = 0; r < RUNS; r++) {
      const round = buildAgreementRound(adjectives.items, animals.items, 6, 3);
      expect(round.length).toBeLessThanOrEqual(6);
      for (const q of round) {
        produced++;
        expect(q.options).toHaveLength(3);
        const correct = q.options.filter((o) => o.correct);
        expect(correct).toHaveLength(1);
        expect(correct[0].form).toBe(q.answer);
        // each option is a distinct case form of the noun
        expect(new Set(q.options.map((o) => o.caseId)).size).toBe(3);
      }
    }
    expect(produced).toBeGreaterThan(0);
  });
});

describe('buildReviewRound', () => {
  it('keeps the caller-chosen targets and order, with valid distinct options', () => {
    const targets = [animals.items[0], animals.items[1], animals.items[2]];
    for (let r = 0; r < RUNS; r++) {
      const round = buildReviewRound(targets, animals.items, 3);
      // one question per target, in the same order (most-overdue-first preserved)
      expect(round.map((q) => q.target.id)).toEqual(targets.map((t) => t.id));
      for (const q of round) {
        expect(q.options).toHaveLength(3);
        expect(q.options.filter((o) => o.id === q.target.id)).toHaveLength(1);
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        q.options.forEach((o) => expect(animals.items).toContain(o));
      }
    }
  });

  it('returns an empty round for no targets', () => {
    expect(buildReviewRound([], animals.items, 3)).toEqual([]);
  });
});

describe('buildComprehensionRound', () => {
  it('produces a full sentence, the answer item, and distinct picture options', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildComprehensionRound(animals.items, nounConstructions, 6, 3, 8);
      expect(round.length).toBeGreaterThan(0);
      for (const q of round) {
        // A real multi-word carrier sentence (a random eligible construction
        // filled with the answer item).
        expect(q.sentence.split(' ').length).toBeGreaterThan(1);
        expect(q.sentence.length).toBeGreaterThan(0);
        // The answer is present exactly once; options are distinct + picturable.
        expect(q.options.filter((o) => o.id === q.item.id)).toHaveLength(1);
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        q.options.forEach((o) => expect(o.emoji).toBeTruthy());
      }
    }
  });

  it('builds natural predicate-adjective sentences for the colors node ("Tämä on punainen.")', () => {
    const thisIs = nounConstructions.filter((c) => c.id === 'this-is');
    const colors = adjectives.items.filter((i) =>
      ['red', 'blue', 'yellow', 'green', 'black', 'white', 'brown'].includes(i.id),
    );
    let produced = 0;
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildComprehensionRound(colors, thisIs, 6, 3, 4)) {
        produced++;
        expect(q.sentence).toMatch(/^Tämä on \S+\.$/);
        q.options.forEach((o) => expect(o.emoji).toBeTruthy());
      }
    }
    expect(produced).toBeGreaterThan(0);
  });

  it('never uses an emoji-less item as a tile', () => {
    // verbs include emoji-less abstract ones (olla, saada…); they must be filtered.
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildComprehensionRound(verbs.items, nounConstructions, 6, 4, 8)) {
        q.options.forEach((o) => expect(o.emoji).toBeTruthy());
      }
    }
  });

  it('tier-gates the constructions it draws from', () => {
    // At maxTier 2 only tier-2 carriers (this-is, where-is, i-have, …) are
    // eligible, so the tier-3 partitive negation "en näe" can never appear.
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildComprehensionRound(animals.items, nounConstructions, 6, 3, 2)) {
        expect(q.sentence).not.toMatch(/\bei\b/);
      }
    }
  });
});

describe('buildSayRound', () => {
  it('says bare words when no constructions are given', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildSayRound(animals.items, [], 6, 4);
      expect(round.length).toBe(Math.min(6, animals.items.length));
      for (const q of round) {
        // The target is a single sourced word matching a real item.
        const item = animals.items.find((i) => i.id === q.attemptId)!;
        expect(item).toBeTruthy();
        expect(q.say).toBe(item.fi);
        expect(q.gloss).toBe(item.en);
        expect(q.emoji).toBe(item.emoji);
      }
    }
  });

  it('says full carrier phrases when constructions are given', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildSayRound(animals.items, nounConstructions, 6, 8);
      expect(round.length).toBeGreaterThan(0);
      for (const q of round) {
        expect(q.say.split(' ').length).toBeGreaterThan(1); // a phrase, not a word
        expect(q.gloss.length).toBeGreaterThan(0);
        expect(q.attemptId).toBeTruthy();
      }
    }
  });

  it('tier-gates the phrases it draws from', () => {
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildSayRound(animals.items, nounConstructions, 6, 2)) {
        expect(q.say).not.toMatch(/\bei\b/); // no tier-3 negation at maxTier 2
      }
    }
  });

  it('caps the spoken tier so speaking never asks for the written apexes', () => {
    // Sanity: the pool DOES contain harder carriers, so the cap is meaningful.
    expect(nounConstructions.some((c) => c.tier > 3 && c.before === 'Ostan')).toBe(true);
    for (let r = 0; r < RUNS; r++) {
      // Even at the engine's top tier, the child only says simple frames —
      // the tier-5/6 carriers (buy, wait-for, plural predicatives) never surface.
      for (const q of buildSayRound(animals.items, nounConstructions, 6, 8)) {
        expect(q.say).not.toMatch(/^(Ostan|Odotan|Nämä ovat|Missä ovat)\b/);
      }
    }
  });
});

describe('buildReadingRound', () => {
  it('pairs a real kid-safe example with the pictured item + distinct options', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildReadingRound(animals.items, 6, 3);
      expect(round.length).toBeGreaterThan(0);
      for (const q of round) {
        // The sentence is one of the item's own kid-safe examples.
        expect(kidSafeExamples(q.item).map((e) => e.fi)).toContain(q.sentence.fi);
        expect(q.sentence.en).toBeTruthy();
        // Answer present once; options distinct + picturable.
        expect(q.options.filter((o) => o.id === q.item.id)).toHaveLength(1);
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        q.options.forEach((o) => expect(o.emoji).toBeTruthy());
      }
    }
  });

  it('only ever asks about items that actually have a safe example', () => {
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildReadingRound(animals.items, 6, 3)) {
        expect(kidSafeExamples(q.item).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('buildDialogueRound', () => {
  it('keeps the right reply present with distinct, real options', () => {
    for (let r = 0; r < RUNS; r++) {
      const round = buildDialogueRound(dialogues, 6, 3, 8);
      expect(round.length).toBeGreaterThan(0);
      for (const q of round) {
        expect(q.options).toHaveLength(3);
        expect(q.options.filter((o) => o.fi === q.reply.fi)).toHaveLength(1); // answer present once
        expect(new Set(q.options.map((o) => o.fi)).size).toBe(q.options.length); // distinct
        // Every option is a real authored reply/distractor (has fi + en).
        q.options.forEach((o) => {
          expect(o.fi).toBeTruthy();
          expect(o.en).toBeTruthy();
        });
      }
    }
  });

  it('tier-gates harder exchanges out of a low-tier round', () => {
    // At maxTier 1 only the simplest greetings play — the tier-2 "name/age"
    // exchanges must never appear.
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildDialogueRound(dialogues, 6, 3, 1)) {
        expect(q.prompt.fi).not.toMatch(/nimesi|vanha/);
      }
    }
  });

  it('fills the {name} placeholder with the child\'s own name everywhere it appears', () => {
    // "your-name"'s reply, plus its backfilled copies as OTHER exchanges'
    // distractors, all carry {name} — every one must come back personalized,
    // and the reply must still match one of its own options (fi equality).
    let sawName = false;
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildDialogueRound(dialogues, dialogues.length, 3, 4, 'Liam')) {
        expect(q.prompt.fi).not.toContain('{name}');
        expect(q.reply.fi).not.toContain('{name}');
        for (const o of q.options) expect(o.fi).not.toContain('{name}');
        if (q.reply.fi.includes('Liam')) {
          sawName = true;
          expect(q.options.some((o) => o.fi === q.reply.fi)).toBe(true);
        }
      }
    }
    expect(sawName).toBe(true);
  });

  it('falls back to the original vetted name when no child name is given', () => {
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildDialogueRound(dialogues, dialogues.length, 3, 4)) {
        expect(q.reply.fi).not.toContain('{name}');
      }
    }
  });
});

describe('buildConversation', () => {
  it('returns one tier-gated scene with per-turn distinct options and the reply present', () => {
    for (let r = 0; r < RUNS; r++) {
      const scene = buildConversation(conversations, 3, 4)!;
      expect(scene).not.toBeNull();
      expect(scene.turns.length).toBeGreaterThanOrEqual(2);
      expect(scene.titleFi).toBeTruthy();
      expect(scene.partnerIcon).toBeTruthy();
      for (const t of scene.turns) {
        expect(t.options).toHaveLength(3);
        expect(t.options.filter((o) => o.fi === t.reply.fi)).toHaveLength(1); // answer present once
        expect(new Set(t.options.map((o) => o.fi)).size).toBe(t.options.length); // distinct
        t.options.forEach((o) => {
          expect(o.fi).toBeTruthy();
          expect(o.en).toBeTruthy();
        });
      }
    }
  });

  it('falls back to a scene even when no tier qualifies (a low-level child still plays)', () => {
    // Both authored scenes are tier 3–4; at maxTier 2 it still hands one back.
    const scene = buildConversation(conversations, 3, 2);
    expect(scene).not.toBeNull();
  });

  it('returns null only when there are no scenes at all', () => {
    expect(buildConversation([], 3, 4)).toBeNull();
  });

  it('fills the {name} placeholder with the child\'s own name (new-friend scene)', () => {
    let sawName = false;
    for (let r = 0; r < RUNS; r++) {
      const scene = buildConversation(conversations, 3, 4, 'Liam')!;
      for (const t of scene.turns) {
        expect(t.partner.fi).not.toContain('{name}');
        expect(t.reply.fi).not.toContain('{name}');
        for (const o of t.options) expect(o.fi).not.toContain('{name}');
        if (t.reply.fi.includes('Liam')) {
          sawName = true;
          expect(t.options.some((o) => o.fi === t.reply.fi)).toBe(true);
        }
      }
    }
    expect(sawName).toBe(true);
  });
});

describe('buildConjugationRound', () => {
  it('offers one correct conjugation with a matching clause', () => {
    let produced = 0;
    for (let r = 0; r < RUNS; r++) {
      const round = buildConjugationRound(verbs.items, 6, 3);
      expect(round.length).toBeLessThanOrEqual(6);
      for (const q of round) {
        produced++;
        expect(q.options).toHaveLength(3);
        const correct = q.options.filter((o) => o.correct);
        expect(correct).toHaveLength(1);
        expect(correct[0].form).toBe(q.answer);
        expect(q.clause).toBe(`${q.pronoun} ${q.answer}`);
        expect(new Set(q.options.map((o) => o.person)).size).toBe(3);
      }
    }
    expect(produced).toBeGreaterThan(0);
  });

  it('builds past-negative rounds now that the form is sourced (the L4 rung)', () => {
    const combo = [{ tense: 'past', polarity: 'negative' }] as const;
    let produced = 0;
    for (let r = 0; r < RUNS; r++) {
      const round = buildConjugationRound(verbs.items, 6, 3, [...combo]);
      for (const q of round) {
        produced++;
        expect(q.tense).toBe('past');
        expect(q.polarity).toBe('negative');
        // Negative forms are multi-word ("en syönyt") — confirm a real clause.
        expect(q.clause).toBe(`${q.pronoun} ${q.answer}`);
        expect(q.answer).toContain(' ');
      }
    }
    // The whole point of the chapter-6 build: this rung is no longer empty.
    expect(produced).toBeGreaterThan(0);
  });
});

describe('tier gating never empties a curated construction set', () => {
  it('still plays a single higher-tier construction below its tier', () => {
    const iLike = animals.constructions.filter((c) => c.id === 'i-like');
    expect(iLike[0].tier).toBe(3);
    // maxTier 2 would filter out the only (tier-3) construction — the builder
    // must fall back to it rather than return an empty (blank-screen) round.
    const round = buildPhraseRound(animals.items, iLike, 6, 3, 2);
    expect(round.length).toBeGreaterThan(0);
    for (const q of round) expect(q.construction.id).toBe('i-like');
  });
});

describe('semantic gating (suitsSlot) in the pairing builders', () => {
  // The capstones mix ALL topics into ALL constructions — the gate is what
  // stops "Kissa menee äitiin" (the cat goes into mom). Locative carriers are
  // topics:['places']; possession excludes the unownables (sky, sea, …).
  const LOCATIVES = ['on-it', 'in-it', 'into-it', 'onto-it', 'out-of-it', 'off-it', 'in-them'];
  const MIXED = [
    ...animals.items,
    ...food.items,
    ...family.items,
    ...places.items,
    ...body.items,
    ...nature.items,
    ...clothes.items,
  ];

  it('never pairs a locative carrier with a non-place word (order + build + spell)', () => {
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildWordOrderRound(MIXED, nounConstructions, 6, 8)) {
        if (LOCATIVES.includes(q.construction.id)) expect(q.item.topic).toBe('places');
      }
      for (const q of buildPhraseRound(MIXED, nounConstructions, 6, 4, 8)) {
        if (LOCATIVES.includes(q.construction.id)) {
          expect(q.item.topic).toBe('places');
          for (const o of q.options) expect(o.topic).toBe('places');
        }
      }
      for (const q of buildSpellingPhraseRound(MIXED, nounConstructions, 6, 8)) {
        if (LOCATIVES.includes(q.construction.id)) expect(q.item.topic).toBe('places');
      }
    }
  });

  it('never claims to own the sky (possession excludes unownables)', () => {
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildPhraseRound(MIXED, nounConstructions, 6, 4, 8)) {
        if (q.construction.id.includes('have')) {
          expect(['sky', 'sea', 'rain', 'sun', 'moon']).not.toContain(q.item.id);
        }
      }
    }
  });

  it('matches the locative CASE to the place’s shape TAG (no "on the room")', () => {
    // Surface cases (on/onto/off) only take words tagged 'surface'; container
    // cases (in/into/out-of) only take words tagged 'container'. A place tagged
    // BOTH (box, bed, car, basket) is allowed in either. Checked over build+order.
    const SURFACE_CASES = ['on-it', 'onto-it', 'off-it'];
    const CONTAINER_CASES = ['in-it', 'into-it', 'out-of-it', 'in-them'];
    for (let r = 0; r < RUNS; r++) {
      const rounds = [
        ...buildPhraseRound(MIXED, nounConstructions, 6, 4, 8),
        ...buildWordOrderRound(MIXED, nounConstructions, 6, 8),
      ];
      for (const q of rounds) {
        if (SURFACE_CASES.includes(q.construction.id)) {
          expect(q.item.tags, `${q.item.id} in ${q.construction.id}`).toContain('surface');
        }
        if (CONTAINER_CASES.includes(q.construction.id)) {
          expect(q.item.tags, `${q.item.id} in ${q.construction.id}`).toContain('container');
        }
      }
    }
  });

  it('lets a BOTH-tagged place (car) play in surface AND container cases', () => {
    // The point of tags over exclude-lists: car is on-top-able and in-able.
    const car = places.items.find((i) => i.id === 'car')!;
    expect(car.tags).toEqual(expect.arrayContaining(['surface', 'container']));
  });
});

describe('adjective + noun pairings make sense (agreement game)', () => {
  it('only pairs animate-only adjectives with living things', () => {
    const ANIMATE_ONLY = ['happy', 'tired', 'hungry', 'cute', 'kind'];
    // Non-animate nouns (clothes) must never draw an animate-only adjective.
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildAgreementRound(adjectives.items, clothes.items, 6, 3)) {
        expect(ANIMATE_ONLY).not.toContain(q.adjective.id);
      }
    }
    // Animals CAN (so the animate adjectives still get used somewhere).
    const usedOnAnimals = new Set<string>();
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildAgreementRound(adjectives.items, animals.items, 6, 3)) {
        usedOnAnimals.add(q.adjective.id);
      }
    }
    expect(ANIMATE_ONLY.some((id) => usedOnAnimals.has(id))).toBe(true);
  });

  it('only pairs fast/slow with things that move (living things, or a vehicle)', () => {
    const MOVEMENT_ONLY = ['fast', 'slow'];
    // Body parts (bone, muscle, tooth…) can't be fast/slow — "nopea luu".
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildAgreementRound(adjectives.items, body.items, 6, 3)) {
        expect(MOVEMENT_ONLY).not.toContain(q.adjective.id);
      }
    }
    // Animals CAN (so fast/slow still gets used somewhere).
    const usedOnAnimals = new Set<string>();
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildAgreementRound(adjectives.items, animals.items, 6, 3)) {
        usedOnAnimals.add(q.adjective.id);
      }
    }
    expect(MOVEMENT_ONLY.some((id) => usedOnAnimals.has(id))).toBe(true);
  });
});

describe('tricky distractors (the L4+ near-miss lever)', () => {
  it('clusters counting distractors within ±2 of the true count', () => {
    for (let r = 0; r < RUNS; r++) {
      // maxCount 10 keeps plenty of counts available on both sides.
      for (const q of buildCountingRound(numbers.items, animals.items, 6, 3, 10, true)) {
        for (const opt of q.numberOptions) {
          if (opt.id === q.number.id) continue;
          expect(
            Math.abs((opt.value ?? 0) - (q.number.value ?? 0)),
            `count ${opt.value} too far from ${q.number.value}`,
          ).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it('slips a DIFFERENT verb of the same person into conjugation rounds', () => {
    let foreignSeen = 0;
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildConjugationRound(verbs.items, 6, 4, undefined, true)) {
        // Exactly one correct answer, all forms distinct.
        expect(q.options.filter((o) => o.correct)).toHaveLength(1);
        expect(new Set(q.options.map((o) => o.form)).size).toBe(q.options.length);
        // The foreign tile shares the target's person but not its form.
        const foreign = q.options.filter((o) => o.person === q.person && !o.correct);
        foreignSeen += foreign.length;
        expect(foreign.length).toBeLessThanOrEqual(1);
      }
    }
    expect(foreignSeen).toBeGreaterThan(0);
  });

  it('mixes a wrong-NUMBER form of the target case into agreement rounds', () => {
    let wrongNumberSeen = 0;
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildAgreementRound(adjectives.items, animals.items, 6, 4, 'singular', 7, true)) {
        expect(q.options.filter((o) => o.correct)).toHaveLength(1);
        expect(new Set(q.options.map((o) => o.form)).size).toBe(q.options.length);
        wrongNumberSeen += q.options.filter((o) => o.num === 'plural').length;
      }
    }
    expect(wrongNumberSeen).toBeGreaterThan(0);
  });
});

describe('the MatchTheWord case ramp (maxCases)', () => {
  it('confines low-level questions to the first cases of the ordered list', () => {
    // maxCases 3 (floored at optionCount 3) = nominative/genitive/partitive.
    const EARLY = ['nominative', 'genitive', 'partitive'];
    for (let r = 0; r < RUNS; r++) {
      for (const q of buildAgreementRound(adjectives.items, animals.items, 6, 3, 'singular', 3)) {
        expect(EARLY).toContain(q.case);
        for (const o of q.options) expect(EARLY).toContain(o.caseId);
      }
    }
  });
});

describe('familiarity weighting (weigh) in target selection', () => {
  it('biases listen targets toward seen words without excluding unseen ones', () => {
    // Weigh one specific animal very heavily: it should appear as a target in
    // nearly every round, while other words still show up too.
    const heavy = animals.items[0].id;
    const weigh = (i: { id: string }) => (i.id === heavy ? 1000 : 1);
    let heavyRounds = 0;
    const others = new Set<string>();
    for (let r = 0; r < RUNS; r++) {
      const round = buildListenRound(animals.items, 3, 3, false, weigh);
      if (round.some((q) => q.target.id === heavy)) heavyRounds++;
      for (const q of round) if (q.target.id !== heavy) others.add(q.target.id);
    }
    expect(heavyRounds).toBeGreaterThan(RUNS * 0.9); // ~always drawn
    expect(others.size).toBeGreaterThan(0); // nothing is ever excluded
  });
});

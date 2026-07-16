import type {
  CaseId,
  Construction,
  GrammaticalNumber,
  LexicalItem,
  Person,
  PersonId,
  Polarity,
  SentenceConstruction,
  Tier,
  VerbTense,
} from '../content/types';
import { caseFormOf, commandFor, conjugatedClause, englishSentenceFor, formFor, PERSONS, sentenceFor, suitsSlot, verbForm } from '../content/types';
import {
  isAnimateOnlyAdjective,
  isAnimateTopic,
  isMovementOnlyAdjective,
  canDescribeMovement,
  isCommandVerb,
} from '../content/semantics';
import type { DialogueExchange, DialogueLine } from '../content/dialogues';
import { personalizeLine } from '../content/dialogues';
import type { Conversation } from '../content/conversations';
import { kidSafeExamples } from '../content/examples';
import type { Example } from '../content/types';
import { sample, shuffle, weightedSample } from '../util/shuffle';

// Round builders. These ONLY select, shuffle, and pair existing human-generated
// content — the Finnish slot forms come from the sourced inflection tables via
// formFor(); nothing here generates or inflects Finnish.

/**
 * Optional word-selection bias for a builder's TARGET draws (distractors stay
 * uniform/tricky). The games pass `familiarityWeigher(child.srs)` here so
 * already-met words come around more often without ever excluding new ones.
 * Builders stay pure — the weights arrive as an argument.
 */
export type WeighFn = (item: LexicalItem) => number;

export interface ListenQuestion {
  target: LexicalItem;
  options: LexicalItem[];
}

/**
 * `n` distractors, preferring the confusable `near` subset and backfilling
 * from the rest — the "tricky" lever's engine. `near` must be a subset of
 * `others`.
 */
function pickPreferring<T extends { id: string }>(
  others: readonly T[],
  near: readonly T[],
  n: number,
): T[] {
  const fromNear = sample(near, n);
  if (fromNear.length >= n) return fromNear;
  const taken = new Set(fromNear.map((i) => i.id));
  return [...fromNear, ...sample(others.filter((i) => !taken.has(i.id)), n - fromNear.length)];
}

export function buildListenRound(
  items: readonly LexicalItem[],
  questionCount: number,
  optionCount: number,
  tricky = false,
  weigh?: WeighFn,
): ListenQuestion[] {
  const targets = weightedSample(items, Math.min(questionCount, items.length), weigh);
  return targets.map((target) => {
    const others = items.filter((i) => i.id !== target.id);
    // Tricky: prefer same-topic distractors (cat vs dog, not cat vs sock) so
    // the wrong answers are actually confusable.
    const near = tricky ? others.filter((i) => i.topic && i.topic === target.topic) : [];
    const distractors = pickPreferring(others, near, optionCount - 1);
    return { target, options: shuffle([target, ...distractors]) };
  });
}

// "Name it" (production recall) reuses buildListenRound verbatim: the question
// shape { target, options } is identical, only the render inverts — the picture
// becomes the prompt and the words become the options. See NameIt.tsx.

// --- Speaking ("Sano se") -------------------------------------------------
//
// Say-it targets: a Finnish string to pronounce, shown with a picture + gloss
// and modeled by TTS. Words for a vocab pool (no constructions), or full carrier
// phrases when constructions are given — so the SAME node content the child is
// learning is what they practice saying. Reuses the phrase-pairing + semantic
// gate from buildPhraseRound; nothing here generates Finnish.

export interface SayTarget {
  /** The Finnish word or phrase to pronounce. */
  say: string;
  /** English gloss shown/narrated for context. */
  gloss: string;
  emoji?: string;
  /** SRS id (the item), when there's a single one to credit. */
  attemptId?: string;
}

/**
 * Speaking lags production: even on a high-level node, the child is only asked
 * to SAY the simple frames ("Tämä on kissa", "Pidän kissasta"), never the
 * advanced case gymnastics a WRITTEN capstone reaches ("Kissat ovat
 * laatikoissa"). Capping the spoken tier keeps every target pronounceable —
 * and keeps child-voice ASR (already unreliable) from being handed a mouthful.
 */
export const SAY_MAX_TIER = 3;

export function buildSayRound(
  items: readonly LexicalItem[],
  constructions: readonly Construction[],
  questionCount: number,
  maxTier: Tier = 4,
  weigh?: WeighFn,
): SayTarget[] {
  if (constructions.length > 0) {
    const spokenTier = Math.min(maxTier, SAY_MAX_TIER) as Tier;
    const byTier = constructions.filter((c) => c.tier <= spokenTier);
    const allowed = byTier.length > 0 ? byTier : constructions;
    const pool: { construction: Construction; item: LexicalItem }[] = [];
    for (const construction of allowed) {
      for (const item of items) {
        if (formFor(item, construction) && suitsSlot(item, construction))
          pool.push({ construction, item });
      }
    }
    return weightedSample(
      pool,
      Math.min(questionCount, pool.length),
      weigh && ((p) => weigh(p.item)),
    ).map(({ construction, item }) => ({
      say: sentenceFor(item, construction),
      gloss: englishSentenceFor(item, construction),
      emoji: item.emoji,
      attemptId: item.id,
    }));
  }

  // Bare-word mode: say the sourced nominative for each picked item.
  return weightedSample(items, Math.min(questionCount, items.length), weigh).map((it) => ({
    say: it.fi,
    gloss: it.en,
    emoji: it.emoji,
    attemptId: it.id,
  }));
}

// --- Authentic reading (real example sentences) --------------------------
//
// Read/hear a REAL sourced example sentence and tap the picture it's about —
// comprehensible input with genuine Finnish, not a generated carrier phrase.
// Only kid-safe examples are used (see content/examples.ts); the English is
// revealed by the UI after the answer, so the child parses the Finnish first.

export interface ReadingQuestion {
  /** A real, kid-safe example sentence ({ fi, en }). */
  sentence: Example;
  /** The item the sentence features — its picture is the answer. */
  item: LexicalItem;
  /** Picture options (item + distractors). */
  options: LexicalItem[];
}

export function buildReadingRound(
  items: readonly LexicalItem[],
  questionCount: number,
  optionCount: number,
  tricky = false,
  weigh?: WeighFn,
): ReadingQuestion[] {
  const picturable = items.filter((i) => i.emoji);
  const withExamples = picturable.filter((i) => kidSafeExamples(i).length > 0);
  const chosen = weightedSample(withExamples, Math.min(questionCount, withExamples.length), weigh);
  return chosen.map((item) => {
    const sentence = sample(kidSafeExamples(item), 1)[0];
    const others = picturable.filter((i) => i.id !== item.id);
    const near = tricky ? others.filter((i) => i.topic && i.topic === item.topic) : [];
    const distractors = pickPreferring(others, near, optionCount - 1);
    return { sentence, item, options: shuffle([item, ...distractors]) };
  });
}

// --- Conversations (choose the right reply) ------------------------------
//
// Hear/read the other speaker's line, pick the appropriate reply. Distractors
// are real Finnish for OTHER moments, so the skill is pragmatic ("what do you
// say back?"), not spotting broken Finnish. Content is human-authored.

export interface DialogueQuestion {
  prompt: DialogueLine;
  /** The correct reply. */
  reply: DialogueLine;
  /** Reply + distractors, shuffled. */
  options: DialogueLine[];
}

export function buildDialogueRound(
  exchanges: readonly DialogueExchange[],
  questionCount: number,
  optionCount: number,
  maxTier: Tier = 4,
  // The active child's name — fills any {name} placeholder ("Nimeni on ___")
  // via personalizeLine. Falls back to the original vetted name when empty.
  childName = '',
): DialogueQuestion[] {
  const byTier = exchanges.filter((e) => e.tier <= maxTier);
  const allowed = byTier.length > 0 ? byTier : exchanges;
  const chosen = sample(allowed, Math.min(questionCount, allowed.length));
  return chosen.map((ex) => {
    // The exchange's own wrong replies, backfilled with other exchanges' correct
    // replies (real Finnish, just wrong for THIS prompt). Deduped by text.
    const seen = new Set([ex.reply.fi]);
    const pool: DialogueLine[] = [];
    for (const r of [...ex.distractors, ...allowed.filter((e) => e.id !== ex.id).map((e) => e.reply)]) {
      if (!seen.has(r.fi)) {
        seen.add(r.fi);
        pool.push(r);
      }
    }
    const distractors = sample(pool, Math.max(0, optionCount - 1));
    const options = shuffle([ex.reply, ...distractors]).map((l) => personalizeLine(l, childName));
    return {
      prompt: personalizeLine(ex.prompt, childName),
      reply: personalizeLine(ex.reply, childName),
      options,
    };
  });
}

// --- Small talk (hold a multi-turn conversation) -------------------------
//
// One tier-gated scene per segment; the child steers it turn by turn. Each turn
// presents the partner's line + reply tiles (the fitting reply plus real
// wrong-move distractors, backfilled from the scene's other lines to fill the
// tiles). A fixed golden path — no branching — so every scene is one vetted
// script. Content is the hand-authored conversation registry.

export interface ConversationTurnQuestion {
  partner: DialogueLine;
  reply: DialogueLine;
  /** Reply + distractors, shuffled. */
  options: DialogueLine[];
}

export interface ConversationRound {
  id: string;
  titleFi: string;
  titleEn: string;
  icon: string;
  partnerIcon: string;
  turns: ConversationTurnQuestion[];
}

export function buildConversation(
  scenes: readonly Conversation[],
  optionCount: number,
  maxTier: Tier = 4,
  // See buildDialogueRound — same {name} personalization.
  childName = '',
): ConversationRound | null {
  const byTier = scenes.filter((s) => s.tier <= maxTier);
  const allowed = byTier.length > 0 ? byTier : scenes;
  if (allowed.length === 0) return null;
  const scene = sample(allowed, 1)[0];

  // A scene-wide pool of plausible wrong lines (every reply + authored
  // distractor in the scene) to backfill each turn's tiles beyond its own two.
  const scenePool: DialogueLine[] = [];
  const poolSeen = new Set<string>();
  for (const t of scene.turns) {
    for (const line of [t.reply, ...t.distractors]) {
      if (!poolSeen.has(line.fi)) {
        poolSeen.add(line.fi);
        scenePool.push(line);
      }
    }
  }

  const turns = scene.turns.map((t) => {
    // Prefer the turn's own distractors, then backfill from the scene pool —
    // never the correct reply, deduped by text.
    const seen = new Set([t.reply.fi]);
    const pool: DialogueLine[] = [];
    for (const line of [...t.distractors, ...scenePool]) {
      if (!seen.has(line.fi)) {
        seen.add(line.fi);
        pool.push(line);
      }
    }
    const distractors = sample(pool, Math.max(0, optionCount - 1));
    const options = shuffle([t.reply, ...distractors]).map((l) => personalizeLine(l, childName));
    return {
      partner: personalizeLine(t.partner, childName),
      reply: personalizeLine(t.reply, childName),
      options,
    };
  });

  return {
    id: scene.id,
    titleFi: scene.titleFi,
    titleEn: scene.titleEn,
    icon: scene.icon,
    partnerIcon: scene.partnerIcon,
    turns,
  };
}

// --- Sentence listening comprehension ------------------------------------
//
// Hear a full carrier sentence ("Tämä on kissa."), tap the picture it's about.
// Unlike buildListenRound (one word), this trains parsing a whole utterance for
// its key noun. Options are picturable items; distractors prefer the same topic
// when tricky, so the child must hear the noun, not guess from the pictures.

export interface ComprehensionQuestion {
  /** The full Finnish carrier sentence to play (e.g. "Tämä on kissa."). */
  sentence: string;
  /** The item whose PICTURE is the correct answer. */
  item: LexicalItem;
  /** Picture options (item + distractors); the child taps the matching one. */
  options: LexicalItem[];
}

export function buildComprehensionRound(
  items: readonly LexicalItem[],
  constructions: readonly Construction[],
  questionCount: number,
  optionCount: number,
  maxTier: Tier = 4,
  tricky = false,
  weigh?: WeighFn,
): ComprehensionQuestion[] {
  // Only picturable items can be tiles; only (construction, item) pairs that
  // resolve AND make sense (semantic gate) become questions — tier-gated like
  // the phrase builder so simple patterns come first.
  const picturable = items.filter((i) => i.emoji);
  const byTier = constructions.filter((c) => c.tier <= maxTier);
  const allowed = byTier.length > 0 ? byTier : constructions;
  const pool: { construction: Construction; item: LexicalItem }[] = [];
  for (const construction of allowed) {
    for (const item of picturable) {
      if (formFor(item, construction) && suitsSlot(item, construction))
        pool.push({ construction, item });
    }
  }

  const chosen = weightedSample(
    pool,
    Math.min(questionCount, pool.length),
    weigh && ((p) => weigh(p.item)),
  );
  return chosen.map(({ construction, item }) => {
    const others = picturable.filter((i) => i.id !== item.id);
    const near = tricky ? others.filter((i) => i.topic && i.topic === item.topic) : [];
    const distractors = pickPreferring(others, near, optionCount - 1);
    return {
      sentence: sentenceFor(item, construction),
      item,
      options: shuffle([item, ...distractors]),
    };
  });
}

// --- TPR commands ("Tee näin!") -------------------------------------------
//
// Hear an imperative ("Hyppää!"), tap the action picture — Total Physical
// Response, the classic listening format for this age, over the sourced
// imperative paradigm. Same question shape as sentence comprehension (a spoken
// Finnish utterance → picture options), so it reuses the ListenSentence game.
// Only curated, kid-actable verbs qualify (see COMMAND_VERB_IDS in
// semantics.ts) — never states or feelings.

export function buildCommandRound(
  verbs: readonly LexicalItem[],
  questionCount: number,
  optionCount: number,
  tricky = false,
  weigh?: WeighFn,
): ComprehensionQuestion[] {
  // Commandable + picturable + the sourced imperative actually present.
  const pool = verbs.filter((v) => v.emoji && isCommandVerb(v.id) && commandFor(v));
  const targets = weightedSample(pool, Math.min(questionCount, pool.length), weigh);
  return targets.map((target) => {
    const others = pool.filter((v) => v.id !== target.id);
    // Tricky: prefer commands that SOUND confusable — imperatives sharing the
    // first letter ("juokse" vs "juo"), so the child must hear the whole word.
    const initial = commandFor(target)!.charAt(0).toLowerCase();
    const near = tricky
      ? others.filter((v) => commandFor(v)!.charAt(0).toLowerCase() === initial)
      : [];
    const distractors = pickPreferring(others, near, optionCount - 1);
    return {
      sentence: commandFor(target)!,
      item: target,
      options: shuffle([target, ...distractors]),
    };
  });
}

// --- Yes/no questions ("Onko tämä kissa?") --------------------------------
//
// The child's first interrogative: a picture is shown, a -ko question is
// spoken/read ("Onko tämä kissa?"), and the child answers Kyllä/Ei. Half the
// questions ask about the shown thing (yes), half about a different word (no)
// — so the skill is understanding the ASKED word, not pattern-matching. The
// question text comes from the is-this carrier via sentenceFor (sourced
// nominative slot); nothing is generated.

export interface YesNoQuestion {
  /** The item whose PICTURE is shown. */
  shown: LexicalItem;
  /** The item the question asks about (may or may not be `shown`). */
  asked: LexicalItem;
  /** True when asked === shown (the correct answer is Kyllä). */
  isMatch: boolean;
  /** The full spoken/read question, e.g. "Onko tämä kissa?". */
  question: string;
}

export function buildYesNoRound(
  items: readonly LexicalItem[],
  construction: Construction,
  questionCount: number,
  tricky = false,
  weigh?: WeighFn,
): YesNoQuestion[] {
  // Only picturable items with the needed (nominative) form can be shown/asked.
  const pool = items.filter((i) => i.emoji && formFor(i, construction));
  if (pool.length < 2) return [];
  const shownPicks = weightedSample(pool, Math.min(questionCount, pool.length), weigh);
  return shownPicks.map((shown, i) => {
    // Alternate yes/no deterministically-ish (shuffle order already randomizes
    // which item lands where), so a round is never all-yes or all-no.
    const isMatch = i % 2 === 0;
    let asked = shown;
    if (!isMatch) {
      const others = pool.filter((it) => it.id !== shown.id);
      // Tricky: the asked word shares the shown item's topic (cat shown, "Onko
      // tämä koira?") — same-neighborhood, so the word must really be parsed.
      const near = tricky ? others.filter((it) => it.topic && it.topic === shown.topic) : [];
      asked = pickPreferring(others, near, 1)[0] ?? shown;
    }
    return {
      shown,
      asked,
      isMatch: asked.id === shown.id,
      question: sentenceFor(asked, construction),
    };
  });
}

export interface PhraseQuestion {
  construction: Construction;
  /** The correct item; its slot form is formFor(item, construction). */
  item: LexicalItem;
  /** Candidate items; each tile shows formFor(option, construction). */
  options: LexicalItem[];
}

export function buildPhraseRound(
  items: readonly LexicalItem[],
  constructions: readonly Construction[],
  questionCount: number,
  optionCount: number,
  maxTier: Tier = 4,
  tricky = false,
  weigh?: WeighFn,
): PhraseQuestion[] {
  // Only pair a construction with items that have the needed form AND make
  // sense in the slot (semantic gate). Gate by tier when a skill mixes tiers,
  // but never gate a curated set down to nothing — a single higher-tier
  // construction (its own skill) must still play.
  const byTier = constructions.filter((c) => c.tier <= maxTier);
  const allowed = byTier.length > 0 ? byTier : constructions;
  const pool: { construction: Construction; item: LexicalItem }[] = [];
  for (const construction of allowed) {
    for (const item of items) {
      if (formFor(item, construction) && suitsSlot(item, construction))
        pool.push({ construction, item });
    }
  }

  const chosen = weightedSample(
    pool,
    Math.min(questionCount, pool.length),
    weigh && ((p) => weigh(p.item)),
  );
  return chosen.map(({ construction, item }) => {
    // Distractors pass the same gate, so every tile plausibly fits the phrase
    // and the challenge stays about the grammar, not spotting the absurd word.
    const others = items.filter(
      (i) => i.id !== item.id && formFor(i, construction) && suitsSlot(i, construction),
    );
    // Tricky: prefer confusable tiles — same topic, or a similar word shape
    // (the slot form's length within ±2 of the answer's).
    const answerLen = formFor(item, construction)!.length;
    const near = tricky
      ? others.filter(
          (i) =>
            (i.topic && i.topic === item.topic) ||
            Math.abs(formFor(i, construction)!.length - answerLen) <= 2,
        )
      : [];
    const distractors = pickPreferring(others, near, optionCount - 1);
    return { construction, item, options: shuffle([item, ...distractors]) };
  });
}

// --- Review (spaced repetition) ------------------------------------------
//
// Listen-and-tap over a caller-chosen set of due items (see src/game/srs.ts).
// The targets are already selected/ordered by the scheduler, so this only pairs
// each with distractors drawn from the whole reviewable pool. Selection order is
// preserved (not reshuffled) so the most-overdue items come first.

export interface ReviewQuestion {
  target: LexicalItem;
  options: LexicalItem[];
}

export function buildReviewRound(
  targets: readonly LexicalItem[],
  pool: readonly LexicalItem[],
  optionCount: number,
): ReviewQuestion[] {
  return targets.map((target) => {
    const distractors = sample(
      pool.filter((i) => i.id !== target.id),
      optionCount - 1,
    );
    return { target, options: shuffle([target, ...distractors]) };
  });
}

// --- Grammar review (a due construction's spaced-repetition question) ------
//
// A construction met in play earns its own SRS schedule (`con:<id>`, written by
// the carrier-phrase games). When it comes due, Review tests THE GRAMMAR: the
// carrier is shown with its slot blank, and the child picks the item form that
// completes it correctly — the same word across different sourced cases, so
// exactly one option carries the case ending the carrier requires. All forms
// are looked up (caseFormOf); nothing is generated.

/** The case pool grammar-review distractors draw from (the everyday cases). */
const GRAMMAR_REVIEW_CASES: CaseId[] = [
  'nominative',
  'genitive',
  'partitive',
  'elative',
  'inessive',
  'illative',
  'adessive',
  'allative',
  'ablative',
];

export interface GrammarReviewQuestion {
  construction: Construction;
  /** The item filling the slot (its emoji/gloss anchor the meaning). */
  item: LexicalItem;
  /** The correct sourced slot form, e.g. "kissasta". */
  answer: string;
  /** Form options (the same item across cases), shuffled; one is `answer`. */
  options: string[];
}

export function buildGrammarReviewQuestion(
  construction: Construction,
  items: readonly LexicalItem[],
  optionCount: number,
  weigh?: WeighFn,
): GrammarReviewQuestion | null {
  // Any suitable item works — the grammar, not the word, is under review.
  const usable = items.filter((i) => formFor(i, construction) && suitsSlot(i, construction));
  // A few draws: some items' paradigms spell several cells identically, which
  // can leave too few DISTINCT distractor forms — try another item.
  const candidates = weightedSample(usable, Math.min(usable.length, 8), weigh);
  for (const item of candidates) {
    const answer = formFor(item, construction)!;
    const seen = new Set([answer]);
    const distractorForms: string[] = [];
    for (const c of GRAMMAR_REVIEW_CASES) {
      const form = caseFormOf(item, c, construction.number);
      if (form && !seen.has(form)) {
        seen.add(form);
        distractorForms.push(form);
      }
    }
    if (distractorForms.length < optionCount - 1) continue;
    const options = shuffle([answer, ...sample(distractorForms, optionCount - 1)]);
    return { construction, item, answer, options };
  }
  return null;
}

// --- Spelling --------------------------------------------------------------
//
// Drill: hear/see a word, type it. Just a selection of targets — no slot
// lookup needed since the child types item.fi directly (already the
// sourced nominative singular form).

export function buildSpellingRound(
  items: readonly LexicalItem[],
  questionCount: number,
  weigh?: WeighFn,
): LexicalItem[] {
  return weightedSample(items, Math.min(questionCount, items.length), weigh);
}

// Spelling, grammar apex: type the INFLECTED slot form, not the bare noun. Each
// question pairs an item with a (tier-gated) carrier phrase; the typed target is
// formFor(item, construction) — the sourced case form (e.g. "laatikoissa"),
// never generated. Only single-word forms are used (no spaced counted phrases),
// so the on-screen keyboard stays a single-token drill.

export interface SpellingPhraseQuestion {
  construction: Construction;
  item: LexicalItem;
  /** The sourced inflected form the child types, e.g. "pöydällä". */
  target: string;
}

export function buildSpellingPhraseRound(
  items: readonly LexicalItem[],
  constructions: readonly Construction[],
  questionCount: number,
  maxTier: Tier = 4,
  weigh?: WeighFn,
): SpellingPhraseQuestion[] {
  // Tier-gate a mixed set, but never down to nothing (see buildPhraseRound).
  const byTier = constructions.filter((c) => c.tier <= maxTier);
  const allowed = byTier.length > 0 ? byTier : constructions;
  const pool: SpellingPhraseQuestion[] = [];
  for (const construction of allowed) {
    for (const item of items) {
      if (!suitsSlot(item, construction)) continue;
      const target = formFor(item, construction);
      // Single-token forms only — skip any multi-word slot form.
      if (target && !target.includes(' ')) pool.push({ construction, item, target });
    }
  }
  return weightedSample(
    pool,
    Math.min(questionCount, pool.length),
    weigh && ((q) => weigh(q.item)),
  );
}

// --- Word order ----------------------------------------------------------
//
// Drill: tokenize a full carrier-phrase sentence (before words + slot form +
// after words, punctuation attached to the last token) into chips; the child
// taps them back into order. The slot form is looked up via formFor() —
// never generated. Reuses the same construction+item data as Build a Phrase.

export interface WordOrderToken {
  /** Position in the correct sentence order (0-based). */
  id: number;
  text: string;
}

export interface WordOrderQuestion {
  construction: Construction;
  item: LexicalItem;
  /** Tokens in correct order. */
  tokens: WordOrderToken[];
  /** Same tokens, shuffled for display; the child taps them back into order. */
  shuffled: WordOrderToken[];
  /** The full sentence, for replay/speech. */
  sentence: string;
}

export function buildWordOrderRound(
  items: readonly LexicalItem[],
  constructions: readonly Construction[],
  questionCount: number,
  maxTier: Tier = 4,
  weigh?: WeighFn,
): WordOrderQuestion[] {
  // Tier-gate a mixed set, but never down to nothing (see buildPhraseRound).
  const byTier = constructions.filter((c) => c.tier <= maxTier);
  const allowed = byTier.length > 0 ? byTier : constructions;
  const pool: { construction: Construction; item: LexicalItem }[] = [];
  for (const construction of allowed) {
    for (const item of items) {
      if (formFor(item, construction) && suitsSlot(item, construction))
        pool.push({ construction, item });
    }
  }

  const chosen = weightedSample(
    pool,
    Math.min(questionCount, pool.length),
    weigh && ((p) => weigh(p.item)),
  );
  return chosen.map(({ construction, item }) => {
    const form = formFor(item, construction)!;
    const words = [
      ...(construction.before?.split(' ') ?? []),
      form,
      ...(construction.after?.split(' ') ?? []),
    ];
    const sentence = words.join(' ') + (construction.punct ?? '');
    const last = words.length - 1;
    const tokens: WordOrderToken[] = words.map((text, id) => ({
      id,
      text: id === last ? text + (construction.punct ?? '') : text,
    }));
    let shuffled = shuffle(tokens);
    // A shuffle that lands back in the original order isn't much of a puzzle.
    while (tokens.length > 1 && shuffled.every((t, i) => t.id === tokens[i].id)) {
      shuffled = shuffle(tokens);
    }
    return { construction, item, tokens, shuffled, sentence };
  });
}

// --- Two-slot counting: number + counted noun ---------------------------

export interface CountingQuestion {
  number: LexicalItem; // the target count word
  noun: LexicalItem; // the target counted noun
  numberOptions: LexicalItem[];
  nounOptions: LexicalItem[];
}

/** From this maxCount up (L6+ in the level table), the round tens join the
 *  draw — see the note inside buildCountingRound. */
export const TENS_FROM_MAX_COUNT = 16;

export function buildCountingRound(
  numbers: readonly LexicalItem[],
  nouns: readonly LexicalItem[],
  questionCount: number,
  optionCount: number,
  maxCount: number,
  tricky = false,
  weigh?: WeighFn,
): CountingQuestion[] {
  // The countable range 1..maxCount — plus, at the top of the ladder
  // (maxCount ≥ 16, i.e. L6+), the round tens (30, 40, … 100). Their noun
  // grammar is the same sourced partitive singular ("kolmekymmentä kissaa"),
  // so the tens taught by the Numbers warm-up become usable counting
  // grammar; the game shows them as a numeral (nobody counts 70 emoji).
  const counts = numbers.filter((n) => {
    const v = n.value ?? 0;
    if (v >= 1 && v <= maxCount) return true;
    return maxCount >= TENS_FROM_MAX_COUNT && v > 20 && v <= 100 && v % 10 === 0;
  });

  const out: CountingQuestion[] = [];
  for (let i = 0; i < questionCount; i++) {
    const number = sample(counts, 1)[0];
    const noun = weightedSample(nouns, 1, weigh)[0];
    if (!number || !noun) break;
    const otherCounts = counts.filter((n) => n.id !== number.id);
    // Tricky: the wrong counts cluster around the true one (±2), so the child
    // must actually count — 3 vs 4, not 3 vs 9.
    const nearCounts = tricky
      ? otherCounts.filter(
          (n) => Math.abs((n.value ?? 0) - (number.value ?? 0)) <= 2,
        )
      : [];
    const numberOptions = shuffle([
      number,
      ...pickPreferring(otherCounts, nearCounts, optionCount - 1),
    ]);
    const otherNouns = nouns.filter((x) => x.id !== noun.id);
    const nearNouns = tricky ? otherNouns.filter((x) => x.topic && x.topic === noun.topic) : [];
    const nounOptions = shuffle([noun, ...pickPreferring(otherNouns, nearNouns, optionCount - 1)]);
    out.push({ number, noun, numberOptions, nounOptions });
  }
  return out;
}

// --- Two-slot adjective + noun agreement --------------------------------
//
// Drill: the adjective is shown in a target case (the context); the learner
// picks the noun form that AGREES (same case). Distractors are the same noun in
// other cases, so the skill being practised is the agreement itself. All forms
// are looked up from the sourced tables — never generated. (Not wired into the
// UI yet; this just produces exercise data for a later activity.)

const AGREEMENT_CASES: CaseId[] = [
  'nominative',
  'genitive',
  'partitive',
  'inessive',
  'illative',
  'adessive',
  'allative',
];

export interface AgreementOption {
  caseId: CaseId;
  /** The option's grammatical number — tricky rounds mix in wrong-NUMBER forms. */
  num: GrammaticalNumber;
  form: string;
  correct: boolean;
}

export interface AgreementQuestion {
  adjective: LexicalItem;
  noun: LexicalItem;
  case: CaseId;
  number: GrammaticalNumber;
  /** Adjective in the target case — the given context, e.g. "isossa". */
  adjForm: string;
  /** Correct, agreeing noun form, e.g. "kissassa". */
  answer: string;
  /** Shuffled noun forms across cases; exactly one agrees. */
  options: AgreementOption[];
}

export function buildAgreementRound(
  adjectives: readonly LexicalItem[],
  nouns: readonly LexicalItem[],
  questionCount: number,
  optionCount: number,
  number: GrammaticalNumber = 'singular',
  maxCases: number = AGREEMENT_CASES.length,
  tricky = false,
  weigh?: WeighFn,
): AgreementQuestion[] {
  // The case ramp: rotate through only the FIRST `maxCases` of the ordered
  // list — three cases at level 1, the full seven by the top of the ladder.
  // Floor at optionCount: a question needs (optionCount - 1) case distractors.
  const allowedCases = AGREEMENT_CASES.slice(0, Math.max(optionCount, maxCases));

  const out: AgreementQuestion[] = [];
  let guard = 0;
  while (out.length < questionCount && guard++ < questionCount * 8) {
    // Pick the noun first, then draw an adjective that makes SENSE for it:
    // animate-only adjectives (happy, tired, kind…) go only with living things,
    // so "kiltti sänky" (a kind bed) never happens; movement-only adjectives
    // (fast, slow) go only with things that move, so "nopea luu" (a fast bone)
    // never happens either. Size/colour/age apply to anything. Falls back to
    // the full set if a noun somehow rules out every adjective.
    const noun = weightedSample(nouns, 1, weigh)[0];
    if (!noun) break;
    const adjPool = adjectives.filter((a) => {
      if (isAnimateOnlyAdjective(a.id) && !isAnimateTopic(noun.topic)) return false;
      if (isMovementOnlyAdjective(a.id) && !canDescribeMovement(noun.topic, noun.id)) return false;
      return true;
    });
    const adjective = sample(adjPool.length > 0 ? adjPool : adjectives, 1)[0];
    if (!adjective) break;

    const nounCases = allowedCases.filter((c) => caseFormOf(noun, c, number));
    const targetCandidates = nounCases.filter((c) => caseFormOf(adjective, c, number));
    if (!targetCandidates.length) continue;

    const targetCase = sample(targetCandidates, 1)[0];
    const adjForm = caseFormOf(adjective, targetCase, number)!;
    const answer = caseFormOf(noun, targetCase, number)!;

    // Distractors: the same noun in OTHER cases (the agreement skill itself)…
    const caseCandidates: AgreementOption[] = nounCases
      .filter((c) => c !== targetCase)
      .map((c) => ({ caseId: c, num: number, form: caseFormOf(noun, c, number)!, correct: false }));
    // …and, when tricky, the same CASE in the wrong NUMBER ("kissassa" vs
    // "kissoissa") — the sharpest near-miss the paradigm offers.
    const otherNumber: GrammaticalNumber = number === 'singular' ? 'plural' : 'singular';
    const wrongNumberForm = tricky ? caseFormOf(noun, targetCase, otherNumber) : undefined;
    if (wrongNumberForm && wrongNumberForm !== answer) {
      caseCandidates.push({
        caseId: targetCase,
        num: otherNumber,
        form: wrongNumberForm,
        correct: false,
      });
    }
    // No duplicate surface forms (a paradigm can spell two cells identically),
    // and never a tile that spells exactly like the answer.
    const seen = new Set([answer]);
    const distinct = caseCandidates.filter((o) => {
      if (seen.has(o.form)) return false;
      seen.add(o.form);
      return true;
    });
    if (distinct.length < optionCount - 1) continue;
    const distractors = sample(distinct, optionCount - 1);

    const options = shuffle<AgreementOption>([
      { caseId: targetCase, num: number, form: answer, correct: true },
      ...distractors,
    ]);

    out.push({ adjective, noun, case: targetCase, number, adjForm, answer, options });
  }
  return out;
}

// --- Verb conjugation by person ------------------------------------------
//
// Drill: given a pronoun (e.g. "minä") and a verb, pick the correctly
// conjugated form. Distractors are the same verb in other persons, so the skill
// is the personal ending. Forms are looked up, never generated. (Not wired into
// the UI yet.)

export interface ConjugationOption {
  person: PersonId;
  form: string;
  correct: boolean;
}

export interface ConjugationQuestion {
  verb: LexicalItem;
  tense: VerbTense;
  polarity: Polarity;
  person: PersonId;
  /** Subject pronoun shown as the prompt, e.g. "minä". */
  pronoun: string;
  pronounEn: string;
  /** Correct conjugated form, e.g. "syön". */
  answer: string;
  /** Full clause, e.g. "minä syön". */
  clause: string;
  /** Shuffled forms of the same verb in different persons; one is correct. */
  options: ConjugationOption[];
}

export const DEFAULT_CONJUGATION_COMBOS: { tense: VerbTense; polarity: Polarity }[] = [
  { tense: 'present', polarity: 'positive' },
];

export function buildConjugationRound(
  verbs: readonly LexicalItem[],
  questionCount: number,
  optionCount: number,
  combos: { tense: VerbTense; polarity: Polarity }[] = DEFAULT_CONJUGATION_COMBOS,
  tricky = false,
  weigh?: WeighFn,
): ConjugationQuestion[] {
  const out: ConjugationQuestion[] = [];
  let guard = 0;
  while (out.length < questionCount && guard++ < questionCount * 8) {
    const verb = weightedSample(verbs, 1, weigh)[0];
    const combo = sample(combos, 1)[0];
    if (!verb || !combo) break;

    const persons = PERSONS.filter((p) => verbForm(verb, combo.tense, combo.polarity, p.id));
    if (persons.length < optionCount) continue;

    const target = sample(persons, 1)[0];
    const answer = verbForm(verb, combo.tense, combo.polarity, target.id)!;
    const clause = conjugatedClause(verb, combo.tense, combo.polarity, target.id)!;

    // Tricky: one distractor is a DIFFERENT verb conjugated for the SAME
    // person — the ending matches the pronoun, so the child must recognize
    // the verb itself, not just the ending.
    let foreign: ConjugationOption | undefined;
    if (tricky) {
      // Never collide with ANY of this verb's person forms — every tile must
      // stay visually distinct and unambiguous.
      const verbForms = new Set(
        persons.map((p) => verbForm(verb, combo.tense, combo.polarity, p.id)),
      );
      const otherVerb = sample(
        verbs.filter((v) => {
          if (v.id === verb.id) return false;
          const f = verbForm(v, combo.tense, combo.polarity, target.id);
          return !!f && !verbForms.has(f);
        }),
        1,
      )[0];
      if (otherVerb) {
        foreign = {
          person: target.id,
          form: verbForm(otherVerb, combo.tense, combo.polarity, target.id)!,
          correct: false,
        };
      }
    }
    const sameVerbCount = optionCount - 1 - (foreign ? 1 : 0);
    const distractors = sample(
      persons.filter((p) => p.id !== target.id),
      sameVerbCount,
    );

    const options = shuffle<ConjugationOption>([
      { person: target.id, form: answer, correct: true },
      ...distractors.map((p) => ({
        person: p.id,
        form: verbForm(verb, combo.tense, combo.polarity, p.id)!,
        correct: false,
      })),
      ...(foreign ? [foreign] : []),
    ]);

    out.push({
      verb,
      tense: combo.tense,
      polarity: combo.polarity,
      person: target.id,
      pronoun: target.fi,
      pronounEn: target.en,
      answer,
      clause,
      options,
    });
  }
  return out;
}

// --- Multi-slot sentences (advanced; content authored later) -------------
//
// Build word-order rounds from `SentenceConstruction` templates that have two+
// inflected slots (recipient + object, adjective+noun object, verb chains, …).
// Every slot's form is looked up from the sourced tables (or PERSONS) — never
// generated; agreement (adjective→noun, verb→subject person) is resolved by
// copying tags, not by rule. Emits the SAME shape the Word Order game renders,
// so no new UI is needed. The templates list is empty today (see
// `src/content/sentences.ts`); this returns [] until content is authored.

export interface SentencePools {
  nouns: readonly LexicalItem[];
  verbs: readonly LexicalItem[];
  adjectives: readonly LexicalItem[];
  numbers: readonly LexicalItem[];
}

/** A normalized "put the words in order" question (shared by phrases + sentences). */
export interface SentenceQuestion {
  /** English gloss shown as a hint. */
  hintEn: string;
  /** The full target sentence (for text-to-speech). */
  sentence: string;
  /** Tokens in correct order. */
  tokens: WordOrderToken[];
  /** Same tokens shuffled for display. */
  shuffled: WordOrderToken[];
  /** Optional item id for SRS crediting (sentences span several words, so none). */
  attemptId?: string;
  /**
   * Optional GRAMMAR SRS id (`con:<constructionId>`, carrier-phrase mode only)
   * — schedules the construction itself for spaced review, in parallel with
   * the word's own schedule. See the grammar format in ReviewActivity.
   */
  grammarId?: string;
  /**
   * A picture of the sentence's main object (carrier-phrase mode only — a
   * multi-slot sentence has no single item to depict, so this stays unset there).
   */
  emoji?: string;
}

function sentencePool(
  pool: SentencePools,
  which: NonNullable<SentenceConstruction['slots'][number]['pool']>,
): readonly LexicalItem[] {
  switch (which) {
    case 'verbs':
      return pool.verbs;
    case 'adjectives':
      return pool.adjectives;
    case 'numbers':
      return pool.numbers;
    default:
      return pool.nouns;
  }
}

interface SlotPick {
  item?: LexicalItem;
  person?: Person;
  case?: CaseId;
  number?: GrammaticalNumber;
}

/** Narrow a slot's pool to its curated candidate ids, when `pickFrom` is set. */
function candidates(
  from: readonly LexicalItem[],
  pickFrom?: string[],
): readonly LexicalItem[] {
  if (!pickFrom || pickFrom.length === 0) return from;
  const allowed = from.filter((i) => pickFrom.includes(i.id));
  return allowed.length > 0 ? allowed : from;
}

interface ResolvedSentence {
  words: string[];
  picks: Record<string, SlotPick>;
}

/**
 * Resolve one template into its ordered surface words + the concrete picks
 * behind them, choosing a word per slot and looking up every form. Returns null
 * if any slot can't be filled (so the builder simply tries another sample).
 */
function resolveSentenceInternal(
  template: SentenceConstruction,
  pools: SentencePools,
): ResolvedSentence | null {
  const picks: Record<string, SlotPick> = {};

  // 1) Choose a concrete word/pronoun for each slot + its base case/number.
  //    A slot may pin one word (`fixedId`), swap among a curated set
  //    (`pickFrom`), or draw from its whole pool.
  for (const slot of template.slots) {
    if (slot.role === 'pronoun') {
      const person = slot.fixedId
        ? PERSONS.find((p) => p.id === slot.fixedId)
        : sample(PERSONS, 1)[0];
      if (!person) return null;
      picks[slot.id] = { person };
    } else if (slot.role === 'verb') {
      const item = slot.fixedId
        ? pools.verbs.find((i) => i.id === slot.fixedId)
        : sample(candidates(pools.verbs, slot.pickFrom), 1)[0];
      if (!item) return null;
      picks[slot.id] = { item };
    } else {
      const from = sentencePool(pools, slot.pool ?? 'nouns');
      const item = slot.fixedId
        ? from.find((i) => i.id === slot.fixedId)
        : sample(candidates(from, slot.pickFrom), 1)[0];
      if (!item) return null;
      picks[slot.id] = {
        item,
        case: slot.case ?? 'nominative',
        number: slot.number ?? 'singular',
      };
    }
  }

  // 2) Adjectives copy their noun's case + number (agreement).
  for (const slot of template.slots) {
    if (slot.role === 'adjective' && slot.agreesWith) {
      const ref = picks[slot.agreesWith];
      if (ref) {
        picks[slot.id].case = ref.case;
        picks[slot.id].number = ref.number;
      }
    }
  }

  // 3) Compute each slot's surface form.
  const surface: Record<string, string> = {};
  for (const slot of template.slots) {
    const pick = picks[slot.id];
    if (slot.role === 'pronoun') {
      surface[slot.id] = pick.person?.fi ?? '';
    } else if (slot.role === 'verb') {
      if (!pick.item) return null;
      if (slot.verbSlotForm === 'infinitive') {
        surface[slot.id] = pick.item.fi;
      } else {
        const subject = slot.agreesWith ? picks[slot.agreesWith] : undefined;
        const personId = subject?.person?.id ?? '3sg';
        const form = verbForm(
          pick.item,
          slot.tense ?? 'present',
          slot.polarity ?? 'positive',
          personId,
        );
        if (!form) return null;
        surface[slot.id] = form;
      }
    } else {
      if (!pick.item) return null;
      const form = caseFormOf(pick.item, pick.case ?? 'nominative', pick.number ?? 'singular');
      if (!form) return null;
      surface[slot.id] = form;
    }
  }

  // 4) Assemble ordered words; split on spaces so multi-word forms become chips.
  const words: string[] = [];
  for (const tok of template.tokens) {
    const text = 'fixed' in tok ? tok.fixed : surface[tok.slot] ?? '';
    for (const w of text.split(' ').filter(Boolean)) words.push(w);
  }
  return words.length > 0 ? { words, picks } : null;
}

/** Fill `{slotId}` placeholders in the gloss from each pick's English gloss. */
function glossFor(template: SentenceConstruction, picks: Record<string, SlotPick>): string {
  return template.en.replace(/\{(\w+)\}/g, (whole, id: string) => {
    const pick = picks[id];
    if (!pick) return whole;
    return pick.person?.en ?? pick.item?.en ?? whole;
  });
}

/**
 * Resolve one template into its ordered surface words, looking up every form.
 * Returns null if any slot can't be filled.
 */
export function resolveSentenceWords(
  template: SentenceConstruction,
  pools: SentencePools,
): string[] | null {
  return resolveSentenceInternal(template, pools)?.words ?? null;
}

/**
 * Like `resolveSentenceWords`, but also returns the English gloss with any
 * `{slot}` placeholders filled from the words actually picked — so a swapped
 * noun updates the hint shown to the child.
 */
export function resolveSentence(
  template: SentenceConstruction,
  pools: SentencePools,
): { words: string[]; gloss: string } | null {
  const resolved = resolveSentenceInternal(template, pools);
  if (!resolved) return null;
  return { words: resolved.words, gloss: glossFor(template, resolved.picks) };
}

export function buildSentenceRound(
  templates: readonly SentenceConstruction[],
  pools: SentencePools,
  questionCount: number,
  maxTier: Tier = 4,
): SentenceQuestion[] {
  const byTier = templates.filter((t) => t.tier <= maxTier);
  const allowed = byTier.length > 0 ? byTier : templates;
  if (allowed.length === 0) return [];

  const out: SentenceQuestion[] = [];
  let guard = 0;
  while (out.length < questionCount && guard++ < questionCount * 8) {
    const template = sample(allowed, 1)[0];
    if (!template) break;
    const resolved = resolveSentenceInternal(template, pools);
    if (!resolved) continue;
    const { words, picks } = resolved;
    const gloss = glossFor(template, picks);

    // A sentence has no single item, but crediting its main NOUN back to SRS
    // (so speaking/ordering a sentence reinforces that word's schedule) is more
    // useful than crediting nothing. Prefer a noun slot; fall back to any slot
    // that resolved to a lexical item.
    const nounSlot =
      template.slots.find((s) => s.role === 'noun') ??
      template.slots.find((s) => picks[s.id]?.item);
    const attemptId = nounSlot ? picks[nounSlot.id]?.item?.id : undefined;

    const last = words.length - 1;
    const tokens: WordOrderToken[] = words.map((text, id) => ({
      id,
      text: id === last ? text + (template.punct ?? '') : text,
    }));
    let shuffled = shuffle(tokens);
    while (tokens.length > 1 && shuffled.every((t, i) => t.id === tokens[i].id)) {
      shuffled = shuffle(tokens);
    }

    out.push({
      hintEn: gloss,
      sentence: words.join(' ') + (template.punct ?? ''),
      tokens,
      shuffled,
      attemptId,
    });
  }
  return out;
}

/** A full sentence to type out from its English gloss (the sentence typing apex). */
export interface SentenceSpellingQuestion {
  /** English gloss shown as the prompt (the child produces the Finnish from this). */
  gloss: string;
  /** The full Finnish sentence to type, trailing punctuation included. */
  text: string;
}

export function buildSentenceSpellingRound(
  templates: readonly SentenceConstruction[],
  pools: SentencePools,
  questionCount: number,
  maxTier: Tier = 4,
): SentenceSpellingQuestion[] {
  const byTier = templates.filter((t) => t.tier <= maxTier);
  const allowed = byTier.length > 0 ? byTier : templates;
  if (allowed.length === 0) return [];

  const out: SentenceSpellingQuestion[] = [];
  let guard = 0;
  while (out.length < questionCount && guard++ < questionCount * 8) {
    const template = sample(allowed, 1)[0];
    if (!template) break;
    const resolved = resolveSentence(template, pools);
    if (!resolved) continue;
    const { words, gloss } = resolved;
    out.push({ gloss, text: words.join(' ') + (template.punct ?? '') });
  }
  return out;
}

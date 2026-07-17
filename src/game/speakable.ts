import type { LexicalItem, Tier } from '../content/types';
import type { SkillNode } from './path';
import {
  buildSayRound,
  buildCommandRound,
  buildCountingRound,
  buildAgreementRound,
  buildConjugationRound,
  buildSentenceRound,
  SAY_MAX_TIER,
  type SayTarget,
  type WeighFn,
} from './round';
import {
  animals,
  food,
  family,
  places,
  body,
  nature,
  clothes,
  numbers,
  adjectives,
  verbs,
} from '../content';
import { nounConstructions } from '../content/constructions';
import { sentenceConstructions } from '../content/sentences';
import { kidSafeExamples } from '../content/examples';
import { dialogues, NAME_PLACEHOLDER } from '../content/dialogues';
import { conversations } from '../content/conversations';
import { stories } from '../content/stories';
import { countingPhrase } from '../content/types';
import { englishVerbClause } from '../content/englishVerb';
import { sample } from '../util/shuffle';

// "Sano se" for EVERY skill: each node's own Finnish becomes something the child
// says — bare words for vocab, and the node's real phrases/sentences for the
// grammar nodes ("Tämä on lintu", "kolme kissaa", "iso kissa", "minä syön", a
// read example, a dialogue reply). This is pure routing: every string comes from
// the existing sourced builders/helpers, never generated here.
//
// A sayability guard keeps speaking approachable for a young child + unreliable
// child-voice ASR — a spoken target is only surfaced if it's short (≤ 5 words)
// and (for carrier phrases) within SAY_MAX_TIER. Anything longer just isn't
// spoken; the node still plays its normal games.

const N = 8;
const SAY_MAX_WORDS = 5;

const NOUNS: LexicalItem[] = [
  ...animals.items,
  ...food.items,
  ...family.items,
  ...places.items,
  ...body.items,
  ...nature.items,
  ...clothes.items,
];
const SENTENCE_POOLS = {
  nouns: NOUNS,
  verbs: verbs.items,
  adjectives: adjectives.items,
  numbers: numbers.items,
};

const wordCount = (s: string) => s.trim().split(/\s+/).length;
export const saySafe = (fi: string): boolean => !!fi && wordCount(fi) <= SAY_MAX_WORDS;
// Dialogue/conversation lines come straight from the registries here, where the
// child's-name slot is still the literal "{name}" placeholder — those lines
// must never become say targets (the child would be told to say "{name}").
const keep = (targets: SayTarget[]): SayTarget[] =>
  targets.filter((t) => saySafe(t.say) && !t.say.includes(NAME_PLACEHOLDER));
const pluralEn = (noun: LexicalItem) => noun.english?.plural ?? `${noun.en}s`;

function constructionsForNode(skill: SkillNode) {
  const ids = skill.content.constructionIds;
  return ids ? nounConstructions.filter((c) => ids.includes(c.id)) : nounConstructions;
}

// Speaking climbs with the child's level, like every other game: at the starter
// band a phrase node is downshifted to its bare WORDS ("kissa"), the core band
// speaks the node's own phrase ("kolme kissaa"), and the stretch band adds the
// hardest reach — for a dialogue node, saying BOTH sides of the exchange.
type SayBand = 'starter' | 'core' | 'stretch';
function sayBand(level: number): SayBand {
  if (level <= 3) return 'starter';
  if (level <= 5) return 'core';
  return 'stretch';
}

/**
 * The spoken targets for a node — routed by its activity to the node's own
 * sourced Finnish, and ramped by `level` (word → phrase → whole exchange).
 * Returns up to `N` sayable `SayTarget`s (the game slices to its round length).
 * `items` is the node's resolved pool.
 */
export function speakableTargetsFor(
  skill: SkillNode,
  items: readonly LexicalItem[],
  maxTier: Tier,
  level = 5,
  weigh?: WeighFn,
): SayTarget[] {
  const tier = Math.min(maxTier, SAY_MAX_TIER) as Tier;
  const band = sayBand(level);
  // Scope noun-driven speaking (counting, agreement) to the node's OWN pool when
  // it has one, so "Count & say" speaks its vocabulary — not every noun in the
  // game. Falls back to the full mix for nodes without a resolved pool.
  const nouns = items.length > 0 ? items : NOUNS;
  // Communicative nodes (dialogue / small talk / stories) have no vocab pool of
  // their own, so a "bare word" would be a random NOUN — off-topic on a
  // Greetings or Story node. They always route to their replies/pages; the
  // starter downshift is only for the word-based games, where saying the single
  // word is the gentlest step.
  const communicative =
    skill.activity === 'dialogue' ||
    skill.activity === 'conversation' ||
    skill.activity === 'story';
  const routed =
    band === 'starter' && !communicative
      ? keep(buildSayRound(items, [], N, tier, weigh))
      : routeTargets(skill, items, nouns, tier, band, weigh);
  // Never hand SayIt an empty round (it would render nothing and stall the
  // rotation): if the routed targets all failed the sayability guard, fall back
  // to the node's bare words, which are always short enough to say.
  if (routed.length > 0) return routed;
  return keep(buildSayRound(items, [], N, tier, weigh));
}

function routeTargets(
  skill: SkillNode,
  items: readonly LexicalItem[],
  nouns: readonly LexicalItem[],
  tier: Tier,
  band: SayBand,
  weigh?: WeighFn,
): SayTarget[] {
  switch (skill.activity) {
    // Carrier-phrase nodes: "Tämä on lintu", "Minulla on kissa", "Pidän kissasta".
    case 'build':
    case 'order':
      return keep(buildSayRound(items, constructionsForNode(skill), N, tier, weigh));

    // Counting: "kolme kissaa" (small counts stay sayable).
    case 'count':
      return keep(
        buildCountingRound(numbers.items, nouns, N, 3, 5, false, weigh).map((q) => ({
          say: countingPhrase(q.number, q.noun),
          gloss:
            (q.number.value ?? 0) === 1
              ? `${q.number.en} ${q.noun.en}`
              : `${q.number.en} ${pluralEn(q.noun)}`,
          emoji: q.noun.emoji,
          attemptId: q.noun.id,
        })),
      );

    // Agreement: "iso kissa" (nominative only, for a clean gloss + sayability).
    case 'match':
      return keep(
        buildAgreementRound(adjectives.items, nouns, N * 4, 3, 'singular', 1, false, weigh)
          .filter((q) => q.case === 'nominative')
          .slice(0, N)
          .map((q) => ({
            say: `${q.adjForm} ${q.answer}`,
            gloss: `${q.adjective.en} ${q.noun.en}`,
            emoji: q.noun.emoji,
            attemptId: q.noun.id,
          })),
      );

    // Commands: say the imperative itself ("Hyppää!") — one short, punchy
    // word, ideal speaking material. The English imperative is the base verb
    // (a lookup, not morphology): "Jump!".
    case 'command':
      return keep(
        buildCommandRound(items, N, 3, false, weigh).map((q) => ({
          say: q.sentence,
          gloss: q.item.en.charAt(0).toUpperCase() + q.item.en.slice(1) + '!',
          emoji: q.item.emoji,
          attemptId: q.item.id,
        })),
      );

    // Yes/no questions: say the question itself ("Onko tämä kissa?") — asking
    // is production too. Routed through the node's own is-this carrier.
    case 'yesno':
      return keep(buildSayRound(items, constructionsForNode(skill), N, tier, weigh));

    // Conjugation: "minä syön" (present positive — the easy frames to say).
    case 'conjugate':
      return keep(
        buildConjugationRound(
          verbs.items,
          N,
          3,
          [{ tense: 'present', polarity: 'positive' }],
          false,
          weigh,
        ).map((q) => ({
          say: q.clause,
          gloss: englishVerbClause(q.pronounEn, q.verb.en, q.verb.english, q.tense, q.polarity, q.person),
          attemptId: q.verb.id,
        })),
      );

    // Reading: say a real, kid-safe example sentence.
    case 'reading': {
      const withEx = items.filter((i) => kidSafeExamples(i).length > 0);
      return keep(
        sample(withEx, Math.min(N, withEx.length)).map((it) => {
          const ex = sample(kidSafeExamples(it), 1)[0];
          return { say: ex.fi, gloss: ex.en, emoji: it.emoji, attemptId: it.id };
        }),
      );
    }

    // Full sentences (only the ones short enough to say survive the guard).
    // The sentence's main noun (now surfaced by buildSentenceRound) credits SRS,
    // so saying a sentence reinforces that word's schedule.
    case 'sentence':
      return keep(
        buildSentenceRound(sentenceConstructions, SENTENCE_POOLS, N, tier).map((q) => ({
          say: q.sentence,
          gloss: q.hintEn,
          attemptId: q.attemptId,
        })),
      );

    // Communicative: say the fitting reply — and at the stretch band, say BOTH
    // sides of the exchange (the greeting, then the reply), so the child speaks
    // the whole turn, not just the answer.
    case 'dialogue': {
      const inTier = dialogues.filter((d) => d.tier <= tier);
      if (band === 'stretch') {
        return keep(
          sample(inTier, Math.ceil(N / 2)).flatMap((d) => [
            { say: d.prompt.fi, gloss: d.prompt.en },
            { say: d.reply.fi, gloss: d.reply.en },
          ]),
        );
      }
      return keep(sample(inTier, N).map((d) => ({ say: d.reply.fi, gloss: d.reply.en })));
    }
    case 'conversation':
      return keep(
        sample(
          // Tier-gate like `dialogue` above, so a beginner isn't handed a reply
          // from a harder scene.
          conversations.filter((c) => c.tier <= tier).flatMap((c) => c.turns.map((t) => t.reply)),
          N,
        ).map((r) => ({ say: r.fi, gloss: r.en })),
      );

    // Story time: say the story's own lines — short authored sentences the
    // child just followed for meaning, ideal to then produce aloud.
    case 'story':
      return keep(
        sample(
          stories.filter((s) => s.tier <= tier).flatMap((s) => s.pages),
          N,
        ).map((p) => ({ say: p.fi, gloss: p.en, emoji: p.emoji })),
      );

    // Vocab (listen / name / spell): say the bare word.
    default:
      return keep(buildSayRound(items, [], N, tier, weigh));
  }
}

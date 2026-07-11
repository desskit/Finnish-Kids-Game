import type { LexicalItem, Tier } from '../content/types';
import type { SkillNode } from './path';
import {
  buildSayRound,
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
import { dialogues } from '../content/dialogues';
import { conversations } from '../content/conversations';
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
const keep = (targets: SayTarget[]): SayTarget[] => targets.filter((t) => saySafe(t.say));
const pluralEn = (noun: LexicalItem) => noun.english?.plural ?? `${noun.en}s`;

function constructionsForNode(skill: SkillNode) {
  const ids = skill.content.constructionIds;
  return ids ? nounConstructions.filter((c) => ids.includes(c.id)) : nounConstructions;
}

/**
 * The spoken targets for a node — routed by its activity to the node's own
 * sourced Finnish. Returns up to `N` sayable `SayTarget`s (the game slices to
 * its round length). `items` is the node's resolved pool.
 */
export function speakableTargetsFor(
  skill: SkillNode,
  items: readonly LexicalItem[],
  maxTier: Tier,
  weigh?: WeighFn,
): SayTarget[] {
  const tier = Math.min(maxTier, SAY_MAX_TIER) as Tier;
  switch (skill.activity) {
    // Carrier-phrase nodes: "Tämä on lintu", "Minulla on kissa", "Pidän kissasta".
    case 'build':
    case 'order':
      return keep(buildSayRound(items, constructionsForNode(skill), N, tier, weigh));

    // Counting: "kolme kissaa" (small counts stay sayable).
    case 'count':
      return keep(
        buildCountingRound(numbers.items, NOUNS, N, 3, 5, false, weigh).map((q) => ({
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
        buildAgreementRound(adjectives.items, NOUNS, N * 4, 3, 'singular', 1, false, weigh)
          .filter((q) => q.case === 'nominative')
          .slice(0, N)
          .map((q) => ({
            say: `${q.adjForm} ${q.answer}`,
            gloss: `${q.adjective.en} ${q.noun.en}`,
            emoji: q.noun.emoji,
            attemptId: q.noun.id,
          })),
      );

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
    case 'sentence':
      return keep(
        buildSentenceRound(sentenceConstructions, SENTENCE_POOLS, N, tier).map((q) => ({
          say: q.sentence,
          gloss: q.hintEn,
        })),
      );

    // Communicative: say the fitting reply.
    case 'dialogue':
      return keep(
        sample(
          dialogues.filter((d) => d.tier <= tier),
          N,
        ).map((d) => ({ say: d.reply.fi, gloss: d.reply.en })),
      );
    case 'conversation':
      return keep(
        sample(
          conversations.flatMap((c) => c.turns.map((t) => t.reply)),
          N,
        ).map((r) => ({ say: r.fi, gloss: r.en })),
      );

    // Vocab (listen / name / spell): say the bare word.
    default:
      return keep(buildSayRound(items, [], N, tier, weigh));
  }
}

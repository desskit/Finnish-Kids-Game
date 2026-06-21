import type { Construction, LexicalItem, PhraseFill } from '../content/types';
import { sample, shuffle } from '../util/shuffle';

// Round builders. These ONLY select, shuffle, and pair existing human-authored
// content — they never create or modify Finnish text.

export interface ListenQuestion {
  target: LexicalItem;
  options: LexicalItem[];
}

export function buildListenRound(
  items: readonly LexicalItem[],
  questionCount: number,
  optionCount: number,
): ListenQuestion[] {
  const targets = sample(items, Math.min(questionCount, items.length));
  return targets.map((target) => {
    const distractors = sample(
      items.filter((i) => i.id !== target.id),
      optionCount - 1,
    );
    return { target, options: shuffle([target, ...distractors]) };
  });
}

export interface PhraseQuestion {
  construction: Construction;
  item: LexicalItem;
  answer: PhraseFill;
  options: PhraseFill[];
}

export function buildPhraseRound(
  items: readonly LexicalItem[],
  constructions: readonly Construction[],
  questionCount: number,
  optionCount: number,
): PhraseQuestion[] {
  const itemById = new Map(items.map((i) => [i.id, i]));

  // Every (construction, fill) pair that we have both a form and a picture for.
  const pool: { construction: Construction; fill: PhraseFill }[] = [];
  for (const construction of constructions) {
    for (const fill of construction.fills) {
      if (itemById.has(fill.itemId)) pool.push({ construction, fill });
    }
  }

  const chosen = sample(pool, Math.min(questionCount, pool.length));
  return chosen.map(({ construction, fill }) => {
    const distractors = sample(
      construction.fills.filter((f) => f.itemId !== fill.itemId),
      optionCount - 1,
    );
    return {
      construction,
      item: itemById.get(fill.itemId)!,
      answer: fill,
      options: shuffle([fill, ...distractors]),
    };
  });
}

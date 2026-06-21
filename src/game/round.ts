import type { Construction, LexicalItem } from '../content/types';
import { formFor } from '../content/types';
import { sample, shuffle } from '../util/shuffle';

// Round builders. These ONLY select, shuffle, and pair existing human-generated
// content — the Finnish slot forms come from the sourced inflection tables via
// formFor(); nothing here generates or inflects Finnish.

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
): PhraseQuestion[] {
  // Only pair a construction with items that actually have the needed form.
  const pool: { construction: Construction; item: LexicalItem }[] = [];
  for (const construction of constructions) {
    for (const item of items) {
      if (formFor(item, construction)) pool.push({ construction, item });
    }
  }

  const chosen = sample(pool, Math.min(questionCount, pool.length));
  return chosen.map(({ construction, item }) => {
    const distractors = sample(
      items.filter((i) => i.id !== item.id && formFor(i, construction)),
      optionCount - 1,
    );
    return { construction, item, options: shuffle([item, ...distractors]) };
  });
}

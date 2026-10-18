// Words never offered as choices in the same question, because a child
// couldn't tell which one is meant:
//
// - two words for nearly the same thing: ankka (a farmyard duck) and sorsa (a
//   wild duck), pallo and jalkapallo (a soccer ball is a ball too);
// - one word's picture shows the other: the boy drawn for "brother" is also a
//   "son" and a "child", the rain picture is a cloud with drops, the yard is a
//   house behind a fence;
// - pictures that look alike: soup and porridge are both steaming bowls, the
//   happy, cute, kind, calm and funny faces are all smiling.
//
// A question about one never shows another of its group as a choice, and two
// of a group never stand side by side as wrong answers. Each word still meets
// every other word in other questions.

export const NEVER_TOGETHER: readonly (readonly string[])[] = [
  ['duck', 'wild-duck'],

  // People: the boys, the girls, and the child who could be any of them —
  // the cousin and the captain (Leo in a cap) are children too.
  ['brother', 'son', 'child', 'head', 'tummy', 'cousin', 'captain'],
  ['sister', 'pupil', 'child', 'cousin'],
  ['baby', 'child'],
  // The relatives: Täti could be Äiti, Setä (a moustache) Isä or Grandpa; the
  // family picture is Isä, Äiti and Aino.
  ['aunt', 'mother'],
  ['uncle', 'father', 'grandfather'],
  ['family', 'mother', 'father', 'sister'],

  // Body: a picture that holds another.
  ['mouth', 'tongue', 'tooth'],
  ['hand', 'finger'],
  ['foot', 'knee'],
  ['head', 'hair'],

  // Food that looks alike.
  ['apple', 'tomato'],
  ['butter', 'cheese'],
  ['soup', 'porridge'],
  ['porridge', 'rice'],
  ['cake', 'birthday'],

  // Clothes and things.
  ['shirt', 'blouse'],
  ['ball', 'football'],
  ['music', 'guitar'],
  ['music', 'piano'],
  ['book', 'homework'],
  ['pencil', 'homework'],
  ['paper', 'test', 'homework'],
  ['picture', 'sky'],
  ['table', 'candle'],

  // Places: a room is any room, a taxi is a car, a shop and a market both sell.
  ['room', 'bedroom', 'bathroom'],
  ['bed', 'bedroom'],
  ['house', 'yard'],
  ['car', 'taxi'],
  ['shop', 'market'],
  ['school', 'station'],
  ['tree', 'forest'],
  ['lake', 'island'],

  // Sky and seasons: the cloud is in the rain, the sun is in the day.
  ['cloud', 'rain', 'sky'],
  ['sun', 'sky'],
  ['cloud', 'daytime'],
  ['sun', 'daytime', 'summer'],
  ['moon', 'star', 'night'],
  ['morning', 'evening'],
  ['snow', 'winter'],
  ['leaf', 'autumn'],

  // Verbs that look alike, or mean nearly the same.
  ['run', 'run-away'],
  ['play', 'throw'],
  ['draw', 'paint'],
  ['help', 'give'],
  ['make', 'build', 'fix'],
  ['smile', 'laugh', 'like'],
  ['love', 'hug'],
  ['love', 'like'],
  ['sing', 'listen'],
  ['speak', 'say', 'ask', 'answer', 'sing'],
  ['look', 'see', 'search'],
  ['wash', 'clean'],
  ['close', 'lock'],
  ['teach', 'learn'],
  ['hear', 'listen', 'ear'],
  ['get', 'give'],
  ['carry', 'bring', 'help', 'lift'],
  ['remember', 'forget'],
  ['forget', 'ask'],
  ['live', 'house'],
  ['order', 'speak', 'say'],
  ['touch', 'hand', 'finger'],
  ['lift', 'strong', 'answer'],

  // Describing words: the smiling faces, and two kinds of big.
  ['happy', 'cute', 'kind', 'calm', 'funny'],
  ['tired', 'calm'],
  ['hungry', 'funny'],
  ['big', 'tall'],

  // The feelings that happen to you, beside the ones they're nearly the same
  // as (sleepy and tired) or look like (the bored face's heavy eyes).
  ['scared', 'nervous'],
  ['sleepy', 'tired', 'sleep'],
  ['giggly', 'laugh', 'funny', 'happy', 'smile'],
  ['teary', 'cry', 'sad'],
  ['boring', 'tired', 'calm', 'sleepy'],
];

const RIVALS = new Map<string, Set<string>>();
for (const group of NEVER_TOGETHER) {
  for (const a of group) {
    for (const b of group) {
      if (a === b) continue;
      if (!RIVALS.has(a)) RIVALS.set(a, new Set());
      RIVALS.get(a)!.add(b);
    }
  }
}

/** Whether two words must never share a question. */
export function rivals(a: string, b: string): boolean {
  return RIVALS.get(a)?.has(b) ?? false;
}

/** `pool` without the words that mustn't share a question with `id`. */
export function apartFrom<T extends { id: string }>(id: string, pool: readonly T[]): T[] {
  return RIVALS.has(id) ? pool.filter((i) => !rivals(id, i.id)) : [...pool];
}

/**
 * Wrong answers with no two rivals among them: a later rival is swapped for
 * the first unused word from `pool` that clashes with none (or left out).
 */
export function keepApart<T extends { id: string }>(picked: readonly T[], pool: readonly T[]): T[] {
  const out: T[] = [];
  for (const item of picked) {
    if (!out.some((o) => rivals(o.id, item.id))) {
      out.push(item);
      continue;
    }
    const swap = pool.find((p) => !picked.some((q) => q.id === p.id) && !out.some((o) => o.id === p.id || rivals(o.id, p.id)));
    if (swap) out.push(swap);
  }
  return out;
}

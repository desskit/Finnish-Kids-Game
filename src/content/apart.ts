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
  // Winter clothes beside the everyday ones: a beanie is a hat (or a cap), a
  // mitten a glove, a sweater a shirt, a raincoat a coat.
  ['beanie', 'hat'],
  ['beanie', 'cap'],
  ['mitten', 'glove'],
  ['sweater', 'shirt', 'blouse'],
  ['raincoat', 'coat'],
  // Meals beside the food on their plates.
  ['breakfast', 'porridge'],
  ['breakfast', 'juice'],
  ['lunch', 'dinner', 'soup'],
  ['evening-snack', 'bread'],
  ['evening-snack', 'milk'],
  ['ball', 'football'],
  ['music', 'guitar'],
  ['music', 'piano'],
  // Toys and instruments: the teddy is a bear, the doll a baby, the toy
  // train a train; a violin is a little guitar, with a note like music's.
  ['teddy', 'bear'],
  ['doll', 'baby'],
  ['toy', 'train'],
  ['violin', 'guitar'],
  ['music', 'violin'],
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
  ['beach', 'sea'],
  ['beach', 'lake'],
  ['beach', 'island'],

  // Sky and seasons: the cloud is in the rain, the sun is in the day.
  ['cloud', 'rain', 'sky'],
  ['sun', 'sky'],
  ['cloud', 'daytime'],
  ['sun', 'daytime', 'summer'],
  ['moon', 'star', 'night'],
  ['morning', 'evening'],
  ['snow', 'winter'],
  ['leaf', 'autumn'],
  // The weather board shows the sun and a cloud; warm is nearly hot.
  ['weather', 'sun'],
  ['weather', 'cloud'],
  ['warm', 'hot'],

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
  // Playing: the board game is a game, the music is music, the yo-yo a toy.
  ['play-game', 'game', 'chess', 'card'],
  ['play-music', 'music', 'sing', 'listen'],
  ['play', 'toy'],
  ['order', 'speak', 'say'],
  ['touch', 'hand', 'finger'],
  // Getting ready: brushing your teeth, pulling on a sweater.
  ['brush', 'tooth'],
  ['brush', 'wash'],
  ['put-on', 'sweater'],
  ['put-on', 'shirt'],
  ['lift', 'strong', 'answer'],

  // Describing words: the smiling faces, and two kinds of big.
  ['happy', 'cute', 'kind', 'calm', 'funny'],
  ['tired', 'calm'],
  ['hungry', 'funny'],
  ['big', 'tall'],
  // The new colors beside the ones they're nearly, and the opposites'
  // pictures: the stubby pencil, the new shoe, the muddy boot.
  ['pink', 'red'],
  ['purple', 'blue'],
  ['short', 'small', 'tall', 'pencil'],
  ['new', 'shoe'],
  ['dirty', 'boot'],

  // The feelings that happen to you, beside the ones they're nearly the same
  // as (sleepy and tired) or look like (the bored face's heavy eyes).
  ['scared', 'nervous'],
  ['sleepy', 'tired', 'sleep'],
  ['giggly', 'laugh', 'funny', 'happy', 'smile'],
  ['teary', 'cry', 'sad'],
  ['boring', 'tired', 'calm', 'sleepy'],

  // School: a toilet is in a bathroom; a notebook is a book (and homework);
  // the chalkboard is a picture on paper, and teach's board; the nurse is a
  // grown-up at school, with a hospital's cross on her bag; recess is a child
  // running out of school. (The daycare, low and bright behind its painted
  // fence, looks like neither the school nor a house.)
  ['restroom', 'bathroom'],
  ['notebook', 'book', 'homework'],
  ['board', 'picture'],
  ['board', 'paper'],
  ['board', 'teach'],
  ['nurse', 'teacher'],
  ['nurse', 'hospital'],
  ['recess', 'run'],
  ['recess', 'school'],
  ['understand', 'remember'],
  ['understand', 'learn'],

  // The Finnish year. Christmas is presents and baubles (and the present
  // give holds); a Christmas tree is a tree, and winter's snowy spruce one
  // too; Santa could be Grandpa, the elf a boy in a red cap, the Easter
  // witch a girl; Easter is a chick and an egg; the cottage and the sauna are
  // houses; the bonfire is a fire.
  ['christmas', 'christmas-tree'],
  ['christmas', 'give'],
  ['christmas-tree', 'tree'],
  ['winter', 'snowman'],
  ['winter', 'forest'],
  ['winter', 'christmas-tree'],
  ['santa', 'elf'],
  ['santa', 'grandfather'],
  ['elf', 'brother', 'child'],
  ['witch', 'sister', 'child'],
  ['easter', 'egg'],
  ['easter', 'chicken'],
  ['easter', 'bird'],
  ['catkin', 'flower'],
  ['catkin', 'spring'],
  ['midsummer', 'summer'],
  ['midsummer', 'lake'],
  ['cottage', 'house', 'yard'],
  ['cottage', 'sauna'],
  ['sauna', 'house'],
  ['bonfire', 'fire', 'warm-up'],
  // Its food: pulla is bread (or cake), the café has a bun; gingerbread is a
  // cookie; the basket is full of blueberries.
  ['bun', 'bread'],
  ['bun', 'cake'],
  ['bun', 'cookie'],
  ['bun', 'cafe'],
  ['gingerbread', 'cookie'],
  ['blueberry', 'basket'],
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

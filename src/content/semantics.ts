// Hand-curated SEMANTIC constraints — kept apart from the sourced Finnish data
// and the grammar rules so a human can eyeball "which pairings make sense" in
// one place. Grammar stays correct no matter what; these lists only stop
// grammatically-valid NONSENSE the mixed pools would otherwise generate, e.g.
// "Kissa on huoneella" (the cat is on the room) or "kiltti sänky" (a kind bed).
//
// All ids below are curation ids from scripts/build-kids-data.mjs.

// --- Places: surfaces vs. containers -------------------------------------
//
// The locative cases split a place into two shapes:
//   • a SURFACE you sit ON / move ONTO / OFF  (adessive / allative / ablative)
//   • a CONTAINER you are IN / go INTO / OUT-OF (inessive / illative / elative)
// Which shape(s) each place supports is now a per-WORD tag ('surface' /
// 'container', many words carry both) — see PLACE_TAGS in
// scripts/build-kids-data.mjs and LexicalItem.tags. The locative carriers gate
// on these via `requiresTags` (constructions.ts), so a place like `car` that's
// tagged BOTH plays in every locative case, while `table` (surface only) never
// gets an "in the table" question.

/** The locative-shape tags a place word may carry. */
export const SURFACE_TAG = 'surface';
export const CONTAINER_TAG = 'container';

// --- Adjectives: animate-only -------------------------------------------
//
// Some adjectives describe a state a LIVING thing has (a happy dog, a tired
// baby) and read as nonsense on an object (a hungry sock, a kind bed). The
// agreement game only pairs these with animals/family; size/colour/age
// adjectives pair with anything.
export const ANIMATE_ONLY_ADJECTIVES = [
  'young',
  'strong',
  'funny',
  'happy',
  'tired',
  'hungry',
  'cute',
  'kind',
  'sad',
  'angry',
  'thirsty',
  'sick',
  'calm',
  'proud',
];

/**
 * Nouns that don't COUNT ("kolme musiikkia", three musics, is nonsense) —
 * mass nouns, subjects, weather and sky things. Counting rounds skip them.
 */
export const NOT_COUNTABLE = [
  'music',
  'math',
  'gym',
  'english',
  'water',
  'milk',
  'juice',
  'rice',
  'porridge',
  'soup',
  'butter',
  'snow',
  'rain',
  'sky',
  'sea',
  'sun',
  'moon',
  'grass',
  'ice',
  'wind',
  // glue is "some glue"; recess is a time of day ("I like recess")
  'glue',
  'recess',
];

export function isCountable(id: string): boolean {
  return !NOT_COUNTABLE.includes(id);
}

/** Foods and pastimes that you like or love AS A KIND, so English drops "the":
 *  "Pidän pitsasta" = "I like pizza", not "I like the pizza". (Other foods go
 *  plural — "I like apples" — and animals keep "the": "I like the cat".) */
export const LIKED_AS_A_KIND = ['pizza', 'ice-cream', 'chocolate', 'bread', 'cheese', 'cake', 'candy', 'football', 'chess', 'hockey'];

/** Topics whose words are living things an animate adjective can describe. */
export const ANIMATE_TOPICS = ['animals', 'family'];

/** True if an adjective (by id) only makes sense describing a living thing. */
export function isAnimateOnlyAdjective(id: string): boolean {
  return ANIMATE_ONLY_ADJECTIVES.includes(id);
}

/** True if a word's topic is a living thing (so animate adjectives fit it). */
export function isAnimateTopic(topic: string | undefined): boolean {
  return !!topic && ANIMATE_TOPICS.includes(topic);
}

// --- Adjectives: movement-only -------------------------------------------
//
// "nopea"/"hidas" (fast/slow) describe something that moves under its own
// power or by design — a fast dog or a fast car makes sense, a fast bone
// ("nopea luu") does not. Living things (animals/family) always qualify;
// among inanimate objects only actual vehicles do, so this is a short,
// explicit id allow-list rather than a whole topic.
export const MOVEMENT_ONLY_ADJECTIVES = ['fast', 'slow'];

/** Non-living item ids that can still plausibly be fast/slow (vehicles). */
const MOVEMENT_ITEM_IDS = ['car'];

/** True if an adjective (by id) only makes sense describing something that moves. */
export function isMovementOnlyAdjective(id: string): boolean {
  return MOVEMENT_ONLY_ADJECTIVES.includes(id);
}

/** True if this specific word (living, or a curated vehicle) can be fast/slow. */
export function canDescribeMovement(topic: string | undefined, itemId: string): boolean {
  return isAnimateTopic(topic) || MOVEMENT_ITEM_IDS.includes(itemId);
}

// --- Adjectives on people, on ideas, and "tall" -----------------------------
//
// Colours describe things and animals: on a person ("valkoinen kaveri") a
// colour would be about skin. Hot / cold describe only THINGS — "kylmä äiti" is
// a cold heart, and "kuuma koira" would read as a hot dog. Nothing physical
// describes an idea ("kylmä matematiikka", cold math; "sininen musiikki"), and
// a school subject takes hardly anything ("iso matematiikka" is nonsense). Big
// and small need something you can count ("iso kakku", never "iso riisi").
// "Iso äiti" and "iso isä" SOUND like isoäiti and isoisä — grandma and grandpa
// — so "big" leaves parents alone. And "pitkä" on an animal or object is LONG,
// not tall ("pitkä koira" is a long dog; a tall house is "korkea"), so "tall"
// stays with people and trees.
export const THING_ONLY_ADJECTIVES = ['red', 'blue', 'yellow', 'green', 'black', 'white', 'brown', 'pink', 'purple', 'gray', 'orange', 'cold', 'hot', 'warm'];
/** Hot / warm / cold: not on anything alive. */
const TEMPERATURE_ADJECTIVES = ['cold', 'hot', 'warm'];
/** Never warm ("kuuma lumi", hot snow), and never cold ("kylmä tuli"). */
const ALWAYS_COLD = ['snow', 'ice', 'ice-cream'];
const ALWAYS_HOT = ['fire', 'sun'];
/** Ideas and activities, not things you can touch. */
export const ABSTRACT_NOUNS = ['music', 'math', 'gym', 'english', 'hobby', 'task', 'homework', 'movie', 'game', 'test', 'class'];
/** The adjectives that do fit an idea: a good game, a big test, an old movie. */
const IDEA_ADJECTIVES = ['good', 'big', 'small', 'old', 'new', 'short', 'easy', 'hard'];
/** School subjects: "hyvä englanti", "vanha musiikki" — and nothing else. A
 *  recess is good or short ("lyhyt välitunti"), never red or old. */
const SUBJECT_ADJECTIVES: Record<string, string[]> = { math: [], gym: [], english: ['good'], music: ['good', 'old'], recess: ['good', 'short'] };
const SIZE_ADJECTIVES = ['big', 'small'];
/** Uncountable, but each one thing with a size: "iso meri", "pieni kuu". */
const ONE_BIG_THING = ['sky', 'sea', 'sun', 'moon'];
/** "Iso äiti" / "iso isä" would be heard as isoäiti / isoisä. */
const PARENTS = ['mother', 'father'];
/** People outside the family topic. */
const PEOPLE_IDS = ['teacher', 'friend', 'pupil', 'nurse'];
/** Things that are tall — "pitkä puu" — rather than long. */
const TALL_THINGS = ['tree'];
// The opposites Describing adds say only what fits them: a new bike, pet,
// friend or game (never new food, a new forest or a new mom); a short pencil,
// skirt, movie or person; an easy or a hard task, test or game; clean or
// dirty clothes, hands, pets, rooms and the things in them.
const NOT_NEW_TOPICS = ['food', 'nature', 'body', 'family', 'time', 'states'];
const NOT_NEW = ['forest', 'field', 'tree'];
const PETS = ['cat', 'dog', 'bunny', 'fish', 'bird', 'mouse', 'horse'];
const SHORT_THINGS = ['pencil', 'snake', 'movie', 'book', 'hair', 'skirt', 'dress', 'scarf', 'tie', 'coat', 'belt', 'train', 'test', 'task', 'homework', 'recess'];
const EASY_OR_HARD = ['task', 'homework', 'test', 'game'];
const CLEAN_OR_DIRTY = [
  'hand', 'foot', 'cat', 'dog', 'pig', 'horse', 'bunny', 'car', 'bike', 'bus', 'taxi', 'room', 'kitchen',
  'bathroom', 'bedroom', 'living-room', 'table', 'chair', 'bed', 'sofa', 'window', 'house', 'yard',
  'backpack', 'ball', 'football', 'spoon', 'fork', 'toy', 'doll', 'teddy', 'water', 'snow', 'restroom',
];

/** Does this adjective make sense on this noun (beyond the animate / movement rules)? */
export function adjectiveFitsNoun(adjId: string, noun: { id: string; topic?: string }): boolean {
  const person = noun.topic === 'family' || PEOPLE_IDS.includes(noun.id);
  const alive = person || isAnimateTopic(noun.topic);
  if (THING_ONLY_ADJECTIVES.includes(adjId) && person) return false;
  if (TEMPERATURE_ADJECTIVES.includes(adjId) && alive) return false;
  if ((adjId === 'hot' || adjId === 'warm') && ALWAYS_COLD.includes(noun.id)) return false;
  if (adjId === 'cold' && ALWAYS_HOT.includes(noun.id)) return false;
  if (ABSTRACT_NOUNS.includes(noun.id) && !IDEA_ADJECTIVES.includes(adjId)) return false;
  const subject = SUBJECT_ADJECTIVES[noun.id];
  if (subject && !subject.includes(adjId)) return false;
  if (SIZE_ADJECTIVES.includes(adjId) && !isCountable(noun.id) && !ONE_BIG_THING.includes(noun.id)) return false;
  if (adjId === 'big' && PARENTS.includes(noun.id)) return false;
  if (adjId === 'tall' && !(person || TALL_THINGS.includes(noun.id))) return false;
  // "Vanha vauva" (an old baby) is a contradiction.
  if (adjId === 'old' && noun.id === 'baby') return false;
  if (adjId === 'new' && (NOT_NEW_TOPICS.includes(noun.topic ?? '') || NOT_NEW.includes(noun.id))) return false;
  if (adjId === 'new' && noun.topic === 'animals' && !PETS.includes(noun.id)) return false;
  if (adjId === 'short' && !(SHORT_THINGS.includes(noun.id) || (person && noun.id !== 'baby'))) return false;
  if ((adjId === 'easy' || adjId === 'hard') && !EASY_OR_HARD.includes(noun.id)) return false;
  if ((adjId === 'clean-adj' || adjId === 'dirty') && noun.topic !== 'clothes' && !CLEAN_OR_DIRTY.includes(noun.id)) return false;
  return true;
}

/**
 * A place ending only where it means something: IN / INTO / OUT OF a
 * container, ON / ONTO / OFF a surface — "isossa talossa", "isolla pöydällä",
 * never "into the black grandfather" or "on the green room".
 */
export function placeCaseFits(caseId: string, noun: { tags?: readonly string[] }): boolean {
  if (caseId === 'inessive' || caseId === 'illative' || caseId === 'elative') return !!noun.tags?.includes(CONTAINER_TAG);
  if (caseId === 'adessive' || caseId === 'allative' || caseId === 'ablative') return !!noun.tags?.includes(SURFACE_TAG);
  return true;
}

// --- Verbs: kid-commandable actions ---------------------------------------
//
// The TPR commands game ("Tee näin!") speaks an imperative and the child taps
// the matching action picture. Only actions a child could actually do or mime
// on the spot belong here — never states or feelings ("Rakasta!", "Itke!" are
// grammatical but wrong to command a child), and nothing needing equipment or
// an adult (drive, cook, fly). Curated by id; every listed verb has an action
// emoji so it renders as a picture card.
export const COMMAND_VERB_IDS = [
  'jump',
  'run',
  'sit',
  'stand',
  'walk',
  'dance',
  'sing',
  'read',
  'draw',
  'write',
  'swim',
  'smile',
  'laugh',
  'hug',
  'eat',
  'drink',
  'sleep',
  'play',
  'open',
  'close',
  'wash',
  'climb',
  'throw',
  'listen',
  'look',
  'paint',
  'wait',
  'wake-up',
];

/** True if a verb (by id) is a safe, actable command for the TPR game. */
export function isCommandVerb(id: string): boolean {
  return COMMAND_VERB_IDS.includes(id);
}

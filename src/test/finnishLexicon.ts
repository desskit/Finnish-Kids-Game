// A test-time Finnish word-form lexicon: every form in the vendored
// Wiktionary tables (data/finnish-inflection-drill — nouns, verbs, numerals,
// possessive forms), every sourced form the game's own items carry, and the
// small authored tables (pronouns, question forms, higher ordinals), plus a
// short list of function words those tables don't have.
//
// Used to check AUTHORED Finnish (stories, scenes): every word must be a real
// form. It can't judge whether the right case was chosen — the native review
// does that — but it catches the worst kind of mistake in hand-written text:
// a form that doesn't exist (a typo, or an ending made up by analogy).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { themes, verbs, numbers, ordinals, adjectives, time, states } from '../content';
import { PRONOUNS } from '../content/pronouns';
import { YOU_QUESTION } from '../content/questions';

const DATA = join(__dirname, '..', '..', 'data', 'finnish-inflection-drill');

type Inflections = Record<string, string | Record<string, string>>;

function addAll(set: Set<string>, value: unknown) {
  if (typeof value === 'string') {
    for (const w of value.toLowerCase().split(/\s+/)) if (w) set.add(w);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) addAll(set, v);
  }
}

/** Words the tables don't carry: function words, adverbs, particles, names. */
export const FUNCTION_WORDS = [
  // conjunctions, particles, adverbs
  'ja', 'tai', 'mutta', 'koska', 'kun', 'että', 'jos', 'myös', 'vielä', 'jo', 'nyt', 'sitten', 'ensin', 'lopuksi',
  'tänään', 'eilen', 'huomenna', 'aina', 'usein', 'joskus', 'nopeasti', 'hitaasti', 'hiljaa', 'kovaa',
  'täällä', 'siellä', 'tuolla', 'tänne', 'sinne', 'tuonne', 'täältä', 'sieltä', 'kotona', 'kotiin', 'kotoa',
  'ulos', 'ulkona', 'sisään', 'sisällä', 'yhdessä', 'paljon', 'vähän', 'hyvin', 'liian', 'tosi', 'todella', 'melkein',
  'ylös', 'alas', 'pois', 'takaisin', 'mukaan', 'mukana', 'heti', 'taas', 'vain', 'aivan', 'ihan', 'kanssa',
  'kiitos', 'hei', 'moi', 'joo', 'kyllä', 'ei', 'okei', 'ole', 'hyvä', 'anteeksi', 'näkemiin', 'huomenta', 'hyvää',
  'oi', 'voi', 'jee', 'hurraa', 'vau', 'jippii', 'no', 'niin', 'tietysti', 'totta',
  'ai', 'entä', 'samoin', 'tervetuloa', 'uudestaan', 'vai', 'epäselvästi', 'aluksi', 'lopuksi', 'yhtä',
  // pronoun and question-word forms the tables don't have
  'miltä', 'minkä', 'mitkä', 'sinuun', 'minuun', 'häneen',
  // verb forms outside the tables (the -maan "to go and do" form)
  'leikkimään', 'uimaan', 'syömään', 'nukkumaan', 'pelaamaan',
  // everyday compounds
  'lempiruokasi', 'lempivärisi', 'seitsemänvuotias', 'karkkipäivä', 'koulupäivä',
  // question words
  'mikä', 'mitä', 'missä', 'mihin', 'minne', 'mistä', 'kuka', 'ketä', 'kenen', 'kenellä', 'kenelle', 'keneltä',
  'milloin', 'miksi', 'miten', 'montako', 'monta', 'kuinka', 'millainen', 'kumpi', 'mikä',
  // demonstratives / pronoun forms beyond the authored table
  'se', 'sen', 'sitä', 'siinä', 'siitä', 'siihen', 'sillä', 'sille', 'siltä', 'ne', 'niitä', 'niiden',
  'tämä', 'tämän', 'tätä', 'tässä', 'tästä', 'tähän', 'nämä', 'näitä', 'tuo', 'tuon', 'tuota', 'nuo',
  'kaikki', 'kaikkia', 'joku', 'jotain', 'jotakin', 'mitään', 'kukaan', 'jokainen', 'toinen', 'toista',
  'minun', 'sinun', 'hänen', 'meidän', 'teidän', 'heidän',
  'jotka', 'joka', 'jonka', 'jota',
  // names used in the stories and scenes
  'liisa', 'eero', 'aino', 'veikko', 'mira', 'otto', 'lumi', 'musti', 'mirri', 'pekka', 'anna', 'leo', 'ella', 'onni',
  // names in their case forms
  'eerolla', 'eerolle', 'eerosta', 'eeron', 'ainolla', 'ainolle', 'ainon', 'leon',
];

let cache: Set<string> | null = null;

export function finnishLexicon(): Set<string> {
  if (cache) return cache;
  const set = new Set<string>(FUNCTION_WORDS);
  for (const file of ['nouns.json', 'verbs.json', 'numerals.json']) {
    const data = JSON.parse(readFileSync(join(DATA, file), 'utf8')) as { words: { word: string; inflections: Inflections }[] };
    for (const w of data.words) {
      set.add(w.word.toLowerCase());
      addAll(set, w.inflections);
    }
  }
  const poss = JSON.parse(readFileSync(join(DATA, 'possessives.json'), 'utf8')) as {
    words: { inflections: Inflections }[];
  };
  for (const w of poss.words) addAll(set, w.inflections);
  for (const item of [...themes.flatMap((t) => t.items), ...verbs.items, ...numbers.items, ...ordinals.items, ...adjectives.items, ...time.items, ...states.items]) {
    set.add(item.fi.toLowerCase());
    addAll(set, item.inflections);
    addAll(set, item.degrees);
  }
  addAll(set, PRONOUNS);
  addAll(set, YOU_QUESTION);
  cache = set;
  return set;
}

/** Clitics a word may carry (-ko / -kö "?", -kin "too", -han / -hän, -pa / -pä). */
const CLITICS = ['kaan', 'kään', 'kin', 'han', 'hän', 'ko', 'kö', 'pa', 'pä'];

/** Is this word a known form (allowing one clitic)? */
export function knownForm(word: string, lexicon = finnishLexicon()): boolean {
  const w = word.toLowerCase();
  if (lexicon.has(w)) return true;
  for (const c of CLITICS) {
    if (w.endsWith(c) && w.length > c.length + 1 && lexicon.has(w.slice(0, -c.length))) return true;
  }
  return false;
}

/** The words of a Finnish line (punctuation stripped; the {name} placeholder dropped). */
export function wordsOf(line: string): string[] {
  return line
    .replace(/\{name\}/g, ' ')
    .split(/[\s—–]+/)
    .map((w) => w.replace(/^[^a-zåäöA-ZÅÄÖ]+|[^a-zåäöA-ZÅÄÖ-]+$/g, ''))
    .filter((w) => w.length > 0)
    .flatMap((w) => w.split('-').filter(Boolean));
}

/** Every word of `line` that isn't a known form. */
export function unknownWords(line: string, lexicon = finnishLexicon()): string[] {
  return wordsOf(line).filter((w) => !knownForm(w, lexicon));
}

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lessons } from '../content/lessons';
import { proseParts } from './speak';
import { englishWords, knownOrCompound } from '../test/uiFinnish';
import { finnishLexicon } from '../test/finnishLexicon';

// Read aloud, an explanation's English goes to the English voice and its
// Finnish to the Finnish one (speak.ts `proseParts`) — so every Finnish word
// in it must be marked: *in italics*, or an ending ("-ssa"), or a bold run of
// letters ("**kk → k**"). A Finnish word left plain would be said in English.

const en = englishWords();
const lexicon = finnishLexicon();
/** English the vendored word list lacks. */
const MORE_ENGLISH = new Set(['finnish', 'finns', 'finland', 'santa', 'simon', 'december', 'ew', 'vs', 'everywhere', 'otherwise', 'everyday', 'different']);

/** The words of an English part that are Finnish (and not English too). */
function finnishIn(english: string): string[] {
  const words = english
    .replace(/\d+(st|nd|rd|th)\b/g, ' ')
    .replace(/['’](s|ll|d|t|re|ve|m)\b/g, ' ')
    .replace(/\bo['’]clock\b/gi, ' ')
    .match(/\p{L}+/gu) ?? [];
  return words.filter((w) => {
    const x = w.toLowerCase();
    if (en.has(x) || MORE_ENGLISH.has(x)) return false;
    return /[äöå]/.test(x) || knownOrCompound(x, lexicon) || /^[a-z]{1,3}$/.test(x);
  });
}

describe('reading an explanation aloud', () => {
  it('says no lesson Finnish in the English voice', () => {
    const bad = lessons.flatMap((l) =>
      l.cards.flatMap((c, i) =>
        [c.title ?? '', 'text' in c ? (c.text ?? '') : '']
          .flatMap((prose) => proseParts(prose).filter((p) => !p.fi))
          .flatMap((p) => finnishIn(p.text).map((w) => `${l.id} #${i}: ${w}`)),
      ),
    );
    expect(bad).toEqual([]);
  }, 60_000);

  it('marks Finnish words in the "Why?" tips in italics, not bold', () => {
    // A bold run is read in English unless it is an ending or letters, so a
    // Finnish word in bold (**kuin**) would be said with an English accent.
    const files = ['content/why.ts', 'game/formChoice.ts', 'game/hear.ts', 'content/verbTypes.ts'];
    const bad = files.flatMap((f) => {
      const src = readFileSync(join(__dirname, '..', f), 'utf8');
      return [...src.matchAll(/\*\*([^*\n]+)\*\*/g)]
        .map((m) => m[1])
        .filter((bold) => !bold.includes('${'))
        .flatMap((bold) => proseParts(`**${bold}**`).filter((p) => !p.fi))
        .flatMap((p) => finnishIn(p.text).map((w) => `${f}: ${w}`));
    });
    expect(bad).toEqual([]);
  }, 60_000);
});

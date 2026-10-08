import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractUiFinnish, langOf, type UiLabel } from './uiFinnish';
import { knownOrCompound } from './uiFinnish';
import { wordsOf } from './finnishLexicon';
import { reviewSections } from '../game/reviewEntries';

const saved = JSON.parse(readFileSync(join(__dirname, '..', '..', 'data', 'ui-finnish.json'), 'utf8')) as {
  labels: UiLabel[];
};
const extracted = extractUiFinnish();
const label = (fi: string) => extracted.find((l) => l.fi === fi);

/**
 * Words the vendored Wiktionary tables don't carry, each a real word: shown
 * here so a typo can't hide among them.
 */
const NOT_IN_TABLES = new Set([
  'aakkoset', // the alphabet (plural of aakkonen)
  'arkipuhetta', // everyday talk (arkipuhe, partitive)
  'asetukset', // settings
  'edistyminen', // progress
  'ensiaskeleet', // first steps
  'fraasi', // phrase (loan)
  'juttelija', // chatterbox (jutella)
  'kertaus', // review, revision
  'kirjainten', // of the letters (kirjain, genitive plural)
  'laskeminen', // counting
  'lukutoukka', // bookworm
  'lämmittely', // warm-up
  'muistaja', // rememberer (muistaa)
  'oppija', // learner
  'pidennä', // lengthen! (pidentää)
  'testaus', // testing
  'täydennä', // complete! (täydentää)
  'verbi', // verb
  'verbit', // verbs
  'verbityyppi', // verb type
  'verbityypit', // verb types
  'vihko', // exercise book
]);

describe('the Finnish in the app’s screens', () => {
  it('data/ui-finnish.json is up to date (run `npm run review:content`)', () => {
    expect(saved.labels).toEqual(extracted);
  });

  it('finds the labels with their English, in every kind of source', () => {
    // Text before an English span.
    expect(label('Mitä kuulit?')?.en).toBe('What did you hear?');
    // A "Finnish · English" attribute.
    expect(label('Aikuisille')?.en).toBe('Grown-ups');
    // An object field pair (the grown-ups' tabs).
    expect(label('Tilastot')?.en).toBe('Stats');
    // A mixed string, split by sentence.
    expect(label('Muistatko?')?.en).toBe('Remember?');
    // A Finnish word the tables lack is still caught.
    expect(label('Kertaus')?.en).toMatch(/Review/);
    // A template with a yes / no choice.
    expect(label('⟨Kyllä / Ei⟩, se on ⟨fi⟩.')).toBeDefined();
  });

  it('leaves the English out', () => {
    for (const en of ['Finnish check', 'Show them all', 'Your Finnish course', 'Nothing left to check here — kiitos!']) {
      expect(label(en)).toBeUndefined();
    }
    expect(langOf('Show them all')).toBe('en');
    expect(langOf('Nothing left to check here — kiitos!')).toBe('en');
    expect(langOf('Paljonko on ⟨a⟩ + ⟨b⟩?')).toBe('fi');
    expect(langOf('Kertaus')).toBe('unsure');
  });
});

describe('titles and labels use real Finnish words', () => {
  const rows = reviewSections()
    .filter((s) => s.id === 'titles' || s.id === 'ui')
    .flatMap((s) => s.rows);

  it('lists both in the native review', () => {
    expect(rows.some((r) => r.key === 'title:Uudet sanat')).toBe(true);
    expect(rows.some((r) => r.key === 'ui:Mitä kuulit?')).toBe(true);
  });

  /** The words to check: not quoted English ("the"), endings after a gap (Pidän…sta) or abbreviations (KPT). */
  const wordsToCheck = (fi: string) =>
    wordsOf(
      fi
        .replace(/⟨[^⟩]*⟩/g, ' ')
        .replace(/"[^"]*"/g, ' ')
        .replace(/…[a-zåäö]{1,5}\b/g, ' ')
        .replace(/→.*$/, ''),
    ).filter((w) => w.length >= 2 && w !== w.toUpperCase());

  it('every word is a known form, a compound of two, or a listed real word', () => {
    const unknown = new Set<string>();
    for (const r of rows) {
      for (const w of wordsToCheck(r.fi)) {
        const lw = w.toLowerCase();
        if (NOT_IN_TABLES.has(lw) || knownOrCompound(lw)) continue;
        unknown.add(`${lw} (${r.key})`);
      }
    }
    expect([...unknown]).toEqual([]);
  });

  it('lists only words the tables really lack', () => {
    expect([...NOT_IN_TABLES].filter((w) => knownOrCompound(w))).toEqual([]);
  });
});

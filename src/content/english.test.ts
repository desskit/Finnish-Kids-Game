import { describe, it, expect } from 'vitest';
import { themes, verbs, adjectives, animals } from './index';
import { nounConstructions } from './constructions';
import {
  countedEn,
  englishSentenceFor,
  formFor,
  glossWithAlso,
  ownerGloss,
  pluralEn,
  possessiveGloss,
  suitsSlot,
  type LexicalItem,
} from './types';
import { adjectiveFitsNoun } from './semantics';
import { RANKINGS, comparisonEnglish, comparisons } from './compare';
import { kidSafeExamples, itemsWithExamples } from './examples';
import { lookupWord } from './wordIndex';
import { buildReadingRound, sentenceUses } from '../game/round';

// The English a child reads must say what the Finnish says, the way an
// English speaker would say it — Finnish grammar mapped word-for-word reads
// oddly ("I like the apple", "two breads", "Where is your hobby?").
const all: LexicalItem[] = [...themes.flatMap((t) => t.items), ...verbs.items, ...adjectives.items];
const word = (id: string) => all.find((i) => i.id === id)!;
const con = (id: string) => nounConstructions.find((c) => c.id === id)!;
const en = (wordId: string, conId: string) => englishSentenceFor(word(wordId), con(conId));
const fits = (wordId: string, conId: string) => !!formFor(word(wordId), con(conId)) && suitsSlot(word(wordId), con(conId));

describe('carrier English reads naturally', () => {
  it('likes a FOOD as a kind: plural for countable foods, bare for the rest', () => {
    expect(en('apple', 'i-like')).toBe('I like apples.');
    expect(en('carrot', 'i-love')).toBe('I love carrots.');
    expect(en('strawberry', 'i-dont-like-tykkaa')).toBe("I don't like strawberries.");
    expect(en('candy', 'i-love')).toBe('I love candy.');
    expect(en('pizza', 'i-like-tykkaan')).toBe('I like pizza.');
    // …but a particular animal or thing keeps its "the".
    expect(en('cat', 'i-love')).toBe('I love the cat.');
    expect(en('dress', 'i-like')).toBe('I like the dress.');
  });

  it('says "my" for the relatives and friends a child has, in every number', () => {
    expect(en('aunt', 'i-see')).toBe('I see my aunt.');
    expect(en('cousin', 'i-wait-for')).toBe("I'm waiting for my cousin.");
    expect(en('brother', 'this-is')).toBe('This is my brother.');
    expect(en('sister', 'where-are')).toBe('Where are my sisters?');
    expect(en('friend', 'behind-them')).toBe('behind my friends');
  });

  it('counts bread and homework in pieces', () => {
    expect(pluralEn(word('bread'))).toBe('loaves of bread');
    expect(pluralEn(word('homework'))).toBe('homework tasks');
    expect(countedEn(word('bread'), 1)).toBe('loaf of bread');
    expect(countedEn(word('paper'), 3)).toBe('sheets of paper');
    expect(countedEn(word('child'), 2)).toBe('children');
    expect(en('bread', 'where-are')).toBe('Where are the loaves of bread?');
    expect(en('paper', 'this-is')).toBe('This is paper.');
  });

  it('has none OF a treat, rather than not one', () => {
    expect(en('candy', 'i-havent')).toBe("I don't have any candy.");
    expect(en('chocolate', 'i-havent')).toBe("I don't have any chocolate.");
    expect(en('ball', 'i-havent')).toBe("I don't have a ball.");
  });

  it('glosses jalkapallo and ruokala unambiguously for a US reader', () => {
    // The ball is a soccer ball; liking or watching it is the game, soccer.
    expect(word('football').en).toBe('soccer ball');
    expect(en('football', 'i-have')).toBe('I have a soccer ball.');
    expect(pluralEn(word('football'))).toBe('soccer balls');
    expect(en('football', 'i-like')).toBe('I like soccer.');
    expect(en('football', 'i-watch')).toBe("I'm watching soccer.");
    expect(glossWithAlso(word('football'))).toBe('soccer ball, soccer');
    expect(word('canteen').en).toBe('cafeteria');
  });
});

describe('carrier gates keep the sentence sensible', () => {
  it('buys pets and food, not wild or farm animals', () => {
    expect(fits('dog', 'i-buy')).toBe(true);
    for (const id of ['elephant', 'lion', 'cow', 'butterfly']) expect(fits(id, 'i-buy'), id).toBe(false);
  });

  it('never has "Odotan vauvaa" (which means expecting a baby)', () => {
    expect(fits('baby', 'i-wait-for')).toBe(false);
    expect(fits('child', 'i-wait-for')).toBe(false);
    expect(fits('bus', 'i-wait-for')).toBe(true);
  });

  it('dislikes things, never people', () => {
    for (const c of ['i-dont-like', 'i-dont-like-tykkaa']) {
      for (const id of ['mother', 'brother', 'teacher', 'friend']) expect(fits(id, c), `${c}/${id}`).toBe(false);
      expect(fits('test', c)).toBe(true);
    }
  });

  it('loves nothing mundane (no forks, tests or pupils)', () => {
    for (const id of ['fork', 'test', 'pupil', 'station']) expect(fits(id, 'i-love'), id).toBe(false);
  });

  it('asks where things you could lose are — not your hobby or your window', () => {
    for (const id of ['hobby', 'window', 'pupil', 'movie']) expect(fits(id, 'where-is-yours'), id).toBe(false);
    expect(fits('book', 'where-is-yours')).toBe(true);
  });

  it('keeps relatives out of "Onko tämä…?" and "Nämä ovat…"', () => {
    expect(fits('brother', 'is-this')).toBe(false);
    expect(fits('aunt', 'these-are')).toBe(false);
    expect(fits('brother', 'these-are')).toBe(true);
  });

  it('owns things, not doors, windows or kitchens', () => {
    for (const c of ['i-have', 'i-havent', 'she-has'])
      for (const id of ['door', 'window', 'kitchen']) expect(fits(id, c), `${c}/${id}`).toBe(false);
  });

  it('never says "an old baby"', () => {
    expect(adjectiveFitsNoun('old', word('baby'))).toBe(false);
    expect(adjectiveFitsNoun('old', word('dog'))).toBe(true);
  });
});

describe('other generated English', () => {
  it('sits AT a window, not on it', () => {
    expect(possessiveGloss(word('window'), '1sg', 'adessive')).toBe('at my window');
    expect(possessiveGloss(word('table'), '2sg', 'adessive')).toBe('on your table');
  });

  it("names a friend's things as my friend's", () => {
    expect(ownerGloss(word('friend'), word('bike'))).toBe("my friend's bike");
    expect(ownerGloss(word('teacher'), word('book'))).toBe("the teacher's book");
  });

  it('compares "tall" only on people (pitkä on an animal is LONG)', () => {
    const tall = RANKINGS.filter((r) => r.adj === 'tall');
    for (const r of tall) for (const id of r.order.flat()) expect(animals.items.some((a) => a.id === id), id).toBe(false);
    const c = comparisons(adjectives.items).find((x) => x.adj.id === 'old' && x.more.id === 'brother');
    expect(c && comparisonEnglish(c.adj, c.more, c.less)).toMatch(/^My brother is older than /);
  });

  it('takes "woken up" from the sourced English, not "waked up"', () => {
    expect(word('wake-up').english?.pastParticiple).toBe('woken up');
  });

  it('gives the everyday second meaning in the story glossary', () => {
    expect(glossWithAlso(word('son'))).toBe('son, boy');
    expect(lookupWord('poikaa')?.en).toBe('son, boy');
  });
});

describe('real example sentences', () => {
  it('shows only checked sentences: not another word, not spoken slang', () => {
    const shown = all.flatMap((i) => kidSafeExamples(i).map((e) => e.fi));
    expect(shown.length).toBeGreaterThan(100);
    for (const bad of ['Taidat luulla minua isoveljekseni.', 'Mä haluun jäätelön.', 'Kiva peli!', 'Silmä silmästä.'])
      expect(shown).not.toContain(bad);
  });

  it('never offers a second picture the sentence also mentions', () => {
    expect(sentenceUses('Koira on tuolilla.', word('dog'))).toBe(true);
    expect(sentenceUses('Veljeni tykkää autoista.', word('brother'))).toBe(true);
    expect(sentenceUses('Koira on tuolilla.', word('cat'))).toBe(false);
    const pool = itemsWithExamples(all);
    for (let r = 0; r < 30; r++) {
      for (const q of buildReadingRound(all, 6, 4)) {
        for (const o of q.options.filter((o) => o.id !== q.item.id)) {
          expect(sentenceUses(q.sentence.fi, o), `${q.sentence.fi} / ${o.id}`).toBe(false);
        }
      }
    }
    expect(pool.length).toBeGreaterThan(50);
  });
});

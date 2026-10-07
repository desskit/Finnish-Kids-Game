import { describe, expect, it } from 'vitest';
import { verbs } from '.';
import { gradation, gradationLabel, hasKpt, typeByLook, verbType } from './verbTypes';

const byFi = (fi: string) => verbs.items.find((v) => v.fi === fi)!;
const typeOf = (fi: string) => verbType(byFi(fi));

describe('verb types', () => {
  it('classifies by the sourced dictionary class', () => {
    expect(['laulaa', 'puhua', 'nukkua', 'lukea', 'leikkiä', 'tanssia'].map(typeOf)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(['syödä', 'juoda', 'uida', 'tehdä', 'nähdä', 'saada'].map(typeOf)).toEqual([2, 2, 2, 2, 2, 2]);
    expect(['tulla', 'mennä', 'kävellä', 'pestä', 'juosta', 'kuunnella'].map(typeOf)).toEqual([3, 3, 3, 3, 3, 3]);
    expect(['avata', 'haluta', 'siivota', 'hypätä', 'kiivetä', 'pudota'].map(typeOf)).toEqual([4, 4, 4, 4, 4, 4]);
    expect(['tarvita', 'valita', 'häiritä', 'lukita'].map(typeOf)).toEqual([5, 5, 5, 5]);
    expect(['vanheta', 'lämmetä', 'paeta'].map(typeOf)).toEqual([6, 6, 6]);
  });

  it('every app verb has a type', () => {
    for (const v of verbs.items) expect(verbType(v), v.fi).toBeDefined();
  });

  it('the look matches the class for all but the known odd one (kiivetä)', () => {
    const odd = verbs.items.filter((v) => typeByLook(v.fi) !== verbType(v)).map((v) => v.fi);
    expect(odd).toEqual(['kiivetä']);
  });
});

describe('consonant gradation (KPT)', () => {
  it('finds exactly the verbs whose minä form changes a consonant', () => {
    const kpt = verbs.items.filter(hasKpt).map((v) => v.fi).sort();
    expect(kpt).toEqual(
      [
        'nukkua', 'leikkiä', 'lukea', 'kirjoittaa', 'piirtää', 'auttaa', 'ottaa', 'antaa',
        'sulkea', 'löytää', 'lentää', 'keittää', 'heittää', 'unohtaa', 'oppia', 'opettaa',
        'odottaa', 'rakentaa', 'kuunnella', 'hypätä', 'kiivetä', 'tavata', 'pudota', 'leikata',
        'lämmetä', 'paeta',
      ].sort(),
    );
  });

  it('cuts out the changing consonants', () => {
    const label = (fi: string) => gradationLabel(gradation(byFi(fi))!);
    expect(label('nukkua')).toBe('kk → k');
    expect(label('lukea')).toBe('k → ∅');
    expect(label('piirtää')).toBe('rt → rr');
    expect(label('sulkea')).toBe('lk → lj');
    expect(label('kuunnella')).toBe('nn → nt');
    expect(label('hypätä')).toBe('p → pp');
    expect(label('kiivetä')).toBe('v → p');
    expect(label('paeta')).toBe('∅ → k');
    expect(label('lämmetä')).toBe('mm → mp');
  });

  it('type 1 is strong in the infinitive; types 3, 4 and 6 in the minä form', () => {
    expect(gradation(byFi('nukkua'))!.strong).toBe('infinitive');
    expect(gradation(byFi('kuunnella'))!.strong).toBe('mina');
    expect(gradation(byFi('hypätä'))!.strong).toBe('mina');
    expect(gradation(byFi('paeta'))!.strong).toBe('mina');
  });

  it('special verbs are not counted as KPT', () => {
    for (const fi of ['tehdä', 'nähdä', 'juosta', 'olla']) expect(hasKpt(byFi(fi)), fi).toBe(false);
  });
});

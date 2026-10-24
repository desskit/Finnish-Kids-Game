import { describe, it, expect } from 'vitest';
import { normalizeSpoken, editDistance, matchTolerance, matchSpeech, matchNumberSpeech, matchAnswerSpeech, spokenDigits } from './speechMatch';

describe('normalizeSpoken', () => {
  it('lowercases, strips punctuation, collapses whitespace, keeps ä/ö', () => {
    expect(normalizeSpoken('  Tämä on KISSA. ')).toBe('tämä on kissa');
    expect(normalizeSpoken('Isä, äiti!')).toBe('isä äiti');
  });
});

describe('editDistance', () => {
  it('is 0 for equal strings and the length for empty comparisons', () => {
    expect(editDistance('kissa', 'kissa')).toBe(0);
    expect(editDistance('', 'kissa')).toBe(5);
    expect(editDistance('kissa', '')).toBe(5);
  });
  it('counts single edits', () => {
    expect(editDistance('kissa', 'kisa')).toBe(1); // deletion
    expect(editDistance('kissa', 'kissaa')).toBe(1); // insertion
    expect(editDistance('kissa', 'kessa')).toBe(1); // substitution
  });
});

describe('matchTolerance', () => {
  it('is ~1/4 the target length, at least 1', () => {
    expect(matchTolerance('on')).toBe(1); // floor(2/4)=0 → min 1
    expect(matchTolerance('kissa')).toBe(1); // floor(5/4)=1
    expect(matchTolerance('tämä on iso kissa')).toBe(4); // floor(17/4)=4
  });
});

describe('matchSpeech', () => {
  it('accepts an exact match (case/punctuation-insensitive)', () => {
    expect(matchSpeech(['Kissa.'], 'kissa')).toBe(true);
  });
  it('accepts a near-miss within tolerance (child mispronunciation / ASR slip)', () => {
    expect(matchSpeech(['kisa'], 'kissa')).toBe(true); // 1 edit ≤ tol 1
    expect(matchSpeech(['kissaa'], 'kissa')).toBe(true);
  });
  it('accepts an alternative that contains the target (said extra words)', () => {
    expect(matchSpeech(['se on kissa'], 'kissa')).toBe(true);
  });
  it('accepts a full phrase spoken correctly', () => {
    expect(matchSpeech(['Tämä on kissa'], 'Tämä on kissa.')).toBe(true);
  });
  it('accepts if ANY alternative matches, even when the first is wrong', () => {
    expect(matchSpeech(['koira', 'pissa', 'kissa'], 'kissa')).toBe(true);
  });
  it('rejects a genuinely different word', () => {
    expect(matchSpeech(['koira'], 'kissa')).toBe(false);
    expect(matchSpeech([], 'kissa')).toBe(false);
    expect(matchSpeech([''], 'kissa')).toBe(false);
  });
  it('does not accept one short word as a whole phrase (only heard⊇target)', () => {
    expect(matchSpeech(['on'], 'tämä on kissa')).toBe(false);
  });
  it('finds a near-miss among background words (a noisy room)', () => {
    expect(matchSpeech(['no kisa joo'], 'kissa')).toBe(true);
    expect(matchSpeech(['äiti kolme kisaa tänne'], 'kolme kissaa')).toBe(true);
    // …but background words alone are still a miss.
    expect(matchSpeech(['no koira joo'], 'kissa')).toBe(false);
    expect(matchSpeech(['tule tänne nyt'], 'kolme kissaa')).toBe(false);
  });
});

describe('numbers a recognizer writes as digits', () => {
  it('reads them back as the Finnish word', () => {
    expect(spokenDigits('7')).toBe('seitsemän');
    expect(spokenDigits('3 kissaa')).toBe('kolme kissaa');
    expect(spokenDigits('0')).toBe('nolla');
    expect(spokenDigits('20')).toBe('kaksikymmentä');
    // a compound isn't sourced, so it stays as it was
    expect(spokenDigits('21')).toBe('21');
  });

  it('accepts a spoken number the recognizer wrote as digits', () => {
    expect(matchSpeech(['7'], 'seitsemän')).toBe(true);
    expect(matchSpeech(['3 kissaa'], 'kolme kissaa')).toBe(true);
    expect(matchSpeech(['13'], 'kolmetoista')).toBe(true);
    // a different number is still wrong
    expect(matchSpeech(['8'], 'seitsemän')).toBe(false);
  });
});

describe('a number said as an answer (the math games)', () => {
  it('hears the number however it was written down', () => {
    expect(matchNumberSpeech(['viisi'], 5)).toBe(true);
    expect(matchNumberSpeech(['5'], 5)).toBe(true);
    expect(matchNumberSpeech(['Viisi!'], 5)).toBe(true);
    expect(matchNumberSpeech(['0'], 0)).toBe(true);
    expect(matchNumberSpeech(['kaksikymmentä'], 20)).toBe(true);
  });

  it('takes the last number said, so a whole sentence counts', () => {
    expect(matchNumberSpeech(['se on viisi'], 5)).toBe(true);
    expect(matchNumberSpeech(['kolme plus kaksi on viisi'], 5)).toBe(true);
    expect(matchNumberSpeech(['viisi omenaa'], 5)).toBe(true);
    expect(matchNumberSpeech(['viisi vai kuusi'], 5)).toBe(false);
  });

  it('never hears one number inside another', () => {
    expect(matchNumberSpeech(['kolmetoista'], 3)).toBe(false);
    expect(matchNumberSpeech(['13'], 3)).toBe(false);
    expect(matchNumberSpeech(['kaksikymmentä'], 2)).toBe(false);
    expect(matchNumberSpeech(['yksitoista'], 1)).toBe(false);
    // close in letters, but nearer another number
    expect(matchNumberSpeech(['kuusitoista'], 12)).toBe(false);
    expect(matchNumberSpeech(['kaksi'], 6)).toBe(false);
    expect(matchNumberSpeech(['yhdeksän'], 8)).toBe(false);
  });

  it('accepts the everyday short forms children say', () => {
    expect(matchNumberSpeech(['viis'], 5)).toBe(true);
    expect(matchNumberSpeech(['kuus'], 6)).toBe(true);
    expect(matchNumberSpeech(['kaks'], 2)).toBe(true);
    expect(matchNumberSpeech(['yks'], 1)).toBe(true);
    expect(matchNumberSpeech(['kaheksan'], 8)).toBe(true);
    expect(matchNumberSpeech(['seittemän'], 7)).toBe(true);
  });

  it('puts a number said in two pieces back together', () => {
    expect(matchNumberSpeech(['kolme toista'], 13)).toBe(true);
    expect(matchNumberSpeech(['kaksi kymmentä'], 20)).toBe(true);
  });

  it('hears no number in other words', () => {
    expect(matchNumberSpeech(['en tiedä'], 5)).toBe(false);
    expect(matchNumberSpeech([''], 0)).toBe(false);
  });

  it('checks every alternative the recognizer offers', () => {
    expect(matchNumberSpeech(['viini', 'viisi'], 5)).toBe(true);
  });
});

describe('a time said as an answer (the clock games)', () => {
  it('reads a time the recognizer wrote in digits the Finnish way', () => {
    expect(spokenDigits('klo 4.00')).toBe('klo neljä');
    expect(spokenDigits('3.30')).toBe('puoli neljä');
    expect(spokenDigits('15:30')).toBe('puoli neljä');
    expect(spokenDigits('12.30')).toBe('puoli yksi');
    expect(spokenDigits('16.00')).toBe('neljä');
  });

  it('hears a half hour as puoli and its hour, never another hour', () => {
    expect(matchAnswerSpeech(['puoli neljä'], 'puoli neljä')).toBe(true);
    expect(matchAnswerSpeech(['kello on puoli neljä'], 'puoli neljä')).toBe(true);
    expect(matchAnswerSpeech(['puoli 4'], 'puoli neljä')).toBe(true);
    expect(matchAnswerSpeech(['3.30'], 'puoli neljä')).toBe(true);
    // "puoli yksitoista" (half past ten) holds "puoli yksi" in its letters — still wrong
    expect(matchAnswerSpeech(['puoli yksitoista'], 'puoli yksi')).toBe(false);
    expect(matchAnswerSpeech(['puoli kaksitoista'], 'puoli kaksi')).toBe(false);
    // the whole hour isn't half past
    expect(matchAnswerSpeech(['neljä'], 'puoli neljä')).toBe(false);
    expect(matchAnswerSpeech(['puoli viisi'], 'puoli neljä')).toBe(false);
  });

  it('never takes a half hour for its hour', () => {
    expect(matchNumberSpeech(['puoli neljä'], 4)).toBe(false);
    expect(matchNumberSpeech(['kello neljä'], 4)).toBe(true);
    expect(matchNumberSpeech(['4.00'], 4)).toBe(true);
  });

  it('matches other words as speech always has', () => {
    expect(matchAnswerSpeech(['kolme kissaa'], 'kolme kissaa')).toBe(true);
  });
});

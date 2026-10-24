import { describe, it, expect, afterEach, vi } from 'vitest';
import { speak, speakEnglish, speakProse } from './speak';

// What reaches the speech engine: never Finnish in another language's voice.

interface Said {
  text: string;
  lang: string;
  voice?: { lang: string; name: string };
}

function engine(voices: { lang: string; name: string }[]) {
  const said: Said[] = [];
  class Utterance {
    text: string;
    lang = '';
    voice?: { lang: string; name: string };
    rate = 1;
    pitch = 1;
    onstart?: () => void;
    onend?: () => void;
    onerror?: () => void;
    constructor(text: string) {
      this.text = text;
    }
  }
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      getVoices: () => voices,
      cancel() {},
      speak: (u: Said) => said.push({ text: u.text, lang: u.lang, voice: u.voice }),
      addEventListener() {},
      removeEventListener() {},
    },
  });
  return said;
}

afterEach(() => {
  delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
  vi.unstubAllGlobals();
});

const SATU = { lang: 'fi-FI', name: 'Satu' };
const SAMANTHA = { lang: 'en-US', name: 'Samantha' };

describe('the Finnish voice', () => {
  it('speaks Finnish in the Finnish voice', () => {
    const said = engine([SAMANTHA, SATU]);
    speak('kissa');
    expect(said).toEqual([{ text: 'kissa', lang: 'fi-FI', voice: SATU }]);
  });

  it('stays silent rather than read Finnish with an English voice', () => {
    const said = engine([SAMANTHA]);
    speak('kissa');
    expect(said).toEqual([]);
    // English still speaks
    speakEnglish('cat');
    expect(said).toEqual([{ text: 'cat', lang: 'en-US', voice: SAMANTHA }]);
  });

  it('leaves it to the browser while the voice list is still loading', () => {
    const said = engine([]);
    speak('kissa');
    expect(said.map((s) => s.lang)).toEqual(['fi-FI']);
  });
});

describe('reading an explanation aloud', () => {
  it('reads the English in English and each *Finnish* quote in Finnish, markup left out', () => {
    const said = engine([SAMANTHA, SATU]);
    speakProse('**-ssa** means in: *talossa* → in the house.');
    expect(said.map((s) => [s.lang, s.text])).toEqual([
      ['en-US', '-ssa means in:'],
      ['fi-FI', 'talossa'],
      ['en-US', ',  in the house.'],
    ]);
  });

  it('skips the Finnish quotes when there is no Finnish voice', () => {
    const said = engine([SAMANTHA]);
    speakProse('Say *kiitos* to thank someone.');
    expect(said.map((s) => s.lang)).toEqual(['en-US', 'en-US']);
  });
});

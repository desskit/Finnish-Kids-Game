import { describe, it, expect, afterEach } from 'vitest';
import { finnishVoice, finnishVoiceName } from './voices';

function withVoices(voices: { lang: string; name: string }[] | null) {
  if (voices === null) {
    delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
    return;
  }
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: { getVoices: () => voices, addEventListener() {}, removeEventListener() {} },
  });
}

afterEach(() => withVoices(null));

describe('is there a Finnish voice?', () => {
  it('tells the grown-up when Finnish would be read with an English voice', () => {
    withVoices(null);
    expect(finnishVoice()).toBe('unsupported');
    withVoices([]);
    expect(finnishVoice()).toBe('unknown');
    withVoices([{ lang: 'en-US', name: 'Samantha' }]);
    expect(finnishVoice()).toBe('none');
    withVoices([{ lang: 'en-US', name: 'Samantha' }, { lang: 'fi-FI', name: 'Satu' }]);
    expect(finnishVoice()).toBe('finnish');
    expect(finnishVoiceName()).toBe('Satu');
  });
});

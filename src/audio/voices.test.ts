import { describe, it, expect, afterEach } from 'vitest';
import { canHearFinnish, finnishVoice, finnishVoiceName } from './voices';

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

describe('can Finnish be heard here?', () => {
  it('not when muted, with no speech, or with no Finnish voice — then the games show it as text', () => {
    expect(canHearFinnish(false, 'finnish')).toBe(true);
    // the list may still be loading: stay hopeful
    expect(canHearFinnish(false, 'unknown')).toBe(true);
    expect(canHearFinnish(true, 'finnish')).toBe(false);
    expect(canHearFinnish(false, 'none')).toBe(false);
    expect(canHearFinnish(false, 'unsupported')).toBe(false);
  });
});

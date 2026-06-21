// Placeholder Finnish audio via the Web Speech API (SpeechSynthesis).
// This needs no asset files and works offline once a Finnish voice is present.
// In a later session this is swapped for recorded native voiceover, keyed off
// the same content data — callers won't need to change.

const FINNISH = 'fi-FI';

function pickFinnishVoice(): SpeechSynthesisVoice | undefined {
  if (!('speechSynthesis' in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang?.toLowerCase().startsWith('fi'));
}

export function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let cachedHasFinnish: boolean | null = null;

/** Best-effort check used only for a gentle UI hint; never blocks play. */
export function hasFinnishVoice(): boolean {
  if (!isSpeechAvailable()) return false;
  if (cachedHasFinnish !== null) return cachedHasFinnish;
  const found = !!pickFinnishVoice();
  // getVoices() is often empty until voices load; only cache a positive result.
  if (found) cachedHasFinnish = true;
  return found;
}

if (isSpeechAvailable()) {
  // Warm the voice list (Chrome populates it asynchronously).
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedHasFinnish = !!pickFinnishVoice();
  };
}

export function speak(text: string): void {
  if (!isSpeechAvailable()) return;
  const synth = window.speechSynthesis;
  synth.cancel(); // stop anything mid-utterance so prompts feel responsive
  const u = new SpeechSynthesisUtterance(text);
  u.lang = FINNISH;
  const voice = pickFinnishVoice();
  if (voice) u.voice = voice;
  u.rate = 0.85; // a touch slower for young learners
  u.pitch = 1.05;
  synth.speak(u);
}

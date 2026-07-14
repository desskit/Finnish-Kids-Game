// Placeholder Finnish audio via the Web Speech API (SpeechSynthesis).
// This needs no asset files and works offline once a Finnish voice is present.
// In a later session this is swapped for recorded native voiceover, keyed off
// the same content data — callers won't need to change.

import { isMuted } from './mute';

const FINNISH = 'fi-FI';
const ENGLISH = 'en-US';

function pickVoice(langPrefix: string): SpeechSynthesisVoice | undefined {
  if (!('speechSynthesis' in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang?.toLowerCase().startsWith(langPrefix));
}

function pickFinnishVoice(): SpeechSynthesisVoice | undefined {
  return pickVoice('fi');
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

function speakIn(text: string, lang: string, langPrefix: string, queue = false): void {
  if (isMuted() || !isSpeechAvailable()) return;
  const synth = window.speechSynthesis;
  // Default: cut off anything mid-utterance so a fresh prompt feels responsive.
  // Queued: let the current line finish first, so a SEQUENCE of lines (a
  // conversation) plays one after another instead of clobbering each other.
  if (!queue) synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  const voice = pickVoice(langPrefix);
  if (voice) u.voice = voice;
  u.rate = 0.85; // a touch slower for young learners
  u.pitch = 1.05;
  synth.speak(u);
}

/**
 * Speak Finnish — the target language, so this is what's being learned. Pass
 * `{ queue: true }` to append after any line still playing (back-to-back
 * conversation turns) instead of interrupting it.
 */
export function speak(text: string, opts?: { queue?: boolean }): void {
  speakIn(text, FINNISH, 'fi', opts?.queue);
}

/**
 * Speak an ENGLISH prompt/gloss aloud — for a pre-reader, the English hint
 * text is otherwise silent. Safe to auto-play before an answer: it narrates
 * text already shown on screen and never previews the Finnish target.
 */
export function speakEnglish(text: string): void {
  speakIn(text, ENGLISH, 'en');
}

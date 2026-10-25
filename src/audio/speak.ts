// Placeholder Finnish audio via the Web Speech API (SpeechSynthesis).
// This needs no asset files and works offline once a Finnish voice is present
// (without one, Finnish is never spoken at all — never in an English voice).
// In a later session this is swapped for recorded native voiceover, keyed off
// the same content data — callers won't need to change.

import { isMuted } from './mute';
import { speechCleared, speechEnded, speechStarted } from './speaking';

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

function speakIn(
  text: string,
  lang: string,
  langPrefix: string,
  queue = false,
  onStart?: () => void,
  onEnd?: () => void,
  slow = false,
  pitch = 1.05,
): void {
  if (isMuted() || !isSpeechAvailable()) return;
  const synth = window.speechSynthesis;
  // Default: cut off anything mid-utterance so a fresh prompt feels responsive.
  // Queued: let the current line finish first, so a SEQUENCE of lines (a
  // conversation) plays one after another instead of clobbering each other.
  if (!queue) {
    synth.cancel();
    speechCleared();
  }
  const voice = pickVoice(langPrefix);
  // Never Finnish in another language's voice: a child would hear, and copy,
  // the wrong sounds. Once the voice list has loaded and has no Finnish voice,
  // Finnish stays silent (the games show it as text instead — see
  // `canHearFinnish` in voices.ts). An empty list may still be loading, so it
  // is left to the browser, which picks by `lang`.
  if (!voice && langPrefix === 'fi' && synth.getVoices().length > 0) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  if (voice) u.voice = voice;
  u.rate = slow ? 0.6 : 0.85; // a touch slower for young learners (much slower on request)
  u.pitch = pitch;
  u.onstart = () => {
    speechStarted(u);
    onStart?.();
  };
  u.onend = () => {
    speechEnded(u);
    onEnd?.();
  };
  u.onerror = () => speechEnded(u);
  synth.speak(u);
}

/**
 * Speak Finnish — the target language, so this is what's being learned. Pass
 * `{ queue: true }` to append after any line still playing (back-to-back
 * conversation turns) instead of interrupting it. `pitch` gives a story's
 * characters their own voices (the same Finnish voice, higher or lower).
 */
export function speak(
  text: string,
  opts?: { queue?: boolean; onStart?: () => void; onEnd?: () => void; slow?: boolean; pitch?: number },
): void {
  speakIn(text, FINNISH, 'fi', opts?.queue, opts?.onStart, opts?.onEnd, opts?.slow, opts?.pitch);
}

/** Stop whatever is being spoken (leaving a story mid-page). */
export function stopSpeaking(): void {
  if (isSpeechAvailable()) window.speechSynthesis.cancel();
  speechCleared();
}

/**
 * Speak an ENGLISH prompt/gloss aloud — for a pre-reader, the English hint
 * text is otherwise silent. Safe to auto-play before an answer: it narrates
 * text already shown on screen and never previews the Finnish target.
 */
export function speakEnglish(text: string): void {
  speakIn(text, ENGLISH, 'en');
}

/** An ending as prose writes it — "-ssa", "-i-", "-ssa / -ssä": Finnish, though not in italics. */
const ENDINGS = /((?<![\p{L}-])-[a-zåäö]+-?(?:\s*\/\s*-[a-zåäö]+-?)*)/u;

/** Short English words a bold run of letters might hold ("a vowel **or** a consonant"). */
const SHORT_ENGLISH = new Set(['or', 'in', 'on', 'is', 'it', 'at', 'to', 'no', 'so', 'an', 'of', 'by', 'up', 'me', 'we', 'he', 'and', 'the', 'not', 'all', 'you', 'one', 'two', 'six', 'ten', 'yes', 'any', 'are']);

/** A bold run of Finnish letters or a sound change: "**a, o, u**", "**kk → k**", "**k → ∅**", "**n**". */
function isLetters(bold: string): boolean {
  const tokens = bold.split(/[\s,/+→←∅]+/).filter(Boolean);
  // Lower-case letters ("**kk → k**"), or capitals naming letters ("**KPT**").
  return tokens.length > 0 && tokens.every((t) => (/^[a-zåäö]{1,3}$/.test(t) && !SHORT_ENGLISH.has(t)) || /^[A-ZÅÄÖ]{2,3}$/.test(t));
}

/**
 * An explanation split for reading aloud: each *Finnish* quote, each ending
 * ("-ssa / -ssä") and each bold run of Finnish letters ("**a, o, u**") is a
 * Finnish part, the rest English. Markup (`**bold**`, arrows) isn't read; an
 * ending is said without its hyphens.
 */
export function proseParts(text: string): { text: string; fi: boolean }[] {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
    .flatMap((p) => {
      if (p.startsWith('**') && p.endsWith('**') && p.length > 4 && isLetters(p.slice(2, -2))) {
        return [{ text: p.slice(2, -2), fi: true }];
      }
      if (!p.startsWith('**') && p.startsWith('*') && p.endsWith('*') && p.length > 2) {
        return [{ text: p.slice(1, -1), fi: true }];
      }
      return p
        .replace(/\*\*/g, '')
        .split(ENDINGS)
        .map((q, i) => (i % 2 === 1 ? { text: q.replace(/-/g, ''), fi: true } : { text: q, fi: false }));
    })
    .map((p) => ({ ...p, text: p.text.replace(/∅/g, '').replace(/[→←+]/g, ', ').replace(/\s*\/\s*/g, ', ').trim() }))
    .filter((p) => /\p{L}/u.test(p.text));
}

/**
 * Read an explanation aloud (a lesson card, a "Why?" tip): the English in an
 * English voice and every Finnish quote or ending in the Finnish one, one after
 * another — so Finnish is never said with an English accent. Without a Finnish
 * voice the Finnish parts are skipped, like any Finnish.
 */
export function speakProse(text: string): void {
  proseParts(text).forEach((p, i) => {
    if (p.fi) speakIn(p.text, FINNISH, 'fi', i > 0);
    else speakIn(p.text, ENGLISH, 'en', i > 0);
  });
}

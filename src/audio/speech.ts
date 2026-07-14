// Speech RECOGNITION (the mic side) via the Web Speech API — the substrate for
// the "Sano se" speaking game. This is the counterpart to speak.ts (the TTS
// side). It is strictly push-to-talk: nothing here starts the mic on its own;
// a caller only ever starts a session in direct response to a tap.
//
// Feature-detected everywhere: browsers without SpeechRecognition (e.g. Firefox)
// and non-browser environments (tests) report unavailable, and callers hide the
// feature rather than showing a broken mic. Recognition is cloud-processed on
// Chrome/Edge/Android (audio leaves the device) and on-device on iOS Safari —
// see the parent disclosure in Settings.

// Minimal typing for the (still non-standard) SpeechRecognition API.
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  results: { 0: SpeechRecognitionResultLike; length: number };
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** Is speech recognition usable in this browser? Callers hide the mic if not. */
export function isSpeechRecognitionAvailable(): boolean {
  return !!getCtor();
}

const FINNISH = 'fi-FI';

/** Why a listen attempt ended without a usable transcript. */
export type ListenError = 'no-speech' | 'not-allowed' | 'aborted' | 'error';

export interface ListenHandlers {
  /** All recognition alternatives (best first), for a generous match. */
  onResult: (transcripts: string[]) => void;
  /** No usable speech, permission denied, aborted, or a browser error. */
  onError: (kind: ListenError) => void;
}

/** A running recognition session; call stop() to cancel (e.g. on unmount). */
export interface ListenSession {
  stop(): void;
}

/**
 * Start ONE push-to-talk recognition in Finnish. Returns a session with stop(),
 * or null if unavailable (callers should have hidden the mic already, but this
 * makes misuse safe). Resolves through exactly one of onResult/onError.
 */
export function listenOnce(
  { onResult, onError }: ListenHandlers,
  maxAlternatives = 5,
): ListenSession | null {
  const Ctor = getCtor();
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = FINNISH;
  rec.interimResults = false;
  rec.continuous = false;
  rec.maxAlternatives = maxAlternatives;

  let settled = false;
  const settle = (fn: () => void) => {
    if (settled) return;
    settled = true;
    fn();
  };

  rec.onresult = (e) => {
    const result = e.results[0];
    const transcripts: string[] = [];
    for (let i = 0; i < result.length; i++) transcripts.push(result[i].transcript);
    settle(() => onResult(transcripts));
  };
  rec.onerror = (e) => {
    const kind: ListenError =
      e.error === 'no-speech' ? 'no-speech' : e.error === 'not-allowed' ? 'not-allowed' : 'error';
    settle(() => onError(kind));
  };
  rec.onend = () => {
    // Fired after result/error, or on a silent timeout with neither.
    settle(() => onError('no-speech'));
  };

  try {
    rec.start();
  } catch {
    settle(() => onError('error'));
    return { stop() {} };
  }

  return {
    stop() {
      settle(() => onError('aborted'));
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    },
  };
}

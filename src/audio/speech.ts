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

/** A running recognition session. */
export interface ListenSession {
  /**
   * Stop listening and use what was heard so far: resolves through onResult,
   * or onError('no-speech') if nothing was. The "I'm done" tap — in a noisy
   * room the recognizer may never hear the child stop.
   */
  finish(): void;
  /** Cancel (e.g. on unmount): resolves through onError('aborted'). */
  stop(): void;
}

export interface ListenOptions {
  maxAlternatives?: number;
  /** Finish on its own after this long (ms); 0 = wait for the recognizer. */
  maxMs?: number;
}

/** How long a finished session may take to hand back its result. */
const FINISH_GRACE_MS = 3000;

/**
 * Start ONE push-to-talk recognition in Finnish. Returns a session with
 * finish() and stop(), or null if unavailable (callers should have hidden the
 * mic already, but this makes misuse safe). Resolves through exactly one of
 * onResult/onError.
 */
export function listenOnce(
  { onResult, onError }: ListenHandlers,
  { maxAlternatives = 5, maxMs = 0 }: ListenOptions = {},
): ListenSession | null {
  const Ctor = getCtor();
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = FINNISH;
  rec.interimResults = false;
  rec.continuous = false;
  rec.maxAlternatives = maxAlternatives;

  let settled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const settle = (fn: () => void) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    fn();
  };
  const finish = () => {
    if (settled) return;
    clearTimeout(timer);
    // If the browser never hands anything back, don't stay "listening".
    timer = setTimeout(() => {
      settle(() => onError('no-speech'));
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    }, FINISH_GRACE_MS);
    try {
      rec.stop();
    } catch {
      settle(() => onError('error'));
    }
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
    return { finish() {}, stop() {} };
  }
  if (maxMs > 0) timer = setTimeout(finish, maxMs);

  return {
    finish,
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

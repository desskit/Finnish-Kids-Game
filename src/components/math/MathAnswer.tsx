import { useCallback, useEffect, useRef, useState } from 'react';
import { numberWord } from '../../game/math';
import { matchNumberSpeech, normalizeSpoken } from '../../game/speechMatch';
import { answerMatches, readyToJudge, typeAt } from '../../game/answer';
import { stopSpeaking, speak } from '../../audio/speak';
import { listenOnce, type ListenSession } from '../../audio/speech';
import Art from '../../art/Art';
import SpeakerIcon from '../../art/SpeakerIcon';
import FinnishLetters from '../FinnishLetters';

// The three ways to answer a math problem, all in Finnish: tap a number word
// (or, at the top levels, a choice only heard), say it, or type it. None shows
// a digit — and what a recognizer heard is never shown either, since it may
// write a number as one.

// --- Tap ---------------------------------------------------------------------------

interface ChoicesProps {
  options: number[];
  answer: number;
  answered: boolean;
  wrong: number[];
  /** Choices only heard: the first tap says it, the second picks it. */
  heard: boolean;
  picked: number | null;
  /** Wagons for the train's choices. */
  look?: 'wagons';
  onChoose: (v: number) => void;
}

export function MathChoices({ options, answer, answered, wrong, heard, picked, look, onChoose }: ChoicesProps) {
  return (
    <div className={'math-choices' + (heard ? ' math-choices--heard' : '') + (look ? ` math-choices--${look}` : '')}>
      {heard && !answered && (
        <p className="math-choices__help">
          Kuuntele <span className="en">Tap to hear it, tap again to choose</span>
        </p>
      )}
      {options.map((v, i) => {
        const isWrong = wrong.includes(v);
        const isRight = answered && v === answer;
        return (
          <button
            key={v}
            type="button"
            lang="fi"
            className={
              'math-choice' +
              (isWrong ? ' math-choice--wrong' : '') +
              (isRight ? ' math-choice--right' : '') +
              (picked === v && !answered ? ' math-choice--picked' : '')
            }
            onClick={() => onChoose(v)}
            disabled={answered || isWrong}
            // an only-heard choice has no word to read: a letter tells them apart
            aria-label={heard && !answered ? `Kuuntele · Listen (${String.fromCharCode(65 + i)})` : undefined}
          >
            {heard && !answered ? <SpeakerIcon /> : numberWord(v)}
          </button>
        );
      })}
    </div>
  );
}

// --- Say -----------------------------------------------------------------------------

/** Stop listening on its own after this long (a noisy room may never go quiet). */
const MAX_LISTEN_MS = 8000;

type MicState = 'none' | 'listening' | 'tryagain' | 'unheard' | 'denied';

interface MicProps {
  answer: number;
  /** Answered or given up: the mic is put away. */
  locked: boolean;
  /** Tries that weren't heard as the answer so far (the second ends it). */
  misses: number;
  onRight: () => void;
  onMiss: () => void;
  /** "I said it": a grown-up vouches for a try the mic couldn't hear. */
  onVouch: () => void;
}

/**
 * Say the answer: tap the mic, say the number word, tap again when done. It's
 * heard generously (`matchNumberSpeech`: "viisi", "viis", "se on viisi"), but
 * never one number inside another. Silence or a hiccup isn't a try.
 */
export function MathMic({ answer, locked, misses, onRight, onMiss, onVouch }: MicProps) {
  const [state, setState] = useState<MicState>('none');
  const session = useRef<ListenSession | null>(null);
  useEffect(() => () => session.current?.stop(), []);

  const listen = useCallback(() => {
    if (locked) return;
    if (state === 'listening') {
      session.current?.finish();
      return;
    }
    // don't let the recognizer hear the app's own voice
    stopSpeaking();
    setState('listening');
    session.current = listenOnce(
      {
        onResult: (heard) => {
          if (!heard.some((t) => normalizeSpoken(t))) {
            setState('unheard');
            return;
          }
          if (matchNumberSpeech(heard, answer)) {
            setState('none');
            onRight();
          } else {
            setState('tryagain');
            onMiss();
          }
        },
        onError: (kind) => {
          if (kind === 'aborted') return;
          setState(kind === 'not-allowed' ? 'denied' : 'unheard');
        },
      },
      { maxMs: MAX_LISTEN_MS },
    );
    if (!session.current) setState('unheard');
  }, [locked, state, answer, onRight, onMiss]);

  if (locked) return null;
  const listening = state === 'listening';
  const status =
    state === 'listening'
      ? 'Kuuntelen… · Listening…'
      : state === 'tryagain' || state === 'unheard'
        ? 'Yritä uudestaan · Try again'
        : state === 'denied'
          ? 'Salli mikrofoni ja yritä uudestaan · Allow the mic and try again'
          : '​';
  const canVouch = !listening && (misses > 0 || state === 'unheard' || state === 'denied');
  return (
    <div className="math-mic">
      <button
        type="button"
        className={'mic-button' + (listening ? ' mic-button--listening' : '')}
        onClick={listen}
        aria-label={listening ? "I'm done" : 'Tap and say the answer'}
      >
        <Art glyph="🎤" />
        <span className="mic-button__hint">{listening ? 'Valmis · Done' : 'Paina ja puhu · Tap & speak'}</span>
      </button>
      <p className="say-status" role="status" aria-live="polite">
        {status}
      </p>
      {state === 'unheard' && (
        <p className="say-hint say-hint--soft en">The mic didn't catch that — hold the device close and try again.</p>
      )}
      {canVouch && (
        <button type="button" className="btn btn--ghost btn--sm say-vouch" onClick={onVouch}>
          Sanoin sen <span className="en">I said it</span>
        </button>
      )}
    </div>
  );
}

// --- Type ------------------------------------------------------------------------------

interface TypingProps {
  answer: number;
  locked: boolean;
  onRight: () => void;
  onMiss: () => void;
  /** Stuck: show the answer and move on. */
  onSkip: () => void;
}

/**
 * Type the answer's word. Only letters count: a digit gets a nudge to write
 * it in Finnish, never a buzz.
 */
export function MathTyping({ answer, locked, onRight, onMiss, onSkip }: TypingProps) {
  const [typed, setTyped] = useState('');
  const [shake, setShake] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const word = numberWord(answer);
  const digits = /\d/.test(typed);
  const right = answerMatches(typed, word);

  useEffect(() => {
    input.current?.focus();
  }, []);

  function onChange(value: string) {
    if (locked) return;
    setTyped(value);
    if (/\d/.test(value) || !readyToJudge(value, word)) return;
    if (answerMatches(value, word)) {
      speak(word);
      onRight();
    } else {
      onMiss();
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  function typeLetter(letter: string) {
    const el = input.current;
    const next = typeAt(el, typed, letter);
    onChange(next.value);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(next.caret, next.caret);
    });
  }

  return (
    <div className="math-type">
      <input
        ref={input}
        className={'spell-input' + (shake ? ' spell-input--wrong' : '') + (right ? ' spell-input--correct' : '')}
        value={typed}
        onChange={(e) => onChange(e.target.value)}
        readOnly={locked}
        type="text"
        inputMode="text"
        lang="fi"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        aria-label="Type the answer in Finnish"
      />
      <FinnishLetters onLetter={typeLetter} disabled={locked} />
      {digits && (
        <p className="say-hint">
          Kirjoita suomeksi <span className="en">Write it in Finnish, with letters</span>
        </p>
      )}
      {!locked && (
        <div className="stuck-help">
          <button type="button" className="btn btn--ghost" onClick={onSkip}>
            Ohita <span className="en">Skip</span> →
          </button>
        </div>
      )}
    </div>
  );
}

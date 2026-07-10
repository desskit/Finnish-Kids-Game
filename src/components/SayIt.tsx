import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Construction, LexicalItem } from '../content/types';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { familiarityWeigher } from '../game/srs';
import { buildSayRound } from '../game/round';
import { matchSpeech } from '../game/speechMatch';
import { scorePronunciation, type PronunciationScore } from '../game/phonemes';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import { isSpeechRecognitionAvailable, listenOnce, type ListenSession } from '../audio/speech';
import ActivityHeader from './ActivityHeader';

const QUESTIONS = 6;
const INTRO_KEY = 'fkg.speak.introSeen';

interface Props {
  items: LexicalItem[];
  /** When non-empty, say full carrier phrases; otherwise say the bare words. */
  constructions: Construction[];
  title?: string;
  onExit: () => void;
}

// Sano se (speaking): see + hear the Finnish (model TTS), tap the mic, say it.
// Push-to-talk only. Matching is deliberately generous and the round NEVER
// blocks — two unrecognized tries advances anyway with warm copy, so a young
// child (or an unreliable recognizer) is never stuck. When speech recognition
// isn't available the mic becomes a self-paced "I said it" — the repeat-after-me
// still happens; it just isn't scored.
export default function SayIt({ items, constructions, title, onExit }: Props) {
  const { level, addStars, recordAttempt, activeChild } = useProfile();
  const ctx = useActivityContext();
  const { maxTier } = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;
  const available = isSpeechRecognitionAvailable();

  const missed = useRef(false);
  const firstTries = useRef(0);
  const session = useRef<ListenSession | null>(null);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    // `roundQuestions` (Audit harness) caps the round to stop after each answer.
    () => buildSayRound(items, constructions, QUESTIONS, maxTier, weigh).slice(0, ctx?.roundQuestions),
    [items, constructions, maxTier, weigh, runId, ctx?.roundQuestions],
  );

  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<'none' | 'tryagain' | 'good' | 'giveup' | 'denied'>('none');
  // Per-sound pronunciation feedback for the latest attempt (null before any).
  const [score, setScore] = useState<PronunciationScore | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  // One-time parent-facing mic notice (per device).
  const [introSeen, setIntroSeen] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(INTRO_KEY) === '1',
  );

  const target = round[index];

  // Model the pronunciation when a new question appears (this game SHOWS the
  // Finnish — it's repeat-after-me, not recall).
  useEffect(() => {
    if (!target || done || !introSeen) return;
    const t = setTimeout(() => speak(target.say), 400);
    return () => clearTimeout(t);
  }, [target, done, introSeen, index]);

  // Stop any live recognition if the component unmounts (segment swap).
  useEffect(() => () => session.current?.stop(), []);

  const advance = useCallback(
    (success: boolean) => {
      setLocked(true);
      if (success) {
        playDing(true);
        addStars(1);
      }
      if (target?.attemptId) recordAttempt(target.attemptId, success);
      if (success && !missed.current) firstTries.current += 1;
      const next = index + 1;
      setTimeout(
        () => {
          if (next >= round.length) setDone(true);
          else {
            setIndex(next);
            setAttempts(0);
            setResult('none');
            setScore(null);
          }
          missed.current = false;
          setLocked(false);
          setListening(false);
        },
        success ? 900 : 1300,
      );
    },
    [target, index, round.length, addStars, recordAttempt],
  );

  const registerMiss = useCallback(() => {
    missed.current = true;
    playDing(false);
    const n = attempts + 1;
    setAttempts(n);
    if (n >= 2) {
      setResult('giveup');
      advance(false); // never a dead end — move on with encouragement
    } else {
      setResult('tryagain');
    }
  }, [attempts, advance]);

  const startListening = useCallback(() => {
    if (locked || done || listening || !introSeen) return;
    if (!available) {
      // Self-report fallback: the modeled word was practiced; advance kindly
      // but don't credit SRS (nothing was actually verified).
      setResult('good');
      addStars(1);
      const next = index + 1;
      setLocked(true);
      setTimeout(() => {
        if (next >= round.length) setDone(true);
        else {
          setIndex(next);
          setResult('none');
        }
        setLocked(false);
      }, 700);
      return;
    }
    setResult('none');
    setScore(null);
    setListening(true);
    session.current = listenOnce({
      onResult: (transcripts) => {
        setListening(false);
        if (!target) return;
        // Rich per-sound feedback either way; matchSpeech stays the (kind) gate.
        setScore(scorePronunciation(target.say, transcripts));
        if (matchSpeech(transcripts, target.say)) {
          setResult('good');
          advance(true);
        } else {
          registerMiss();
        }
      },
      onError: (kind) => {
        setListening(false);
        if (kind === 'aborted') return;
        if (kind === 'not-allowed') {
          setResult('denied'); // let them enable the mic and tap again
          return;
        }
        registerMiss();
      },
    });
  }, [locked, done, listening, introSeen, available, target, index, round.length, addStars, advance, registerMiss]);

  function restart() {
    setIndex(0);
    setAttempts(0);
    setListening(false);
    setResult('none');
    setScore(null);
    setLocked(false);
    setDone(false);
    missed.current = false;
    firstTries.current = 0;
    setRunId((r) => r + 1);
  }

  useSegmentComplete(done, firstTries.current, round.length, restart);

  function dismissIntro() {
    try {
      localStorage.setItem(INTRO_KEY, '1');
    } catch {
      /* ignore */
    }
    setIntroSeen(true);
  }

  if (done) return null;
  if (!target) return null;

  if (!introSeen) {
    return (
      <section className="screen activity">
        <ActivityHeader
          title={title ?? 'Sano se · Say it'}
          index={0}
          total={round.length}
          onExit={onExit}
        />
        <div className="phrase-card say-intro">
          <span className="phrase-emoji" aria-hidden="true">
            🎤
          </span>
          <p className="prompt">Puheharjoittelu · Speaking practice</p>
          <p className="en">
            This game uses the microphone so your child can say Finnish words out loud. The mic only
            turns on when the button is tapped. On some browsers the audio is sent online to be
            recognized. You can turn it off anytime in the grown-up settings.
          </p>
          <button className="btn btn--primary" onClick={dismissIntro}>
            Selvä · OK
          </button>
        </div>
      </section>
    );
  }

  const status =
    result === 'good'
      ? 'Hienoa! · Great!'
      : result === 'giveup'
        ? 'Hyvä yritys! · Good try!'
        : result === 'tryagain'
          ? 'Yritä uudestaan · Try again'
          : result === 'denied'
            ? 'Salli mikrofoni ja yritä uudestaan · Allow the mic and try again'
            : listening
              ? 'Kuuntelen… · Listening…'
              : '​';

  return (
    <section className="screen activity">
      <ActivityHeader
        title={title ?? 'Sano se · Say it'}
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <p className="prompt">
        Sano tämä ääneen <span className="en">Say this out loud</span>
      </p>

      <div className="phrase-card">
        {target.emoji && (
          <span className="phrase-emoji" aria-hidden="true">
            {target.emoji}
          </span>
        )}
        {/* After an attempt, map the per-sound feedback onto the word; before,
            just show the plain target to say. */}
        {score ? (
          <PronunciationStrip score={score} />
        ) : (
          <p className="say-target">{target.say}</p>
        )}
        <p className="en phrase-hint">{target.gloss}</p>
        <button
          className="speaker speaker--inline"
          onClick={() => speak(target.say)}
          aria-label="Hear it again"
        >
          🔊 <span className="en">Listen</span>
        </button>
      </div>

      <button
        className={'mic-button' + (listening ? ' mic-button--listening' : '')}
        onClick={startListening}
        disabled={locked}
        aria-label={available ? 'Tap and say the word' : 'I said it'}
      >
        🎤
        <span className="mic-button__hint">
          {available ? 'Paina ja puhu · Tap & speak' : 'Sanoin sen · I said it'}
        </span>
      </button>

      <p className="say-status" role="status" aria-live="polite">
        {status}
      </p>
      {score?.hasLengthError && (
        <p className="say-hint">
          Pidennä pitkää ääntä <span className="en">— mind the long sound, hold the doubled letter</span>
        </p>
      )}
    </section>
  );
}

/** The target word with each sound tinted by how it was pronounced. */
function PronunciationStrip({ score }: { score: PronunciationScore }) {
  // Group the scored target sounds back into their words for spacing.
  const words: { text: string; status: string }[][] = [];
  for (const { sound, status } of score.sounds) {
    (words[sound.word] ??= []).push({ text: sound.text, status });
  }
  return (
    <p className="pron-strip" aria-label={`Pronunciation of ${score.heard || 'your attempt'}`}>
      {words.map((word, wi) => (
        <span className="pron-word" key={wi}>
          {word.map((s, si) => (
            <span key={si} className={`sound sound--${s.status}`}>
              {s.text}
            </span>
          ))}
        </span>
      ))}
    </p>
  );
}

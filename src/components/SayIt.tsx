import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Construction, LexicalItem, Tier } from '../content/types';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { familiarityWeigher } from '../game/srs';
import { buildSayRound, type SayTarget, type WeighFn } from '../game/round';
import { matchSpeech, normalizeSpoken } from '../game/speechMatch';
import { scorePronunciation, type PronunciationScore } from '../game/phonemes';
import { speak, stopSpeaking } from '../audio/speak';
import { playDing } from '../audio/sfx';
import { isSpeechRecognitionAvailable, listenOnce, type ListenSession } from '../audio/speech';
import ActivityHeader from './ActivityHeader';
import Art from '../art/Art';
import HearYourself from './HearYourself';
import SpeakerIcon from '../art/SpeakerIcon';

const QUESTIONS = 6;
/** Set once the grown-up has seen the mic notice (per device; the math games share it). */
export const SPEAK_INTRO_KEY = 'fkg.speak.introSeen';
const INTRO_KEY = SPEAK_INTRO_KEY;
// Stop listening on its own after this long: in a noisy room the recognizer
// may never hear the child stop. (A tap on the mic stops it sooner.)
const MAX_LISTEN_MS = 8000;

type SayResult =
  | 'none'
  | 'good' // recognized: the result stays up until Continue
  | 'giveup' // two tries that didn't match: the result stays up until Continue
  | 'tryagain' // one try that didn't match
  | 'unheard' // silence, noise or a browser hiccup: not counted as a try
  | 'denied' // the mic isn't allowed
  | 'said'; // "I said it": moves on by itself

// Speaking presentation ramps with the measured level, like every other game:
//   model  (≤3): the Finnish is shown AND modeled aloud (TTS) — repeat-after-me.
//   read   (=4): the Finnish is shown but NOT spoken — read it and say it.
//   recall (≥5): only the ENGLISH is shown, no TTS — produce the Finnish from
//                memory (the per-sound feedback reveals it after the attempt).
type SayPresentation = 'model' | 'read' | 'recall';
function sayPresentation(level: number): SayPresentation {
  if (level >= 5) return 'recall';
  if (level >= 4) return 'read';
  return 'model';
}

interface Props {
  items: LexicalItem[];
  /** When non-empty, say full carrier phrases; otherwise say the bare words. */
  constructions: Construction[];
  /**
   * Node-specific spoken targets (e.g. `speakableTargetsFor`) — when given, this
   * replaces the default items/constructions round, so any skill can supply its
   * own Finnish to say ("kolme kissaa", "minä syön", …). Receives the measured
   * `level` too, so speaking can ramp (word → phrase → whole exchange).
   */
  buildRound?: (maxTier: Tier, level: number, weigh: WeighFn) => SayTarget[];
  title?: string;
  onExit: () => void;
}

// Sano se (speaking): see + hear the Finnish (model TTS), tap the mic, say it.
// Push-to-talk only; a second tap says "done" (a noisy room can keep the
// recognizer listening). Each judged try shows its result — every sound tinted
// by how it was heard — until the child taps Continue. Matching is deliberately
// generous and the round NEVER blocks: two tries that don't match end warmly;
// silence or a recognizer error isn't counted as a try at all; and after a miss
// "I said it" lets a grown-up vouch for an attempt the mic couldn't hear (a
// star, but no SRS credit — nothing was verified). When speech recognition
// isn't available the mic itself becomes "I said it" — the repeat-after-me
// still happens; it just isn't scored.
//
// Recognisers misjudge children's voices too often to be the judge
// (docs/LEARNING_RESEARCH.md), so the child can also record themselves and hear
// their own try beside the model (HearYourself), and in Together mode the
// grown-up listening beside them gives the verdict: their 👍 is a real success.
export default function SayIt({ items, constructions, buildRound, title, onExit }: Props) {
  const { level, addStars, recordAttempt, activeChild, settings } = useProfile();
  // Together mode: a grown-up listening beside the child judges the try (their 👍 counts).
  const together = !!settings.together;
  const ctx = useActivityContext();
  const difficulty = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  const { maxTier } = difficulty;
  const presentation = sayPresentation(difficulty.level);
  // A production game: words heard enough come first (srs.ts `productionReady`).
  const weigh = useRef(familiarityWeigher(activeChild?.srs, { production: true, heard: activeChild?.heard })).current;
  const available = isSpeechRecognitionAvailable();

  const missed = useRef(false);
  const firstTries = useRef(0);
  const session = useRef<ListenSession | null>(null);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    // A node-specific `buildRound` (any skill's own spoken content) takes over
    // when given; otherwise the default items/constructions round. `roundQuestions`
    // (Audit harness) caps the round to stop after each answer.
    () =>
      (buildRound
        ? buildRound(maxTier, difficulty.level, weigh)
        : buildSayRound(items, constructions, QUESTIONS, maxTier, weigh)
      ).slice(0, ctx?.roundQuestions),
    // buildRound is an inline closure (new identity each render); restart via runId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, constructions, maxTier, difficulty.level, weigh, runId, ctx?.roundQuestions],
  );

  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<SayResult>('none');
  // Per-sound pronunciation feedback for the latest attempt (null before any).
  const [score, setScore] = useState<PronunciationScore | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  // One-time parent-facing mic notice (per device).
  const [introSeen, setIntroSeen] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(INTRO_KEY) === '1',
  );

  const target = round[index];
  const judged = result === 'good' || result === 'giveup';
  const modelTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Model the pronunciation when a new question appears — but only in the
  // `model` band (repeat-after-me). Higher levels drop the TTS so the child
  // produces the word themselves.
  useEffect(() => {
    if (!target || done || !introSeen || presentation !== 'model') return;
    modelTimer.current = setTimeout(() => speak(target.say), 400);
    return () => clearTimeout(modelTimer.current);
  }, [target, done, introSeen, index, presentation]);

  // Stop any live recognition if the component unmounts (segment swap).
  useEffect(() => () => session.current?.stop(), []);

  // Safety net: never stall the rotation on an empty round. `speakableTargetsFor`
  // already falls back to the node's bare words, so this is only reachable with a
  // genuinely empty pool — complete the (empty) segment so the next game mounts
  // instead of the child staring at a blank screen.
  useEffect(() => {
    if (round.length === 0) setDone(true);
  }, [round.length]);

  /** On to the next thing to say (or the end of the round). */
  const next = useCallback(() => {
    const n = index + 1;
    if (n >= round.length) setDone(true);
    else {
      setIndex(n);
      setAttempts(0);
      setResult('none');
      setScore(null);
    }
    missed.current = false;
    setLocked(false);
    setListening(false);
  }, [index, round.length]);

  /** Score a finished try. The result stays on screen until Continue. */
  const judge = useCallback(
    (success: boolean) => {
      setLocked(true);
      if (success) {
        playDing(true);
        addStars(1);
      }
      if (target?.attemptId) recordAttempt(target.attemptId, success);
      if (success && !missed.current) firstTries.current += 1;
    },
    [target, addStars, recordAttempt],
  );

  const registerMiss = useCallback(() => {
    missed.current = true;
    playDing(false);
    const n = attempts + 1;
    setAttempts(n);
    if (n >= 2) {
      setResult('giveup');
      judge(false); // never a dead end — Continue moves on with encouragement
    } else {
      setResult('tryagain');
    }
  }, [attempts, judge]);

  /**
   * "I said it": the word was practiced but nothing heard it — no recognition
   * in this browser, or a room too noisy for it. Kind: a star, then on to the
   * next; no SRS credit (nothing was actually verified).
   */
  const selfReport = useCallback(() => {
    if (locked || done) return;
    session.current?.stop();
    setListening(false);
    setResult('said');
    addStars(1);
    setLocked(true);
    setTimeout(next, 700);
  }, [locked, done, addStars, next]);

  /** Together mode: the grown-up heard it and it sounded right — a real success. */
  const grownUpYes = useCallback(() => {
    if (locked || done) return;
    session.current?.stop();
    setListening(false);
    setResult('good');
    judge(true);
  }, [locked, done, judge]);

  const startListening = useCallback(() => {
    if (locked || done || !introSeen) return;
    if (listening) {
      // The second tap: "I'm done" — score what was heard so far.
      session.current?.finish();
      return;
    }
    if (!available) {
      selfReport();
      return;
    }
    // Don't let the recognizer hear the app's own voice.
    clearTimeout(modelTimer.current);
    stopSpeaking();
    setResult('none');
    setScore(null);
    setListening(true);
    session.current = listenOnce(
      {
        onResult: (transcripts) => {
          setListening(false);
          if (!target) return;
          if (!transcripts.some((t) => normalizeSpoken(t))) {
            setResult('unheard');
            return;
          }
          // Rich per-sound feedback either way; matchSpeech stays the (kind) gate.
          setScore(scorePronunciation(target.say, transcripts));
          if (matchSpeech(transcripts, target.say)) {
            setResult('good');
            judge(true);
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
          // Silence, a room too loud to pick the child out, or a recognizer
          // hiccup: not the child's mistake, so it isn't counted as a try.
          setResult('unheard');
        },
      },
      { maxMs: MAX_LISTEN_MS },
    );
  }, [locked, done, listening, introSeen, available, target, judge, registerMiss, selfReport]);

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
        <SpeakIntro onOk={dismissIntro} />
      </section>
    );
  }

  const status =
    result === 'good' || result === 'said'
      ? 'Hienoa! · Great!'
      : result === 'giveup'
        ? 'Hyvä yritys! · Good try!'
        : result === 'tryagain' || result === 'unheard'
          ? 'Yritä uudestaan · Try again'
          : result === 'denied'
            ? 'Salli mikrofoni ja yritä uudestaan · Allow the mic and try again'
            : listening
              ? 'Kuuntelen… · Listening…'
              : '​';
  // Which way a length slip went: a long (doubled) sound said short, or a
  // single one held too long.
  const heldShort = score?.sounds.some((s) => s.status === 'length' && s.sound.long);
  const heldLong = score?.sounds.some((s) => s.status === 'length' && !s.sound.long);
  // After a try that didn't land (or a mic that can't hear), a grown-up can
  // vouch for it.
  const canVouch = available && !listening && (result === 'tryagain' || result === 'unheard' || result === 'denied');

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
        {presentation === 'recall' ? (
          <>
            Sano suomeksi <span className="en">Say it in Finnish</span>
          </>
        ) : (
          <>
            Sano tämä ääneen <span className="en">Say this out loud</span>
          </>
        )}
      </p>

      <div className="phrase-card">
        {target.emoji && (
          <span className="phrase-emoji" aria-hidden="true">
            <Art glyph={target.emoji} motion="loop" />
          </span>
        )}
        {/* After an attempt, map the per-sound feedback onto the word (revealing
            the Finnish even in the recall band). Before: the Finnish to say
            (model/read), or — at the highest levels — only the ENGLISH prompt. */}
        {score ? (
          <>
            <PronunciationStrip score={score} />
            <SoundKey score={score} />
          </>
        ) : (
          <p className="say-target">{presentation === 'recall' ? target.gloss : target.say}</p>
        )}
        {/* The English gloss stays a hint when the Finnish is shown; in recall it
            IS the prompt above, so only re-show it (as meaning) after the attempt. */}
        {(presentation !== 'recall' || score) && (
          <p className="en phrase-hint">{target.gloss}</p>
        )}
        {/* Listen (manual TTS) in the model band — higher levels are TTS-free
            until the child has had a go. */}
        {(presentation === 'model' || score) && (
          <button
            className="speaker speaker--inline"
            onClick={() => speak(target.say)}
            disabled={listening}
            aria-label="Hear it again"
          >
            <SpeakerIcon /> <span className="en">Listen</span>
          </button>
        )}
      </div>

      <HearYourself say={target.say} disabled={listening} />

      {judged ? (
        <button className="btn btn--primary say-next" onClick={next} autoFocus>
          Jatka <span className="en">Continue</span>
        </button>
      ) : (
        <button
          className={'mic-button' + (listening ? ' mic-button--listening' : '')}
          onClick={startListening}
          disabled={locked}
          aria-label={!available ? 'I said it' : listening ? "I'm done" : 'Tap and say the word'}
        >
          <Art glyph="🎤" />
          <span className="mic-button__hint">
            {!available ? 'Sanoin sen · I said it' : listening ? 'Valmis · Done' : 'Paina ja puhu · Tap & speak'}
          </span>
        </button>
      )}

      <p className="say-status" role="status" aria-live="polite">
        {status}
      </p>
      {heldShort && (
        <p className="say-hint">
          Pidennä pitkää ääntä <span className="en">— mind the long sound, hold the doubled letter</span>
        </p>
      )}
      {heldLong && <p className="say-hint en">Keep the single letter short</p>}
      {result === 'unheard' && (
        <p className="say-hint say-hint--soft en">The mic didn't catch that — hold the device close and try again.</p>
      )}
      {together && !judged && !locked && (
        <button className="btn btn--sm say-vouch" onClick={grownUpYes}>
          <Art glyph="👍" /> <span className="en">Grown-up: that sounded right</span>
        </button>
      )}
      {canVouch && !together && (
        <button className="btn btn--ghost btn--sm say-vouch" onClick={selfReport}>
          Sanoin sen <span className="en">I said it</span>
        </button>
      )}
    </section>
  );
}

/** The one-time notice for a grown-up before the mic is first used. */
export function SpeakIntro({ onOk }: { onOk: () => void }) {
  return (
    <div className="phrase-card say-intro">
      <span className="phrase-emoji" aria-hidden="true">
        <Art glyph="🎤" />
      </span>
      <p className="prompt">Puheharjoittelu · Speaking practice</p>
      <p className="en">
        This game uses the microphone so your child can say Finnish words out loud. The mic only
        turns on when the button is tapped. On some browsers the audio is sent online to be
        recognized. You can turn it off anytime in the grown-up settings.
      </p>
      <button className="btn btn--primary" onClick={onOk}>
        Selvä · OK
      </button>
    </div>
  );
}

/** What the colors in the strip mean — only the ones it shows, once a sound slipped. */
function SoundKey({ score }: { score: PronunciationScore }) {
  const shown = new Set(score.sounds.map((s) => s.status));
  if (shown.size === 1 && shown.has('good')) return null;
  return (
    <p className="sound-key en">
      {shown.has('good') && (
        <span>
          <i className="sound-key__dot sound-key__dot--good" /> right
        </span>
      )}
      {shown.has('length') && (
        <span>
          <i className="sound-key__dot sound-key__dot--length" /> length
        </span>
      )}
      {(shown.has('off') || shown.has('missing')) && (
        <span>
          <i className="sound-key__dot sound-key__dot--off" /> not yet
        </span>
      )}
    </p>
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

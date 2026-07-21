import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Construction, LexicalItem } from '../content/types';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { familiarityWeigher, grammarSrsId } from '../game/srs';
import { buildErrorRound } from '../game/round';
import { speak, speakEnglish } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';

const QUESTIONS = 6;

interface Props {
  items: LexicalItem[];
  constructions: Construction[];
  onExit: () => void;
}

// Löydä virhe (Find the mistake) — a whole Finnish sentence is shown with its
// intended English meaning. Half the time it is correct; half the time the one
// inflected word carries the WRONG (but real, sourced) case, so it no longer
// matches the meaning. The child taps the wrong word, or "Kaikki oikein" (all
// correct). This tests grammatical JUDGMENT — noticing that a real form is
// wrong HERE — which none of the produce/recognize games do. The wrong form is
// a lookup (a different case of the same noun), never generated.
export default function FindError({ items, constructions, onExit }: Props) {
  const { level, addStars, recordAttempt, activeChild } = useProfile();
  const ctx = useActivityContext();
  const difficulty = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  const { maxTier, tricky } = difficulty;
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;

  const missed = useRef(false);
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    // `roundQuestions` (Audit harness) caps the round to stop after each answer.
    () =>
      buildErrorRound(items, constructions, QUESTIONS, maxTier, tricky, weigh).slice(
        0,
        ctx?.roundQuestions,
      ),
    [items, constructions, maxTier, tricky, weigh, runId, ctx?.roundQuestions],
  );

  const [index, setIndex] = useState(0);
  const [wrongPick, setWrongPick] = useState<number | 'ok' | null>(null);
  const [locked, setLocked] = useState(false);
  const [solved, setSolved] = useState(false); // answered right → reveal state
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (round.length === 0) setDone(true);
  }, [round.length]);

  const q = round[index];

  // Read the intended English meaning aloud on a new question — the Finnish is
  // what's under judgment, never previewed.
  useEffect(() => {
    if (!q || done) return;
    const t = setTimeout(() => speakEnglish(q.gloss), 350);
    return () => clearTimeout(t);
  }, [q, done]);

  const succeed = useCallback(() => {
    if (!q) return;
    setLocked(true);
    setSolved(true);
    playDing(true);
    // Confirm by speaking the CORRECT sentence (fixed words + the right form).
    const correctSentence = q.words
      .map((w, i) => (i === q.slotIndex ? q.correctForm : w.text.replace(/[.!?]+$/, '')))
      .join(' ');
    speak(correctSentence + (q.words[q.words.length - 1].text.match(/[.!?]+$/)?.[0] ?? ''));
    addStars(1);
    recordAttempt(q.item.id, !missed.current);
    recordAttempt(grammarSrsId(`err:${q.construction.id}`), !missed.current);
    if (!missed.current) firstTries.current += 1;
    setWrongPick(null);
    const next = index + 1;
    setTimeout(() => {
      if (next >= round.length) setDone(true);
      else {
        setIndex(next);
        setSolved(false);
      }
      missed.current = false;
      setLocked(false);
    }, 1400);
  }, [q, index, round.length, addStars, recordAttempt]);

  const wrong = useCallback((pick: number | 'ok') => {
    missed.current = true;
    playDing(false);
    setWrongPick(pick);
    setTimeout(() => setWrongPick((cur) => (cur === pick ? null : cur)), 600);
  }, []);

  // Tap a word: right only if the sentence IS wrong and this is the bad slot.
  const tapWord = useCallback(
    (i: number) => {
      if (!q || locked || done) return;
      if (!q.isCorrect && i === q.slotIndex) succeed();
      else wrong(i);
    },
    [q, locked, done, succeed, wrong],
  );

  // "All correct": right only if the sentence really is correct.
  const tapAllCorrect = useCallback(() => {
    if (!q || locked || done) return;
    if (q.isCorrect) succeed();
    else wrong('ok');
  }, [q, locked, done, succeed, wrong]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!q || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speakEnglish(q.gloss);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, done]);

  function restart() {
    setIndex(0);
    setWrongPick(null);
    setLocked(false);
    setSolved(false);
    setDone(false);
    missed.current = false;
    firstTries.current = 0;
    setRunId((r) => r + 1);
  }

  useSegmentComplete(done, firstTries.current, round.length, restart);

  if (done) return null;
  if (!q) return null;

  return (
    <section className="screen activity">
      <ActivityHeader
        title="Löydä virhe · Find the mistake"
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <p className="prompt">
        Onko lause oikein? <span className="en">Is the sentence right? Tap the wrong word.</span>
      </p>

      <div className="phrase-card">
        <p className="en phrase-hint">{q.gloss}</p>
        <button
          className="speaker speaker--inline"
          onClick={() => speakEnglish(q.gloss)}
          aria-label="Hear the meaning again"
        >
          🔊 <span className="en">Listen</span>
        </button>
      </div>

      <div className="error-sentence" aria-label="The Finnish sentence">
        {q.words.map((w, i) => (
          <button
            key={i}
            className={
              'error-word' +
              (wrongPick === i ? ' error-word--wrong' : '') +
              // On a solved WRONG sentence, glow the fixed slot green.
              (solved && !q.isCorrect && i === q.slotIndex ? ' error-word--fixed' : '')
            }
            onClick={() => tapWord(i)}
            disabled={locked}
          >
            {solved && !q.isCorrect && i === q.slotIndex ? q.correctForm : w.text}
          </button>
        ))}
      </div>

      <button
        className={
          'btn error-ok' +
          (wrongPick === 'ok' ? ' error-ok--wrong' : '') +
          (solved && q.isCorrect ? ' error-ok--right' : '')
        }
        onClick={tapAllCorrect}
        disabled={locked}
      >
        ✓ Kaikki oikein <span className="en">All correct</span>
      </button>
    </section>
  );
}

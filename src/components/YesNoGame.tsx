import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Construction, LexicalItem } from '../content/types';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { familiarityWeigher, grammarSrsId } from '../game/srs';
import { buildYesNoRound } from '../game/round';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';

const QUESTIONS = 6;

interface Props {
  items: LexicalItem[];
  /** The -ko question carrier (is-this): "Onko tämä ___?". */
  construction: Construction;
  onExit: () => void;
}

// Onko tämä…? (yes/no questions): a picture is shown, a -ko question is spoken
// ("Onko tämä kissa?"), and the child answers Kyllä or Ei. The child's first
// interrogative — the skill is parsing the ASKED word against what they see,
// so half the questions genuinely don't match. The confirmation line after an
// answer ("Kyllä, se on kissa." / "Ei, se on kissa.") is authored fixed text +
// the sourced nominative — never generated.
// ⚠️ NEEDS NATIVE FINNISH VETTING (the Kyllä/Ei confirmation lines below).
export default function YesNoGame({ items, construction, onExit }: Props) {
  const { level, addStars, recordAttempt, activeChild } = useProfile();
  const ctx = useActivityContext();
  const { tricky } = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  // Familiarity bias, snapshotted once per mount (see ListenAndTap).
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;

  const missed = useRef(false);
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    // `roundQuestions` (Audit harness) caps the round to stop after each answer.
    () =>
      buildYesNoRound(items, construction, QUESTIONS, tricky, weigh).slice(0, ctx?.roundQuestions),
    [items, construction, tricky, weigh, runId, ctx?.roundQuestions],
  );

  const [index, setIndex] = useState(0);
  const [wrongPick, setWrongPick] = useState<boolean | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const q = round[index];
  // What the answer sounds like: confirm what the picture really is, in the
  // matching register — "Kyllä, se on kissa." or "Ei, se on kissa.".
  const confirmation = q ? `${q.isMatch ? 'Kyllä' : 'Ei'}, se on ${q.shown.fi}.` : '';

  // Speak the QUESTION (Finnish) when a new one appears — comprehension is the
  // point, so unlike the production games the Finnish is the cue here.
  useEffect(() => {
    if (!q || done) return;
    const t = setTimeout(() => speak(q.question), 350);
    return () => clearTimeout(t);
  }, [q, done]);

  const answer = useCallback(
    (saidYes: boolean) => {
      if (!q || locked || done) return;
      if (saidYes === q.isMatch) {
        setLocked(true);
        playDing(true);
        speak(confirmation);
        addStars(1);
        // Credit the ASKED word (the one that had to be understood) and the
        // question grammar itself (the -ko carrier's own spaced schedule).
        recordAttempt(q.asked.id, !missed.current);
        recordAttempt(grammarSrsId(construction.id), !missed.current);
        if (!missed.current) firstTries.current += 1;
        setWrongPick(null);
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else setIndex(next);
          missed.current = false;
          setLocked(false);
        }, 1100);
      } else {
        missed.current = true;
        playDing(false);
        setWrongPick(saidYes);
        setTimeout(() => setWrongPick((cur) => (cur === saidYes ? null : cur)), 600);
      }
    },
    [q, locked, done, index, round.length, addStars, recordAttempt, construction.id, confirmation],
  );

  // Keyboard: 1 = Kyllä, 2 = Ei; Space/Enter replays the question.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!q || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speak(q.question);
        return;
      }
      if (e.key === '1') answer(true);
      if (e.key === '2') answer(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, done, answer]);

  function restart() {
    setIndex(0);
    setWrongPick(null);
    setLocked(false);
    setDone(false);
    missed.current = false;
    firstTries.current = 0;
    setRunId((r) => r + 1);
  }

  useSegmentComplete(done, firstTries.current, round.length, restart);

  if (done) return null;
  if (!q) return null;

  const tileClass = (isYes: boolean) =>
    'word-tile yesno-tile' +
    (wrongPick === isYes ? ' word-tile--wrong' : '') +
    (locked && isYes === q.isMatch ? ' word-tile--correct' : '');

  return (
    <section className="screen activity">
      <ActivityHeader
        title="Onko tämä…? · Is this…?"
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <p className="prompt">
        Vastaa kysymykseen <span className="en">Answer the question</span>
      </p>

      <div className="phrase-card">
        <span className="phrase-emoji" aria-hidden="true">
          {q.shown.emoji}
        </span>
        <p className="yesno-question">{q.question}</p>
        <button
          className="speaker speaker--inline"
          onClick={() => speak(q.question)}
          aria-label="Hear the question again"
        >
          🔊 <span className="en">Listen</span>
        </button>
      </div>

      <div className="word-tiles yesno-tiles">
        <button className={tileClass(true)} onClick={() => answer(true)} disabled={locked}>
          <span className="word-tile__num">1</span>
          Kyllä! <span className="en yesno-en">Yes</span>
        </button>
        <button className={tileClass(false)} onClick={() => answer(false)} disabled={locked}>
          <span className="word-tile__num">2</span>
          Ei! <span className="en yesno-en">No</span>
        </button>
      </div>
    </section>
  );
}

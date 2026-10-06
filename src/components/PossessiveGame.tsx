import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LexicalItem } from '../content/types';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { familiarityWeigher, grammarSrsId } from '../game/srs';
import { buildPossessiveRound } from '../game/round';
import { speak, speakEnglish } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';

const QUESTIONS = 6;

interface Props {
  items: LexicalItem[];
  onExit: () => void;
}

// Kenen? (Whose?) — Finnish marks the possessor with a SUFFIX, not a separate
// word: "kissani" (my cat), "kissasi" (your cat), "kissansa" (their cat). A
// picture + English gloss ("my cat" / "in your house") is shown; the child
// picks the form carrying the right possessive suffix from tiles that are the
// SAME noun with the OTHER possessors' suffixes — so the ending is the whole
// question. Every form is sourced (possessiveForm); nothing is assembled.
export default function PossessiveGame({ items, onExit }: Props) {
  const { level, addStars, recordAttempt, activeChild } = useProfile();
  const ctx = useActivityContext();
  const difficulty = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  const { optionCount } = difficulty;
  // From L4 up, bring in the place-locative forms ("in my house") on top of the
  // bare "my cat" nominative — the node's own reach.
  const withCases = difficulty.level >= 4;
  // Familiarity bias, snapshotted once per mount (see ListenAndTap).
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;

  const missed = useRef(false);
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    // `roundQuestions` (Audit harness) caps the round to stop after each answer.
    () =>
      buildPossessiveRound(items, QUESTIONS, optionCount, withCases, weigh).slice(
        0,
        ctx?.roundQuestions,
      ),
    [items, optionCount, withCases, weigh, runId, ctx?.roundQuestions],
  );

  const [index, setIndex] = useState(0);
  const [wrongForm, setWrongForm] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  // A pool too small for even one question completes the (empty) segment so the
  // rotation moves on — never render nothing and stall (same guard as SayIt).
  useEffect(() => {
    if (round.length === 0) setDone(true);
  }, [round.length]);

  const q = round[index];

  // Narrate the English cue when a new question appears — the Finnish is what
  // the child must recognize, never previewed. (The gloss is the on-screen text
  // read aloud for a pre-reader.)
  useEffect(() => {
    if (!q || done) return;
    const t = setTimeout(() => speakEnglish(q.gloss), 350);
    return () => clearTimeout(t);
  }, [q, done]);

  const choose = useCallback(
    (form: string) => {
      if (!q || locked || done) return;
      if (form === q.answer) {
        setLocked(true);
        playDing(true);
        // Say the possessive form they produced — reinforces the suffix.
        speak(q.answer);
        addStars(1);
        recordAttempt(q.item.id, !missed.current);
        // The possessive grammar earns its own spaced schedule too.
        recordAttempt(grammarSrsId('possessive'), !missed.current);
        if (!missed.current) firstTries.current += 1;
        setWrongForm(null);
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else setIndex(next);
          missed.current = false;
          setLocked(false);
        }, 900);
      } else {
        missed.current = true;
        playDing(false);
        setWrongForm(form);
        setTimeout(() => setWrongForm((cur) => (cur === form ? null : cur)), 600);
      }
    },
    [q, locked, done, index, round.length, addStars, recordAttempt],
  );

  // Keyboard: number keys pick a tile; Space/Enter replays the English cue.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!q || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speakEnglish(q.gloss);
        return;
      }
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= q.options.length) choose(q.options[n - 1]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, done, choose]);

  function restart() {
    setIndex(0);
    setWrongForm(null);
    setLocked(false);
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
        title="Kenen? · Whose?"
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <p className="prompt">
        Kenen se on? <span className="en">Which one is it?</span>
      </p>

      <div className="phrase-card">
        {q.item.emoji && (
          <span className="phrase-emoji" aria-hidden="true">
            {q.item.emoji}
          </span>
        )}
        <p className="en phrase-hint">{q.gloss}</p>
        <button
          className="speaker speaker--inline"
          onClick={() => speakEnglish(q.gloss)}
          aria-label="Hear the prompt again"
        >
          🔊 <span className="en">Listen</span>
        </button>
      </div>

      <div className="word-tiles">
        {q.options.map((form, i) => (
          <button
            key={form}
            className={
              'word-tile' +
              (wrongForm === form ? ' word-tile--wrong' : '') +
              (locked && form === q.answer ? ' word-tile--correct' : '')
            }
            onClick={() => choose(form)}
            disabled={locked}
          >
            <span className="word-tile__num">{i + 1}</span>
            {form}
          </button>
        ))}
      </div>
    </section>
  );
}

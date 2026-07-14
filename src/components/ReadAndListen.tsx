import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LexicalItem } from '../content/types';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { familiarityWeigher } from '../game/srs';
import { buildReadingRound } from '../game/round';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';

const QUESTIONS = 6;

interface Props {
  items: LexicalItem[];
  onExit: () => void;
}

// Lue lause (authentic reading): read + hear a REAL Finnish example sentence,
// tap the picture it's about. The English is hidden until answered, so the
// child parses the Finnish first (comprehensible input). Only kid-safe sourced
// examples appear (see content/examples.ts).
export default function ReadAndListen({ items, onExit }: Props) {
  const { level, addStars, recordAttempt, activeChild } = useProfile();
  const ctx = useActivityContext();
  const { optionCount, tricky } = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;

  const missed = useRef(false);
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    // `roundQuestions` (Audit harness) caps the round to stop after each answer.
    () => buildReadingRound(items, QUESTIONS, optionCount, tricky, weigh).slice(0, ctx?.roundQuestions),
    [items, optionCount, tricky, weigh, runId, ctx?.roundQuestions],
  );

  const [index, setIndex] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  const q = round[index];

  // Read the sentence aloud when a new one appears.
  useEffect(() => {
    if (!q || done) return;
    const t = setTimeout(() => speak(q.sentence.fi), 400);
    return () => clearTimeout(t);
  }, [q, done]);

  const choose = useCallback(
    (item: LexicalItem) => {
      if (!q || locked || done) return;
      if (item.id === q.item.id) {
        setLocked(true);
        setRevealed(true); // show what it means, as the payoff
        playDing(true);
        speak(q.sentence.fi);
        addStars(1);
        recordAttempt(q.item.id, !missed.current);
        if (!missed.current) firstTries.current += 1;
        setWrongId(null);
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else {
            setIndex(next);
            setRevealed(false);
          }
          missed.current = false;
          setLocked(false);
        }, 1600);
      } else {
        missed.current = true;
        playDing(false);
        speak(item.fi); // name the tapped picture — a wrong guess still teaches
        setWrongId(item.id);
        setTimeout(() => setWrongId((cur) => (cur === item.id ? null : cur)), 600);
      }
    },
    [q, locked, done, index, round.length, addStars, recordAttempt],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!q || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speak(q.sentence.fi);
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
    setWrongId(null);
    setLocked(false);
    setRevealed(false);
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
        title="Lue lause · Read"
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <p className="prompt">
        Mistä lause kertoo? <span className="en">What is the sentence about?</span>
      </p>

      <div className="phrase-card">
        <p className="reading-sentence">{q.sentence.fi}</p>
        <button
          className="speaker speaker--inline"
          onClick={() => speak(q.sentence.fi)}
          aria-label="Hear it again"
        >
          🔊 <span className="en">Listen</span>
        </button>
        {/* The meaning is the payoff — shown only once answered. */}
        <p className={'en reading-gloss' + (revealed ? ' reading-gloss--shown' : '')}>
          {revealed ? q.sentence.en : '​'}
        </p>
      </div>

      <div className={`card-grid card-grid--${q.options.length}`}>
        {q.options.map((opt, i) => (
          <button
            key={opt.id}
            className={
              'pic-card' +
              (wrongId === opt.id ? ' pic-card--wrong' : '') +
              (locked && opt.id === q.item.id ? ' pic-card--correct' : '')
            }
            onClick={() => choose(opt)}
            disabled={locked}
          >
            <span className="pic-card__num">{i + 1}</span>
            <span className="pic-card__emoji" aria-hidden="true">
              {opt.emoji}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

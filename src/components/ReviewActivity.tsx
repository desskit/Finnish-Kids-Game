import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LexicalItem } from '../content/types';
import { reviewItems, reviewItemById } from '../content';
import { useProfile } from '../state/profile';
import { buildReviewRound } from '../game/round';
import { selectReviewItems } from '../game/srs';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';
import RoundComplete from './RoundComplete';

const QUESTIONS = 8;

// Review (spaced repetition): a cross-topic listen-and-tap drill over the items
// the scheduler says are due, backfilled with new words. Reuses the picture-tap
// format so any vocabulary item works. Records each answer back into SRS, which
// is what schedules the next review. Reachable from the map at /review.
export default function ReviewActivity() {
  const { level, addStars, recordAttempt, activeChild } = useProfile();
  const navigate = useNavigate();
  const optionCount = level >= 2 ? 4 : 3;

  const missed = useRef(false);
  const [runId, setRunId] = useState(0);

  // Select due/new items once per run (snapshot at start, so answering during
  // the round doesn't reshuffle the questions underneath the child).
  const round = useMemo(() => {
    const ids = selectReviewItems({
      schedules: activeChild?.srs ?? {},
      allIds: reviewItems.map((i) => i.id),
      now: Date.now(),
      count: QUESTIONS,
    });
    const targets = ids
      .map((id) => reviewItemById[id])
      .filter((i): i is LexicalItem => Boolean(i));
    return buildReviewRound(targets, reviewItems, optionCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionCount, runId]);

  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const question = round[index];

  useEffect(() => {
    if (!question || done) return;
    const t = setTimeout(() => speak(question.target.fi), 350);
    return () => clearTimeout(t);
  }, [question, done]);

  const choose = useCallback(
    (item: LexicalItem) => {
      if (!question || locked || done) return;
      if (item.id === question.target.id) {
        setLocked(true);
        playDing(true);
        speak(item.fi);
        setStars((s) => s + 1);
        addStars(1);
        recordAttempt(question.target.id, !missed.current);
        setWrongId(null);
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else setIndex(next);
          missed.current = false;
          setLocked(false);
        }, 750);
      } else {
        missed.current = true;
        playDing(false);
        setWrongId(item.id);
        setTimeout(() => setWrongId((cur) => (cur === item.id ? null : cur)), 600);
      }
    },
    [question, locked, done, index, round.length, addStars, recordAttempt],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!question || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speak(question.target.fi);
        return;
      }
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= question.options.length) choose(question.options[n - 1]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, done, choose]);

  function restart() {
    setIndex(0);
    setStars(0);
    setWrongId(null);
    setLocked(false);
    setDone(false);
    missed.current = false;
    setRunId((r) => r + 1);
  }

  const goHome = () => navigate('/');

  if (!activeChild) return null;

  if (done) {
    return (
      <main className="app">
        <RoundComplete stars={stars} total={round.length} onAgain={restart} onHome={goHome} />
      </main>
    );
  }
  if (!question) return null;

  return (
    <main className="app">
      <section className="screen activity">
        <ActivityHeader
          title="Kertaus · Review"
          index={index}
          total={round.length}
          onExit={goHome}
        />

        <p className="prompt">
          Mikä tämä on? <span className="en">Which one did you hear?</span>
        </p>

        <button
          className="speaker speaker--hero"
          onClick={() => speak(question.target.fi)}
          aria-label="Hear the word again"
        >
          🔊
          <span className="speaker__hint">Kuuntele · Listen</span>
        </button>

        <div className={`card-grid card-grid--${question.options.length}`}>
          {question.options.map((opt, i) => (
            <button
              key={opt.id}
              className={'pic-card' + (wrongId === opt.id ? ' pic-card--wrong' : '')}
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
    </main>
  );
}

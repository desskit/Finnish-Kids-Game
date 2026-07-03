import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LexicalItem } from '../content/types';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { familiarityWeigher } from '../game/srs';
import { buildListenRound } from '../game/round';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';

const QUESTIONS = 6;

interface Props {
  items: LexicalItem[];
  onExit: () => void;
}

// Listen & Tap (Tier 1): hear a Finnish word, tap the matching picture.
export default function ListenAndTap({ items, onExit }: Props) {
  const { level, addStars, recordAttempt, activeChild } = useProfile();
  // Adaptive difficulty from the router when in a topic; manual level otherwise.
  const ctx = useActivityContext();
  const { optionCount, tricky } = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  // Familiarity bias, snapshotted once per mount: the SRS map updates after
  // every answer, and re-deriving it mid-round would rebuild the live round.
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;

  // Whether the current question has had a wrong tap yet — so SRS only credits
  // a "correct" review when the child gets it right on the first try.
  const missed = useRef(false);
  // First-try successes this segment — the real accuracy the adaptive engine
  // sees (a star for the eventual right answer would always read 100%).
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    () => buildListenRound(items, QUESTIONS, optionCount, tricky, weigh),
    [items, optionCount, tricky, weigh, runId],
  );

  const [index, setIndex] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const question = round[index];

  // Say the target word when a new question appears.
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
        addStars(1);
        recordAttempt(question.target.id, !missed.current);
        if (!missed.current) firstTries.current += 1;
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
        // Name the picture the child actually tapped — a wrong guess still
        // teaches a word, instead of just being a dead end.
        speak(item.fi);
        setWrongId(item.id);
        setTimeout(() => setWrongId((cur) => (cur === item.id ? null : cur)), 600);
      }
    },
    [question, locked, done, index, round.length, addStars, recordAttempt],
  );

  // Keyboard: number keys pick a card; Space/Enter replays the word.
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
    setWrongId(null);
    setLocked(false);
    setDone(false);
    missed.current = false;
    firstTries.current = 0;
    setRunId((r) => r + 1);
  }

  // Endless stream: a finished segment is recorded silently and the next one
  // (maybe a different game) mounts immediately — no interstitial.
  useSegmentComplete(done, firstTries.current, round.length, restart);

  if (done) return null;
  if (!question) return null;

  return (
    <section className="screen activity">
      <ActivityHeader
        title="Kuuntele ja osoita"
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
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
            className={
              'pic-card' +
              (wrongId === opt.id ? ' pic-card--wrong' : '') +
              (locked && opt.id === question.target.id ? ' pic-card--correct' : '')
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

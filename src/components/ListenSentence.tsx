import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Construction, LexicalItem } from '../content/types';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { familiarityWeigher } from '../game/srs';
import { buildComprehensionRound } from '../game/round';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';

const QUESTIONS = 6;

interface Props {
  items: LexicalItem[];
  constructions: Construction[];
  onExit: () => void;
}

// Kuuntele lause (sentence-level listening comprehension): hear a full Finnish
// carrier sentence, tap the picture it's about. Pure Finnish→meaning — NO
// English, on purpose: an English gloss would turn "understand the Finnish"
// into "match English to picture". Trains parsing a whole utterance for its key
// noun, a step past the single-word Listen & Tap.
export default function ListenSentence({ items, constructions, onExit }: Props) {
  const { level, addStars, recordAttempt, activeChild } = useProfile();
  const ctx = useActivityContext();
  const { optionCount, maxTier, tricky } = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  // Familiarity bias, snapshotted once per mount (see ListenAndTap).
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;

  const missed = useRef(false);
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    // `roundQuestions` (Audit harness) caps the round to stop after each answer.
    () =>
      buildComprehensionRound(items, constructions, QUESTIONS, optionCount, maxTier, tricky, weigh).slice(
        0,
        ctx?.roundQuestions,
      ),
    [items, constructions, optionCount, maxTier, tricky, weigh, runId, ctx?.roundQuestions],
  );

  const [index, setIndex] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const question = round[index];

  // Play the full sentence when a new question appears.
  useEffect(() => {
    if (!question || done) return;
    const t = setTimeout(() => speak(question.sentence), 350);
    return () => clearTimeout(t);
  }, [question, done]);

  const choose = useCallback(
    (item: LexicalItem) => {
      if (!question || locked || done) return;
      if (item.id === question.item.id) {
        setLocked(true);
        playDing(true);
        // Replay the whole sentence — reinforces the utterance, not just the word.
        speak(question.sentence);
        addStars(1);
        recordAttempt(question.item.id, !missed.current);
        if (!missed.current) firstTries.current += 1;
        setWrongId(null);
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
        // Name the picture the child actually tapped — a wrong guess still teaches.
        speak(item.fi);
        setWrongId(item.id);
        setTimeout(() => setWrongId((cur) => (cur === item.id ? null : cur)), 600);
      }
    },
    [question, locked, done, index, round.length, addStars, recordAttempt],
  );

  // Keyboard: number keys pick a card; Space/Enter replays the sentence.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!question || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speak(question.sentence);
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

  useSegmentComplete(done, firstTries.current, round.length, restart);

  if (done) return null;
  if (!question) return null;

  return (
    <section className="screen activity">
      <ActivityHeader
        title="Kuuntele lause · Listen"
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <p className="prompt">
        Mistä puhutaan? <span className="en">Which picture is it about?</span>
      </p>

      <button
        className="speaker speaker--hero"
        onClick={() => speak(question.sentence)}
        aria-label="Hear the sentence again"
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
              (locked && opt.id === question.item.id ? ' pic-card--correct' : '')
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

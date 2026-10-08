import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Construction, LexicalItem } from '../content/types';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { familiarityWeigher } from '../game/srs';
import { buildCarrierHearRound, buildCountHearRound, buildVerbHearRound, type HearQuestion } from '../game/hear';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';
import WhyTip from './WhyTip';
import { Segments } from './LessonView';

const QUESTIONS = 6;

export type HearSource = 'carriers' | 'verbs' | 'count';

interface Props {
  source: HearSource;
  /** Words met (carriers: the slot words; count: the things counted). */
  items: LexicalItem[];
  /** Carriers: the step's sentence patterns (at least two, to contrast). */
  constructions?: Construction[];
  /** Verbs: the step's verbs (tenses / yes-no come from the difficulty pin). */
  verbs?: LexicalItem[];
  /** Count: the number words met. */
  numbers?: LexicalItem[];
  onExit: () => void;
}

// Kuuntele ja valitse — hear a sentence, pick what it MEANT. The meanings
// differ only by the grammar being learned (the ending, the person, yes / no,
// now / yesterday, how many), so the child has to catch the ending by ear.
// The Finnish text stays hidden until they've chosen — after a wrong pick it
// appears with the deciding part marked (and the Why), linking sound to
// spelling; after the right one it shows as confirmation. 🐢 replays slowly.
export default function HearIt({ source, items, constructions, verbs, numbers, onExit }: Props) {
  const { level, addStars, recordAttempt, activeChild } = useProfile();
  const ctx = useActivityContext();
  const difficulty = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  const optionCount = Math.min(4, Math.max(3, difficulty.optionCount));
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;

  const missed = useRef(false);
  const firstTries = useRef(0);
  const [runId, setRunId] = useState(0);
  const round = useMemo<HearQuestion[]>(() => {
    const built =
      source === 'verbs'
        ? buildVerbHearRound(verbs ?? [], difficulty.verbCombos, QUESTIONS, optionCount, weigh)
        : source === 'count'
          ? buildCountHearRound(numbers ?? [], items, QUESTIONS, optionCount, difficulty.maxCount, weigh)
          : buildCarrierHearRound(items, constructions ?? [], QUESTIONS, optionCount, weigh);
    return built.slice(0, ctx?.roundQuestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, items, constructions, verbs, numbers, optionCount, difficulty.verbCombos, difficulty.maxCount, weigh, runId, ctx?.roundQuestions]);

  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const [whyAt, setWhyAt] = useState(-1);

  // Never stall on an empty round.
  useEffect(() => {
    if (round.length === 0) setDone(true);
  }, [round.length]);

  const q = round[index];

  useEffect(() => {
    if (!q || done) return;
    const t = setTimeout(() => speak(q.fi), 350);
    return () => clearTimeout(t);
  }, [q, done]);

  const choose = useCallback(
    (id: string) => {
      if (!q || locked || done) return;
      if (id === q.answerId) {
        setLocked(true);
        setWrong(null);
        playDing(true);
        speak(q.fi);
        addStars(1);
        if (q.attemptId) recordAttempt(q.attemptId, !missed.current);
        if (q.grammarId) recordAttempt(q.grammarId, !missed.current);
        if (!missed.current) firstTries.current += 1;
        const next = index + 1;
        setTimeout(() => {
          if (next >= round.length) setDone(true);
          else setIndex(next);
          missed.current = false;
          setPicked(null);
          setLocked(false);
        }, 1500);
      } else {
        missed.current = true;
        setWhyAt(index);
        setPicked(id);
        playDing(false);
        setWrong(id);
        setTimeout(() => setWrong((cur) => (cur === id ? null : cur)), 600);
        // Hear it again, slowly: the ending is the part to catch.
        setTimeout(() => speak(q.fi, { slow: true }), 650);
      }
    },
    [q, locked, done, index, round.length, addStars, recordAttempt],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!q || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speak(q.fi);
        return;
      }
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= q.options.length) choose(q.options[n - 1].id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, done, choose]);

  function restart() {
    setIndex(0);
    setWrong(null);
    setPicked(null);
    setLocked(false);
    setDone(false);
    setWhyAt(-1);
    missed.current = false;
    firstTries.current = 0;
    setRunId((r) => r + 1);
  }

  useSegmentComplete(done, firstTries.current, round.length, restart);

  if (done || !q) return null;
  const showText = locked || whyAt === index;

  return (
    <section className="screen activity">
      <ActivityHeader
        title="Kuuntele · Listen"
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <p className="prompt">
        Mitä kuulit? <span className="en">What did you hear?</span>
      </p>

      <div className="hear-speakers">
        <button className="speaker speaker--hero" onClick={() => speak(q.fi)} aria-label="Hear it again">
          🔊
          <span className="speaker__hint">Kuuntele · Listen</span>
        </button>
        <button className="speaker speaker--slow" onClick={() => speak(q.fi, { slow: true })} aria-label="Hear it slowly">
          🐢
          <span className="speaker__hint">Hitaasti · Slowly</span>
        </button>
      </div>

      <p className={'hear-text' + (showText ? ' hear-text--shown' : '')} lang="fi" aria-live="polite">
        {showText ? <Segments segments={q.segments} /> : '· · ·'}
      </p>

      <div className="word-tiles hear-options">
        {q.options.map((o, i) => (
          <button
            key={o.id}
            className={
              'word-tile hear-option' +
              (wrong === o.id ? ' word-tile--wrong' : '') +
              (locked && o.id === q.answerId ? ' word-tile--correct' : '')
            }
            onClick={() => choose(o.id)}
            disabled={locked}
          >
            <span className="word-tile__num">{i + 1}</span>
            {o.emoji && (
              <span className="hear-option__emoji" aria-hidden="true">
                {o.emoji}
              </span>
            )}
            <span className="en">{o.en}</span>
          </button>
        ))}
      </div>
      {whyAt === index && <WhyTip why={(picked && q.whyFor[picked]) || q.why} />}
    </section>
  );
}

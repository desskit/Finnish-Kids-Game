import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LexicalItem } from '../content/types';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor, questionTimerMs } from '../game/adapt';
import { familiarityWeigher, introIndices } from '../game/srs';
import { buildListenRound } from '../game/round';
import { speak, speakEnglish } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';
import WordIntro from './WordIntro';

const QUESTIONS = 6;

interface Props {
  items: LexicalItem[];
  /**
   * From this measured level up, run a gentle per-question countdown (set per
   * node — see `SkillNode.timerFromLevel`). Unset = no timer.
   */
  timerFromLevel?: number;
  onExit: () => void;
}

// Name it (production recall): the INVERSE of Listen & Tap — see a picture,
// produce the Finnish. The English word is narrated as a cue (harmless: recall
// in the L1→English → L2→Finnish direction is exactly the point), and the child
// picks the Finnish word from tiles. Reuses buildListenRound (same question
// shape) since only the render inverts. Only picturable items can be prompts.
export default function NameIt({ items, timerFromLevel, onExit }: Props) {
  const { level, addStars, recordAttempt, activeChild } = useProfile();
  const ctx = useActivityContext();
  const difficulty = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  const { optionCount, tricky } = difficulty;
  // Per-node gentle timer: only when this node opts in AND the measured level
  // has reached its threshold.
  const timerMs =
    timerFromLevel != null && difficulty.level >= timerFromLevel
      ? questionTimerMs(difficulty.level)
      : undefined;
  // Familiarity bias, snapshotted once per mount (see ListenAndTap).
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;
  // Same snapshot discipline for "meet the word" (see ListenAndTap).
  const srsSnapshot = useRef(activeChild?.srs).current;

  // A wrong tap means it wasn't a first-try success (for SRS + the adaptive engine).
  const missed = useRef(false);
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    // `roundQuestions` (Audit harness) caps the round to stop after each answer.
    () =>
      buildListenRound(items.filter((i) => i.emoji), QUESTIONS, optionCount, tricky, weigh).slice(
        0,
        ctx?.roundQuestions,
      ),
    [items, optionCount, tricky, weigh, runId, ctx?.roundQuestions],
  );
  // Which question indices meet a brand-new word first (see ListenAndTap).
  const introSet = useMemo(
    () => introIndices(round.map((q) => q.target.id), srsSnapshot),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round],
  );

  const [index, setIndex] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  // When the L5+ countdown lapses, nudge the correct tile (never a penalty).
  const [hint, setHint] = useState(false);
  const [introduced, setIntroduced] = useState<Set<number>>(() => new Set());
  const showIntro = introSet.has(index) && !introduced.has(index);

  const question = round[index];

  // Narrate the English cue when a new picture appears — a pre-reader can't
  // read the gloss, and the Finnish is what they must PRODUCE, never a preview.
  // Skipped during the intro card, which already speaks the Finnish itself.
  useEffect(() => {
    if (!question || done || showIntro) return;
    const t = setTimeout(() => speakEnglish(question.target.en), 350);
    return () => clearTimeout(t);
  }, [question, done, showIntro]);

  // Gentle countdown (L5+ only): the isolated production game's other levers
  // (tile count, tricky distractors) both max out by L4, so a timed pace keeps
  // it climbing. Never punishing — on lapse the correct tile pulses and the cue
  // is re-said; no star lost, no auto-advance. Reset per question.
  useEffect(() => {
    setHint(false);
    if (!timerMs || !question || done || locked || showIntro) return;
    const t = setTimeout(() => {
      missed.current = true; // forfeits the first-try bonus (not "free" mastery)
      setHint(true);
      speakEnglish(question.target.en);
    }, timerMs);
    return () => clearTimeout(t);
  }, [timerMs, question, done, locked, showIntro]);

  const choose = useCallback(
    (item: LexicalItem) => {
      if (!question || locked || done) return;
      if (item.id === question.target.id) {
        setLocked(true);
        playDing(true);
        // Say the Finnish they just produced — reinforces the target form.
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
        setWrongId(item.id);
        setTimeout(() => setWrongId((cur) => (cur === item.id ? null : cur)), 600);
      }
    },
    [question, locked, done, index, round.length, addStars, recordAttempt],
  );

  // Keyboard: number keys pick a word tile; Space/Enter replays the English cue.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!question || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speakEnglish(question.target.en);
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
    setIntroduced(new Set());
    missed.current = false;
    firstTries.current = 0;
    setRunId((r) => r + 1);
  }

  useSegmentComplete(done, firstTries.current, round.length, restart);

  if (done) return null;
  if (!question) return null;
  if (showIntro) {
    return (
      <WordIntro
        item={question.target}
        onContinue={() => setIntroduced((prev) => new Set(prev).add(index))}
      />
    );
  }

  return (
    <section className="screen activity">
      <ActivityHeader
        title="Nimeä · Name it"
        index={index}
        total={round.length}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      <p className="prompt">
        Mikä tämä on suomeksi? <span className="en">What is this in Finnish?</span>
      </p>

      <div className="phrase-card">
        <span className="phrase-emoji" aria-hidden="true">
          {question.target.emoji}
        </span>
        <p className="en phrase-hint">{question.target.en}</p>
        <button
          className="speaker speaker--inline"
          onClick={() => speakEnglish(question.target.en)}
          aria-label="Hear the prompt again"
        >
          🔊 <span className="en">Listen</span>
        </button>
      </div>

      {timerMs && (
        <div className="q-timer" aria-hidden="true">
          <div
            key={index}
            className={'q-timer__bar' + (locked ? ' q-timer__bar--paused' : '')}
            style={{ animationDuration: `${timerMs}ms` }}
          />
        </div>
      )}

      <div className="word-tiles">
        {question.options.map((opt, i) => (
          <button
            key={opt.id}
            className={
              'word-tile' +
              (wrongId === opt.id ? ' word-tile--wrong' : '') +
              (hint && !locked && opt.id === question.target.id ? ' word-tile--hint' : '') +
              (locked && opt.id === question.target.id ? ' word-tile--correct' : '')
            }
            onClick={() => choose(opt)}
            disabled={locked}
          >
            <span className="word-tile__num">{i + 1}</span>
            {opt.fi}
          </button>
        ))}
      </div>
    </section>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../../state/profile';
import { useActivityContext, useSegmentComplete } from '../../game/activityContext';
import { buildMathRound, choiceWord, spokenProblem, type MathProblem, type MathSet } from '../../game/math';
import { taughtWords } from '../../game/mathCourse';
import { isSpeechAvailable, speak } from '../../audio/speak';
import { isMuted } from '../../audio/mute';
import { playDing } from '../../audio/sfx';
import ActivityHeader from '../ActivityHeader';
import { SPEAK_INTRO_KEY, SpeakIntro } from '../SayIt';
import SpeakerIcon from '../../art/SpeakerIcon';
import Art from '../../art/Art';
import MathText from './MathText';
import { MathChoices, MathMic, MathTyping } from './MathAnswer';
import { MathScene, ownsChoices, type MathGame } from './MathScenes';

// One math game — the apple tree, listen and count, the scale, the train,
// word problems, building the teens, quick sums: a round of problems from its
// set (game/math.ts), each said in Finnish and answered in Finnish, by tapping
// a number word, saying it, or typing it (`answer`). No digit anywhere: the
// choices are words (at the top, only sounds), and only once a problem is
// answered does its picture show how many.
//
// The level shapes it (see `mathLevel`): three choices first, then four; from
// level 3 a problem is only heard (its words come on "Lue", or once it's
// answered); at the top the choices are only heard too. The apple tree's
// apples drop as the problem is said at levels 1–2 — the one countable help.

const QUESTIONS = 6;
/** How long an answer stays at least, its picture showing why. */
const SHOW_MS = 1800;
const QUICK_SHOW_MS = 900;

export type MathAnswerMode = 'tap' | 'say' | 'type';

/**
 * Quick sums' run of right first answers, per set: it carries on from round to
 * round while the app is open (a round is only a few problems), and a miss or
 * a late answer starts it again.
 */
const quickRuns = new Map<MathSet, number>();

export interface MathKnobs {
  optionCount: number;
  /** The problem is only heard (its words on "Lue", or once answered). */
  spokenOnly: boolean;
  /** The choices are only heard too. */
  heardChoices: boolean;
  /** Things to count while it's asked: the apple tree at levels 1–2. */
  countable: boolean;
  /** Quick sums: seconds per problem (unset: no clock). */
  seconds?: number;
}

/** What a level means for a game. */
export function mathLevel(level: number, game: MathGame, answer: MathAnswerMode = 'tap', untimed = false): MathKnobs {
  const quick = game === 'quick';
  return {
    optionCount: level >= 2 ? 4 : 3,
    spokenOnly: !quick && level >= 3,
    heardChoices: !quick && answer === 'tap' && level >= 4,
    countable: game === 'tree' && level <= 2,
    seconds: quick && answer === 'tap' && !untimed ? (level >= 2 ? 7 : 10) : undefined,
  };
}

interface Props {
  set: MathSet;
  game: MathGame;
  title: string;
  answer?: MathAnswerMode;
  onExit: () => void;
}

/** Where a problem is: being asked, answered right, or shown after a give-up. */
type Phase = 'ask' | 'right' | 'shown';

export default function MathQuiz({ set, game, title, answer = 'tap', onExit }: Props) {
  const { activeChild, addStars, settings, recordQuickStreak, recordMathSpoken } = useProfile();
  const ctx = useActivityContext();
  const level = ctx?.difficulty.level ?? 1;
  const knobs = mathLevel(level, game, answer, !!settings.mathUntimed);
  const known = useMemo(() => taughtWords(activeChild, !!settings.unlockAll), [activeChild, settings.unlockAll]);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    () => buildMathRound(set, QUESTIONS, { optionCount: knobs.optionCount, knownVerbs: known }).slice(0, ctx?.roundQuestions),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a new round per run, not per re-render
    [set, knobs.optionCount, runId, ctx?.roundQuestions],
  );
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ask');
  const [wrong, setWrong] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [read, setRead] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [late, setLate] = useState(false);
  const [done, setDone] = useState(false);
  const [streak, setStreakState] = useState(() => (game === 'quick' ? (quickRuns.get(set) ?? 0) : 0));
  const setStreak = useCallback(
    (run: number) => {
      if (game === 'quick') quickRuns.set(set, run);
      setStreakState(run);
    },
    [game, set],
  );
  const firstTries = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [micReady, setMicReady] = useState(
    () => answer !== 'say' || (typeof localStorage !== 'undefined' && localStorage.getItem(SPEAK_INTRO_KEY) === '1'),
  );
  const q: MathProblem | undefined = round[index];
  const answered = phase !== 'ask';

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  // Say each problem as it comes.
  useEffect(() => {
    if (q && micReady) speak(spokenProblem(q));
  }, [q, micReady]);

  const next = useCallback(() => {
    clearTimers();
    if (index + 1 >= round.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setPhase('ask');
    setWrong([]);
    setMisses(0);
    setRead(false);
    setPicked(null);
    setLate(false);
  }, [clearTimers, index, round.length]);

  /**
   * The answer said in full, then on to the next problem once it's been said
   * (and been up a moment) — or, after a give-up, when "Jatka" is tapped.
   */
  const tellThen = useCallback(
    (moveOn: boolean, minMs: number) => {
      if (!q) return;
      const started = Date.now();
      let gone = false;
      const go = () => {
        if (gone) return;
        gone = true;
        next();
      };
      const silent = isMuted() || !isSpeechAvailable();
      speak(q.tell.fi, {
        onEnd: moveOn ? () => later(go, Math.max(700, minMs - (Date.now() - started))) : undefined,
      });
      // no voice (or it never says it ended): move on anyway
      if (moveOn) later(go, silent ? minMs : minMs + 6000);
    },
    [q, later, next],
  );

  const right = useCallback(
    (vouched = false) => {
      if (!q || answered) return;
      playDing(true);
      addStars(1);
      const clean = misses === 0 && !vouched;
      if (clean) firstTries.current += 1;
      if (answer === 'say' && !vouched) recordMathSpoken();
      if (game === 'quick') {
        const run = clean ? streak + 1 : 0;
        setStreak(run);
        if (clean) recordQuickStreak(run);
      }
      setPhase('right');
      // a spoken answer stays up until "Jatka", like the course's speaking game
      tellThen(answer !== 'say', game === 'quick' ? QUICK_SHOW_MS : SHOW_MS);
    },
    [q, answered, addStars, misses, answer, recordMathSpoken, game, streak, recordQuickStreak, tellThen],
  );

  /** Give up kindly: the answer shown and said, then "Jatka" (or, timed, on by itself). */
  const showAnswer = useCallback(
    (moveOn = false, ding = true) => {
      if (!q || answered) return;
      if (ding) playDing(false);
      setStreak(0);
      setPhase('shown');
      tellThen(moveOn, SHOW_MS);
    },
    [q, answered, tellThen],
  );

  const miss = useCallback(() => {
    playDing(false);
    if (game === 'quick') setStreak(0);
    setMisses((m) => m + 1);
  }, [game]);

  const choose = useCallback(
    (v: number) => {
      if (!q || answered) return;
      if (knobs.heardChoices && picked !== v) {
        // only heard: the first tap says it
        setPicked(v);
        speak(choiceWord(q, v));
        return;
      }
      if (v === q.answer) {
        right();
      } else {
        miss();
        setWrong((w) => [...w, v]);
        setPicked(null);
        // a wrong tap still teaches a word: it's said
        speak(choiceWord(q, v));
      }
    },
    [q, answered, knobs.heardChoices, picked, right, miss],
  );

  // Said twice and not heard as the answer: show it.
  useEffect(() => {
    if (answer === 'say' && misses >= 2) showAnswer(false, false);
  }, [answer, misses, showAnswer]);

  // Quick sums: the clock. When it runs out the answer is shown, and play goes on.
  useEffect(() => {
    if (!q || answered || knobs.seconds === undefined) return;
    const t = setTimeout(() => {
      setLate(true);
      showAnswer(true);
    }, knobs.seconds * 1000);
    return () => clearTimeout(t);
  }, [q, answered, knobs.seconds, showAnswer]);

  // Space or Enter says the problem again.
  useEffect(() => {
    if (answer === 'type') return;
    function onKey(e: KeyboardEvent) {
      if (!q || (e.key !== ' ' && e.key !== 'Enter') || e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      speak(spokenProblem(q));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, answer]);

  const restart = useCallback(() => {
    clearTimers();
    setIndex(0);
    setPhase('ask');
    setWrong([]);
    setMisses(0);
    setRead(false);
    setPicked(null);
    setLate(false);
    setDone(false);
    firstTries.current = 0;
    setRunId((r) => r + 1);
  }, [clearTimers]);
  useSegmentComplete(done, firstTries.current, round.length, restart);

  if (done || !q) return null;

  const header = <ActivityHeader title={title} index={index} total={round.length} onExit={onExit} />;
  if (!micReady) {
    return (
      <section className="screen activity math">
        {header}
        <SpeakIntro
          onOk={() => {
            try {
              localStorage.setItem(SPEAK_INTRO_KEY, '1');
            } catch {
              /* ignore */
            }
            setMicReady(true);
          }}
        />
      </section>
    );
  }

  const parts = q.show.kind === 'parts';
  const wordsShown = !knobs.spokenOnly || read || answered;
  const sceneChooses = answer === 'tap' && ownsChoices(game);

  return (
    <section className={`screen activity math math--${game}`}>
      {header}

      {game === 'quick' && (
        <div className="math-quick" aria-hidden="true">
          <span className="math-quick__clock">
            {knobs.seconds !== undefined && !answered && (
              <span className="math-quick__time" key={index} style={{ animationDuration: `${knobs.seconds}s` }} />
            )}
          </span>
          <span className="math-quick__streak">
            {Array.from({ length: Math.min(streak, 10) }, (_, i) => (
              <Art key={i} glyph="🔥" />
            ))}
          </span>
        </div>
      )}

      <MathScene
        game={game}
        q={q}
        answered={answered}
        wordsShown={wordsShown}
        countable={knobs.countable}
        avatar={activeChild?.avatar}
        choose={sceneChooses ? { wrong, picked, heard: knobs.heardChoices, onChoose: choose } : undefined}
      />

      <div className="math-prompt">
        <button type="button" className="speaker math-prompt__hear" onClick={() => speak(spokenProblem(q))} aria-label="Kuuntele uudestaan · Hear it again">
          <SpeakerIcon />
        </button>
        <div className="math-prompt__text">
          {parts && !answered ? (
            // the builder: hear the teen, find its first part
            <p className="prompt">
              Kuuntele! <span className="en">Listen, then fill the gap</span>
            </p>
          ) : wordsShown ? (
            q.ask.map((s, i) => (
              <p key={i} className="prompt math-prompt__line">
                <MathText text={s.fi} />
              </p>
            ))
          ) : (
            <button type="button" className="btn btn--ghost math-prompt__read" onClick={() => setRead(true)}>
              Lue <span className="en">Read</span>
            </button>
          )}
        </div>
      </div>

      {answered ? (
        <div className={'math-tell' + (phase === 'shown' ? ' math-tell--shown' : '')} role="status">
          <p className="math-tell__line">
            <span className="math-tell__mark">
              {phase === 'right' ? (
                <>
                  Oikein! <span className="en">Right!</span>
                </>
              ) : (
                <>
                  Hyvä yritys! <span className="en">{late ? "Time's up — here it is" : 'Good try! Here it is'}</span>
                </>
              )}
            </span>{' '}
            <MathText text={q.tell.fi} />
          </p>
          <button type="button" className="btn btn--primary math-tell__next" onClick={next} autoFocus={phase === 'shown' || answer === 'say'}>
            Jatka <span className="en">Continue</span>
          </button>
        </div>
      ) : answer === 'say' ? (
        <MathMic
          key={index}
          answer={q.answer}
          answerWords={q.words?.[q.answer]}
          locked={answered}
          misses={misses}
          onRight={() => right()}
          onMiss={miss}
          onVouch={() => right(true)}
        />
      ) : answer === 'type' ? (
        <MathTyping key={index} word={choiceWord(q, q.answer)} locked={answered} onRight={() => right()} onMiss={miss} onSkip={() => showAnswer()} />
      ) : sceneChooses ? null : (
        <MathChoices
          options={q.options}
          answer={q.answer}
          answered={answered}
          wrong={wrong}
          heard={knobs.heardChoices}
          picked={picked}
          look={game === 'train' ? 'wagons' : undefined}
          wordOf={(v) => choiceWord(q, v)}
          onChoose={choose}
        />
      )}
    </section>
  );
}

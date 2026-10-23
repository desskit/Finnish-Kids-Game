import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../../state/profile';
import { useActivityContext, useSegmentComplete } from '../../game/activityContext';
import { buildMathRound, numberWord, type MathProblem, type MathSet } from '../../game/math';
import { taughtWords } from '../../game/mathCourse';
import { speak } from '../../audio/speak';
import { playDing } from '../../audio/sfx';
import ActivityHeader from '../ActivityHeader';
import SpeakerIcon from '../../art/SpeakerIcon';
import Art from '../../art/Art';
import MathText from './MathText';
import { MathScene, ownsChoices, type MathGame } from './MathScenes';
import '../../styles/math.css';

// One math game — the apple tree, listen and count, the scale, the train,
// word problems, building the teens, quick sums: a round of problems from
// its set (game/math.ts), each said in Finnish and answered with a Finnish
// word. No digit anywhere: the choices are words (or, at the top, only
// sounds), and only once a problem is answered does a picture show how many.
//
// The level shapes it (see `mathLevel`): fewer choices first; from level 3
// the problem is only heard (its words come on a hint, or once answered); at
// the top the choices are only heard too. The apple tree's apples drop while
// the problem is said at levels 1–2 — the one countable help in the section.

const QUESTIONS = 6;
/** How long the answer stays shown — its picture says why. */
const REVEAL_MS = 2600;
const QUICK_REVEAL_MS = 1100;

export interface MathKnobs {
  optionCount: number;
  spokenOnly: boolean;
  audioChoices: boolean;
  /** Countable things while it's asked: the apple tree at levels 1–2. */
  countable: boolean;
  /** Quick sums: seconds per question (undefined = no clock). */
  seconds?: number;
}

/** What a level means for a game. */
export function mathLevel(level: number, game: MathGame, untimed = false): MathKnobs {
  const quick = game === 'quick';
  return {
    optionCount: level >= 2 ? 4 : 3,
    spokenOnly: !quick && level >= 3,
    audioChoices: !quick && level >= 4,
    countable: game === 'tree' && level <= 2,
    seconds: quick && !untimed ? (level >= 2 ? 7 : 10) : undefined,
  };
}

interface Props {
  set: MathSet;
  game: MathGame;
  title: string;
  onExit: () => void;
}

/** The problem said aloud: its sentences, one after another. */
const said = (q: MathProblem) => q.ask.map((s) => s.fi).join(' ');

export default function MathQuiz({ set, game, title, onExit }: Props) {
  const { activeChild, addStars, settings, recordQuickStreak } = useProfile();
  const ctx = useActivityContext();
  const level = ctx?.difficulty.level ?? 1;
  const knobs = mathLevel(level, game, !!settings.mathUntimed);
  const known = useMemo(() => taughtWords(activeChild, !!settings.unlockAll), [activeChild, settings.unlockAll]);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    () => buildMathRound(set, QUESTIONS, { optionCount: knobs.optionCount, knownVerbs: known }).slice(0, ctx?.roundQuestions),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a new round per run, not per re-render
    [set, knobs.optionCount, runId, ctx?.roundQuestions],
  );
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [shown, setShown] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [done, setDone] = useState(false);
  const firstTries = useRef(0);
  const streak = useRef(0);
  const [streakNow, setStreakNow] = useState(0);
  const q = round[index];

  // Say each problem as it comes (the builder's "parts" problem is the teen itself).
  useEffect(() => {
    if (q) speak(said(q));
  }, [q]);

  const next = useCallback(() => {
    if (index + 1 >= round.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setWrong([]);
    setSolved(false);
    setShown(false);
    setPicked(null);
    setTimedOut(false);
  }, [index, round.length]);

  const finish = useCallback(
    (right: boolean) => {
      if (!q) return;
      setSolved(true);
      setShown(true);
      if (right && wrong.length === 0) firstTries.current += 1;
      if (game === 'quick') {
        streak.current = right && wrong.length === 0 ? streak.current + 1 : 0;
        setStreakNow(streak.current);
        recordQuickStreak(streak.current);
      }
      speak(q.tell.fi);
      setTimeout(next, game === 'quick' ? QUICK_REVEAL_MS : REVEAL_MS);
    },
    [q, wrong.length, game, next, recordQuickStreak],
  );

  const choose = useCallback(
    (v: number) => {
      if (!q || solved) return;
      if (knobs.audioChoices && picked !== v) {
        // the top level: the first tap only says it
        setPicked(v);
        speak(numberWord(v));
        return;
      }
      if (v === q.answer) {
        playDing(true);
        addStars(1);
        finish(true);
      } else {
        playDing(false);
        setWrong((w) => [...w, v]);
        setPicked(null);
        if (game === 'quick') {
          streak.current = 0;
          setStreakNow(0);
        }
      }
    },
    [q, solved, knobs.audioChoices, picked, addStars, finish, game],
  );

  // Quick sums: the clock. When it runs out, the answer is shown and play moves on.
  useEffect(() => {
    if (!q || solved || knobs.seconds === undefined) return;
    const t = setTimeout(() => {
      setTimedOut(true);
      playDing(false);
      streak.current = 0;
      setStreakNow(0);
      setWrong((w) => (w.includes(-1) ? w : [...w, -1]));
      setSolved(true);
      setShown(true);
      speak(q.tell.fi);
      setTimeout(next, REVEAL_MS);
    }, knobs.seconds * 1000);
    return () => clearTimeout(t);
  }, [q, solved, knobs.seconds, next]);

  const restart = useCallback(() => {
    setIndex(0);
    setWrong([]);
    setSolved(false);
    setShown(false);
    setPicked(null);
    setTimedOut(false);
    setDone(false);
    firstTries.current = 0;
    setRunId((r) => r + 1);
  }, []);
  useSegmentComplete(done, firstTries.current, round.length, restart);

  if (done || !q) return null;

  // What the prompt says on screen: hidden when only heard, until a hint or the answer.
  const parts = q.show.kind === 'parts';
  const visible = !knobs.spokenOnly || shown || solved;
  const ownChoices = ownsChoices(game);

  return (
    <section className={`screen activity math math--${game}`}>
      <ActivityHeader title={title} index={index} total={round.length} onExit={onExit} />

      {game === 'quick' && (
        <div className="math-quick-bar" aria-hidden="true">
          {knobs.seconds !== undefined && !solved && (
            <span className="math-quick-bar__time" key={index} style={{ animationDuration: `${knobs.seconds}s` }} />
          )}
          <span className="math-quick-bar__streak">
            {Array.from({ length: Math.min(streakNow, 10) }, (_, i) => (
              <Art key={i} glyph="🔥" />
            ))}
          </span>
        </div>
      )}

      <MathScene game={game} q={q} solved={solved} knobs={knobs} wrong={wrong} onChoose={choose} picked={picked} />

      <div className="math-prompt">
        <button type="button" className="speaker math-prompt__hear" onClick={() => speak(said(q))} aria-label="Kuuntele uudestaan · Hear it again">
          <SpeakerIcon />
        </button>
        <div className="math-prompt__text">
          {parts && !solved ? (
            // the builder: hear the teen, fill in its first part
            <p className="prompt" lang="fi">
              Kuuntele ja täydennä!
            </p>
          ) : visible ? (
            q.ask.map((s, i) => (
              <p key={i} className="prompt math-prompt__line">
                <MathText text={s.fi} />
              </p>
            ))
          ) : (
            <button type="button" className="btn math-prompt__show" onClick={() => setShown(true)}>
              Näytä sanat
            </button>
          )}
        </div>
      </div>

      {!ownChoices && (
        <div className={'math-choices' + (knobs.audioChoices ? ' math-choices--heard' : '')}>
          {knobs.audioChoices && !solved && <p className="math-choices__help">Kuuntele ja valitse</p>}
          {q.options.map((v, i) => {
            const isWrong = wrong.includes(v);
            const isRight = solved && v === q.answer;
            return (
              <button
                key={v}
                type="button"
                className={
                  'math-choice' +
                  (isWrong ? ' math-choice--wrong' : '') +
                  (isRight ? ' math-choice--right' : '') +
                  (picked === v ? ' math-choice--picked' : '')
                }
                onClick={() => choose(v)}
                disabled={solved || isWrong}
                aria-label={knobs.audioChoices && !solved ? `Vaihtoehto · choice ${String.fromCharCode(65 + i)}` : undefined}
              >
                {knobs.audioChoices && !solved ? <SpeakerIcon /> : numberWord(v)}
              </button>
            );
          })}
        </div>
      )}

      {solved && (
        <p className={'math-tell' + (timedOut ? ' math-tell--late' : '')} role="status">
          {timedOut && <span className="en">Time's up — </span>}
          <MathText text={q.tell.fi} />
        </p>
      )}
    </section>
  );
}

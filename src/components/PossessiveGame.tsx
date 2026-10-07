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
import WhyTip from './WhyTip';
import { whyForPossessor, whyForPossessorPick } from '../content/why';
import { POSSESSORS, possessiveForm, possessiveGloss } from '../content/types';
import { possessiveSegments } from '../content/endings';
import { Segments } from './LessonView';

const QUESTIONS = 6;

interface Props {
  items: LexicalItem[];
  onExit: () => void;
  /** 'never' = only "my book"; 'always' = mostly "in my house"; default = the
   *  place forms join from level 4. */
  cases?: 'never' | 'always';
}

// Kenen? (Whose?) — Finnish marks the possessor with a SUFFIX, not a separate
// word: "kissani" (my cat), "kissasi" (your cat), "kissansa" (his/her cat). A
// picture + English gloss ("my cat" / "in your house") is shown; the child
// picks the form carrying the right possessive suffix from tiles that are the
// SAME noun with the OTHER possessors' suffixes — so the ending is the whole
// question. Every form is sourced (possessiveForm); nothing is assembled.
export default function PossessiveGame({ items, onExit, cases }: Props) {
  const { level, addStars, recordAttempt, activeChild, markPhraseSeen } = useProfile();
  const ctx = useActivityContext();
  const difficulty = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  const { optionCount } = difficulty;
  // From L4 up, bring in the place-locative forms ("in my house") on top of the
  // bare "my cat" nominative — the node's own reach.
  const withCases = cases === 'always' || (cases !== 'never' && difficulty.level >= 4);
  // A step that is ABOUT the place forms asks them most of the time.
  const locativeShare = cases === 'always' ? 0.75 : 0.4;
  // Familiarity bias, snapshotted once per mount (see ListenAndTap).
  const weigh = useRef(familiarityWeigher(activeChild?.srs)).current;

  const missed = useRef(false);
  const firstTries = useRef(0);

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    // `roundQuestions` (Audit harness) caps the round to stop after each answer.
    () =>
      buildPossessiveRound(items, QUESTIONS, optionCount, withCases, weigh, locativeShare).slice(
        0,
        ctx?.roundQuestions,
      ),
    [items, optionCount, withCases, locativeShare, weigh, runId, ctx?.roundQuestions],
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
  // First time this kind of possessive comes up, SHOW the endings before asking:
  // the same word with -ni / -si / -nsa ("kirjani — my book…"). Remembered per
  // child; 'places' is its own intro ("talossani — in my house").
  const introKey = withCases ? 'poss:places' : 'poss:endings';
  const seenSnapshot = useRef(activeChild?.course?.phrasesSeen ?? {}).current;
  const [introDone, setIntroDone] = useState(false);
  const showIntro = !!q && !done && !introDone && !seenSnapshot[introKey];
  // The intro's example: the first question's word, in its case.
  const introRows = q
    ? POSSESSORS.map((p) => ({
        id: p.id,
        form: possessiveForm(q.item, p.id, q.caseId),
        en: possessiveGloss(q.item, p.id, q.caseId),
      })).filter((r) => r.form)
    : [];
  // The question a wrong tap happened on — its "Why?" tip shows until it advances.
  const [whyAt, setWhyAt] = useState(-1);
  const [whyPick, setWhyPick] = useState<string | null>(null);

  // Narrate the English cue when a new question appears — the Finnish is what
  // the child must recognize, never previewed. (The gloss is the on-screen text
  // read aloud for a pre-reader.)
  useEffect(() => {
    if (!q || done || showIntro) return;
    const t = setTimeout(() => speakEnglish(q.gloss), 350);
    return () => clearTimeout(t);
  }, [q, done, showIntro]);

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
        setWhyAt(index);
        playDing(false);
        setWrongForm(form);
        setWhyPick(form);
        setTimeout(() => setWrongForm((cur) => (cur === form ? null : cur)), 600);
      }
    },
    [q, locked, done, index, round.length, addStars, recordAttempt],
  );

  // Keyboard: number keys pick a tile; Space/Enter replays the English cue.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!q || done || showIntro) return;
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

  if (showIntro) {
    return (
      <section className="screen activity">
        <ActivityHeader title="Kenen? · Whose?" index={index} total={round.length} stars={ctx?.sessionStars} onExit={onExit} />
        <p className="prompt">
          Uusi pääte! <span className="en">A new ending!</span>
        </p>
        <div className="phrase-card phrase-intro">
          <p className="phrase-intro__label en">
            {withCases
              ? '"My" goes on the very end — after the place ending:'
              : 'The END of the word says whose it is:'}
          </p>
          <ul className="lesson-rows">
            {introRows.map((r) => (
              <li className="lesson-row" key={r.id}>
                <span className="lesson-row__emoji" aria-hidden="true">
                  {q.item.emoji}
                </span>
                <span className="lesson-row__text">
                  <span className="lesson-row__fi" lang="fi">
                    <Segments segments={possessiveSegments(r.form!, r.id)} />
                  </span>
                  <span className="en lesson-row__en">{r.en}</span>
                </span>
                <button
                  className="speaker speaker--inline lesson-row__speak"
                  onClick={() => speak(r.form!)}
                  aria-label={`Kuuntele · Listen: ${r.form}`}
                >
                  🔊
                </button>
              </li>
            ))}
          </ul>
          <p className="phrase-intro__label en">-ni = my · -si = your · -nsa / -nsä = his, her, their</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => {
            markPhraseSeen(introKey);
            setIntroDone(true);
          }}
          autoFocus
        >
          Jatka <span className="en">Continue</span>
        </button>
      </section>
    );
  }

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
      {whyAt === index && q && (
        <WhyTip
          why={
            whyPick
              ? whyForPossessorPick(q.item, q.possessor, q.caseId, whyPick)
              : whyForPossessor(q.item, q.possessor, q.caseId)
          }
        />
      )}
    </section>
  );
}

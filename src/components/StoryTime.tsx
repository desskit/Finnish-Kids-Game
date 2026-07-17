import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StoryOption } from '../content/stories';
import { stories } from '../content/stories';
import { useProfile } from '../state/profile';
import { useActivityContext, useSegmentComplete } from '../game/activityContext';
import { difficultyFor, showsGloss } from '../game/adapt';
import { buildStory } from '../game/round';
import { speak } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';

interface Props {
  onExit: () => void;
}

// Satuhetki (story time): a tiny illustrated story read page by page, then a
// couple of comprehension taps. This is the app's CONNECTED input — following
// 4–6 sentences for meaning, not answering one isolated drill at a time. The
// pages are input (nothing to get wrong); only the questions are scored, so
// they alone feed the adaptive engine. Like the other communicative games the
// English glosses drop away at the Finnish-only rung (showsGloss). No SRS
// crediting — story lines are authored wholes, not single lexical items.
export default function StoryTime({ onExit }: Props) {
  const { level, addStars } = useProfile();
  const ctx = useActivityContext();
  const difficulty = ctx?.difficulty ?? difficultyFor(level >= 2 ? 3 : 1);
  const { maxTier } = difficulty;
  // Top rung: drop the English so the story is followed in Finnish alone.
  const glossed = showsGloss(difficulty.level);

  const missed = useRef(false);
  const firstTries = useRef(0);
  const spokenFor = useRef('');

  const [runId, setRunId] = useState(0);
  const round = useMemo(
    () => buildStory(stories, maxTier),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxTier, runId],
  );

  const [pageIndex, setPageIndex] = useState(0);
  const [phase, setPhase] = useState<'read' | 'quiz'>('read');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [wrongFi, setWrongFi] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const page = round?.story.pages[pageIndex];
  const q = round?.questions[questionIndex];

  // Read each page aloud as it appears (once per page — guard against
  // re-renders), and speak the question when the quiz phase reaches it.
  useEffect(() => {
    if (!round || done) return;
    const cue = phase === 'read' ? page?.fi : q?.question.promptFi;
    if (!cue || spokenFor.current === `${phase}:${cue}`) return;
    spokenFor.current = `${phase}:${cue}`;
    const t = setTimeout(() => speak(cue, { queue: true }), 350);
    return () => clearTimeout(t);
  }, [round, done, phase, page, q]);

  const nextPage = useCallback(() => {
    if (!round || phase !== 'read') return;
    if (pageIndex + 1 < round.story.pages.length) setPageIndex(pageIndex + 1);
    else setPhase('quiz');
  }, [round, phase, pageIndex]);

  const choose = useCallback(
    (opt: StoryOption) => {
      if (!round || !q || locked || done || phase !== 'quiz') return;
      if (opt.correct) {
        setLocked(true);
        playDing(true);
        speak(opt.fi);
        addStars(1);
        if (!missed.current) firstTries.current += 1;
        setWrongFi(null);
        const next = questionIndex + 1;
        setTimeout(() => {
          if (next >= round.questions.length) setDone(true);
          else setQuestionIndex(next);
          missed.current = false;
          setLocked(false);
        }, 1000);
      } else {
        missed.current = true;
        playDing(false);
        setWrongFi(opt.fi);
        setTimeout(() => setWrongFi((cur) => (cur === opt.fi ? null : cur)), 600);
      }
    },
    [round, q, locked, done, phase, questionIndex, addStars],
  );

  // Keyboard: Space/Enter = next page (read) or replay (quiz); 1..n pick options.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!round || done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (phase === 'read') nextPage();
        else if (q) speak(q.question.promptFi);
        return;
      }
      if (phase === 'quiz' && q) {
        const n = Number.parseInt(e.key, 10);
        if (n >= 1 && n <= q.options.length) choose(q.options[n - 1]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [round, done, phase, q, nextPage, choose]);

  function restart() {
    setPageIndex(0);
    setPhase('read');
    setQuestionIndex(0);
    setWrongFi(null);
    setLocked(false);
    setDone(false);
    missed.current = false;
    firstTries.current = 0;
    spokenFor.current = '';
    setRunId((r) => r + 1);
  }

  const totalQuestions = round?.questions.length ?? 0;
  useSegmentComplete(done, firstTries.current, totalQuestions, restart);

  if (done || !round) return null;
  const { story } = round;

  return (
    <section className="screen activity">
      <ActivityHeader
        title={`${story.icon} ${story.titleFi} · ${story.titleEn}`}
        index={phase === 'read' ? 0 : questionIndex}
        total={totalQuestions}
        stars={ctx?.sessionStars}
        onExit={onExit}
      />

      {phase === 'read' && page ? (
        <>
          <p className="prompt">
            Luetaan! <span className="en">Story time</span>
          </p>

          <div className="phrase-card story-page">
            <span className="phrase-emoji" aria-hidden="true">
              {page.emoji}
            </span>
            <p className="story-page__fi">{page.fi}</p>
            {glossed && <p className="en phrase-hint">{page.en}</p>}
            <button
              className="speaker speaker--inline"
              onClick={() => speak(page.fi)}
              aria-label="Hear the page again"
            >
              🔊 <span className="en">Listen</span>
            </button>
          </div>

          <div className="story-dots" aria-label={`Page ${pageIndex + 1} of ${story.pages.length}`}>
            {story.pages.map((_, i) => (
              <span
                key={i}
                className={'dot' + (i < pageIndex ? ' dot--done' : i === pageIndex ? ' dot--current' : '')}
              />
            ))}
          </div>

          <button className="btn btn--primary" onClick={nextPage} autoFocus>
            {pageIndex + 1 < story.pages.length ? (
              <>
                Seuraava <span className="en">Next</span>
              </>
            ) : (
              <>
                Kysymykset <span className="en">Questions</span>
              </>
            )}
          </button>
        </>
      ) : q ? (
        <>
          <p className="prompt">
            {q.question.promptFi}{' '}
            {glossed && <span className="en">{q.question.promptEn}</span>}
          </p>

          <button
            className="speaker speaker--hero"
            onClick={() => speak(q.question.promptFi)}
            aria-label="Hear the question again"
          >
            🔊
            <span className="speaker__hint">Kuuntele · Listen</span>
          </button>

          <div className={`card-grid card-grid--${q.options.length}`}>
            {q.options.map((opt, i) => (
              <button
                key={opt.fi}
                className={
                  'pic-card' +
                  (wrongFi === opt.fi ? ' pic-card--wrong' : '') +
                  (locked && opt.correct ? ' pic-card--correct' : '')
                }
                onClick={() => choose(opt)}
                disabled={locked}
              >
                <span className="pic-card__num">{i + 1}</span>
                <span className="pic-card__emoji" aria-hidden="true">
                  {opt.emoji}
                </span>
                <span className="pic-card__label">{opt.fi}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

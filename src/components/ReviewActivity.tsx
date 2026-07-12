import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LexicalItem } from '../content/types';
import { reviewItems, reviewItemById } from '../content';
import { useProfile } from '../state/profile';
import { MAX_BOX, selectReviewItems } from '../game/srs';
import { sample, shuffle } from '../util/shuffle';
import { speak, speakEnglish } from '../audio/speak';
import { playDing } from '../audio/sfx';
import ActivityHeader from './ActivityHeader';
import RoundComplete from './RoundComplete';

const QUESTIONS = 8;

/**
 * The retrieval format escalates with the item's SRS box, so a mastered word
 * gets a harder test than a day-one word (desirable difficulties):
 *   box 1-2 → recognition (hear Finnish, tap the picture)
 *   box 3-4 → production pick (see picture, pick the Finnish word)
 *   box 5   → spelling (see picture, TYPE the Finnish)
 */
type ReviewFormat = 'recognition' | 'production' | 'spelling';

function formatForBox(box: number): ReviewFormat {
  if (box >= MAX_BOX) return 'spelling';
  if (box >= 3) return 'production';
  return 'recognition';
}

interface ReviewQ {
  target: LexicalItem;
  format: ReviewFormat;
  /** Picture/word options (recognition + production); empty for spelling. */
  options: LexicalItem[];
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[.!?]+$/, '');

// Review (spaced repetition): a cross-topic drill over the items the scheduler
// says are due, backfilled with new words. The FORMAT of each question scales
// with how well the child knows that item (see ReviewFormat). Records each
// answer back into SRS, which schedules the next review. Reachable at /review.
export default function ReviewActivity({ embedded = false }: { embedded?: boolean } = {}) {
  const { level, addStars, recordAttempt, activeChild } = useProfile();
  const navigate = useNavigate();
  const optionCount = level >= 2 ? 4 : 3;

  const missed = useRef(false);
  const [runId, setRunId] = useState(0);

  // Select due/new items once per run (snapshot at start, so answering during
  // the round doesn't reshuffle the questions underneath the child).
  const round = useMemo<ReviewQ[]>(() => {
    const schedules = activeChild?.srs ?? {};
    const ids = selectReviewItems({
      schedules,
      allIds: reviewItems.map((i) => i.id),
      now: Date.now(),
      count: QUESTIONS,
    });
    return ids
      .map((id) => reviewItemById[id])
      .filter((i): i is LexicalItem => Boolean(i))
      .map((target) => {
        const format = formatForBox(schedules[target.id]?.box ?? 1);
        const options =
          format === 'spelling'
            ? []
            : shuffle([
                target,
                ...sample(
                  reviewItems.filter((i) => i.id !== target.id && i.emoji),
                  optionCount - 1,
                ),
              ]);
        return { target, format, options };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionCount, runId]);

  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [input, setInput] = useState('');
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  // Leading letters revealed for the current spelling question (max 3).
  const [revealed, setRevealed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_REVEALS = 3;

  const question = round[index];
  const spellingCorrect =
    !!question && question.format === 'spelling' && norm(input) === norm(question.target.fi);

  // Cue a new question: hear the Finnish (recognition), or the English prompt
  // for the production/spelling formats (which must be produced, not heard).
  useEffect(() => {
    if (!question || done) return;
    const t = setTimeout(() => {
      if (question.format === 'recognition') speak(question.target.fi);
      else speakEnglish(question.target.en);
      if (question.format === 'spelling') inputRef.current?.focus();
    }, 350);
    return () => clearTimeout(t);
  }, [question, done, index]);

  // Shared success path: ding, confirm the Finnish, credit SRS, advance.
  const succeed = useCallback(() => {
    if (!question) return;
    setLocked(true);
    playDing(true);
    speak(question.target.fi);
    setStars((s) => s + 1);
    addStars(1);
    recordAttempt(question.target.id, !missed.current);
    const next = index + 1;
    setTimeout(() => {
      if (next >= round.length) setDone(true);
      else {
        setIndex(next);
        setInput('');
        setRevealed(0);
      }
      missed.current = false;
      setLocked(false);
    }, 900);
  }, [question, index, round.length, addStars, recordAttempt]);

  // Recognition + production: tap an option tile.
  const choose = useCallback(
    (item: LexicalItem) => {
      if (!question || locked || done) return;
      if (item.id === question.target.id) {
        setWrongId(null);
        succeed();
      } else {
        missed.current = true;
        playDing(false);
        // Recognition names the tapped picture (a wrong guess still teaches);
        // production's tiles are already words, so just flash.
        if (question.format === 'recognition') speak(item.fi);
        setWrongId(item.id);
        setTimeout(() => setWrongId((cur) => (cur === item.id ? null : cur)), 600);
      }
    },
    [question, locked, done, succeed],
  );

  // Spelling: the device keyboard drives the input; check on every change.
  function onInputChange(value: string) {
    if (!question || locked || done) return;
    setInput(value);
    if (value.length < norm(question.target.fi).length) return;
    if (norm(value) === norm(question.target.fi)) {
      succeed();
    } else {
      missed.current = true;
      playDing(false);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  // Reveal the next needed letter of the Finnish answer (max 3, never the whole
  // word), for the spelling format where a child can get truly stuck. Respects
  // what they've typed — appends one letter past their correct prefix. Using a
  // hint marks the item not-recalled so the SRS revisits it sooner.
  function revealNext() {
    if (!question || locked || done || question.format !== 'spelling') return;
    if (revealed >= MAX_REVEALS) return;
    const answer = question.target.fi;
    let p = 0;
    while (p < input.length && p < answer.length && input[p].toLowerCase() === answer[p].toLowerCase()) p++;
    const n = Math.min(p + 1, Math.max(0, answer.length - 1));
    if (n <= p) return;
    missed.current = true;
    setRevealed(revealed + 1);
    setInput(answer.slice(0, n));
    inputRef.current?.focus();
  }

  // Move past a question the child is stuck on: record it not-recalled (so it
  // comes back) and advance. Never a buzz/penalty — just a way forward.
  const skip = useCallback(() => {
    if (!question || locked || done) return;
    recordAttempt(question.target.id, false);
    const next = index + 1;
    missed.current = false;
    setInput('');
    setRevealed(0);
    setWrongId(null);
    setShake(false);
    if (next >= round.length) setDone(true);
    else setIndex(next);
  }, [question, locked, done, index, round.length, recordAttempt]);

  const replay = useCallback(() => {
    if (!question) return;
    if (question.format === 'recognition') speak(question.target.fi);
    else speakEnglish(question.target.en);
  }, [question]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!question || done || question.format === 'spelling') return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        replay();
        return;
      }
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= question.options.length) choose(question.options[n - 1]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, done, choose, replay]);

  function restart() {
    setIndex(0);
    setStars(0);
    setInput('');
    setWrongId(null);
    setShake(false);
    setLocked(false);
    setDone(false);
    setRevealed(0);
    missed.current = false;
    setRunId((r) => r + 1);
  }

  // Embedded (in the grown-up Audit harness) it must NOT navigate the app away,
  // so "home" is disabled — only replaying the round is offered.
  const goHome = embedded ? undefined : () => navigate('/');

  if (!activeChild) return null;

  if (done) {
    return (
      <main className="app">
        <RoundComplete stars={stars} total={round.length} onAgain={restart} onHome={goHome} />
      </main>
    );
  }
  if (!question) return null;

  const prompt =
    question.format === 'recognition' ? (
      <>
        Mikä tämä on? <span className="en">Which one did you hear?</span>
      </>
    ) : question.format === 'production' ? (
      <>
        Mikä tämä on suomeksi? <span className="en">What is this in Finnish?</span>
      </>
    ) : (
      <>
        Kirjoita suomeksi <span className="en">Write it in Finnish</span>
      </>
    );

  return (
    <main className="app">
      <section className="screen activity">
        <ActivityHeader title="Kertaus · Review" index={index} total={round.length} onExit={goHome} />

        <p className="prompt">{prompt}</p>

        {question.format === 'recognition' ? (
          <>
            <button
              className="speaker speaker--hero"
              onClick={replay}
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
          </>
        ) : (
          <>
            <div className="phrase-card">
              <span className="phrase-emoji" aria-hidden="true">
                {question.target.emoji}
              </span>
              <p className="en phrase-hint">{question.target.en}</p>
              <button
                className="speaker speaker--inline"
                onClick={replay}
                aria-label="Hear the prompt again"
              >
                🔊 <span className="en">Listen</span>
              </button>
            </div>

            {question.format === 'production' ? (
              <div className="word-tiles">
                {question.options.map((opt, i) => (
                  <button
                    key={opt.id}
                    className={
                      'word-tile' +
                      (wrongId === opt.id ? ' word-tile--wrong' : '') +
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
            ) : (
              <>
                <input
                  ref={inputRef}
                  className={
                    'spell-input' +
                    (shake ? ' spell-input--wrong' : '') +
                    (spellingCorrect ? ' spell-input--correct' : '')
                  }
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  readOnly={locked}
                  autoFocus
                  type="text"
                  inputMode="text"
                  lang="fi"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="done"
                  aria-label="Type the word in Finnish"
                />
                {/* Stuck-child helpers: reveal up to 3 leading letters, or skip. */}
                <div className="stuck-help">
                  <button
                    className="btn btn--ghost"
                    onClick={revealNext}
                    disabled={locked || revealed >= MAX_REVEALS}
                  >
                    💡 Kirjain <span className="en">Letter</span>
                    <span className="stuck-help__count">{MAX_REVEALS - revealed}</span>
                  </button>
                  <button className="btn btn--ghost" onClick={skip} disabled={locked}>
                    Ohita <span className="en">Skip</span> →
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}

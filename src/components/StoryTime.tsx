import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CAST,
  NARRATOR_PITCH,
  stories,
  storyById,
  type CastId,
  type Story,
  type StoryLine,
  type StoryScene,
} from '../content/stories';
import { lookupWord, type WordMeaning } from '../content/wordIndex';
import { useProfile } from '../state/profile';
import { useActivityContext } from '../game/activityContext';
import { drawQuiz, type OrderItem, type QuizItem } from '../game/storyQuiz';
import {
  READ_QUESTIONS,
  REVISIT_QUESTIONS,
  isGoodRead,
  needsSupport,
  nextStoryId,
  storyReadWell,
  storyRecord,
} from '../game/storyLog';
import { speak, stopSpeaking } from '../audio/speak';
import { playDing } from '../audio/sfx';
import { sample, shuffle } from '../util/shuffle';
import ActivityHeader from './ActivityHeader';

// Satuhetki (story time): a little picture book. A cover, three or four pages
// — each a scene with a few short lines, read aloud one by one (the line being
// read lights up; characters talk in speech bubbles, each in their own voice)
// — "Loppu!", then questions about what happened: pictures, true or false,
// who said it, and putting the pages in order.
//
//  - 'read' (a course step): one good read — 3 of 4 right first time — and the
//    story is done; a weak read is read again WITH the English and asks other
//    questions. The read is recorded but the story stays on screen for its own
//    result: "Continue", "Next story" or "Read it again".
//  - 'revisit' (the warm-up's "Muistatko?"): the cover, an optional re-read,
//    and two questions it hasn't asked before.
//  - 'free' (the bookshelf): just the book, as often as she likes.

type Mode = 'read' | 'revisit' | 'free';
type Phase = 'cover' | 'page' | 'end' | 'quiz' | 'result';

interface Props {
  onExit: () => void;
  /** A course step's stories (default: every story). */
  ids?: string[];
  mode?: Mode;
  /** 'revisit' / 'free': the story to show. */
  storyId?: string;
}

function pitchOf(line: StoryLine, story: Story): number {
  if (line.by) return CAST[line.by].pitch;
  return story.narrator ? CAST[story.narrator].pitch : NARRATOR_PITCH;
}

/** Long enough for the voice to finish a line — only used if the browser never says it ended. */
function lineMs(text: string): number {
  return 1500 + 110 * text.length;
}

/** The people who talk in a story (its teller first), for the cover. */
function castOf(story: Story): CastId[] {
  const talkers = story.pages.flatMap((p) => p.lines.flatMap((l) => (l.by ? [l.by] : [])));
  return [...new Set([...(story.narrator ? [story.narrator] : []), ...talkers])];
}

function Scene({ scene, small = false, animate = true }: { scene: StoryScene; small?: boolean; animate?: boolean }) {
  return (
    <div
      className={`story-stage story-stage--${scene.tone ?? 'day'}${small ? ' story-stage--small' : ''}`}
      aria-hidden="true"
    >
      <div className="story-stage__bg">
        {scene.bg.map((e, i) => (
          <span key={i}>{e}</span>
        ))}
      </div>
      <div className={'story-stage__fg' + (animate ? ' story-stage__fg--enter' : '')}>
        {scene.fg.map((e, i) => (
          <span key={i}>{e}</span>
        ))}
      </div>
    </div>
  );
}

export default function StoryTime({ onExit, ids, mode = 'read', storyId }: Props) {
  const { activeChild, addStars } = useProfile();
  const ctx = useActivityContext();
  const navigate = useNavigate();
  const pool = useMemo(() => ids ?? stories.map((s) => s.id), [ids]);

  // One story per read; "Next story" moves on to another. A step's own stories
  // come in their order; "all stories" (Mestari) picks any she hasn't read.
  const [currentId, setCurrentId] = useState(() => {
    if (storyId) return storyId;
    if (!ids) {
      const unread = pool.filter((id) => !storyReadWell(activeChild, id));
      return sample(unread.length > 0 ? unread : pool, 1)[0];
    }
    return nextStoryId(activeChild, pool) ?? pool[0];
  });
  const story = storyById[currentId];
  // Re-reading after a weak read: the English shows with every line.
  const [supported, setSupported] = useState(() => mode === 'read' && needsSupport(activeChild, currentId));
  const [phase, setPhase] = useState<Phase>('cover');
  const [pageIndex, setPageIndex] = useState(0);
  const [peek, setPeek] = useState(false);
  const [reading, setReading] = useState(-1);
  const [tip, setTip] = useState<{ word: string; meaning?: WordMeaning; line: number } | null>(null);

  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [right, setRight] = useState(0);
  const [locked, setLocked] = useState(false);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [placed, setPlaced] = useState<number[]>([]);
  const missed = useRef(false);
  const [handedOff, setHandedOff] = useState(false);
  const [nextUnread, setNextUnread] = useState<string | undefined>(undefined);

  const readToken = useRef(0);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const hush = useCallback(() => {
    readToken.current += 1;
    stopSpeaking();
    setReading(-1);
  }, []);
  useEffect(
    () => () => {
      readToken.current += 1;
      timers.current.forEach((t) => window.clearTimeout(t));
      stopSpeaking();
    },
    [],
  );

  const showEnglish = supported || peek;
  const page = story?.pages[pageIndex];

  // Read lines aloud one after another, lighting up each as it's read. A tap on
  // one line (`only`) reads just that line.
  const readLines = useCallback(
    (lines: StoryLine[], from = 0, only = false) => {
      if (!story) return;
      const token = ++readToken.current;
      const step = (i: number) => {
        if (readToken.current !== token) return;
        if (i >= lines.length || (only && i > from)) {
          setReading(-1);
          return;
        }
        setReading(i);
        let finished = false;
        let fallback = 0;
        const done = () => {
          if (finished || readToken.current !== token) return;
          finished = true;
          window.clearTimeout(fallback);
          later(() => step(i + 1), 350);
        };
        fallback = window.setTimeout(done, lineMs(lines[i].fi));
        timers.current.push(fallback);
        speak(lines[i].fi, { pitch: pitchOf(lines[i], story), onEnd: done, queue: i > from });
      };
      stopSpeaking();
      step(from);
    },
    [story],
  );

  // Each new page reads itself aloud.
  useEffect(() => {
    if (phase !== 'page' || !page) return;
    const t = window.setTimeout(() => readLines(page.lines), 450);
    return () => window.clearTimeout(t);
  }, [phase, pageIndex, page, readLines]);

  // The cover says the title; the end says "Loppu!".
  useEffect(() => {
    if (!story) return;
    if (phase === 'cover') speak(mode === 'revisit' ? `Muistatko? ${story.titleFi}` : story.titleFi);
    if (phase === 'end') speak('Loppu!');
  }, [phase, story, mode]);

  const q = phase === 'quiz' ? quiz[qIndex] : undefined;

  // Each question is read aloud as it appears.
  useEffect(() => {
    if (!q || !story) return;
    const cue =
      q.kind === 'choice'
        ? q.promptFi
        : q.kind === 'truefalse'
          ? q.fi
          : q.kind === 'who'
            ? q.line.fi
            : 'Laita kuvat järjestykseen!';
    const t = window.setTimeout(() => speak(cue, { pitch: NARRATOR_PITCH }), 350);
    return () => window.clearTimeout(t);
  }, [q, story]);

  // The order question shows its cards shuffled (never already in order).
  const orderShown = useMemo(() => {
    if (q?.kind !== 'order') return [];
    let s = shuffle(q.cards);
    for (let tries = 0; tries < 5 && s.every((c, i) => c.page === q.cards[i].page); tries++) s = shuffle(q.cards);
    return s;
  }, [q]);

  if (!story) return null;

  const start = () => {
    setPageIndex(0);
    setPeek(false);
    setTip(null);
    setPhase('page');
  };

  const goToPage = (i: number) => {
    hush();
    setTip(null);
    setPeek(false);
    if (i >= story.pages.length) setPhase('end');
    else setPageIndex(Math.max(0, i));
  };

  const startQuiz = () => {
    hush();
    const rec = storyRecord(activeChild, story.id);
    // (The grown-ups' test harness caps a round to one question.)
    const n = Math.min(mode === 'revisit' ? REVISIT_QUESTIONS : READ_QUESTIONS, ctx?.roundQuestions ?? Infinity);
    setQuiz(drawQuiz(story, n, mode === 'revisit' ? rec?.seen ?? [] : rec?.asked ?? []));
    setQIndex(0);
    setRight(0);
    setPlaced([]);
    setPeek(false);
    missed.current = false;
    setPhase('quiz');
  };

  // A whole new read: the same story again (with the English), or the next one.
  const readAgain = (nextId: string, withEnglish: boolean) => {
    hush();
    setCurrentId(nextId);
    setSupported(withEnglish);
    setNextUnread(undefined);
    setQuiz([]);
    setPhase(withEnglish ? 'page' : 'cover');
    setPageIndex(0);
    setPeek(false);
    setTip(null);
  };

  const finishQuiz = (firstTries: number) => {
    const asked = quiz.map((x) => x.id);
    if (mode === 'revisit') {
      setHandedOff(true);
      ctx?.onSegmentComplete(firstTries, quiz.length, { story: { id: story.id, asked } });
      return;
    }
    ctx?.onSegmentComplete(firstTries, quiz.length, { story: { id: story.id, asked }, stay: true });
    // After a good read: the step's next story still to read, if any (this one counts as read now).
    const unread = pool.filter((id) => id !== story.id && !storyReadWell(activeChild, id));
    setNextUnread(isGoodRead(firstTries, quiz.length) ? (ids ? unread[0] : sample(unread, 1)[0]) : undefined);
    setPhase('result');
  };

  const answered = (correct: boolean, key: string, say?: string) => {
    if (locked) return;
    if (!correct) {
      missed.current = true;
      playDing(false);
      setWrongKey(key);
      later(() => setWrongKey((k) => (k === key ? null : k)), 600);
      return;
    }
    setLocked(true);
    playDing(true);
    if (say) speak(say);
    addStars(1);
    const firstTries = right + (missed.current ? 0 : 1);
    setRight(firstTries);
    later(() => {
      missed.current = false;
      setLocked(false);
      setPlaced([]);
      setPeek(false);
      if (qIndex + 1 >= quiz.length) finishQuiz(firstTries);
      else setQIndex(qIndex + 1);
    }, 1100);
  };

  const tapOrderCard = (item: OrderItem, pageNo: number) => {
    if (locked || placed.includes(pageNo)) return;
    const card = item.cards.find((c) => c.page === pageNo)!;
    const expected = item.cards[placed.length].page;
    if (pageNo !== expected) {
      answered(false, `order-${pageNo}`);
      return;
    }
    speak(card.line.fi, { pitch: NARRATOR_PITCH });
    const now = [...placed, pageNo];
    setPlaced(now);
    if (now.length === item.cards.length) answered(true, 'order');
  };

  const tapWord = (word: string, line: number) => {
    speak(word);
    setTip({ word, meaning: lookupWord(word), line });
  };

  // Words in a line are tappable: tap one to hear it and see what it means.
  const words = (text: string, line: number): ReactNode[] =>
    text.split(/([\p{L}-]+)/u).map((part, i) =>
      /\p{L}/u.test(part) ? (
        <button key={i} type="button" className="story-word" onClick={() => tapWord(part, line)}>
          {part}
        </button>
      ) : (
        <span key={i}>{part}</span>
      ),
    );

  const headerIndex = phase === 'quiz' ? qIndex : phase === 'page' ? pageIndex : 0;
  const headerTotal = phase === 'quiz' ? quiz.length : story.pages.length;
  const header = (
    <ActivityHeader
      title={`${story.icon} ${story.titleFi} · ${story.titleEn}`}
      index={headerIndex}
      total={headerTotal}
      stars={ctx?.sessionStars}
      onExit={() => {
        hush();
        onExit();
      }}
    />
  );

  if (handedOff) return null;

  // --- The cover ---------------------------------------------------------
  if (phase === 'cover') {
    const cast = castOf(story);
    return (
      <section className="screen activity storybook">
        {header}
        <div className="story-cover">
          {mode === 'revisit' && (
            <p className="story-cover__kicker">
              Muistatko? <span className="en">Do you remember this story?</span>
            </p>
          )}
          <div className="story-cover__icon" aria-hidden="true">
            {story.icon}
          </div>
          <h1 className="story-cover__title">{story.titleFi}</h1>
          <p className="story-cover__en en">{story.titleEn}</p>
          {cast.length > 0 && (
            <p className="story-cover__cast" aria-label={cast.map((c) => CAST[c].nameFi).join(', ')}>
              {cast.map((c) => (
                <span key={c} className="story-cover__who">
                  <span aria-hidden="true">{CAST[c].emoji}</span>
                  <span className="story-cover__name">{CAST[c].nameFi}</span>
                </span>
              ))}
            </p>
          )}
          {story.narrator && (
            <p className="story-cover__teller">
              {CAST[story.narrator].nameFi} kertoo. <span className="en">{CAST[story.narrator].nameEn} tells the story.</span>
            </p>
          )}
        </div>
        <div className="button-row">
          {mode === 'revisit' ? (
            <>
              <button className="btn btn--primary" onClick={startQuiz} autoFocus>
                Kysymykset <span className="en">Questions</span>
              </button>
              <button className="btn" onClick={start}>
                📖 Lue ensin <span className="en">Read it first</span>
              </button>
            </>
          ) : (
            <button className="btn btn--primary" onClick={start} autoFocus>
              📖 Lue <span className="en">Read</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  // --- A page --------------------------------------------------------------
  if (phase === 'page' && page) {
    const last = pageIndex === story.pages.length - 1;
    return (
      <section className="screen activity storybook">
        {header}
        <Scene key={`${story.id}-${pageIndex}`} scene={page.scene} />
        <ol className="story-lines">
          {page.lines.map((line, i) => (
            <li
              key={i}
              className={
                'story-line' + (line.by ? ' story-line--talk' : '') + (reading === i ? ' story-line--reading' : '')
              }
            >
              {line.by && (
                <span className="story-line__who" title={CAST[line.by].nameFi}>
                  <span aria-hidden="true">{CAST[line.by].emoji}</span>
                  <span className="story-line__name">{CAST[line.by].nameFi}</span>
                </span>
              )}
              <div className="story-line__text">
                <p className="story-line__fi" lang="fi">
                  {words(line.fi, i)}
                </p>
                {showEnglish && <p className="story-line__en en">{line.en}</p>}
                {tip?.line === i && (
                  <p className="story-tip" role="status">
                    <strong>{tip.word}</strong>
                    {tip.meaning ? (
                      <>
                        {tip.meaning.base.toLowerCase() !== tip.word.toLowerCase() && <> → {tip.meaning.base}</>}
                        {' · '}
                        <span className="en">{tip.meaning.en}</span>
                      </>
                    ) : null}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="story-line__play"
                onClick={() => {
                  setTip(null);
                  readLines(page.lines, i, true);
                }}
                aria-label={`Kuuntele · Listen: ${line.fi}`}
              >
                🔊
              </button>
            </li>
          ))}
        </ol>
        <div className="story-controls">
          <button
            type="button"
            className="story-nav"
            onClick={() => goToPage(pageIndex - 1)}
            disabled={pageIndex === 0}
            aria-label="Edellinen sivu · Previous page"
          >
            ◀
          </button>
          <div className="story-dots" aria-label={`Sivu ${pageIndex + 1} / ${story.pages.length}`}>
            {story.pages.map((_, i) => (
              <span key={i} className={'dot' + (i < pageIndex ? ' dot--done' : i === pageIndex ? ' dot--current' : '')} />
            ))}
          </div>
          {!supported && (
            <button
              type="button"
              className={'story-peek' + (peek ? ' story-peek--on' : '')}
              onClick={() => setPeek((p) => !p)}
              aria-pressed={peek}
            >
              🇬🇧 <span className="en">English</span>
            </button>
          )}
          <button
            type="button"
            className="story-nav story-nav--next"
            onClick={() => goToPage(pageIndex + 1)}
            aria-label={last ? 'Loppu · The end' : 'Seuraava sivu · Next page'}
            autoFocus
          >
            ▶
          </button>
        </div>
      </section>
    );
  }

  // --- The end -------------------------------------------------------------
  if (phase === 'end') {
    const lastScene = story.pages[story.pages.length - 1].scene;
    return (
      <section className="screen activity storybook">
        {header}
        <div className="story-end">
          <Scene scene={lastScene} small animate={false} />
          <p className="story-end__word">
            Loppu! <span className="en">The end</span>
          </p>
        </div>
        <div className="button-row">
          {mode === 'free' ? (
            <>
              <button className="btn btn--primary" onClick={start} autoFocus>
                📖 Lue uudestaan <span className="en">Read it again</span>
              </button>
              <button className="btn" onClick={onExit}>
                📚 Kirjahylly <span className="en">Bookshelf</span>
              </button>
            </>
          ) : (
            <>
              <button className="btn btn--primary" onClick={startQuiz} autoFocus>
                Kysymykset <span className="en">Questions</span>
              </button>
              <button className="btn" onClick={start}>
                📖 Lue uudestaan <span className="en">Read it again</span>
              </button>
            </>
          )}
        </div>
      </section>
    );
  }

  // --- The result (a course step) ----------------------------------------
  if (phase === 'result') {
    const total = quiz.length;
    const good = isGoodRead(right, total);
    return (
      <section className="screen activity storybook">
        {header}
        <div className={'story-result' + (good ? ' story-result--good' : '')}>
          <div className="story-result__badge" aria-hidden="true">
            {good ? '🌟' : '💪'}
          </div>
          <p className="story-result__title">
            {good ? 'Hienoa!' : 'Melkein!'}{' '}
            <span className="en">{good ? 'You followed the story!' : 'Almost!'}</span>
          </p>
          <p className="story-result__score" aria-label={`${right} of ${total} right first time`}>
            {right} / {total}
          </p>
          {!good && <p className="story-result__hint en">Let's read it again — with the English this time.</p>}
        </div>
        <div className="button-row">
          {good ? (
            nextUnread ? (
              <button className="btn btn--primary" onClick={() => readAgain(nextUnread, false)} autoFocus>
                Seuraava tarina <span className="en">Next story</span>
              </button>
            ) : (
              <button className="btn btn--primary" onClick={() => navigate('/next')} autoFocus>
                Jatka <span className="en">Continue</span>
              </button>
            )
          ) : (
            <button className="btn btn--primary" onClick={() => readAgain(story.id, true)} autoFocus>
              📖 Lue uudestaan <span className="en">Read it again</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  // --- The questions -------------------------------------------------------
  if (!q) return null;
  return (
    <section className="screen activity storybook story-quiz">
      {header}
      {q.kind === 'choice' && (
        <>
          <p className="prompt" lang="fi">
            {q.promptFi} {showEnglish && <span className="en">{q.promptEn}</span>}
          </p>
          <QuestionTools onHear={() => speak(q.promptFi)} peek={peek} supported={supported} onPeek={() => setPeek((p) => !p)} />
          <div className={`card-grid card-grid--${q.options.length}`}>
            {q.options.map((opt, i) => (
              <button
                key={opt.fi}
                className={
                  'pic-card pic-card--labelled' +
                  (wrongKey === `c-${opt.fi}` ? ' pic-card--wrong' : '') +
                  (locked && opt.correct ? ' pic-card--correct' : '')
                }
                onClick={() => answered(!!opt.correct, `c-${opt.fi}`, opt.fi)}
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
      )}

      {q.kind === 'truefalse' && (
        <>
          <p className="prompt">
            Totta vai tarua? <span className="en">True or false?</span>
          </p>
          <div className="story-statement" lang="fi">
            <p className="story-statement__fi">{q.fi}</p>
            {showEnglish && <p className="story-statement__en en">{q.en}</p>}
          </div>
          <QuestionTools onHear={() => speak(q.fi)} peek={peek} supported={supported} onPeek={() => setPeek((p) => !p)} />
          <div className="tf-buttons">
            <button
              className={'tf-button tf-button--true' + (wrongKey === 'tf-true' ? ' pic-card--wrong' : '') + (locked && q.answer ? ' pic-card--correct' : '')}
              onClick={() => answered(q.answer === true, 'tf-true', 'Totta!')}
              disabled={locked}
            >
              👍 Totta <span className="en">True</span>
            </button>
            <button
              className={'tf-button tf-button--false' + (wrongKey === 'tf-false' ? ' pic-card--wrong' : '') + (locked && !q.answer ? ' pic-card--correct' : '')}
              onClick={() => answered(q.answer === false, 'tf-false', 'Tarua!')}
              disabled={locked}
            >
              👎 Tarua <span className="en">False</span>
            </button>
          </div>
        </>
      )}

      {q.kind === 'who' && (
        <>
          <p className="prompt">
            Kuka sanoo näin? <span className="en">Who says this?</span>
          </p>
          <div className="story-statement story-statement--quote" lang="fi">
            <p className="story-statement__fi">”{q.line.fi}”</p>
            {showEnglish && <p className="story-statement__en en">“{q.line.en}”</p>}
          </div>
          <QuestionTools
            onHear={() => speak(q.line.fi, { pitch: NARRATOR_PITCH })}
            peek={peek}
            supported={supported}
            onPeek={() => setPeek((p) => !p)}
          />
          <div className={`card-grid card-grid--${q.options.length}`}>
            {q.options.map((c, i) => (
              <button
                key={c}
                className={
                  'pic-card pic-card--labelled' +
                  (wrongKey === `w-${c}` ? ' pic-card--wrong' : '') +
                  (locked && c === q.speaker ? ' pic-card--correct' : '')
                }
                onClick={() => answered(c === q.speaker, `w-${c}`, CAST[c].nameFi)}
                disabled={locked}
              >
                <span className="pic-card__num">{i + 1}</span>
                <span className="pic-card__emoji" aria-hidden="true">
                  {CAST[c].emoji}
                </span>
                <span className="pic-card__label">{CAST[c].nameFi}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {q.kind === 'order' && (
        <>
          <p className="prompt">
            Laita kuvat järjestykseen! <span className="en">What happened first? Tap them in order.</span>
          </p>
          <ol className="order-cards">
            {orderShown.map((card) => {
              const at = placed.indexOf(card.page);
              return (
                <li key={card.page}>
                  <button
                    type="button"
                    className={
                      'order-card' +
                      (at >= 0 ? ' order-card--placed' : '') +
                      (wrongKey === `order-${card.page}` ? ' pic-card--wrong' : '')
                    }
                    onClick={() => tapOrderCard(q, card.page)}
                    disabled={locked || at >= 0}
                  >
                    <span className="order-card__num" aria-hidden="true">
                      {at >= 0 ? at + 1 : '?'}
                    </span>
                    <span className="order-card__pics" aria-hidden="true">
                      {card.scene.fg.slice(0, 3).join(' ')}
                    </span>
                    <span className="order-card__line" lang="fi">
                      {card.line.fi}
                      {showEnglish && <span className="en order-card__en">{card.line.en}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          {!supported && (
            <div className="story-tools">
              <button type="button" className={'story-peek' + (peek ? ' story-peek--on' : '')} onClick={() => setPeek((p) => !p)} aria-pressed={peek}>
                🇬🇧 <span className="en">English</span>
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** Hear the question again, and (unless it's already showing) peek at the English. */
function QuestionTools({
  onHear,
  peek,
  supported,
  onPeek,
}: {
  onHear: () => void;
  peek: boolean;
  supported: boolean;
  onPeek: () => void;
}) {
  return (
    <div className="story-tools">
      <button type="button" className="speaker speaker--inline" onClick={onHear} aria-label="Kuuntele uudestaan · Hear it again">
        🔊 <span className="en">Listen</span>
      </button>
      {!supported && (
        <button type="button" className={'story-peek' + (peek ? ' story-peek--on' : '')} onClick={onPeek} aria-pressed={peek}>
          🇬🇧 <span className="en">English</span>
        </button>
      )}
    </div>
  );
}

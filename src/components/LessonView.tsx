import { useEffect, useState } from 'react';
import { PERSONS } from '../content/types';
import { resolveRef, type Lesson, type LessonCard, type LessonRef, type ResolvedRef } from '../content/lessons';
import type { Segment } from '../content/endings';
import { useProfile } from '../state/profile';
import { speak } from '../audio/speak';
import Prose from './Prose';

interface Props {
  lesson: Lesson;
  /** Finished the last card (the course marks the lesson read). */
  onDone: () => void;
  /** Leave early (✕). */
  onClose: () => void;
  /** Label for the last button ("Start practicing", "Back to the notebook"…). */
  doneLabel?: { fi: string; en: string };
}

// A lesson: a few short cards, one at a time — prose, examples you can hear
// (with the ending that matters highlighted), a verb table, and an ungraded
// "try it" question. Used by the /lesson route, the Notebook, and the "Why?"
// tip's in-place reader.
export default function LessonView({ lesson, onDone, onClose, doneLabel }: Props) {
  const [index, setIndex] = useState(0);
  const card = lesson.cards[index];
  const last = index === lesson.cards.length - 1;

  return (
    <section className="screen lesson" aria-label={`Lesson: ${lesson.titleEn}`}>
      <header className="lesson__header">
        <button className="icon-btn" onClick={onClose} aria-label="Sulje · Close">
          ✕
        </button>
        <div className="lesson__title">
          <span className="lesson__emoji" aria-hidden="true">
            {lesson.emoji}
          </span>
          <span>
            {lesson.titleFi} <span className="en">{lesson.titleEn}</span>
          </span>
        </div>
        <div className="lesson__dots" aria-label={`Card ${index + 1} of ${lesson.cards.length}`}>
          {lesson.cards.map((_, i) => (
            <span key={i} className={'lesson__dot' + (i === index ? ' lesson__dot--on' : '')} />
          ))}
        </div>
      </header>

      {/* Keyed so a check card's picked answer resets between cards. */}
      <div className="lesson-card" key={index}>
        <CardBody card={card} />
      </div>

      <div className="button-row lesson__nav">
        <button className="btn" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
          ← <span className="en">Back</span>
        </button>
        {last ? (
          <button className="btn btn--primary" onClick={onDone} autoFocus>
            {doneLabel ? (
              <>
                {doneLabel.fi} <span className="en">{doneLabel.en}</span>
              </>
            ) : (
              <>
                Valmis! <span className="en">Got it</span>
              </>
            )}
          </button>
        ) : (
          <button className="btn btn--primary" onClick={() => setIndex((i) => i + 1)} autoFocus>
            Seuraava <span className="en">Next</span> →
          </button>
        )}
      </div>
    </section>
  );
}

function CardBody({ card }: { card: LessonCard }) {
  const { activeChild } = useProfile();
  const name = activeChild?.name ?? '';
  const resolve = (r: LessonRef) => resolveRef(r, name);

  switch (card.kind) {
    case 'explain':
      return (
        <>
          {card.title && <h2 className="lesson-card__title">{card.title}</h2>}
          <Prose text={card.text} />
        </>
      );
    case 'examples':
      return (
        <>
          {card.title && <h2 className="lesson-card__title">{card.title}</h2>}
          {card.text && <Prose text={card.text} />}
          <ul className="lesson-rows">
            {card.rows.map((r, i) => {
              const res = resolve(r);
              return res ? <ExampleRow key={i} r={res} /> : null;
            })}
          </ul>
        </>
      );
    case 'verbTable':
      return (
        <>
          {card.title && <h2 className="lesson-card__title">{card.title}</h2>}
          {card.text && <Prose text={card.text} />}
          <ul className="lesson-rows lesson-rows--table">
            {PERSONS.map((p) => {
              const res = resolve({
                verb: card.verb,
                tense: card.tense,
                polarity: card.polarity,
                person: p.id,
              });
              return res ? (
                <ExampleRow key={p.id} r={{ ...res, en: res.en ?? p.en, emoji: undefined }} />
              ) : null;
            })}
          </ul>
        </>
      );
    case 'pairs':
      return (
        <>
          {card.title && <h2 className="lesson-card__title">{card.title}</h2>}
          {card.text && <Prose text={card.text} />}
          <ul className="lesson-rows lesson-pairs">
            {card.ids.map((id) => {
              const said = resolve({ line: id, part: 'prompt' });
              const back = resolve({ line: id, part: 'reply' });
              return said && back ? (
                <li key={id} className="lesson-pair">
                  <ul className="lesson-rows">
                    <ExampleRow r={{ ...said, emoji: '🗣️' }} />
                    <ExampleRow r={{ ...back, emoji: '↪️' }} />
                  </ul>
                </li>
              ) : null;
            })}
          </ul>
        </>
      );
    case 'check':
      return <CheckCard card={card} resolve={resolve} />;
  }
}

export function Segments({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((s, i) => (s.mark ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>))}
    </>
  );
}

function ExampleRow({ r }: { r: ResolvedRef }) {
  return (
    <li className="lesson-row">
      {r.emoji && (
        <span className="lesson-row__emoji" aria-hidden="true">
          {r.emoji}
        </span>
      )}
      <span className="lesson-row__text">
        <span className="lesson-row__fi" lang="fi">
          {r.base && (
            <>
              <span className="lesson-row__base">
                {r.baseSegments ? <Segments segments={r.baseSegments} /> : r.base}
              </span>
              <span className="lesson-row__arrow" aria-hidden="true">
                {' → '}
              </span>
            </>
          )}
          <Segments segments={r.segments} />
        </span>
        {r.en && <span className="en lesson-row__en">{r.en}</span>}
      </span>
      <button
        className="speaker speaker--inline lesson-row__speak"
        onClick={() => speak(r.speak)}
        aria-label={`Kuuntele · Listen: ${r.speak}`}
      >
        🔊
      </button>
    </li>
  );
}

function CheckCard({
  card,
  resolve,
}: {
  card: Extract<LessonCard, { kind: 'check' }>;
  resolve: (r: LessonRef) => ResolvedRef | null;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const right = answered && !!card.options[picked].correct;
  const heard = card.listen ? resolve(card.listen) : null;
  useEffect(() => {
    if (!heard) return;
    const t = setTimeout(() => speak(heard.speak), 400);
    return () => clearTimeout(t);
    // Once per card (the card is keyed, so this runs on arrival).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h2 className="lesson-card__title">{card.title ?? 'Kokeile! · Try it'}</h2>
      <Prose text={card.question} />
      {heard && (
        <button
          className="speaker speaker--inline lesson-check__listen"
          onClick={() => speak(heard.speak)}
          aria-label="Kuuntele · Listen"
        >
          🔊 <span className="en">Listen</span>
        </button>
      )}
      <div className="lesson-check">
        {card.options.map((o, i) => {
          const res = o.ref ? resolve(o.ref) : null;
          const cls =
            'lesson-check__option' +
            (answered && o.correct ? ' lesson-check__option--right' : '') +
            (answered && i === picked && !o.correct ? ' lesson-check__option--wrong' : '');
          return (
            <button
              key={i}
              className={cls}
              onClick={() => {
                setPicked(i);
                if (res) speak(res.speak);
              }}
            >
              {res ? (
                <span lang="fi">
                  <Segments segments={answered ? res.segments : res.segments.map((s) => ({ text: s.text }))} />
                </span>
              ) : (
                o.text
              )}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={'lesson-check__result' + (right ? ' is-right' : ' is-wrong')} role="status">
          <strong>{right ? 'Oikein! Right!' : 'Melkein! Not quite.'}</strong>
          <Prose text={card.explain} />
        </div>
      )}
    </>
  );
}

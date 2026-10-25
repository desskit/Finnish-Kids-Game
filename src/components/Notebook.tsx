import { unlockAllFor } from '../state/storage';
import { Link } from 'react-router-dom';
import { lessonById } from '../content/lessons';
import { stories, storyById, type Story } from '../content/stories';
import { UNITS, midLessonStatus, unitStatus } from '../game/course';
import { storyReadWell } from '../game/storyLog';
import { useProfile } from '../state/profile';
import Art from '../art/Art';
import type { Child } from '../state/storage';
import type { LexicalItem } from '../content/types';
import { reviewItemById } from '../content';
import { speak } from '../audio/speak';

/** A word this far up the review boxes is marked well known in the word book. */
const WELL_KNOWN_BOX = 4;

/** Every story in the order the course meets it (then any the course doesn't). */
/** Every word the child has got right at least once, with a picture, in course order. */
function wordBook(child: Child | null | undefined): LexicalItem[] {
  const srs = child?.srs ?? {};
  const order = [...new Set([...UNITS.flatMap((u) => u.newWords ?? []), ...Object.keys(srs)])];
  return order.map((id) => reviewItemById[id]).filter((i) => i?.emoji && (srs[i.id]?.correct ?? 0) > 0);
}

function storiesInCourseOrder(): Story[] {
  const ids = UNITS.flatMap((u) => u.skills.filter((s) => s.activity === 'story').flatMap((s) => s.content.ids ?? []));
  const ordered = [...new Set(ids)].map((id) => storyById[id]).filter(Boolean);
  return [...ordered, ...stories.filter((s) => !ordered.includes(s))];
}

// The Notebook (Vihko): the bookshelf — every story she has finished, to read
// again just for fun — the word book (Sanakirjani: every word she has got
// right, to tap and hear), and every lesson from the units she has opened, to
// re-read any time ("how did -ssa work again?"). Locked units' lessons stay
// hidden so the course keeps its order.
export default function Notebook() {
  const { activeChild } = useProfile();
  const unlockAll = unlockAllFor(activeChild);
  const open = UNITS.map((u, i) => ({ u, i })).filter(
    ({ u }) => unitStatus(activeChild, u, unlockAll) !== 'locked',
  );
  // the lessons still to come: every lesson of a locked unit, and the part-way
  // lessons of an open unit that the child hasn't reached yet
  const locked = UNITS.reduce((n, u) => {
    const mids = u.midLessons ?? [];
    if (unitStatus(activeChild, u, unlockAll) === 'locked') return n + 1 + mids.length;
    return n + mids.filter((m) => midLessonStatus(activeChild, u, m, unlockAll) === 'locked').length;
  }, 0);
  const shelf = storiesInCourseOrder().filter((s) => storyReadWell(activeChild, s.id));
  const words = wordBook(activeChild);

  return (
    <section className="screen notebook">
      <div className="notebook__head">
        <Link className="icon-btn" to="/" aria-label="Koti · Home">
          <Art glyph="⬅︎" />
        </Link>
        <h1 className="title">
          <Art glyph="📓" /> Vihko <span className="en">Notebook</span>
        </h1>
      </div>
      {/* Finished books first: the fun part, never buried under the lessons. */}
      {shelf.length > 0 && (
        <>
          <h2 className="notebook__shelf-title">
            <Art glyph="📚" /> Kirjahylly <span className="en">Bookshelf</span>
          </h2>
          <ul className="bookshelf stagger">
            {shelf.map((s) => (
              <li key={s.id}>
                <Link className="book" to={`/story/${s.id}`}>
                  <span className="book__icon" aria-hidden="true">
                    <Art glyph={s.icon} />
                  </span>
                  <span className="book__title">{s.titleFi}</span>
                  <span className="book__en en">{s.titleEn}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      {/* The word book: what she knows, as a collection — no counts, no points. */}
      {words.length > 0 && (
        <>
          <h2 className="notebook__shelf-title">
            <Art glyph="📕" /> Sanakirjani <span className="en">My word book</span>
          </h2>
          <ul className="wordbook">
            {words.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  className="wordbook__word"
                  onClick={() => speak(w.fi)}
                  aria-label={`${w.fi} · ${w.en}`}
                >
                  <span aria-hidden="true">
                    <Art item={w} />
                  </span>
                  <span className="wordbook__fi" lang="fi">
                    {w.fi}
                  </span>
                  {(activeChild?.srs?.[w.id]?.box ?? 0) >= WELL_KNOWN_BOX && (
                    <span className="wordbook__known" aria-label="well known">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {(shelf.length > 0 || words.length > 0) && (
        <h2 className="notebook__shelf-title">
          <Art glyph="📖" /> Oppitunnit <span className="en">Lessons</span>
        </h2>
      )}
      <p className="notebook__intro en">Every rule you've learned, ready to read again.</p>
      <ol className="notebook__list stagger">
        {open.flatMap(({ u, i }) =>
          [
            u.lessonId,
            ...(u.midLessons ?? [])
              .filter((m) => midLessonStatus(activeChild, u, m, unlockAll) !== 'locked')
              .map((m) => m.lessonId),
          ].map((id) => ({ u, i, id })),
        ).map(({ u, i, id }) => {
          const lesson = lessonById[id];
          if (!lesson) return null;
          return (
            <li key={id}>
              <Link
                className="notebook__item"
                to={`/lesson/${lesson.id}`}
                state={{ from: 'notebook' }}
                style={{ '--unit-accent': u.accent } as React.CSSProperties}
              >
                <span className="notebook__emoji" aria-hidden="true">
                  <Art glyph={lesson.emoji} />
                </span>
                <span className="notebook__label">
                  <span className="notebook__unit en">Unit {i + 1}</span>
                  <span className="notebook__title">
                    {lesson.titleFi} <span className="en">{lesson.titleEn}</span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      {locked > 0 && (
        <p className="notebook__locked en">
          <Art glyph="🔒" /> {locked} more {locked === 1 ? 'lesson unlocks' : 'lessons unlock'} as you go.
        </p>
      )}
      {shelf.length === 0 && (
        <p className="notebook__locked en"><Art glyph="📚" /> Every story you finish goes on a bookshelf here, to read again whenever you like.</p>
      )}

    </section>
  );
}

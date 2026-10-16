import { Link } from 'react-router-dom';
import { lessonById } from '../content/lessons';
import { stories, storyById, type Story } from '../content/stories';
import { UNITS, midLessonStatus, unitStatus } from '../game/course';
import { storyReadWell } from '../game/storyLog';
import { useProfile } from '../state/profile';
import Art from '../art/Art';

/** Every story in the order the course meets it (then any the course doesn't). */
function storiesInCourseOrder(): Story[] {
  const ids = UNITS.flatMap((u) => u.skills.filter((s) => s.activity === 'story').flatMap((s) => s.content.ids ?? []));
  const ordered = [...new Set(ids)].map((id) => storyById[id]).filter(Boolean);
  return [...ordered, ...stories.filter((s) => !ordered.includes(s))];
}

// The Notebook (Vihko): the bookshelf — every story she has finished, to read
// again just for fun — and every lesson from the units she has opened, to
// re-read any time ("how did -ssa work again?"). Locked units' lessons stay
// hidden so the course keeps its order.
export default function Notebook() {
  const { activeChild, settings } = useProfile();
  const unlockAll = !!settings.unlockAll;
  const open = UNITS.map((u, i) => ({ u, i })).filter(
    ({ u }) => unitStatus(activeChild, u, unlockAll) !== 'locked',
  );
  const locked = UNITS.length - open.length;
  const shelf = storiesInCourseOrder().filter((s) => storyReadWell(activeChild, s.id));

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
          <h2 className="notebook__shelf-title">
            <Art glyph="📖" /> Oppitunnit <span className="en">Lessons</span>
          </h2>
        </>
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

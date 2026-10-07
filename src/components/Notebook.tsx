import { Link } from 'react-router-dom';
import { lessonById } from '../content/lessons';
import { UNITS, unitStatus } from '../game/course';
import { useProfile } from '../state/profile';

// The Notebook (Vihko): every lesson from the units the child has opened, to
// re-read any time ("how did -ssa work again?"). Locked units' lessons stay
// hidden so the course keeps its order.
export default function Notebook() {
  const { activeChild, settings } = useProfile();
  const unlockAll = !!settings.unlockAll;
  const open = UNITS.map((u, i) => ({ u, i })).filter(
    ({ u }) => unitStatus(activeChild, u, unlockAll) !== 'locked',
  );
  const locked = UNITS.length - open.length;

  return (
    <section className="screen notebook">
      <div className="notebook__head">
        <Link className="icon-btn" to="/" aria-label="Koti · Home">
          ⬅︎
        </Link>
        <h1 className="title">
          📓 Vihko <span className="en">Notebook</span>
        </h1>
      </div>
      <p className="notebook__intro en">Every rule you've learned, ready to read again.</p>
      <ol className="notebook__list">
        {open.map(({ u, i }) => {
          const lesson = lessonById[u.lessonId];
          if (!lesson) return null;
          return (
            <li key={u.id}>
              <Link
                className="notebook__item"
                to={`/lesson/${lesson.id}`}
                state={{ from: 'notebook' }}
                style={{ '--accent': u.accent } as React.CSSProperties}
              >
                <span className="notebook__emoji" aria-hidden="true">
                  {lesson.emoji}
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
          🔒 {locked} more {locked === 1 ? 'lesson unlocks' : 'lessons unlock'} as you go.
        </p>
      )}
    </section>
  );
}

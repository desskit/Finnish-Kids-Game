import { Link } from 'react-router-dom';
import { BADGES, BADGE_CATEGORIES, badgeById, badgeProgress } from '../game/badges';
import { badgeEnv } from '../game/path';
import { MATH_FACES, facesWon, isMathFace, ownAnimal } from '../game/faces';
import { useProfile } from '../state/profile';
import Art from '../art/Art';
import Avatar, { avatarName } from '../art/Avatar';

// Saavutukset (Achievements): every badge, what EXACTLY earns it, and how far
// along the child is ("7 / 10 words") — so a goal is something to aim at, not a
// surprise. Grouped by kind; earned ones first within each group.
export default function Achievements() {
  const { activeChild } = useProfile();
  const rows = BADGES.map((b) => {
    const p = activeChild ? badgeProgress(activeChild, badgeEnv, b) : { have: 0, need: 1, unit: '' };
    return { b, p, earned: p.have >= p.need };
  });
  const earnedCount = rows.filter((r) => r.earned).length;

  return (
    <section className="screen achievements">
      <div className="notebook__head">
        <Link className="icon-btn" to="/" aria-label="Koti · Home">
          <Art glyph="⬅︎" />
        </Link>
        <h1 className="title">
          <Art glyph="🏅" /> Saavutukset <span className="en">Achievements</span>
        </h1>
      </div>
      <p className="notebook__intro en">
        {earnedCount} of {BADGES.length} earned. Each one says exactly what to do.
      </p>

      {BADGE_CATEGORIES.map((cat) => {
        const inCat = rows.filter((r) => r.b.category === cat.id);
        if (inCat.length === 0) return null;
        const sorted = [...inCat.filter((r) => r.earned), ...inCat.filter((r) => !r.earned)];
        return (
          <div key={cat.id} className="achievements__group">
            <h2 className="achievements__heading">
              {cat.titleFi} <span className="en">{cat.titleEn}</span>
            </h2>
            <ul className="achievements__list stagger">
              {sorted.map(({ b, p, earned }) => (
                <li
                  key={b.id}
                  className={'achievement' + (earned ? ' achievement--earned' : '')}
                  aria-label={`${b.titleEn}: ${earned ? 'earned' : `${p.have} of ${p.need} ${p.unit}`}`}
                >
                  <span className="achievement__emoji" aria-hidden="true">
                    <Art glyph={b.emoji} />
                  </span>
                  <span className="achievement__body">
                    <span className="achievement__title">
                      {b.titleFi} <span className="en">{b.titleEn}</span>
                    </span>
                    <span className="achievement__hint en">{b.hintEn}</span>
                    {earned ? (
                      <span className="achievement__done">✓ Ansaittu · Earned</span>
                    ) : (
                      <span className="achievement__progress">
                        <span className="achievement__bar" aria-hidden="true">
                          <span style={{ width: `${Math.round((100 * p.have) / Math.max(1, p.need))}%` }} />
                        </span>
                        <span className="achievement__count en">
                          {p.have} / {p.need} {p.unit}
                        </span>
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {cat.id === 'math' && <Faces />}
          </div>
        );
      })}
    </section>
  );
}

/** The faces won in math: put one on, or go back to your own animal. */
function Faces() {
  const { activeChild, wearFace } = useProfile();
  if (!activeChild) return null;
  const won = new Set(facesWon(activeChild, badgeEnv).map((f) => f.glyph));
  const animal = ownAnimal(activeChild);
  const wearingFace = isMathFace(activeChild.avatar);
  return (
    <div className="faces">
      <h3 className="faces__heading">
        Kokeile! <span className="en">Faces to wear, won in math</span>
      </h3>
      <ul className="faces__list">
        {wearingFace && animal && (
          <li>
            <button className="face" onClick={() => wearFace(animal)}>
              <Avatar glyph={animal} still className="face__head" />
              <span className="face__label en">Back to the {avatarName(animal)}</span>
            </button>
          </li>
        )}
        {MATH_FACES.map((f) => {
          const open = won.has(f.glyph);
          const on = activeChild.avatar === f.glyph;
          return (
            <li key={f.glyph}>
              <button
                className={'face' + (on ? ' face--on' : '') + (open ? '' : ' face--locked')}
                onClick={() => wearFace(f.glyph)}
                disabled={!open || on}
                aria-pressed={open ? on : undefined}
              >
                <Avatar glyph={f.glyph} still className="face__head" />
                <span className="face__label en">
                  {on ? 'You’re wearing it!' : open ? `Wear the ${f.name}` : `Win “${badgeById(f.badgeId)?.titleEn}”`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

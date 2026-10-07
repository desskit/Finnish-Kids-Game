import { Link } from 'react-router-dom';
import { BADGES, BADGE_CATEGORIES, badgeProgress } from '../game/badges';
import { badgeEnv } from '../game/path';
import { useProfile } from '../state/profile';

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
          ⬅︎
        </Link>
        <h1 className="title">
          🏅 Saavutukset <span className="en">Achievements</span>
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
            <ul className="achievements__list">
              {sorted.map(({ b, p, earned }) => (
                <li
                  key={b.id}
                  className={'achievement' + (earned ? ' achievement--earned' : '')}
                  aria-label={`${b.titleEn}: ${earned ? 'earned' : `${p.have} of ${p.need} ${p.unit}`}`}
                >
                  <span className="achievement__emoji" aria-hidden="true">
                    {b.emoji}
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
          </div>
        );
      })}
    </section>
  );
}

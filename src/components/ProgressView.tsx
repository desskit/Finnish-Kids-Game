import { themes } from '../content';
import { activitiesForTheme } from '../game/activities';
import { useProfile } from '../state/profile';

// Parent dashboard: per child, per topic, per activity — plays, stars and an
// accuracy %, read straight from the progress model the activities record.
export default function ProgressView() {
  const { children } = useProfile();

  if (children.length === 0) {
    return (
      <div className="grownup__panel">
        <p className="muted">Ei vielä pelaajia · No players yet.</p>
      </div>
    );
  }

  return (
    <div className="grownup__panel">
      {children.map((c) => {
        const playedTopics = themes.filter((t) => c.progress[t.id]);
        return (
          <article key={c.id} className="progress-child">
            <h2 className="progress-child__head">
              <span aria-hidden="true">{c.avatar}</span> {c.name}
              <span className="progress-child__stars">⭐ {c.stars}</span>
            </h2>

            {playedTopics.length === 0 ? (
              <p className="muted">Ei vielä pelejä · No rounds played yet.</p>
            ) : (
              playedTopics.map((t) => {
                const tp = c.progress[t.id];
                const played = activitiesForTheme(t).filter((a) => tp[a.id]);
                return (
                  <div key={t.id} className="progress-topic">
                    <h3 className="progress-topic__head">
                      <span aria-hidden="true">{t.emoji}</span> {t.fi}{' '}
                      <span className="en">{t.en}</span>
                    </h3>
                    <ul className="progress-list">
                      {played.map((a) => {
                        const p = tp[a.id];
                        const acc = p.totalPossible
                          ? Math.round((p.totalStars / p.totalPossible) * 100)
                          : 0;
                        return (
                          <li key={a.id} className="progress-row">
                            <span className="progress-row__name">
                              <span aria-hidden="true">{a.emoji}</span> {a.titleEn}
                            </span>
                            <span className="progress-row__stat">
                              ⭐{p.totalStars} · {p.plays}× · {acc}%
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })
            )}
          </article>
        );
      })}
    </div>
  );
}

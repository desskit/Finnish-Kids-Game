import { themes, reviewItems } from '../content';
import { activitiesForTheme } from '../game/activities';
import { useProfile } from '../state/profile';
import { isDue, isMastered } from '../game/srs';

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

        // Vocabulary review (SRS) summary across all topics.
        const now = Date.now();
        const schedules = Object.values(c.srs ?? {});
        const practiced = schedules.length;
        const mastered = schedules.filter(isMastered).length;
        const due = reviewItems.filter((i) => c.srs?.[i.id] && isDue(c.srs[i.id], now)).length;
        const totSeen = schedules.reduce((n, s) => n + s.seen, 0);
        const totCorrect = schedules.reduce((n, s) => n + s.correct, 0);
        const accuracy = totSeen ? Math.round((totCorrect / totSeen) * 100) : 0;

        return (
          <article key={c.id} className="progress-child">
            <h2 className="progress-child__head">
              <span aria-hidden="true">{c.avatar}</span> {c.name}
              <span className="progress-child__stars">⭐ {c.stars}</span>
            </h2>

            <div className="progress-review">
              <span className="progress-review__stat">
                📚 {practiced}/{reviewItems.length} <span className="en">words practiced</span>
              </span>
              <span className="progress-review__stat">
                🏆 {mastered} <span className="en">mastered</span>
              </span>
              <span className="progress-review__stat">
                🔁 {due} <span className="en">due</span>
              </span>
              <span className="progress-review__stat">
                🎯 {accuracy}% <span className="en">first-try</span>
              </span>
            </div>

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

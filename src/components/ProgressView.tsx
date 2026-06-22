import { reviewItems } from '../content';
import { useProfile } from '../state/profile';
import { isDue, isMastered } from '../game/srs';
import { windowAccuracy } from '../game/adapt';
import { BADGES, earnedBadgeIds } from '../game/badges';
import { PATH, badgeEnv } from '../game/path';

// Parent dashboard: per child, per chapter, per skill — adaptive level, stars,
// plays and accuracy, read straight from the progress model the skills record,
// plus the cross-topic spaced-repetition (vocabulary) summary and badges.
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
        // Vocabulary review (SRS) summary across everything.
        const now = Date.now();
        const schedules = Object.values(c.srs ?? {});
        const practiced = schedules.length;
        const mastered = schedules.filter(isMastered).length;
        const due = reviewItems.filter((i) => c.srs?.[i.id] && isDue(c.srs[i.id], now)).length;
        const totSeen = schedules.reduce((n, s) => n + s.seen, 0);
        const totCorrect = schedules.reduce((n, s) => n + s.correct, 0);
        const accuracy = totSeen ? Math.round((totCorrect / totSeen) * 100) : 0;

        const earned = earnedBadgeIds(c, badgeEnv);
        const mode = c.adaptive === false ? `Manual (level ${c.level})` : 'Auto (adaptive)';

        const playedChapters = PATH.map((chapter) => ({
          chapter,
          skills: chapter.skills.filter((s) => c.progress?.[chapter.id]?.[s.id]),
        })).filter((x) => x.skills.length > 0);

        return (
          <article key={c.id} className="progress-child">
            <h2 className="progress-child__head">
              <span aria-hidden="true">{c.avatar}</span> {c.name}
              <span className="progress-child__stars">⭐ {c.stars}</span>
            </h2>

            <p className="progress-mode muted">Vaikeustaso · Difficulty: {mode}</p>

            <div className="progress-badges" aria-label="Badges earned">
              {BADGES.map((b) => (
                <span
                  key={b.id}
                  className={'badge badge--sm' + (earned.has(b.id) ? '' : ' badge--locked')}
                  title={`${b.titleEn}: ${b.hintEn}`}
                >
                  {b.emoji}
                </span>
              ))}
              <span className="progress-badges__count">
                {earned.size}/{BADGES.length}
              </span>
            </div>

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

            {playedChapters.length === 0 ? (
              <p className="muted">Ei vielä pelejä · No rounds played yet.</p>
            ) : (
              playedChapters.map(({ chapter, skills }) => (
                <div key={chapter.id} className="progress-topic">
                  <h3 className="progress-topic__head">
                    <span aria-hidden="true">{chapter.icon}</span> {chapter.titleFi}{' '}
                    <span className="en">{chapter.titleEn}</span>
                  </h3>
                  <ul className="progress-list">
                    {skills.map((skill) => {
                      const p = c.progress[chapter.id][skill.id];
                      const acc = p.totalPossible
                        ? Math.round((p.totalStars / p.totalPossible) * 100)
                        : 0;
                      const lvl = p.level ?? 1;
                      const recent = p.recent ?? [];
                      const recentPct = Math.round(windowAccuracy(recent) * 100);
                      return (
                        <li key={skill.id} className="progress-row">
                          <span className="progress-row__name">
                            <span className="progress-row__level" title="Adaptive level">
                              Lv {lvl}
                            </span>{' '}
                            <span aria-hidden="true">{skill.icon}</span> {skill.titleEn}
                          </span>
                          <span
                            className="progress-row__stat"
                            title="stars · rounds · all-time accuracy · recent-window accuracy"
                          >
                            ⭐{p.totalStars} · {p.plays}× · {acc}%
                            {recent.length > 0 && ` · ${recentPct}%↻`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </article>
        );
      })}
    </div>
  );
}

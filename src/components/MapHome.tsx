import { Link } from 'react-router-dom';
import { reviewItems } from '../content';
import { useProfile } from '../state/profile';
import { isSpeechAvailable } from '../audio/speak';
import { isDue } from '../game/srs';
import { BADGES, earnedBadgeIds } from '../game/badges';
import { PATH, badgeEnv, nextSkillId } from '../game/path';

const ROUND_QUESTIONS = 6;

// Map home — a winding journey path of chapters (colored bands) and skill nodes.
// Organized by usable Finnish, not vocab categories. Open & guided: every node
// is tappable, with a pulsing "next" suggestion and a progress ring per node.
// Data-driven and art-ready: nodes/chapters carry optional art + accent colors,
// so dropping in illustrations later is a data/CSS change, not a rewrite.
export default function MapHome() {
  const { name, level, setLevel, adaptive, setAdaptive, activeChild } = useProfile();

  const srs = activeChild?.srs ?? {};
  const now = Date.now();
  const dueCount = reviewItems.filter((i) => srs[i.id] && isDue(srs[i.id], now)).length;
  const seenCount = reviewItems.filter((i) => srs[i.id]).length;

  const earned = activeChild ? earnedBadgeIds(activeChild, badgeEnv) : new Set<string>();
  const nextId = nextSkillId(activeChild);

  return (
    <section className="screen map-home">
      <h1 className="greeting">
        Hei{name ? `, ${name}` : ''}! <span className="en">Your Finnish path</span>
      </h1>

      <div className="level-toggle" role="group" aria-label="Difficulty">
        <span className="level-label">Taso · Level:</span>
        <button
          className={'chip' + (adaptive ? ' chip--on' : '')}
          onClick={() => setAdaptive(true)}
          title="Difficulty adjusts to how you're doing"
        >
          Automaatti <span className="en">Auto</span>
        </button>
        <button
          className={'chip' + (!adaptive && level === 1 ? ' chip--on' : '')}
          onClick={() => setLevel(1)}
        >
          Helppo <span className="en">Easy</span>
        </button>
        <button
          className={'chip' + (!adaptive && level === 2 ? ' chip--on' : '')}
          onClick={() => setLevel(2)}
        >
          Vaikea <span className="en">Hard</span>
        </button>
      </div>

      <div className="badge-strip" aria-label="Badges">
        {BADGES.map((b) => {
          const has = earned.has(b.id);
          return (
            <span
              key={b.id}
              className={'badge' + (has ? '' : ' badge--locked')}
              title={has ? `${b.titleEn} — earned` : `${b.titleEn}: ${b.hintEn}`}
            >
              {b.emoji}
            </span>
          );
        })}
      </div>

      <ol className="path">
        {PATH.map((chapter) => (
          <li
            key={chapter.id}
            className="chapter"
            style={{ '--accent': chapter.accent } as React.CSSProperties}
          >
            <div className="chapter__banner">
              <span className="chapter__icon" aria-hidden="true">
                {chapter.icon}
              </span>
              <span className="chapter__title">
                {chapter.titleFi} <span className="en">{chapter.titleEn}</span>
              </span>
            </div>

            {chapter.comingSoon && chapter.skills.length === 0 ? (
              <div className="map-node map-node--soon" aria-disabled="true">
                <span className="map-node__ring">
                  <span className="map-node__icon" aria-hidden="true">
                    ✨
                  </span>
                </span>
                <span className="map-node__label">
                  <span className="map-node__title">
                    Tulossa lisää <span className="en">More coming soon</span>
                  </span>
                  <span className="map-node__meta">Vaikeat lauseet · Full sentences</span>
                </span>
              </div>
            ) : (
              <div className="chapter__nodes">
                {chapter.skills.map((skill, si) => {
                  const to = skill.activity === 'review' ? '/review' : `/skill/${skill.id}`;
                  const prog = activeChild?.progress?.[chapter.id]?.[skill.id];
                  const best = prog?.bestStars ?? 0;
                  const plays = prog?.plays ?? 0;
                  const lvl = prog?.level ?? 1;
                  const isNext = skill.id === nextId;
                  const ringPct = Math.min(100, Math.round((best / ROUND_QUESTIONS) * 100));
                  const meta =
                    skill.activity === 'review'
                      ? seenCount === 0
                        ? 'Aloita tästä · Start'
                        : dueCount > 0
                          ? `${dueCount} kerrattavaa · due`
                          : 'Harjoittele · Practice'
                      : skill.exampleFi;
                  const cls =
                    'map-node map-node--' +
                    (si % 2 ? 'right' : 'left') +
                    (plays > 0 ? ' map-node--done' : '') +
                    (isNext ? ' map-node--next' : '');
                  return (
                    <Link
                      key={skill.id}
                      to={to}
                      className={cls}
                      style={{ '--ring': `${ringPct}%` } as React.CSSProperties}
                    >
                      <span className="map-node__ring">
                        <span className="map-node__icon" aria-hidden="true">
                          {skill.icon}
                        </span>
                        {plays > 0 && (
                          <span className="map-node__check" aria-hidden="true">
                            ✓
                          </span>
                        )}
                      </span>
                      <span className="map-node__label">
                        <span className="map-node__title">
                          {skill.titleFi} <span className="en">{skill.titleEn}</span>
                        </span>
                        {lvl > 1 && <span className="map-node__level">Taso {lvl}</span>}
                        {meta && <span className="map-node__meta">{meta}</span>}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </li>
        ))}
      </ol>

      {!isSpeechAvailable() && (
        <p className="audio-note">
          🔇 Audio isn't available in this browser. Words still show as pictures.
        </p>
      )}

      <p className="data-credit">
        Finnish word data from Wiktionary &amp; Tatoeba · CC BY-SA 4.0
      </p>
    </section>
  );
}

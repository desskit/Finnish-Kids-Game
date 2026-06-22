import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { themes } from '../content';
import { activitiesForTheme } from '../game/activities';

// Topic hub (unit page) — the topic's supported activities as cards, rendered
// from the activity registry rather than hardcoded. Each card opens the
// activity; back returns to the map.
export default function TopicHub() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const theme = themes.find((t) => t.id === topicId);
  if (!theme) return <Navigate to="/" replace />;

  const activities = activitiesForTheme(theme);

  return (
    <section className="screen topic-hub">
      <div className="topic-hub__head">
        <button
          className="icon-btn"
          onClick={() => navigate('/')}
          aria-label="Back to map"
        >
          ⬅︎
        </button>
        <h1 className="topic-hub__title">
          {theme.fi} <span className="en">{theme.en}</span>
        </h1>
        <span className="topic-hub__emoji" aria-hidden="true">
          {theme.emoji}
        </span>
      </div>

      <div className="activity-grid">
        {activities.map((a) => (
          <Link
            key={a.id}
            className="activity-tile"
            to={`/topic/${theme.id}/${a.id}`}
          >
            <span className="activity-tile__emoji" aria-hidden="true">
              {a.emoji}
            </span>
            <span className="activity-tile__title">
              {a.titleFi} <span className="en">{a.titleEn}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

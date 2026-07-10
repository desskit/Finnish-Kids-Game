interface Props {
  title: string;
  index: number;
  total: number;
  /**
   * Session mode: the sitting's running star count. When set, the header shows
   * a cumulative ⭐ counter instead of the per-segment question dots — the
   * endless stream has no visible round to count down. Review and standalone
   * renders omit it and keep the dots.
   */
  stars?: number;
  /** Go back to the map. Omitted (e.g. an embedded audit game) renders no back
   *  button — an activity only offers "back" when there's somewhere to go. */
  onExit?: () => void;
}

/** Shared top bar for an activity: home button + progress dots / star count. */
export default function ActivityHeader({ title, index, total, stars, onExit }: Props) {
  return (
    <header className="activity-header">
      {onExit ? (
        <button className="icon-btn" onClick={onExit} aria-label="Back to the map">
          ⬅︎
        </button>
      ) : (
        <span className="icon-btn icon-btn--placeholder" aria-hidden="true" />
      )}
      <h2 className="activity-title">{title}</h2>
      {stars === undefined ? (
        <div className="progress-dots" aria-label={`Question ${index + 1} of ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={
                'dot' + (i < index ? ' dot--done' : i === index ? ' dot--current' : '')
              }
            />
          ))}
        </div>
      ) : (
        <div className="session-stars" aria-label={`${stars} tähteä`}>
          ⭐ {stars}
        </div>
      )}
    </header>
  );
}

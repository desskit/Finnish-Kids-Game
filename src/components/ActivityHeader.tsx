interface Props {
  title: string;
  index: number;
  total: number;
  onExit: () => void;
}

/** Shared top bar for an activity: home button + progress dots. */
export default function ActivityHeader({ title, index, total, onExit }: Props) {
  return (
    <header className="activity-header">
      <button className="icon-btn" onClick={onExit} aria-label="Back to home">
        ⬅︎
      </button>
      <h2 className="activity-title">{title}</h2>
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
    </header>
  );
}

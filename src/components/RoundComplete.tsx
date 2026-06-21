interface Props {
  stars: number;
  total: number;
  onAgain: () => void;
  onHome: () => void;
}

export default function RoundComplete({ stars, total, onAgain, onHome }: Props) {
  const allCorrect = stars === total;
  return (
    <section className="screen complete">
      <div className="mascot mascot--big" aria-hidden="true">
        {allCorrect ? '🦊🎉' : '🦊'}
      </div>
      <h2 className="title">
        Hienoa! <span className="en">Great job!</span>
      </h2>
      <p className="score" aria-label={`${stars} of ${total} stars`}>
        {'⭐'.repeat(stars)}
        {'·'.repeat(Math.max(0, total - stars))}
      </p>
      <p className="score-count">
        {stars} / {total}
      </p>
      <div className="button-row">
        <button className="btn btn--primary" onClick={onAgain} autoFocus>
          Uudestaan <span className="en">Again</span>
        </button>
        <button className="btn" onClick={onHome}>
          Koti <span className="en">Home</span>
        </button>
      </div>
    </section>
  );
}

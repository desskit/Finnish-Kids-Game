interface Props {
  stars: number;
  total: number;
  onAgain: () => void;
  onHome: () => void;
}

// End-of-round celebration — used only by Review now. A Review round is a
// finite "items due today" set, so its boundary is semantically real; skill
// nodes play as one unbroken stream instead (see SkillRoute) and never show
// this screen. "Jatka" re-selects what's due and starts a fresh round.
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
          Jatka <span className="en">Keep going</span>
        </button>
        <button className="btn" onClick={onHome}>
          Koti <span className="en">Home</span>
        </button>
      </div>
    </section>
  );
}

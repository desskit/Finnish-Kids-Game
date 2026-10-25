import type { CSSProperties } from 'react';
import type { LexicalItem } from '../content/types';
import Art from '../art/Art';
import LearnedWords from './LearnedWords';

/** Confetti pieces: where each starts, how far it drifts and turns, when it falls. */
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37 + 7) % 100}%`,
  '--dx': `${((i * 53) % 90) - 45}px`,
  '--turn': `${((i * 97) % 600) - 300}deg`,
  animationDelay: `${(i % 6) * 70}ms`,
})) as CSSProperties[];

interface Props {
  stars: number;
  total: number;
  onAgain: () => void;
  /** Go back to the map. Omitted (e.g. in the audit harness) hides the button
   *  so the round can't navigate out of an embedding context. */
  onHome?: () => void;
  /** The words the round practiced: they, not the stars, are the headline. */
  words?: LexicalItem[];
}

// End-of-round celebration — used only by Review now. A Review round is a
// finite "items due today" set, so its boundary is semantically real; skill
// nodes play as one unbroken stream instead (see SkillRoute) and never show
// this screen. "Jatka" re-selects what's due and starts a fresh round. What
// was practiced leads (the words, as pictures); the stars are a small line.
export default function RoundComplete({ stars, total, onAgain, onHome, words }: Props) {
  const allCorrect = stars === total;

  return (
    <section className="screen complete">
      <div className="confetti" aria-hidden="true">
        {CONFETTI.map((style, i) => (
          <span key={i} style={style} />
        ))}
      </div>
      <div className="mascot mascot--big" aria-hidden="true">
        {/* a perfect round: the fox jumps for joy */}
        {allCorrect ? <Art id="mascot-cheer" motion="loop" /> : <Art glyph="🦊" motion="loop" />}
      </div>
      <h2 className="title">
        Hienoa! <span className="en">Great job!</span>
      </h2>
      {words && words.length > 0 && <LearnedWords words={words} />}
      <p className="score-count score-count--quiet" aria-label={`${stars} of ${total} stars`}>
        <Art glyph="⭐" /> {stars} / {total}
      </p>

      <div className="button-row">
        <button className="btn btn--primary" onClick={onAgain} autoFocus>
          Jatka <span className="en">Keep going</span>
        </button>
        {onHome && (
          <button className="btn" onClick={onHome}>
            Koti <span className="en">Home</span>
          </button>
        )}
      </div>
    </section>
  );
}

import '../../styles/math.css';

// How many, as a picture: dots in ten-frames (two rows of five), never a
// digit. A sum shows its two parts in two colours; a difference shows the
// whole with the part taken away crossed out. Up to twenty fits in two frames.

interface Props {
  /** The amounts, in order: one colour each (a second group is highlighted). */
  groups: number[];
  /** Take the LAST group away from the first: its dots are crossed out. */
  takeAway?: boolean;
  /** Smaller dots, for a tip or a pan of the scale. */
  small?: boolean;
  className?: string;
}

/** One dot's look: which group it belongs to, or taken away. */
type Dot = 'a' | 'b' | 'out';

export default function Quantity({ groups, takeAway = false, small = false, className }: Props) {
  const dots: Dot[] = [];
  if (takeAway) {
    const [whole = 0, away = 0] = groups;
    for (let i = 0; i < whole; i++) dots.push(i >= whole - away ? 'out' : 'a');
  } else {
    groups.forEach((n, g) => {
      for (let i = 0; i < n; i++) dots.push(g === 0 ? 'a' : 'b');
    });
  }
  // ten-frames: as many as the dots need (an empty frame for nolla)
  const frames = Math.max(1, Math.ceil(dots.length / 10));
  return (
    <span className={'quantity' + (small ? ' quantity--small' : '') + (className ? ` ${className}` : '')} aria-hidden="true">
      {Array.from({ length: frames }, (_, f) => (
        <span key={f} className="quantity__frame">
          {Array.from({ length: 10 }, (_, i) => {
            const d = dots[f * 10 + i];
            return <span key={i} className={'quantity__cell' + (d ? ` quantity__dot quantity__dot--${d}` : '')} />;
          })}
        </span>
      ))}
    </span>
  );
}

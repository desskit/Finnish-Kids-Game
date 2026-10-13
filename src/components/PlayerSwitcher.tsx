import type { Child } from '../state/storage';
import Avatar from '../art/Avatar';

// The grown-up tabs' "show this player" switcher (shown only with 2+ players).
export default function PlayerSwitcher({
  players,
  shownId,
  onPick,
  label,
}: {
  players: Child[];
  shownId: string;
  onPick: (id: string) => void;
  label: string;
}) {
  if (players.length < 2) return null;
  return (
    <div className="gswitch" role="tablist" aria-label={label}>
      {players.map((c) => (
        <button
          key={c.id}
          role="tab"
          aria-selected={c.id === shownId}
          className={'gswitch__btn' + (c.id === shownId ? ' gswitch__btn--on' : '')}
          onClick={() => onPick(c.id)}
        >
          <span aria-hidden="true"><Avatar glyph={c.avatar} still /></span> {c.name}
        </button>
      ))}
    </div>
  );
}

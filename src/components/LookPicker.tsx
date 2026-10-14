import { useId } from 'react';
import Scenery from '../art/Scenery';
import { THEMES, type ThemeId } from '../theme/theme';

// The three looks as big cards to tap: each shows the look's scenery, in a
// card in its own colors (data-look), and its name. The screen shows a picked
// look at once.
export default function LookPicker({
  value,
  onPick,
}: {
  /** The look picked so far (none: the player follows the device). */
  value: ThemeId | undefined;
  onPick: (look: ThemeId) => void;
}) {
  const labelId = useId();
  return (
    <div className="look-picker">
      <p className="look-picker__label" id={labelId}>
        Väri <span className="en">Colors</span>
      </p>
      <div className="look-picker__cards" role="group" aria-labelledby={labelId}>
        {THEMES.map((t) => (
          <button
            type="button"
            key={t.id}
            data-look={t.id}
            className={'look-card' + (value === t.id ? ' look-card--on' : '')}
            aria-pressed={value === t.id}
            onClick={() => onPick(t.id)}
          >
            <span className="look-card__sky" aria-hidden="true">
              <Scenery look={t.id} still />
            </span>
            <span className="look-card__name">
              {t.fi} <span className="en">{t.en}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

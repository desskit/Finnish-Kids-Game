import { useState } from 'react';
import type { Child } from '../state/storage';
import { UNITS, openerStoryId } from '../game/course';
import { currentPlace, placeFromKey, placeKey } from '../game/placement';
import { storyById } from '../content/stories';

// Grown-ups → Players: put a player at an exact place in the course — to
// test, or to carry on after lost data or on a new device (game/placement.ts).
// Everything before the place counts as done; everything after it is cleared.
export default function CoursePlacePicker({ child, onMove }: { child: Child; onMove: (key: string) => void }) {
  const now = placeKey(currentPlace(child));
  const [picked, setPicked] = useState(now);
  const place = placeFromKey(picked);
  const unitNo = place ? UNITS.findIndex((u) => u.id === place.unitId) + 1 : 0;

  return (
    <div className="gplace" role="group" aria-label={`Place in the course for ${child.name}`}>
      <span className="glook__label">Place in the course</span>
      <select className="gplace__select" value={picked} onChange={(e) => setPicked(e.target.value)} aria-label="Unit and step">
        {UNITS.map((u, i) => {
          const story = openerStoryId(u);
          return (
            <optgroup key={u.id} label={`Unit ${i + 1}: ${u.titleEn}`}>
              {story && (
                <option value={placeKey({ unitId: u.id, target: { kind: 'start' } })}>
                  {i + 1} · Start: the story “{storyById[story]?.titleEn ?? u.titleEn}”
                </option>
              )}
              {u.skills.map((s) => (
                <option key={s.id} value={placeKey({ unitId: u.id, target: { kind: 'step', stepId: s.id } })}>
                  {i + 1} · {s.titleEn}
                  {s.optional ? ' (bonus)' : ''}
                </option>
              ))}
              {u.checkpoint !== false && (
                <option value={placeKey({ unitId: u.id, target: { kind: 'checkpoint' } })}>{i + 1} · Checkpoint</option>
              )}
            </optgroup>
          );
        })}
      </select>
      <button
        className="gbtn"
        disabled={picked === now || !place}
        onClick={() => {
          if (
            window.confirm(
              `Move ${child.name} to unit ${unitNo}? Everything before it will count as done, and progress after it will be cleared. Words, stars and badges stay.`,
            )
          ) {
            onMove(picked);
          }
        }}
      >
        Move
      </button>
    </div>
  );
}

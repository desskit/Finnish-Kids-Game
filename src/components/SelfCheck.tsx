import { useState } from 'react';
import type { SelfCheckAnswer } from '../state/storage';
import { useProfile } from '../state/profile';
import { childQuestion, unitClaimFor } from '../game/cando';
import { useLearner } from '../game/useLearner';
import ReadAloud from './ReadAloud';
import Art from '../art/Art';

const ANSWERS: { id: SelfCheckAnswer; glyph: string; en: string }[] = [
  { id: 'yes', glyph: '😄', en: 'Yes!' },
  { id: 'bit', glyph: '🤔', en: 'A bit' },
  { id: 'not-yet', glyph: '😟', en: 'Not yet' },
];

// The child's own check after a passed checkpoint: the unit's can-do, asked of
// them ("Can you say who has what…?"), with three faces. Optional, never
// scored; the grown-up sees the answer beside what was measured (ProgressView).
export default function SelfCheck({ unitId }: { unitId: string }) {
  const { recordSelfCheck } = useProfile();
  const { readAloud } = useLearner();
  const [picked, setPicked] = useState<SelfCheckAnswer | null>(null);
  const claim = unitClaimFor(unitId);
  if (!claim) return null;
  const question = childQuestion(claim);
  return (
    <section className="self-check" aria-label="Your own check">
      <p className="self-check__q en">
        <Art glyph={claim.emoji} /> {question}
      </p>
      <ReadAloud text={question} auto={readAloud} />
      {picked ? (
        <p className="self-check__thanks en" role="status">
          <Art glyph={ANSWERS.find((a) => a.id === picked)!.glyph} /> Thanks for telling!
        </p>
      ) : (
        <div className="self-check__answers">
          {ANSWERS.map((a) => (
            <button
              key={a.id}
              type="button"
              className="btn self-check__btn"
              onClick={() => {
                setPicked(a.id);
                recordSelfCheck(unitId, a.id);
              }}
            >
              <Art glyph={a.glyph} /> <span className="en">{a.en}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

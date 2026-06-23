import { useEffect, useRef, useState } from 'react';
import { useActivityContext, type RoundOutcome } from '../game/activityContext';
import { useProfile } from '../state/profile';

interface Props {
  stars: number;
  total: number;
  onAgain: () => void;
  onHome: () => void;
}

/** Seconds the auto-advance countdown shows before rolling into a fresh round. */
const AUTO_ADVANCE_SECONDS = 3;

export default function RoundComplete({ stars, total, onAgain, onHome }: Props) {
  const allCorrect = stars === total;

  // Record this finished round once (a fresh RoundComplete mounts per round, so
  // "Again" records again; the ref guards StrictMode's double-mount in dev).
  // The outcome (level-up, new badges) drives the celebration below.
  const activity = useActivityContext();
  const { settings } = useProfile();
  const recorded = useRef(false);
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null);
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    const result = activity?.onRoundComplete(stars, total);
    if (result) setOutcome(result);
  }, [activity, stars, total]);

  // Continuous practice: the child stays in fresh rounds of the same skill until
  // they choose Home. When there's no reward to admire (no level-up, no new
  // badge) and motion isn't reduced, count down to the next round automatically;
  // any tap (Jatka/Koti) cancels it. A reward showing waits for an explicit tap
  // so the celebration is never skipped.
  const hasReward = !!outcome && (outcome.leveledUp || outcome.newBadges.length > 0);
  const autoAdvance = outcome !== null && !hasReward && !settings.reducedMotion;
  const [secondsLeft, setSecondsLeft] = useState(AUTO_ADVANCE_SECONDS);
  useEffect(() => {
    if (!autoAdvance) return;
    setSecondsLeft(AUTO_ADVANCE_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [autoAdvance]);
  useEffect(() => {
    if (autoAdvance && secondsLeft <= 0) onAgain();
  }, [autoAdvance, secondsLeft, onAgain]);

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

      {outcome?.leveledUp && (
        <p className="level-up" role="status">
          🚀 Uusi taso {outcome.level}! <span className="en">Level up!</span>
        </p>
      )}

      {outcome && outcome.newBadges.length > 0 && (
        <div className="new-badges" role="status">
          <p className="new-badges__title">
            Uusi mitali! <span className="en">New badge!</span>
          </p>
          <ul className="new-badges__list">
            {outcome.newBadges.map((b) => (
              <li key={b.id} className="new-badge">
                <span className="new-badge__emoji" aria-hidden="true">
                  {b.emoji}
                </span>
                <span className="new-badge__label">
                  {b.titleFi} <span className="en">{b.titleEn}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {autoAdvance && (
        <p className="auto-advance" role="status">
          Kierros jatkuu… <span className="en">Continuing…</span> ({secondsLeft})
        </p>
      )}

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

import { useEffect } from 'react';
import type { RoundOutcome } from '../game/activityContext';

interface Props {
  outcome: RoundOutcome;
  onDismiss: () => void;
}

/** How long the toast stays up before it slips away. */
const TOAST_MS = 4000;

// The quiet reward: play never stops, so a level-up or a fresh badge slides in
// as a small self-dismissing pill over the header instead of a full-screen
// celebration. `role="status"` announces it politely; pointer-events stay off
// so it can't block a tap on the game underneath.
export default function RewardToast({ outcome, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, TOAST_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="reward-toast" role="status">
      {outcome.leveledUp && (
        <p className="reward-toast__line">
          🚀 Uusi taso {outcome.level}! <span className="en">Level up!</span>
        </p>
      )}
      {outcome.newBadges.map((b) => (
        <p key={b.id} className="reward-toast__line">
          <span aria-hidden="true">{b.emoji}</span> Uusi mitali! {b.titleFi}{' '}
          <span className="en">{b.titleEn}</span>
        </p>
      ))}
    </div>
  );
}

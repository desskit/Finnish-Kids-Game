import { useEffect, useRef } from 'react';
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
  // The parent (SkillRoute) re-renders on every star earned during continuous
  // play, handing down a NEW `onDismiss` closure each time. The timer must
  // only restart when a genuinely NEW toast mounts (the caller already keys
  // by `toast.id` for that) — not on every unrelated re-render. So the effect
  // depends on nothing (runs once per mount) and reads the latest callback
  // via a ref, instead of depending on `onDismiss` directly.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const t = setTimeout(() => onDismissRef.current(), TOAST_MS);
    return () => clearTimeout(t);
  }, []);

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

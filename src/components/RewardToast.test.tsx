import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useState } from 'react';
import RewardToast from './RewardToast';

// The toast is rendered by SkillRoute alongside a game that re-renders on
// every star earned (continuous play never stops). SkillRoute hands down a
// fresh inline `onDismiss` closure on every one of those re-renders — the
// toast's own auto-dismiss timer must NOT reset just because that identity
// changed, or a level-up toast can get stuck on screen for the rest of the
// session. See the parent-rerender case below for the regression this guards.

const outcome = { leveledUp: true, level: 2, newBadges: [] };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('RewardToast', () => {
  it('dismisses itself after ~4s when nothing else re-renders', () => {
    const onDismiss = vi.fn();
    render(<RewardToast outcome={outcome} onDismiss={onDismiss} />);

    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('still dismisses after ~4s even if the parent keeps re-rendering with a new onDismiss identity', () => {
    // Mirrors SkillRoute: `onDismiss={() => setToast(null)}` is a fresh
    // closure every render, and the parent re-renders on every star earned.
    let dismissed = false;
    function Parent() {
      const [, bump] = useState(0);
      (globalThis as { __bump?: () => void }).__bump = () => bump((n) => n + 1);
      return (
        <RewardToast
          outcome={outcome}
          onDismiss={() => {
            dismissed = true;
          }}
        />
      );
    }
    render(<Parent />);

    // Simulate a star earned roughly every second for 10s — well past the
    // 4s timeout — via re-renders that hand down a brand-new onDismiss each
    // time. The regression: an unstable `onDismiss` in the effect's deps
    // resets the timer on every one of these, so the toast never dismisses.
    for (let i = 0; i < 10; i++) {
      act(() => {
        vi.advanceTimersByTime(1000);
        (globalThis as { __bump?: () => void }).__bump?.();
      });
    }

    expect(dismissed).toBe(true);
  });
});

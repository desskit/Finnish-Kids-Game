import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdventureStop } from '../game/adventure';

interface AdventureContextValue {
  /** Whether a "Today's adventure" run is currently in progress. */
  active: boolean;
  /** "2/3" for a small in-activity indicator; null when not on an adventure. */
  stepLabel: string | null;
  /** The stop after the current one, if any — for a "Next: ___" hint. */
  upNext: AdventureStop | null;
  /** Kick off a fresh run: navigates straight to the first stop. No-op on an empty queue. */
  start: (stops: AdventureStop[]) => void;
  /** Move on: navigates to the next queued stop, or home (and ends the run) if none remain. */
  advance: () => void;
  /** Bail out early without navigating — the caller does its own `navigate('/')`. */
  cancel: () => void;
}

const AdventureContext = createContext<AdventureContextValue | null>(null);

function routeFor(stop: AdventureStop): string {
  return stop.kind === 'review' ? '/review' : `/skill/${stop.skillId}`;
}

// Lives above the route tree (see AppRoutes) so its state survives the
// per-route remounts as the child moves from stop to stop. Free play is
// untouched: `active` only ever becomes true via `start`, which only the
// map's "Today's adventure" entry point calls.
export function AdventureProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [stops, setStops] = useState<AdventureStop[]>([]);
  const [step, setStep] = useState(-1);

  const active = step >= 0 && step < stops.length;

  const value = useMemo<AdventureContextValue>(
    () => ({
      active,
      stepLabel: active ? `${step + 1}/${stops.length}` : null,
      upNext: active && step + 1 < stops.length ? stops[step + 1] : null,
      start: (newStops) => {
        if (newStops.length === 0) return;
        setStops(newStops);
        setStep(0);
        navigate(routeFor(newStops[0]));
      },
      // Reads `step`/`stops` directly rather than via a setState updater —
      // `advance` is recreated every render with the current values, and a
      // state updater must stay a pure function (React may invoke it outside
      // a normal commit), so `navigate` — a side effect — can't safely live
      // inside one.
      advance: () => {
        const next = step + 1;
        if (next >= stops.length) {
          setStep(-1);
          navigate('/');
        } else {
          setStep(next);
          navigate(routeFor(stops[next]));
        }
      },
      cancel: () => setStep(-1),
    }),
    [active, step, stops, navigate],
  );

  return <AdventureContext.Provider value={value}>{children}</AdventureContext.Provider>;
}

export function useAdventure(): AdventureContextValue {
  const ctx = useContext(AdventureContext);
  if (!ctx) throw new Error('useAdventure must be used within AdventureProvider');
  return ctx;
}

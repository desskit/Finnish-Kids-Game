import { createContext, useContext } from 'react';

// Lets the shared RoundComplete screen report a finished round up to the router
// (which knows the topic + activity) without threading a callback through every
// game component. ActivityRoute provides it; RoundComplete consumes it.

export interface ActivityContextValue {
  /** Called once when a round finishes, to record progress for the active child. */
  onRoundComplete: (stars: number, total: number) => void;
}

export const ActivityContext = createContext<ActivityContextValue | null>(null);

export function useActivityContext(): ActivityContextValue | null {
  return useContext(ActivityContext);
}

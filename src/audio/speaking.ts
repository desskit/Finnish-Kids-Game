// What's being spoken right now, so a speaker icon can show its sound waves
// while it plays (useSpeaking). speak.ts reports each line's start and end.

const active = new Set<object>();
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

export function speechStarted(line: object): void {
  active.add(line);
  changed();
}

export function speechEnded(line: object): void {
  if (active.delete(line)) changed();
}

/** Everything stopped at once (a cancel). */
export function speechCleared(): void {
  if (active.size) {
    active.clear();
    changed();
  }
}

/** Is anything being spoken? */
export function isSpeakingNow(): boolean {
  return active.size > 0;
}

/** Hear when speech starts or stops. */
export function onSpeakingChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

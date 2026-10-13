import { useSyncExternalStore } from 'react';
import { isSpeakingNow, onSpeakingChange } from './speaking';

/** Is the app speaking right now? (A speaker icon shows its sound waves while it is.) */
export function useSpeaking(): boolean {
  return useSyncExternalStore(onSpeakingChange, isSpeakingNow, () => false);
}

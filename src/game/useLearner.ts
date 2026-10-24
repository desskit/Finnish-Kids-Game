import { useProfile } from '../state/profile';
import { useActivityContext } from './activityContext';
import { englishHelpOf, learnerKnobs, speaksEnglishPrompt, type LearnerKnobs } from './learner';

/** The active player's learner knobs (src/game/learner.ts). */
export function useLearner(): LearnerKnobs {
  const { activeChild } = useProfile();
  return learnerKnobs(activeChild);
}

/**
 * Should this game read its English prompt aloud on its own? Only for a
 * younger reader on a step's first rung — otherwise the prompt is text with a
 * button to hear it, and a game opens with Finnish, not English.
 */
export function useAutoEnglish(): boolean {
  const { activeChild, settings } = useProfile();
  const ctx = useActivityContext();
  return speaksEnglishPrompt(activeChild, ctx?.difficulty?.level ?? 1, englishHelpOf(settings));
}

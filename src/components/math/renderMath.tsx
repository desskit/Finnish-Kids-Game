import type { ReactElement } from 'react';
import type { ActivityKind, SkillNode } from '../../game/path';
import StoryTime from '../StoryTime';
import MathQuiz, { type MathAnswerMode } from './MathQuiz';
import type { MathGame } from './MathScenes';

// The math section's steps, played through the same /skill/:id route as the
// course (App picks this for a `math-` step; game/path.tsx's renderActivity
// knows nothing of these, so the course never imports the math screens).
// A step's own game, its bonus rounds — saying the answer, typing it — and
// its story.

const GAMES: Partial<Record<ActivityKind, MathGame>> = {
  'math-tree': 'tree',
  'math-listen': 'listen',
  'math-scale': 'scale',
  'math-train': 'train',
  'math-word': 'word',
  'math-build': 'build',
  'math-quick': 'quick',
};

/** The game a math step plays (its bonus rounds keep its scene). */
export const mathGameOf = (skill: SkillNode): MathGame | undefined => GAMES[skill.activity];

export function renderMathActivity(skill: SkillNode, activity: ActivityKind, onExit: () => void): ReactElement | null {
  if (activity === 'story') return <StoryTime ids={skill.content.ids} onExit={onExit} />;
  const set = skill.content.math;
  const game = mathGameOf(skill);
  if (!set || !game) return null;
  const answer: MathAnswerMode | undefined =
    activity === 'say' ? 'say' : activity === 'math-type' ? 'type' : GAMES[activity] ? 'tap' : undefined;
  if (!answer) return null;
  return <MathQuiz set={set} game={game} title={skill.titleFi} answer={answer} onExit={onExit} />;
}

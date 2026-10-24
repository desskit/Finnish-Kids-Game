// Faces won in the math section (Lasketaan!): three avatar heads a child can
// put on from Achievements once the badge that wins each is earned. Wearing
// one remembers the child's own animal, to go back to.

import type { Child } from '../state/storage';
import { earnedBadgeIds, type BadgeEnv } from './badges';

export interface MathFace {
  /** The avatar it is (src/art/Avatar.tsx draws avatar-<name>). */
  glyph: string;
  name: string;
  /** The math badge that wins it. */
  badgeId: string;
}

export const MATH_FACES: readonly MathFace[] = [
  { glyph: '🤖', name: 'robot', badgeId: 'math-crowns-3' },
  { glyph: '🤓', name: 'owl in glasses', badgeId: 'math-days-7' },
  { glyph: '🐲', name: 'dragon', badgeId: 'math-crowns-all' },
];

export const isMathFace = (glyph: string | undefined): boolean => MATH_FACES.some((f) => f.glyph === glyph);

/** The faces this child has won. */
export function facesWon(child: Child, env: BadgeEnv): MathFace[] {
  const earned = earnedBadgeIds(child, env);
  return MATH_FACES.filter((f) => earned.has(f.badgeId));
}

/** The child's own animal: the avatar they wear, or the one a face is covering. */
export function ownAnimal(child: Child): string | undefined {
  return isMathFace(child.avatar) ? child.math?.animal : child.avatar;
}

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Child } from '../state/storage';
import { ProfileProvider } from '../state/profile';
import { BADGES, FIRST_MATH_STAGES, badgeById, badgeProgress, earnedBadgeIds } from './badges';
import { badgeEnv } from './path';
import { MATH_FACES, facesWon, isMathFace, ownAnimal } from './faces';
import { MATH_STAGES } from './mathPath';
import { AVATAR_NAMES } from '../art/Avatar';
import { ART, GLYPH_ART } from '../art/generated/manifest';
import { glyphKey } from '../art/glyph';
import Achievements from '../components/Achievements';

// The math section's own badges (measured from its record alone), and the
// three faces they win: put on from Achievements, the child's own animal kept
// to go back to.

const passed = { passedAt: 1, best: 1, attempts: 1 };

function child(over: Partial<Child> = {}): Child {
  return { id: 'k', name: 'Aino', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {}, ...over } as Child;
}
const crowns = (n: number) => ({ crowns: Object.fromEntries(FIRST_MATH_STAGES.slice(0, n).map((id) => [id, passed])) });
const has = (c: Child, id: string) => earnedBadgeIds(c, badgeEnv).has(id);

describe('the math badges', () => {
  const math = BADGES.filter((b) => b.category === 'math');

  it('are six, each with a picture, and no number in a title (they can show on a math screen)', () => {
    expect(math.map((b) => b.id)).toEqual(['math-first', 'math-crowns-3', 'math-crowns-all', 'math-speaker', 'math-days-7', 'math-quick-20']);
    for (const b of math) {
      expect(GLYPH_ART[glyphKey(b.emoji)], b.id).toBeTruthy();
      expect(`${b.titleFi} ${b.titleEn}`).not.toMatch(/\d|\b(one|two|three|five|seven|ten|twenty)\b/i);
    }
  });

  it('count every first stage for "every crown"', () => {
    expect(FIRST_MATH_STAGES).toEqual(MATH_STAGES.map((s) => s.id));
  });

  it('are earned from the math record alone', () => {
    expect(has(child({ progress: { 'math-plus-minus': { 'math-sums-10': { plays: 1 } } } } as Partial<Child>), 'math-first')).toBe(true);
    expect(has(child({ math: crowns(2) }), 'math-crowns-3')).toBe(false);
    expect(has(child({ math: crowns(3) }), 'math-crowns-3')).toBe(true);
    expect(has(child({ math: crowns(7) }), 'math-crowns-all')).toBe(false);
    expect(has(child({ math: crowns(8) }), 'math-crowns-all')).toBe(true);
    expect(badgeProgress(child({ math: { spoken: 4 } }), badgeEnv, badgeById('math-speaker')!)).toMatchObject({ have: 4, need: 10 });
    expect(has(child({ math: { spoken: 10 } }), 'math-speaker')).toBe(true);
    expect(has(child({ math: { today: { lastDay: '2026-10-24', streak: 1, best: 3, days: 7 } } }), 'math-days-7')).toBe(true);
    expect(has(child({ math: { quickBest: 19 } }), 'math-quick-20')).toBe(false);
    expect(has(child({ math: { quickBest: 20 } }), 'math-quick-20')).toBe(true);
  });
});

describe('the faces won in math', () => {
  it('each have a head drawn, and a badge that wins it', () => {
    for (const f of MATH_FACES) {
      expect(AVATAR_NAMES[f.glyph]).toBe(f.name);
      expect(`avatar-${f.name.replace(/\s+/g, '-')}` in ART, f.name).toBe(true);
      expect(badgeById(f.badgeId)?.category).toBe('math');
    }
  });

  it('are won with their badges', () => {
    expect(facesWon(child(), badgeEnv)).toEqual([]);
    expect(facesWon(child({ math: crowns(3) }), badgeEnv).map((f) => f.name)).toEqual(['robot']);
    expect(facesWon(child({ math: { ...crowns(8), today: { lastDay: 'x', streak: 1, best: 1, days: 7 } } }), badgeEnv)).toHaveLength(3);
  });

  it('keep the child’s own animal to go back to', () => {
    expect(isMathFace('🤖')).toBe(true);
    expect(isMathFace('🦊')).toBe(false);
    expect(ownAnimal(child())).toBe('🦊');
    expect(ownAnimal(child({ avatar: '🤖', math: { animal: '🐼' } }))).toBe('🐼');
  });
});

describe('putting a face on (Achievements)', () => {
  beforeEach(() => localStorage.clear());

  function seed(math: object) {
    localStorage.setItem(
      'fkg.profiles.v2',
      JSON.stringify({ version: 2, children: [child({ avatar: '🐼', math } as Partial<Child>)], activeId: 'k', settings: { muted: true, reducedMotion: true } }),
    );
  }
  const stored = () => JSON.parse(localStorage.getItem('fkg.profiles.v2')!).children[0];
  const renderAchievements = () =>
    render(
      <ProfileProvider>
        <MemoryRouter>
          <Achievements />
        </MemoryRouter>
      </ProfileProvider>,
    );

  it('shows locked faces with what wins them', () => {
    seed({});
    renderAchievements();
    const robot = screen.getByRole('button', { name: /Crown collector/ });
    expect(robot).toBeDisabled();
  });

  it('puts a won face on, and goes back to the animal', () => {
    seed(crowns(3));
    renderAchievements();
    fireEvent.click(screen.getByRole('button', { name: /Wear the robot/ }));
    expect(stored().avatar).toBe('🤖');
    expect(stored().math.animal).toBe('🐼');
    expect(screen.getByRole('button', { name: /wearing it/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Back to the panda/ }));
    expect(stored().avatar).toBe('🐼');
    expect(stored().math.animal).toBeUndefined();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProfileProvider } from '../../state/profile';
import { useActivityContext } from '../../game/activityContext';
import { UNITS } from '../../game/course';
import { MATH_STAGES } from '../../game/mathPath';

// Every game stubbed with a tiny one that reports its questions all right or
// all wrong, so the crown test's own logic is what's under test: tallying,
// the pass mark, where the crown is recorded — and no digit on its screens.
function FakeGame({ id }: { id: string }) {
  const ctx = useActivityContext()!;
  const n = ctx.roundQuestions ?? 3;
  return (
    <div>
      <span>game:{id}</span>
      <button onClick={() => ctx.onSegmentComplete(n, n)}>all right</button>
      <button onClick={() => ctx.onSegmentComplete(0, n)}>all wrong</button>
    </div>
  );
}

vi.mock('./renderMath', () => ({ renderMathActivity: (skill: { id: string }) => <FakeGame id={skill.id} /> }));
vi.mock('../../audio/sfx', () => ({ playDing: vi.fn() }));

import MathTestRoute from './MathTestRoute';

const stage = MATH_STAGES[0];
const passed = { passedAt: 1, best: 1, attempts: 1 };
const proven = { plays: 3, bestStars: 6, totalStars: 18, totalPossible: 18, lastPlayed: 1, level: 3, recent: [], topProvenAt: 1 };

function seed(gamesDone: boolean) {
  const upTo = UNITS.slice(0, UNITS.findIndex((u) => u.id === 'numbers') + 1);
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [
        {
          id: 'k',
          name: 'Aino',
          avatar: '🦊',
          level: 1,
          stars: 0,
          createdAt: 1,
          progress: gamesDone ? { [stage.id]: Object.fromEntries(stage.skills.map((s) => [s.id, proven])) } : {},
          srs: {},
          course: { checkpoints: Object.fromEntries(upTo.map((u) => [u.id, passed])), lessonsSeen: { [stage.lessonId]: 1 } },
        },
      ],
      activeId: 'k',
      settings: { muted: true, reducedMotion: true },
    }),
  );
}

function renderTest() {
  return render(
    <ProfileProvider>
      <MemoryRouter initialEntries={[`/math/test/${stage.id}`]}>
        <Routes>
          <Route path="/math/test/:stageId" element={<MathTestRoute />} />
          <Route path="*" element={<p>elsewhere</p>} />
        </Routes>
      </MemoryRouter>
    </ProfileProvider>,
  );
}

const stored = () => JSON.parse(localStorage.getItem('fkg.profiles.v2')!).children[0];
const noDigits = (el: HTMLElement) => expect(el.textContent).not.toMatch(/\d/);

describe('a math stage’s crown test', () => {
  beforeEach(() => localStorage.clear());

  it('waits until every game is done', () => {
    seed(false);
    renderTest();
    expect(screen.getByText('elsewhere')).toBeInTheDocument();
  });

  it('plays each game, and a pass wins the crown — in the math record, not the course', () => {
    seed(true);
    const { container } = renderTest();
    noDigits(container);
    fireEvent.click(screen.getByText(/^Aloita/));
    const games = stage.skills.filter((s) => s.activity !== 'story');
    for (const g of games) {
      expect(screen.getByText(`game:${g.id}`)).toBeInTheDocument();
      noDigits(container.querySelector('.checkpoint-bar')!);
      fireEvent.click(screen.getByText('all right'));
    }
    expect(screen.getByText(/Läpäisty!/)).toBeInTheDocument();
    noDigits(container);
    const c = stored();
    expect(c.math.crowns[stage.id].passedAt).toBeTruthy();
    expect(c.course.checkpoints[stage.id]).toBeUndefined();
  });

  it('a miss shows what to practise, with no crown and no digits', () => {
    seed(true);
    const { container } = renderTest();
    fireEvent.click(screen.getByText(/^Aloita/));
    for (const _ of stage.skills.filter((s) => s.activity !== 'story')) fireEvent.click(screen.getByText('all wrong'));
    expect(screen.getByText(/Hyvä yritys!/)).toBeInTheDocument();
    expect(screen.getByText(/^Harjoittele/)).toBeInTheDocument();
    noDigits(container);
    expect(stored().math.crowns[stage.id].passedAt).toBeUndefined();
  });
});

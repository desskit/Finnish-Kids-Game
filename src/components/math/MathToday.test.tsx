import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProfileProvider } from '../../state/profile';
import { useActivityContext } from '../../game/activityContext';
import { UNITS } from '../../game/course';
import { MATH_STAGES } from '../../game/mathPath';
import { TODAY_PROBLEMS, todayBonus } from '../../game/mathCourse';
import { dayKey } from '../../game/streak';

// Today's sums with every game stubbed by one that answers its one problem
// right (or wrong), so what's under test is the route's own logic: a problem
// from each game, bonus stars once a day, the days in a row — and no digit.
function FakeGame({ id }: { id: string }) {
  const ctx = useActivityContext()!;
  return (
    <div>
      <span>game:{id}</span>
      <span>questions:{ctx.roundQuestions === 1 ? 'one' : 'more'}</span>
      <button onClick={() => ctx.onSegmentComplete(1, 1)}>right</button>
      <button onClick={() => ctx.onSegmentComplete(0, 1)}>wrong</button>
    </div>
  );
}

vi.mock('./renderMath', () => ({ renderMathActivity: (skill: { id: string }) => <FakeGame id={skill.id} /> }));
vi.mock('../../audio/sfx', () => ({ playDing: vi.fn() }));

import MathToday from './MathToday';

const stage = MATH_STAGES[0];
const passed = { passedAt: 1, best: 1, attempts: 1 };

function seed(today?: object) {
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
          stars: 10,
          createdAt: 1,
          progress: {},
          srs: {},
          course: { checkpoints: Object.fromEntries(upTo.map((u) => [u.id, passed])), lessonsSeen: { [stage.lessonId]: 1 } },
          math: today ? { today } : undefined,
        },
      ],
      activeId: 'k',
      settings: { muted: true, reducedMotion: true },
    }),
  );
}

function renderToday() {
  return render(
    <ProfileProvider>
      <MemoryRouter initialEntries={['/math/today']}>
        <Routes>
          <Route path="/math/today" element={<MathToday />} />
          <Route path="*" element={<p>elsewhere</p>} />
        </Routes>
      </MemoryRouter>
    </ProfileProvider>,
  );
}

const stored = () => JSON.parse(localStorage.getItem('fkg.profiles.v2')!).children[0];
const noDigits = (el: HTMLElement) => expect(el.textContent).not.toMatch(/\d/);

describe('today’s sums', () => {
  beforeEach(() => localStorage.clear());

  it('wait for a math stage to be begun', () => {
    localStorage.setItem('fkg.profiles.v2', JSON.stringify({ version: 2, children: [{ id: 'k', name: 'A', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {} }], activeId: 'k', settings: {} }));
    renderToday();
    expect(screen.getByText('elsewhere')).toBeInTheDocument();
  });

  it('play a problem from each game, then give bonus stars and a flame — with no digit', () => {
    seed();
    const { container } = renderToday();
    noDigits(container);
    fireEvent.click(screen.getByText(/^Aloita/));
    for (let i = 0; i < TODAY_PROBLEMS; i++) {
      expect(screen.getByText('questions:one')).toBeInTheDocument();
      noDigits(container.querySelector('.checkpoint-bar')!);
      fireEvent.click(screen.getByText('right'));
    }
    expect(screen.getByText(/Hienoa!/)).toBeInTheDocument();
    noDigits(container);
    const c = stored();
    expect(c.stars).toBe(10 + todayBonus(TODAY_PROBLEMS, TODAY_PROBLEMS));
    expect(c.math.today).toMatchObject({ lastDay: dayKey(Date.now()), streak: 1, days: 1 });
    // counts toward the daily streak too
    expect(c.lastPlayedDay).toBe(dayKey(Date.now()));
  });

  it('give the smaller bonus for a miss', () => {
    seed();
    renderToday();
    fireEvent.click(screen.getByText(/^Aloita/));
    fireEvent.click(screen.getByText('wrong'));
    for (let i = 1; i < TODAY_PROBLEMS; i++) fireEvent.click(screen.getByText('right'));
    expect(screen.getByText(/Hyvä yritys!/)).toBeInTheDocument();
    expect(stored().stars).toBe(10 + todayBonus(TODAY_PROBLEMS - 1, TODAY_PROBLEMS));
  });

  it('are done once a day: the same day, nothing to start', () => {
    seed({ lastDay: dayKey(Date.now()), streak: 2, best: 2, days: 2 });
    const { container } = renderToday();
    expect(screen.queryByText(/^Aloita/)).toBeNull();
    expect(screen.getByText(/come back tomorrow/)).toBeInTheDocument();
    noDigits(container);
  });

  it('carry the days in a row on from yesterday', () => {
    seed({ lastDay: dayKey(Date.now() - 86_400_000), streak: 2, best: 4, days: 6 });
    renderToday();
    fireEvent.click(screen.getByText(/^Aloita/));
    for (let i = 0; i < TODAY_PROBLEMS; i++) fireEvent.click(screen.getByText('right'));
    expect(stored().math.today).toMatchObject({ streak: 3, best: 4, days: 7 });
  });
});

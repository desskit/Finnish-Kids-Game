import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProfileProvider } from '../state/profile';
import { useActivityContext } from '../game/activityContext';

// Stub every game with a tiny one: it reports a segment of `roundQuestions`
// questions, all right or all wrong, on a button tap — so the checkpoint's own
// logic (tallying, pass mark, recording, unlocking) is what's under test.
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

vi.mock('../game/path', async (importOriginal) => {
  const real = await importOriginal<typeof import('../game/path')>();
  return {
    ...real,
    renderActivity: (skill: { id: string }) => <FakeGame id={skill.id} />,
  };
});
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import CheckpointRoute from './CheckpointRoute';

// Every step's top level proven — what opens a checkpoint.
const lvl2 = { plays: 3, bestStars: 6, totalStars: 18, totalPossible: 18, lastPlayed: 1, level: 3, recent: [], topProvenAt: 1 };

function seed() {
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
          progress: { 'hello': { greetings: lvl2, introduce: lvl2, 'hello-talk': lvl2 } },
          srs: {},
          course: { lessonsSeen: { sounds: 1 } },
        },
      ],
      activeId: 'k',
      settings: { muted: true, reducedMotion: false },
    }),
  );
}

function renderCheckpoint() {
  return render(
    <ProfileProvider>
      <MemoryRouter initialEntries={['/checkpoint/hello']}>
        <Routes>
          <Route path="/checkpoint/:unitId" element={<CheckpointRoute />} />
          <Route path="*" element={<p>elsewhere</p>} />
        </Routes>
      </MemoryRouter>
    </ProfileProvider>,
  );
}

const saved = () => JSON.parse(localStorage.getItem('fkg.profiles.v2')!).children[0];

beforeEach(() => {
  localStorage.clear();
  seed();
});

describe('CheckpointRoute', () => {
  it('runs every step in turn and passes at ≥ 80% — recording it and offering the next unit', () => {
    renderCheckpoint();
    expect(screen.getByText(/questions from everything/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    expect(screen.getByText('game:greetings')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'all right' }));
    expect(screen.getByText('game:introduce')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'all right' }));
    expect(screen.getByText('game:hello-talk')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'all right' }));
    expect(screen.getByText(/Checkpoint passed/)).toBeInTheDocument();
    expect(screen.getByText(/Unit 2 · People & things is open/)).toBeInTheDocument();
    const cp = saved().course.checkpoints['hello'];
    expect(cp.passedAt).toBeGreaterThan(0);
    expect(cp.best).toBe(1);
  });

  it('fails below the mark — points at the weakest step and keeps the unit open', () => {
    renderCheckpoint();
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    fireEvent.click(screen.getByRole('button', { name: 'all right' }));
    fireEvent.click(screen.getByRole('button', { name: 'all wrong' }));
    fireEvent.click(screen.getByRole('button', { name: 'all right' }));
    expect(screen.getByText(/Almost there/)).toBeInTheDocument();
    expect(screen.getByText(/Introduce yourself/)).toBeInTheDocument();
    const cp = saved().course.checkpoints['hello'];
    expect(cp.passedAt).toBeUndefined();
    expect(cp.attempts).toBe(1);
    // Try again restarts from the first part.
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(screen.getByText('game:greetings')).toBeInTheDocument();
  });

  it('refuses a locked checkpoint (steps not done yet)', () => {
    localStorage.clear();
    localStorage.setItem(
      'fkg.profiles.v2',
      JSON.stringify({
        version: 2,
        children: [{ id: 'k', name: 'A', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {} }],
        activeId: 'k',
        settings: { muted: true, reducedMotion: false },
      }),
    );
    renderCheckpoint();
    expect(screen.getByText('elsewhere')).toBeInTheDocument();
  });
});

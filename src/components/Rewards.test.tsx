import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../audio/speak', () => ({
  speak: vi.fn(),
  speakEnglish: vi.fn(),
  speakProse: vi.fn(),
  stopSpeaking: vi.fn(),
  isSpeechAvailable: () => true,
}));

import { ProfileProvider } from '../state/profile';
import Notebook from './Notebook';
import SelfCheck from './SelfCheck';
import ProgressView from './ProgressView';
import LearnedWords from './LearnedWords';
import { reviewItemById } from '../content';

// Rewards that tell what was learned (docs/LEARNING_RESEARCH.md, phase 7).

function seed(child: Record<string, unknown>) {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [{ id: 'k', name: 'Aino', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {}, ...child }],
      activeId: 'k',
      settings: { muted: false, reducedMotion: true },
    }),
  );
}

const wrap = (ui: React.ReactNode) =>
  render(
    <ProfileProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ProfileProvider>,
  );

const sched = (correct: number, firstSeenAt?: number) => ({
  box: correct ? 4 : 1,
  due: 0,
  seen: 2,
  correct,
  lastSeenAt: Date.now(),
  ...(firstSeenAt ? { firstSeenAt } : {}),
});

beforeEach(() => localStorage.clear());

describe('the word book', () => {
  it('collects every word answered right — pictures to tap, no counts', () => {
    seed({ srs: { cat: sched(2), dog: sched(0) } });
    wrap(<Notebook />);
    expect(screen.getByText('Sanakirjani')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `${reviewItemById.cat.fi} · ${reviewItemById.cat.en}` })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: new RegExp(`^${reviewItemById.dog.fi} ·`) })).toBeNull();
  });

  it("isn't there before any word is known", () => {
    seed({});
    wrap(<Notebook />);
    expect(screen.queryByText('Sanakirjani')).toBeNull();
  });
});

describe("today's words", () => {
  it('shows the words met for the first time today, else the words practiced', () => {
    seed({ srs: { cat: sched(1, Date.now()), dog: sched(1) } });
    const r = wrap(<LearnedWords />);
    expect(screen.getByText('Uudet sanat')).toBeInTheDocument();
    expect(screen.getByText(reviewItemById.cat.fi)).toBeInTheDocument();
    expect(screen.queryByText(reviewItemById.dog.fi)).toBeNull();
    r.unmount();
    seed({ srs: { dog: sched(1) } });
    wrap(<LearnedWords />);
    expect(screen.getByText('Words you practiced today')).toBeInTheDocument();
    expect(screen.getByText(reviewItemById.dog.fi)).toBeInTheDocument();
  });
});

describe("the child's own check", () => {
  it('asks the unit’s can-do, saves the answer, and the grown-up sees it beside the measured pass', () => {
    seed({ course: { checkpoints: { hello: { passedAt: 1, best: 1, attempts: 1 } } } });
    const r = wrap(<SelfCheck unitId="hello" />);
    expect(screen.getByText(/Can you greet people/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Not yet/ }));
    expect(screen.getByText(/Thanks for telling/)).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem('fkg.profiles.v2')!);
    expect(saved.children[0].course.selfCheck.hello.answer).toBe('not-yet');
    r.unmount();
    wrap(<ProgressView />);
    expect(screen.getByText(/Aino says: not yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Read the lesson together' })).toBeInTheDocument();
  });
});

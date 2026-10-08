import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileProvider } from '../state/profile';
import StatsView from './StatsView';
import { dayKey } from '../game/streak';
import { daysCsv, subjectsCsv, summary } from '../game/statsReport';
import type { Child } from '../state/storage';

const DAY = 864e5;
const now = Date.now();
const d = (n: number) => dayKey(now - n * DAY);

const stats = {
  v: 1,
  days: {
    [d(0)]: { n: 12, right: 9, ms: 240_000 },
    [d(1)]: { n: 20, right: 18, ms: 300_000 },
    [d(3)]: { n: 8, right: 4 },
  },
  subjects: {
    'i-havent': {
      n: 20,
      right: 9,
      days: { [d(0)]: { n: 12, right: 5 }, [d(3)]: { n: 8, right: 4 } },
      first: now - 3 * DAY,
      last: now,
      src: { practice: { n: 12, right: 5 }, checkpoint: { n: 8, right: 4 } },
    },
    'this-is': {
      n: 20,
      right: 19,
      days: { [d(1)]: { n: 20, right: 19 } },
      first: now - DAY,
      last: now - DAY,
      src: { practice: { n: 20, right: 19 } },
    },
  },
  warmups: [{ day: d(1), subject: 'this-is', right: 9, total: 10, at: now - DAY }],
};

const child = {
  id: 'k',
  name: 'Lilli',
  avatar: '🦊',
  level: 1,
  adaptive: true,
  stars: 0,
  createdAt: 1,
  progress: {},
  srs: {
    'con:i-havent': { box: 1, due: 0, seen: 6, correct: 2, lastSeenAt: now },
    hat: { box: 1, due: 0, seen: 5, correct: 2, lastSeenAt: now },
  },
  stats,
} as unknown as Child;

beforeEach(() => {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({ version: 2, children: [child], activeId: 'k', settings: { muted: false, reducedMotion: false } }),
  );
});

describe('grown-up Stats tab', () => {
  it('shows the headline numbers, the chart, the weakest subjects and the tracking downloads', () => {
    render(
      <ProfileProvider>
        <MemoryRouter>
          <StatsView />
        </MemoryRouter>
      </ProfileProvider>,
    );
    expect(screen.getByText(/questions today · 75% right · 4 min/)).toBeInTheDocument();
    expect(screen.getByText(/Practised on 3 of the last 14 days/)).toBeInTheDocument();
    expect(document.querySelectorAll('.gchart__day')).toHaveLength(14);
    // The shaky subject leads the weakest list, with a link to practise it.
    const weakest = screen.getByText('Weakest right now').closest('section')!;
    expect(weakest.textContent).toMatch(/Minulla ei ole…|I don't have…/);
    expect(weakest.querySelector('a[href="/skill/i-havent"]')).not.toBeNull();
    // The sentence pattern and the word that need practice.
    expect(screen.getByText('Minulla ei ole ___.')).toBeInTheDocument();
    expect(screen.getByText(/hattu/)).toBeInTheDocument();
    // Warm-up history and source split.
    expect(screen.getByText(/Daily warm-up/)).toBeInTheDocument();
    expect(screen.getByText(/Practice: 32 \(75% right\) · Checkpoints: 8 \(50% right\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Subjects \(CSV\)/ })).toBeInTheDocument();
  });
});

describe('stats report', () => {
  it('summarises today, the week and all time', () => {
    const s = summary(child, now);
    expect(s.today).toMatchObject({ n: 12, right: 9 });
    expect(s.week.n).toBe(40);
    expect(s.weekActiveDays).toBe(3);
    expect(s.allTime).toBe(40);
    expect(s.subjectsPractised).toBe(2);
    expect(s.warmupsThisWeek).toBe(1);
  });

  it('exports subjects and days as CSV', () => {
    const subjects = subjectsCsv(child, now).trim().split('\n');
    expect(subjects[0]).toBe('unit_no,unit,subject_id,subject,questions,right_first_time,overall_pct,lately_pct,trend,last_practised');
    expect(subjects).toHaveLength(3);
    expect(subjects.some((l) => l.includes(',i-havent,') && l.includes(',20,9,45,'))).toBe(true);
    const days = daysCsv(child).trim().split('\n');
    expect(days[0]).toBe('day,questions,right_first_time,pct,minutes');
    expect(days).toContain(`${d(0)},12,9,75,4`);
  });
});

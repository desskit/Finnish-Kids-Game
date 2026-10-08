import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ProfileProvider } from '../state/profile';

vi.mock('../audio/speak', () => ({ speak: vi.fn(), speakEnglish: vi.fn(), isSpeechAvailable: () => true }));

import FinnishReview from './FinnishReview';
import { speak } from '../audio/speak';

beforeEach(() => {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({ version: 2, children: [], activeId: null, settings: { muted: false, reducedMotion: false } }),
  );
});

const saved = () => JSON.parse(localStorage.getItem('fkg.profiles.v2')!);

function renderReview() {
  return render(
    <ProfileProvider>
      <FinnishReview />
    </ProfileProvider>,
  );
}

describe('Grown-ups → Finnish check', () => {
  it('lists what to check, records ✓ and ✎ with a note, and keeps them on the device', () => {
    renderReview();
    // Pick the stories, so the first card is a known one.
    fireEvent.change(screen.getByRole('combobox', { name: 'Section' }), { target: { value: 'stories' } });
    const first = document.querySelector('.rcard') as HTMLElement;
    expect(within(first).getByText('Not checked yet')).toBeInTheDocument();
    const fi = first.querySelector('.rcard__fi')!.textContent!.replace('🔊', '').trim();

    fireEvent.click(within(first).getByRole('button', { name: /Hear it/ }));
    expect(vi.mocked(speak)).toHaveBeenCalled();

    // ✓ Correct → it leaves "To check".
    fireEvent.click(within(first).getByRole('button', { name: /Oikein/ }));
    const decisions = saved().review.decisions as Record<string, { status: string; fi: string }>;
    const [key] = Object.keys(decisions);
    expect(decisions[key]).toMatchObject({ status: 'ok', fi });
    expect(screen.queryByText(fi)).not.toBeInTheDocument();

    // ✎ Needs a fix, with a note and a suggestion.
    const next = document.querySelector('.rcard') as HTMLElement;
    fireEvent.click(within(next).getByRole('button', { name: /Korjattava/ }));
    fireEvent.change(within(next).getByPlaceholderText(/sounds unnatural/), { target: { value: 'Luonnoton sanajärjestys' } });
    fireEvent.click(within(next).getByRole('button', { name: 'Save' }));
    const fixes = Object.values(saved().review.decisions as Record<string, { status: string; note?: string }>).filter(
      (d) => d.status === 'fix',
    );
    expect(fixes).toEqual([expect.objectContaining({ note: 'Luonnoton sanajärjestys' })]);
    fireEvent.click(screen.getByRole('tab', { name: /Need a fix \(1\)/ }));
    expect(screen.getByText('Luonnoton sanajärjestys')).toBeInTheDocument();
  });

  it('counts progress, and shows the reviewer’s earlier approvals as approved', () => {
    renderReview();
    expect(screen.getByText(/approved earlier/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Correct/ }));
    expect(screen.getAllByText('✅ Approved').length).toBeGreaterThan(0);
  });

  it('remembers the reviewer’s name for the file', () => {
    renderReview();
    fireEvent.change(screen.getByPlaceholderText('e.g. Maija'), { target: { value: 'Maija' } });
    expect(saved().review.reviewer).toBe('Maija');
  });
});

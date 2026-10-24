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
    // short entries a dictionary settles come first (the screens' words), with their evidence
    expect([...document.querySelectorAll('.rcard__status--wiktionary')].some((el) => el.textContent?.includes('Checked in Wiktionary'))).toBe(true);
    expect(screen.getAllByText(/^From Wiktionary:/).length).toBeGreaterThan(0);
    // the reviewer's own approvals: the status is the ✅ picture and the word
    fireEvent.change(screen.getByRole('combobox', { name: 'Section' }), { target: { value: 'dialogues' } });
    expect([...document.querySelectorAll('.rcard__status--ledger')].some((el) => el.textContent?.includes('Approved'))).toBe(true);
  });

  it('keeps what a dictionary settled out of "To check", and says why it held the rest back', () => {
    renderReview();
    expect(screen.queryAllByText(/^From Wiktionary:/)).toEqual([]);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: 'Välitesti' } });
    expect(screen.getAllByText(/^Dictionary check:/).length).toBeGreaterThan(0);
  });

  it('runs in course order, and shows one unit at a time', () => {
    renderReview();
    // the words on every screen come first, before any unit's
    const chips = () => [...document.querySelectorAll('.rcard .rcard__chips .gchip:first-child')].map((el) => el.textContent);
    expect(chips()[0]).toBe('Everywhere');
    const where = screen.getByRole('combobox', { name: 'Where in the course' });
    expect(within(where).getByRole('option', { name: /^Unit 1 · Hei! \(\d+ to check\)$/ })).toBeInTheDocument();
    fireEvent.change(where, { target: { value: '4' } });
    expect(chips().length).toBeGreaterThan(0);
    expect(new Set(chips())).toEqual(new Set(['Unit 4']));
    // by section: the sections' own order again, the dialogues first
    fireEvent.change(where, { target: { value: 'all' } });
    fireEvent.click(screen.getByRole('tab', { name: 'By section' }));
    expect(document.querySelector('.rcard .gchip--muted')?.textContent).toBe('Greetings & dialogues');
  });

  it('remembers the reviewer’s name for the file', () => {
    renderReview();
    fireEvent.change(screen.getByPlaceholderText('e.g. Maija'), { target: { value: 'Maija' } });
    expect(saved().review.reviewer).toBe('Maija');
  });
});

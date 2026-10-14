import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const nav = vi.hoisted(() => ({ fn: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => nav.fn }));

import ProfilePicker from './ProfilePicker';
import { ProfileProvider } from '../state/profile';

function seedChildren(theme?: string) {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [{ id: 'a', name: 'Aino', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {}, theme }],
      activeId: 'a',
      settings: { muted: false, reducedMotion: false },
    }),
  );
}

const saved = () => JSON.parse(localStorage.getItem('fkg.profiles.v2')!);
const look = () => document.documentElement.dataset.theme;
const picker = () =>
  render(
    <ProfileProvider>
      <ProfilePicker />
    </ProfileProvider>,
  );

beforeEach(() => {
  localStorage.clear();
  nav.fn.mockClear();
});

describe('ProfilePicker navigation', () => {
  it('offers Back home when a child already exists (not a forced choice)', () => {
    seedChildren();
    render(
      <ProfileProvider>
        <ProfilePicker />
      </ProfileProvider>,
    );
    const back = screen.getByText('Back home').closest('button')!;
    fireEvent.click(back);
    expect(nav.fn).toHaveBeenCalledWith('/');
  });

  it('shows no Back at first launch (no child yet — must create one)', () => {
    render(
      <ProfileProvider>
        <ProfilePicker />
      </ProfileProvider>,
    );
    expect(screen.queryByText('Back home')).toBeNull();
  });
});

describe('ProfilePicker colors', () => {
  it("is in the device's look, not the last player's", () => {
    seedChildren('pink');
    picker();
    expect(look()).toBe('day');
  });

  it('saves a new player with the colors they picked, shown as they pick', () => {
    picker();
    fireEvent.change(screen.getByLabelText(/Nimi/), { target: { value: 'Pia' } });
    const pink = screen.getByRole('button', { name: /Pinkki/ });
    fireEvent.click(pink);
    expect(pink.getAttribute('aria-pressed')).toBe('true');
    expect(look()).toBe('pink');
    fireEvent.click(screen.getByRole('button', { name: /Aloita/ }));
    expect(saved().children[0]).toMatchObject({ name: 'Pia', theme: 'pink' });
  });

  it("leaves a new player following the device when they don't pick", () => {
    picker();
    fireEvent.change(screen.getByLabelText(/Nimi/), { target: { value: 'Pia' } });
    fireEvent.click(screen.getByRole('button', { name: /Aloita/ }));
    expect(saved().children[0]).not.toHaveProperty('theme');
  });

  it("changes a player's colors with the brush on their card", () => {
    seedChildren();
    picker();
    const card = screen.getByText('Aino').closest('.profile-card')!;
    expect(card.getAttribute('data-look')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: "Change Aino's colors" }));
    fireEvent.click(screen.getByRole('button', { name: /Yö/ }));
    expect(saved().children[0].theme).toBe('night');
    expect(look()).toBe('night');
    fireEvent.click(screen.getByRole('button', { name: /Valmis/ }));
    expect(screen.getByText('Aino').closest('.profile-card')!.getAttribute('data-look')).toBe('night');
    expect(look()).toBe('day');
  });

  it("goes back to the active player's look when the screen closes", () => {
    seedChildren('pink');
    const Host = ({ open }: { open: boolean }) => <ProfileProvider>{open && <ProfilePicker />}</ProfileProvider>;
    const { rerender } = render(<Host open />);
    expect(look()).toBe('day');
    rerender(<Host open={false} />);
    expect(look()).toBe('pink');
  });
});

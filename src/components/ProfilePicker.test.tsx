import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const nav = vi.hoisted(() => ({ fn: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => nav.fn }));

import ProfilePicker from './ProfilePicker';
import { ProfileProvider } from '../state/profile';

function seedChildren() {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [{ id: 'a', name: 'Aino', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {} }],
      activeId: 'a',
      settings: { muted: false, reducedMotion: false },
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  nav.fn.mockClear();
});

describe('ProfilePicker navigation', () => {
  it('offers Back to the map when a child already exists (not a forced choice)', () => {
    seedChildren();
    render(
      <ProfileProvider>
        <ProfilePicker />
      </ProfileProvider>,
    );
    const back = screen.getByText('Back to the map').closest('button')!;
    fireEvent.click(back);
    expect(nav.fn).toHaveBeenCalledWith('/');
  });

  it('shows no Back at first launch (no child yet — must create one)', () => {
    render(
      <ProfileProvider>
        <ProfilePicker />
      </ProfileProvider>,
    );
    expect(screen.queryByText('Back to the map')).toBeNull();
  });
});

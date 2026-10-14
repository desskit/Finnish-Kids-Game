import { afterEach, describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ProfileProvider, useProfile } from '../state/profile';
import Scenery from './Scenery';

function seed(theme?: string, reducedMotion = false) {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      activeId: 'a',
      settings: { muted: false, reducedMotion },
      children: [{ id: 'a', name: 'Aino', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {}, ...(theme ? { theme } : {}) }],
    }),
  );
}

const wrap = (ui: ReactNode) => render(<ProfileProvider>{ui}</ProfileProvider>);
const src = (container: HTMLElement) => container.querySelector('img.scenery')?.getAttribute('src') ?? '';

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.reducedMotion;
});

describe('the scenery', () => {
  it('is in the look on screen, moving, and hidden from screen readers', () => {
    seed('pink');
    const { container } = wrap(<Scenery />);
    expect(src(container)).toMatch(/hero-pink\.moving\.svg/);
    expect(container.querySelector('img.scenery')).toHaveAttribute('alt', '');
  });

  it('follows a preview, like the look picker’s', () => {
    seed('day');
    let preview: (look: 'night' | null) => void = () => {};
    const Grab = () => {
      preview = useProfile().previewTheme;
      return null;
    };
    const { container } = wrap(
      <>
        <Grab />
        <Scenery />
      </>,
    );
    expect(src(container)).toMatch(/hero-day/);
    act(() => preview('night'));
    expect(src(container)).toMatch(/hero-night/);
  });

  it('shows a look of its own, still, for a preview card', () => {
    seed('day');
    const { container } = wrap(<Scenery look="night" still />);
    expect(src(container)).toMatch(/hero-night\.svg/);
  });

  it('stays still with reduced motion', async () => {
    seed('night', true);
    const { container } = wrap(<Scenery />);
    // the setting reaches the page after the first paint; let it settle
    await act(async () => {});
    expect(src(container)).toMatch(/hero-night\.svg/);
  });
});

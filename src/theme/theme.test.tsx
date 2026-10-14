import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ProfileProvider, useProfile } from '../state/profile';
import { applyTheme, resolveTheme, useDeviceDark } from './theme';

/** A device in light or dark mode that can switch while the app runs. */
function fakeDevice(dark: boolean) {
  const listeners = new Set<() => void>();
  const device = { dark };
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        get matches() {
          return query.includes('dark') && device.dark;
        },
        media: query,
        addEventListener: (_: string, fn: () => void) => listeners.add(fn),
        removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
      }) as unknown as MediaQueryList,
  );
  return {
    switchTo(nowDark: boolean) {
      device.dark = nowDark;
      act(() => listeners.forEach((fn) => fn()));
    },
  };
}

const look = () => document.documentElement.dataset.theme;
const bar = () => document.querySelector('meta[name="theme-color"]')?.getAttribute('content');

function seed(children: { id: string; theme?: string }[], activeId = children[0]?.id) {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      activeId,
      settings: { muted: false, reducedMotion: false },
      children: children.map((c, i) => ({
        name: `Kid ${i}`,
        avatar: '🦊',
        level: 1,
        stars: 0,
        createdAt: i,
        progress: {},
        srs: {},
        ...c,
      })),
    }),
  );
}

const original = vi.mocked(window.matchMedia).getMockImplementation();

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  document.head.append(meta);
});

afterEach(() => {
  vi.mocked(window.matchMedia).mockImplementation(original!);
  document.head.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
});

describe('resolveTheme', () => {
  it("is the player's pick, whatever the device", () => {
    expect(resolveTheme('pink', true)).toBe('pink');
    expect(resolveTheme('day', true)).toBe('day');
    expect(resolveTheme('night', false)).toBe('night');
  });

  it('follows the device when the player has no pick', () => {
    expect(resolveTheme(undefined, false)).toBe('day');
    expect(resolveTheme(undefined, true)).toBe('night');
  });
});

describe('applyTheme', () => {
  it("sets the look on <html> and the browser bar to the look's sky", () => {
    applyTheme('night');
    expect(look()).toBe('night');
    expect(bar()).toBe('#1e2550');
    applyTheme('pink');
    expect(look()).toBe('pink');
    expect(bar()).toBe('#ffd3e7');
  });
});

describe('useDeviceDark', () => {
  it('follows the device when it switches', () => {
    const device = fakeDevice(false);
    const { result } = renderHook(() => useDeviceDark());
    expect(result.current).toBe(false);
    device.switchTo(true);
    expect(result.current).toBe(true);
  });
});

describe('the look on screen', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <ProfileProvider>{children}</ProfileProvider>;

  it("shows the active player's pick", () => {
    fakeDevice(true);
    seed([{ id: 'a', theme: 'pink' }]);
    renderHook(() => useProfile(), { wrapper });
    expect(look()).toBe('pink');
  });

  it('follows the device for a player with no pick, and keeps following it', () => {
    const device = fakeDevice(true);
    seed([{ id: 'a' }]);
    renderHook(() => useProfile(), { wrapper });
    expect(look()).toBe('night');
    device.switchTo(false);
    expect(look()).toBe('day');
  });

  it('changes with the player, and with a new pick', () => {
    fakeDevice(false);
    seed([{ id: 'a', theme: 'night' }, { id: 'b' }]);
    const { result } = renderHook(() => useProfile(), { wrapper });
    expect(look()).toBe('night');
    act(() => result.current.switchChild('b'));
    expect(look()).toBe('day');
    act(() => result.current.setChildTheme('b', 'pink'));
    expect(look()).toBe('pink');
    expect(result.current.activeChild?.theme).toBe('pink');
    act(() => result.current.setChildTheme('b', undefined));
    expect(look()).toBe('day');
    expect(result.current.activeChild).not.toHaveProperty('theme');
  });

  it('saves a new player with their pick', () => {
    fakeDevice(false);
    const { result } = renderHook(() => useProfile(), { wrapper });
    act(() => {
      result.current.addChild('Aino', '🦊', 'pink');
    });
    expect(look()).toBe('pink');
    const saved = JSON.parse(localStorage.getItem('fkg.profiles.v2')!);
    expect(saved.children[0].theme).toBe('pink');
  });

  it('shows a preview over the player’s look until it is cleared', () => {
    fakeDevice(false);
    seed([{ id: 'a', theme: 'pink' }]);
    const { result } = renderHook(() => useProfile(), { wrapper });
    act(() => result.current.previewTheme('night'));
    expect(look()).toBe('night');
    act(() => result.current.previewTheme(null));
    expect(look()).toBe('pink');
  });

  it("leaves the screen's look alone in the audit sandbox", () => {
    fakeDevice(false);
    document.documentElement.dataset.theme = 'pink';
    renderHook(() => useProfile(), {
      wrapper: ({ children }: { children: ReactNode }) => <ProfileProvider ephemeral>{children}</ProfileProvider>,
    });
    expect(look()).toBe('pink');
  });
});

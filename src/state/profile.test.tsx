import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ProfileProvider, useProfile } from './profile';
import { localProfileStore } from './storage';

function renderProfile() {
  return renderHook(() => useProfile(), { wrapper: ProfileProvider });
}

beforeEach(() => {
  localStorage.clear();
});

describe('ProfileProvider / useProfile', () => {
  it('throws when used outside a ProfileProvider', () => {
    expect(() => renderHook(() => useProfile())).toThrow(
      'useProfile must be used within ProfileProvider',
    );
  });

  it('starts with no children and a null active id', () => {
    const { result } = renderProfile();
    expect(result.current.children).toEqual([]);
    expect(result.current.activeChild).toBeNull();
    expect(result.current.name).toBe('');
    expect(result.current.stars).toBe(0);
  });

  it('adds a child, makes it active, and persists to storage', () => {
    const { result } = renderProfile();

    let id = '';
    act(() => {
      id = result.current.addChild('Aino', '🦊');
    });

    expect(result.current.activeId).toBe(id);
    expect(result.current.activeChild).toMatchObject({ name: 'Aino', avatar: '🦊', stars: 0 });
    expect(localProfileStore.load().children).toHaveLength(1);
  });

  it('addStars and setLevel update only the active child', () => {
    const { result } = renderProfile();

    act(() => {
      result.current.addChild('Aino');
    });
    act(() => {
      result.current.addChild('Veikko');
    });
    // Veikko is now active (last added).
    act(() => {
      result.current.addStars(3);
      result.current.setLevel(2);
    });

    expect(result.current.stars).toBe(3);
    expect(result.current.level).toBe(2);
    const aino = result.current.children.find((c) => c.name === 'Aino');
    expect(aino?.stars).toBe(0);
    expect(aino?.level).toBe(1);
  });

  it('switchChild moves the active pointer between existing children', () => {
    const { result } = renderProfile();

    let ainoId = '';
    act(() => {
      ainoId = result.current.addChild('Aino');
    });
    act(() => {
      result.current.addChild('Veikko');
    });
    act(() => {
      result.current.switchChild(ainoId);
    });

    expect(result.current.activeId).toBe(ainoId);
    expect(result.current.name).toBe('Aino');
  });

  it('ignores switchChild to an unknown id', () => {
    const { result } = renderProfile();
    let ainoId = '';
    act(() => {
      ainoId = result.current.addChild('Aino');
    });
    act(() => {
      result.current.switchChild('does-not-exist');
    });
    expect(result.current.activeId).toBe(ainoId);
  });

  it('removeChild falls back to another child, or null if none remain', () => {
    const { result } = renderProfile();

    let ainoId = '';
    let veikkoId = '';
    act(() => {
      ainoId = result.current.addChild('Aino');
    });
    act(() => {
      veikkoId = result.current.addChild('Veikko');
    });

    act(() => {
      result.current.removeChild(veikkoId);
    });
    expect(result.current.activeId).toBe(ainoId);
    expect(result.current.children).toHaveLength(1);

    act(() => {
      result.current.removeChild(ainoId);
    });
    expect(result.current.activeId).toBeNull();
    expect(result.current.children).toHaveLength(0);
  });

  it('recordRound accumulates per-topic, per-activity progress', () => {
    const { result } = renderProfile();
    act(() => {
      result.current.addChild('Aino');
    });

    act(() => {
      result.current.recordRound('animals', 'listen', 4, 6);
    });
    act(() => {
      result.current.recordRound('animals', 'listen', 6, 6);
    });

    const entry = result.current.activeChild?.progress.animals?.listen;
    expect(entry).toMatchObject({
      plays: 2,
      bestStars: 6,
      totalStars: 10,
      totalPossible: 12,
    });
  });

  it('recordAttempt builds per-item SRS state on the active child', () => {
    const { result } = renderProfile();
    act(() => {
      result.current.addChild('Aino');
    });

    act(() => {
      result.current.recordAttempt('cat', true);
    });
    let cat = result.current.activeChild?.srs.cat;
    expect(cat).toMatchObject({ seen: 1, correct: 1, box: 2 });

    act(() => {
      result.current.recordAttempt('cat', false);
    });
    cat = result.current.activeChild?.srs.cat;
    // a miss drops it back to box 1 but the attempt counts are cumulative
    expect(cat).toMatchObject({ seen: 2, correct: 1, box: 1 });
  });

  it('updateSettings merges a partial patch', () => {
    const { result } = renderProfile();
    act(() => {
      result.current.updateSettings({ muted: true });
    });
    expect(result.current.settings).toEqual({ muted: true, reducedMotion: false });
  });

  it('resetAll clears every child and settings back to defaults', () => {
    const { result } = renderProfile();
    act(() => {
      result.current.addChild('Aino');
      result.current.updateSettings({ muted: true });
    });
    act(() => {
      result.current.resetAll();
    });
    expect(result.current.children).toEqual([]);
    expect(result.current.activeId).toBeNull();
    expect(result.current.settings).toEqual({ muted: false, reducedMotion: false });
  });
});

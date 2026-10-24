import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../audio/speak', () => ({ speak: vi.fn(), speakEnglish: vi.fn(), stopSpeaking: vi.fn() }));

import { ProfileProvider } from '../state/profile';
import TogetherCard from './TogetherCard';
import { speak } from '../audio/speak';
import { canRecord } from '../audio/record';

function seed(together: boolean) {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [{ id: 'k', name: 'K', avatar: '🦊', level: 1, stars: 0, createdAt: 1, progress: {}, srs: {} }],
      activeId: 'k',
      settings: { muted: false, reducedMotion: false, together },
    }),
  );
}

const prompt = { en: 'Say this line together:', fi: 'Hei! Minä olen Aino.' };

describe('a card for the grown-up', () => {
  beforeEach(() => localStorage.clear());

  it('shows only in Together mode, with its Finnish line to hear', () => {
    seed(true);
    render(
      <ProfileProvider>
        <TogetherCard prompt={prompt} />
      </ProfileProvider>,
    );
    expect(screen.getByText('Say this line together:')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Listen: Hei! Minä olen Aino./ }));
    expect(speak).toHaveBeenCalledWith('Hei! Minä olen Aino.');
  });

  it('is not there otherwise', () => {
    seed(false);
    const r = render(
      <ProfileProvider>
        <TogetherCard prompt={prompt} />
      </ProfileProvider>,
    );
    expect(r.container.textContent).toBe('');
  });
});

describe('hearing yourself', () => {
  it('needs a recorder: without one (as here) the button never shows', () => {
    expect(canRecord()).toBe(false);
  });
});

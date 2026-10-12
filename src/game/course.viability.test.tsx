import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { cloneElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileProvider } from '../state/profile';
import { ActivityContext } from './activityContext';
import { difficultyFor } from './adapt';
import { allSkills, activitiesUpTo, renderActivity } from './path';

vi.mock('../audio/speak', () => ({
  speak: vi.fn(),
  speakEnglish: vi.fn(),
  stopSpeaking: vi.fn(),
  isSpeechAvailable: () => true,
}));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

afterEach(cleanup);

// Every course step, at every level of its ladder, for every game it unlocks
// there, must serve a REAL question — the word allocation across units is
// what makes a step playable (enough scoped words for distractors, places
// with the right tags, verbs for the tense…), so a gap anywhere shows up here
// as an empty round (the games complete an empty segment immediately).
describe('every course step is playable at every level', () => {
  it(
    'renders a real question (never an empty round)',
    async () => {
      const failures: string[] = [];
      for (const { chapter, skill } of allSkills()) {
        for (let level = 1; level <= (skill.maxLevel ?? 4); level++) {
          for (const kind of activitiesUpTo(skill, level)) {
            const el = renderActivity(skill, kind, () => {});
            if (!el) {
              failures.push(`${skill.id} L${level} ${kind}: no element`);
              continue;
            }
            const onSegmentComplete = vi.fn();
            const { container, unmount } = render(
              <MemoryRouter>
                <ProfileProvider ephemeral>
                  <ActivityContext.Provider
                    value={{
                      onSegmentComplete,
                      difficulty: { ...difficultyFor(level), ...skill.pin },
                      sessionStars: 0,
                      lessonId: chapter.lessonId,
                    }}
                  >
                    {cloneElement(el)}
                  </ActivityContext.Provider>
                </ProfileProvider>
              </MemoryRouter>,
            );
            await act(async () => {});
            const emptyRound = onSegmentComplete.mock.calls.some(([, total]) => total === 0);
            // A question shows SOME answer control beyond the header's back button.
            const controls = container.querySelectorAll(
              '.word-tile, .card-grid button, .spell-input, .reply-tile, .story-cover, .error-word, .count-scene, button.btn--primary, .yesno-tiles button',
            );
            if (emptyRound || controls.length === 0) {
              failures.push(
                `${skill.id} L${level} ${kind}: ${emptyRound ? 'empty round' : 'no answer controls'}`,
              );
            }
            unmount();
          }
        }
      }
      expect(failures).toEqual([]);
    },
    240_000,
  );
});

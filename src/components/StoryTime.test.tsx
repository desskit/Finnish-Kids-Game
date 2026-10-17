import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileProvider, useProfile } from '../state/profile';
import { ActivityContext } from '../game/activityContext';
import { difficultyFor } from '../game/adapt';
import { storyById } from '../content/stories';

// A fixed quiz for "Missä hattu on?" so each question kind is scripted.
const fx = vi.hoisted(() => ({ calls: [] as { n: number; avoid: string[] }[] }));

vi.mock('../game/storyQuiz', () => ({
  drawQuiz: (story: { pages: { scene: unknown; lines: { fi: string; en: string }[] }[] }, n: number, avoid: string[] = []) => {
    fx.calls.push({ n, avoid });
    const choice = {
      kind: 'choice',
      id: 'c0',
      promptFi: 'Kenellä on hattu?',
      promptEn: 'Who has the hat?',
      options: [
        { fi: 'Mirrillä', en: 'Mirri', emoji: '🐱', correct: true },
        { fi: 'äidillä', en: 'Mom', emoji: '👩' },
      ],
    };
    const tf = { kind: 'truefalse', id: 't0', fi: 'Eerolla on lakki.', en: 'Eero has a cap.', answer: true };
    const who = {
      kind: 'who',
      id: 'w1-1',
      line: { fi: 'Onko Eerolla hattu?', en: 'Does Eero have a hat?', by: 'aiti' },
      speaker: 'aiti',
      options: ['aiti', 'aino', 'eero'],
    };
    const order = {
      kind: 'order',
      id: 'order',
      cards: [0, 1, 2].map((page) => ({ page, scene: story.pages[page].scene, line: story.pages[page].lines[0] })),
    };
    return n === 2 ? [choice, tf] : [choice, tf, who, order];
  },
}));
vi.mock('../util/shuffle', () => ({
  shuffle: <T,>(a: readonly T[]) => [...a].reverse(),
  sample: <T,>(a: readonly T[], n: number) => a.slice(0, n),
}));
vi.mock('../audio/speak', () => ({ speak: vi.fn(), stopSpeaking: vi.fn(), isSpeechAvailable: () => true }));
vi.mock('../audio/sfx', () => ({ playDing: vi.fn() }));

import StoryTime from './StoryTime';
import { speak } from '../audio/speak';

function seedChild(stories?: Record<string, unknown>) {
  localStorage.setItem(
    'fkg.profiles.v2',
    JSON.stringify({
      version: 2,
      children: [
        {
          id: 'k',
          name: 'K',
          avatar: '🦊',
          level: 1,
          stars: 0,
          createdAt: 1,
          progress: {},
          srs: {},
          ...(stories ? { course: { stories } } : {}),
        },
      ],
      activeId: 'k',
      settings: { muted: false, reducedMotion: false },
    }),
  );
}

function StarsProbe() {
  const { stars } = useProfile();
  return <output data-testid="stars">{stars}</output>;
}

const onSegmentComplete = vi.fn();

function renderStory(props: Partial<Parameters<typeof StoryTime>[0]> = {}, withContext = true) {
  const story = <StoryTime onExit={vi.fn()} ids={['no-hat']} {...props} />;
  return render(
    <MemoryRouter>
      <ProfileProvider>
        {withContext ? (
          <ActivityContext.Provider value={{ onSegmentComplete, difficulty: difficultyFor(1), sessionStars: 0 }}>
            {story}
          </ActivityContext.Provider>
        ) : (
          story
        )}
        <StarsProbe />
      </ProfileProvider>
    </MemoryRouter>,
  );
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const click = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const STORY = storyById['no-hat'];

/** Read through every page to "Loppu!". */
function readToEnd() {
  click(/lue/i);
  for (let i = 0; i < STORY.pages.length; i++) click(/seuraava sivu|loppu/i);
}

/** Answer the scripted quiz, every answer right the first time. */
async function answerAllRight() {
  fireEvent.click(screen.getByText('Mirrillä').closest('button')!);
  await advance(1200);
  click(/totta true/i);
  await advance(1200);
  fireEvent.click(screen.getByText('Äiti').closest('button')!);
  await advance(1200);
  // Tap the three page cards in story order.
  for (const p of [0, 1, 2]) fireEvent.click(screen.getByText(STORY.pages[p].lines[0].fi).closest('button')!);
  await advance(1200);
}

beforeEach(() => {
  localStorage.clear();
  seedChild();
  vi.clearAllMocks();
  fx.calls = [];
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('StoryTime (the picture book)', () => {
  it('opens on a cover with the title and who is in it', () => {
    renderStory();
    expect(screen.getByRole('heading', { name: 'Missä hattu on?' })).toBeInTheDocument();
    expect(screen.getByText('Aino')).toBeInTheDocument();
    expect(speak).toHaveBeenCalledWith('Missä hattu on?');
  });

  it('reads each page aloud, line by line, lighting up the line being read', async () => {
    renderStory();
    click(/lue/i);
    const first = STORY.pages[0].lines[0];
    // (Each word is its own tappable button, so compare the whole line's text.)
    expect(document.querySelector('.story-line__fi')?.textContent).toBe(first.fi);
    await advance(500);
    expect(speak).toHaveBeenCalledWith(first.fi, expect.objectContaining({ onEnd: expect.any(Function) }));
    expect(document.querySelector('.story-line--reading')).not.toBeNull();
    // With no "ended" from the voice, it moves on by itself.
    await advance(6000);
    expect(speak).toHaveBeenCalledWith(STORY.pages[0].lines[1].fi, expect.anything());
  });

  it('speaks a talking line in that character\'s voice, and shows who says it', async () => {
    renderStory();
    click(/lue/i);
    await advance(500);
    await advance(6000);
    const aino = STORY.pages[0].lines[1];
    expect(aino.by).toBe('aino');
    expect(speak).toHaveBeenCalledWith(aino.fi, expect.objectContaining({ pitch: 1.3 }));
    expect(document.querySelectorAll('.story-line--talk').length).toBeGreaterThan(0);
  });

  it('hides the English until peeked, and a tapped word shows what it means', () => {
    renderStory();
    click(/lue/i);
    expect(screen.queryByText(STORY.pages[0].lines[0].en)).not.toBeInTheDocument();
    click(/english/i);
    expect(screen.getByText(STORY.pages[0].lines[0].en)).toBeInTheDocument();
    click(/seuraava sivu/i);
    // Page 2: "Äiti! Minulla ei ole hattua!" — tap "hattua".
    fireEvent.click(screen.getAllByRole('button', { name: 'hattua' })[0]);
    const tip = document.querySelector('.story-tip');
    expect(tip).toHaveTextContent('hattua → hattu');
    expect(tip).toHaveTextContent('hat');
  });

  it('ends with "Loppu!", then asks its questions; a good read is recorded and stays for its result', async () => {
    renderStory();
    readToEnd();
    expect(screen.getByText('Loppu!', { exact: false })).toBeInTheDocument();
    click(/kysymykset/i);
    expect(screen.getByText('Kenellä on hattu?', { exact: false })).toBeInTheDocument();
    await answerAllRight();
    expect(onSegmentComplete).toHaveBeenCalledWith(4, 4, {
      story: { id: 'no-hat', asked: ['c0', 't0', 'w1-1', 'order'] },
      stay: true,
    });
    expect(screen.getByText('Hienoa!', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('4 / 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /jatka/i })).toBeInTheDocument();
    expect(screen.getByTestId('stars')).toHaveTextContent('4');
  });

  it('a wrong tap buzzes and costs the first try, but the question waits for the right answer', async () => {
    renderStory();
    readToEnd();
    click(/kysymykset/i);
    fireEvent.click(screen.getByText('äidillä').closest('button')!);
    expect(screen.getByText('Kenellä on hattu?', { exact: false })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Mirrillä').closest('button')!);
    await advance(1200);
    click(/tarua false/i); // wrong
    click(/totta true/i);
    await advance(1200);
    fireEvent.click(screen.getByText('Aino').closest('button')!); // wrong
    fireEvent.click(screen.getByText('Äiti').closest('button')!);
    await advance(1200);
    // Tapping a later page first is a slip too.
    fireEvent.click(screen.getByText(STORY.pages[2].lines[0].fi).closest('button')!);
    for (const p of [0, 1, 2]) fireEvent.click(screen.getByText(STORY.pages[p].lines[0].fi).closest('button')!);
    await advance(1200);
    expect(onSegmentComplete).toHaveBeenCalledWith(0, 4, expect.objectContaining({ stay: true }));
    // A weak read: read it again, this time with the English — and other questions.
    // Nothing right first time is a good try, not "almost".
    expect(screen.getByText('Hyvä yritys!', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText('Melkein!', { exact: false })).not.toBeInTheDocument();
    click(/lue uudestaan/i);
    expect(screen.getByText(STORY.pages[0].lines[0].en)).toBeInTheDocument();
  });

  it('a weak last read brings the English back, and asks other questions than last time', () => {
    seedChild({ 'no-hat': { reads: 1, last: 0.25, asked: ['c0', 't1'] } });
    renderStory();
    // Straight in with support: the English is showing on the first page.
    click(/lue/i);
    expect(screen.getByText(STORY.pages[0].lines[0].en)).toBeInTheDocument();
    for (let i = 0; i < STORY.pages.length; i++) click(/seuraava sivu|loppu/i);
    click(/kysymykset/i);
    expect(fx.calls[fx.calls.length - 1]).toEqual({ n: 4, avoid: ['c0', 't1'] });
  });

  it('from the bookshelf it is just the book: no questions at the end', () => {
    renderStory({ mode: 'free', storyId: 'no-hat', ids: undefined }, false);
    readToEnd();
    expect(screen.queryByRole('button', { name: /kysymykset/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kirjahylly/i })).toBeInTheDocument();
  });

  it('"Muistatko?" asks two questions it has not asked before, then hands back to the warm-up', async () => {
    seedChild({ 'no-hat': { reads: 1, goodAt: 1, last: 1, seen: ['c1', 't2'] } });
    renderStory({ mode: 'revisit', storyId: 'no-hat', ids: undefined });
    expect(screen.getByText('Muistatko?', { exact: false })).toBeInTheDocument();
    click(/^kysymykset/i);
    expect(fx.calls[fx.calls.length - 1]).toEqual({ n: 2, avoid: ['c1', 't2'] });
    fireEvent.click(screen.getByText('Mirrillä').closest('button')!);
    await advance(1200);
    click(/totta true/i);
    await advance(1200);
    expect(onSegmentComplete).toHaveBeenCalledWith(2, 2, { story: { id: 'no-hat', asked: ['c0', 't0'] } });
  });
});

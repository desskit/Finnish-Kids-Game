import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ProfileProvider } from '../../state/profile';
import type { Child, ProfilesData } from '../../state/storage';
import { ActivityContext } from '../../game/activityContext';
import { difficultyFor } from '../../game/adapt';
import { UNITS } from '../../game/course';
import { MATH_STAGES } from '../../game/mathPath';
import { countdown, problemFor, wordProblemFor, type MathProblem, type MathSet } from '../../game/math';
import { WORD_FRAMES } from '../../content/mathProblems';
import { itemById } from '../../content/lookup';
import { MATH_STORIES } from '../../content/mathStories';
import { lessonById } from '../../content/lessons';
import { SPEAK_INTRO_KEY } from '../SayIt';
import StoryTime from '../StoryTime';
import LessonView from '../LessonView';
import RewardToast from '../RewardToast';
import MathQuiz, { type MathAnswerMode } from './MathQuiz';
import { MathScene, type MathGame } from './MathScenes';
import MathHome from './MathHome';
import MathCard from './MathCard';

// The math section's promise: no shortcut through English. Not one digit on
// any math screen — no numeral in the text, no number tile, no picture that
// draws one — and no English number word either. Every screen is rendered
// here, before and after answering, at every level and in every way to answer.

/** Pictures that draw numerals (the number tile, "100", "1 2 3", calendars). */
const DIGIT_PICTURES = new Set(['tile', 'hundred-points', 'one-two-three', 'calendar', 'spiral-calendar']);
const ENGLISH_NUMBERS =
  /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\b/i;

function expectNoNumbers(root: HTMLElement, where: string) {
  const text = root.textContent ?? '';
  expect(text.match(/.{0,30}\d.{0,30}/)?.[0], `${where}: a digit on screen`).toBeUndefined();
  expect(text.match(ENGLISH_NUMBERS)?.[0], `${where}: an English number word`).toBeUndefined();
  const pictures = [...root.querySelectorAll('[data-art]')].map((e) => e.getAttribute('data-art')!);
  expect(pictures.filter((p) => DIGIT_PICTURES.has(p)), `${where}: a picture of a digit`).toEqual([]);
}

const passed = { passedAt: 1, best: 1, attempts: 1 };

/** A player well into the course (every unit up to the verbs), with everything unlocked. */
function seed(over: Partial<Child> = {}, unlockAll = true): ProfilesData {
  const upTo = UNITS.slice(0, UNITS.findIndex((u) => u.id === 'doing') + 1);
  const child = {
    id: 'k',
    name: 'Aino',
    avatar: '🦊',
    level: 1,
    stars: 0,
    createdAt: 1,
    progress: {},
    srs: {},
    course: { checkpoints: Object.fromEntries(upTo.map((u) => [u.id, passed])) },
    ...over,
  } as Child;
  return { version: 2, children: [child], activeId: 'k', settings: { muted: true, reducedMotion: true, unlockAll } };
}

function Harness({ children, level = 1, data = seed() }: { children: ReactNode; level?: number; data?: ProfilesData }) {
  return (
    <ProfileProvider ephemeral seed={data}>
      <MemoryRouter>
        <ActivityContext.Provider value={{ onSegmentComplete: () => {}, difficulty: difficultyFor(level), sessionStars: 0 }}>
          {children}
        </ActivityContext.Provider>
      </MemoryRouter>
    </ProfileProvider>
  );
}

/** Answer the problem on screen however this game asks, until it's answered. */
function answer(r: RenderResult, mode: MathAnswerMode) {
  const answered = () => !!r.container.querySelector('.math-tell');
  if (mode === 'type') {
    fireEvent.click(r.getByRole('button', { name: /Ohita/ }));
    return;
  }
  if (mode === 'say') {
    // no recognizer here: a try isn't heard, and a grown-up vouches for it
    fireEvent.click(r.container.querySelector('.mic-button')!);
    fireEvent.click(r.getByText('Sanoin sen'));
    return;
  }
  for (let i = 0; i < 12 && !answered(); i++) {
    const choice = [...r.container.querySelectorAll<HTMLButtonElement>('.math-choice, button.math-pan')].find((b) => !b.disabled);
    if (!choice) break;
    fireEvent.click(choice);
    // a choice only heard: the first tap says it, the second picks it
    if (!answered() && choice.className.includes('picked')) fireEvent.click(choice);
  }
}

const GAMES: { game: MathGame; sets: MathSet[] }[] = [
  { game: 'tree', sets: ['sums-10'] },
  { game: 'listen', sets: ['sums-10', 'neighbors-12', 'word', 'sums-20'] },
  { game: 'scale', sets: ['compare-12'] },
  { game: 'train', sets: ['run-12', 'run-20'] },
  { game: 'word', sets: ['word'] },
  { game: 'build', sets: ['teens'] },
  { game: 'quick', sets: ['sums-10'] },
];

describe('no digits in the math games', () => {
  beforeEach(() => localStorage.setItem(SPEAK_INTRO_KEY, '1'));

  for (const { game, sets } of GAMES) {
    for (const set of sets) {
      for (const level of [1, 2, 3, 4]) {
        it(`${game} (${set}), tapped, level ${level}`, () => {
          for (let run = 0; run < 3; run++) {
            const r = render(
              <Harness level={level}>
                <MathQuiz set={set} game={game} title="Peli" onExit={() => {}} />
              </Harness>,
            );
            expectNoNumbers(r.container, `${game} ${set} L${level}, asked`);
            answer(r, 'tap');
            expect(r.container.querySelector('.math-tell'), `${game} ${set} L${level}: answered`).not.toBeNull();
            expectNoNumbers(r.container, `${game} ${set} L${level}, answered`);
            r.unmount();
          }
        });
      }
      for (const mode of ['say', 'type'] as const) {
        it(`${game} (${set}), ${mode === 'say' ? 'said' : 'typed'}`, () => {
          const r = render(
            <Harness level={2}>
              <MathQuiz set={set} game={game} title="Peli" answer={mode} onExit={() => {}} />
            </Harness>,
          );
          expectNoNumbers(r.container, `${game} ${set} ${mode}, asked`);
          answer(r, mode);
          expect(r.container.querySelector('.math-tell')).not.toBeNull();
          expectNoNumbers(r.container, `${game} ${set} ${mode}, answered`);
        });
      }
    }
  }

  it('the mic notice before the first spoken answer', () => {
    localStorage.removeItem(SPEAK_INTRO_KEY);
    const r = render(
      <Harness level={2}>
        <MathQuiz set="sums-10" game="listen" title="Peli" answer="say" onExit={() => {}} />
      </Harness>,
    );
    expect(r.getByText(/Puheharjoittelu/)).toBeInTheDocument();
    expectNoNumbers(r.container, 'the mic notice');
  });

  it('a typed digit is never shown back, only a nudge to write it in Finnish', () => {
    const r = render(
      <Harness level={2}>
        <MathQuiz set="sums-10" game="listen" title="Peli" answer="type" onExit={() => {}} />
      </Harness>,
    );
    fireEvent.change(r.getByRole('textbox'), { target: { value: '7' } });
    expect(r.getByText(/Kirjoita suomeksi/)).toBeInTheDocument();
    expect(r.container.querySelector('.math-tell')).toBeNull();
    expectNoNumbers(r.container, 'after typing a digit');
  });
});

describe('no digits in the scenes, whatever the problem', () => {
  const problems: [MathGame, MathProblem][] = [
    ['train', countdown(3)],
    ['build', problemFor('teens', { optionCount: 3, rng: () => 0.9 })],
    ['scale', problemFor('compare-12', { optionCount: 2 })],
    ...WORD_FRAMES.map((f): [MathGame, MathProblem] => ['word', wordProblemFor(f, itemById(f.edible ? 'cookie' : 'ball')!, 6, 2, [3, 4, 8])]),
  ];
  for (const [game, q] of problems) {
    it(`${game}: ${q.key}`, () => {
      for (const answered of [false, true]) {
        for (const wordsShown of [false, true]) {
          const r = render(
            <Harness>
              <MathScene game={game} q={q} answered={answered} wordsShown={wordsShown} countable={false} avatar="🦊" />
            </Harness>,
          );
          expectNoNumbers(r.container, `${game} ${q.key} answered=${answered} words=${wordsShown}`);
          r.unmount();
        }
      }
    });
  }
});

describe('no digits around the games', () => {
  it('the math map, every stage opened', () => {
    const r = render(
      <Harness data={seed({ course: { ...seed().children[0].course, lessonsSeen: { 'math-plus-minus': 1 } }, math: { crowns: { 'math-plus-minus': passed } } })}>
        <MathHome />
      </Harness>,
    );
    for (const head of r.container.querySelectorAll<HTMLButtonElement>('.unit__head[aria-expanded="false"]')) fireEvent.click(head);
    expect(r.container.querySelectorAll('.unit--open').length).toBe(MATH_STAGES.length);
    expectNoNumbers(r.container, 'the math map');
  });

  it('the home card, before math opens and once it has', () => {
    const fresh = seed({ course: {} }, false);
    const r = render(
      <Harness data={fresh}>
        <MathCard />
      </Harness>,
    );
    expectNoNumbers(r.container, 'the closed home card');
    r.unmount();
    const open = render(
      <Harness data={seed({}, false)}>
        <MathCard />
      </Harness>,
    );
    expect(open.getByText('Uusi')).toBeInTheDocument();
    expectNoNumbers(open.container, 'the home card with a new stage');
  });

  it('a level-up while doing math says its level in Finnish', () => {
    const r = render(<RewardToast outcome={{ leveledUp: true, level: 3, newBadges: [] }} math onDismiss={() => {}} />);
    expect(r.getByText(/Uusi taso kolme!/)).toBeInTheDocument();
    expectNoNumbers(r.container, 'the reward toast');
  });

  for (const story of MATH_STORIES) {
    it(`the story "${story.titleFi}", read through and answered`, () => {
      const r = render(
        <Harness>
          <StoryTime ids={[story.id]} onExit={() => {}} />
        </Harness>,
      );
      expectNoNumbers(r.container, `${story.id}: cover`);
      fireEvent.click(r.getByText(/^Lue$/));
      for (let p = 0; p < story.pages.length; p++) {
        // tap every number word: its tip is dots
        for (const word of r.container.querySelectorAll<HTMLButtonElement>('.story-word')) fireEvent.click(word);
        expectNoNumbers(r.container, `${story.id}: page ${p}`);
        fireEvent.click(r.container.querySelector('.story-nav--next')!);
      }
      expectNoNumbers(r.container, `${story.id}: the end`);
      fireEvent.click(r.getByText(/^Kysymykset/));
      for (let i = 0; i < 40 && !r.container.querySelector('.story-result'); i++) {
        expectNoNumbers(r.container, `${story.id}: a question`);
        const option = [...r.container.querySelectorAll<HTMLButtonElement>('.pic-card, .tf-button, .order-card')].find((b) => !b.disabled);
        if (option) fireEvent.click(option);
        else break;
      }
      expectNoNumbers(r.container, `${story.id}: the result`);
    });
  }

  for (const stage of MATH_STAGES) {
    it(`the lesson "${stage.titleFi}", every card`, () => {
      const lesson = lessonById[stage.lessonId];
      expect(lesson, stage.lessonId).toBeTruthy();
      const r = render(
        <Harness>
          <LessonView lesson={lesson} onDone={() => {}} onClose={() => {}} />
        </Harness>,
      );
      for (let i = 0; i < lesson.cards.length; i++) {
        expectNoNumbers(r.container, `${lesson.id}: card ${i}`);
        const option = r.container.querySelector<HTMLButtonElement>('.lesson-check__option');
        if (option) {
          fireEvent.click(option);
          expectNoNumbers(r.container, `${lesson.id}: card ${i}, answered`);
        }
        const next = r.queryByText(/^Seuraava/);
        if (next) fireEvent.click(next);
      }
    });
  }
});

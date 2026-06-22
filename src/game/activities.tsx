import type { ReactElement } from 'react';
import type { Theme, Tier } from '../content';
import { numbers, adjectives, verbs } from '../content';
import ListenAndTap from '../components/ListenAndTap';
import BuildAPhrase from '../components/BuildAPhrase';
import CountAndSay from '../components/CountAndSay';
import MatchTheWord from '../components/MatchTheWord';
import ConjugateVerb from '../components/ConjugateVerb';
import WordOrder from '../components/WordOrder';
import SpellWord from '../components/SpellWord';

// Activity registry — the single declarative source of truth for the mini-games.
//
// This replaces the per-game gating that used to be hardcoded across HomeScreen
// (canBuild / canCount / canMatch) and App.tsx (the flat `Screen` switch). The
// topic hub renders the activities a topic `supports()`, and the router maps a
// `:activityId` to its `render()`. New activities plug in here with no router or
// shell edits — the round builders already live in `src/game/round.ts`.

export interface ActivityDescriptor {
  /** Stable id used in the URL: /topic/:topicId/:id */
  id: string;
  titleFi: string;
  titleEn: string;
  /** Placeholder icon — swapped for real art (Phase 1) via <Illustration>. */
  emoji: string;
  /** Difficulty tier (informational today; gates content once progress lands). */
  tier: Tier;
  /** Whether this activity applies to a given topic. */
  supports: (theme: Theme) => boolean;
  /** Render the activity, wired to the topic + the global content pools. */
  render: (theme: Theme, onExit: () => void) => ReactElement;
}

export const ACTIVITIES: ActivityDescriptor[] = [
  {
    id: 'listen',
    titleFi: 'Kuuntele ja osoita',
    titleEn: 'Listen & Tap',
    emoji: '🔊',
    tier: 1,
    supports: (t) => t.items.length > 0,
    render: (t, onExit) => <ListenAndTap items={t.items} onExit={onExit} />,
  },
  {
    id: 'build',
    titleFi: 'Rakenna lause',
    titleEn: 'Build a Phrase',
    emoji: '🧩',
    tier: 2,
    supports: (t) => t.constructions.length > 0,
    render: (t, onExit) => (
      <BuildAPhrase items={t.items} constructions={t.constructions} onExit={onExit} />
    ),
  },
  {
    id: 'count',
    titleFi: 'Laske ja sano',
    titleEn: 'Count & Say',
    emoji: '🔢',
    tier: 2,
    supports: (t) => t.countable === true,
    render: (t, onExit) => (
      <CountAndSay nouns={t.items} numbers={numbers.items} onExit={onExit} />
    ),
  },
  {
    id: 'match',
    titleFi: 'Yhdistä sanat',
    titleEn: 'Match the Words',
    emoji: '🎨',
    tier: 2,
    // Agreement pairs the global adjectives with this topic's nouns, so it needs
    // a countable noun topic (same requirement as Count & Say).
    supports: (t) => t.countable === true,
    render: (t, onExit) => (
      <MatchTheWord adjectives={adjectives.items} nouns={t.items} onExit={onExit} />
    ),
  },
  {
    id: 'conjugate',
    titleFi: 'Taivuta verbi',
    titleEn: 'Conjugate the Verb',
    emoji: '🏃',
    tier: 3,
    // Verbs are a global pool, not tied to a noun topic — available everywhere
    // (Phase 3 may promote verbs into their own map unit).
    supports: () => verbs.items.length > 0,
    render: (_t, onExit) => <ConjugateVerb verbs={verbs.items} onExit={onExit} />,
  },
  {
    id: 'order',
    titleFi: 'Järjestä sanat',
    titleEn: 'Word Order',
    emoji: '🔀',
    tier: 3,
    supports: (t) => t.constructions.length > 0,
    render: (t, onExit) => (
      <WordOrder items={t.items} constructions={t.constructions} onExit={onExit} />
    ),
  },
  {
    id: 'spell',
    titleFi: 'Kirjoita sana',
    titleEn: 'Spelling',
    emoji: '⌨️',
    tier: 3,
    supports: (t) => t.items.length > 0,
    render: (t, onExit) => <SpellWord items={t.items} onExit={onExit} />,
  },
];

export function activityById(id: string): ActivityDescriptor | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}

export function activitiesForTheme(theme: Theme): ActivityDescriptor[] {
  return ACTIVITIES.filter((a) => a.supports(theme));
}

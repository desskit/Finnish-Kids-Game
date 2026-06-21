import type { Theme } from './types';

// Theme: Animals / Eläimet.
// All Finnish is hand-written, dictionary (nominative) forms.
// Emoji are placeholder art only.
export const animals: Theme = {
  id: 'animals',
  fi: 'Eläimet',
  en: 'Animals',
  emoji: '🐾',
  items: [
    { id: 'cat', fi: 'kissa', en: 'cat', emoji: '🐱', tier: 1 },
    { id: 'dog', fi: 'koira', en: 'dog', emoji: '🐶', tier: 1 },
    { id: 'bear', fi: 'karhu', en: 'bear', emoji: '🐻', tier: 1 },
    { id: 'bunny', fi: 'pupu', en: 'bunny', emoji: '🐰', tier: 1 },
    { id: 'bird', fi: 'lintu', en: 'bird', emoji: '🐦', tier: 1 },
    { id: 'fish', fi: 'kala', en: 'fish', emoji: '🐟', tier: 1 },
    { id: 'horse', fi: 'hevonen', en: 'horse', emoji: '🐴', tier: 1 },
    { id: 'cow', fi: 'lehmä', en: 'cow', emoji: '🐮', tier: 1 },
  ],
};

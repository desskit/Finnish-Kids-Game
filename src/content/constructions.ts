import type { Construction } from './types';

// High-frequency carrier phrases for the Animals theme.
// In all three of these, the animal noun stays in the nominative, so each
// authored `form` matches the dictionary form — but it is still stored as data
// (not computed) so that constructions needing other cases can hold their own
// correct, hand-written forms without any code change.
export const constructions: Construction[] = [
  {
    id: 'this-is',
    prefix: 'Tämä on',
    suffix: '.',
    en: 'This is ___.',
    tier: 2,
    fills: [
      { itemId: 'cat', form: 'kissa' },
      { itemId: 'dog', form: 'koira' },
      { itemId: 'bear', form: 'karhu' },
      { itemId: 'bunny', form: 'pupu' },
      { itemId: 'bird', form: 'lintu' },
      { itemId: 'fish', form: 'kala' },
      { itemId: 'horse', form: 'hevonen' },
      { itemId: 'cow', form: 'lehmä' },
    ],
  },
  {
    id: 'where-is',
    prefix: 'Missä on',
    suffix: '?',
    en: 'Where is the ___?',
    tier: 2,
    fills: [
      { itemId: 'cat', form: 'kissa' },
      { itemId: 'dog', form: 'koira' },
      { itemId: 'bear', form: 'karhu' },
      { itemId: 'bunny', form: 'pupu' },
      { itemId: 'bird', form: 'lintu' },
      { itemId: 'fish', form: 'kala' },
      { itemId: 'horse', form: 'hevonen' },
      { itemId: 'cow', form: 'lehmä' },
    ],
  },
  {
    id: 'i-have',
    prefix: 'Minulla on',
    suffix: '.',
    en: 'I have a ___.',
    tier: 2,
    fills: [
      { itemId: 'cat', form: 'kissa' },
      { itemId: 'dog', form: 'koira' },
      { itemId: 'bunny', form: 'pupu' },
      { itemId: 'fish', form: 'kala' },
      { itemId: 'horse', form: 'hevonen' },
    ],
  },
];

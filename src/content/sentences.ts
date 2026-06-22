import type { SentenceConstruction } from './types';

// Advanced multi-slot sentence templates — the content for the final "Full
// sentences" chapter. INTENTIONALLY EMPTY for now: the type + builder + path
// node are all wired (see src/game/round.ts `buildSentenceRound` and
// src/game/path.tsx), so adding a template here makes a playable node appear on
// the map with no other code changes. See docs/CONTENT_GUIDE.md for the authoring
// guide and worked examples.
//
// Worked example you could drop in (every form is looked up from the sourced
// tables — never generated, so the chosen words must have the needed inflections):
//
//   {
//     id: 'give-recipient-object',
//     en: 'I give the dog a bone.',
//     tier: 4,
//     tokens: [{ slot: 'subject' }, { slot: 'verb' }, { slot: 'recipient' }, { slot: 'object' }],
//     slots: [
//       { id: 'subject', role: 'pronoun', fixedId: '1sg' },
//       { id: 'verb', role: 'verb', verbSlotForm: 'conjugated', tense: 'present',
//         polarity: 'positive', agreesWith: 'subject', fixedId: 'antaa' },
//       { id: 'recipient', role: 'noun', case: 'allative', number: 'singular', pool: 'nouns' },
//       { id: 'object', role: 'noun', case: 'genitive', number: 'singular', pool: 'nouns' },
//     ],
//     punct: '.',
//   }
//
// (Verb chains use two verb slots — one `conjugated`, one `infinitive`. An
//  adjective+noun object uses an adjective slot with `agreesWith` its noun slot.)

export const sentenceConstructions: SentenceConstruction[] = [];

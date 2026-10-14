// Rewards and badges (UI pictures: the badge strip and the reward toast show them at once).

import * as badges from '../badges.mjs';

const ui = { group: 'ui', theme: 'rewards' };

export default [
  { id: 'glowing-star', title: 'shining star (a great round, 500 stars)', glyphs: ['🌟'], ...ui, motion: { frames: 2, fps: 2 }, draw: badges.glowingStar },
  { id: 'medal', title: 'medal (achievements)', glyphs: ['🏅'], ...ui, motion: { frames: 2, fps: 1.5 }, draw: badges.medal },
  { id: 'gold-medal', title: 'gold medal (first)', glyphs: ['🥇'], ...ui, motion: { frames: 2, fps: 1.5 }, draw: badges.goldMedal },
  { id: 'hundred-points', title: '100 (big numbers)', glyphs: ['💯'], ...ui, draw: badges.hundred },
  { id: 'rocket', title: 'rocket (level up!)', glyphs: ['🚀'], ...ui, motion: { frames: 2, fps: 6 }, draw: badges.rocket },
  { id: 'sparkles', title: 'sparkles (flawless)', glyphs: ['✨'], ...ui, motion: { frames: 3, fps: 3 }, draw: badges.sparkles },
  { id: 'treasure-map', title: 'treasure map (halfway)', glyphs: ['🗺️'], ...ui, draw: badges.map },
  { id: 'crown', title: 'crown (50 words mastered)', glyphs: ['👑'], ...ui, motion: { frames: 2, fps: 2 }, draw: badges.crown },
  { id: 'target', title: 'target (sharp; wanting)', glyphs: ['🎯'], ...ui, motion: { frames: 2, fps: 6 }, draw: badges.target },
  { id: 'notebook', title: 'notebook (Vihko)', glyphs: ['📓'], ...ui, draw: badges.notebook },
  { id: 'light-bulb', title: 'light bulb (a tip, why?)', glyphs: ['💡'], ...ui, motion: { frames: 2, fps: 2 }, draw: badges.lightBulb },
  { id: 'keyboard', title: 'keyboard (typing)', glyphs: ['⌨️'], ...ui, draw: badges.keyboard },
  { id: 'abacus', title: 'abacus (counting)', glyphs: ['🧮'], ...ui, draw: badges.abacus },
  { id: 'ruler', title: 'ruler (one letter or two?)', glyphs: ['📏'], ...ui, draw: badges.ruler },
  { id: 'abc', title: 'abc (the alphabet)', glyphs: ['🔤'], ...ui, draw: badges.abc },
];

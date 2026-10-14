// The app's buttons and signs (UI pictures: there from the start).

import * as icons from '../icons.mjs';

const ui = { group: 'ui', theme: 'buttons' };

export default [
  { id: 'arrow-left', title: 'back (an arrow)', glyphs: ['⬅️'], ...ui, draw: icons.arrowLeft },
  { id: 'arrow-right', title: 'into, onward (an arrow)', glyphs: ['➡️'], ...ui, draw: icons.arrowRight },
  { id: 'arrow-up', title: 'load a file (an arrow up)', glyphs: ['⬆️'], ...ui, draw: icons.arrowUp },
  { id: 'arrow-down', title: 'save a file (an arrow down)', glyphs: ['⬇️'], ...ui, draw: icons.arrowDown },
  { id: 'play-button', title: 'continue, next page', glyphs: ['▶️'], ...ui, draw: (k) => icons.play(k) },
  { id: 'play-back', title: 'previous page', glyphs: ['◀️'], ...ui, draw: (k) => icons.play(k, true) },
  { id: 'reply', title: 'the reply (an arrow hooking round)', glyphs: ['↪️'], ...ui, draw: icons.reply },
  { id: 'add', title: 'add a player', glyphs: ['➕'], ...ui, draw: icons.add },
  { id: 'settings', title: 'settings (a cog)', glyphs: ['⚙️'], ...ui, draw: icons.settings },
  { id: 'bin', title: 'clear (a wastebasket)', glyphs: ['🗑️'], ...ui, draw: icons.bin },
  { id: 'done', title: 'done, passed (a tick)', glyphs: ['✅'], ...ui, draw: icons.done },
  { id: 'warning', title: 'careful (a warning sign)', glyphs: ['⚠️'], ...ui, draw: icons.warning },
  { id: 'again', title: 'review, again (arrows round a loop)', glyphs: ['🔁'], ...ui, draw: icons.again },
  { id: 'mix', title: 'mixed, changing (crossing arrows)', glyphs: ['🔀'], ...ui, draw: icons.mix },
  { id: 'magnifier', title: 'look closely (a magnifying glass)', glyphs: ['🔎'], ...ui, draw: icons.search },
  { id: 'into-box', title: 'into it (an arrow into a box)', glyphs: ['📥'], ...ui, draw: icons.intoBox },
  { id: 'new-sticker', title: 'new words (a NEW sticker)', glyphs: ['🆕'], ...ui, draw: icons.fresh },
  { id: 'sound-off', title: 'no sound', glyphs: ['🔇'], ...ui, draw: icons.soundOff },
  { id: 'sound-low', title: 'no Finnish voice (a quiet speaker)', glyphs: ['🔈'], ...ui, draw: icons.soundLow },
  { id: 'bar-chart', title: 'progress (a bar chart)', glyphs: ['📊'], ...ui, draw: icons.barChart },
  { id: 'line-chart', title: 'stats (a line going up)', glyphs: ['📈'], ...ui, draw: icons.lineChart },
  { id: 'people', title: 'players, who (two people)', glyphs: ['👥'], ...ui, draw: icons.people },
  { id: 'finland', title: "the Finnish check (Finland's flag)", glyphs: ['🇫🇮'], ...ui, draw: icons.finland },
  { id: 'thumbs-down', title: 'false (a thumbs down)', glyphs: ['👎'], ...ui, motion: { frames: 2, fps: 2 }, draw: icons.thumbsDown },
];

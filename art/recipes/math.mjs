// The math section (Lasketaan!): its crowns and icons (UI pictures: the home
// card and the map show them at once), and its games' pieces (props: no word
// of their own, they ride in the words sprite). None shows a digit.

import * as math from '../math.mjs';

const ui = { group: 'ui', theme: 'math' };
const piece = { prop: true, theme: 'math' };

export default [
  { id: 'math-crown-red', title: 'a red crown (the math stage Plus ja miinus)', ...ui, draw: math.crown('red') },
  { id: 'math-crown-orange', title: 'an orange crown (the math stage Enemmän vai vähemmän?)', ...ui, draw: math.crown('orange') },
  { id: 'math-crown-green', title: 'a green crown (the math stage Montako nyt?)', ...ui, draw: math.crown('green') },
  { id: 'math-crown-purple', title: 'a purple crown (the math stage Yksitoista, kaksitoista…)', ...ui, draw: math.crown('purple') },
  { id: 'math-crown-teal', title: 'a teal crown (the math stage Kymmenen, kaksikymmentä…)', ...ui, draw: math.crown('teal') },
  { id: 'math-crown-pink', title: 'a pink crown (the math stage Kertaa ja puolet)', ...ui, draw: math.crown('pink') },
  { id: 'math-crown-amber', title: 'an amber crown (the math stage Paljonko se maksaa?)', ...ui, draw: math.crown('amber') },
  { id: 'math-crown-blue', title: 'a blue crown (the math stage Mitä kello on?)', ...ui, draw: math.crown('blue') },
  { id: 'lightning', title: 'lightning (quick sums)', glyphs: ['⚡'], ...ui, draw: math.lightning },
  // the math badges (Achievements): the others reuse the abacus, the microphone and the lightning
  { id: 'math-crowns-three', title: 'three crowns (a math badge)', glyphs: ['🫅'], ...ui, draw: math.crownTrio },
  { id: 'math-crowns-all', title: 'a crown set with every jewel (a math badge: every crown)', glyphs: ['💎'], ...ui, motion: { frames: 2, fps: 2 }, draw: math.crownAll },
  { id: 'stopwatch', title: 'stopwatch (a math badge: quick sums)', glyphs: ['⏱'], ...ui, motion: { frames: 4, fps: 2 }, draw: math.stopwatch },
  { id: 'math-card', title: 'the fox at its market stall, counting apples (the math card)', ...ui, motion: { frames: 2, fps: 1.5 }, draw: math.card },
  { id: 'math-apple-tree', title: 'an apple tree (the apple-tree game)', ...piece, motion: { frames: 2, fps: 1.5 }, draw: math.appleTree },
  { id: 'math-basket', title: 'an empty basket (the apples drop in)', ...piece, draw: math.emptyBasket },
  { id: 'math-scale-stand', title: 'the scale’s stand (its beam turns on top)', ...piece, draw: math.scaleStand },
  { id: 'math-scale-pan', title: 'a pan of the scale', ...piece, draw: math.scalePan },
  { id: 'math-engine', title: 'the train’s engine (smoke puffing, wheels turning)', ...piece, motion: { frames: 2, fps: 4 }, draw: math.engine },
  { id: 'math-wagon', title: 'a train wagon (a number word rides in it)', ...piece, draw: math.wagon },
  { id: 'math-rocket', title: 'a rocket on its launch pad (the countdown)', ...piece, motion: { frames: 2, fps: 6 }, draw: math.rocketOnPad },
];

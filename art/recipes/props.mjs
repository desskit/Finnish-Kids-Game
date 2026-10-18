// Story props: pictures the stories show that aren't words. Most ride in the
// words sprite (prop: true); the few the rest of the app also shows (a wave on
// the home screen, the microphone on the say-it button, the calendar, 1 2 3,
// the "no" sign and the finish flag on lesson and checkpoint icons) are UI
// pictures, there from the start.

import * as props from '../props.mjs';

const prop = { prop: true, theme: 'story-props' };
const ui = { group: 'ui', theme: 'story-props' };

// Every hour and half hour, for the stories and the clock phrases ("Kello on
// puoli kahdeksan" shows half past seven): 🕐–🕛 on the hour, 🕜–🕧 half past.
const HOURS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const CLOCKS = HOURS.flatMap((name, i) => [
  { id: `${name}-oclock`, title: `${name} o'clock`, glyphs: [String.fromCodePoint(0x1f550 + i)], prop: true, theme: 'clocks', draw: (k) => props.oclock(k, i + 1) },
  { id: `${name}-thirty`, title: `${name} thirty`, glyphs: [String.fromCodePoint(0x1f55c + i)], prop: true, theme: 'clocks', draw: (k) => props.oclock(k, i + 1, 30) },
]);

export default [
  { id: 'worried', title: 'worried (a bead of sweat)', glyphs: ['😟'], ...prop, motion: { frames: 2, fps: 1.5 }, draw: props.worried },
  { id: 'surprised', title: 'surprised (oh!)', glyphs: ['😮'], ...prop, motion: { frames: 2, fps: 2 }, draw: props.surprised },
  { id: 'shush', title: 'shh! (a finger to the lips, eyes glancing round)', glyphs: ['🤫'], ...prop, motion: { frames: 4, fps: 1.5 }, draw: props.shush },
  ...CLOCKS,
  { id: 'windowpane', title: 'window (curtains tied back)', glyphs: ['🪟'], ...prop, draw: props.windowpane },
  { id: 'red-ball', title: 'red ball (bouncing)', glyphs: ['🔴'], ...prop, motion: { frames: 4, fps: 6 }, draw: props.redBall },
  { id: 'meat', title: 'meat on the bone', glyphs: ['🍖'], ...prop, draw: props.meat },
  { id: 'tulip', title: 'tulip (May)', glyphs: ['🌷'], ...prop, motion: { frames: 2, fps: 1.5 }, draw: props.tulip },
  { id: 'christmas-tree', title: 'Christmas tree (December, lights blinking)', glyphs: ['🎄'], ...prop, motion: { frames: 2, fps: 2 }, draw: props.christmasTree },
  { id: 'bow', title: 'sorry! (Leo bowing)', glyphs: ['🙇'], ...prop, motion: { frames: 2, fps: 1.2 }, draw: props.bow },
  { id: 'thanks', title: 'thank you (hands pressed together)', glyphs: ['🙏'], ...prop, motion: { frames: 2, fps: 2 }, draw: props.thanks },
  // the animal words' sign (each word list has one)
  { id: 'paw-prints', title: 'paw prints (the animal words)', glyphs: ['🐾'], prop: true, theme: 'animals', draw: props.pawPrints },
  { id: 'wave', title: 'hi! bye! (a hand waving)', glyphs: ['👋'], ...ui, motion: { frames: 2, fps: 3 }, draw: props.wave },
  { id: 'microphone', title: 'microphone (notes when someone sings)', glyphs: ['🎤'], ...ui, motion: { frames: 3, fps: 2 }, draw: props.microphone },
  { id: 'calendar', title: 'calendar page', glyphs: ['📅'], ...ui, draw: props.calendar },
  { id: 'one-two-three', title: '1 2 3 (numbers)', glyphs: ['🔢'], ...ui, draw: props.oneTwoThree },
  { id: 'no-sign', title: 'no! (a red ring with a bar)', glyphs: ['🚫'], ...ui, draw: props.noSign },
  { id: 'finish-flag', title: 'finish flag (flapping)', glyphs: ['🏁'], ...ui, motion: { frames: 2, fps: 3 }, draw: props.finishFlag },
];

// Lesson, unit, can-do and conversation icons (UI pictures: the course map shows them).

import * as icons from '../lesson-icons.mjs';

const ui = { group: 'ui', theme: 'lesson-icons' };

export default [
  { id: 'music-notes', title: 'music notes (a song)', glyphs: ['🎶'], ...ui, motion: { frames: 2, fps: 2 }, draw: icons.musicNotes },
  { id: 'bell', title: 'a bell, ringing', glyphs: ['🔔'], ...ui, motion: { frames: 2, fps: 3 }, draw: icons.bell },
  { id: 'drum', title: 'a drum (the beat)', glyphs: ['🥁'], ...ui, motion: { frames: 2, fps: 4 }, draw: icons.drum },
  { id: 'compass', title: 'compass (around: in front, behind, next to)', glyphs: ['🧭'], ...ui, motion: { frames: 2, fps: 1.5 }, draw: icons.compass },
  { id: 'location-pin', title: 'map pin (where)', glyphs: ['📍'], ...ui, motion: { frames: 2, fps: 2 }, draw: icons.locationPin },
  { id: 'thinking', title: 'thinking (question words)', glyphs: ['🤔'], ...ui, motion: { frames: 2, fps: 1 }, draw: icons.thinking },
  { id: 'rewind', title: 'rewind (what happened)', glyphs: ['⏮️'], ...ui, draw: icons.rewind },
  { id: 'heart-hands', title: 'hands holding a heart (me and you)', glyphs: ['🫶'], ...ui, motion: { frames: 2, fps: 2 }, draw: icons.heartHands },
  { id: 'open-hands', title: 'open hands (these are…)', glyphs: ['👐'], ...ui, draw: icons.openHands },
  { id: 'arms-crossed', title: "arms crossed (I'm not, didn't)", glyphs: ['🙅'], ...ui, draw: icons.armsCrossed },
  { id: 'spiral-calendar', title: 'spiral calendar (days and dates)', glyphs: ['🗓️'], ...ui, draw: icons.spiralCalendar },
  { id: 'scales', title: 'scales (have or not, which is more)', glyphs: ['⚖️'], ...ui, motion: { frames: 2, fps: 1.2 }, draw: icons.scales },
  { id: 'pointing-at-you', title: 'pointing at you (mine and yours)', glyphs: ['🫵'], ...ui, draw: icons.pointingAtYou },
  { id: 'mirror', title: 'mirror (describing words copy)', glyphs: ['🪞'], ...ui, motion: { frames: 3, fps: 2 }, draw: icons.mirror },
  { id: 'shopkeeper', title: 'the shopkeeper', glyphs: ['🧑‍💼'], ...ui, draw: icons.shopkeeper },
  { id: 'bus-stop-sign', title: 'bus stop sign', glyphs: ['🚏'], ...ui, draw: icons.busStopSign },
  { id: 'see-no-evil', title: 'monkey hiding its eyes (hiding)', glyphs: ['🙈'], ...ui, motion: { frames: 2, fps: 1 }, draw: icons.seeNoEvil },
  { id: 'heart-eyes', title: 'heart eyes (loving things)', glyphs: ['😍'], ...ui, motion: { frames: 2, fps: 2 }, draw: icons.heartEyes },
  { id: 'two-hearts', title: 'two hearts (I love…)', glyphs: ['💕'], ...ui, motion: { frames: 2, fps: 2 }, draw: icons.twoHearts },
  { id: 'walking-cat', title: "Mirri walking (where's the cat going?)", glyphs: ['🐈'], ...ui, motion: { frames: 2, fps: 3 }, draw: icons.walkingCat },
];

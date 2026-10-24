// Avatar heads (src/art/Avatar.tsx shows avatar-<name> for a player's emoji)
// and the mascot cheering. UI pictures: the profile picker shows them first thing.
// The avatars that are words (cat, dog, bear…) leave their emoji to the word's picture.

import * as av from '../avatars.mjs';

const ui = { group: 'ui', theme: 'avatars' };

export default [
  { id: 'avatar-owl', title: 'owl (avatar)', glyphs: ['🦉'], ...ui, draw: av.avatarOwl },
  { id: 'avatar-bear', title: 'bear (avatar)', ...ui, draw: av.avatarBear },
  { id: 'avatar-cat', title: 'cat (avatar)', ...ui, draw: av.avatarCat },
  { id: 'avatar-dog', title: 'dog (avatar)', ...ui, draw: av.avatarDog },
  { id: 'avatar-bunny', title: 'bunny (avatar)', ...ui, draw: av.avatarBunny },
  { id: 'avatar-frog', title: 'frog (avatar)', ...ui, draw: av.avatarFrog },
  { id: 'avatar-panda', title: 'panda (avatar)', glyphs: ['🐼'], ...ui, draw: av.avatarPanda },
  { id: 'avatar-lion', title: 'lion (avatar)', ...ui, draw: av.avatarLion },
  { id: 'avatar-tiger', title: 'tiger (avatar)', glyphs: ['🐯'], ...ui, draw: av.avatarTiger },
  { id: 'avatar-koala', title: 'koala (avatar)', glyphs: ['🐨'], ...ui, draw: av.avatarKoala },
  { id: 'avatar-penguin', title: 'penguin (avatar)', glyphs: ['🐧'], ...ui, draw: av.avatarPenguin },
  // faces won in math (Lasketaan!: Achievements)
  { id: 'avatar-robot', title: 'robot (a face won in math)', glyphs: ['🤖'], ...ui, motion: { frames: 2, fps: 1.5 }, draw: av.avatarRobot },
  { id: 'avatar-owl-in-glasses', title: 'owl in glasses (a face won in math)', glyphs: ['🤓'], ...ui, draw: av.avatarOwlInGlasses },
  { id: 'avatar-dragon', title: 'dragon (a face won in math)', glyphs: ['🐲'], ...ui, draw: av.avatarDragon },
  { id: 'avatar-test-tube', title: 'test tube (the test profile; test games)', glyphs: ['🧪'], ...ui, motion: { frames: 3, fps: 3 }, draw: av.avatarTestTube },
  { id: 'mascot-cheer', title: 'the fox cheering (a perfect round)', ...ui, motion: { frames: 4, fps: 5 }, draw: av.foxCheer },
];

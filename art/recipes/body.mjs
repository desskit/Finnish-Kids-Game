// Body words.

import { bone, ear, eye, finger, foot, hair, hand, head, heart, knee, mouth, muscle, nose, tongue, tooth, tummy } from '../body.mjs';

export default [
  // the eye looks left, back, blinks, looks right
  { id: 'eye', title: 'eye', motion: { frames: 8, fps: 3 }, draw: eye },
  { id: 'ear', title: 'ear (hearing)', motion: { frames: 3, fps: 3 }, draw: ear },
  { id: 'nose', title: 'nose', draw: nose },
  { id: 'mouth', title: 'mouth', draw: mouth },
  { id: 'hand', title: 'hand (waving)', motion: { frames: 2, fps: 2.5 }, draw: hand },
  { id: 'foot', title: 'foot (wiggling its toes)', motion: { frames: 2, fps: 3 }, draw: foot },
  { id: 'head', title: 'head (Eero)', draw: head },
  { id: 'tooth', title: 'tooth', motion: { frames: 4, fps: 4 }, draw: tooth },
  { id: 'hair', title: 'hair (a comb going through it)', motion: { frames: 2, fps: 2 }, draw: hair },
  { id: 'tummy', title: 'tummy (Leo patting his)', motion: { frames: 2, fps: 3 }, draw: tummy },
  { id: 'finger', title: 'finger', draw: finger },
  { id: 'knee', title: 'knee (with a plaster)', draw: knee },
  { id: 'tongue', title: 'tongue', motion: { frames: 2, fps: 2.5 }, draw: tongue },
  { id: 'heart', title: 'heart (beating)', motion: { frames: 2, fps: 2 }, draw: heart },
  { id: 'bone', title: 'bone', draw: bone },
  { id: 'muscle', title: 'muscle (flexing)', motion: { frames: 2, fps: 2 }, draw: muscle },
];

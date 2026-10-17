// Adjective words. Feelings are one round face with the kit's eyes and mouths;
// colors are crayons; sizes, speeds and the rest are something that has them.

import * as adj from '../adjectives.mjs';
import { faceBase } from '../faces.mjs';

export default [
  {
    id: 'happy',
    title: 'happy',
    // a happy little bounce
    motion: { frames: 2, fps: 2.5 },
    draw: (k) =>
      k.g(
        `translate(0 ${k.frame % 2 ? -k.px : 0})`,
        faceBase(k),
        k.happyEye(24.4, 26.8, 6.4),
        k.happyEye(39.6, 26.8, 6.4),
        k.blush(17.6, 36.4, 3.6, 2.2),
        k.blush(46.4, 36.4, 3.6, 2.2),
        k.openSmile(32, 36, 15, 6.4),
      ),
  },
  // Feelings
  { id: 'tired', title: 'tired (yawning)', motion: { frames: 2, fps: 1.2 }, draw: adj.tired },
  { id: 'hungry', title: 'hungry (drooling)', motion: { frames: 3, fps: 2 }, draw: adj.hungry },
  { id: 'cute', title: 'cute (hearts)', motion: { frames: 2, fps: 2 }, draw: adj.cute },
  { id: 'kind', title: 'kind (a halo)', motion: { frames: 2, fps: 1.2 }, draw: adj.kind },
  { id: 'sad', title: 'sad', motion: { frames: 2, fps: 1 }, draw: adj.sad },
  { id: 'angry', title: 'angry', motion: { frames: 2, fps: 3 }, draw: adj.angry },
  { id: 'sick', title: 'sick (a thermometer)', motion: { frames: 2, fps: 1.5 }, draw: adj.sick },
  { id: 'calm', title: 'calm (breathing out)', motion: { frames: 2, fps: 0.8 }, draw: adj.calm },
  { id: 'cold', title: 'cold (shivering)', motion: { frames: 2, fps: 6 }, draw: adj.cold },
  { id: 'hot', title: 'hot (sweating)', motion: { frames: 3, fps: 3 }, draw: adj.hot },
  { id: 'funny', title: 'funny (a silly face)', motion: { frames: 2, fps: 3 }, draw: adj.funny },
  // Leo
  { id: 'proud', title: 'proud (Leo with a medal)', motion: { frames: 2, fps: 1.5 }, draw: adj.proud },
  { id: 'strong', title: 'strong (a barbell)', motion: { frames: 2, fps: 1.5 }, draw: adj.strong },
  { id: 'good', title: 'good (thumbs up)', motion: { frames: 2, fps: 2 }, draw: adj.good },
  // Colors
  { id: 'red', title: 'red (a crayon)', draw: adj.red },
  { id: 'blue', title: 'blue (a crayon)', draw: adj.blue },
  { id: 'yellow', title: 'yellow (a crayon)', draw: adj.yellow },
  { id: 'green', title: 'green (a crayon)', draw: adj.green },
  { id: 'black', title: 'black (a crayon)', draw: adj.black },
  { id: 'white', title: 'white (a crayon)', draw: adj.white },
  { id: 'brown', title: 'brown (a crayon)', draw: adj.brown },
  // Sizes and speeds
  { id: 'big', title: 'big (a dinosaur)', motion: { frames: 2, fps: 1.2 }, draw: adj.big },
  { id: 'small', title: 'small (an ant by a big shoe)', motion: { frames: 2, fps: 3 }, draw: adj.small },
  { id: 'fast', title: 'fast (a race car)', motion: { frames: 2, fps: 6 }, draw: adj.fast },
  { id: 'slow', title: 'slow (a turtle)', motion: { frames: 2, fps: 1 }, draw: adj.slow },
  // the giraffe emoji 🦒 stays the zoo's
  { id: 'tall', title: 'tall (a giraffe next to Leo)', motion: { frames: 2, fps: 1.2 }, draw: adj.tall },
];

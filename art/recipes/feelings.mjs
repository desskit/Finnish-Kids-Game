// The feeling verbs (Minua pelottaa…): the round face, like the other feelings.

import * as feel from '../feelings.mjs';

export default [
  { id: 'scared', title: 'scared (peeking over the blanket, trembling)', motion: { frames: 2, fps: 4 }, draw: feel.scared },
  { id: 'nervous', title: 'nervous (gritted teeth, darting eyes)', motion: { frames: 2, fps: 2 }, draw: feel.nervous },
  { id: 'sleepy', title: 'sleepy (nodding off, a bubble growing)', motion: { frames: 3, fps: 1.2 }, draw: feel.sleepy },
  { id: 'giggly', title: 'giggly (a hand over the giggle)', motion: { frames: 2, fps: 3 }, draw: feel.giggly },
  { id: 'teary', title: 'teary (holding back tears)', motion: { frames: 2, fps: 1.2 }, draw: feel.teary },
];

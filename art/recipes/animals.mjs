// Animal words. The cat is Mirri and the dog is Musti from the stories.

import { cat, dog } from '../animals.mjs';
import { bear, bunny, fox, frog, lion, monkey, mouse } from '../animals-sitting.mjs';
import { bee, bird, butterfly, chicken, farmDuck, fish, mallard, snake } from '../animals-small.mjs';
import { cow, elephant, horse, pig, sheep, wolf } from '../animals-standing.mjs';

export default [
  { id: 'cat', title: 'Mirri the cat', motion: { frames: 4, fps: 4 }, draw: cat },
  { id: 'dog', title: 'Musti the dog', motion: { frames: 2, fps: 5 }, draw: dog },
  { id: 'bear', title: 'bear', draw: bear },
  { id: 'bunny', title: 'bunny', motion: { frames: 2, fps: 1.5 }, draw: bunny },
  { id: 'fox', title: 'fox (also the mascot)', motion: { frames: 4, fps: 4 }, draw: fox },
  { id: 'mouse', title: 'mouse', motion: { frames: 2, fps: 3 }, draw: mouse },
  { id: 'lion', title: 'lion', motion: { frames: 2, fps: 2 }, draw: lion },
  { id: 'monkey', title: 'monkey', motion: { frames: 2, fps: 2 }, draw: monkey },
  { id: 'wolf', title: 'wolf (howling at the moon, its tail sweeping)', motion: { frames: 4, fps: 4 }, draw: wolf },
  { id: 'frog', title: 'frog', motion: { frames: 2, fps: 2 }, draw: frog },
  { id: 'horse', title: 'horse (a Finnhorse)', motion: { frames: 4, fps: 4 }, draw: horse },
  { id: 'cow', title: 'cow', motion: { frames: 4, fps: 4 }, draw: cow },
  { id: 'pig', title: 'pig', motion: { frames: 2, fps: 3 }, draw: pig },
  { id: 'sheep', title: 'sheep', motion: { frames: 2, fps: 1.5 }, draw: sheep },
  { id: 'elephant', title: 'elephant', motion: { frames: 4, fps: 3 }, draw: elephant },
  { id: 'bird', title: 'bird', motion: { frames: 2, fps: 5 }, draw: bird },
  // ankka: a white farmyard duck (the wild mallard on the lake is a sorsa)
  { id: 'duck', title: 'duck (ankka: a farmyard duck)', motion: { frames: 2, fps: 1.5 }, draw: farmDuck },
  // sorsa: a wild mallard on the lake. Its word comes from the Wiktionary
  // supplement (data/wiktionary/); until then the picture waits in the gallery.
  // 🦆 stays ankka's: this one is found by its id.
  { id: 'wild-duck', title: 'wild duck (sorsa: a mallard)', theme: 'animals', awaitingWord: 'sorsa', glyph: false, motion: { frames: 2, fps: 1.5 }, draw: mallard },
  { id: 'chicken', title: 'chicken', motion: { frames: 2, fps: 2.5 }, draw: chicken },
  { id: 'fish', title: 'fish', motion: { frames: 4, fps: 4 }, blink: false, draw: fish },
  { id: 'snake', title: 'snake', motion: { frames: 2, fps: 2.5 }, blink: false, draw: snake },
  { id: 'butterfly', title: 'butterfly', motion: { frames: 2, fps: 5 }, draw: butterfly },
  { id: 'bee', title: 'bee', motion: { frames: 2, fps: 10 }, draw: bee },
];

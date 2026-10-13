// Animal words. The cat is Mirri and the dog is Musti from the stories.

import { cat, dog } from '../animals.mjs';

export default [
  { id: 'cat', title: 'Mirri the cat', motion: { frames: 4, fps: 4 }, draw: cat },
  { id: 'dog', title: 'Musti the dog', motion: { frames: 2, fps: 5 }, draw: dog },
];

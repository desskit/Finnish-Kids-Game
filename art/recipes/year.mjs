// The Finnish year: Christmas, Easter and Midsummer.

import * as props from '../props.mjs';
import * as time from '../time.mjs';
import * as year from '../year.mjs';

export default [
  { id: 'christmas', title: 'Christmas (a spruce garland, baubles and presents)', motion: { frames: 2, fps: 1.5 }, draw: year.christmas },
  { id: 'santa', title: 'Santa (Joulupukki with his sack, waving)', motion: { frames: 2, fps: 2 }, draw: year.santa },
  { id: 'christmas-tree', title: 'Christmas tree (its lights blinking)', motion: { frames: 2, fps: 2 }, draw: props.christmasTree },
  { id: 'elf', title: 'elf (a tonttu in his red cap, waving)', motion: { frames: 2, fps: 2 }, draw: year.elf },
  { id: 'snowman', title: 'snowman (in a hat and scarf, snow falling)', motion: { frames: 2, fps: 2 }, draw: time.snowman },
  { id: 'easter', title: 'Easter (a chick hatching, a painted egg)', motion: { frames: 2, fps: 2 }, draw: year.easter },
  { id: 'witch', title: 'witch (Aino as an Easter witch with her broom)', draw: year.witch },
  { id: 'catkin', title: 'willow catkins (twigs in a jar)', draw: year.catkin },
  { id: 'midsummer', title: 'Midsummer (the flag by the lake)', motion: { frames: 2, fps: 2 }, draw: year.midsummer },
  { id: 'bonfire', title: 'bonfire (a Midsummer kokko by the lake)', motion: { frames: 3, fps: 4 }, draw: year.bonfire },
];

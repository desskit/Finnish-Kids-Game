// Time words: times of day, seasons, the weekend and birthdays.

import * as time from '../time.mjs';

export default [
  // 🎉 stays the app's "well done!" party popper
  { id: 'weekend', title: 'weekend (a week, Saturday and Sunday circled)', glyph: false, motion: { frames: 3, fps: 2 }, draw: time.weekend },
  { id: 'morning', title: 'morning (sunrise over the lake)', motion: { frames: 2, fps: 1 }, draw: time.morning },
  { id: 'daytime', title: 'daytime', motion: { frames: 2, fps: 1 }, draw: time.daytime },
  { id: 'evening', title: 'evening (windows lighting up)', motion: { frames: 2, fps: 1 }, draw: time.evening },
  { id: 'night', title: 'night (stars twinkling)', motion: { frames: 2, fps: 1.5 }, draw: time.night },
  { id: 'spring', title: 'spring (a sprout)', motion: { frames: 2, fps: 1.5 }, draw: time.spring },
  { id: 'summer', title: 'summer (a parasol in the sun)', motion: { frames: 2, fps: 2.5 }, draw: time.summer },
  { id: 'autumn', title: 'autumn (falling leaves)', motion: { frames: 3, fps: 3 }, draw: time.autumn },
  { id: 'winter', title: 'winter (a snowman in the snow)', motion: { frames: 2, fps: 2 }, draw: time.winter },
  { id: 'birthday', title: 'birthday (a cake, candles flickering)', motion: { frames: 3, fps: 5 }, draw: time.birthday },
];

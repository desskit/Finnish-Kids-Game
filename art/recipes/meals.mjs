// Meals (My day): each with its time of day.

import * as meals from '../meals.mjs';

export default [
  { id: 'breakfast', title: 'breakfast (porridge and juice, the sun coming up)', motion: { frames: 3, fps: 2 }, draw: meals.breakfast },
  { id: 'lunch', title: 'lunch (a school lunch tray, the sun high)', draw: meals.lunch },
  { id: 'dinner', title: 'dinner (spaghetti and meatballs, the sun going down)', draw: meals.dinner },
  { id: 'evening-snack', title: 'evening snack (a sandwich and milk, the moon out)', draw: meals.eveningSnack },
];

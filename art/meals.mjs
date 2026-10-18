// Meals: the food on its plate (or in its bowl), with a little sky in the top
// corner that tells the time of day — the sun coming up for breakfast, high
// for lunch, going down for dinner, the moon for the evening snack.

import { fmt } from './kit.mjs';
import { steam } from './food.mjs';

/** The time of day, top right: a round patch of sky with the sun or the moon. */
function timeOfDay(k, when) {
  const c = k.P;
  const [x, y, r] = [51.6, 11.6, 9.4];
  if (when === 'night') {
    return k.circle(x, y, r, c.skyNight) + k.path(`M${x + 1.6} ${y - 5.4}A5.6 5.6 0 1 0 ${x + 1.6} ${y + 5.4}A6.8 6.8 0 0 1 ${x + 1.6} ${y - 5.4}Z`, c.starlight);
  }
  if (when === 'noon') {
    return k.circle(x, y, r, c.skyDay) + k.circle(x, y, 4.6, c.yellow);
  }
  // the sun on the horizon: coming up (yellow) or going down (orange)
  const d = 2.4;
  const w = Math.sqrt(r * r - d * d) - 0.6;
  return [
    k.circle(x, y, r, when === 'morning' ? c.skyDayLow : c.skyEvening),
    k.flat(`M${fmt(x - w)} ${y + d}A${r - 0.6} ${r - 0.6} 0 0 0 ${fmt(x + w)} ${y + d}Z`, c.hill),
    k.path(`M${x - 5} ${y + d}A5 5 0 0 1 ${x + 5} ${y + d}Z`, when === 'morning' ? c.yellow : c.orange),
  ].join('');
}

/** A tall glass with a drink in it, standing on (x, ground). */
function glass(k, x, ground, drink) {
  const c = k.P;
  return [
    k.rect(x - 6.6, ground - 21, 13.2, 21, 2, c.silver),
    k.flat(`M${x - 5.4} ${ground - 15.4}H${x + 5.4}V${ground - 2.6}C${x + 5.4} ${ground - 1.8} ${x + 4.8} ${ground - 1.2} ${x + 4} ${ground - 1.2}H${x - 4}C${x - 4.8} ${ground - 1.2} ${x - 5.4} ${ground - 1.8} ${x - 5.4} ${ground - 2.6}Z`, c[drink]),
    k.shine(`M${x - 3.4} ${ground - 14}V${ground - 7}`, 1.4),
  ].join('');
}

/** Breakfast: a bowl of porridge with butter and blueberries, a glass of juice, the sun coming up. */
export function breakfast(k) {
  const c = k.P;
  return [
    k.ground(30, 58.6, 25, 2.2),
    timeOfDay(k, 'morning'),
    glass(k, 47.6, 50.6, 'orange'),
    k.path('M6.6 36.6H42.6C42.6 47.6 35.6 55.6 24.6 55.6C13.6 55.6 6.6 47.6 6.6 36.6Z', c.wood),
    k.flat('M35.6 38.6H41C40 45.6 35.6 51.6 29.6 53.8C33 49.6 35 44.6 35.6 38.6Z', c.woodShade),
    k.ellipse(24.6, 36.6, 18, 4.4, c.tan),
    k.flatEllipse(23, 36.4, 3.2, 1.4, c.yellow),
    k.flatCircle(15.6, 36.6, 1.4, c.navy),
    k.flatCircle(30.6, 37.6, 1.4, c.navy),
    k.limb('M32.6 35.4L40.6 22.6', c.silver, 4.4),
    steam(k, [14, 24], 30),
  ].join('');
}

/** Lunch: a school lunch tray — potatoes and meatballs on a plate, a glass of milk, a slice of bread; the sun high. */
export function lunch(k) {
  const c = k.P;
  return [
    k.ground(32, 58.6, 28, 2.2),
    timeOfDay(k, 'noon'),
    k.path('M3.6 38.6H60.4L57.6 54.6H6.4Z', c.teal),
    k.flat('M52.6 40.6H58L55.8 52.6H51.4Z', c.tealShade),
    k.ellipse(22.6, 45.6, 15.6, 6, c.white),
    k.flatEllipse(22.6, 46, 11.6, 4, c.silver),
    k.ellipse(16.6, 44.6, 3.6, 2.6, c.tan),
    k.ellipse(21.6, 47.4, 3.6, 2.6, c.tan),
    k.circle(26.6, 43.6, 2.6, c.brown),
    k.circle(30.6, 45.6, 2.6, c.brown),
    k.circle(28.2, 48.2, 2.6, c.brown),
    k.rect(39.6, 41.6, 9.6, 8.6, 2.6, c.tan),
    glass(k, 50.6, 46.6, 'white'),
  ].join('');
}

/** Dinner: a plate of spaghetti and meatballs with a fork in it; the sun going down. */
export function dinner(k) {
  const c = k.P;
  const swirl = 'M16.6 40.6C20.6 34.6 28.6 33.6 34.6 36.6M18.6 44.6C24.6 38.6 34.6 38.6 40.6 42.6M22.6 47.6C28.6 43.6 36.6 44.6 42.6 46.6M14.6 44.6C16.6 48.6 22.6 50.6 28.6 50.6';
  return [
    k.ground(30, 58.6, 25, 2.2),
    timeOfDay(k, 'evening'),
    k.ellipse(29.6, 46.6, 25, 9.4, c.white),
    k.flatEllipse(29.6, 47, 19, 6.6, c.silver),
    k.path('M12.6 44.6C12.6 37.6 19.6 32.6 29.6 32.6C39.6 32.6 46.6 37.6 46.6 44.6C46.6 49.6 39.6 52.6 29.6 52.6C19.6 52.6 12.6 49.6 12.6 44.6Z', c.yellow),
    k.line(swirl, { color: c.yellowShade, sw: 1.6 }),
    k.circle(24.6, 39.6, 3.2, c.brown),
    k.circle(33.6, 41.6, 3.2, c.brown),
    k.flatEllipse(29.6, 36.6, 5.6, 2.4, c.red),
    k.limb('M38.6 40.6L52.6 26.6', c.silver, 4.4),
    k.line('M50.6 24.6L54.6 20.6M52.6 26.6L56.6 22.6', { color: c.grey, sw: 1.6 }),
  ].join('');
}

/** The evening snack: a cheese sandwich and a glass of milk, the moon in the sky. */
export function eveningSnack(k) {
  const c = k.P;
  return [
    k.ground(30, 58.6, 25, 2.2),
    timeOfDay(k, 'night'),
    glass(k, 46.6, 52.6, 'white'),
    k.path('M6.6 40.6C6.6 35.6 10.6 32.6 15.6 32.6C17.6 30.6 21.6 30.6 23.6 32.6C28.6 32.6 32.6 35.6 32.6 40.6V52.6H6.6Z', c.tan),
    k.flat('M9.6 38.6H30.6V50.6H9.6Z', c.cream),
    k.path('M7.6 36.6H33.6L31.6 41.6H9.6Z', c.yellow),
    k.flatCircle(15.6, 38.6, 1.2, c.yellowShade),
    k.flatCircle(25.6, 39.6, 1.2, c.yellowShade),
    k.ellipse(14.6, 35.6, 3.6, 1.8, c.green),
    k.ellipse(24.6, 35.6, 3.6, 1.8, c.green),
  ].join('');
}

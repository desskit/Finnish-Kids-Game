// Every recipe in the picture set, and every story backdrop.
// Add a recipe module here when you add one under recipes/ or scenes/.

import adjectives from './recipes/adjectives.mjs';
import animals from './recipes/animals.mjs';
import body from './recipes/body.mjs';
import food from './recipes/food.mjs';
import freetime from './recipes/freetime.mjs';
import nature from './recipes/nature.mjs';
import people from './recipes/people.mjs';
import places from './recipes/places.mjs';
import school from './recipes/school.mjs';
import ui from './recipes/ui.mjs';
import verbs from './recipes/verbs.mjs';
import park from './scenes/park.mjs';

/**
 * A picture: `id` (a word's id for word pictures), `title`, `group` ('words'
 * by default, or 'ui'), optional `glyphs` (the emoji it replaces; a word
 * picture claims its word's emoji unless `glyph: false`), and `draw(kit)`.
 * Optional `motion: { frames, fps }` makes it loop; `blink: false` keeps the
 * eyes of something that doesn't blink (a fish) open.
 */
export const RECIPES = [...people, ...animals, ...body, ...food, ...freetime, ...places, ...nature, ...adjectives, ...verbs, ...school, ...ui];

/** A backdrop: `id`, `title`, the `tones` it's drawn in, and `draw(kit, tone)`. */
export const SCENES = [park];

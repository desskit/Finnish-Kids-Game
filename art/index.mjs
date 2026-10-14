// Every recipe in the picture set, and every story backdrop.
// Add a recipe module here when you add one under recipes/ or scenes/.

import adjectives from './recipes/adjectives.mjs';
import animals from './recipes/animals.mjs';
import avatars from './recipes/avatars.mjs';
import badges from './recipes/badges.mjs';
import body from './recipes/body.mjs';
import clothes from './recipes/clothes.mjs';
import food from './recipes/food.mjs';
import freetime from './recipes/freetime.mjs';
import icons from './recipes/icons.mjs';
import lessonIcons from './recipes/lesson-icons.mjs';
import nature from './recipes/nature.mjs';
import people from './recipes/people.mjs';
import places from './recipes/places.mjs';
import props from './recipes/props.mjs';
import school from './recipes/school.mjs';
import time from './recipes/time.mjs';
import ui from './recipes/ui.mjs';
import verbs from './recipes/verbs.mjs';
import beach from './scenes/beach.mjs';
import bedroom from './scenes/bedroom.mjs';
import busStop from './scenes/busStop.mjs';
import classroom from './scenes/classroom.mjs';
import field from './scenes/field.mjs';
import forest from './scenes/forest.mjs';
import home from './scenes/home.mjs';
import kitchen from './scenes/kitchen.mjs';
import library from './scenes/library.mjs';
import park from './scenes/park.mjs';
import party from './scenes/party.mjs';
import playground from './scenes/playground.mjs';
import shop from './scenes/shop.mjs';
import station from './scenes/station.mjs';
import yard from './scenes/yard.mjs';
import zoo from './scenes/zoo.mjs';
import hero from './scenes/hero.mjs';

/**
 * A picture: `id` (a word's id for word pictures), `title`, `group` ('words'
 * by default, or 'ui'), optional `glyphs` (the emoji it replaces; a word
 * picture claims its word's emoji unless `glyph: false`), and `draw(kit)`.
 * Optional `motion: { frames, fps }` makes it loop; `blink: false` keeps the
 * eyes of something that doesn't blink (a fish) open. A story prop (something
 * a story shows that isn't a word) has `prop: true`: it goes in the words
 * sprite, under its own `theme` in the gallery.
 */
export const RECIPES = [...people, ...animals, ...body, ...food, ...clothes, ...freetime, ...places, ...nature, ...adjectives, ...verbs, ...school, ...time, ...props, ...icons, ...badges, ...lessonIcons, ...avatars, ...ui];

/** A backdrop: `id`, `title`, the `tones` it's drawn in, and `draw(kit, tone)`. */
export const SCENES = [home, kitchen, bedroom, party, classroom, library, shop, park, playground, yard, field, beach, busStop, zoo, forest, station];

/**
 * The app's own scenery (UI scenes): drawn like a backdrop, in the looks'
 * tones (day, night, pink), but shown by the app's screens, not by stories.
 * A UI scene may set its own size (`w`, `h`; a backdrop is 400 × 200).
 */
export const UI_SCENES = [hero];

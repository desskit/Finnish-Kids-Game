// Clothes words.

import * as clothes from '../clothes.mjs';

export default [
  { id: 'shirt', title: 'shirt', draw: clothes.shirt },
  { id: 'blouse', title: 'blouse', draw: clothes.blouse },
  { id: 'coat', title: 'coat (a winter jacket)', draw: clothes.coat },
  { id: 'shoe', title: 'shoe', draw: clothes.shoe },
  { id: 'sock', title: 'sock', draw: clothes.sock },
  { id: 'hat', title: 'hat', draw: clothes.hat },
  { id: 'dress', title: 'dress', draw: clothes.dress },
  // käsine has five fingers; the knitted mittens are lapanen's
  { id: 'glove', title: 'glove (five fingers)', draw: clothes.glove },
  { id: 'mitten', title: 'mittens (knitted, on a string)', draw: clothes.mittens },
  { id: 'beanie', title: 'beanie (knitted, with a bobble)', draw: clothes.beanie },
  { id: 'snowsuit', title: 'snowsuit (one piece, with a hood)', draw: clothes.snowsuit },
  { id: 'sweater', title: 'sweater (woolly, a snowflake band)', draw: clothes.sweater },
  { id: 'raincoat', title: 'raincoat (yellow, rain falling by)', motion: { frames: 2, fps: 3 }, draw: clothes.raincoat },
  { id: 'scarf', title: 'scarf', draw: clothes.scarf },
  { id: 'cap', title: 'cap', draw: clothes.cap },
  { id: 'boot', title: 'boot (a rubber boot)', draw: clothes.boot },
  { id: 'ring', title: 'ring', motion: { frames: 4, fps: 4 }, draw: clothes.ring },
  { id: 'tie', title: 'tie', draw: clothes.tie },
  { id: 'vest', title: 'vest (a reflective vest)', draw: clothes.vest },
];

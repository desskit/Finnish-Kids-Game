// Place words: buildings, rooms, furniture and ways to travel.

import * as places from '../places.mjs';

/** Vehicles bob along (two frames). */
const going = { frames: 2, fps: 3 };

export default [
  { id: 'box', title: 'box', draw: places.box },
  { id: 'table', title: 'table', draw: places.table },
  { id: 'house', title: 'house', draw: places.house },
  { id: 'room', title: 'room', draw: places.room },
  { id: 'car', title: 'car', motion: going, draw: places.car },
  { id: 'bed', title: 'bed', draw: places.bed },
  { id: 'chair', title: 'chair', draw: places.chair },
  { id: 'school', title: 'school (a Finnish flag on top)', draw: places.school },
  { id: 'tree', title: 'tree', motion: { frames: 2, fps: 1.5 }, draw: places.tree },
  { id: 'forest', title: 'forest', draw: places.forest },
  { id: 'basket', title: 'basket (of blueberries)', draw: places.basket },
  { id: 'bag', title: 'bag', draw: places.bag },
  { id: 'bus', title: 'bus (a blue city bus)', motion: going, draw: places.bus },
  { id: 'train', title: 'train', motion: going, draw: places.train },
  { id: 'boat', title: 'boat (a rowboat)', motion: { frames: 2, fps: 1.5 }, draw: places.boat },
  { id: 'plane', title: 'plane', motion: going, draw: places.plane },
  { id: 'ship', title: 'ship (a ferry)', motion: { frames: 2, fps: 1.5 }, draw: places.ship },
  { id: 'taxi', title: 'taxi', motion: going, draw: places.taxi },
  { id: 'shop', title: 'shop', draw: places.shop },
  { id: 'library', title: 'library (a pile of books)', draw: places.library },
  { id: 'park', title: 'park (a slide)', draw: places.park },
  { id: 'hospital', title: 'hospital', draw: places.hospital },
  { id: 'station', title: 'station', draw: places.station },
  { id: 'museum', title: 'museum', draw: places.museum },
  { id: 'restaurant', title: 'restaurant', draw: places.restaurant },
  { id: 'cafe', title: 'café (coffee and a cinnamon bun)', motion: { frames: 3, fps: 3 }, draw: places.cafe },
  { id: 'city', title: 'city', draw: places.city },
  { id: 'market', title: 'market (a stall)', draw: places.market },
  { id: 'zoo', title: 'zoo (a giraffe over the fence)', motion: { frames: 2, fps: 1.5 }, draw: places.zoo },
  { id: 'field', title: 'field (a sports field)', draw: places.field },
  { id: 'bedroom', title: 'bedroom (someone asleep)', motion: { frames: 3, fps: 1.5 }, draw: places.bedroom },
  { id: 'bathroom', title: 'bathroom (a bubble bath)', motion: { frames: 2, fps: 2 }, draw: places.bathroom },
  { id: 'sofa', title: 'sofa', draw: places.sofa },
  { id: 'yard', title: 'yard', draw: places.yard },
  { id: 'restroom', title: 'restroom (a toilet)', draw: places.restroom },
  { id: 'daycare', title: 'daycare (drawings in the windows)', draw: places.daycare },
  { id: 'cottage', title: 'cottage (a red mökki by the lake, smoke rising)', motion: { frames: 3, fps: 2 }, draw: places.cottage },
  { id: 'sauna', title: 'sauna (a log cabin, steam rising; the bucket and ladle)', motion: { frames: 3, fps: 2 }, draw: places.sauna },
];

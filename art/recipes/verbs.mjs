// Verb words. Actions are Leo (the "action kid") doing them, each in a short
// loop; feelings are the round face; a few verbs keep the object their emoji
// showed (close = a shut padlock). A verb whose emoji is also another word's
// (eat and table both 🍽️) has `glyph: false`: the emoji stays the other
// word's picture, and the verb is still drawn wherever the verb is shown.

import { CAST, person, runPose } from '../people.mjs';
import * as verb from '../verbs.mjs';

export default [
  { id: 'run', title: 'run', motion: { frames: 4, fps: 8 }, draw: (k) => person(k, CAST.leo, runPose(k)) },
  {
    id: 'close',
    title: 'close (a shut padlock)',
    draw: (k) => {
      const c = k.P;
      return [
        k.limb('M22.6 30.4V22.6A9.4 9.4 0 0 1 41.4 22.6V30.4', c.silver, 8.6),
        k.poly([[14.4, 28.4], [49.6, 28.4], [49.6, 55.4], [14.4, 55.4]], 5.4, c.amber),
        k.flat('M15.8 47.6H48.2V50.4C48.2 52.4 46.8 54.1 44.8 54.1H19.2C17.2 54.1 15.8 52.4 15.8 50.4Z', c.amberShade),
        k.shine('M19.6 34.6V40.6', 2.4),
        k.flatCircle(32, 38.8, 3.4, c.ink),
        k.flat('M30.4 40.4L29.4 47H34.6L33.6 40.4Z', c.ink),
      ].join('');
    },
  },
  // Eating, sleeping, playing
  { id: 'eat', title: 'eat (soup, spoon to mouth)', glyph: false, motion: { frames: 2, fps: 2.5 }, draw: verb.eat },
  { id: 'drink', title: 'drink (juice through a straw)', motion: { frames: 3, fps: 1.5 }, draw: verb.drink },
  { id: 'sleep', title: 'sleep (Zzz)', motion: { frames: 3, fps: 1.5 }, draw: verb.sleep },
  { id: 'play', title: 'play (a yo-yo)', motion: { frames: 4, fps: 4 }, draw: verb.play },
  { id: 'hug', title: 'hug (Leo and his teddy)', motion: { frames: 2, fps: 2 }, draw: verb.hug },
  { id: 'love', title: 'love (a beating heart)', glyph: false, motion: { frames: 2, fps: 2.5 }, draw: verb.love },
  // Moving about
  { id: 'jump', title: 'jump', motion: { frames: 2, fps: 2.5 }, draw: verb.jump },
  { id: 'walk', title: 'walk', motion: { frames: 4, fps: 4 }, draw: verb.walk },
  { id: 'stand', title: 'stand (on a spot)', draw: verb.stand },
  { id: 'sit', title: 'sit (swinging his legs)', glyph: false, motion: { frames: 2, fps: 2.5 }, draw: verb.sit },
  { id: 'dance', title: 'dance (Aino)', motion: { frames: 2, fps: 3 }, draw: verb.dance },
  { id: 'swim', title: 'swim', motion: { frames: 2, fps: 2.5 }, draw: verb.swim },
  { id: 'climb', title: 'climb (a climbing wall)', motion: { frames: 2, fps: 2 }, draw: verb.climb },
  { id: 'fly', title: 'fly (a bird flapping)', motion: { frames: 3, fps: 5 }, draw: verb.fly },
  { id: 'drive', title: 'drive (Leo at the wheel)', glyph: false, motion: { frames: 2, fps: 4 }, draw: verb.drive },
  { id: 'run-away', title: 'run away (from a bee)', glyph: false, motion: { frames: 4, fps: 8 }, draw: verb.runAway },
  // Using the hands
  { id: 'give', title: 'give (a present to Aino)', motion: { frames: 2, fps: 1.5 }, draw: verb.give },
  { id: 'help', title: 'help (carrying a box together)', glyph: false, motion: { frames: 2, fps: 2.5 }, draw: verb.help },
  { id: 'throw', title: 'throw (a frisbee)', motion: { frames: 2, fps: 2 }, draw: verb.toss },
  { id: 'make', title: 'make (hammering)', motion: { frames: 2, fps: 3 }, draw: verb.make },
  { id: 'build', title: 'build (the last brick)', motion: { frames: 2, fps: 1.5 }, draw: verb.build },
  { id: 'fix', title: 'fix (a wrench turning)', motion: { frames: 2, fps: 2 }, draw: verb.fix },
  { id: 'draw', title: 'draw (a sun at the easel)', glyph: false, motion: { frames: 3, fps: 2 }, draw: verb.draw },
  { id: 'write', title: 'write (at his desk)', motion: { frames: 3, fps: 3 }, draw: verb.write },
  { id: 'paint', title: 'paint (a palette)', motion: { frames: 2, fps: 2 }, draw: verb.paint },
  { id: 'cook', title: 'cook (stirring a pot)', motion: { frames: 3, fps: 3 }, draw: verb.cook },
  { id: 'clean', title: 'clean (sweeping)', motion: { frames: 2, fps: 3 }, draw: verb.clean },
  { id: 'wash', title: 'wash (hands, with soap)', motion: { frames: 2, fps: 3 }, draw: verb.wash },
  { id: 'cut', title: 'cut (scissors)', motion: { frames: 2, fps: 3 }, draw: verb.cut },
  { id: 'wait', title: 'wait (an hourglass)', motion: { frames: 4, fps: 1.5 }, draw: verb.wait },
  // Seeing, hearing, talking
  { id: 'see', title: 'see (eyes looking around)', motion: { frames: 3, fps: 1.5 }, draw: verb.see },
  { id: 'look', title: 'look (watching TV)', motion: { frames: 2, fps: 1 }, draw: verb.look },
  { id: 'read', title: 'read (a page turning)', motion: { frames: 2, fps: 1 }, draw: verb.read },
  { id: 'search', title: 'look for (a magnifying glass)', motion: { frames: 2, fps: 1.5 }, draw: verb.search },
  // the 🎤 emoji stays free for the record button's own picture
  { id: 'sing', title: 'sing (into a microphone)', glyph: false, motion: { frames: 2, fps: 2.5 }, draw: verb.sing },
  { id: 'listen', title: 'listen (headphones on)', motion: { frames: 2, fps: 2.5 }, draw: verb.listen },
  { id: 'speak', title: 'speak', motion: { frames: 2, fps: 3 }, draw: verb.speak },
  { id: 'say', title: 'say (a speech bubble)', motion: { frames: 3, fps: 2.5 }, draw: verb.say },
  { id: 'ask', title: 'ask (a question mark)', motion: { frames: 2, fps: 2 }, draw: verb.ask },
  { id: 'answer', title: 'answer (hand up)', motion: { frames: 2, fps: 3 }, draw: verb.answer },
  // Feelings
  { id: 'smile', title: 'smile', motion: { frames: 2, fps: 1.5 }, draw: verb.smile },
  { id: 'like', title: 'like (yum)', motion: { frames: 2, fps: 2 }, draw: verb.like },
  { id: 'cry', title: 'cry', motion: { frames: 3, fps: 3 }, draw: verb.cry },
  { id: 'laugh', title: 'laugh', motion: { frames: 2, fps: 4 }, draw: verb.laugh },
  // Things
  { id: 'open', title: 'open (a padlock springing open)', motion: { frames: 2, fps: 2 }, draw: verb.open },
  { id: 'lock', title: 'lock (the key turning)', motion: { frames: 2, fps: 1.5 }, draw: verb.lock },
  { id: 'choose', title: 'choose (which balloon?)', motion: { frames: 2, fps: 1 }, draw: verb.choose },
  { id: 'teach', title: 'teach (at the blackboard)', motion: { frames: 2, fps: 1.5 }, draw: verb.teach },
  { id: 'learn', title: 'learn (a graduation cap)', motion: { frames: 2, fps: 1.5 }, draw: verb.learn },
  { id: 'wake-up', title: 'wake up (stretching, the alarm ringing)', glyph: false, motion: { frames: 2, fps: 3 }, draw: verb.wakeUp },
  { id: 'grow-old', title: 'grow old (girl, woman, grandma)', glyph: false, motion: { frames: 3, fps: 1.2 }, draw: verb.growOld },
  { id: 'warm-up', title: 'warm up (by the campfire)', motion: { frames: 3, fps: 4 }, draw: verb.warmUp },
  { id: 'buy', title: 'buy (a shopping cart)', motion: { frames: 4, fps: 4 }, draw: verb.buy },
];

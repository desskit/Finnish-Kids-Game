// Together mode (Yhdessä): prompts for the grown-up playing alongside. A
// child learns a language with people — talking about the screen together,
// asking and waiting, playing it off the screen — far more than from the
// screen alone (docs/LEARNING_RESEARCH.md: Kuhl, Strouse, EEF).
//
// The prompts are English, for the grown-up. Their Finnish is never written
// here: a story or scene prompt plays a line the story or scene already has
// (vetted with it), and an at-home idea names course words in *italics* —
// together.test.ts checks every one is a word the course teaches or a line it
// already says.

import type { Story } from './stories';
import type { Conversation } from './conversations';
import { CAST } from './stories';

export interface TogetherPrompt {
  /** What to do, for the grown-up. */
  en: string;
  /** A Finnish line to play and say together (taken from the content itself). */
  fi?: string;
}

/** After a story: talk about it, and say a line of it to each other. */
export function storyTogether(story: Story): TogetherPrompt {
  const talk = story.pages.flatMap((p) => p.lines).find((l) => l.by);
  const who = talk?.by ? CAST[talk.by].nameFi : undefined;
  return {
    en: who
      ? `Point at the pictures and ask what happened, then wait a few seconds for an answer. Take turns saying ${who}'s line:`
      : 'Point at the pictures and ask what happened, then wait a few seconds for an answer. Say this line together:',
    fi: talk?.fi ?? story.pages[0]?.lines[0]?.fi,
  };
}

/** During a scene: play it out loud, the grown-up as the other speaker. */
export function sceneTogether(scene: Pick<Conversation, 'turns'> | { turns: { partner: { fi: string } }[] }): TogetherPrompt {
  return {
    en: 'Play the scene out loud: you say the other side, your child answers. Swap and play it again.',
    fi: scene.turns[0]?.partner.fi,
  };
}

/**
 * One thing to try at home for each unit, off the screen. English for the
 * grown-up; *italics* are course words (checked in together.test.ts).
 */
export const AT_HOME: Readonly<Record<string, string>> = {
  hello: 'Greet each other in Finnish all week: *Hei!* in the morning, *Kiitos!* at the table, *Hyvää yötä!* at bedtime.',
  people: 'Look at family photos together and ask who is who. Let your child point and name: *äiti*, *isä*, *vauva*.',
  numbers: 'Count things on the way to school or at dinner: stairs, cars, forks — in Finnish, out loud.',
  having: "Play \"What's in my bag?\": take turns pulling out one thing and saying who has it.",
  'not-having': "Getting dressed: hold up a sock or a hat and ask whether your child has one on. Swap roles.",
  whose: 'Pick up things around the house and ask whose they are — mine or yours?',
  owners: 'At tidy-up time, ask whose each toy is and let your child answer with the owner’s name.',
  doing: 'Play charades: act out *syödä*, *juosta*, *laulaa* and let your child say what you are doing.',
  'doing-kpt': 'At bedtime, say together what everyone does now: who sleeps, who reads.',
  'not-doing': 'Silly game: say something that isn’t happening ("Isä sings!") and let your child say no, he isn’t.',
  asking: 'Ask yes-or-no questions at dinner and wait for a full answer, not just a nod.',
  feelings: 'At the end of the day, ask how your child feels and share how you feel too.',
  likes: 'Make a list of favorites together: foods, animals and colors your child likes and doesn’t like.',
  wanting: 'Before playtime, ask what your child wants to do — and let them ask you back.',
  'verbs-4': 'Play "open and close": doors, boxes, books — say what you are doing as you do it.',
  'school-day': 'After school, ask about one thing from the day and listen for the Finnish words your child knows.',
  play: 'Play a game or an instrument together and name it in Finnish while you play.',
  seeing: 'Play "I spy" on a walk, in Finnish: say what you see, and let your child find it.',
  shop: 'Play shop at home with real coins: one of you sells, the other buys and says thank you, *kiitos*.',
  commands: 'Play *Kapteeni käskee* (Simon says): take turns being the captain.',
  body: 'Play *Kapteeni käskee* with body parts: touch your *nenä*, lift your *käsi*.',
  describing: 'Go on a color hunt at home: find something *punainen*, something *sininen*, something *keltainen*.',
  comparing: 'Line up toys or family members: who is bigger, who is the biggest?',
  where: 'Hide a toy and give clues: is it in the box, on the table, under the bed?',
  moving: 'Moving game: put a toy into a box, take it out of the box, put it onto the chair — say each move.',
  town: 'On the way somewhere, say where you are going and where you are coming from.',
  'school-daycare': 'Practice asking nicely at home: may I have some water, may I go and play?',
  'by-with': 'Talk about how you travel and what you use: by bus, by bike, with a spoon, with a pencil.',
  when: 'At breakfast, ask what day it is today and what you will do this evening.',
  'my-day': 'Walk through the day together: wake up, breakfast, school, dinner, sleep — what time is each?',
  weather: 'Look out of the window every morning and say what the weather is like.',
  nature: 'On a walk, name what you find: a flower, a stone, a bird, the lake.',
  'big-numbers': 'Count to twenty together on the stairs, then count down on the way back.',
  birthdays: 'Find everyone’s birthday month on a calendar and say it in Finnish.',
  'finnish-year': 'Talk about the next Finnish holiday: what happens at Christmas, Easter or Midsummer?',
  'question-words': 'Take turns asking who, what and where questions about a picture book.',
  'me-you': 'Play "help me, help you": ask each other for help with small jobs.',
  around: 'Hide-and-seek with a toy: is it in front of, behind or next to something?',
  many: 'Sort toys into groups and say which there are many of.',
  'verbs-5-6': 'Talk about what each of you needs today, and choose a game together.',
  yesterday: 'At breakfast, tell each other one thing you did yesterday.',
  chatting: 'Have a short Finnish chat every day: how are you, what did you do, what will you do?',
  sentences: 'Make sentences together with toys: one says a word, the other adds the next.',
  mestari: 'Read a story aloud to each other, a page each.',
};

/** Real Finnish songs and rhymes, for listening together (links only, nothing bundled). */
export const SONG_LINKS: readonly { label: string; href: string; note: string }[] = [
  {
    label: 'Lasten Areena (Yle)',
    href: 'https://areena.yle.fi/lapset',
    note: 'Yle’s children’s programs, including Pikku Kakkonen and its songs.',
  },
  {
    label: 'Lastenlaulu (Finnish Wikipedia)',
    href: 'https://fi.wikipedia.org/wiki/Lastenlaulu',
    note: 'A grown-up’s guide to Finnish children’s songs, with well-known titles to look up and sing.',
  },
];

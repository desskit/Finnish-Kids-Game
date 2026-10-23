// School words (and customs, from the lesson words).

import * as school from '../school.mjs';

export default [
  {
    id: 'book',
    title: 'book',
    draw: (k) => {
      const c = k.P;
      return [
        k.ground(32, 58, 18, 2.2),
        k.poly([[19.4, 13.6], [49.6, 13.6], [49.6, 54.6], [19.4, 54.6]], 3, c.cream),
        k.line('M46.8 17.4V50.8M19.4 51.8H45.8', { color: c.creamShade, sw: 1.5 }),
        k.poly([[14.4, 9.4], [45.6, 9.4], [45.6, 51.4], [14.4, 51.4]], 3.6, c.red),
        k.flat('M15.7 13.2C15.7 11.6 16.6 10.7 18 10.7H21.4V50.1H18C16.6 50.1 15.7 49.2 15.7 47.6Z', c.redShade),
        k.line('M21.4 10.6V50.2', { sw: 1.5 }),
        k.rect(25.6, 17.4, 14.8, 9.2, 2, c.cream, { sw: 1.5 }),
        k.line('M28.6 21H37.4M28.6 23.6H34.2', { color: c.redShade, sw: 1.5 }),
        k.shine('M41.4 31.4V44.6', 2.2),
      ].join('');
    },
  },
  { id: 'teacher', title: 'teacher (Opettaja)', draw: school.teacher },
  { id: 'captain', title: 'captain (Leo in a captain\'s cap, saluting)', draw: school.captain },
  // the captain game's "Ei!" tile: tap it when the captain didn't say it
  { id: 'captain-no', title: "no! (the captain didn't say it)", glyphs: ['🙅‍♂️'], prop: true, theme: 'school', motion: { frames: 2, fps: 2.5 }, draw: school.captainNo },
  { id: 'friend', title: 'friend (Eero and Aino holding hands)', motion: { frames: 2, fps: 2 }, draw: school.friend },
  { id: 'pencil', title: 'pencil', draw: school.pencil },
  { id: 'backpack', title: 'backpack (with a reflector)', draw: school.backpack },
  { id: 'paper', title: 'paper', draw: school.paper },
  { id: 'picture', title: 'picture', draw: school.picture },
  // the long hand ticks round once every four seconds
  { id: 'clock', title: 'clock (ticking)', motion: { frames: 4, fps: 1 }, draw: school.clock },
  { id: 'homework', title: 'homework (the pencil writing)', motion: { frames: 3, fps: 3 }, draw: school.homework },
  { id: 'math', title: 'math (an abacus)', motion: { frames: 2, fps: 1.5 }, draw: school.math },
  { id: 'gym', title: 'gym (the gym hall, a ball bouncing)', motion: { frames: 3, fps: 3 }, draw: school.gym },
  { id: 'english', title: 'English (the flag waving)', motion: { frames: 2, fps: 2 }, draw: school.english },
  { id: 'pupil', title: 'pupil (Eero with his backpack)', draw: school.pupil },
  { id: 'test', title: 'test (the ticks going in)', motion: { frames: 4, fps: 1.5 }, draw: school.test },
  { id: 'customs', title: 'customs (a passport)', draw: school.customs },
  { id: 'recess', title: 'recess (Eero runs out of school with his ball)', motion: { frames: 4, fps: 6 }, draw: school.recess },
  { id: 'notebook', title: 'notebook (a spiral notebook)', draw: school.notebook },
  { id: 'glue', title: 'glue (a bottle of school glue)', draw: school.glue },
  { id: 'board', title: 'board (a chalkboard on its easel)', draw: school.board },
  { id: 'nurse', title: 'school nurse (a stethoscope, her bag with a cross)', draw: school.nurse },
  { id: 'bandage', title: 'bandage (a plaster with a star)', draw: school.bandage },
];

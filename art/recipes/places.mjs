// Place words.

export default [
  {
    id: 'house',
    title: 'house',
    draw: (k) => {
      const c = k.P;
      return [
        k.ground(32, 57.4, 23, 2.2),
        k.rect(39.6, 10.6, 7, 13, 1.4, c.brown),
        k.poly([[14.6, 26], [49.4, 26], [49.4, 55.4], [14.6, 55.4]], 2.4, c.cream),
        k.flat('M43.6 30H48.2V54.2H43.6Z', c.creamShade),
        k.poly([[32, 7.6], [56, 30.6], [8, 30.6]], [3.4, 2.6, 2.6], c.red),
        k.flat('M9.8 29.4H54.2L52.4 27.6H11.6Z', c.redShade),
        k.shine('M21.6 22.4L29.4 15', 2.2),
        k.path('M26.4 55.4V45.2A5.6 5.6 0 0 1 37.6 45.2V55.4Z', c.blue),
        k.flatCircle(34.6, 50, 1.2, c.yellow),
        k.rect(17.4, 35, 6.8, 6.8, 1.4, c.sky, { sw: 2, inRim: false }),
        k.rect(39.8, 35, 6.8, 6.8, 1.4, c.sky, { sw: 2, inRim: false }),
        k.line('M20.8 35V41.8M17.4 38.4H24.2M43.2 35V41.8M39.8 38.4H46.6', { sw: 1.5 }),
      ].join('');
    },
  },
];

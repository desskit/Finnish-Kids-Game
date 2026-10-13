// School words.

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
];

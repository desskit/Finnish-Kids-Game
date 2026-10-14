// The tiny tiles behind every screen, one per look (src/theme): faint sparkles
// and clover dots on Day's cream, little stars on Night's indigo, little
// hearts on Pink. A tile is a square of pixels in one palette color, laid over
// the page at a low opacity. The build writes src/art/generated/patterns/
// <look>.svg, and global.css tiles it behind the page.

/** The motifs: '#' is a pixel. */
const SPARKLE = ['...#...', '...#...', '..###..', '#######', '..###..', '...#...', '...#...'];
const DIAMOND = ['..#..', '.###.', '#####', '.###.', '..#..'];
const CLOVER = ['.#.', '###', '.#.'];
const STAR = ['..#..', '..#..', '#####', '..#..', '..#..'];
const DOT = ['#'];
const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
const SMALL_HEART = ['##.##', '#####', '.###.', '..#..'];

/** Each look's tile: its size in pixels, color, opacity, and where its motifs sit. */
export const PATTERNS = {
  day: {
    size: 48,
    color: 'tanShade',
    opacity: 0.34,
    motifs: [
      [SPARKLE, 5, 6],
      [CLOVER, 33, 13],
      [DIAMOND, 25, 33],
      [CLOVER, 8, 38],
      [DOT, 42, 42],
    ],
  },
  night: {
    size: 48,
    color: 'starlight',
    opacity: 0.13,
    motifs: [
      [STAR, 6, 7],
      [DOT, 28, 5],
      [DOT, 38, 21],
      [STAR, 29, 32],
      [DOT, 11, 38],
      [CLOVER, 17, 22],
    ],
  },
  pink: {
    size: 48,
    color: 'pinkShade',
    opacity: 0.26,
    motifs: [
      [HEART, 6, 7],
      [DOT, 31, 7],
      [SMALL_HEART, 30, 29],
      [CLOVER, 11, 35],
      [DOT, 42, 18],
    ],
  },
};

/** A tile as pixel runs: [x, y, length] for each row of each motif. */
export function patternRuns(pattern) {
  const runs = [];
  for (const [rows, x0, y0] of pattern.motifs) {
    rows.forEach((row, dy) => {
      for (const m of row.matchAll(/#+/g)) runs.push([(x0 + m.index) % pattern.size, (y0 + dy) % pattern.size, m[0].length]);
    });
  }
  return runs;
}

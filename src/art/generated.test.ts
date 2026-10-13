// @vitest-environment node
import { execFileSync } from 'node:child_process';

describe('the picture set', () => {
  it('is built from the current recipes (run `npm run art` after changing art/)', () => {
    // Throws (with the build's message) when src/art/generated is stale or a picture fails its lint.
    const out = execFileSync('node', ['scripts/build-art.mjs', '--check'], { encoding: 'utf8' });
    expect(out).toMatch(/up to date/);
  });
});

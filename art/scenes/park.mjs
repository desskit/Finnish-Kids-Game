// The park: grass, a sandy path, round trees, a lamp post. The cast stands on
// the open grass at the bottom middle, so nothing tall is drawn there.
// It moves: clouds drift by day and in the evening; at night the stars twinkle
// and the lamp's glow breathes; the rain falls, and so does the snow, which
// also lies white on the ground, the trees and the bushes.

import { crescentMoon, sceneSky, sceneLight, cloud, tree, bush, flower, lampPost, rainFall, snowCap, snowFall } from './parts.mjs';

export default {
  id: 'park',
  title: 'park',
  tones: ['day', 'evening', 'night', 'rain', 'snow'],
  motion: { frames: 2, fps: 1.5, byTone: { rain: { frames: 3, fps: 5 }, snow: { frames: 3, fps: 3 } } },
  /** What drifts across the sky (drawn here in the still version). */
  drift(k, tone) {
    if (tone !== 'day' && tone !== 'evening') return '';
    return cloud(k, 96, 44, 1) + cloud(k, 248, 30, 0.8) + (tone === 'evening' ? k.tint(k.P.orange, 0.12) : '');
  },
  draw(k, tone) {
    const c = k.P;
    const night = tone === 'night';
    const snow = tone === 'snow';
    const out = [sceneSky(k, tone)];
    if (tone === 'day') out.push(sunInSky(k, 352, 40));
    if (tone === 'evening') out.push(k.circle(78, 112, 24, c.coral));
    if (!k.moving && (tone === 'day' || tone === 'evening')) out.push(cloud(k, 96, 44, 1), cloud(k, 248, 30, 0.8));
    // far hills, near grass, the path
    out.push(k.path('M-4 120C48 96 110 94 170 112C222 98 300 86 404 108V204H-4Z', snow ? c.white : c.hillFar));
    out.push(tree(k, 136, 116, 0.55), tree(k, 258, 106, 0.5));
    out.push(k.path('M-4 148C70 134 150 138 210 144C280 136 340 134 404 140V204H-4Z', snow ? c.silver : c.grass));
    out.push(k.flat('M-4 176C80 168 150 172 210 176C290 170 350 168 404 172V204H-4Z', snow ? c.silverShade : c.grassShade, { opacity: 0.5 }));
    out.push(k.path('M150 204C160 178 196 166 246 160C290 155 340 152 404 152V163C344 164 300 166 260 171C216 177 190 188 184 204Z', snow ? c.silverShade : c.path));
    out.push(tree(k, 46, 154, 1), tree(k, 352, 150, 0.9));
    out.push(lampPost(k, 314, 158, night));
    out.push(bush(k, 104, 152, 1), bush(k, 390, 152, 0.8));
    if (snow) {
      // snow on the crowns (tree: crown centre gy − 44s, radius 22s) and the bushes
      for (const [x, gy, s] of [[136, 116, 0.55], [258, 106, 0.5], [46, 154, 1], [352, 150, 0.9]]) out.push(snowCap(k, x, gy - 44 * s, 22 * s));
      out.push(snowCap(k, 104, 152, 15), snowCap(k, 390, 152, 12), snowFall(k));
    } else {
      for (const [x, y, col] of [[22, 186, 'pink'], [84, 178, 'yellow'], [118, 190, 'white'], [312, 186, 'pink'], [368, 192, 'yellow'], [262, 194, 'white']]) {
        out.push(flower(k, x, y, c[col]));
      }
    }
    if (tone === 'rain') out.push(k.ellipse(224, 182, 16, 3.4, c.water), k.ellipse(318, 162, 12, 2.8, c.water), rainFall(k));
    out.push(sceneLight(k, tone));
    if (night) {
      out.push(crescentMoon(k, 334, 44, 16));
      out.push(lampPost(k, 314, 158, true, true));
    }
    return out.join('');
  },
};

function sunInSky(k, x, y) {
  const c = k.P;
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const a = ((i * 45 - 90) * Math.PI) / 180;
    const p = (r) => `${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)}`;
    rays.push(k.limb(`M${p(20.5)}L${p(i % 2 ? 25 : 27.5)}`, c.amber, 6.6));
  }
  return rays.join('') + k.circle(x, y, 16, c.yellow);
}

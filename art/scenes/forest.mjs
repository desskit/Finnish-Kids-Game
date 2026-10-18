// The forest: tall pines and spruces, two birches, mossy rocks, a red
// toadstool with white spots, a blueberry bush, a path through the moss. In
// the rain the sky is grey, the rain falls and puddles lie on the path; in
// the snow the ground is white, snow lies on the trees and rocks and more
// falls; otherwise the clouds drift.

import { pine } from '../nature.mjs';
import { cloud, rainFall, sceneSky, snowCap, snowFall } from './parts.mjs';
import { birch, forestLine, grassland, snowOnPine } from './outdoors.mjs';

export default {
  id: 'forest',
  title: 'forest',
  tones: ['day', 'rain', 'snow'],
  motion: { frames: 3, fps: 5, byTone: { snow: { fps: 3 } } },
  drift(k, tone) {
    return tone === 'day' ? cloud(k, 180, 30, 0.8) + cloud(k, 330, 18, 0.6) : '';
  },
  draw(k, tone) {
    const c = k.P;
    const rain = tone === 'rain';
    const snow = tone === 'snow';
    const out = [sceneSky(k, tone), k.moving || tone !== 'day' ? '' : cloud(k, 180, 30, 0.8) + cloud(k, 330, 18, 0.6)];
    const pines = [[34, 150, 130], [92, 142, 98], [330, 148, 112], [380, 154, 136]];
    out.push(
      forestLine(k, 122),
      grassland(k, 120, snow ? 'silver' : 'grass'),
      k.path('M150 204C170 170 190 150 214 140H232C220 156 214 180 226 204Z', snow ? c.silverShade : c.path),
      ...pines.slice(0, 2).map(([x, b, h]) => pine(k, x, b, h) + (snow ? snowOnPine(k, x, b, h) : '')),
      birch(k, 140, 146, 92),
      birch(k, 280, 144, 86),
      ...pines.slice(2).map(([x, b, h]) => pine(k, x, b, h) + (snow ? snowOnPine(k, x, b, h) : '')),
      // rocks
      k.path('M44 174C44 160 58 154 72 156C84 158 92 166 90 176Z', c.grey),
      snow ? k.path('M46 166C48 158 60 154 72 156C80 157 86 161 88 166C80 163 70 164 62 166C56 164 50 165 46 166Z', c.white) : k.flat('M60 157C70 156 80 160 86 168C80 166 70 164 62 166Z', c.green),
      k.path('M330 182C332 172 344 168 354 170C364 172 368 178 366 184Z', c.grey),
    );
    if (snow) {
      out.push(
        snowCap(k, 140, 78, 26, 30),
        snowCap(k, 280, 82, 26, 30),
        k.path('M331 177C334 171 344 168 354 170C361 171 365 175 366 178C358 176 350 177 344 178C340 176 335 176 331 177Z', c.white),
        snowFall(k),
      );
    } else {
      out.push(
        // a toadstool
        k.rect(116, 168, 8, 14, 2, c.white),
        k.path('M106 170C106 160 134 160 134 170Z', c.red),
        k.flatCircle(114, 165, 1.6, c.white),
        k.flatCircle(124, 163, 1.8, c.white),
        k.flatCircle(130, 167, 1.4, c.white),
        // a blueberry bush
        k.path('M262 182C258 170 270 162 280 166C288 160 300 166 298 176C302 180 298 186 292 186H268C264 186 262 184 262 182Z', c.greenShade),
        ...[[272, 174], [282, 170], [290, 178], [278, 180]].map(([x, y]) => k.circle(x, y, 2.2, c.blue)),
      );
    }
    if (rain) out.push(k.ellipse(192, 186, 18, 4, c.water), k.ellipse(244, 194, 12, 3, c.water), rainFall(k));
    return out.join('');
  },
};

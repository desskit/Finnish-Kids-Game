// The bathroom: white tiles, a small window high up, the sink under its
// mirror with a cup of toothbrushes, a towel on its hook, the bathtub with a
// rubber duck and the shower curtain pulled back. Bubbles rise from the bath.

import { roomLight, roomWindow } from './rooms.mjs';
import { SCENE_H, SCENE_W } from './parts.mjs';

/** Bubbles over the bath: they rise a step on each frame. */
function bubbles(k) {
  const f = k.frames > 1 ? k.frame % 3 : 0;
  return [[300, 0], [322, 1], [346, 2], [366, 1]]
    .map(([x, i]) => {
      const s = (i + f) % 3;
      return k.circle(x + (s % 2) * 3, 98 - s * 9, 3 + (s === 1 ? 1 : 0), k.P.white, { sw: 1.5 });
    })
    .join('');
}

export default {
  id: 'bathroom',
  title: 'bathroom',
  tones: ['inside', 'morning', 'evening'],
  motion: { frames: 3, fps: 2 },
  draw(k, tone) {
    const c = k.P;
    const floorY = 150;
    const wallTiles = [];
    for (let x = 0; x <= SCENE_W; x += 20) wallTiles.push(`M${x} 64V${floorY}`);
    for (let y = 64; y < floorY; y += 20) wallTiles.push(`M0 ${y}H${SCENE_W}`);
    const floorTiles = [];
    for (let x = 0; x <= SCENE_W; x += 32) floorTiles.push(`M${x} ${floorY}V${SCENE_H}`);
    for (let y = floorY + 16; y < SCENE_H; y += 16) floorTiles.push(`M0 ${y}H${SCENE_W}`);
    return [
      // the wall: paint above, white tiles below; the tiled floor
      k.flat(`M0 0H${SCENE_W}V${floorY}H0Z`, c.mint),
      k.flat(`M0 64H${SCENE_W}V${floorY}H0Z`, c.white),
      k.line(wallTiles.join(''), { color: c.silverShade, sw: 1 }),
      k.flat(`M0 ${floorY}H${SCENE_W}V${SCENE_H}H0Z`, c.silver),
      k.line(floorTiles.join(''), { color: c.silverShade, sw: 1 }),
      k.line(`M0 ${floorY}H${SCENE_W}`),
      // a small window high on the wall
      roomWindow(k, 22, 14, 62, 40, tone, 'sky'),
      // the mirror over the sink, the sky of the window in it
      k.rect(108, 22, 64, 50, 4, c.silver),
      k.rect(113, 27, 54, 40, 2, c.skyDayLow),
      k.flat('M118 60L140 30H150L128 60Z', c.white, { opacity: 0.7 }),
      // the sink on its pedestal, the tap
      k.rect(128, 112, 24, 38, 2, c.white),
      k.path('M102 94H178V100C178 110 164 116 140 116C116 116 102 110 102 100Z', c.white),
      k.limb('M140 94V86Q140 82 144 82H150', c.grey, 4.4),
      // the cup of toothbrushes on the sink's edge
      k.rect(160, 82, 12, 13, 2, c.yellow),
      k.limb('M163 82L160 66', c.blue, 3.8),
      k.limb('M169 82L172 68', c.red, 3.8),
      k.rect(156.6, 62, 6, 5, 1.4, c.white),
      k.rect(169.6, 64, 6, 5, 1.4, c.white),
      // the towel on its hook
      k.flatCircle(214, 70, 2.6, c.charcoal),
      k.rect(200, 72, 28, 40, 3, c.coral),
      k.flat('M200 100H228V104H200Z', c.coralShade),
      // the shower curtain, pulled back, on its rail
      k.limb('M262 16H398', c.grey, 4.4),
      k.path('M378 18H398V104C392 98 386 102 380 96C382 70 376 40 378 18Z', c.sky),
      k.line('M386 24C385 50 387 74 385 96M392 22C391 50 393 76 391 100', { color: c.skyShade, sw: 1.5 }),
      // the bathtub, the duck on its rim
      k.path('M262 108H398V128C398 142 386 150 372 150H288C274 150 262 142 262 128Z', c.white),
      k.flat('M266 112H394V116H266Z', c.silver),
      k.circle(282, 102, 6, c.yellow),
      k.circle(288, 96, 4, c.yellow),
      k.flat('M291 95L296 96L291 98Z', c.orange),
      k.flatCircle(289, 95, 0.9, c.ink),
      bubbles(k),
      roomLight(k, tone, 'M22 14H84L160 150H70Z'),
    ].join('');
  },
};

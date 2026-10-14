// The app's icons, made from the pixel fox (the avatar-fox picture): the PWA
// icons and the apple-touch icon as PNGs, and the favicon as an SVG. Each is
// the same 48-pixel art the app shows, every pixel scaled up whole, on a
// rounded square of the app's blue. No image libraries: the PNGs are encoded
// with Node's zlib. The icons are committed; run `npm run icons` after changing
// the fox.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { RECIPES } from '../art/index.mjs';
import { fmt, makeKit } from '../art/kit.mjs';
import { gridToSvg, rasterize } from '../art/pixel.mjs';
import { STYLE } from '../art/style.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const outDir = join(publicDir, 'icons');
mkdirSync(outDir, { recursive: true });

// --- The fox, as pixels ----------------------------------------------------------

const GRID = STYLE.grid;
const fox = RECIPES.find((r) => r.id === 'avatar-fox');
const px = 64 / GRID;
const pixels = rasterize(`<g stroke-width="${fmt(px)}">${fox.draw(makeKit({ px }))}</g>`, { cols: GRID, rows: GRID, width: 64, height: 64 });

// the fox's own box, in pixels
let [x0, y0, x1, y1] = [GRID, GRID, -1, -1];
pixels.forEach((row, y) =>
  row.forEach((p, x) => {
    if (!p || p.a < 0.5) return;
    [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  }),
);
const W = x1 - x0 + 1;
const H = y1 - y0 + 1;

/** The app's blue, behind the fox. */
const BG = [0x4c, 0x6f, 0xd4];
const BG_HEX = '#4C6FD4';

// --- PNG -------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** An RGB PNG, `size` square, colored by pixelFn(x, y) → [r, g, b]. */
function makePng(size, pixelFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  const stride = size * 3;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter type: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelFn(x, y);
      const o = y * (stride + 1) + 1 + x * 3;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/**
 * The fox on the blue, `size` square, each art pixel `scale` icon pixels wide,
 * centred. (Maskable icons keep the fox inside the middle 80%.)
 */
function icon(size, scale) {
  const ox = Math.round((size - W * scale) / 2);
  const oy = Math.round((size - H * scale) / 2);
  return makePng(size, (x, y) => {
    const gx = Math.floor((x - ox) / scale) + x0;
    const gy = Math.floor((y - oy) / scale) + y0;
    const p = x >= ox && y >= oy && gx <= x1 && gy <= y1 ? pixels[gy][gx] : null;
    if (!p) return BG;
    return BG.map((v, i) => Math.round(v + (p.rgb[i] - v) * p.a));
  });
}

writeFileSync(join(outDir, 'icon-192.png'), icon(192, 4));
writeFileSync(join(outDir, 'icon-512.png'), icon(512, 9));
writeFileSync(join(outDir, 'apple-touch-icon.png'), icon(180, 4));

// --- The favicon: the fox's pixels as SVG squares, on the blue ---------------------

const side = Math.max(W, H) + 8;
const box = [x0 - Math.floor((side - W) / 2), y0 - Math.floor((side - H) / 2), side, side];
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.join(' ')}" width="64" height="64" shape-rendering="crispEdges">
  <rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" rx="${Math.round(box[2] * 0.2)}" fill="${BG_HEX}"/>
  ${gridToSvg(pixels)}
</svg>
`;
writeFileSync(join(publicDir, 'favicon.svg'), favicon);

console.log(`Wrote the fox icons (${W}×${H} art pixels) to public/icons and public/favicon.svg`);

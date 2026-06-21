// Generates simple placeholder PWA icons (solid background + accent circle).
// No image libraries required — encodes PNGs directly with Node's zlib.
// Real artwork will replace these in a later, art-focused session.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

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

// pixelFn(x, y) -> [r, g, b]
function makePng(size, pixelFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  // 10,11,12 = compression, filter, interlace = 0

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
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const BG = [29, 78, 216]; // #1d4ed8
const ACCENT = [147, 197, 253]; // #93c5fd
const ACCENT2 = [255, 255, 255];

function icon(size) {
  const c = size / 2;
  const rOuter = size * 0.32;
  const rInner = size * 0.16;
  return makePng(size, (x, y) => {
    const dx = x - c;
    const dy = y - c;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < rInner) return ACCENT2;
    if (d < rOuter) return ACCENT;
    return BG;
  });
}

for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), icon(size));
}
writeFileSync(join(outDir, 'apple-touch-icon.png'), icon(180));

console.log('Wrote placeholder icons to', outDir);

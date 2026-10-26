// Writes public/media/brand/grain.webp: a 128x128 tileable monochrome noise tile (static grain texture).
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const S = 128, buf = Buffer.alloc(S * S);
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < S * S; i++) buf[i] = Math.round(rnd() * 255);
await sharp(buf, { raw: { width: S, height: S, channels: 1 } }).webp({ quality: 50 })
  .toFile(fileURLToPath(new URL('../public/media/brand/grain.webp', import.meta.url)));
console.log('ok');

// Converts raster art to WebP with sharp and reports size and how close the result is to the original.
// Usage: node scripts/to-webp.mjs public/art/chapter-01-comic.png [...more]
// Writes the .webp next to each file; the original is left for the caller to remove once references move.
import sharp from 'sharp';
import {statSync} from 'node:fs';

const QUALITY = Number(process.env.QUALITY ?? 92);

/** What a viewer sees: colour weighted by opacity, so invisible pixels under full transparency do not count. */
async function visible(file) {
  const {data, info} = await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const out = new Float32Array(data.length);
  for (let i = 0; i < data.length; i += 4) { const a = data[i + 3] / 255; out[i] = data[i] * a; out[i + 1] = data[i + 1] * a; out[i + 2] = data[i + 2] * a; out[i + 3] = data[i + 3]; }
  return {out, info};
}
/** Peak signal-to-noise ratio of the visible image; above ~40 dB the difference is not visible. */
async function psnr(a, b) {
  const [x, y] = await Promise.all([visible(a), visible(b)]);
  if (x.info.width !== y.info.width || x.info.height !== y.info.height) throw new Error('size changed');
  let sum = 0;
  for (let i = 0; i < x.out.length; i++) { const d = x.out[i] - y.out[i]; sum += d * d; }
  const mse = sum / x.out.length;
  return mse === 0 ? Infinity : 10 * Math.log10(255 * 255 / mse);
}

let before = 0, after = 0;
for (const file of process.argv.slice(2)) {
  const out = file.replace(/\.(png|jpe?g)$/i, '.webp');
  const meta = await sharp(file).metadata();
  await sharp(file).webp({quality: QUALITY, alphaQuality: 100, effort: 6, smartSubsample: true}).toFile(out);
  const a = statSync(file).size, b = statSync(out).size;
  before += a; after += b;
  const db = await psnr(file, out);
  console.log(`${file.padEnd(46)} ${meta.width}x${meta.height}${meta.hasAlpha ? ' alpha' : ''}  ${(a / 1e6).toFixed(2)} MB -> ${(b / 1e6).toFixed(2)} MB  ${db === Infinity ? 'identical' : db.toFixed(1) + ' dB'}`);
}
console.log(`TOTAL ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB (${Math.round((1 - after / before) * 100)}% smaller)`);

// Turns the Higgsfield downloads in assets-raw/ into web assets:
// 1. Archives each original (visually lossless WebP, quality 92) in assets-source/higgsfield/ (committed, so nothing depends on Higgsfield).
// 2. Writes sized WebP backgrounds to public/art/.
// 3. Builds the logo tile and every PWA icon from the generated logo.
// 4. Keys the badge backdrops out and writes public/art/badges/<id>.webp.
// Usage: npm run art
import fs from 'node:fs'
import sharp from 'sharp'

const RAW = 'assets-raw'
const SRC = 'assets-source/higgsfield'
fs.mkdirSync(SRC, { recursive: true })
fs.mkdirSync('public/art/badges', { recursive: true })
fs.mkdirSync('public/icons', { recursive: true })

/** The archived original if present, otherwise archive the raw download first. */
async function source(name) {
  const archived = `${SRC}/${name}-original.webp`
  if (!fs.existsSync(archived)) {
    const raw = ['png', 'jpg', 'jpeg', 'webp'].map((e) => `${RAW}/${name}.${e}`).find((p) => fs.existsSync(p))
    if (!raw) return null
    await sharp(raw).webp({ quality: 92, effort: 6 }).toFile(archived)
  }
  return archived
}

// Backgrounds: softened slightly so they stay restful behind text.
for (const [name, width] of [
  ['dawn-wide', 1920],
  ['dawn-portrait', 1080],
  ['calm-dusk-wide', 1920],
  ['calm-dusk-portrait', 1080],
]) {
  const src = await source(name)
  if (!src) {
    console.log(`${name}: no source, skipped`)
    continue
  }
  await sharp(src).resize({ width, withoutEnlargement: true }).modulate({ saturation: 0.9 }).webp({ quality: 74, effort: 6 }).toFile(`public/art/${name}.webp`)
  console.log(`${name} ✓`)
}

// Logo: trim the flat backdrop, centre the emblem on a forest tile, export icons.
const logo = await source('logo')
if (logo) {
  // Key the generated backdrop out entirely, then place the emblem on one even cream tile.
  const bgc = { r: 242, g: 238, b: 228, alpha: 1 }
  const emblem = await emblemCut(logo)
  const tile = async (size, pad, rounded) => {
    const inner = Math.round(size * (1 - pad * 2))
    const art = await sharp(emblem).resize(inner, inner, { fit: 'contain', background: bgc }).toBuffer()
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" fill="#fff"/></svg>`)
    return sharp({ create: { width: size, height: size, channels: 4, background: bgc } })
      .composite([{ input: art, gravity: 'center' }, ...(rounded ? [{ input: mask, blend: 'dest-in' }] : [])])
      .png()
      .toBuffer()
  }
  await sharp(await tile(192, 0.08, true)).webp({ quality: 90 }).toFile('public/art/logo-192.webp')
  await sharp(await tile(192, 0.1, false)).toFile('public/icons/icon-192.png')
  await sharp(await tile(512, 0.1, false)).toFile('public/icons/icon-512.png')
  await sharp(await tile(512, 0.2, false)).toFile('public/icons/maskable-512.png')
  await sharp(await tile(180, 0.1, false)).toFile('public/icons/apple-touch-icon.png')
  await sharp(await tile(64, 0.06, true)).toFile('public/favicon.png')
  console.log('logo and icons ✓')
}

/**
 * The logo sits on textured paper, so it is cut by colour instead: pixels with real saturation (the
 * gold sun, green peaks and water) stay, near grey paper fades to transparent, then it is cropped tight.
 */
async function emblemCut(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  let x0 = w, y0 = h, x1 = 0, y1 = 0
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const s = max ? (max - min) / max : 0
    const a = Math.max(0, Math.min(1, (s - 0.14) / 0.12))
    data[i * 4 + 3] = Math.round(a * 255)
    if (a > 0.5) {
      const x = i % w, y = (i / w) | 0
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .png()
    .toBuffer()
}

/** Removes the flat backdrop by colour distance from the corners, flood filled from the edges. */
async function key(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const corners = [0, w - 1, (h - 1) * w, h * w - 1].map((i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]])
  const bg = [0, 1, 2].map((c) => corners.map((p) => p[c]).sort((a, b) => a - b)[1])
  const isBg = (i) => Math.hypot(data[i * 4] - bg[0], data[i * 4 + 1] - bg[1], data[i * 4 + 2] - bg[2]) < 28
  const removed = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
  while (stack.length) {
    const i = stack.pop()
    if (removed[i] || !isBg(i)) continue
    removed[i] = 1
    const x = i % w
    const y = (i / w) | 0
    if (x > 0) stack.push(i - 1)
    if (x < w - 1) stack.push(i + 1)
    if (y > 0) stack.push(i - w)
    if (y < h - 1) stack.push(i + w)
  }
  for (let i = 0; i < w * h; i++) {
    if (removed[i]) data[i * 4 + 3] = 0
    else {
      const x = i % w
      const y = (i / w) | 0
      if ((x > 0 && removed[i - 1]) || (x < w - 1 && removed[i + 1]) || (y > 0 && removed[i - w]) || (y < h - 1 && removed[i + w])) data[i * 4 + 3] = 160
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer()
}

/**
 * The badges are round enamel pins on textured backdrops, so colour keying is unreliable. Instead:
 * find the largest saturated region (the green and gold pin), take its bounding circle, and cut it
 * out with a soft circular mask.
 */
async function circleCut(input) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const sat = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2]
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    sat[i] = max > 60 && (max - min) / max > 0.16 ? 1 : 0
  }
  // Largest 4-connected saturated component.
  const label = new Int32Array(w * h).fill(-1)
  let best = { size: 0, x0: 0, y0: 0, x1: 0, y1: 0 }
  for (let start = 0; start < w * h; start++) {
    if (!sat[start] || label[start] !== -1) continue
    const stack = [start]
    label[start] = start
    let size = 0, x0 = w, y0 = h, x1 = 0, y1 = 0
    while (stack.length) {
      const i = stack.pop()
      size++
      const x = i % w, y = (i / w) | 0
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
      for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
        if (n >= 0 && sat[n] && label[n] === -1) {
          label[n] = start
          stack.push(n)
        }
      }
    }
    if (size > best.size) best = { size, x0, y0, x1, y1 }
  }
  const cx = (best.x0 + best.x1) / 2, cy = (best.y0 + best.y1) / 2
  const r = Math.min(Math.max(best.x1 - best.x0, best.y1 - best.y0) / 2 + 2, cx, cy, w - cx, h - cy)
  const side = Math.round(r * 2)
  const left = Math.max(0, Math.round(cx - r)), top = Math.max(0, Math.round(cy - r))
  const crop = await sharp(input).extract({ left, top, width: Math.min(side, w - left), height: Math.min(side, h - top) }).resize(side, side).png().toBuffer()
  const mask = Buffer.from(`<svg width="${side}" height="${side}"><circle cx="${side / 2}" cy="${side / 2}" r="${side / 2 - 1}" fill="#fff"/></svg>`)
  return sharp(crop).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
}

for (const id of ['first-step', 'one-day', 'three-day', 'one-week', 'two-weeks', 'thirty-days', 'sixty-days', 'ninety-days', 'half-year', 'one-year']) {
  const src = await source(`badge-${id}`)
  if (!src) {
    console.log(`badge-${id}: no source, skipped`)
    continue
  }
  await sharp(await circleCut(src))
    .resize({ width: 192, height: 192, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 86, alphaQuality: 95 })
    .toFile(`public/art/badges/${id}.webp`)
  console.log(`badge-${id} ✓`)
}

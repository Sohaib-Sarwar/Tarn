// Builds Tarn's PWA icons and social preview from SVG: a sun over two peaks mirrored in a still lake.
// No words on the icon, so the installed app reveals nothing. Usage: npm run icons
import fs from 'node:fs'
import sharp from 'sharp'

const OUT = 'public'
// The mark on a 32 unit grid, cream and sage on forest for the app icon.
const mark = (size, pad) => {
  const s = (size - pad * 2) / 32
  return `<g transform="translate(${pad} ${pad}) scale(${s})">
    <circle cx="16" cy="13.2" r="3.9" fill="#c6a66b"/>
    <path d="M2.5 21.8 L10 9.6 L16 18.2 L21.6 12.6 L29.5 21.8 Z" fill="#a7b99a"/>
    <path d="M5 24.6 H27" stroke="#faf8f2" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M9.5 28 H22.5" stroke="#faf8f2" stroke-opacity="0.55" stroke-width="2.2" stroke-linecap="round"/>
  </g>`
}
const icon = (size, pad, rounded) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" fill="#244b3a"/>${mark(size, pad)}</svg>`

fs.mkdirSync(`${OUT}/icons`, { recursive: true })
fs.writeFileSync(`${OUT}/icon.svg`, icon(64, 9, true))
await sharp(Buffer.from(icon(192, 30, false))).png().toFile(`${OUT}/icons/icon-192.png`)
await sharp(Buffer.from(icon(512, 80, false))).png().toFile(`${OUT}/icons/icon-512.png`)
// Maskable: the mark stays inside the central safe zone (radius 40% of the icon).
await sharp(Buffer.from(icon(512, 128, false))).png().toFile(`${OUT}/icons/maskable-512.png`)
await sharp(Buffer.from(icon(180, 28, false))).png().toFile(`${OUT}/icons/apple-touch-icon.png`)

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe2c6"/><stop offset="1" stop-color="#f7f3ea"/></linearGradient>
  <linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe6d6"/><stop offset="1" stop-color="#c9d3bf"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#s)"/>
  <circle cx="860" cy="300" r="56" fill="#e4c88f" opacity="0.85"/>
  <path d="M520 380 L640 330 L700 350 L800 236 L880 330 L920 312 L960 330 L1060 236 L1160 340 L1200 360 V430 H520 Z" fill="#a7b99a"/>
  <path d="M520 410 Q760 380 1000 404 T1200 400 V440 H520 Z" fill="#788b68"/>
  <rect x="520" y="430" width="680" height="200" fill="url(#w)"/>
  <path d="M640 430 L800 520 L880 452 L960 470 L1060 520 L1200 430 Z" fill="#a7b99a" opacity="0.3"/>
  <path d="M700 480 H840 M900 500 H1060" stroke="#faf8f2" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  <path d="M520 0 V630" stroke="#f5f1e8" stroke-width="0"/>
  <rect width="560" height="630" fill="#f5f1e8"/>
  <g transform="translate(80 110) scale(2.2)">${'<circle cx="16" cy="13.2" r="3.9" fill="#c6a66b"/><path d="M2.5 21.8 L10 9.6 L16 18.2 L21.6 12.6 L29.5 21.8 Z" fill="#788b68"/><path d="M5 24.6 H27" stroke="#244b3a" stroke-width="2.2" stroke-linecap="round"/><path d="M9.5 28 H22.5" stroke="#244b3a" stroke-opacity="0.55" stroke-width="2.2" stroke-linecap="round"/>'}</g>
  <text x="164" y="160" font-family="Georgia, serif" font-size="52" fill="#202720">Tarn</text>
  <text x="80" y="300" font-family="Georgia, serif" font-size="60" fill="#202720">Come back</text>
  <text x="80" y="372" font-family="Georgia, serif" font-size="60" font-style="italic" fill="#244b3a">to yourself.</text>
  <text x="80" y="450" font-family="Arial, sans-serif" font-size="24" fill="#4f5a4e">A calm, private space</text>
  <text x="80" y="482" font-family="Arial, sans-serif" font-size="24" fill="#4f5a4e">for the habits you choose.</text>
</svg>`
await sharp(Buffer.from(og)).jpeg({ quality: 84, mozjpeg: true }).toFile(`${OUT}/og.jpg`)
console.log('Tarn icons ✓')

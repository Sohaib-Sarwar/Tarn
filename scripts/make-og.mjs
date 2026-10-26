// Builds the social preview (public/og.jpg) from the generated dawn scene and logo. Usage: npm run og
import sharp from 'sharp'

const W = 1200
const H = 630
const scene = await sharp('public/art/dawn-wide.webp').resize(W, H, { fit: 'cover' }).toBuffer()
const logo = await sharp('public/art/logo-192.webp').resize(88, 88).toBuffer()
const veil = Buffer.from(`<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#e7e5dd" stop-opacity="0.94"/><stop offset="0.55" stop-color="#e7e5dd" stop-opacity="0.55"/><stop offset="1" stop-color="#e7e5dd" stop-opacity="0"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="196" y="133" font-family="Georgia, serif" font-size="54" fill="#26302a">Tarn</text>
  <text x="80" y="300" font-family="Georgia, serif" font-size="70" fill="#26302a">Come back</text>
  <text x="80" y="382" font-family="Georgia, serif" font-size="70" font-style="italic" fill="#2f5a47">to yourself.</text>
  <text x="80" y="460" font-family="Arial, sans-serif" font-size="26" fill="#536058">A calm, private companion for the habits you choose.</text></svg>`)
await sharp(scene).composite([{ input: veil }, { input: logo, left: 80, top: 66 }]).jpeg({ quality: 84, mozjpeg: true }).toFile('public/og.jpg')
console.log('og.jpg ✓')

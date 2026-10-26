// Builds the install QR on the landing page (public/qr-install.png). It opens Tarn with ?install=1,
// which shows the install steps for that phone. Usage: npm run qr
import fs from 'node:fs'
import QRCode from 'qrcode'
import sharp from 'sharp'
import jsQR from 'jsqr'

const URL = `${(process.env.SITE_URL ?? 'https://tarn-rehab.vercel.app').replace(/\/$/, '')}/?install=1`
const png = await QRCode.toBuffer(URL, { errorCorrectionLevel: 'H', margin: 2, width: 512, color: { dark: '#1f4a37', light: '#ffffff' } })
// The leaf logo in the middle; error correction H tolerates it.
const logo = await sharp('public/art/logo-192.webp').resize(112, 112).png().toBuffer()
const out = await sharp(png).composite([{ input: logo, gravity: 'center' }]).png().toBuffer()
fs.writeFileSync('public/qr-install.png', out)

// Check it still decodes after adding the logo.
const { data, info } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const read = jsQR(new Uint8ClampedArray(data), info.width, info.height)
if (read?.data !== URL) throw new Error(`QR does not decode to ${URL} (got ${read?.data})`)
console.log(`qr-install.png ✓ ${URL}`)

/**
 * Renders public/og.png (1200x630) for Touch Road Rentals.
 *
 * The image is built from an inline HTML string, so this never needs the dev
 * server, a network fetch, or a browser download step.
 *
 * Usage: node scripts/make-og.mjs
 */
import { chromium } from 'playwright'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public')
const OUT_FILE = join(OUT_DIR, 'og.png')

const WIDTH = 1200
const HEIGHT = 630

/** Pull a single-quoted string out of src/site.config.ts, with a literal fallback. */
function configString(key, fallback) {
  try {
    const source = readFileSync(join(ROOT, 'src', 'site.config.ts'), 'utf8')
    const match = source.match(new RegExp(`${key}:\\s*'([^']*)'`))
    return match ? match[1] : fallback
  } catch {
    return fallback
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Inline a self-hosted @fontsource face so the render does not depend on system fonts. */
function fontFace(family, weight, relativePath) {
  const file = join(ROOT, 'node_modules', relativePath)
  if (!existsSync(file)) return ''
  const data = readFileSync(file).toString('base64')
  return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2');}`
}

const brandName = configString('brandName', 'Touch Road Rentals')
const headline = configString('headline', 'Rent for less on the Emerald Coast.')
const priceLine = configString('priceLine', 'The price you see is the price you drive.')
const pills = ['Sample listings', 'No booking fees', 'Preview build']

const fonts = [
  fontFace('Archivo', 800, '@fontsource/archivo/files/archivo-latin-800-normal.woff2'),
  fontFace('Archivo', 700, '@fontsource/archivo/files/archivo-latin-700-normal.woff2'),
  fontFace('Inter', 500, '@fontsource/inter/files/inter-latin-500-normal.woff2'),
  fontFace('JetBrains Mono', 500, '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2'),
].join('')

/** Straight profile car, drawn in the same flat style the app uses for silhouettes. */
const car = `
<svg class="car" viewBox="0 0 420 170" width="440" height="178" aria-hidden="true">
  <rect x="0" y="152" width="420" height="3" rx="1.5" fill="#C9D6F5" opacity="0.28" />
  <path d="M12 120 L12 94 L120 78 L166 42 L268 42 L314 78 L400 92 L406 106 L406 120 Z" fill="#C9D6F5" />
  <path d="M172 50 L208 50 L208 78 L146 78 Z" fill="#0a0f1c" />
  <path d="M218 50 L262 50 L296 78 L218 78 Z" fill="#0a0f1c" />
  <circle cx="108" cy="122" r="30" fill="#C9D6F5" />
  <circle cx="108" cy="122" r="13" fill="#0a0f1c" />
  <circle cx="326" cy="122" r="30" fill="#C9D6F5" />
  <circle cx="326" cy="122" r="13" fill="#0a0f1c" />
</svg>`

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
${fonts}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${WIDTH}px;height:${HEIGHT}px;}
body{
  position:relative;
  overflow:hidden;
  background:
    radial-gradient(700px 560px at 84% -4%, rgba(46,107,255,0.72), rgba(46,107,255,0) 66%),
    radial-gradient(540px 440px at 106% 40%, rgba(92,140,255,0.26), rgba(92,140,255,0) 70%),
    #0a0f1c;
  color:#ffffff;
  font-family:Inter,'Segoe UI',system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;
}
.frame{
  position:absolute;
  inset:0;
  padding:74px 78px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
}
.wordmark{
  display:flex;
  align-items:center;
  gap:16px;
  font-family:Archivo,'Segoe UI',system-ui,sans-serif;
  font-weight:800;
  font-size:27px;
  letter-spacing:-0.01em;
}
.mark{width:44px;height:44px;border-radius:12px;background:#111a2e;display:block;}
.copy{max-width:730px;}
.headline{
  font-family:Archivo,'Segoe UI',system-ui,sans-serif;
  font-weight:800;
  font-size:76px;
  line-height:1.04;
  letter-spacing:-0.026em;
  color:#ffffff;
}
.price{
  margin-top:26px;
  font-size:31px;
  line-height:1.3;
  font-weight:500;
  color:#8FB0FF;
}
.pills{display:flex;gap:14px;}
.pill{
  font-family:'JetBrains Mono',ui-monospace,'SFMono-Regular',Menlo,monospace;
  font-weight:500;
  font-size:16px;
  letter-spacing:0.08em;
  text-transform:uppercase;
  color:#C9D6F5;
  border:1.5px solid rgba(201,214,245,0.34);
  border-radius:999px;
  padding:13px 22px;
}
.car{position:absolute;right:58px;bottom:112px;}
</style>
</head>
<body>
  <div class="frame">
    <div class="wordmark">
      <svg class="mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#111a2e" />
        <path d="M8.5 25C8.5 15.9 12.2 9 16 9s7.5 6.9 7.5 16" fill="none" stroke="#2E6BFF" stroke-width="3" stroke-linecap="round" />
        <path d="M16 12.5v2.5M16 18v2.5M16 23.5V26" fill="none" stroke="#8FB0FF" stroke-width="2.4" stroke-linecap="round" />
      </svg>
      <span>${escapeHtml(brandName)}</span>
    </div>
    <div class="copy">
      <div class="headline">${escapeHtml(headline)}</div>
      <div class="price">${escapeHtml(priceLine)}</div>
    </div>
    <div class="pills">
      ${pills.map((p) => `<span class="pill">${escapeHtml(p)}</span>`).join('\n      ')}
    </div>
  </div>
  ${car}
</body>
</html>`

async function launchBrowser() {
  try {
    return await chromium.launch()
  } catch (first) {
    try {
      return await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
    } catch (second) {
      throw new Error(
        `Could not launch Playwright chromium.\n  default launch: ${first.message}\n  /opt/pw-browsers/chromium: ${second.message}`,
      )
    }
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.setViewportSize({ width: WIDTH, height: HEIGHT })
    await page.setContent(html, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: OUT_FILE })
  } finally {
    await browser.close()
  }
  console.log(`Wrote ${OUT_FILE} (${WIDTH}x${HEIGHT})`)
}

main().catch((error) => {
  console.error(`make-og failed: ${error && error.message ? error.message : error}`)
  process.exit(1)
})

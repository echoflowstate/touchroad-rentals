/**
 * Draws the brand image files from the React marks:
 *
 *   public/brand/logo-sheet.png   all three marks, on sand and on emerald,
 *                                 at nav lockup size, as a 64px app icon, at a
 *                                 true 16px favicon, and with that 16px raster
 *                                 magnified so it can actually be judged
 *   public/favicon.svg            the configured mark
 *   public/icon-192.png
 *   public/icon-512.png
 *
 * Run: node scripts/make-brand.mjs
 */
import { chromium } from 'playwright'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dataUri, fontFaceCSS, loadMarks, standalone } from './lib/render-marks.mjs'

const SAND = '#F7F2E9'
const INK = '#0F2E28'
const EMERALD = '#0B7458'

async function launch() {
  try {
    return await chromium.launch()
  } catch {
    return await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  }
}

function panel(brand, keys, names, ground) {
  const dark = ground === 'emerald'
  return `
  <section class="panel ${dark ? 'dark' : 'light'}">
    <p class="ground-label">${dark ? 'On emerald' : 'On sand'}</p>
    ${keys
      .map(
        (key) => `
    <div class="row">
      <div class="rowhead">
        <span class="key">${key}</span>
        <span class="name">${names[key]}</span>
      </div>
      <div class="specimens">
        <figure>
          <div class="lockup">
            ${brand.markSVG(key, 40)}
            <span class="words">
              <span class="w1">Touch Road</span>
              <span class="w2">Rentals</span>
            </span>
          </div>
          <figcaption>Nav lockup, 40px</figcaption>
        </figure>
        <figure>
          <div class="tile">${brand.markSVG(key, 64)}</div>
          <figcaption>App icon, 64px</figcaption>
        </figure>
        <figure>
          <div class="tiny">${brand.markSVG(key, 16)}</div>
          <figcaption>Favicon, true 16px</figcaption>
        </figure>
        <figure>
          <img class="zoom" data-src="${dataUri(brand.markSVG(key, 16))}" width="96" height="96" alt="" />
          <figcaption>That 16px raster, 6x</figcaption>
        </figure>
      </div>
    </div>`,
      )
      .join('')}
  </section>`
}

function sheetHTML(brand) {
  const keys = brand.markKeys
  const names = brand.markNames
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
  ${fontFaceCSS()}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1440px;background:#FFFFFF;font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:${INK}}
  .sheet{padding:44px 48px 52px}
  h1{font-family:Outfit,system-ui,sans-serif;font-weight:800;font-size:34px;letter-spacing:-.025em}
  .sub{margin-top:8px;font-size:15px;color:#4A6B62;max-width:900px;line-height:1.55}
  .ships{display:inline-flex;align-items:center;gap:8px;margin-top:14px;padding:7px 14px;border-radius:999px;
         background:#E3F0EC;color:#085943;font-family:Outfit,system-ui,sans-serif;font-weight:700;font-size:13px}
  .dot{width:8px;height:8px;border-radius:50%;background:${EMERALD}}
  .panels{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:30px}
  .panel{border-radius:26px;padding:24px 26px 26px}
  .panel.light{background:${SAND};border:1px solid #E7DFD1}
  .panel.dark{background:${EMERALD}}
  .ground-label{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:18px}
  .panel.light .ground-label{color:#527066}
  .panel.dark .ground-label{color:rgba(255,255,255,.72)}
  .row{padding:18px 0}
  .row + .row{border-top:1px solid rgba(15,46,40,.10)}
  .panel.dark .row + .row{border-top-color:rgba(255,255,255,.18)}
  .rowhead{display:flex;align-items:baseline;gap:10px;margin-bottom:14px}
  .key{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.12em;padding:3px 8px;border-radius:6px;
       background:rgba(15,46,40,.08)}
  .panel.dark .key{background:rgba(255,255,255,.18);color:#fff}
  .name{font-family:Outfit,system-ui,sans-serif;font-weight:700;font-size:16px}
  .panel.dark .name{color:#fff}
  .specimens{display:flex;align-items:flex-end;gap:26px}
  figure{display:flex;flex-direction:column;align-items:flex-start;gap:9px}
  figcaption{font-family:"JetBrains Mono",monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#527066}
  .panel.dark figcaption{color:rgba(255,255,255,.66)}
  .lockup{display:flex;align-items:center;gap:10px;height:64px}
  .words{display:flex;flex-direction:column;justify-content:center;line-height:1}
  .w1{font-family:Outfit,system-ui,sans-serif;font-weight:800;font-size:17.6px;text-transform:uppercase;letter-spacing:-.01em}
  .w2{font-family:Outfit,system-ui,sans-serif;font-weight:700;font-size:9.4px;text-transform:uppercase;letter-spacing:2.08px;color:${EMERALD};margin-top:2px}
  .panel.dark .w1{color:#fff}
  .panel.dark .w2{color:rgba(255,255,255,.72)}
  .tile,.tiny{display:flex;align-items:flex-end;height:64px}
  .zoom{image-rendering:pixelated;border-radius:4px}
  svg{display:block}
</style></head><body><div class="sheet">
  <h1>${brand.brandName} logo studio</h1>
  <p class="sub">Three complete marks, drawn in code on the Coastal Light palette. Each one is shown as it appears in the navigation, as a 64px app icon, and at true favicon size, with that 16px raster magnified six times so the shapes can be judged rather than guessed at.</p>
  <p class="ships"><span class="dot"></span>${brand.configuredMark} ${brand.markNames[brand.configuredMark]} is wired as the shipping mark</p>
  <div class="panels">
    ${panel(brand, keys, names, 'sand')}
    ${panel(brand, keys, names, 'emerald')}
  </div>
</div>
<script>
  // Rasterize each mark at a real 16 by 16 and blow that up, so the caption is
  // telling the truth: this is what a browser tab actually gets.
  window.__ready = (async () => {
    const jobs = [...document.querySelectorAll('img.zoom')].map(async (node) => {
      const image = new Image()
      image.src = node.dataset.src
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = 16
      canvas.height = 16
      canvas.getContext('2d').drawImage(image, 0, 0, 16, 16)
      node.src = canvas.toDataURL()
      await node.decode()
    })
    await Promise.all(jobs)
    await document.fonts.ready
    return true
  })()
</script>
</body></html>`
}

function iconHTML(svg, size) {
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    *{margin:0;padding:0}body{width:${size}px;height:${size}px;overflow:hidden}svg{display:block}
  </style></head><body>${svg}</body></html>`
}

async function main() {
  const brand = await loadMarks()
  const browser = await launch()
  const page = await browser.newPage({ deviceScaleFactor: 2 })
  const problems = []
  page.on('pageerror', (error) => problems.push(error.message))

  mkdirSync('public/brand', { recursive: true })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.setContent(sheetHTML(brand), { waitUntil: 'load' })
  await page.evaluate(() => window.__ready)
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'public/brand/logo-sheet.png', fullPage: true })
  console.log('wrote public/brand/logo-sheet.png')

  // The favicon and the app icons all follow the configured mark.
  const configured = brand.configuredMark
  writeFileSync('public/favicon.svg', `${standalone(brand.markSVG(configured, 64))}\n`)
  console.log(`wrote public/favicon.svg (${configured})`)

  for (const size of [192, 512]) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(iconHTML(brand.markSVG(configured, size), size), { waitUntil: 'load' })
    await page.waitForTimeout(120)
    await page.screenshot({ path: `public/icon-${size}.png`, omitBackground: true })
    console.log(`wrote public/icon-${size}.png`)
  }

  await browser.close()

  if (problems.length > 0) throw new Error(`page errors: ${problems.join(' | ')}`)
  for (const file of ['public/brand/logo-sheet.png', 'public/icon-192.png', 'public/icon-512.png']) {
    if (!existsSync(file) || statSync(file).size < 1000) throw new Error(`${file} did not render`)
  }
  console.log('brand assets rendered')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

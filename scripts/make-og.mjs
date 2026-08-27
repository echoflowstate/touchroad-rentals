/**
 * Renders public/og.png (1200x630) in the Coastal Light language, plus the
 * PNG app icons the manifest points at. Uses the pre-installed Playwright
 * chromium; never downloads a browser.
 *
 * Run: node scripts/make-og.mjs
 */
import { chromium } from 'playwright'
import { existsSync, statSync } from 'node:fs'

const SAND = '#F7F2E9'
const INK = '#0F2E28'
const EMERALD = '#0B7458'
const CORAL = '#FF6B4A'
const GOLD = '#FFC65C'
const AQUA = '#7FD4C8'

/** The Touch Road badge, same geometry as the React LogoMark. */
function markSVG(size) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFF3DC"/><stop offset="52%" stop-color="#FDE8C8"/><stop offset="100%" stop-color="${SAND}"/>
    </linearGradient>
    <linearGradient id="wave" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${AQUA}"/><stop offset="100%" stop-color="${EMERALD}"/>
    </linearGradient>
    <linearGradient id="road" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="${INK}"/><stop offset="100%" stop-color="${EMERALD}"/>
    </linearGradient>
    <clipPath id="clip"><rect width="64" height="64" rx="15"/></clipPath>
  </defs>
  <g clip-path="url(#clip)">
    <rect width="64" height="64" fill="url(#sky)"/>
    <circle cx="45.5" cy="17.5" r="7.5" fill="${GOLD}"/>
    <circle cx="45.5" cy="17.5" r="10.5" fill="${GOLD}" opacity="0.28"/>
    <path d="M64 46.5c-5.4 0-8.2-3.6-11.6-7.4-3.2-3.6-6.9-6.1-11.6-5.2-4 .8-6.3 3.7-7.2 7.2 2.5-2.1 5.3-2.6 8.1-1.2 2.6 1.3 4 3.6 6.2 6.1 2.9 3.3 6.6 5.9 11.5 6.2H64z" fill="url(#wave)"/>
    <path d="M-2 64c2.5-13 9-23.5 19.5-31C25.5 27.2 34 24.6 43 24.2l1.2 9.4c-7.6.3-14.4 2.4-20 6.5C16.6 45.9 11.6 53.9 9.6 64z" fill="url(#road)"/>
    <path d="M2.8 64C5.5 52.6 11.4 43.4 20.7 36.8c6.4-4.6 14-7.1 22.7-7.5" fill="none" stroke="#FFF6E4" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 5"/>
  </g>
</svg>`
}

const CAR_SVG = `
<svg width="392" height="176" viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="100" cy="80" rx="74" ry="6" fill="${INK}" opacity="0.16"/>
  <path d="M18 62c0-9 5-14 13-16l16-4 16-13c5-4 11-6 18-6h24c9 0 17 4 23 11l12 14 20 5c8 2 12 7 12 15v6c0 4-3 7-7 7H25c-4 0-7-3-7-7z" fill="${EMERALD}"/>
  <path d="M69 33c3-3 7-4 11-4h20c7 0 13 3 18 9l8 9H60z" fill="#AEE5DC"/>
  <rect x="96" y="30" width="3" height="17" fill="${EMERALD}" opacity="0.7"/>
  <rect x="24" y="52" width="12" height="6" rx="3" fill="${GOLD}"/>
  <rect x="166" y="52" width="10" height="6" rx="3" fill="${CORAL}"/>
  <circle cx="58" cy="72" r="14" fill="${INK}"/><circle cx="58" cy="72" r="6" fill="${AQUA}"/>
  <circle cx="146" cy="72" r="14" fill="${INK}"/><circle cx="146" cy="72" r="6" fill="${AQUA}"/>
</svg>`

const OG_HTML = `<!doctype html>
<html><head><meta charset="utf-8"/><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1200px; height:630px; overflow:hidden;
         font-family: Outfit, "Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif; }
  .scene { position:relative; width:1200px; height:630px;
           background:linear-gradient(176deg,#FFF6E6 0%,#FFEFD6 38%,#FDE6CD 60%,${SAND} 100%);
           overflow:hidden; }
  .sun { position:absolute; right:118px; top:96px; width:150px; height:150px;
         border-radius:50%; background:${GOLD}; }
  .sunglow { position:absolute; right:58px; top:36px; width:270px; height:270px;
             border-radius:50%; background:radial-gradient(closest-side, rgba(255,198,92,0.55), rgba(255,198,92,0)); }
  .water { position:absolute; left:0; right:0; top:436px; height:66px;
           background:linear-gradient(180deg,#AEE5DC 0%,${AQUA} 55%,#3FA694 100%); }
  .glint { position:absolute; height:4px; border-radius:2px; background:#FFF6E4; opacity:.6; }
  .sand { position:absolute; left:0; right:0; top:496px; bottom:0;
          background:linear-gradient(180deg,${SAND} 0%,#F3EADB 60%,#EFE7D8 100%); }
  .road { position:absolute; left:0; right:0; bottom:0; height:104px; background:${INK}; opacity:.9; }
  .dash { position:absolute; left:0; right:0; bottom:50px; height:5px;
          background:repeating-linear-gradient(to right,#FFF6E4 0 34px, transparent 34px 74px); opacity:.85; }
  .car { position:absolute; right:64px; bottom:26px; }
  .content { position:absolute; left:76px; top:62px; width:680px; }
  .lockup { display:flex; align-items:center; gap:16px; }
  .word { line-height:1; }
  .w1 { font-size:34px; font-weight:800; letter-spacing:-.01em; color:${INK}; text-transform:uppercase; }
  .w2 { font-size:18px; font-weight:700; letter-spacing:.24em; color:${EMERALD}; text-transform:uppercase; margin-top:3px; }
  h1 { margin-top:40px; font-size:63px; line-height:1.04; letter-spacing:-.035em;
       font-weight:800; color:${INK}; max-width:640px; }
  .tag { margin-top:20px; font-size:27px; font-weight:700; color:${EMERALD}; letter-spacing:-.01em; }
  .pills { margin-top:30px; display:flex; gap:12px; }
  .pill { font-family:"JetBrains Mono", ui-monospace, monospace; font-size:14px;
          text-transform:uppercase; letter-spacing:.12em; padding:10px 16px; border-radius:999px;
          background:#FFFFFF; color:${INK}; border:1px solid #E7DFD1; }
  .pill.accent { background:${CORAL}; color:${INK}; border-color:${CORAL}; }
</style></head>
<body><div class="scene">
  <div class="sunglow"></div><div class="sun"></div>
  <div class="water">
    <span class="glint" style="left:120px; top:22px; width:90px"></span>
    <span class="glint" style="left:340px; top:44px; width:150px"></span>
    <span class="glint" style="left:640px; top:18px; width:80px"></span>
    <span class="glint" style="left:900px; top:48px; width:170px"></span>
  </div>
  <div class="sand"></div>
  <div class="road"></div><div class="dash"></div>
  <div class="car">${CAR_SVG}</div>
  <div class="content">
    <div class="lockup">
      ${markSVG(76)}
      <div>
        <div class="word w1">Touch Road</div>
        <div class="word w2">Rentals</div>
      </div>
    </div>
    <h1>Rent for less on the Emerald Coast.</h1>
    <div class="tag">The price you see is the price you drive.</div>
    <div class="pills">
      <span class="pill">Sample listings</span>
      <span class="pill accent">No booking fees</span>
      <span class="pill">Preview build</span>
    </div>
  </div>
</div></body></html>`

function iconHTML(size) {
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    *{margin:0;padding:0}body{width:${size}px;height:${size}px;overflow:hidden}
    svg{display:block;width:${size}px;height:${size}px}
  </style></head><body>${markSVG(size)}</body></html>`
}

async function launch() {
  try {
    return await chromium.launch()
  } catch {
    return await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  }
}

async function main() {
  const browser = await launch()
  const page = await browser.newPage()

  await page.setViewportSize({ width: 1200, height: 630 })
  await page.setContent(OG_HTML, { waitUntil: 'load' })
  await page.waitForTimeout(250)
  await page.screenshot({ path: 'public/og.png' })
  console.log('wrote public/og.png')

  for (const size of [192, 512]) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(iconHTML(size), { waitUntil: 'load' })
    await page.waitForTimeout(120)
    await page.screenshot({ path: `public/icon-${size}.png`, omitBackground: true })
    console.log(`wrote public/icon-${size}.png`)
  }

  await browser.close()

  for (const file of ['public/og.png', 'public/icon-192.png', 'public/icon-512.png']) {
    if (!existsSync(file) || statSync(file).size < 1000) {
      throw new Error(`${file} did not render`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

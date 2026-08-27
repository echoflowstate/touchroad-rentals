/**
 * Proof capture for the Touch Road Rentals preview.
 *
 * Renders the built app from a static server and writes:
 *   proof/still-*.png        stills at 1440 and 390
 *   proof/filmstrip-*.png    an 8 frame interaction strip
 *   proof/report.json        overflow, reduced motion, and console findings
 *
 * Usage: node scripts/shots.mjs [baseUrl]
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.argv[2] || 'http://127.0.0.1:4173'
const OUT = 'proof'
mkdirSync(OUT, { recursive: true })

const DESKTOP = { width: 1440, height: 900 }
const PHONE = { width: 390, height: 844 }
const NARROW = { width: 360, height: 780 }

const findings = { console: [], overflow: {}, checks: {} }

async function launch() {
  try {
    return await chromium.launch()
  } catch {
    return await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  }
}

function watch(page, tag) {
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      findings.console.push(`[${tag}] ${msg.type()}: ${msg.text()}`)
    }
  })
  page.on('pageerror', (err) => {
    findings.console.push(`[${tag}] pageerror: ${err.message}`)
  })
}

async function settle(page, ms = 900) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(ms)
}

async function shot(page, name, opts = {}) {
  const path = join(OUT, `${name}.png`)
  await page.screenshot({ path, ...opts })
  console.log('wrote', path)
}

async function overflowAt(context, size, label) {
  const page = await context.newPage()
  watch(page, label)
  await page.setViewportSize(size)
  const routes = ['/', '/how-it-works', '/host', '/account']
  const worst = {}
  for (const route of routes) {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
    await settle(page, 700)
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      offenders: Array.from(document.querySelectorAll('*'))
        .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .slice(0, 6)
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`),
    }))
    worst[route] = metrics
  }
  // The first listing route needs a real id, so pick one off the browse grid.
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await settle(page)
  const firstId = await page
    .locator('[data-testid="listing-card"]')
    .first()
    .getAttribute('data-listing-id')
  if (firstId) {
    await page.goto(`${BASE}/car/${firstId}`, { waitUntil: 'domcontentloaded' })
    await settle(page, 700)
    worst[`/car/${firstId}`] = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      offenders: [],
    }))
  }
  findings.overflow[label] = worst
  await page.close()
  return firstId
}

async function main() {
  const browser = await launch()

  // ---------- desktop stills at 1440 ----------
  const desktop = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 })
  const dp = await desktop.newPage()
  watch(dp, '1440')

  await dp.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await settle(dp)
  await shot(dp, 'still-1440-browse')

  const carId = await dp
    .locator('[data-testid="listing-card"]')
    .first()
    .getAttribute('data-listing-id')
  findings.checks.firstCardId = carId

  // Prefer the $29 Civic for the detail still so the calculator shows the headline math.
  const civic = 'sample-civic-fortwalton'
  await dp.goto(`${BASE}/car/${civic}`, { waitUntil: 'domcontentloaded' })
  await settle(dp)
  await shot(dp, 'still-1440-car-detail-calculator')
  findings.checks.calcSubtotal = await dp
    .locator('[data-testid="calc-subtotal"]')
    .innerText()
    .catch(() => null)
  findings.checks.calcFees = await dp
    .locator('[data-testid="calc-fees"]')
    .innerText()
    .catch(() => null)
  findings.checks.calcTotal = await dp
    .locator('[data-testid="odometer-value"]')
    .innerText()
    .catch(() => null)

  await dp.goto(BASE + '/how-it-works', { waitUntil: 'domcontentloaded' })
  await settle(dp)
  await shot(dp, 'still-1440-how-it-works')

  // Sign in, then walk the wizard to step 3 for the still.
  await dp.goto(BASE + '/host', { waitUntil: 'domcontentloaded' })
  await settle(dp)
  await shot(dp, 'still-1440-host-signed-out')
  await signIn(dp, 'Dana')
  await settle(dp, 500)
  await wizardToStepThree(dp)
  await shot(dp, 'still-1440-wizard-step3')

  // Publish it, then request a car, so Account shows real rows and not two empty states.
  await publishListing(dp)
  await shot(dp, 'still-1440-wizard-published')

  await requestCar(dp, civic)
  await shot(dp, 'still-1440-request-confirmation')
  findings.checks.requestConfirmation = await dp
    .locator('[data-testid="request-confirmation"]')
    .innerText()
    .catch(() => null)
  await dp.keyboard.press('Escape')
  await dp.waitForTimeout(400)

  await dp.goto(BASE + '/account', { waitUntil: 'domcontentloaded' })
  await settle(dp)
  await shot(dp, 'still-1440-account')
  findings.checks.myCarsRows = await dp.locator('[data-testid="my-cars-item"]').count()

  const tripsTab = dp.getByRole('tab', { name: /trips/i })
  if (await tripsTab.count()) {
    await tripsTab.click()
    await dp.waitForTimeout(400)
    await shot(dp, 'still-1440-account-trips')
    findings.checks.tripRows = await dp.locator('[data-testid="trip-item"]').count()
  }

  // The published card has to be visible in Browse next to the samples.
  await dp.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await settle(dp)
  findings.checks.yourListingBadges = await dp.locator('[data-testid="your-badge"]').count()
  findings.checks.browseCardCount = await dp.locator('[data-testid="listing-card"]').count()
  await shot(dp, 'still-1440-browse-with-user-listing')

  await desktop.close()

  // ---------- phone stills at 390 ----------
  const phone = await browser.newContext({
    viewport: PHONE,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const pp = await phone.newPage()
  watch(pp, '390')

  await pp.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await settle(pp)
  await shot(pp, 'still-390-browse')

  const tabs = pp.locator('[data-testid="bottom-tabs"]')
  findings.checks.bottomTabsVisible = await tabs.isVisible().catch(() => false)
  if (findings.checks.bottomTabsVisible) {
    await shot(pp, 'still-390-bottom-tab-bar', { clip: await clipOf(tabs, 24) })
  }

  await pp.goto(`${BASE}/car/${civic}`, { waitUntil: 'domcontentloaded' })
  await settle(pp)
  await shot(pp, 'still-390-car-detail-calculator')

  await pp.goto(BASE + '/host', { waitUntil: 'domcontentloaded' })
  await settle(pp)
  await signIn(pp, 'Dana')
  await settle(pp, 500)
  await wizardToStepThree(pp)
  await shot(pp, 'still-390-wizard-step3')

  await pp.goto(BASE + '/account', { waitUntil: 'domcontentloaded' })
  await settle(pp)
  await shot(pp, 'still-390-account')

  // ---------- 8 frame interaction filmstrip ----------
  await pp.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await settle(pp)
  let frame = 0
  const cap = async (note) => {
    frame += 1
    await shot(pp, `filmstrip-${String(frame).padStart(2, '0')}-${note}`)
  }
  await cap('browse-idle')

  // chip toggle
  const chip = pp.getByRole('button', { name: /under \$30/i }).first()
  if (await chip.count()) {
    await chip.click()
    await pp.waitForTimeout(90)
    await cap('chip-pressed')
    await settle(pp, 700)
    await cap('chip-applied')
  } else {
    await cap('chip-missing')
    await cap('chip-missing-2')
  }

  // tab switch
  const howTab = pp.locator('[data-testid="bottom-tabs"] a').nth(1)
  await howTab.click()
  await pp.waitForTimeout(90)
  await cap('tab-switch-mid')
  await settle(pp, 600)
  await cap('tab-switch-done')

  // total roll on the detail calculator
  await pp.goto(`${BASE}/car/${civic}`, { waitUntil: 'domcontentloaded' })
  await settle(pp)
  await showTotal(pp)
  await cap('total-before')
  const dropOff = pp.locator('input[type="date"]').nth(1)
  const start = await pp.locator('input[type="date"]').first().inputValue()
  const later = shiftISO(start, 5)
  await dropOff.fill(later)
  await dropOff.dispatchEvent('change')
  await showTotal(pp)
  await pp.waitForTimeout(90)
  await cap('total-rolling')
  await pp.waitForTimeout(800)
  await showTotal(pp)
  await cap('total-after')
  findings.checks.rolledTotal = await pp
    .locator('[data-testid="odometer-value"]')
    .innerText()
    .catch(() => null)

  await phone.close()

  // ---------- reduced motion ----------
  const rm = await browser.newContext({ viewport: DESKTOP, reducedMotion: 'reduce' })
  const rmp = await rm.newPage()
  watch(rmp, 'reduced-motion')
  await rmp.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await settle(rmp)
  await shot(rmp, 'still-1440-reduced-motion-browse')
  findings.checks.reducedMotionCards = await rmp
    .locator('[data-testid="listing-card"]')
    .count()
  await rmp.goto(`${BASE}/car/${civic}`, { waitUntil: 'domcontentloaded' })
  await settle(rmp)
  await shot(rmp, 'still-1440-reduced-motion-detail')
  findings.checks.reducedMotionTotal = await rmp
    .locator('[data-testid="odometer-value"]')
    .innerText()
    .catch(() => null)
  await rm.close()

  // ---------- first run with storage cleared ----------
  const fresh = await browser.newContext({ viewport: PHONE, isMobile: true, hasTouch: true })
  const fp = await fresh.newPage()
  watch(fp, 'first-run')
  await fp.goto(BASE + '/account', { waitUntil: 'domcontentloaded' })
  await fp.evaluate(() => localStorage.clear())
  await fp.reload({ waitUntil: 'domcontentloaded' })
  await settle(fp)
  await shot(fp, 'still-390-account-first-run')
  findings.checks.firstRunSignedIn = await fp
    .locator('[data-testid="account-signed-in"]')
    .count()
  findings.checks.firstRunStorage = await fp.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith('touchroad')),
  )
  await fresh.close()

  // ---------- overflow sweeps ----------
  const narrow = await browser.newContext({ viewport: NARROW, isMobile: true, hasTouch: true })
  await overflowAt(narrow, NARROW, '360')
  await narrow.close()

  const wide = await browser.newContext({ viewport: DESKTOP })
  await overflowAt(wide, DESKTOP, '1440')
  await wide.close()

  await browser.close()
  writeFileSync(join(OUT, 'report.json'), JSON.stringify(findings, null, 2))
  console.log('\n--- report ---')
  console.log(JSON.stringify(findings, null, 2))
}

async function clipOf(locator, pad = 0) {
  const box = await locator.boundingBox()
  if (!box) return undefined
  return {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  }
}

function shiftISO(value, days) {
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d + days)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

async function signIn(page, name) {
  const trigger = page.getByRole('button', { name: /^sign in/i }).first()
  if (await trigger.count()) {
    await trigger.click()
    await page.waitForTimeout(400)
  }
  const input = page.locator('[data-testid="auth-name-input"]')
  if (await input.count()) {
    await input.fill(name)
    await page.locator('[data-testid="auth-submit"]').click()
    await page.waitForTimeout(500)
  }
}

async function fillWizardBasics(page) {
  await page.fill('#wizard-year', '2020')
  await page.fill('#wizard-make', 'Mazda')
  await page.fill('#wizard-model', 'CX-5')
  await page.selectOption('#wizard-class', 'SUV')
  await page.selectOption('#wizard-seats', '5')
  await page.locator('[data-testid="wizard-next"]').click()
  await page.waitForTimeout(320)
  await page.selectOption('#wizard-city', 'Destin')
  await page.locator('[data-testid="wizard-next"]').click()
  await page.waitForTimeout(320)
}

async function wizardToStepThree(page) {
  await fillWizardBasics(page)
  await page.fill('#wizard-pricePerDay', '33')
  await page.waitForTimeout(200)
  await showWizard(page)
}

/** Put the wizard header in frame rather than whatever the last focus scrolled to. */
async function showWizard(page) {
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="wizard"]')
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: Math.max(0, top - 96), behavior: 'instant' })
  })
  await page.waitForTimeout(250)
}

async function publishListing(page) {
  await page.locator('[data-testid="wizard-next"]').click()
  await page.waitForTimeout(320)
  await showWizard(page)
  await page.locator('[data-testid="wizard-publish"]').click()
  await page.waitForTimeout(600)
  await showWizard(page)
}

/** Request a car so Account > Trips has something real in it. */
async function requestCar(page, listingId) {
  await page.goto(`${BASE}/car/${listingId}`, { waitUntil: 'domcontentloaded' })
  await settle(page)
  await page.locator('[data-testid="request-button"]').click()
  await page.waitForTimeout(700)
}

/** Scroll so the calculator total row is in frame for the roll shots. */
async function showTotal(page) {
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="calc-total"]')
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: Math.max(0, top - 420), behavior: 'instant' })
  })
  await page.waitForTimeout(200)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

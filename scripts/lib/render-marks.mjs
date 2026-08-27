/**
 * Renders the logo studio marks to SVG strings from Node.
 *
 * The marks are React components and they are the only definition of their
 * geometry. Rather than transcribe them into a second copy for the image
 * pipeline, this bundles the real components with esbuild and renders them with
 * react-dom/server, so public/favicon.svg, the app icons, the social image and
 * the logo sheet can never drift from what the site draws.
 */
import * as esbuild from 'esbuild'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ENTRY = `
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MARKS, MARK_NAMES } from './src/components/marks'
import { siteConfig } from './src/site.config'

export function markSVG(key, size, badge = true) {
  return renderToStaticMarkup(createElement(MARKS[key], { size, badge }))
}
export const markNames = MARK_NAMES
export const markKeys = Object.keys(MARKS)
export const configuredMark = siteConfig.brandMark
export const brandName = siteConfig.brandName
`

let cached = null

export async function loadMarks() {
  if (cached) return cached
  const built = await esbuild.build({
    stdin: {
      contents: ENTRY,
      resolveDir: process.cwd(),
      loader: 'tsx',
      sourcefile: 'brand-entry.tsx',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
    write: false,
    external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/server'],
  })
  // The bundle lands inside node_modules so Node resolves react and
  // react-dom/server the ordinary way instead of bundling copies of them.
  const dir = join(process.cwd(), 'node_modules', '.touchroad-brand')
  mkdirSync(dir, { recursive: true })
  const file = join(dir, 'brand-entry.mjs')
  writeFileSync(file, built.outputFiles[0].text)
  cached = await import(pathToFileURL(file).href)
  return cached
}

/** The same markup, with the namespace a standalone .svg file needs. */
export function standalone(svg) {
  return svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
}

export function dataUri(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(standalone(svg), 'utf8').toString('base64')}`
}

const FONTS = [
  ['Outfit', 800, '@fontsource/outfit/files/outfit-latin-800-normal.woff2'],
  ['Outfit', 700, '@fontsource/outfit/files/outfit-latin-700-normal.woff2'],
  ['Plus Jakarta Sans', 600, '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff2'],
  ['JetBrains Mono', 500, '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2'],
]

/**
 * The brand faces as inline @font-face rules, so a page rendered by a headless
 * browser with no network shows the wordmark in Outfit rather than in whatever
 * the system happens to have.
 */
export function fontFaceCSS() {
  return FONTS.map(([family, weight, path]) => {
    const buffer = readFileSync(join(process.cwd(), 'node_modules', path))
    return `@font-face{font-family:"${family}";font-weight:${weight};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${buffer.toString('base64')}) format("woff2");}`
  }).join('\n')
}

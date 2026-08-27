// @ts-ignore - no Node type package is wired into the test tsconfig, and the
// asset checks only need to read what the brand script wrote.
import { existsSync, readFileSync } from 'node:fs'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { Logo, LogoMark } from '../components/Logo'
import { MARK_NAMES, MARKS, type BrandMark } from '../components/marks'
import { siteConfig } from '../site.config'
import { AppDataProvider } from '../state/AppState'

declare const process: { cwd(): string }

/**
 * A4, the logo studio. The three marks are interchangeable, and the one line in
 * the site config that names the shipping mark has to reach every placement,
 * including the files on disk that the brand script draws.
 */

const KEYS: BrandMark[] = ['L1', 'L2', 'L3']

function renderApp(route = '/') {
  window.history.pushState({}, '', route)
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppDataProvider>
        <App />
      </AppDataProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
})

describe('the three marks', () => {
  it('are all drawn on the same 64 unit field and name themselves', () => {
    for (const key of KEYS) {
      const Mark = MARKS[key]
      const { container, unmount } = render(<Mark size={40} />)
      const svg = container.querySelector('svg')
      expect(svg).not.toBeNull()
      expect(svg?.getAttribute('viewBox')).toBe('0 0 64 64')
      expect(svg?.getAttribute('data-mark')).toBe(key)
      expect(svg?.getAttribute('width')).toBe('40')
      // Decoration by default: no accessible name, hidden from the tree.
      expect(svg?.getAttribute('aria-hidden')).toBe('true')
      unmount()
    }
  })

  it('all render at a true 16px favicon scale with their shapes intact', () => {
    for (const key of KEYS) {
      const Mark = MARKS[key]
      const { container, unmount } = render(<Mark size={16} />)
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('width')).toBe('16')
      // The small branch trims detail; it must never trim the mark to nothing.
      expect(container.querySelectorAll('path, circle, rect').length).toBeGreaterThan(5)
      unmount()
    }
  })

  it('gives every instance its own gradient ids so two marks never collide', () => {
    const { container } = render(
      <>
        <LogoMark mark="L1" />
        <LogoMark mark="L1" />
      </>,
    )
    const ids = Array.from(container.querySelectorAll('[id]')).map((node) => node.id)
    expect(ids.length).toBeGreaterThan(4)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('takes an accessible name when it is standing in for the brand', () => {
    render(<LogoMark title="Touch Road Rentals" />)
    expect(screen.getByRole('img', { name: 'Touch Road Rentals' })).toBeInTheDocument()
  })
})

describe('the configured mark', () => {
  it('is one of the three and has a name', () => {
    expect(KEYS).toContain(siteConfig.brandMark)
    expect(MARK_NAMES[siteConfig.brandMark]).toBeTruthy()
  })

  it('is what the lockup draws when nothing overrides it', () => {
    const { container } = render(<Logo size={40} />)
    expect(container.querySelector('svg')?.getAttribute('data-mark')).toBe(siteConfig.brandMark)
  })

  it('is what the nav and the footer draw, both from the same one line', () => {
    renderApp('/')
    const marks = Array.from(document.querySelectorAll('[data-mark]'))
    expect(marks.length).toBeGreaterThan(0)
    for (const mark of marks) {
      expect(mark.getAttribute('data-mark')).toBe(siteConfig.brandMark)
    }
    // The desktop nav and the footer are the two placements in the app itself.
    expect(
      document.querySelector('[data-testid="desktop-nav"] [data-mark]'),
    ).not.toBeNull()
  })

  it('is overridable per instance, which is how the logo sheet shows all three', () => {
    const { container } = render(
      <>
        <LogoMark mark="L1" />
        <LogoMark mark="L2" />
        <LogoMark mark="L3" />
      </>,
    )
    expect(
      Array.from(container.querySelectorAll('[data-mark]')).map((n) => n.getAttribute('data-mark')),
    ).toEqual(['L1', 'L2', 'L3'])
  })
})

describe('the brand files on disk', () => {
  const ROOT = process.cwd()

  it('ships a logo sheet on the branch', () => {
    expect(existsSync(`${ROOT}/public/brand/logo-sheet.png`)).toBe(true)
  })

  it('draws the favicon from the configured mark, not from a second copy of it', () => {
    const svg = readFileSync(`${ROOT}/public/favicon.svg`, 'utf8')
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain(`data-mark="${siteConfig.brandMark}"`)
    expect(svg).toContain(`tr-${siteConfig.brandMark.toLowerCase()}-`)
  })
})

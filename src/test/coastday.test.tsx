import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AmbientLife, PalmShadow } from '../components/AmbientLife'
import { DAY, lightAt, paintFor, shadowCSS, sunTransform, withAlpha } from '../lib/coastDay'
import { AppDataProvider } from '../state/AppState'

/**
 * A1 and A2. The day has to move continuously, stay light enough to read at
 * every point in it, stop moving when less motion is asked for, and leave every
 * other route alone. The ambient life has to stay rare.
 */

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

/** Relative luminance, so the palette can be checked rather than eyeballed. */
function luminance(hex: string): number {
  const clean = hex.replace('#', '')
  const channels = [0, 2, 4].map((offset) => {
    const value = parseInt(clean.slice(offset, offset + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

afterEach(() => {
  cleanup()
  document.documentElement.removeAttribute('style')
  delete document.documentElement.dataset.dayPhase
  delete document.documentElement.dataset.dayProgress
})

describe('the day', () => {
  it('runs dawn to early dusk in order', () => {
    expect(DAY.map((stop) => stop.label)).toEqual([
      'Dawn',
      'Late morning',
      'Bright noon',
      'High afternoon',
      'Golden hour',
      'Early dusk',
    ])
    // Stops are in ascending order and span the whole scroll.
    expect(DAY[0].at).toBe(0)
    expect(DAY[DAY.length - 1].at).toBe(1)
    for (let i = 1; i < DAY.length; i += 1) {
      expect(DAY[i].at).toBeGreaterThan(DAY[i - 1].at)
    }
  })

  it('lands exactly on each keyframe at its own progress', () => {
    for (const stop of DAY) {
      expect(lightAt(stop.at).ground).toBe(stop.ground.toLowerCase())
      expect(lightAt(stop.at).sky[0]).toBe(stop.sky[0].toLowerCase())
    }
  })

  it('never jumps, so the arc reads as one continuous day', () => {
    let previous = lightAt(0)
    for (let step = 1; step <= 200; step += 1) {
      const light = lightAt(step / 200)
      // No single 0.5% step may move any ground channel more than a shade.
      const before = parseInt(previous.ground.slice(1, 3), 16)
      const after = parseInt(light.ground.slice(1, 3), 16)
      expect(Math.abs(after - before)).toBeLessThanOrEqual(3)
      previous = light
    }
  })

  it('keeps every ground light enough for ink and emerald at any point', () => {
    for (let step = 0; step <= 100; step += 1) {
      const light = lightAt(step / 100)
      for (const ground of [light.ground, light.surface, light.wash, light.beach]) {
        // Ink body copy and emerald links both have to clear AA on it.
        expect(contrast('#0F2E28', ground)).toBeGreaterThanOrEqual(4.5)
        expect(contrast('#0B7458', ground)).toBeGreaterThanOrEqual(4.5)
        // And muted ink, which is the lightest text tone that ships.
        expect(contrast('#4A6B62', ground)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('walks the sun across the sky and only lights the star at the end', () => {
    expect(lightAt(0).sunLeft).toBeLessThan(lightAt(0.5).sunLeft)
    expect(lightAt(0.5).sunLeft).toBeLessThan(lightAt(1).sunLeft)
    // Low at both ends of the day, highest around noon.
    expect(lightAt(0.5).sunTop).toBeLessThan(lightAt(0).sunTop)
    expect(lightAt(0.5).sunTop).toBeLessThan(lightAt(1).sunTop)
    // A low sun sits bigger than a high one.
    expect(lightAt(0.5).glowRadius).toBeLessThan(lightAt(0).glowRadius)
    expect(lightAt(0).star).toBe(0)
    expect(lightAt(0.6).star).toBe(0)
    expect(lightAt(1).star).toBe(1)
  })

  it('has a paint for every part of the scene', () => {
    const light = lightAt(0.4)
    const roles = [
      'sky',
      'ground',
      'surface',
      'wash',
      'water',
      'beach',
      'beach-fill',
      'fill-ground',
      'fill-surface',
      'fill-wash',
      'sun',
      'glow',
      'sun-color',
      'glow-color',
      'star',
      'card',
    ] as const
    for (const role of roles) {
      const paint = paintFor(role, light, 0.85)
      const values = Object.values({ ...(paint.style ?? {}), ...(paint.attr ?? {}) })
      expect(values.length).toBeGreaterThan(0)
      for (const value of values) expect(value).not.toBe('')
    }
    // The sun and its halo travel on a transform rather than on left and top.
    const width = 1440
    const height = 900
    expect(sunTransform(light, width, height)).toContain('translate3d')
    expect(sunTransform(lightAt(0.9), width, height)).not.toBe(
      sunTransform(light, width, height),
    )
  })

  it('lays a band over the sky at the opacity it was given', () => {
    const light = lightAt(0.4)
    expect(paintFor('surface', light, 1).style?.backgroundColor).toBe(light.surface)
    expect(paintFor('surface', light, 0.85).style?.backgroundColor).toMatch(
      /^rgba\(\d+, \d+, \d+, 0\.85\)$/,
    )
    expect(withAlpha('#FFFFFF', 1)).toBe('#FFFFFF')
  })

  it('lengthens and cools the shadow at the ends of the day', () => {
    expect(lightAt(0.5).shadow.y).toBeLessThan(lightAt(0).shadow.y)
    expect(lightAt(0.5).shadow.y).toBeLessThan(lightAt(1).shadow.y)
    expect(lightAt(0.5).shadow.alpha).toBeLessThan(lightAt(0).shadow.alpha)
    expect(shadowCSS(lightAt(0))).toContain('px')
    expect(shadowCSS(lightAt(0.5))).not.toBe(shadowCSS(lightAt(0)))
  })

  it('strengthens the coral accent through the golden hour', () => {
    expect(lightAt(0.85).warm).toBeGreaterThan(lightAt(0.5).warm)
  })
})

describe('the day on the page', () => {
  it('opens the Home page at dawn and publishes it on the root', async () => {
    renderApp('/')
    await waitFor(() => {
      expect(document.documentElement.dataset.dayPhase).toBe('Dawn')
    })
    expect(document.getElementById('day-layer')).not.toBeNull()
    expect(screen.getByTestId('coast-day')).toBeInTheDocument()
    // The scene is painted onto the elements that claim a role, not onto the
    // document root, which is what keeps a scroll frame cheap.
    const sky = screen.getByTestId('coast-day-sky')
    expect(sky.style.backgroundImage).toContain('linear-gradient')
    expect(screen.getByTestId('coast-day-sun').style.transform).toContain('translate3d')
    expect(document.documentElement.getAttribute('style')).toBeNull()
  })

  it('leaves every other route on the static palette', async () => {
    renderApp('/how-it-works')
    await waitFor(() => {
      expect(screen.queryByTestId('coast-day')).not.toBeInTheDocument()
    })
    expect(document.documentElement.dataset.dayPhase).toBeUndefined()
  })

  it('takes the light away again when the Home page unmounts', async () => {
    const view = renderApp('/')
    await waitFor(() => {
      expect(document.documentElement.dataset.dayPhase).toBe('Dawn')
    })
    const sky = screen.getByTestId('coast-day-sky')
    expect(sky.style.backgroundImage).toBeTruthy()
    view.unmount()
    expect(document.documentElement.dataset.dayPhase).toBeUndefined()
    expect(sky.style.backgroundImage).toBe('')
  })
})

describe('the search card', () => {
  it('cycles a real city as a hint beside the Where label', async () => {
    renderApp('/')
    const hint = await screen.findByTestId('city-hint')
    expect(hint.textContent).toMatch(/^. ?Try (Destin|Pensacola|Gulf Breeze|Niceville|Crestview|Mary Esther|Fort Walton|Shalimar|Valparaiso|Freeport|Sandestin|Santa Rosa|Panama City)$/)
    // Decoration only: it must not reach the field's accessible name.
    expect(hint).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByLabelText('Where')).toBeInTheDocument()
  })

  it('drops the hint once a city has actually been chosen', async () => {
    renderApp('/')
    await screen.findByTestId('city-hint')
    fireEvent.change(screen.getByLabelText('Where'), { target: { value: 'Destin' } })
    await waitFor(() => {
      expect(screen.queryByTestId('city-hint')).not.toBeInTheDocument()
    })
  })

  it('gives the hero sun a nod when a range is picked', async () => {
    renderApp('/')
    const sun = await screen.findByTestId('hero-sun')
    expect(sun.className).not.toContain('animate-sun-ack')

    fireEvent.click(screen.getByTestId('search-dates-trigger'))
    const popover = await screen.findByTestId('date-popover')
    const days = Array.from(
      popover.querySelectorAll<HTMLElement>('[data-day]:not([disabled])'),
    ).filter((cell) => cell.getAttribute('role') === 'gridcell')
    fireEvent.click(days[2])
    fireEvent.click(days[5])

    await waitFor(() => {
      expect(screen.getByTestId('hero-sun').className).toContain('animate-sun-ack')
    })
  })

  it('carries the sun glare on the search button', () => {
    renderApp('/')
    const search = screen.getByRole('button', { name: /^search$/i })
    expect(search.className).toContain('btn-glare')
  })
})

describe('ambient life', () => {
  it('holds the gull back until enough scrolling has actually happened', async () => {
    render(<AmbientLife gapMs={40} flightMs={4000} />)
    expect(screen.queryByTestId('ambient-gull')).not.toBeInTheDocument()

    // The first scroll only starts the clock; it never releases anything.
    fireEvent.scroll(window)
    expect(screen.queryByTestId('ambient-gull')).not.toBeInTheDocument()

    await new Promise((resolve) => setTimeout(resolve, 60))
    fireEvent.scroll(window)
    await waitFor(() => {
      expect(screen.getByTestId('ambient-gull')).toBeInTheDocument()
    })
  })

  it('never puts a second actor on stage while one is still crossing', async () => {
    render(<AmbientLife gapMs={20} flightMs={4000} />)
    fireEvent.scroll(window)
    await new Promise((resolve) => setTimeout(resolve, 40))
    fireEvent.scroll(window)
    await waitFor(() => {
      expect(screen.getByTestId('ambient-gull')).toBeInTheDocument()
    })

    for (let i = 0; i < 12; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 12))
      fireEvent.scroll(window)
    }
    expect(screen.getAllByTestId('ambient-gull')).toHaveLength(1)
  })

  it('clears the stage when the crossing is over', async () => {
    render(<AmbientLife gapMs={20} flightMs={80} />)
    fireEvent.scroll(window)
    await new Promise((resolve) => setTimeout(resolve, 40))
    fireEvent.scroll(window)
    await waitFor(() => {
      expect(screen.getByTestId('ambient-gull')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.queryByTestId('ambient-gull')).not.toBeInTheDocument()
    })
  })

  it('renders the palm shadow as weather rather than as an actor', () => {
    render(<PalmShadow />)
    const palm = screen.getByTestId('palm-shadow')
    expect(palm).toHaveAttribute('aria-hidden', 'true')
    expect(palm.className).toContain('animate-sway')
  })
})

// @ts-ignore - no Node type package is wired into the test tsconfig, and the
// native-input sweep only needs these two calls to walk the shipped source.
import { readdirSync, readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AppDataProvider } from '../state/AppState'

declare const process: { cwd(): string }

/**
 * A5, the trip planner. Everything here is pinned to a fixed system date so the
 * grid, the range that gets picked, and the total it produces are the same run
 * to run. March 12 2026 is a Thursday, mid month, which leaves real past days
 * above it to prove they cannot be picked.
 */

const CIVIC_29 = 'sample-civic-fortwalton'
const TODAY = new Date(2026, 2, 12, 12, 0, 0)

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

function trigger(): HTMLElement {
  return screen.getByRole('button', { name: /Trip dates/ })
}

function fieldText(): string {
  return (trigger().textContent ?? '').replace(/\s+/g, ' ').trim()
}

function dayCell(scope: HTMLElement, label: string): HTMLElement {
  return within(scope).getByRole('gridcell', { name: label })
}

beforeEach(() => {
  localStorage.clear()
  window.innerWidth = 1024
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(TODAY)
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

describe('the trip planner replaces every native date entry', () => {
  it('ships no input[type=date] anywhere in the source', () => {
    const ROOT = process.cwd()
    const SKIP = ['node_modules', 'dist', '.git']
    // Assembled so this file does not trip its own sweep.
    const NEEDLE = "type='" + "date'"
    const NEEDLE_DOUBLE = 'type="' + 'date"'
    const found: string[] = []

    function walk(dir: string): void {
      for (const entry of readdirSync(`${ROOT}/${dir}`, { withFileTypes: true })) {
        if (SKIP.indexOf(entry.name) !== -1) continue
        const path = `${dir}/${entry.name}`
        if (entry.isDirectory()) {
          walk(path)
          continue
        }
        if (!/\.(tsx?|css|html|mjs|js)$/.test(entry.name)) continue
        if (path === 'src/test/planner.test.tsx') continue
        const text = readFileSync(`${ROOT}/${path}`, 'utf8')
        text.split('\n').forEach((line, index) => {
          if (line.indexOf(NEEDLE) !== -1 || line.indexOf(NEEDLE_DOUBLE) !== -1) {
            found.push(`${path}:${index + 1}`)
          }
        })
      }
    }

    walk('src')
    walk('scripts')
    found.push(
      ...(readFileSync(`${ROOT}/index.html`, 'utf8').indexOf(NEEDLE_DOUBLE) !== -1
        ? ['index.html']
        : []),
    )

    expect(found).toEqual([])
  })

  it('renders the calculator dates as one planner field, not two inputs', () => {
    renderApp(`/car/${CIVIC_29}`)

    expect(document.querySelectorAll('input[type="date"]')).toHaveLength(0)
    expect(fieldText()).toContain('Mar 12 - Mar 15')
    expect(fieldText()).toContain('3 days')
  })
})

describe('picking a range', () => {
  it('spans two months, prints the range on the field, and re-prices the trip', async () => {
    renderApp(`/car/${CIVIC_29}`)
    expect(screen.getByTestId('odometer-value').textContent).toBe('$87')

    fireEvent.click(trigger())
    const popover = await screen.findByTestId('date-popover')

    // The desktop popover shows the current month and the next one together.
    expect(within(popover).getByText('March 2026')).toBeInTheDocument()
    expect(within(popover).getByText('April 2026')).toBeInTheDocument()

    fireEvent.click(dayCell(popover, 'March 25, 2026'))
    fireEvent.click(dayCell(popover, 'April 3, 2026'))

    // Picking the drop-off applies the range and closes the popover.
    await waitFor(() => {
      expect(screen.queryByTestId('date-popover')).not.toBeInTheDocument()
    })

    expect(fieldText()).toContain('Mar 25 - Apr 3 · 9 days')
    await waitFor(() => {
      expect(screen.getByTestId('odometer-value').textContent).toBe('$261')
    })
    expect(
      (screen.getByTestId('calc-subtotal').textContent ?? '').replace(/\s+/g, ' '),
    ).toContain('$29 × 9 days = $261')
  })

  it('swaps the pair when the drop off is chosen before the pick up', async () => {
    renderApp(`/car/${CIVIC_29}`)

    fireEvent.click(trigger())
    const popover = await screen.findByTestId('date-popover')
    fireEvent.click(dayCell(popover, 'March 27, 2026'))
    fireEvent.click(dayCell(popover, 'March 22, 2026'))

    await waitFor(() => {
      expect(fieldText()).toContain('Mar 22 - Mar 27 · 5 days')
    })
    await waitFor(() => {
      expect(screen.getByTestId('odometer-value').textContent).toBe('$145')
    })
  })

  it('does nothing at all when a past day is clicked', async () => {
    renderApp(`/car/${CIVIC_29}`)
    const before = fieldText()

    fireEvent.click(trigger())
    const popover = await screen.findByTestId('date-popover')

    const past = dayCell(popover, 'March 5, 2026')
    expect(past).toBeDisabled()
    fireEvent.click(past)

    expect(screen.getByTestId('date-popover')).toBeInTheDocument()
    expect(fieldText()).toBe(before)
    expect(screen.getByTestId('odometer-value').textContent).toBe('$87')
  })

  it('completes a range from the keyboard alone', async () => {
    const user = userEvent.setup({ delay: null })
    renderApp(`/car/${CIVIC_29}`)

    trigger().focus()
    await user.keyboard('{Enter}')
    await screen.findByTestId('date-popover')

    // Focus opens on the current pick-up, March 12.
    await waitFor(() => {
      expect(document.activeElement?.getAttribute('data-day')).toBe('2026-03-12')
    })

    await user.keyboard('{ArrowRight}')
    await user.keyboard('{Enter}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.queryByTestId('date-popover')).not.toBeInTheDocument()
    })
    expect(fieldText()).toContain('Mar 13 - Mar 20 · 7 days')
    await waitFor(() => {
      expect(screen.getByTestId('odometer-value').textContent).toBe('$203')
    })
    // Closing hands focus back to the field that opened the planner.
    expect(document.activeElement).toBe(trigger())
  })

  it('closes on Escape without applying anything', async () => {
    const user = userEvent.setup({ delay: null })
    renderApp(`/car/${CIVIC_29}`)
    const before = fieldText()

    fireEvent.click(trigger())
    await screen.findByTestId('date-popover')
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByTestId('date-popover')).not.toBeInTheDocument()
    })
    expect(fieldText()).toBe(before)
  })
})

describe('the road range', () => {
  it('draws a connector between the pick-up and drop-off cells', async () => {
    window.innerWidth = 390
    renderApp(`/car/${CIVIC_29}`)

    fireEvent.click(trigger())
    const sheet = await screen.findByRole('dialog')

    fireEvent.click(dayCell(sheet, 'March 16, 2026'))
    fireEvent.click(dayCell(sheet, 'March 19, 2026'))

    const road = await screen.findByTestId('road-range')
    expect(road).toBeInTheDocument()
    expect(screen.getByTestId('road-range-path')).toBeInTheDocument()

    const start = screen.getByTestId('road-start-cell')
    const end = screen.getByTestId('road-end-cell')
    expect(start).toHaveAttribute('data-day', '2026-03-16')
    expect(end).toHaveAttribute('data-day', '2026-03-19')

    // The car parks on the pick-up day and the wave marks the drop-off.
    expect(within(start).getByTestId('road-car-marker')).toBeInTheDocument()
    expect(within(end).getByTestId('road-flag-marker')).toBeInTheDocument()

    // Every day between the two is inside the range, endpoints included.
    const inRoad = sheet.querySelectorAll('[data-inroad="true"]')
    expect(inRoad).toHaveLength(4)

    // Four tiles light up for a three day trip: the pick-up day, the two days
    // between, and the drop-off day. The chip counts days of rental, which is
    // what the calculator charges for.
    expect(screen.getByTestId('road-day-count').textContent).toContain('3 days on the road')
  })

  it('counts a single day as one day on the road', async () => {
    window.innerWidth = 390
    renderApp(`/car/${CIVIC_29}`)

    fireEvent.click(trigger())
    const sheet = await screen.findByRole('dialog')
    fireEvent.click(dayCell(sheet, 'March 18, 2026'))

    expect(screen.getByTestId('road-day-count').textContent).toContain('1 day on the road')
    expect(screen.queryByTestId('road-range')).not.toBeInTheDocument()
  })
})

describe('the planner on a phone', () => {
  it('opens as a sheet with day cells at least 44px tall and applies on confirm', async () => {
    window.innerWidth = 390
    renderApp(`/car/${CIVIC_29}`)

    fireEvent.click(trigger())
    const sheet = await screen.findByRole('dialog')
    expect(sheet).toHaveAttribute('aria-modal', 'true')
    expect(screen.queryByTestId('date-popover')).not.toBeInTheDocument()

    // One month on a phone, not two.
    expect(within(sheet).getByText('March 2026')).toBeInTheDocument()
    expect(within(sheet).queryByText('April 2026')).not.toBeInTheDocument()

    const cells = Array.from(sheet.querySelectorAll<HTMLElement>('[data-day]'))
    expect(cells.length).toBeGreaterThan(27)
    for (const cell of cells) {
      expect(cell.className).toContain('min-h-[44px]')
    }
    const confirm = within(sheet).getByRole('button', { name: /Confirm dates/ })
    expect(confirm.className).toContain('btn-primary')

    // The sheet buffers the pick until confirm, unlike the desktop popover.
    fireEvent.click(dayCell(sheet, 'March 16, 2026'))
    fireEvent.click(dayCell(sheet, 'March 20, 2026'))
    expect(screen.getByTestId('odometer-value').textContent).toBe('$87')

    fireEvent.click(confirm)
    await waitFor(() => {
      expect(screen.getByTestId('odometer-value').textContent).toBe('$116')
    })
    expect(fieldText()).toContain('Mar 16 - Mar 20 · 4 days')
  })
})

describe('the planner drives search as well as the calculator', () => {
  it('sets the browse filters from the picked range', async () => {
    renderApp('/')

    const searchTrigger = screen.getByTestId('search-dates-trigger')
    expect(searchTrigger.textContent).toContain('Mar 12 - Mar 15')

    fireEvent.click(searchTrigger)
    const popover = await screen.findByTestId('date-popover')
    fireEvent.click(dayCell(popover, 'March 20, 2026'))
    fireEvent.click(dayCell(popover, 'March 24, 2026'))

    await waitFor(() => {
      expect(screen.getByTestId('search-dates-trigger').textContent).toContain(
        'Mar 20 - Mar 24 · 4 days',
      )
    })
  })
})

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { SAMPLE_FLEET } from '../data/fleet'
import { AppDataProvider } from '../state/AppState'

const ESCAPE_38 = 'sample-escape-destin'

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

/** Browse holds a shimmer for siteConfig.searchDelayMs before it shows results. */
async function cards(): Promise<HTMLElement[]> {
  return screen.findAllByTestId('listing-card', {}, { timeout: 3000 })
}

async function cardsWhen(check: (list: HTMLElement[]) => void): Promise<HTMLElement[]> {
  return waitFor(
    () => {
      const list = screen.getAllByTestId('listing-card')
      check(list)
      return list
    },
    { timeout: 3000 },
  )
}

function pricesOf(list: HTMLElement[]): number[] {
  return list.map((card) => Number(card.getAttribute('data-price')))
}

function idsOf(list: HTMLElement[]): string[] {
  return list.map((card) => card.getAttribute('data-listing-id') ?? '')
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('Browse', () => {
  it('opens with the two cheapest cars and never goes back down in price', async () => {
    renderApp('/')
    const list = await cards()

    expect(list).toHaveLength(12)
    const prices = pricesOf(list)
    const cheapest = SAMPLE_FLEET.map((listing) => listing.pricePerDay)
      .sort((a, b) => a - b)
      .slice(0, 2)

    expect(cheapest).toEqual([20, 25])
    expect(prices.slice(0, 2)).toEqual(cheapest)
    for (let index = 1; index < prices.length; index += 1) {
      expect(prices[index]).toBeGreaterThanOrEqual(prices[index - 1])
    }
  })

  it('drops everything at $30 or more behind the Under $30 chip', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await cards()

    await user.click(screen.getByRole('button', { name: 'Under $30' }))
    const list = await cardsWhen((found) => {
      expect(found).toHaveLength(5)
    })

    for (const price of pricesOf(list)) {
      expect(price).toBeLessThan(30)
    }
    expect(idsOf(list)).not.toContain(ESCAPE_38)
  })

  it('isolates the two golf carts behind the class chip', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await cards()

    await user.click(screen.getByRole('button', { name: 'Golf cart' }))
    const list = await cardsWhen((found) => {
      expect(found).toHaveLength(2)
    })

    for (const card of list) {
      expect(card).toHaveAttribute('data-listing-class', 'Golf cart')
    }
  })

  it('names the nearby city when nothing under $30 sits in Destin', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await cards()

    await user.click(screen.getByRole('button', { name: 'Under $30' }))
    fireEvent.change(screen.getByLabelText('Where'), { target: { value: 'Destin' } })

    const empty = await screen.findByTestId('empty-state', {}, { timeout: 3000 })
    expect(
      within(empty).getByText('Nothing under $30 in Destin those days - try nearby Fort Walton.'),
    ).toBeInTheDocument()
    expect(screen.queryAllByTestId('listing-card')).toHaveLength(0)
  })

  it('keeps the preview ribbon up and badges every seeded card as a sample', async () => {
    renderApp('/')
    const list = await cards()

    expect(screen.getByTestId('preview-ribbon')).toBeInTheDocument()
    expect(screen.getByTestId('preview-ribbon').textContent).toContain('Preview build')
    expect(screen.getByTestId('bottom-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('desktop-nav')).toBeInTheDocument()
    expect(screen.getByTestId('results-grid')).toBeInTheDocument()

    expect(screen.getAllByTestId('sample-badge')).toHaveLength(list.length)
    expect(screen.queryAllByTestId('your-badge')).toHaveLength(0)
    for (const card of list) {
      expect(within(card).getByTestId('sample-badge')).toHaveTextContent('Sample listing')
    }
  })

  it('puts the most expensive car first on price high to low', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await cards()

    await user.selectOptions(screen.getByLabelText('Sort'), 'price-desc')
    const list = await cardsWhen((found) => {
      expect(found).toHaveLength(12)
      expect(found[0]).toHaveAttribute('data-price', '55')
    })

    const prices = pricesOf(list)
    expect(prices[0]).toBe(55)
    expect(prices[prices.length - 1]).toBe(20)
    for (let index = 1; index < prices.length; index += 1) {
      expect(prices[index]).toBeLessThanOrEqual(prices[index - 1])
    }
  })
})

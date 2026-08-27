import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AppDataProvider } from '../state/AppState'

const LISTINGS_KEY = 'touchroad.listings.v1'
const CAR_TITLE = '2020 Mazda CX-5'

interface StoredListing {
  id: string
  make: string
  model: string
  year: number
  city: string
  pricePerDay: number
}

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

function storedListings(): StoredListing[] {
  const raw = localStorage.getItem(LISTINGS_KEY)
  if (!raw) return []
  const parsed: unknown = JSON.parse(raw)
  expect(Array.isArray(parsed)).toBe(true)
  return parsed as StoredListing[]
}

async function cards(): Promise<HTMLElement[]> {
  return screen.findAllByTestId('listing-card', {}, { timeout: 3000 })
}

function cardWithPrice(list: HTMLElement[], price: string): HTMLElement | undefined {
  return list.find((card) => card.getAttribute('data-price') === price)
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('publishing a car through the wizard', () => {
  it(
    'signs in, publishes, shows up in Browse and My cars, survives a reload, then removes',
    async () => {
      const user = userEvent.setup()

      // 1. A fresh browser lands on the host page with nothing stored.
      renderApp('/host')
      expect(storedListings()).toHaveLength(0)

      // 2. Sign in from the wizard's own affordance, not the shell button.
      const wizard = screen.getByTestId('wizard')
      await user.click(within(wizard).getByRole('button', { name: 'Sign in' }))
      const nameInput = await screen.findByTestId('auth-name-input')
      await user.type(nameInput, 'Jordan')
      await user.click(screen.getByTestId('auth-submit'))
      await waitFor(() => {
        expect(screen.queryByTestId('auth-sheet')).toBeNull()
      })

      // 3a. Step 1, the car itself.
      expect(screen.getByTestId('wizard')).toHaveAttribute('data-step', '1')
      await user.type(screen.getByLabelText('Year'), '2020')
      await user.type(screen.getByLabelText('Make'), 'Mazda')
      await user.type(screen.getByLabelText('Model'), 'CX-5')
      await user.selectOptions(screen.getByLabelText('Class'), 'SUV')
      await user.selectOptions(screen.getByLabelText('Seats'), '5')
      await user.selectOptions(screen.getByLabelText('Transmission'), 'Automatic')
      await user.click(screen.getByTestId('wizard-next'))

      // 3b. Step 2, where it sits.
      await waitFor(() => {
        expect(screen.getByTestId('wizard')).toHaveAttribute('data-step', '2')
      })
      await user.selectOptions(screen.getByLabelText('City'), 'Destin')
      await user.click(screen.getByTestId('wizard-next'))

      // 3c. Step 3, the price, next to the sample SUV average.
      await waitFor(() => {
        expect(screen.getByTestId('wizard')).toHaveAttribute('data-step', '3')
      })
      const nudge = screen.getByTestId('wizard-price-nudge')
      expect(nudge.textContent).toContain('SUV')
      expect(nudge.textContent).toContain('$42')
      await user.type(screen.getByLabelText('Price a day'), '33')
      await user.click(screen.getByTestId('wizard-next'))

      // 3d. Step 4, the review, then publish.
      await waitFor(() => {
        expect(screen.getByTestId('wizard')).toHaveAttribute('data-step', '4')
      })
      const review = screen.getByTestId('wizard').textContent ?? ''
      expect(review).toContain(CAR_TITLE)
      expect(review).toContain('$33 a day')
      expect(review).toContain('Destin')
      expect(review).toContain('SUV')
      await user.click(screen.getByTestId('wizard-publish'))

      // 4. The success panel.
      expect(await screen.findByText('Your listing is live in the preview.')).toBeInTheDocument()
      expect(screen.queryByTestId('wizard-publish')).toBeNull()

      // 5. It is on the board, tagged as yours and not as a sample.
      await user.click(screen.getByRole('link', { name: 'See it in Browse' }))
      let published = await waitFor(
        () => {
          const found = cardWithPrice(screen.getAllByTestId('listing-card'), '33')
          expect(found).toBeDefined()
          return found as HTMLElement
        },
        { timeout: 3000 },
      )
      const listingId = published.getAttribute('data-listing-id') ?? ''
      expect(listingId).not.toBe('')
      expect(published.textContent).toContain(CAR_TITLE)
      expect(published.textContent).toContain('Destin')
      expect(within(published).getByTestId('your-badge')).toHaveTextContent('Your listing')
      expect(within(published).queryByTestId('sample-badge')).toBeNull()

      // 6. It survives a reload: the storage key holds it, and a fresh mount
      //    of the whole app reads it back.
      const stored = storedListings()
      expect(
        stored.some(
          (listing) =>
            listing.make === 'Mazda' &&
            listing.model === 'CX-5' &&
            listing.year === 2020 &&
            listing.city === 'Destin' &&
            listing.pricePerDay === 33,
        ),
      ).toBe(true)

      cleanup()
      renderApp('/')
      await cards()
      published = await waitFor(
        () => {
          const found = cardWithPrice(screen.getAllByTestId('listing-card'), '33')
          expect(found).toBeDefined()
          return found as HTMLElement
        },
        { timeout: 3000 },
      )
      expect(published.getAttribute('data-listing-id')).toBe(listingId)
      expect(published.textContent).toContain(CAR_TITLE)

      // 7. My cars lists it under the still signed in account.
      cleanup()
      renderApp('/account')
      expect(screen.getByTestId('account-signed-in')).toBeInTheDocument()
      const row = screen.getByTestId('my-cars-item')
      expect(row).toHaveAttribute('data-listing-id', listingId)
      expect(row.textContent).toContain(CAR_TITLE)

      // 8. Removing it clears the row, the board, and the browser storage.
      await user.click(within(row).getByRole('button', { name: `Remove ${CAR_TITLE}` }))
      await user.click(await screen.findByRole('button', { name: 'Remove listing' }))
      await waitFor(() => {
        expect(screen.queryByTestId('my-cars-item')).toBeNull()
      })
      // Both tab panels stay mounted so each tab's aria-controls resolves, so the
      // assertion scopes to the one that is actually showing.
      expect(within(screen.getByRole('tabpanel')).getByTestId('empty-state')).toBeInTheDocument()
      expect(
        storedListings().some((listing) => listing.id === listingId),
      ).toBe(false)

      cleanup()
      renderApp('/')
      const remaining = await cards()
      expect(remaining).toHaveLength(12)
      expect(cardWithPrice(remaining, '33')).toBeUndefined()
      expect(
        remaining.some((card) => card.getAttribute('data-listing-id') === listingId),
      ).toBe(false)
      expect(screen.queryAllByTestId('your-badge')).toHaveLength(0)
    },
    15000,
  )
})

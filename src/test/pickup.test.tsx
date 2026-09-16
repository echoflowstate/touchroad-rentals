import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { PickupCountdown } from '../components/PickupCountdown'
import {
  formatCountdown,
  LATE_PICKUP_FEE_DAYS,
  latePickupFee,
  PICKUP_WINDOW_HOURS,
  pickupDeadline,
  pickupStatus,
} from '../lib/pickup'
import { loadTrips } from '../lib/storage'
import { AppDataProvider } from '../state/AppState'

/**
 * The pick-up window.
 *
 * Confirming the location starts a 24 hour clock; running it out costs a day of
 * the rate. The clock is derived from the confirmation, so these can drive it by
 * moving the clock rather than by waiting a day.
 */

const CIVIC = 'sample-civic-fortwalton'
const HOUR = 3_600_000

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

function trip(overrides: Partial<Parameters<typeof pickupStatus>[0]> = {}) {
  return { pickupConfirmedAt: null, pickedUpAt: null, rate: 47, ...overrides }
}

beforeEach(() => {
  localStorage.clear()
  window.innerWidth = 1024
})

afterEach(() => {
  cleanup()
})

describe('the pick-up clock', () => {
  it('gives a renter 24 hours from the moment the location is confirmed', () => {
    expect(PICKUP_WINDOW_HOURS).toBe(24)
    const confirmedAt = 1_800_000_000_000
    expect(pickupDeadline(trip({ pickupConfirmedAt: confirmedAt }))).toBe(
      confirmedAt + 24 * HOUR,
    )
  })

  it('does not run at all until the location is confirmed', () => {
    const status = pickupStatus(trip(), 1_800_000_000_000)
    expect(status.stage).toBe('unconfirmed')
    expect(status.deadline).toBeNull()
    expect(status.lateFee).toBe(0)
  })

  it('counts down inside the window', () => {
    const confirmedAt = 1_800_000_000_000
    const status = pickupStatus(
      trip({ pickupConfirmedAt: confirmedAt }),
      confirmedAt + 30 * 60 * 1000,
    )
    expect(status.stage).toBe('counting')
    expect(formatCountdown(status)).toBe('23:30:00')
    expect(status.lateFee).toBe(0)
  })

  // progress runs 0 at the start to 1 at the deadline; the ring is drawn from
  // it inverted, so a full ring means a full window.
  it('drains the ring evenly across the window', () => {
    const confirmedAt = 1_800_000_000_000
    expect(pickupStatus(trip({ pickupConfirmedAt: confirmedAt }), confirmedAt).progress).toBe(0)
    expect(
      pickupStatus(trip({ pickupConfirmedAt: confirmedAt }), confirmedAt + 12 * HOUR).progress,
    ).toBeCloseTo(0.5, 5)
    expect(
      pickupStatus(trip({ pickupConfirmedAt: confirmedAt }), confirmedAt + 24 * HOUR).progress,
    ).toBe(1)
  })

  it('turns late the moment the window closes, and charges a day of the rate', () => {
    const confirmedAt = 1_800_000_000_000
    const status = pickupStatus(
      trip({ pickupConfirmedAt: confirmedAt }),
      confirmedAt + 24 * HOUR + 1,
    )
    expect(status.stage).toBe('late')
    expect(status.lateFee).toBe(47)
    expect(latePickupFee(47)).toBe(47 * LATE_PICKUP_FEE_DAYS)
  })

  it('counts the hours it is late by', () => {
    const confirmedAt = 1_800_000_000_000
    const status = pickupStatus(
      trip({ pickupConfirmedAt: confirmedAt }),
      confirmedAt + 31 * HOUR,
    )
    expect(status.hoursLate).toBe(7)
  })

  it('stops for good once the car is collected, late or not', () => {
    const confirmedAt = 1_800_000_000_000
    const collected = pickupStatus(
      trip({ pickupConfirmedAt: confirmedAt, pickedUpAt: confirmedAt + 40 * HOUR }),
      confirmedAt + 90 * HOUR,
    )
    expect(collected.stage).toBe('collected')
    expect(collected.lateFee).toBe(0)
  })

  it('does not charge a penalty on a rate that makes no sense', () => {
    expect(latePickupFee(0)).toBe(0)
    expect(latePickupFee(-20)).toBe(0)
    expect(latePickupFee(Number.NaN)).toBe(0)
  })
})

describe('the countdown on screen', () => {
  it('reads the time left', () => {
    const confirmedAt = 1_800_000_000_000
    render(
      <PickupCountdown
        trip={{ pickupConfirmedAt: confirmedAt, pickedUpAt: null, rate: 47 }}
        now={confirmedAt + 2 * HOUR + 15 * 60 * 1000}
      />,
    )
    expect(screen.getByTestId('pickup-countdown')).toHaveAttribute('data-stage', 'counting')
    expect(screen.getByTestId('pickup-remaining').textContent).toBe('21:45:00')
  })

  it('states the charge once the window has closed', () => {
    const confirmedAt = 1_800_000_000_000
    render(
      <PickupCountdown
        trip={{ pickupConfirmedAt: confirmedAt, pickedUpAt: null, rate: 47 }}
        now={confirmedAt + 26 * HOUR}
      />,
    )
    expect(screen.getByTestId('pickup-countdown')).toHaveAttribute('data-stage', 'late')
    expect(screen.getByTestId('pickup-penalty').textContent).toContain('$47')
    expect(screen.getByTestId('pickup-penalty').textContent).toContain('one day of the rate')
  })

  it('turns urgent inside the last two hours and names the charge coming', () => {
    const confirmedAt = 1_800_000_000_000
    render(
      <PickupCountdown
        trip={{ pickupConfirmedAt: confirmedAt, pickedUpAt: null, rate: 47 }}
        now={confirmedAt + 23 * HOUR}
      />,
    )
    const clock = screen.getByTestId('pickup-countdown')
    expect(clock).toHaveAttribute('data-stage', 'counting')
    expect(clock).toHaveAttribute('data-urgent', 'true')
    expect(clock.textContent).toContain('$47')
  })

  it('is not urgent with most of the window still to run', () => {
    const confirmedAt = 1_800_000_000_000
    render(
      <PickupCountdown
        trip={{ pickupConfirmedAt: confirmedAt, pickedUpAt: null, rate: 47 }}
        now={confirmedAt + 4 * HOUR}
      />,
    )
    expect(screen.getByTestId('pickup-countdown')).not.toHaveAttribute('data-urgent')
  })

  it('says the clock has not started before the location is confirmed', () => {
    render(<PickupCountdown trip={{ pickupConfirmedAt: null, pickedUpAt: null, rate: 47 }} />)
    expect(screen.getByTestId('pickup-countdown')).toHaveAttribute('data-stage', 'unconfirmed')
  })
})

describe('requesting a car', () => {
  it('asks to confirm the pick-up location before starting any clock', async () => {
    const user = userEvent.setup()
    renderApp(`/car/${CIVIC}`)

    await user.click(screen.getByTestId('request-button'))
    await user.type(await screen.findByTestId('auth-name-input'), 'Dana')
    await user.click(screen.getByTestId('auth-submit'))

    const confirmation = await screen.findByTestId('request-confirmation')
    const banner = within(confirmation).getByTestId('confirm-banner')
    expect(
      within(banner).getByText('Are you sure you want to confirm this location?'),
    ).toBeInTheDocument()
    // Fort Walton is where the Civic is parked, so that is what gets confirmed.
    expect(banner.textContent).toContain('Fort Walton')

    // Nothing is counting yet.
    expect(loadTrips()[0].pickupConfirmedAt).toBeNull()
  })

  it('starts the 24 hour window only once the location is confirmed', async () => {
    const user = userEvent.setup()
    renderApp(`/car/${CIVIC}`)

    await user.click(screen.getByTestId('request-button'))
    await user.type(await screen.findByTestId('auth-name-input'), 'Dana')
    await user.click(screen.getByTestId('auth-submit'))

    const confirmation = await screen.findByTestId('request-confirmation')
    await user.click(within(confirmation).getByTestId('confirm-banner-confirm'))

    await waitFor(() => {
      expect(screen.getByTestId('pickup-countdown')).toHaveAttribute('data-stage', 'counting')
    })
    const stored = loadTrips()[0]
    expect(stored.pickupConfirmedAt).not.toBeNull()
    expect(stored.pickupCity).toBe('Fort Walton')
    expect(stored.pickedUpAt).toBeNull()
  })

  it('carries the pick-up city onto the trip', async () => {
    const user = userEvent.setup()
    renderApp(`/car/${CIVIC}`)

    await user.click(screen.getByTestId('request-button'))
    await user.type(await screen.findByTestId('auth-name-input'), 'Dana')
    await user.click(screen.getByTestId('auth-submit'))
    await screen.findByTestId('request-confirmation')

    expect(loadTrips()[0].pickupCity).toBe('Fort Walton')
  })
})

describe('a trip in the account', () => {
  async function requestAndConfirm(user: ReturnType<typeof userEvent.setup>) {
    renderApp(`/car/${CIVIC}`)
    await user.click(screen.getByTestId('request-button'))
    await user.type(await screen.findByTestId('auth-name-input'), 'Dana')
    await user.click(screen.getByTestId('auth-submit'))
    const confirmation = await screen.findByTestId('request-confirmation')
    await user.click(within(confirmation).getByTestId('confirm-banner-confirm'))
    await waitFor(() => {
      expect(loadTrips()[0].pickupConfirmedAt).not.toBeNull()
    })
  }

  it('shows the clock, and stops it when the car is marked picked up', async () => {
    const user = userEvent.setup()
    await requestAndConfirm(user)

    await user.click(within(await screen.findByRole('dialog')).getByRole('link', { name: /trips/i }))

    const row = await screen.findByTestId('trip-item')
    await waitFor(() => {
      expect(row).toHaveAttribute('data-pickup-stage', 'counting')
    })

    await user.click(within(row).getByTestId('mark-collected'))
    await waitFor(() => {
      expect(screen.getByTestId('trip-item')).toHaveAttribute('data-pickup-stage', 'collected')
    })
    expect(loadTrips()[0].pickedUpAt).not.toBeNull()
  })

  it('asks an unconfirmed trip for its location before anything else', async () => {
    const user = userEvent.setup()
    renderApp(`/car/${CIVIC}`)
    await user.click(screen.getByTestId('request-button'))
    await user.type(await screen.findByTestId('auth-name-input'), 'Dana')
    await user.click(screen.getByTestId('auth-submit'))
    await screen.findByTestId('request-confirmation')
    await user.click(screen.getByRole('link', { name: /trips/i }))

    const row = await screen.findByTestId('trip-item')
    expect(row).toHaveAttribute('data-pickup-stage', 'unconfirmed')
    expect(
      within(row).getByText('Are you sure you want to confirm this location?'),
    ).toBeInTheDocument()
  })
})

describe('a trip stored before the pick-up window existed', () => {
  it('still loads, with the clock simply not started', () => {
    localStorage.setItem(
      'touchroad.trips.v1',
      JSON.stringify([
        {
          id: 'trip-old',
          listingId: CIVIC,
          listingTitle: '2018 Honda Civic',
          hostName: 'Danny',
          city: 'Fort Walton',
          startDate: '2026-09-20',
          endDate: '2026-09-23',
          days: 3,
          rate: 47,
          subtotal: 141,
          total: 141,
          createdAt: 1_700_000_000_000,
        },
      ]),
    )

    const [restored] = loadTrips()
    expect(restored.id).toBe('trip-old')
    // The pick-up city falls back to the city it was already carrying.
    expect(restored.pickupCity).toBe('Fort Walton')
    expect(restored.pickupConfirmedAt).toBeNull()
    expect(restored.pickedUpAt).toBeNull()
  })
})

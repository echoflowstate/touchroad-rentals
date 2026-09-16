import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { longDateLabel } from '../lib/calendar'
import { addDays, todayISO } from '../lib/pricing'
import { AppDataProvider } from '../state/AppState'

const CIVIC = 'sample-civic-fortwalton'
const SENTRA = 'sample-sentra-crestview'
const MUSTANG = 'sample-mustang-sandestin'

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

/** Collapses the whitespace JSX leaves between spans so a row reads as one line. */
function line(element: HTMLElement | null): string {
  return (element?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * Moves the drop-off out through the trip planner, which is the only way dates
 * are entered now. The desktop popover applies the range on the second pick and
 * closes itself.
 */
async function setDropOff(days: number): Promise<void> {
  const start = todayISO()
  fireEvent.click(screen.getByRole('button', { name: /Trip dates/ }))
  const popover = await screen.findByTestId('date-popover')
  fireEvent.click(within(popover).getByRole('gridcell', { name: longDateLabel(start) }))
  fireEvent.click(
    within(popover).getByRole('gridcell', { name: longDateLabel(addDays(start, days)) }),
  )
  await waitFor(() => {
    expect(screen.queryByTestId('date-popover')).not.toBeInTheDocument()
  })
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('the trip calculator', () => {
  it('reads $47 x 3 days = $141 with a $0 fees line', () => {
    renderApp(`/car/${CIVIC}`)

    expect(line(screen.getByTestId('calc-subtotal'))).toContain('$47 × 3 days = $141')

    const fees = screen.getByTestId('calc-fees')
    expect(line(fees)).toContain('Service fees')
    expect(line(fees)).toContain('$0')
    expect(screen.getByText('No booking fees on Touch Road')).toBeInTheDocument()

    expect(screen.getByTestId('odometer-value').textContent).toBe('$141')
    expect(screen.getByTestId('calc-total')).toContainElement(screen.getByTestId('odometer-value'))
  })

  it('re-rolls the total to $235 when the drop off moves out to five days', async () => {
    renderApp(`/car/${CIVIC}`)
    expect(screen.getByTestId('odometer-value').textContent).toBe('$141')

    await setDropOff(5)

    await waitFor(() => {
      expect(screen.getByTestId('odometer-value').textContent).toBe('$235')
    })
    expect(line(screen.getByTestId('calc-subtotal'))).toContain('$47 × 5 days = $235')
    expect(line(screen.getByTestId('calc-fees'))).toContain('$0')
  })

  it('prices the $41 Nissan Sentra over three days at $123', () => {
    renderApp(`/car/${SENTRA}`)

    expect(line(screen.getByTestId('calc-subtotal'))).toContain('$41 × 3 days = $123')
    expect(screen.getByTestId('odometer-value').textContent).toBe('$123')
    expect(line(screen.getByTestId('calc-fees'))).toContain('$0')
  })

  it('prices the $89 Mustang over four days at $356', async () => {
    renderApp(`/car/${MUSTANG}`)

    await setDropOff(4)

    await waitFor(() => {
      expect(screen.getByTestId('odometer-value').textContent).toBe('$356')
    })
    expect(line(screen.getByTestId('calc-subtotal'))).toContain('$89 × 4 days = $356')
    expect(line(screen.getByTestId('calc-fees'))).toContain('$0')
    expect(line(screen.getByTestId('calc-fees'))).toContain('Service fees')
  })
})

describe('the host earnings teaser', () => {
  it('reads at $67/day thats ~$536/month for an SUV over eight days', async () => {
    renderApp('/host')

    fireEvent.change(screen.getByLabelText('Vehicle class'), { target: { value: 'SUV' } })
    fireEvent.change(screen.getByLabelText(/Days a month/), { target: { value: '8' } })

    await waitFor(() => {
      expect(line(screen.getByTestId('earnings-result'))).toBe("at $67/day that's ~$536/month")
    })
  })

  it('splits that into the 5% Touch Road keeps and the rest', async () => {
    renderApp('/host')

    fireEvent.change(screen.getByLabelText('Vehicle class'), { target: { value: 'SUV' } })
    fireEvent.change(screen.getByLabelText(/Days a month/), { target: { value: '8' } })

    await waitFor(() => {
      expect(screen.getByTestId('earnings-gross').textContent).toBe('$536')
    })
    // 5% of $536 is $26.80, which rounds to $27.
    expect(screen.getByTestId('earnings-commission').textContent).toBe('-$27')
    expect(screen.getByTestId('earnings-net').textContent).toBe('$509')

    // The three numbers have to add up on screen, not just in the model.
    const gross = Number(screen.getByTestId('earnings-gross').textContent?.replace(/[^0-9]/g, ''))
    const cut = Number(screen.getByTestId('earnings-commission').textContent?.replace(/[^0-9]/g, ''))
    const net = Number(screen.getByTestId('earnings-net').textContent?.replace(/[^0-9]/g, ''))
    expect(cut + net).toBe(gross)
  })
})

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { addDays } from '../lib/pricing'
import { AppDataProvider } from '../state/AppState'

const CIVIC_29 = 'sample-civic-fortwalton'
const SENTRA_25 = 'sample-sentra-crestview'
const MUSTANG_55 = 'sample-mustang-sandestin'

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

function setDropOff(days: number): void {
  const pickUp = screen.getByLabelText('Pick up') as HTMLInputElement
  const dropOff = screen.getByLabelText('Drop off') as HTMLInputElement
  fireEvent.change(dropOff, { target: { value: addDays(pickUp.value, days) } })
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('the trip calculator', () => {
  it('reads $29 x 3 days = $87 with a $0 fees line', () => {
    renderApp(`/car/${CIVIC_29}`)

    expect(line(screen.getByTestId('calc-subtotal'))).toContain('$29 × 3 days = $87')

    const fees = screen.getByTestId('calc-fees')
    expect(line(fees)).toContain('Service fees')
    expect(line(fees)).toContain('$0')
    expect(screen.getByText('No booking fees on Touch Road')).toBeInTheDocument()

    expect(screen.getByTestId('odometer-value').textContent).toBe('$87')
    expect(screen.getByTestId('calc-total')).toContainElement(screen.getByTestId('odometer-value'))
  })

  it('re-rolls the total to $145 when the drop off moves out to five days', async () => {
    renderApp(`/car/${CIVIC_29}`)
    expect(screen.getByTestId('odometer-value').textContent).toBe('$87')

    setDropOff(5)

    await waitFor(() => {
      expect(screen.getByTestId('odometer-value').textContent).toBe('$145')
    })
    expect(line(screen.getByTestId('calc-subtotal'))).toContain('$29 × 5 days = $145')
    expect(line(screen.getByTestId('calc-fees'))).toContain('$0')
  })

  it('prices the $25 Nissan Sentra over three days at $75', () => {
    renderApp(`/car/${SENTRA_25}`)

    expect(line(screen.getByTestId('calc-subtotal'))).toContain('$25 × 3 days = $75')
    expect(screen.getByTestId('odometer-value').textContent).toBe('$75')
    expect(line(screen.getByTestId('calc-fees'))).toContain('$0')
  })

  it('prices the $55 Mustang over four days at $220', async () => {
    renderApp(`/car/${MUSTANG_55}`)

    setDropOff(4)

    await waitFor(() => {
      expect(screen.getByTestId('odometer-value').textContent).toBe('$220')
    })
    expect(line(screen.getByTestId('calc-subtotal'))).toContain('$55 × 4 days = $220')
    expect(line(screen.getByTestId('calc-fees'))).toContain('$0')
    expect(line(screen.getByTestId('calc-fees'))).toContain('Service fees')
  })
})

describe('the host earnings teaser', () => {
  it('reads at $42/day thats ~$336/month for an SUV over eight days', async () => {
    renderApp('/host')

    fireEvent.change(screen.getByLabelText('Vehicle class'), { target: { value: 'SUV' } })
    fireEvent.change(screen.getByLabelText(/Days a month/), { target: { value: '8' } })

    await waitFor(() => {
      expect(line(screen.getByTestId('earnings-result'))).toBe("at $42/day that's ~$336/month")
    })
  })
})

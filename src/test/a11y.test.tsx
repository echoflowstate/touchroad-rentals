import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { AppDataProvider } from '../state/AppState'

function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppDataProvider>
        <App />
      </AppDataProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => localStorage.clear())
afterEach(() => cleanup())

describe('the sign-in sheet', () => {
  it('hands focus back to the control that opened it', async () => {
    const user = userEvent.setup()
    renderApp('/account')

    const trigger = screen.getByRole('button', { name: /sign in to the preview/i })
    await user.click(trigger)

    const input = await screen.findByTestId('auth-name-input')
    await waitFor(() => expect(input).toHaveFocus())

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByTestId('auth-name-input')).toBeNull())
    // Without this, an autofocused field records itself as the return target and
    // a keyboard user is dropped on the body.
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('closes on Escape and locks the page behind it while open', async () => {
    const user = userEvent.setup()
    renderApp('/account')
    await user.click(screen.getByRole('button', { name: /sign in to the preview/i }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(document.body.style.overflow).toBe('hidden')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})

describe('the account tabs', () => {
  async function signIn(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /sign in to the preview/i }))
    await user.type(await screen.findByTestId('auth-name-input'), 'Dana')
    await user.click(screen.getByTestId('auth-submit'))
    await screen.findByTestId('account-signed-in')
  }

  it('moves between tabs with the arrow keys', async () => {
    const user = userEvent.setup()
    renderApp('/account')
    await signIn(user)

    const cars = screen.getByRole('tab', { name: 'My cars' })
    const trips = screen.getByRole('tab', { name: 'Trips' })

    expect(cars).toHaveAttribute('aria-selected', 'true')
    expect(cars).toHaveAttribute('tabindex', '0')
    expect(trips).toHaveAttribute('tabindex', '-1')

    cars.focus()
    await user.keyboard('{ArrowRight}')
    await waitFor(() => expect(trips).toHaveAttribute('aria-selected', 'true'))
    expect(trips).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    await waitFor(() => expect(cars).toHaveAttribute('aria-selected', 'true'))

    await user.keyboard('{End}')
    await waitFor(() => expect(trips).toHaveAttribute('aria-selected', 'true'))
    await user.keyboard('{Home}')
    await waitFor(() => expect(cars).toHaveAttribute('aria-selected', 'true'))
  })

  it('points every tab at a panel that is really in the document', async () => {
    const user = userEvent.setup()
    renderApp('/account')
    await signIn(user)

    for (const name of ['My cars', 'Trips']) {
      const tab = screen.getByRole('tab', { name })
      const id = tab.getAttribute('aria-controls')
      expect(id, `${name} has no aria-controls`).toBeTruthy()
      expect(document.getElementById(id!), `${name} points at a missing panel`).toBeTruthy()
    }
    // Only the selected panel is exposed to assistive tech.
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
  })
})

describe('headings', () => {
  it('gives Browse a heading between the hero and the card titles', async () => {
    renderApp('/')
    await screen.findAllByTestId('listing-card')
    const levels = Array.from(document.querySelectorAll('h1, h2, h3')).map((el) =>
      Number(el.tagName.slice(1)),
    )
    expect(levels[0]).toBe(1)
    // No jump of more than one level anywhere in the outline.
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
    }
    expect(document.querySelectorAll('h1')).toHaveLength(1)
  })
})

describe('the wizard errors', () => {
  it('ties each message to the field it is about', async () => {
    const user = userEvent.setup()
    renderApp('/host')
    // The nav and the wizard gate both offer a sign-in button; either will do.
    await user.click(screen.getAllByRole('button', { name: /sign in/i })[0])
    await user.type(await screen.findByTestId('auth-name-input'), 'Dana')
    await user.click(screen.getByTestId('auth-submit'))

    const wizard = await screen.findByTestId('wizard')
    await user.click(within(wizard).getByTestId('wizard-next'))

    const year = document.getElementById('wizard-year')!
    expect(year).toHaveAttribute('aria-invalid', 'true')
    const describedBy = year.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    const message = document.getElementById(describedBy!)
    expect(message).toBeTruthy()
    expect(message).toHaveAttribute('role', 'alert')
  })
})

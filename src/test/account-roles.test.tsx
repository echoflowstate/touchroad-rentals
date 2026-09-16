import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { loadSession } from '../lib/storage'
import { AppDataProvider } from '../state/AppState'

/**
 * Guest and Host.
 *
 * Signing up picks a side. A host can look at either one; a guest has only the
 * one until they become a host, which publishing a car also does for them.
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

async function signUp(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  role: 'guest' | 'host',
) {
  await user.click(screen.getByRole('button', { name: /sign in to the preview/i }))
  await user.type(await screen.findByTestId('auth-name-input'), name)
  await user.click(screen.getByTestId(`role-${role}`))
  await user.click(screen.getByTestId('auth-submit'))
  await screen.findByTestId('account-signed-in')
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('signing up', () => {
  it('offers Guest and Host, and starts on Guest', async () => {
    const user = userEvent.setup()
    renderApp('/account')
    await user.click(screen.getByRole('button', { name: /sign in to the preview/i }))

    const choice = await screen.findByTestId('role-choice')
    expect(within(choice).getByTestId('role-guest')).toHaveAttribute('aria-checked', 'true')
    expect(within(choice).getByTestId('role-host')).toHaveAttribute('aria-checked', 'false')
  })

  it('remembers a host account, and which side it is on, across a reload', async () => {
    const user = userEvent.setup()
    renderApp('/account')
    await signUp(user, 'Marisol', 'host')

    const stored = loadSession()
    expect(stored?.name).toBe('Marisol')
    expect(stored?.role).toBe('host')
    expect(stored?.mode).toBe('host')
  })

  it('keeps a guest account a guest', async () => {
    const user = userEvent.setup()
    renderApp('/account')
    await signUp(user, 'Danny', 'guest')

    expect(loadSession()?.role).toBe('guest')
    expect(screen.queryByTestId('mode-switch-account')).not.toBeInTheDocument()
    expect(screen.getByTestId('become-host')).toBeInTheDocument()
  })
})

describe('switching sides', () => {
  it('lets a host switch to Guest mode and back', async () => {
    const user = userEvent.setup()
    renderApp('/account')
    await signUp(user, 'Marisol', 'host')

    const modeSwitch = await screen.findByTestId('mode-switch-account')
    expect(modeSwitch).toHaveAttribute('data-mode', 'host')

    await user.click(within(modeSwitch).getByTestId('mode-guest'))
    await waitFor(() => {
      expect(screen.getByTestId('mode-switch-account')).toHaveAttribute('data-mode', 'guest')
    })
    expect(loadSession()?.mode).toBe('guest')
    // The account is still a host account; only the view changed.
    expect(loadSession()?.role).toBe('host')

    await user.click(within(screen.getByTestId('mode-switch-account')).getByTestId('mode-host'))
    await waitFor(() => {
      expect(screen.getByTestId('mode-switch-account')).toHaveAttribute('data-mode', 'host')
    })
  })

  it('moves the switch with the arrow keys', async () => {
    const user = userEvent.setup()
    renderApp('/account')
    await signUp(user, 'Marisol', 'host')

    const host = within(await screen.findByTestId('mode-switch-account')).getByTestId('mode-host')
    host.focus()
    await user.keyboard('{ArrowLeft}')
    await waitFor(() => {
      expect(screen.getByTestId('mode-switch-account')).toHaveAttribute('data-mode', 'guest')
    })
  })

  it('lands a host on My cars and a guest on Trips', async () => {
    const user = userEvent.setup()
    renderApp('/account')
    await signUp(user, 'Marisol', 'host')

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'My cars' })).toHaveAttribute('aria-selected', 'true')
    })

    await user.click(within(screen.getByTestId('mode-switch-account')).getByTestId('mode-guest'))
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Trips' })).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('turns a guest into a host on request', async () => {
    const user = userEvent.setup()
    renderApp('/account')
    await signUp(user, 'Danny', 'guest')

    await user.click(screen.getByTestId('become-host'))
    await waitFor(() => {
      expect(screen.getByTestId('mode-switch-account')).toBeInTheDocument()
    })
    expect(loadSession()?.role).toBe('host')
    expect(screen.queryByTestId('become-host')).not.toBeInTheDocument()
  })
})

describe('feedback', () => {
  it('confirms a switch between sides with a toast', async () => {
    const user = userEvent.setup()
    renderApp('/account')
    await signUp(user, 'Marisol', 'host')

    await user.click(
      within(await screen.findByTestId('mode-switch-account')).getByTestId('mode-guest'),
    )
    const toast = await screen.findByTestId('toast')
    expect(toast.textContent).toContain('Switched to Guest mode')
  })

  it('says nothing when the switch is already where it is', async () => {
    const user = userEvent.setup()
    renderApp('/account')
    await signUp(user, 'Marisol', 'host')

    await user.click(
      within(await screen.findByTestId('mode-switch-account')).getByTestId('mode-host'),
    )
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
  })
})

describe('an older session', () => {
  it('loads as a guest rather than being thrown away', () => {
    // Written before roles existed: no role, no mode.
    localStorage.setItem(
      'touchroad.session.v1',
      JSON.stringify({ name: 'Tasha', signedInAt: 1_700_000_000_000 }),
    )
    const stored = loadSession()
    expect(stored?.name).toBe('Tasha')
    expect(stored?.role).toBe('guest')
    expect(stored?.mode).toBe('guest')
  })

  it('never lets a guest session claim it is looking at the host side', () => {
    localStorage.setItem(
      'touchroad.session.v1',
      JSON.stringify({ name: 'Tasha', signedInAt: 1, role: 'guest', mode: 'host' }),
    )
    expect(loadSession()?.mode).toBe('guest')
  })

  it('drops a role it does not recognise back to guest', () => {
    localStorage.setItem(
      'touchroad.session.v1',
      JSON.stringify({ name: 'Tasha', signedInAt: 1, role: 'admin', mode: 'admin' }),
    )
    expect(loadSession()?.role).toBe('guest')
    expect(loadSession()?.mode).toBe('guest')
  })
})

describe('the confirmation banner on the search card', () => {
  it('asks before it moves the results', async () => {
    renderApp('/')
    fireEvent.change(await screen.findByLabelText('Where'), { target: { value: 'Destin' } })

    const banner = await screen.findByTestId('confirm-banner')
    expect(within(banner).getByText('Are you sure you want to confirm location?')).toBeInTheDocument()
    expect(banner).toHaveAttribute('role', 'alertdialog')
  })

  it('puts the city back when the answer is no', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const where = (await screen.findByLabelText('Where')) as HTMLSelectElement
    fireEvent.change(where, { target: { value: 'Destin' } })
    expect(where.value).toBe('Destin')

    await user.click(screen.getByTestId('confirm-banner-cancel'))
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-banner')).not.toBeInTheDocument()
    })
    expect((screen.getByLabelText('Where') as HTMLSelectElement).value).toBe('all')
  })

  it('applies the city when the answer is yes', async () => {
    const user = userEvent.setup()
    renderApp('/')

    fireEvent.change(await screen.findByLabelText('Where'), { target: { value: 'Destin' } })
    await user.click(await screen.findByTestId('confirm-banner-confirm'))

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-banner')).not.toBeInTheDocument()
    })
    expect((screen.getByLabelText('Where') as HTMLSelectElement).value).toBe('Destin')
  })

  it('does not ask again when the city has not actually changed', async () => {
    renderApp('/')
    fireEvent.change(await screen.findByLabelText('Where'), { target: { value: 'all' } })
    expect(screen.queryByTestId('confirm-banner')).not.toBeInTheDocument()
  })
})

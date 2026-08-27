import { useCallback, useEffect, useId, useState, type FormEvent } from 'react'
import { useAppData } from '../state/AppState'
import { Sheet } from './Sheet'

/**
 * The whole "account" system: a first name held in this browser. It is mounted
 * once by the shell and opens whenever something asks for a name.
 */
export function AuthSheet(): JSX.Element | null {
  const { signInOpen, closeSignIn, signIn } = useAppData()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const nameId = useId()

  useEffect(() => {
    if (!signInOpen) return
    setName('')
    setError('')
  }, [signInOpen])

  const attempt = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Enter a first name to continue.')
      return
    }
    signIn(trimmed)
  }, [name, signIn])

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      attempt()
    },
    [attempt],
  )

  if (!signInOpen) return null

  return (
    <Sheet
      open={signInOpen}
      onClose={closeSignIn}
      title="Preview sign-in"
      footer={
        <button type="button" data-testid="auth-submit" className="btn-primary w-full" onClick={attempt}>
          Continue
        </button>
      }
    >
      <div data-testid="auth-sheet">
        <p className="text-sm leading-relaxed text-ink-muted">
          Preview sign-in - just a name, nothing stored beyond this browser.
        </p>

        <form onSubmit={onSubmit} className="mt-4" noValidate>
          <label htmlFor={nameId} className="label-micro block">
            Your name
          </label>
          <input
            id={nameId}
            data-testid="auth-name-input"
            className="field mt-2"
            type="text"
            name="name"
            placeholder="First name"
            autoComplete="given-name"
            maxLength={40}
            autoFocus
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (error) setError('')
            }}
            aria-describedby={error ? `${nameId}-error` : undefined}
            aria-invalid={error ? true : undefined}
          />
          {error ? (
            <p id={`${nameId}-error`} role="alert" className="mt-2 text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}
        </form>

        <p className="label-micro mt-5 leading-relaxed">
          No password, no code, no account. Sign out clears it.
        </p>
      </div>
    </Sheet>
  )
}

export default AuthSheet

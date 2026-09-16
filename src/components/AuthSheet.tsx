import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useAppData } from '../state/AppState'
import type { AccountRole } from '../types'
import { Sheet } from './Sheet'

const ROLE_CHOICES: Array<{ value: AccountRole; label: string; body: string }> = [
  { value: 'guest', label: 'Guest', body: 'I want to rent a car.' },
  { value: 'host', label: 'Host', body: 'I want to list my car too.' },
]

/**
 * The whole "account" system: a first name held in this browser. It is mounted
 * once by the shell and opens whenever something asks for a name.
 */
export function AuthSheet(): JSX.Element | null {
  const { signInOpen, closeSignIn, signIn } = useAppData()
  const [name, setName] = useState('')
  const [role, setRole] = useState<AccountRole>('guest')
  const [error, setError] = useState('')
  const nameId = useId()
  const roleId = useId()

  const inputRef = useRef<HTMLInputElement | null>(null)

  // Claimed here rather than with the autoFocus attribute: autoFocus fires during
  // commit, which is too early for Sheet to capture the control that opened it,
  // and the sheet then has nothing to hand focus back to on close.
  useEffect(() => {
    if (!signInOpen) return
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [signInOpen])

  useEffect(() => {
    if (!signInOpen) return
    setName('')
    setRole('guest')
    setError('')
  }, [signInOpen])

  const attempt = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Enter a first name to continue.')
      return
    }
    signIn(trimmed, role)
  }, [name, role, signIn])

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
            ref={inputRef}
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

        {/* Which side of the product this account is for. A host gets both;
            a guest can pick the other one up later from Account. */}
        <fieldset className="mt-5">
          <legend id={roleId} className="label-micro">
            Sign up as
          </legend>
          <div
            role="radiogroup"
            aria-labelledby={roleId}
            data-testid="role-choice"
            className="mt-2 grid grid-cols-2 gap-2"
          >
            {ROLE_CHOICES.map((choice) => {
              const selected = choice.value === role
              return (
                <button
                  key={choice.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-testid={`role-${choice.value}`}
                  onClick={() => setRole(choice.value)}
                  className={`focusable rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 ease-coast ${
                    selected
                      ? 'border-emerald bg-emerald-tint shadow-card'
                      : 'border-line bg-white hover:border-emerald-soft'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                        selected ? 'border-emerald' : 'border-line'
                      }`}
                    >
                      {selected ? <span className="h-2 w-2 rounded-full bg-emerald" /> : null}
                    </span>
                    <span className="font-display text-[15px] font-bold text-ink">
                      {choice.label}
                    </span>
                  </span>
                  <span className="mt-1 block text-[13px] leading-snug text-ink-muted">
                    {choice.body}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <p className="label-micro mt-5 leading-relaxed">
          No password, no code, no account. Sign out clears it.
        </p>
      </div>
    </Sheet>
  )
}

export default AuthSheet

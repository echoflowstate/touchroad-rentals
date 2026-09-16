import { useId } from 'react'
import { useReducedMotion } from '../lib/motion'
import { useAppData } from '../state/AppState'
import type { AccountRole } from '../types'

/**
 * The Guest / Host switch.
 *
 * A host account has two sides to it, and this is how it moves between them.
 * It is a radiogroup rather than a pair of buttons because the two options are
 * one choice with one answer, and the emerald pill slides between them so the
 * switch reads as one control rather than two.
 *
 * A guest account never sees it: there is nothing to switch to until they
 * become a host, which is offered separately.
 */

const OPTIONS: Array<{ value: AccountRole; label: string; hint: string }> = [
  { value: 'guest', label: 'Guest', hint: 'Renting a car' },
  { value: 'host', label: 'Host', hint: 'Listing your car' },
]

export function ModeSwitch({
  className,
  testId = 'mode-switch',
}: {
  className?: string
  /** The switch appears in more than one place, so each one is addressable. */
  testId?: string
}): JSX.Element | null {
  const { isHost, mode, setMode, pushToast } = useAppData()
  const reduced = useReducedMotion()
  const groupId = useId()

  if (!isHost) return null

  const activeIndex = OPTIONS.findIndex((option) => option.value === mode)
  const index = activeIndex === -1 ? 0 : activeIndex

  return (
    <div
      role="radiogroup"
      aria-label="View mode"
      data-testid={testId}
      data-mode={mode}
      className={`relative inline-flex rounded-full border border-line bg-white/80 p-1 ${className ?? ''}`}
    >
      {/* The pill that slides. It is the only thing that moves, so the switch
          animates on transform alone. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 top-1 rounded-full bg-emerald shadow-card"
        style={{
          width: `calc(${100 / OPTIONS.length}% - 4px)`,
          left: '2px',
          transform: `translateX(${index * 100}%)`,
          transition: reduced ? 'none' : 'transform 340ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />

      {OPTIONS.map((option) => {
        const selected = option.value === mode
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-describedby={`${groupId}-${option.value}`}
            data-testid={`mode-${option.value}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              if (option.value === mode) return
              setMode(option.value)
              pushToast(
                option.value === 'host' ? 'Switched to Host mode' : 'Switched to Guest mode',
              )
            }}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
              event.preventDefault()
              const delta = event.key === 'ArrowRight' ? 1 : -1
              const next = OPTIONS[(index + delta + OPTIONS.length) % OPTIONS.length]
              if (next.value === mode) return
              setMode(next.value)
              pushToast(
                next.value === 'host' ? 'Switched to Host mode' : 'Switched to Guest mode',
              )
            }}
            className={`focusable relative z-10 min-h-[36px] flex-1 whitespace-nowrap rounded-full px-4 font-display text-[13px] font-bold transition-colors duration-200 ${
              selected ? 'text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {option.label}
            <span id={`${groupId}-${option.value}`} className="sr-only">
              {option.hint}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default ModeSwitch

import { useReducedMotion } from '../lib/motion'
import { formatUSD } from '../lib/pricing'

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/** One character cell. The strip is ten of these, so 10% of it is one cell. */
const CELL_HEIGHT = '1.12em'
const ROLL_TRANSITION = 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)'
const STAGGER_MS = 22
const MAX_STAGGER_MS = 154

export interface OdometerProps {
  value: number
  className?: string
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9'
}

/**
 * The total is the argument this whole app is making, so it moves like a
 * physical counter. The rolling markup is decorative; the live region below
 * carries the real string for assistive tech and for the test suite.
 */
export function Odometer({ value, className }: OdometerProps): JSX.Element {
  const reduced = useReducedMotion()
  const formatted = formatUSD(value)
  const wrapperClass = ['inline-flex items-center', className ?? ''].filter(Boolean).join(' ')

  if (reduced) {
    return (
      <span className={wrapperClass} aria-live="polite" aria-atomic="true">
        <span aria-hidden="true" className="num font-display tabular-nums">
          {formatted}
        </span>
        <span data-testid="odometer-value" className="sr-only">
          {formatted}
        </span>
      </span>
    )
  }

  return (
    <span className={wrapperClass} aria-live="polite" aria-atomic="true">
      <span
        aria-hidden="true"
        className="num inline-flex items-center font-display leading-none tabular-nums"
      >
        {/* Keyed by position: the column must persist so the transform can
            transition when its digit changes. */}
        {formatted.split('').map((char, index) => {
          if (!isDigit(char)) {
            return (
              <span
                key={index}
                className="inline-flex items-center justify-center"
                style={{ height: CELL_HEIGHT }}
              >
                {char}
              </span>
            )
          }

          const digit = Number(char)
          return (
            <span
              key={index}
              className="relative inline-block overflow-hidden"
              style={{ height: CELL_HEIGHT }}
            >
              {/* Sets the column width to exactly one tabular digit. */}
              <span className="invisible">0</span>
              <span
                className="absolute left-0 top-0 flex w-full flex-col"
                style={{
                  transform: `translateY(-${digit * 10}%)`,
                  transition: ROLL_TRANSITION,
                  transitionDelay: `${Math.min(index * STAGGER_MS, MAX_STAGGER_MS)}ms`,
                }}
              >
                {DIGITS.map((face) => (
                  <span
                    key={face}
                    className="flex items-center justify-center"
                    style={{ height: CELL_HEIGHT }}
                  >
                    {face}
                  </span>
                ))}
              </span>
            </span>
          )
        })}
      </span>
      <span data-testid="odometer-value" className="sr-only">
        {formatted}
      </span>
    </span>
  )
}

export default Odometer

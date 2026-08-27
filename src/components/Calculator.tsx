import { useReducedMotion } from '../lib/motion'
import { computeQuote, formatUSD } from '../lib/pricing'
import { siteConfig } from '../site.config'
import type { Listing } from '../types'
import { DateRangeField } from './DateRangeField'
import { Odometer } from './Odometer'

export interface CalculatorProps {
  listing: Listing
  startDate: string
  endDate: string
  onDatesChange: (start: string, end: string) => void
}

/** The one coral mark on the page: a drawn check with a slightly loose tail. */
function CoralTick(): JSX.Element {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M4 10.8 8.2 15 16 5.4"
        stroke="#B33A1F"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Calculator({
  listing,
  startDate,
  endDate,
  onDatesChange,
}: CalculatorProps): JSX.Element {
  const reduced = useReducedMotion()
  const quote = computeQuote(listing.pricePerDay, startDate, endDate)
  const dayWord = quote.days === 1 ? 'day' : 'days'
  const equation = ` × ${quote.days} ${dayWord} = `

  return (
    <div className="card-flat overflow-hidden">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
        <div className="flex items-baseline gap-1.5">
          <span className="num font-display text-2xl font-extrabold text-ink">
            {formatUSD(listing.pricePerDay)}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            per day
          </span>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          Set by the host
        </span>
      </div>

      <div className="border-b border-line px-4 py-4 sm:px-5">
        <DateRangeField
          id={`trip-dates-${listing.id}`}
          label="Trip dates"
          startDate={startDate}
          endDate={endDate}
          onChange={onDatesChange}
        />
      </div>

      <div
        data-testid="calc-subtotal"
        className="flex items-baseline justify-between gap-3 px-4 py-3.5 sm:px-5"
      >
        <span className="num text-sm text-ink-muted">
          <span className="font-semibold text-ink">{formatUSD(quote.rate)}</span>
          {equation}
        </span>
        <span className="num text-sm font-semibold text-ink">{formatUSD(quote.subtotal)}</span>
      </div>

      {/* E6: the brand moment. A drawn coral tick, and the $0 lands once like a
          stamp rather than simply appearing. */}
      <div
        data-testid="calc-fees"
        className="border-y border-coral/25 border-l-4 border-l-coral bg-coral-tint px-4 py-4 sm:px-5"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/80">
              <CoralTick />
            </span>
            Service fees
          </span>
          <span
            className={`num rounded-lg bg-white/70 px-2.5 py-1 text-base font-extrabold text-coral-text ${
              reduced ? '' : 'animate-stamp'
            }`}
            style={reduced ? undefined : { animationDelay: '220ms' }}
          >
            {formatUSD(0)}
          </span>
        </div>
        <p className="mt-2 pl-[38px] text-[13px] font-semibold text-coral-text">
          No booking fees on {siteConfig.shortName}
        </p>
      </div>

      <div
        data-testid="calc-total"
        className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5"
      >
        <span className="font-display text-base font-bold text-ink">Total</span>
        <Odometer value={quote.total} className="text-3xl font-bold text-ink" />
      </div>

      <p className="label-micro border-t border-line-soft px-4 py-3 sm:px-5">
        Preview pricing. No payment is taken.
      </p>
    </div>
  )
}

export default Calculator

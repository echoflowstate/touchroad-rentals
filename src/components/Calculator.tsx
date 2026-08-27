import { addDays, computeQuote, formatUSD, parseISODate, todayISO } from '../lib/pricing'
import { siteConfig } from '../site.config'
import type { Listing } from '../types'
import { IconCheck } from './Icons'
import { Odometer } from './Odometer'

export interface CalculatorProps {
  listing: Listing
  startDate: string
  endDate: string
  onDatesChange: (start: string, end: string) => void
}

/** ISO dates sort lexicographically, so a string compare is a date compare. */
function isValid(value: string): boolean {
  return parseISODate(value) !== null
}

export function Calculator({
  listing,
  startDate,
  endDate,
  onDatesChange,
}: CalculatorProps): JSX.Element {
  const quote = computeQuote(listing.pricePerDay, startDate, endDate)
  const dayWord = quote.days === 1 ? 'day' : 'days'
  const equation = ` × ${quote.days} ${dayWord} = `

  function handleStart(next: string) {
    if (!isValid(next)) return
    // A drop-off that is not after the pick-up gets pushed out a day.
    const nextEnd = isValid(endDate) && endDate > next ? endDate : addDays(next, 1)
    onDatesChange(next, nextEnd)
  }

  function handleEnd(next: string) {
    if (!isValid(next)) return
    const nextEnd = next > startDate ? next : addDays(startDate, 1)
    onDatesChange(startDate, nextEnd)
  }

  const pickupId = `pickup-${listing.id}`
  const dropoffId = `dropoff-${listing.id}`

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

      <div className="grid gap-3 border-b border-line px-4 py-4 sm:grid-cols-2 sm:px-5">
        <div>
          <label className="label-micro mb-1.5 block" htmlFor={pickupId}>
            Pick up
          </label>
          <input
            id={pickupId}
            type="date"
            className="field"
            value={startDate}
            min={todayISO()}
            onChange={(event) => handleStart(event.target.value)}
          />
        </div>
        <div>
          <label className="label-micro mb-1.5 block" htmlFor={dropoffId}>
            Drop off
          </label>
          <input
            id={dropoffId}
            type="date"
            className="field"
            value={endDate}
            min={isValid(startDate) ? addDays(startDate, 1) : undefined}
            onChange={(event) => handleEnd(event.target.value)}
          />
        </div>
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

      <div
        data-testid="calc-fees"
        className="border-y border-line border-l-2 border-l-mint bg-mint/[0.06] px-4 py-3.5 sm:px-5"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint/10 text-mint-ink">
              <IconCheck className="h-4 w-4" />
            </span>
            Service fees
          </span>
          <span className="num text-sm font-semibold text-mint-ink">{formatUSD(0)}</span>
        </div>
        <p className="mt-1.5 pl-8 text-[13px] font-medium text-mint-ink">
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

      <p className="label-micro border-t border-line px-4 py-3 sm:px-5">
        Preview pricing. No payment is taken.
      </p>
    </div>
  )
}

export default Calculator

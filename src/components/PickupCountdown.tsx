import { useEffect, useState } from 'react'
import { useReducedMotion } from '../lib/motion'
import {
  formatCountdown,
  LATE_PICKUP_FEE_DAYS,
  latePickupFee,
  PICKUP_WINDOW_HOURS,
  pickupStatus,
} from '../lib/pickup'
import { formatUSD } from '../lib/pricing'
import type { Trip } from '../types'

/**
 * The pick-up clock.
 *
 * Once the location is confirmed the renter has PICKUP_WINDOW_HOURS to collect
 * the car. The ring drains as the window closes and the digits tick every
 * second; past the deadline it turns coral and states the charge.
 *
 * The tick keeps running under reduced motion, because a countdown that has
 * stopped counting is not a countdown. What stops is the ring's easing, so the
 * only thing left is the number changing.
 */

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
/** Inside this much of the window, the clock starts looking like a deadline. */
const URGENT_MS = 2 * 3_600_000

export interface PickupCountdownProps {
  trip: Pick<Trip, 'pickupConfirmedAt' | 'pickedUpAt' | 'rate'>
  /** Fixed clock for tests and stills. Live otherwise. */
  now?: number
  compact?: boolean
}

export function PickupCountdown({ trip, now, compact = false }: PickupCountdownProps): JSX.Element {
  const reduced = useReducedMotion()
  const [tick, setTick] = useState(() => now ?? Date.now())

  useEffect(() => {
    if (now !== undefined) {
      setTick(now)
      return
    }
    setTick(Date.now())
    const timer = window.setInterval(() => setTick(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [now])

  const status = pickupStatus(trip, tick)
  const late = status.stage === 'late'
  const collected = status.stage === 'collected'

  if (status.stage === 'unconfirmed') {
    return (
      <p data-testid="pickup-countdown" data-stage="unconfirmed" className="label-micro">
        Clock starts when the pick-up location is confirmed
      </p>
    )
  }

  if (collected) {
    return (
      <p
        data-testid="pickup-countdown"
        data-stage="collected"
        className="inline-flex items-center gap-2 rounded-full bg-emerald-tint px-3 py-1.5 font-display text-[13px] font-bold text-emerald-deep"
      >
        Picked up, clock stopped
      </p>
    )
  }

  const urgent = !late && status.remainingMs <= URGENT_MS
  const ringColor = late || urgent ? '#F2542E' : '#0B7458'
  // The ring drains rather than fills: full at the start of the window, empty
  // when it closes, which is the way a countdown is read.
  const offset = CIRCUMFERENCE * status.progress

  return (
    <div
      data-testid="pickup-countdown"
      data-stage={status.stage}
      data-urgent={urgent ? 'true' : undefined}
      className={`flex items-center gap-3.5 ${compact ? '' : 'sm:gap-4'}`}
    >
      <span
        aria-hidden="true"
        className={`relative shrink-0 ${urgent && !reduced ? 'animate-clock-urgent' : ''}`}
      >
        <svg width="64" height="64" viewBox="0 0 64 64" focusable="false">
          <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="#E7DFD1" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 32 32)"
            style={{
              transition: reduced ? 'none' : 'stroke-dashoffset 900ms linear',
            }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center">
          <span
            className={`num text-[11px] font-bold ${late || urgent ? 'text-coral-ink' : 'text-ink'}`}
          >
            {late ? 'Late' : `${status.hours}h`}
          </span>
        </span>
      </span>

      <div className="min-w-0">
        {late ? (
          <>
            <p className="font-display text-[15px] font-bold leading-snug text-coral-ink">
              Pick-up window closed
            </p>
            <p data-testid="pickup-penalty" className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">
              {`A late pick-up charge of ${formatUSD(status.lateFee)} applies, which is ${
                LATE_PICKUP_FEE_DAYS === 1 ? 'one day' : `${LATE_PICKUP_FEE_DAYS} days`
              } of the rate.`}
            </p>
          </>
        ) : (
          <>
            <p className="label-micro">Time to pick up</p>
            <p
              data-testid="pickup-remaining"
              aria-live="off"
              className={`num font-display text-2xl font-extrabold leading-none tracking-[-0.02em] ${
                urgent ? 'text-coral-ink' : 'text-ink'
              }`}
            >
              {formatCountdown(status)}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              {urgent
                ? `Less than two hours left. Miss it and a late pick-up charge of ${formatUSD(
                    latePickupFee(trip.rate),
                  )} applies.`
                : `${PICKUP_WINDOW_HOURS} hours from the moment you confirmed the location.`}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default PickupCountdown

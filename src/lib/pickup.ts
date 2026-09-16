import type { Trip } from '../types'

/**
 * The pick-up window.
 *
 * Confirming where the keys change hands starts a 24 hour clock. Collect the
 * car inside it and nothing happens; let it run out and a late pick-up charge
 * applies. The deadline is derived from the confirmation rather than stored, so
 * a trip can never carry a deadline that disagrees with when it was confirmed.
 */

/** Hours a renter has to collect the car once the location is confirmed. */
export const PICKUP_WINDOW_HOURS = 24

/**
 * What a missed window costs, counted in days of the rental rate. One day is
 * the charge; it does not compound, so a trip can only ever carry one of them.
 */
export const LATE_PICKUP_FEE_DAYS = 1

const HOUR_MS = 3_600_000

export type PickupStage =
  /** Requested, but nobody has agreed a place yet. The clock is not running. */
  | 'unconfirmed'
  /** Location confirmed, inside the window. */
  | 'counting'
  /** The window ran out before the car was collected. */
  | 'late'
  /** Collected. Nothing more to do. */
  | 'collected'

export interface PickupStatus {
  stage: PickupStage
  /** Epoch ms the window closes, or null while unconfirmed. */
  deadline: number | null
  /** Milliseconds left, floored at zero. */
  remainingMs: number
  hours: number
  minutes: number
  seconds: number
  /** 0 when the clock starts, 1 when it runs out. Drives the ring. */
  progress: number
  /** Whole hours past the deadline. */
  hoursLate: number
  /** The charge that applies right now. Zero unless the stage is late. */
  lateFee: number
}

export function pickupDeadline(trip: Pick<Trip, 'pickupConfirmedAt'>): number | null {
  if (trip.pickupConfirmedAt === null) return null
  return trip.pickupConfirmedAt + PICKUP_WINDOW_HOURS * HOUR_MS
}

/** The late charge for a trip at this rate: one day of it. */
export function latePickupFee(rate: number): number {
  const safe = Number.isFinite(rate) && rate > 0 ? Math.round(rate) : 0
  return safe * LATE_PICKUP_FEE_DAYS
}

export function pickupStatus(
  trip: Pick<Trip, 'pickupConfirmedAt' | 'pickedUpAt' | 'rate'>,
  now: number = Date.now(),
): PickupStatus {
  const deadline = pickupDeadline(trip)

  if (trip.pickedUpAt !== null) {
    return empty('collected', deadline)
  }
  if (deadline === null) {
    return empty('unconfirmed', null)
  }

  const remainingMs = Math.max(0, deadline - now)
  const total = PICKUP_WINDOW_HOURS * HOUR_MS
  const progress = Math.min(1, Math.max(0, (total - remainingMs) / total))

  if (remainingMs === 0) {
    return {
      stage: 'late',
      deadline,
      remainingMs: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      progress: 1,
      hoursLate: Math.floor((now - deadline) / HOUR_MS),
      lateFee: latePickupFee(trip.rate),
    }
  }

  const totalSeconds = Math.floor(remainingMs / 1000)
  return {
    stage: 'counting',
    deadline,
    remainingMs,
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    progress,
    hoursLate: 0,
    lateFee: 0,
  }
}

function empty(stage: PickupStage, deadline: number | null): PickupStatus {
  return {
    stage,
    deadline,
    remainingMs: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    progress: stage === 'collected' ? 1 : 0,
    hoursLate: 0,
    lateFee: 0,
  }
}

/** "23:14:07", zero padded, which is what a countdown has to read like. */
export function formatCountdown(status: PickupStatus): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(status.hours)}:${pad(status.minutes)}:${pad(status.seconds)}`
}

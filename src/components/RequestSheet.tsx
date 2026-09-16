import { Link } from 'react-router-dom'
import { PICKUP_WINDOW_HOURS } from '../lib/pickup'
import { daysBetween, formatShortDate, formatUSD } from '../lib/pricing'
import { ConfirmBanner } from './ConfirmBanner'
import { IconCheck } from './Icons'
import { PickupCountdown } from './PickupCountdown'
import { Sheet } from './Sheet'
import type { Trip } from '../types'

export interface RequestSheetProps {
  open: boolean
  onClose: () => void
  hostName: string
  listingLabel: string
  startDate: string
  endDate: string
  total: number
  /** The stored trip, once there is one. Drives the pick-up clock. */
  trip?: Trip | null
  /** Starts the 24 hour clock. */
  onConfirmPickup?: () => void
}

export function RequestSheet({
  open,
  onClose,
  hostName,
  listingLabel,
  startDate,
  endDate,
  total,
  trip = null,
  onConfirmPickup,
}: RequestSheetProps): JSX.Element {
  const days = daysBetween(startDate, endDate)
  const awaitingPickup = trip !== null && trip.pickupConfirmedAt === null

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Request sent"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button type="button" className="btn-ink sm:flex-1" onClick={onClose}>
            Done
          </button>
          <Link to="/account?tab=trips" className="btn-ghost sm:flex-1" onClick={onClose}>
            Go to Trips
          </Link>
        </div>
      }
    >
      <div data-testid="request-confirmation" className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-coral-tint text-coral-text">
          <IconCheck className="h-8 w-8" />
        </span>

        <h3 className="mt-4 font-display text-xl font-extrabold text-ink">
          Request sent to {hostName}
        </h3>
        <p className="mt-1 text-sm text-ink-muted">(preview - no real booking)</p>

        <dl className="card-flat mt-5 divide-y divide-line text-left">
          <div className="flex items-baseline justify-between gap-3 px-4 py-3">
            <dt className="label-micro">Vehicle</dt>
            <dd className="text-sm font-semibold text-ink">{listingLabel}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 px-4 py-3">
            <dt className="label-micro">Dates</dt>
            <dd className="num text-sm font-semibold text-ink">
              {formatShortDate(startDate)} to {formatShortDate(endDate)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 px-4 py-3">
            <dt className="label-micro">Length</dt>
            <dd className="num text-sm font-semibold text-ink">
              {days} {days === 1 ? 'day' : 'days'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 px-4 py-3">
            <dt className="label-micro">Pick up at</dt>
            <dd className="text-sm font-semibold text-ink">{trip ? trip.pickupCity : '-'}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 px-4 py-3">
            <dt className="label-micro">Total</dt>
            <dd className="num font-display text-lg font-extrabold text-ink">
              {formatUSD(total)}
            </dd>
          </div>
        </dl>

        {/* The location has to be agreed before the clock can start, so the
            question is asked here rather than assumed from the listing. */}
        {trip ? (
          <div className="mt-5 text-left">
            {awaitingPickup ? (
              <ConfirmBanner
                open
                id="pickup-confirm"
                question="Are you sure you want to confirm this location?"
                detail={`Picking up in ${trip.pickupCity}. Confirming starts your ${PICKUP_WINDOW_HOURS} hour pick-up window.`}
                confirmLabel="Yes, confirm"
                cancelLabel="Not yet"
                onConfirm={() => onConfirmPickup?.()}
                onCancel={onClose}
              />
            ) : (
              <div className="card-flat px-4 py-4">
                <PickupCountdown trip={trip} />
              </div>
            )}
          </div>
        ) : null}

        <p className="mt-4 text-sm text-ink-muted">You can find this under Account, in Trips.</p>
      </div>
    </Sheet>
  )
}

export default RequestSheet

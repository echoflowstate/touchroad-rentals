import { useCallback, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Calculator } from '../components/Calculator'
import { EmptyState } from '../components/EmptyState'
import {
  IconChevronLeft,
  IconFuel,
  IconGear,
  IconPin,
  IconSeat,
} from '../components/Icons'
import { RequestSheet } from '../components/RequestSheet'
import { VehicleSilhouette } from '../components/VehicleSilhouette'
import { defaultFilters } from '../lib/filters'
import { computeQuote } from '../lib/pricing'
import { useAppData } from '../state/AppState'
import { listingTitle, type Listing } from '../types'

interface DateRange {
  start: string
  end: string
}

interface Confirmation {
  startDate: string
  endDate: string
  total: number
}

const WHY_POINTS = [
  "You pay the host's rate.",
  'No counters, no upsells.',
  'Service fees stay at $0.',
]

function SpecTile({
  caption,
  value,
  icon,
}: {
  caption: string
  value: string
  icon?: JSX.Element
}) {
  return (
    <div className="card-flat px-3 py-3">
      <span className="label-micro flex items-center gap-1.5">
        {icon}
        {caption}
      </span>
      <p className="mt-1.5 font-display text-base font-bold leading-tight text-ink">{value}</p>
    </div>
  )
}

export function CarDetail(): JSX.Element {
  const { id } = useParams()
  const { getListing, isSignedIn, openSignIn, addTrip } = useAppData()
  const listing = id ? getListing(id) : undefined

  const [dates, setDates] = useState<DateRange>(() => {
    const filters = defaultFilters()
    return { start: filters.startDate, end: filters.endDate }
  })
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  // The sign-in sheet can complete long after this render, so the request
  // callback reads the latest listing and dates out of refs.
  const listingRef = useRef<Listing | undefined>(listing)
  listingRef.current = listing
  const datesRef = useRef<DateRange>(dates)
  datesRef.current = dates

  const submitRequest = useCallback(() => {
    const current = listingRef.current
    if (!current) return
    const { start, end } = datesRef.current
    const quote = computeQuote(current.pricePerDay, start, end)
    addTrip({
      listingId: current.id,
      listingTitle: listingTitle(current),
      hostName: current.hostName,
      city: current.city,
      startDate: start,
      endDate: end,
      days: quote.days,
      rate: current.pricePerDay,
      subtotal: quote.subtotal,
      total: quote.total,
    })
    setConfirmation({ startDate: start, endDate: end, total: quote.total })
  }, [addTrip])

  const handleRequest = useCallback(() => {
    if (!isSignedIn) {
      openSignIn(() => submitRequest())
      return
    }
    submitRequest()
  }, [isSignedIn, openSignIn, submitRequest])

  if (!listing) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <EmptyState
          title="That listing is not here."
          body="The link points to a car that is not in this preview. It may have been removed from this browser, or it never existed in the sample fleet."
          action={
            <Link to="/" className="btn-primary">
              Back to browse
            </Link>
          }
        />
      </div>
    )
  }

  const isUserListing = listing.source === 'user'
  const quote = computeQuote(listing.pricePerDay, dates.start, dates.end)
  const title = listingTitle(listing)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
      <Link
        to="/"
        className="focusable -ml-1 inline-flex min-h-[44px] items-center gap-1 rounded-lg pr-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <IconChevronLeft className="h-5 w-5" />
        Back to browse
      </Link>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-10">
        <div className="min-w-0">
          <VehicleSilhouette vehicleClass={listing.vehicleClass} variant="hero" />

          <div className="mt-5">
            {isUserListing ? (
              <span data-testid="your-badge" className="badge-yours">
                Your listing
              </span>
            ) : (
              <span data-testid="sample-badge" className="badge-sample">
                Sample listing
              </span>
            )}

            <h1 className="mt-2.5 break-words font-display text-3xl font-extrabold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">
              {title}
            </h1>

            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
              <IconPin className="h-4 w-4 text-ink-faint" />
              {listing.city}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SpecTile caption="Class" value={listing.vehicleClass} />
            <SpecTile
              caption="Seats"
              value={`${listing.seats}`}
              icon={<IconSeat className="h-3.5 w-3.5" />}
            />
            <SpecTile
              caption="Transmission"
              value={listing.transmission}
              icon={<IconGear className="h-3.5 w-3.5" />}
            />
            <SpecTile
              caption="Fuel"
              value={listing.fuel}
              icon={<IconFuel className="h-3.5 w-3.5" />}
            />
          </div>

          <p className="mt-5 text-sm font-semibold text-ink">
            {isUserListing
              ? `Listed by ${listing.hostName} - your listing`
              : `Listed by ${listing.hostName} - sample host`}
          </p>

          <p className="mt-3 max-w-prose break-words text-[15px] leading-relaxed text-ink-muted">
            {listing.blurb}
          </p>
        </div>

        <div className="min-w-0 lg:sticky lg:top-24">
          <Calculator
            listing={listing}
            startDate={dates.start}
            endDate={dates.end}
            onDatesChange={(start, end) => setDates({ start, end })}
          />

          <button
            type="button"
            data-testid="request-button"
            className="btn-primary mt-4 w-full"
            onClick={handleRequest}
          >
            Request this car
          </button>

          <p className="label-micro mt-2.5 text-center">
            Requests in this preview are stored in your browser only.
          </p>

          <div className="mt-6 rounded-2xl border border-line bg-white/60 px-4 py-4">
            <h2 className="label-micro">Why it costs this</h2>
            <ul className="mt-2.5 space-y-1.5">
              {WHY_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-ink-muted">
                  <span
                    aria-hidden="true"
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald"
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <RequestSheet
        open={confirmation !== null}
        onClose={() => setConfirmation(null)}
        hostName={listing.hostName}
        listingLabel={title}
        startDate={confirmation ? confirmation.startDate : dates.start}
        endDate={confirmation ? confirmation.endDate : dates.end}
        total={confirmation ? confirmation.total : quote.total}
      />
    </div>
  )
}

export default CarDetail

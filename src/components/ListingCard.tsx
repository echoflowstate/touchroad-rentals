import { Link } from 'react-router-dom'
import { listingTitle } from '../types'
import type { Listing } from '../types'
import { IconChevronRight, IconPin } from './Icons'
import { VehicleSilhouette } from './VehicleSilhouette'

export function ListingCard({ listing }: { listing: Listing }): JSX.Element {
  const title = listingTitle(listing)
  const isSample = listing.source === 'sample'

  return (
    <Link
      to={`/car/${listing.id}`}
      data-testid="listing-card"
      data-listing-id={listing.id}
      data-price={listing.pricePerDay}
      data-listing-class={listing.vehicleClass}
      aria-label={`${title} in ${listing.city}, $${listing.pricePerDay} per day`}
      className="card focusable group block overflow-hidden"
    >
      <VehicleSilhouette vehicleClass={listing.vehicleClass} className="!rounded-none" />

      <div className="flex flex-col gap-2 p-4">
        <div>
          {isSample ? (
            <span data-testid="sample-badge" className="badge-sample">
              Sample listing
            </span>
          ) : (
            <span data-testid="your-badge" className="badge-yours">
              Your listing
            </span>
          )}
        </div>

        <h3 className="font-display text-[17px] font-semibold leading-snug text-ink">{title}</h3>

        <p className="flex items-center gap-1.5 text-sm text-ink-muted">
          <IconPin className="h-4 w-4 shrink-0 text-ink-faint" />
          <span className="truncate">{listing.city}</span>
        </p>

        <p className="label-micro">
          {listing.seats} seats · {listing.transmission}
        </p>

        <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
          <span className="flex items-baseline gap-1">
            <span className="num font-display text-2xl font-bold leading-none text-ink">
              ${listing.pricePerDay}
            </span>
            <span className="text-xs font-medium text-ink-faint">/day</span>
          </span>
          <IconChevronRight className="h-5 w-5 shrink-0 text-brand transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}

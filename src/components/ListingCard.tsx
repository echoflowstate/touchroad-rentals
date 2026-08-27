import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from '../lib/motion'
import { listingTitle } from '../types'
import type { Listing } from '../types'
import { IconChevronRight, IconPin } from './Icons'
import { VehicleSilhouette } from './VehicleSilhouette'

/**
 * E3: cards cascade in on a fresh set of results, lift and tilt a couple of
 * degrees toward the pointer on hover, and pop their price chip. The tilt is
 * capped low so the card still reads as a card, and it is pointer-only: on a
 * touch screen nothing should shift under a finger that is already down.
 */
export function ListingCard({
  listing,
  index = 0,
}: {
  listing: Listing
  index?: number
}): JSX.Element {
  const title = listingTitle(listing)
  const isSample = listing.source === 'sample'
  // E7: a car published moments ago drops into the grid rather than fading in
  // with the rest, so the wizard's result is visibly the thing that arrived.
  const justPublished = !isSample && Date.now() - listing.createdAt < 15_000
  const reduced = useReducedMotion()
  const ref = useRef<HTMLAnchorElement | null>(null)
  const [tilt, setTilt] = useState<{ x: number; y: number } | null>(null)

  function onPointerMove(event: React.PointerEvent<HTMLAnchorElement>) {
    if (reduced || event.pointerType !== 'mouse') return
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    // 3 degrees at the corners, and no more.
    setTilt({ x: -py * 3, y: px * 3 })
  }

  const style: React.CSSProperties = {}
  if (!reduced) {
    style.animationDelay = `${Math.min(index, 11) * 55}ms`
    if (tilt) {
      style.transform = `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px)`
    }
  }

  return (
    <Link
      ref={ref}
      to={`/car/${listing.id}`}
      data-testid="listing-card"
      data-listing-id={listing.id}
      data-price={listing.pricePerDay}
      data-listing-class={listing.vehicleClass}
      aria-label={`${title} in ${listing.city}, $${listing.pricePerDay} per day`}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setTilt(null)}
      style={style}
      className={`card card-lift focusable group block overflow-hidden will-change-transform ${
        reduced ? '' : justPublished ? 'animate-drop-in' : 'animate-card-rise'
      }`}
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

        <h3 className="font-display text-[18px] font-bold leading-snug tracking-[-0.01em] text-ink">
          {title}
        </h3>

        <p className="flex items-center gap-1.5 text-sm text-ink-muted">
          <IconPin className="h-4 w-4 shrink-0 text-emerald" />
          <span className="truncate">{listing.city}</span>
        </p>

        <p className="label-micro">
          {listing.seats} seats · {listing.transmission}
        </p>

        <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-3">
          <span
            className={`inline-flex items-baseline gap-1 rounded-full bg-sand px-3 py-1.5 transition-all duration-200 ease-spring ${
              reduced ? '' : 'group-hover:scale-[1.06] group-hover:bg-emerald-tint'
            }`}
          >
            <span className="num text-2xl font-extrabold leading-none text-ink">
              ${listing.pricePerDay}
            </span>
            <span className="text-xs font-semibold text-ink-muted">/day</span>
          </span>
          <IconChevronRight className="h-5 w-5 shrink-0 text-emerald transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}

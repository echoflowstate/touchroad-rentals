import type { Filters, Listing } from '../types'
import { addDays, todayISO } from './pricing'

export function defaultFilters(): Filters {
  const start = todayISO()
  return {
    city: 'all',
    startDate: start,
    endDate: addDays(start, 3),
    price: 'any',
    vehicleClass: 'all',
    seatsFivePlus: false,
    automaticOnly: false,
    sort: 'price-asc',
  }
}

export function priceCeiling(price: Filters['price']): number {
  if (price === 'under30') return 30
  if (price === 'under45') return 45
  return Number.POSITIVE_INFINITY
}

export function matchesFilters(listing: Listing, filters: Filters): boolean {
  if (filters.city !== 'all' && listing.city !== filters.city) return false
  if (listing.pricePerDay >= priceCeiling(filters.price)) return false
  if (filters.vehicleClass !== 'all' && listing.vehicleClass !== filters.vehicleClass) return false
  if (filters.seatsFivePlus && listing.seats < 5) return false
  if (filters.automaticOnly && listing.transmission !== 'Automatic') return false
  return true
}

/**
 * Sorting is total and deterministic: ties fall back to id so the same query
 * always renders the same order, which is what the assertions lean on.
 */
export function sortListings(listings: Listing[], sort: Filters['sort']): Listing[] {
  const copy = [...listings]
  copy.sort((a, b) => {
    if (sort === 'price-asc' && a.pricePerDay !== b.pricePerDay) {
      return a.pricePerDay - b.pricePerDay
    }
    if (sort === 'price-desc' && a.pricePerDay !== b.pricePerDay) {
      return b.pricePerDay - a.pricePerDay
    }
    if (sort === 'newest' && a.createdAt !== b.createdAt) {
      return b.createdAt - a.createdAt
    }
    return a.id.localeCompare(b.id)
  })
  return copy
}

export function applyFilters(listings: Listing[], filters: Filters): Listing[] {
  return sortListings(
    listings.filter((listing) => matchesFilters(listing, filters)),
    filters.sort,
  )
}

/** True when only the price chip is standing between the renter and a result. */
export function wouldMatchWithoutPrice(listings: Listing[], filters: Filters): boolean {
  return listings.some((listing) => matchesFilters(listing, { ...filters, price: 'any' }))
}

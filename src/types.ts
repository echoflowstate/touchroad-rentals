import type { City } from './site.config'

export type { City }

/** Filter chips and silhouettes are keyed off this exact union. */
export const VEHICLE_CLASSES = [
  'Car',
  'SUV',
  'Truck',
  'Van',
  'Convertible',
  'Golf cart',
] as const

export type VehicleClass = (typeof VEHICLE_CLASSES)[number]

export type Transmission = 'Automatic' | 'Manual'
export type Fuel = 'Gas' | 'Hybrid' | 'Electric'

/** Sample listings ship in the code; user listings live in localStorage. */
export type ListingSource = 'sample' | 'user'

export interface Listing {
  id: string
  year: number
  make: string
  model: string
  vehicleClass: VehicleClass
  seats: number
  transmission: Transmission
  fuel: Fuel
  city: City
  pricePerDay: number
  /** One honest line. No claims, no superlatives. */
  blurb: string
  hostName: string
  source: ListingSource
  createdAt: number
}

export interface Session {
  name: string
  signedInAt: number
}

export interface Trip {
  id: string
  listingId: string
  listingTitle: string
  hostName: string
  city: City
  startDate: string
  endDate: string
  days: number
  rate: number
  subtotal: number
  total: number
  createdAt: number
}

/** Draft shape produced by the listing wizard before it becomes a Listing. */
export interface ListingDraft {
  year: string
  make: string
  model: string
  vehicleClass: VehicleClass
  seats: number
  transmission: Transmission
  fuel: Fuel
  city: City
  pricePerDay: string
  blurb: string
}

export type PriceFilter = 'any' | 'under30' | 'under45'
export type SortKey = 'price-asc' | 'price-desc' | 'newest'

export interface Filters {
  city: City | 'all'
  startDate: string
  endDate: string
  price: PriceFilter
  vehicleClass: VehicleClass | 'all'
  seatsFivePlus: boolean
  automaticOnly: boolean
  sort: SortKey
}

/** Convenience: "2019 Toyota Corolla". */
export function listingTitle(listing: Pick<Listing, 'year' | 'make' | 'model'>): string {
  return `${listing.year} ${listing.make} ${listing.model}`
}

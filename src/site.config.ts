/**
 * Single source of truth for every brand-level string in the preview.
 * Every render reads from here - nothing hard-codes the brand name.
 */

export const CITIES = [
  'Pensacola',
  'Gulf Breeze',
  'Niceville',
  'Crestview',
  'Mary Esther',
  'Fort Walton',
  'Shalimar',
  'Valparaiso',
  'Destin',
  'Freeport',
  'Sandestin',
  'Santa Rosa',
  'Panama City',
] as const

export type City = (typeof CITIES)[number]

/**
 * Nearest-neighbor hints, used by empty states to suggest somewhere close by.
 */
export const NEARBY_CITY: Record<City, City> = {
  Pensacola: 'Gulf Breeze',
  'Gulf Breeze': 'Pensacola',
  Niceville: 'Valparaiso',
  Crestview: 'Niceville',
  'Mary Esther': 'Fort Walton',
  'Fort Walton': 'Mary Esther',
  Shalimar: 'Fort Walton',
  Valparaiso: 'Niceville',
  Destin: 'Fort Walton',
  Freeport: 'Santa Rosa',
  Sandestin: 'Destin',
  'Santa Rosa': 'Freeport',
  'Panama City': 'Santa Rosa',
}

export const siteConfig = {
  brandName: 'Touch Road Rentals',
  shortName: 'Touch Road',
  region: 'Emerald Coast',
  regionLong: 'the Emerald Coast, Florida',

  headline: 'Rent for less on the Emerald Coast.',
  priceLine: 'The price you see is the price you drive.',
  neighborLine: 'Rent from your neighbors, not a counter.',
  comingSoon: 'Coming soon to the App Store and Google Play',
  previewRibbon: 'Preview build - sample listings for demonstration.',

  metaTitle: 'Touch Road Rentals - rent for less on the Emerald Coast. Preview.',
  metaDescription:
    'Touch Road Rentals is a preview of a peer-to-peer car rental app for the Emerald Coast. Browse sample listings, price a trip with no booking fees, and try the listing flow.',

  /** Flip to true to emit <meta name="robots" content="noindex"> at runtime. */
  noindex: false,

  cities: CITIES,

  storageKeys: {
    listings: 'touchroad.listings.v1',
    session: 'touchroad.session.v1',
    trips: 'touchroad.trips.v1',
  },

  /** Artificial latency on search so the preview feels like a live app. */
  searchDelayMs: 420,
} as const

export type SiteConfig = typeof siteConfig

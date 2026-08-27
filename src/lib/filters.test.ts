import { SAMPLE_FLEET } from '../data/fleet'
import type { Filters } from '../types'
import {
  applyFilters,
  defaultFilters,
  matchesFilters,
  priceCeiling,
  sortListings,
  wouldMatchWithoutPrice,
} from './filters'

/** Ids read straight out of the seeded fleet, so the assertions name real records. */
const ESCAPE_38 = 'sample-escape-destin'
const SENTRA_25 = 'sample-sentra-crestview'
const CLUBCAR_20 = 'sample-clubcar-maryesther'
const EZGO_25 = 'sample-ezgo-shalimar'
const ELANTRA_MANUAL = 'sample-elantra-panamacity'
const MUSTANG_55 = 'sample-mustang-sandestin'

function withFilters(patch: Partial<Filters>): Filters {
  return { ...defaultFilters(), ...patch }
}

function idsOf(listings: Array<{ id: string }>): string[] {
  return listings.map((listing) => listing.id)
}

function pricesOf(listings: Array<{ pricePerDay: number }>): number[] {
  return listings.map((listing) => listing.pricePerDay)
}

describe('the seeded fleet', () => {
  it('ships twelve sample listings', () => {
    expect(SAMPLE_FLEET).toHaveLength(12)
  })

  it('gives every listing a unique id', () => {
    expect(new Set(idsOf(SAMPLE_FLEET)).size).toBe(12)
  })
})

describe('price filtering', () => {
  it('reads the ceilings the chips promise', () => {
    expect(priceCeiling('under30')).toBe(30)
    expect(priceCeiling('under45')).toBe(45)
    expect(priceCeiling('any')).toBe(Number.POSITIVE_INFINITY)
  })

  it('under $30 drops every listing at $30 or more', () => {
    const results = applyFilters(SAMPLE_FLEET, withFilters({ price: 'under30' }))
    expect(results.length).toBeGreaterThan(0)
    for (const listing of results) {
      expect(listing.pricePerDay).toBeLessThan(30)
    }
  })

  it('under $30 excludes the $38 Ford Escape and keeps the $25 Nissan Sentra', () => {
    const ids = idsOf(applyFilters(SAMPLE_FLEET, withFilters({ price: 'under30' })))
    expect(ids).not.toContain(ESCAPE_38)
    expect(ids).toContain(SENTRA_25)
    expect(ids).toContain(CLUBCAR_20)
    expect(ids.sort()).toEqual(
      [
        CLUBCAR_20,
        SENTRA_25,
        EZGO_25,
        'sample-corolla-pensacola',
        'sample-civic-fortwalton',
      ].sort(),
    )
  })

  it('knows when only the price chip is standing in the way', () => {
    const destinUnder30 = withFilters({ city: 'Destin', price: 'under30' })
    expect(applyFilters(SAMPLE_FLEET, destinUnder30)).toHaveLength(0)
    expect(wouldMatchWithoutPrice(SAMPLE_FLEET, destinUnder30)).toBe(true)
  })
})

describe('class filtering', () => {
  it('isolates exactly the two golf carts and nothing else', () => {
    const results = applyFilters(SAMPLE_FLEET, withFilters({ vehicleClass: 'Golf cart' }))
    expect(results).toHaveLength(2)
    expect(idsOf(results).sort()).toEqual([CLUBCAR_20, EZGO_25].sort())
    for (const listing of results) {
      expect(listing.vehicleClass).toBe('Golf cart')
    }
  })
})

describe('sorting', () => {
  it('defaults to price low to high', () => {
    expect(defaultFilters().sort).toBe('price-asc')
  })

  it('renders the whole default result set in non decreasing price order', () => {
    const prices = pricesOf(applyFilters(SAMPLE_FLEET, defaultFilters()))
    expect(prices).toHaveLength(12)
    for (let index = 1; index < prices.length; index += 1) {
      expect(prices[index]).toBeGreaterThanOrEqual(prices[index - 1])
    }
  })

  it('opens with the two cheapest cars in the fleet', () => {
    const cheapest = pricesOf(SAMPLE_FLEET)
      .slice()
      .sort((a, b) => a - b)
      .slice(0, 2)
    expect(cheapest).toEqual([20, 25])
    expect(pricesOf(applyFilters(SAMPLE_FLEET, defaultFilters())).slice(0, 2)).toEqual(cheapest)
  })

  it('flips the extremes on price high to low', () => {
    const results = applyFilters(SAMPLE_FLEET, withFilters({ sort: 'price-desc' }))
    expect(results[0].id).toBe(MUSTANG_55)
    expect(results[0].pricePerDay).toBe(55)
    expect(results[results.length - 1].pricePerDay).toBe(20)
  })

  it('puts the highest createdAt first on newest', () => {
    const results = sortListings(SAMPLE_FLEET, 'newest')
    const newest = SAMPLE_FLEET.reduce((best, listing) =>
      listing.createdAt > best.createdAt ? listing : best,
    )
    expect(results[0].id).toBe(newest.id)
    expect(results[0].id).toBe(EZGO_25)
    for (let index = 1; index < results.length; index += 1) {
      expect(results[index].createdAt).toBeLessThan(results[index - 1].createdAt)
    }
  })
})

describe('the remaining chips', () => {
  it('seats 5+ drops the four seat vehicles', () => {
    const results = applyFilters(SAMPLE_FLEET, withFilters({ seatsFivePlus: true }))
    expect(results).toHaveLength(9)
    for (const listing of results) {
      expect(listing.seats).toBeGreaterThanOrEqual(5)
    }
    const ids = idsOf(results)
    expect(ids).not.toContain(MUSTANG_55)
    expect(ids).not.toContain(CLUBCAR_20)
    expect(ids).not.toContain(EZGO_25)
  })

  it('automatic only drops the manual Elantra', () => {
    const results = applyFilters(SAMPLE_FLEET, withFilters({ automaticOnly: true }))
    expect(results).toHaveLength(11)
    expect(idsOf(results)).not.toContain(ELANTRA_MANUAL)
    for (const listing of results) {
      expect(listing.transmission).toBe('Automatic')
    }
  })

  it('a city narrows the board to that city alone', () => {
    const results = applyFilters(SAMPLE_FLEET, withFilters({ city: 'Destin' }))
    expect(idsOf(results)).toEqual([ESCAPE_38])
    for (const listing of results) {
      expect(listing.city).toBe('Destin')
    }

    const pensacola = applyFilters(SAMPLE_FLEET, withFilters({ city: 'Pensacola' }))
    expect(idsOf(pensacola)).toEqual(['sample-corolla-pensacola'])
  })

  it('matches a single listing against the same rules', () => {
    const escape = SAMPLE_FLEET.find((listing) => listing.id === ESCAPE_38)
    expect(escape).toBeDefined()
    if (!escape) return
    expect(matchesFilters(escape, withFilters({ city: 'Destin' }))).toBe(true)
    expect(matchesFilters(escape, withFilters({ city: 'Destin', price: 'under30' }))).toBe(false)
    expect(matchesFilters(escape, withFilters({ vehicleClass: 'Golf cart' }))).toBe(false)
  })
})

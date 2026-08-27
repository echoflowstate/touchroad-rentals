import { SAMPLE_FLEET } from '../data/fleet'
import {
  addDays,
  computeQuote,
  daysBetween,
  estimateMonthly,
  fleetAverageForClass,
  formatUSD,
  parseISODate,
  toISODate,
  todayISO,
} from './pricing'

const TODAY = todayISO()

describe('daysBetween', () => {
  it('counts three days from today to today plus three', () => {
    expect(daysBetween(TODAY, addDays(TODAY, 3))).toBe(3)
  })

  it('counts a same day pick up and drop off as one day', () => {
    expect(daysBetween(TODAY, TODAY)).toBe(1)
  })

  it('floors a reversed range at one day', () => {
    expect(daysBetween(addDays(TODAY, 3), TODAY)).toBe(1)
  })
})

describe('computeQuote', () => {
  it('prices the $29 car over three days at $87 with no fees', () => {
    expect(computeQuote(29, TODAY, addDays(TODAY, 3))).toEqual({
      days: 3,
      rate: 29,
      subtotal: 87,
      fees: 0,
      total: 87,
    })
  })

  it('prices the $25 car over three days at $75 with no fees', () => {
    const quote = computeQuote(25, TODAY, addDays(TODAY, 3))
    expect(quote.days).toBe(3)
    expect(quote.subtotal).toBe(75)
    expect(quote.fees).toBe(0)
    expect(quote.total).toBe(75)
  })

  it('prices the $55 car over four days at $220 with no fees', () => {
    const quote = computeQuote(55, TODAY, addDays(TODAY, 4))
    expect(quote.days).toBe(4)
    expect(quote.subtotal).toBe(220)
    expect(quote.fees).toBe(0)
    expect(quote.total).toBe(220)
  })

  it('never adds a fee, at any rate or length', () => {
    for (const rate of [20, 25, 27, 29, 32, 34, 38, 40, 45, 55]) {
      for (const days of [1, 2, 3, 5, 9]) {
        const quote = computeQuote(rate, TODAY, addDays(TODAY, days))
        expect(quote.fees).toBe(0)
        expect(quote.total).toBe(quote.subtotal)
        expect(quote.total).toBe(rate * days)
      }
    }
  })
})

describe('formatUSD', () => {
  it('formats whole dollars without cents', () => {
    expect(formatUSD(87)).toBe('$87')
    expect(formatUSD(0)).toBe('$0')
    expect(formatUSD(1234)).toBe('$1,234')
  })
})

describe('estimateMonthly', () => {
  it('multiplies the rate by the days rented', () => {
    expect(estimateMonthly(42, 8)).toBe(336)
  })

  it('uses the sample SUV average for the host teaser number', () => {
    const average = fleetAverageForClass(SAMPLE_FLEET, 'SUV')
    expect(estimateMonthly(average, 8)).toBe(336)
  })
})

describe('fleetAverageForClass', () => {
  it('rounds the two sample SUVs, $38 and $45, to $42', () => {
    const suvs = SAMPLE_FLEET.filter((listing) => listing.vehicleClass === 'SUV')
    expect(suvs.map((listing) => listing.pricePerDay).sort((a, b) => a - b)).toEqual([38, 45])
    expect(fleetAverageForClass(SAMPLE_FLEET, 'SUV')).toBe(42)
  })

  it('averages the other classes from the same seeded data', () => {
    expect(fleetAverageForClass(SAMPLE_FLEET, 'Car')).toBe(29)
    expect(fleetAverageForClass(SAMPLE_FLEET, 'Golf cart')).toBe(23)
    expect(fleetAverageForClass(SAMPLE_FLEET, 'Truck')).toBe(45)
  })
})

describe('addDays and toISODate', () => {
  it('round trips a date string through a Date and back', () => {
    const base = '2026-03-01'
    const parsed = parseISODate(base)
    expect(parsed).not.toBeNull()
    if (parsed) expect(toISODate(parsed)).toBe(base)
  })

  it('walks forward and back to the same day', () => {
    const base = '2026-03-01'
    expect(addDays(base, 1)).toBe('2026-03-02')
    expect(addDays(addDays(base, 10), -10)).toBe(base)
  })

  it('crosses a month boundary correctly', () => {
    expect(addDays('2026-02-27', 3)).toBe('2026-03-02')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('emits todayISO in the shape a date input accepts', () => {
    expect(TODAY).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

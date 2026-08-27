import type { Listing, VehicleClass } from '../types'

/** Local calendar date as YYYY-MM-DD, safe for <input type="date">. */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

/** Parses YYYY-MM-DD as a local date, avoiding the UTC shift of new Date(str). */
export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return Number.isNaN(date.getTime()) ? null : date
}

export function addDays(value: string, amount: number): string {
  const date = parseISODate(value)
  if (!date) return value
  date.setDate(date.getDate() + amount)
  return toISODate(date)
}

/**
 * Whole days between two dates, floored at one. A pickup and a drop-off on the
 * same day is still a day of rental.
 */
export function daysBetween(start: string, end: string): number {
  const a = parseISODate(start)
  const b = parseISODate(end)
  if (!a || !b) return 1
  const ms = b.getTime() - a.getTime()
  const days = Math.round(ms / 86_400_000)
  return days < 1 ? 1 : days
}

export interface Quote {
  days: number
  rate: number
  subtotal: number
  /** Always zero. That is the whole point of the line item. */
  fees: number
  total: number
}

export function computeQuote(rate: number, start: string, end: string): Quote {
  const days = daysBetween(start, end)
  const safeRate = Number.isFinite(rate) && rate > 0 ? Math.round(rate) : 0
  const subtotal = safeRate * days
  return { days, rate: safeRate, subtotal, fees: 0, total: subtotal }
}

/** "$87" for whole dollars, "$87.50" only when cents actually exist. */
export function formatUSD(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0
  const hasCents = Math.round(safe * 100) % 100 !== 0
  return safe.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  })
}

/** Average nightly rate across a class, rounded. Drives the wizard nudge. */
export function fleetAverageForClass(listings: Listing[], vehicleClass: VehicleClass): number {
  const inClass = listings.filter((l) => l.vehicleClass === vehicleClass)
  if (inClass.length === 0) return 0
  const total = inClass.reduce((sum, l) => sum + l.pricePerDay, 0)
  return Math.round(total / inClass.length)
}

/** Earnings teaser: rate times days rented in a month, nothing withheld. */
export function estimateMonthly(rate: number, daysPerMonth: number): number {
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 0
  const safeDays = Number.isFinite(daysPerMonth) && daysPerMonth > 0 ? daysPerMonth : 0
  return Math.round(safeRate * safeDays)
}

/** "Aug 27" - short, unambiguous, American order. */
export function formatShortDate(value: string): string {
  const date = parseISODate(value)
  if (!date) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

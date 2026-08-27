import { CITIES, siteConfig } from '../site.config'
import { VEHICLE_CLASSES } from '../types'
import type { Listing, Session, Trip } from '../types'

/**
 * Everything the preview remembers lives in this browser and nowhere else.
 * Every read is defensive: a cleared or corrupted key must render first-run
 * state, never a crash.
 */

const { listings: LISTINGS_KEY, session: SESSION_KEY, trips: TRIPS_KEY } = siteConfig.storageKeys

function available(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

function readJSON<T>(key: string, fallback: T): T {
  if (!available()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as T
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown): void {
  if (!available()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* Quota or private mode. The session simply does not persist. */
  }
}

function removeKey(key: string): void {
  if (!available()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* no-op */
  }
}

const TRANSMISSIONS = ['Automatic', 'Manual']
const FUELS = ['Gas', 'Hybrid', 'Electric']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Checks every field the interface actually renders, not just the ones that
 * happen to be convenient. A record that reaches a component missing its
 * vehicle class takes the whole page down with it, so a partial or outdated
 * row is dropped here instead.
 */
function isListing(value: unknown): value is Listing {
  if (!value || typeof value !== 'object') return false
  const l = value as Partial<Listing>
  return (
    isText(l.id) &&
    isNumber(l.year) &&
    isText(l.make) &&
    isText(l.model) &&
    isNumber(l.pricePerDay) &&
    isNumber(l.seats) &&
    isText(l.hostName) &&
    typeof l.blurb === 'string' &&
    (CITIES as readonly string[]).includes(l.city as string) &&
    (VEHICLE_CLASSES as readonly string[]).includes(l.vehicleClass as string) &&
    TRANSMISSIONS.includes(l.transmission as string) &&
    FUELS.includes(l.fuel as string)
  )
}

/** Same reasoning as isListing: a trip row is only kept if it can render. */
function isTrip(value: unknown): value is Trip {
  if (!value || typeof value !== 'object') return false
  const t = value as Partial<Trip>
  return (
    isText(t.id) &&
    isText(t.listingId) &&
    isText(t.listingTitle) &&
    isText(t.hostName) &&
    (CITIES as readonly string[]).includes(t.city as string) &&
    isText(t.startDate) &&
    ISO_DATE.test(t.startDate as string) &&
    isText(t.endDate) &&
    ISO_DATE.test(t.endDate as string) &&
    isNumber(t.days) &&
    isNumber(t.rate) &&
    isNumber(t.subtotal) &&
    isNumber(t.total) &&
    isNumber(t.createdAt)
  )
}

export function loadUserListings(): Listing[] {
  const raw = readJSON<unknown[]>(LISTINGS_KEY, [])
  if (!Array.isArray(raw)) return []
  return raw.filter(isListing).map((l) => ({ ...l, source: 'user' as const }))
}

export function saveUserListings(listings: Listing[]): void {
  writeJSON(LISTINGS_KEY, listings)
}

export function loadSession(): Session | null {
  const raw = readJSON<Session | null>(SESSION_KEY, null)
  if (!raw || typeof raw.name !== 'string' || raw.name.trim() === '') return null
  return { name: raw.name, signedInAt: typeof raw.signedInAt === 'number' ? raw.signedInAt : 0 }
}

export function saveSession(session: Session): void {
  writeJSON(SESSION_KEY, session)
}

export function clearSession(): void {
  removeKey(SESSION_KEY)
}

export function loadTrips(): Trip[] {
  const raw = readJSON<unknown[]>(TRIPS_KEY, [])
  if (!Array.isArray(raw)) return []
  return raw.filter(isTrip)
}

export function saveTrips(trips: Trip[]): void {
  writeJSON(TRIPS_KEY, trips)
}

/** Stable-enough id without pulling in a dependency. */
export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}-${random}`
}

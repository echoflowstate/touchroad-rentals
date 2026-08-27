import { siteConfig } from '../site.config'
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

function isListing(value: unknown): value is Listing {
  if (!value || typeof value !== 'object') return false
  const l = value as Partial<Listing>
  return (
    typeof l.id === 'string' &&
    typeof l.year === 'number' &&
    typeof l.make === 'string' &&
    typeof l.model === 'string' &&
    typeof l.pricePerDay === 'number' &&
    typeof l.city === 'string'
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
  return raw.filter((t): t is Trip => !!t && typeof (t as Trip).id === 'string')
}

export function saveTrips(trips: Trip[]): void {
  writeJSON(TRIPS_KEY, trips)
}

/** Stable-enough id without pulling in a dependency. */
export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}-${random}`
}

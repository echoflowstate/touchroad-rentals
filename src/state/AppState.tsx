import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { SAMPLE_FLEET } from '../data/fleet'
import {
  clearSession,
  createId,
  loadSession,
  loadTrips,
  loadUserListings,
  saveSession,
  saveTrips,
  saveUserListings,
} from '../lib/storage'
import type { Listing, Session, Trip } from '../types'

interface AppData {
  /** Sample fleet plus anything this browser has published, newest user first. */
  listings: Listing[]
  sampleListings: Listing[]
  userListings: Listing[]
  trips: Trip[]
  session: Session | null
  isSignedIn: boolean

  signIn: (name: string) => void
  signOut: () => void

  addListing: (listing: Omit<Listing, 'id' | 'source' | 'createdAt'>) => Listing
  updateListing: (id: string, patch: Partial<Omit<Listing, 'id' | 'source'>>) => void
  removeListing: (id: string) => void

  addTrip: (trip: Omit<Trip, 'id' | 'createdAt'>) => Trip
  getListing: (id: string) => Listing | undefined

  /** Sign-in sheet plumbing. The sheet itself is mounted once, by the provider. */
  signInOpen: boolean
  openSignIn: (onDone?: () => void) => void
  closeSignIn: () => void
}

const AppDataContext = createContext<AppData | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [userListings, setUserListings] = useState<Listing[]>(() => loadUserListings())
  const [trips, setTrips] = useState<Trip[]>(() => loadTrips())
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [signInOpen, setSignInOpen] = useState(false)
  const afterSignIn = useRef<(() => void) | null>(null)

  // Only reach for storage once there is something to store, so a browser with
  // cleared data stays cleared until the person actually publishes or requests.
  const listingsTouched = useRef(userListings.length > 0)
  const tripsTouched = useRef(trips.length > 0)

  useEffect(() => {
    if (!listingsTouched.current && userListings.length === 0) return
    listingsTouched.current = true
    saveUserListings(userListings)
  }, [userListings])

  useEffect(() => {
    if (!tripsTouched.current && trips.length === 0) return
    tripsTouched.current = true
    saveTrips(trips)
  }, [trips])

  const signIn = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const next: Session = { name: trimmed, signedInAt: Date.now() }
    setSession(next)
    saveSession(next)
    setSignInOpen(false)
    const done = afterSignIn.current
    afterSignIn.current = null
    if (done) done()
  }, [])

  const signOut = useCallback(() => {
    setSession(null)
    clearSession()
  }, [])

  const addListing = useCallback((input: Omit<Listing, 'id' | 'source' | 'createdAt'>) => {
    const listing: Listing = {
      ...input,
      id: createId('user'),
      source: 'user',
      createdAt: Date.now(),
    }
    setUserListings((prev) => [listing, ...prev])
    return listing
  }, [])

  const updateListing = useCallback(
    (id: string, patch: Partial<Omit<Listing, 'id' | 'source'>>) => {
      setUserListings((prev) =>
        prev.map((listing) => (listing.id === id ? { ...listing, ...patch } : listing)),
      )
    },
    [],
  )

  const removeListing = useCallback((id: string) => {
    setUserListings((prev) => prev.filter((listing) => listing.id !== id))
  }, [])

  const addTrip = useCallback((input: Omit<Trip, 'id' | 'createdAt'>) => {
    const trip: Trip = { ...input, id: createId('trip'), createdAt: Date.now() }
    setTrips((prev) => [trip, ...prev])
    return trip
  }, [])

  const openSignIn = useCallback((onDone?: () => void) => {
    afterSignIn.current = onDone ?? null
    setSignInOpen(true)
  }, [])

  const closeSignIn = useCallback(() => {
    afterSignIn.current = null
    setSignInOpen(false)
  }, [])

  const listings = useMemo(() => [...userListings, ...SAMPLE_FLEET], [userListings])

  const getListing = useCallback(
    (id: string) => listings.find((listing) => listing.id === id),
    [listings],
  )

  const value = useMemo<AppData>(
    () => ({
      listings,
      sampleListings: SAMPLE_FLEET,
      userListings,
      trips,
      session,
      isSignedIn: session !== null,
      signIn,
      signOut,
      addListing,
      updateListing,
      removeListing,
      addTrip,
      getListing,
      signInOpen,
      openSignIn,
      closeSignIn,
    }),
    [
      listings,
      userListings,
      trips,
      session,
      signIn,
      signOut,
      addListing,
      updateListing,
      removeListing,
      addTrip,
      getListing,
      signInOpen,
      openSignIn,
      closeSignIn,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppData {
  const context = useContext(AppDataContext)
  if (!context) throw new Error('useAppData must be used inside AppDataProvider')
  return context
}

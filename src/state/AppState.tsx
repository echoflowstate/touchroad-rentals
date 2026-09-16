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
import type { AccountRole, Listing, Session, Trip } from '../types'

export interface Toast {
  id: string
  message: string
  tone: 'emerald' | 'coral'
}

interface AppData {
  /** Sample fleet plus anything this browser has published, newest user first. */
  listings: Listing[]
  sampleListings: Listing[]
  userListings: Listing[]
  trips: Trip[]
  session: Session | null
  isSignedIn: boolean
  /** What the account is. A guest cannot be looking at the host side. */
  role: AccountRole
  /** Which side is on screen. Always 'guest' unless the account is a host. */
  mode: AccountRole
  isHost: boolean

  signIn: (name: string, role?: AccountRole) => void
  signOut: () => void
  /** Switches between the two sides. Ignored for a guest account. */
  setMode: (mode: AccountRole) => void
  /** Turns a guest account into a host one and lands them on the host side. */
  becomeHost: () => void

  addListing: (listing: Omit<Listing, 'id' | 'source' | 'createdAt'>) => Listing
  updateListing: (id: string, patch: Partial<Omit<Listing, 'id' | 'source'>>) => void
  removeListing: (id: string) => void

  addTrip: (trip: Omit<Trip, 'id' | 'createdAt'>) => Trip
  /** Confirms where the keys change hands, which starts the 24 hour clock. */
  confirmPickup: (tripId: string) => void
  /** Marks the car collected, which stops the clock. */
  markCollected: (tripId: string) => void
  getListing: (id: string) => Listing | undefined

  /** Short confirmations. The host is mounted once, by the shell. */
  toasts: Toast[]
  pushToast: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: string) => void

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
  const [toasts, setToasts] = useState<Toast[]>([])
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

  const signIn = useCallback((name: string, role: AccountRole = 'guest') => {
    const trimmed = name.trim()
    if (!trimmed) return
    // A new host lands on the host side; everyone else starts as a guest.
    const next: Session = {
      name: trimmed,
      signedInAt: Date.now(),
      role,
      mode: role === 'host' ? 'host' : 'guest',
    }
    setSession(next)
    saveSession(next)
    setSignInOpen(false)
    const done = afterSignIn.current
    afterSignIn.current = null
    if (done) done()
  }, [])

  const setMode = useCallback((mode: AccountRole) => {
    setSession((current) => {
      if (!current) return current
      // Only a host account has two sides to switch between.
      if (current.role !== 'host') return current
      if (current.mode === mode) return current
      const next: Session = { ...current, mode }
      saveSession(next)
      return next
    })
  }, [])

  const becomeHost = useCallback(() => {
    setSession((current) => {
      if (!current || current.role === 'host') return current
      const next: Session = { ...current, role: 'host', mode: 'host' }
      saveSession(next)
      return next
    })
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
    // Publishing a car is hosting. A guest account that does it becomes a host
    // rather than ending up with a listing it has no side of the product for.
    setSession((current) => {
      if (!current || current.role === 'host') return current
      const next: Session = { ...current, role: 'host', mode: 'host' }
      saveSession(next)
      return next
    })
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

  const confirmPickup = useCallback((tripId: string) => {
    setTrips((prev) =>
      prev.map((trip) =>
        // Confirming twice would restart the clock, so the first one wins.
        trip.id === tripId && trip.pickupConfirmedAt === null
          ? { ...trip, pickupConfirmedAt: Date.now() }
          : trip,
      ),
    )
  }, [])

  const markCollected = useCallback((tripId: string) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId && trip.pickedUpAt === null
          ? { ...trip, pickedUpAt: Date.now() }
          : trip,
      ),
    )
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (message: string, tone: Toast['tone'] = 'emerald') => {
      const id = createId('toast')
      // One at a time. A stack of confirmations is noise, not feedback.
      setToasts([{ id, message, tone }])
      window.setTimeout(() => dismissToast(id), 3200)
    },
    [dismissToast],
  )

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
      role: session?.role ?? 'guest',
      mode: session?.mode ?? 'guest',
      isHost: session?.role === 'host',
      signIn,
      signOut,
      setMode,
      becomeHost,
      addListing,
      updateListing,
      removeListing,
      addTrip,
      confirmPickup,
      markCollected,
      getListing,
      toasts,
      pushToast,
      dismissToast,
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
      setMode,
      becomeHost,
      addListing,
      updateListing,
      removeListing,
      addTrip,
      confirmPickup,
      markCollected,
      getListing,
      toasts,
      pushToast,
      dismissToast,
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

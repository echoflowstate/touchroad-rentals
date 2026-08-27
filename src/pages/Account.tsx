import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { IconCheck, IconPencil, IconPin, IconTrash } from '../components/Icons'
import { Sheet } from '../components/Sheet'
import { VehicleSilhouette } from '../components/VehicleSilhouette'
import { formatShortDate, formatUSD } from '../lib/pricing'
import { siteConfig } from '../site.config'
import { useAppData } from '../state/AppState'
import { listingTitle, type City, type Listing, type Trip } from '../types'

type TabKey = 'cars' | 'trips'

interface EditState {
  id: string
  price: string
  city: City
  blurb: string
}

function SignedOut({ onSignIn }: { onSignIn: () => void }): JSX.Element {
  return (
    <section className="mx-auto w-full max-w-2xl">
      <div
        className="relative overflow-hidden rounded-4xl border border-line-soft px-6 py-10 text-center shadow-card sm:px-10 sm:py-12"
        style={{
          background: 'linear-gradient(168deg, #FFF6E6 0%, #FFEEDA 52%, #F7F2E9 100%)',
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gold/45 blur-2xl"
        />
        <div className="relative">
          <p className="label-micro text-emerald">Preview account</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">
            Account
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
            This is a preview sign-in. It stores a first name in this browser and nothing else.
            No password, no code, and nothing leaves this device.
          </p>
          <button type="button" className="btn-primary mt-6" onClick={onSignIn}>
            Sign in to the preview
          </button>
        </div>
      </div>

      <div className="card-flat mt-4 p-5">
        <p className="label-micro">What signing in unlocks</p>
        <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-muted">
          <li className="flex gap-2.5">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
            <span>Publishing a car of your own, tagged as your listing.</span>
          </li>
          <li className="flex gap-2.5">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
            <span>Keeping the trips you request here, with their dates and totals.</span>
          </li>
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          Nothing is booked in this preview and no money moves. Sample listings are here for
          demonstration only.
        </p>
      </div>
    </section>
  )
}

function MyCarRow({
  listing,
  onEdit,
  onRemove,
}: {
  listing: Listing
  onEdit: (listing: Listing) => void
  onRemove: (id: string) => void
}): JSX.Element {
  const title = listingTitle(listing)

  return (
    <li
      data-testid="my-cars-item"
      data-listing-id={listing.id}
      className="card flex items-start gap-3 p-3 sm:gap-4 sm:p-4"
    >
      <VehicleSilhouette vehicleClass={listing.vehicleClass} className="w-20 shrink-0 sm:w-24" />

      <div className="min-w-0 flex-1">
        <span data-testid="your-badge" className="badge-yours">
          Your listing
        </span>
        <p className="mt-1.5 truncate font-display text-base font-bold text-ink">{title}</p>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-muted">
          <IconPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
          <span className="truncate">{listing.city}</span>
        </p>
        <p className="num mt-1 font-display text-base font-extrabold text-ink">
          {formatUSD(listing.pricePerDay)} <span className="label-micro">/ day</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:gap-2">
        <button
          type="button"
          aria-label={`Edit ${title}`}
          onClick={() => onEdit(listing)}
          className="focusable grid h-11 w-11 place-items-center rounded-xl border border-line text-ink-muted transition-colors hover:bg-sand hover:text-ink"
        >
          <IconPencil className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label={`Remove ${title}`}
          onClick={() => onRemove(listing.id)}
          className="focusable grid h-11 w-11 place-items-center rounded-xl border border-line text-ink-muted transition-colors hover:bg-sand hover:text-red-600"
        >
          <IconTrash className="h-5 w-5" />
        </button>
      </div>
    </li>
  )
}

function MyCars(): JSX.Element {
  const { userListings, updateListing, removeListing } = useAppData()
  const [edit, setEdit] = useState<EditState | null>(null)
  const [editError, setEditError] = useState<{ field: 'price' | 'blurb'; message: string } | null>(
    null,
  )
  const editErrorId = useId()
  const editPriceRef = useRef<HTMLInputElement | null>(null)
  const editBlurbRef = useRef<HTMLInputElement | null>(null)
  const [removeId, setRemoveId] = useState<string | null>(null)
  const priceId = useId()
  const cityId = useId()
  const blurbId = useId()

  const removeTarget = removeId ? userListings.find((item) => item.id === removeId) : undefined
  const removeLabel = removeTarget ? listingTitle(removeTarget) : 'this listing'

  function startEdit(listing: Listing) {
    setEditError(null)
    setEdit({
      id: listing.id,
      price: String(listing.pricePerDay),
      city: listing.city,
      blurb: listing.blurb,
    })
  }

  function saveEdit() {
    if (!edit) return
    const price = Math.round(Number(edit.price))
    if (!Number.isFinite(price) || price < 1) {
      setEditError({ field: 'price', message: 'Enter a daily price of at least $1.' })
      editPriceRef.current?.focus()
      return
    }
    const blurb = edit.blurb.trim()
    if (!blurb) {
      setEditError({ field: 'blurb', message: 'Add one short line about the car.' })
      editBlurbRef.current?.focus()
      return
    }
    updateListing(edit.id, { pricePerDay: price, city: edit.city, blurb })
    setEditError(null)
    setEdit(null)
  }

  function confirmRemove() {
    if (!removeId) return
    removeListing(removeId)
    setRemoveId(null)
  }

  return (
    <>
      {userListings.length === 0 ? (
        <EmptyState
          title="No cars listed yet."
          body="The listing wizard takes four short steps: the car, where it sits, your daily price, then publish. Whatever you add shows up here and in Browse, tagged as your listing."
          action={
            <Link to="/host" className="btn-primary">
              List your car
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {userListings.map((listing) => (
            <MyCarRow
              key={listing.id}
              listing={listing}
              onEdit={startEdit}
              onRemove={setRemoveId}
            />
          ))}
        </ul>
      )}

      {edit ? (
        <Sheet
          open
          onClose={() => setEdit(null)}
          title="Edit listing"
          footer={
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <button type="button" className="btn-primary sm:flex-1" onClick={saveEdit}>
                Save changes
              </button>
              <button type="button" className="btn-ghost sm:flex-1" onClick={() => setEdit(null)}>
                Cancel
              </button>
            </div>
          }
        >
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              saveEdit()
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor={priceId} className="label-micro block">
                Price per day
              </label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">
                  $
                </span>
                <input
                  id={priceId}
                  ref={editPriceRef}
                  className="field num pl-7"
                  type="number"
                  aria-invalid={editError?.field === 'price' ? true : undefined}
                  aria-describedby={editError?.field === 'price' ? editErrorId : undefined}
                  inputMode="numeric"
                  min={1}
                  max={999}
                  step={1}
                  value={edit.price}
                  onChange={(event) => {
                    setEdit({ ...edit, price: event.target.value })
                    if (editError) setEditError(null)
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor={cityId} className="label-micro block">
                City
              </label>
              <select
                id={cityId}
                className="field mt-2"
                value={edit.city}
                onChange={(event) => {
                  const next = siteConfig.cities.find((city) => city === event.target.value)
                  if (!next) return
                  setEdit({ ...edit, city: next })
                }}
              >
                {siteConfig.cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={blurbId} className="label-micro block">
                One line about the car
              </label>
              <input
                id={blurbId}
                ref={editBlurbRef}
                className="field mt-2"
                type="text"
                maxLength={90}
                aria-invalid={editError?.field === 'blurb' ? true : undefined}
                aria-describedby={editError?.field === 'blurb' ? editErrorId : undefined}
                value={edit.blurb}
                onChange={(event) => {
                  setEdit({ ...edit, blurb: event.target.value })
                  if (editError) setEditError(null)
                }}
              />
              <p className="label-micro mt-2">{edit.blurb.length} of 90</p>
            </div>

            {editError ? (
              <p id={editErrorId} role="alert" className="text-sm font-medium text-red-600">
                {editError.message}
              </p>
            ) : null}
          </form>
        </Sheet>
      ) : null}

      {removeId ? (
        <Sheet
          open
          onClose={() => setRemoveId(null)}
          title="Remove listing"
          footer={
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                className="btn bg-red-600 text-white hover:bg-red-700 sm:flex-1"
                onClick={confirmRemove}
              >
                Remove listing
              </button>
              <button
                type="button"
                className="btn-ghost sm:flex-1"
                onClick={() => setRemoveId(null)}
              >
                Keep it
              </button>
            </div>
          }
        >
          <p className="text-sm leading-relaxed text-ink-muted">
            Remove {removeLabel} from the preview? This clears it from this browser.
          </p>
        </Sheet>
      ) : null}
    </>
  )
}

function TripRow({ trip, listing }: { trip: Trip; listing: Listing | undefined }): JSX.Element {
  const body = (
    <div className="p-3 sm:p-4">
      <div className="flex items-start gap-3 sm:gap-4">
        {listing ? (
          <VehicleSilhouette
            vehicleClass={listing.vehicleClass}
            className="w-20 shrink-0 sm:w-24"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <span className="badge bg-emerald-tint text-emerald-deep">Requested - preview</span>
          <p className="mt-1.5 truncate font-display text-base font-bold text-ink">
            {trip.listingTitle}
          </p>
          <p className="truncate text-sm text-ink-muted">Requested from {trip.hostName}</p>
          <p className="num mt-1 text-sm text-ink-muted">
            {trip.city} - {formatShortDate(trip.startDate)} to {formatShortDate(trip.endDate)} -{' '}
            {trip.days} {trip.days === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>

      <div className="mt-3 border-t border-line pt-3 text-right">
        <p className="num font-display text-lg font-extrabold text-ink">
          {formatUSD(trip.total)}
        </p>
        <p className="label-micro mt-1">No booking was made.</p>
      </div>
    </div>
  )

  return (
    <li data-testid="trip-item" data-trip-id={trip.id} className="card overflow-hidden">
      {listing ? (
        <Link to={`/car/${trip.listingId}`} className="focusable block rounded-2xl">
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  )
}

function Trips(): JSX.Element {
  const { trips, getListing } = useAppData()

  if (trips.length === 0) {
    return (
      <EmptyState
        title="No trips requested yet."
        body="Open a car, pick your dates, and send a request. It lands here with the dates and the total. Nothing is booked and no money moves."
        action={
          <Link to="/" className="btn-primary">
            Browse cars
          </Link>
        }
      />
    )
  }

  return (
    <ul className="space-y-3">
      {trips.map((trip) => (
        <TripRow key={trip.id} trip={trip} listing={getListing(trip.listingId)} />
      ))}
    </ul>
  )
}

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'cars', label: 'My cars' },
  { key: 'trips', label: 'Trips' },
]

function Account(): JSX.Element {
  const { isSignedIn, session, signOut, openSignIn } = useAppData()
  // "Go to Trips" on the request confirmation has to land on Trips, so the tab
  // is addressable rather than always starting on My cars.
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab: TabKey = searchParams.get('tab') === 'trips' ? 'trips' : 'cars'
  const [tab, setTabState] = useState<TabKey>(requestedTab)

  const setTab = (next: TabKey): void => {
    setTabState(next)
    const params = new URLSearchParams(searchParams)
    if (next === 'cars') params.delete('tab')
    else params.set('tab', next)
    setSearchParams(params, { replace: true })
  }
  const carsTabId = useId()
  const carsPanelId = useId()
  const tripsTabId = useId()
  const tripsPanelId = useId()
  const carsTabRef = useRef<HTMLButtonElement | null>(null)
  const tripsTabRef = useRef<HTMLButtonElement | null>(null)

  // The tabs pattern promises arrow-key movement, so implement it rather than
  // leaving the roles writing a check the keyboard does not honor.
  function focusTab(next: TabKey): void {
    setTab(next)
    const target = next === 'cars' ? carsTabRef.current : tripsTabRef.current
    target?.focus()
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const order: TabKey[] = ['cars', 'trips']
    const index = order.indexOf(tab)
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      focusTab(order[(index + 1) % order.length])
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      focusTab(order[(index - 1 + order.length) % order.length])
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusTab(order[0])
    } else if (event.key === 'End') {
      event.preventDefault()
      focusTab(order[order.length - 1])
    }
  }

  if (!isSignedIn || !session) {
    return <SignedOut onSignIn={() => openSignIn()} />
  }

  const initial = session.name.trim().charAt(0).toUpperCase()

  return (
    <div data-testid="account-signed-in" className="mx-auto w-full max-w-3xl">
      <header className="card-flat p-4 sm:p-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <span
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink font-display text-lg font-extrabold text-white"
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="label-micro">Preview account - stored in this browser</p>
            <h1 className="mt-1 truncate font-display text-2xl font-extrabold text-ink">
              {session.name}
            </h1>
          </div>
          <button type="button" className="btn-ghost btn-sm shrink-0" onClick={signOut}>
            Sign out
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          Signing out clears the session. Your listings stay.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Account sections"
        className="mt-5 flex gap-2"
        onKeyDown={onTabKeyDown}
      >
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            role="tab"
            id={entry.key === 'cars' ? carsTabId : tripsTabId}
            ref={entry.key === 'cars' ? carsTabRef : tripsTabRef}
            aria-selected={tab === entry.key}
            aria-controls={entry.key === 'cars' ? carsPanelId : tripsPanelId}
            tabIndex={tab === entry.key ? 0 : -1}
            className={tab === entry.key ? 'chip chip-active' : 'chip'}
            onClick={() => setTab(entry.key)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <section
        id={carsPanelId}
        role="tabpanel"
        aria-labelledby={carsTabId}
        hidden={tab !== 'cars'}
        className="mt-5"
      >
        <MyCars />
      </section>
      <section
        id={tripsPanelId}
        role="tabpanel"
        aria-labelledby={tripsTabId}
        hidden={tab !== 'trips'}
        className="mt-5"
      >
        <Trips />
      </section>
    </div>
  )
}

export default Account

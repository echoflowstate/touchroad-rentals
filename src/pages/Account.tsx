import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
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
        className="relative overflow-hidden rounded-3xl px-6 py-10 text-center sm:px-10 sm:py-12"
        style={{ background: 'linear-gradient(158deg, #0a0f1c 0%, #111a2e 54%, #182440 100%)' }}
      >
        <span aria-hidden="true" className="hero-glow opacity-70" />
        <div className="relative">
          <p className="label-micro text-brand-300">Preview account</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-4xl">
            Account
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
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
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
            <span>Publishing a car of your own, tagged as your listing.</span>
          </li>
          <li className="flex gap-2.5">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
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
          className="focusable grid h-11 w-11 place-items-center rounded-xl border border-line text-ink-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <IconPencil className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label={`Remove ${title}`}
          onClick={() => onRemove(listing.id)}
          className="focusable grid h-11 w-11 place-items-center rounded-xl border border-line text-ink-muted transition-colors hover:bg-surface hover:text-red-600"
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
  const [editError, setEditError] = useState('')
  const [removeId, setRemoveId] = useState<string | null>(null)
  const priceId = useId()
  const cityId = useId()
  const blurbId = useId()

  const removeTarget = removeId ? userListings.find((item) => item.id === removeId) : undefined
  const removeLabel = removeTarget ? listingTitle(removeTarget) : 'this listing'

  function startEdit(listing: Listing) {
    setEditError('')
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
      setEditError('Enter a daily price of at least $1.')
      return
    }
    const blurb = edit.blurb.trim()
    if (!blurb) {
      setEditError('Add one short line about the car.')
      return
    }
    updateListing(edit.id, { pricePerDay: price, city: edit.city, blurb })
    setEditError('')
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
                  className="field num pl-7"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={999}
                  step={1}
                  value={edit.price}
                  onChange={(event) => {
                    setEdit({ ...edit, price: event.target.value })
                    if (editError) setEditError('')
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
                className="field mt-2"
                type="text"
                maxLength={90}
                value={edit.blurb}
                onChange={(event) => {
                  setEdit({ ...edit, blurb: event.target.value })
                  if (editError) setEditError('')
                }}
              />
              <p className="label-micro mt-2">{edit.blurb.length} of 90</p>
            </div>

            {editError ? (
              <p role="alert" className="text-sm font-medium text-red-600">
                {editError}
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
          <span className="badge bg-navy/[0.08] text-navy">Requested - preview</span>
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

export function Account(): JSX.Element {
  const { isSignedIn, session, signOut, openSignIn } = useAppData()
  const [tab, setTab] = useState<TabKey>('cars')
  const carsTabId = useId()
  const carsPanelId = useId()
  const tripsTabId = useId()
  const tripsPanelId = useId()

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
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy font-display text-lg font-extrabold text-white"
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

      <div role="tablist" aria-label="Account sections" className="mt-5 flex gap-2">
        <button
          type="button"
          role="tab"
          id={carsTabId}
          aria-selected={tab === 'cars'}
          aria-controls={carsPanelId}
          className={tab === 'cars' ? 'chip chip-active' : 'chip'}
          onClick={() => setTab('cars')}
        >
          My cars
        </button>
        <button
          type="button"
          role="tab"
          id={tripsTabId}
          aria-selected={tab === 'trips'}
          aria-controls={tripsPanelId}
          className={tab === 'trips' ? 'chip chip-active' : 'chip'}
          onClick={() => setTab('trips')}
        >
          Trips
        </button>
      </div>

      {tab === 'cars' ? (
        <section id={carsPanelId} role="tabpanel" aria-labelledby={carsTabId} className="mt-5">
          <MyCars />
        </section>
      ) : (
        <section id={tripsPanelId} role="tabpanel" aria-labelledby={tripsTabId} className="mt-5">
          <Trips />
        </section>
      )}
    </div>
  )
}

export default Account

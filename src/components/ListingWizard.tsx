import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SAMPLE_FLEET } from '../data/fleet'
import { useReducedMotion } from '../lib/motion'
import { fleetAverageForClass, formatUSD } from '../lib/pricing'
import { siteConfig } from '../site.config'
import { useAppData } from '../state/AppState'
import { VEHICLE_CLASSES, listingTitle } from '../types'
import type { City, Fuel, Listing, ListingDraft, Transmission, VehicleClass } from '../types'
import { IconCheck } from './Icons'
import { VehicleSilhouette } from './VehicleSilhouette'

const STEP_TITLES = ['Car', 'Where', 'Price', 'Review'] as const
const TRANSMISSIONS: Transmission[] = ['Automatic', 'Manual']
const FUELS: Fuel[] = ['Gas', 'Hybrid', 'Electric']
const SEAT_OPTIONS = [2, 4, 5, 7, 8]

const CURRENT_YEAR = new Date().getFullYear()
const MIN_YEAR = 1980
const MAX_YEAR = CURRENT_YEAR + 1
const MIN_PRICE = 5
const MAX_PRICE = 500
const BLURB_MAX = 90

const EMPTY_DRAFT: ListingDraft = {
  year: '',
  make: '',
  model: '',
  vehicleClass: 'Car',
  seats: 5,
  transmission: 'Automatic',
  fuel: 'Gas',
  city: 'Pensacola',
  pricePerDay: '',
  blurb: '',
}

type ErrorKey = 'year' | 'make' | 'model' | 'pricePerDay'
type DraftErrors = Partial<Record<ErrorKey, string>>

const ERROR_ORDER: ErrorKey[] = ['year', 'make', 'model', 'pricePerDay']

function validateStep(step: number, draft: ListingDraft): DraftErrors {
  const found: DraftErrors = {}

  if (step === 1) {
    const year = Number(draft.year)
    if (draft.year.trim() === '') {
      found.year = 'Add the model year.'
    } else if (!Number.isFinite(year) || year < MIN_YEAR || year > MAX_YEAR) {
      found.year = `Use a year between ${MIN_YEAR} and ${MAX_YEAR}.`
    }
    if (draft.make.trim() === '') found.make = 'Add the make, like Toyota.'
    if (draft.model.trim() === '') found.model = 'Add the model, like Corolla.'
  }

  if (step === 3) {
    const price = Number(draft.pricePerDay)
    if (draft.pricePerDay.trim() === '') {
      found.pricePerDay = 'Set a price a day.'
    } else if (!Number.isFinite(price) || price < MIN_PRICE || price > MAX_PRICE) {
      found.pricePerDay = `Pick a price between ${formatUSD(MIN_PRICE)} and ${formatUSD(MAX_PRICE)} a day.`
    }
  }

  return found
}

function FieldError({ id, message }: { id: string; message?: string }): JSX.Element | null {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">
      {message}
    </p>
  )
}

export function ListingWizard(): JSX.Element {
  const { addListing, isSignedIn, openSignIn, session } = useAppData()
  const reduced = useReducedMotion()

  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<ListingDraft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<DraftErrors>({})
  const [pendingPublish, setPendingPublish] = useState(false)
  const [published, setPublished] = useState<Listing | null>(null)

  const setField = useCallback(<K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) => {
    setDraft((prev) => {
      const next: ListingDraft = { ...prev }
      next[key] = value
      return next
    })
    setErrors((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key as ErrorKey]
      return next
    })
  }, [])

  const commit = useCallback(
    (hostFullName: string) => {
      const blurb = draft.blurb.trim() || `Listed by a neighbor in ${draft.city}.`
      const listing = addListing({
        year: Number(draft.year),
        make: draft.make.trim(),
        model: draft.model.trim(),
        vehicleClass: draft.vehicleClass,
        seats: draft.seats,
        transmission: draft.transmission,
        fuel: draft.fuel,
        city: draft.city,
        pricePerDay: Math.round(Number(draft.pricePerDay)),
        blurb,
        hostName: hostFullName.split(' ')[0],
      })
      setPublished(listing)
      setStep(4)
    },
    [addListing, draft],
  )

  /**
   * Publishing after the sign-in sheet has to wait a render: the callback the
   * sheet fires still closes over the old, empty session.
   */
  useEffect(() => {
    if (!pendingPublish || !session) return
    setPendingPublish(false)
    commit(session.name)
  }, [commit, pendingPublish, session])

  function focusFirstError(found: DraftErrors): void {
    const key = ERROR_ORDER.find((candidate) => found[candidate])
    if (!key) return
    const element = document.getElementById(`wizard-${key}`)
    if (element instanceof HTMLElement) element.focus()
  }

  function goNext(): void {
    const found = validateStep(step, draft)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      focusFirstError(found)
      return
    }
    setErrors({})
    setStep((prev) => Math.min(STEP_TITLES.length, prev + 1))
  }

  function goBack(): void {
    setErrors({})
    setStep((prev) => Math.max(1, prev - 1))
  }

  function handlePublish(): void {
    const found = { ...validateStep(1, draft), ...validateStep(3, draft) }
    if (Object.keys(found).length > 0) {
      setErrors(found)
      const carStep = found.year || found.make || found.model
      setStep(carStep ? 1 : 3)
      return
    }
    setErrors({})
    if (!isSignedIn || !session) {
      openSignIn(() => setPendingPublish(true))
      return
    }
    commit(session.name)
  }

  function listAnother(): void {
    setDraft(EMPTY_DRAFT)
    setErrors({})
    setPublished(null)
    setPendingPublish(false)
    setStep(1)
  }

  const classAverage = fleetAverageForClass(SAMPLE_FLEET, draft.vehicleClass)
  const priceNumber = Number(draft.pricePerDay)
  const priceLabel =
    draft.pricePerDay.trim() !== '' && Number.isFinite(priceNumber)
      ? `${formatUSD(Math.round(priceNumber))} a day`
      : 'Not set yet'
  const composedTitle = [draft.year.trim(), draft.make.trim(), draft.model.trim()]
    .filter(Boolean)
    .join(' ')
  const blurbPreview = draft.blurb.trim() || `Listed by a neighbor in ${draft.city}.`

  const reviewRows = [
    { label: 'Vehicle', value: composedTitle || 'Not set yet' },
    { label: 'Class', value: draft.vehicleClass },
    { label: 'Seats', value: String(draft.seats) },
    { label: 'Transmission', value: draft.transmission },
    { label: 'Fuel', value: draft.fuel },
    { label: 'City', value: draft.city },
    { label: 'Price', value: priceLabel },
    { label: 'Your line', value: blurbPreview },
  ]

  return (
    <section data-testid="wizard" data-step={step} className="card-flat p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">List your car</h2>
        <p className="label-micro">Step {step} of {STEP_TITLES.length}</p>
      </div>

      <div aria-hidden="true" className="mt-3 flex items-center gap-1.5">
        {STEP_TITLES.map((title, index) => {
          const position = index + 1
          const done = position < step
          const current = position === step
          return (
            <span
              key={title}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
            >
              <span
                className={`block h-full rounded-full ${done ? 'bg-navy' : 'bg-brand'} ${
                  reduced ? '' : 'transition-[width] duration-500 ease-out'
                }`}
                style={{ width: done || current ? '100%' : '0%' }}
              />
            </span>
          )
        })}
      </div>

      <h3 className="mt-3 font-display text-[17px] font-bold text-ink">
        {STEP_TITLES[step - 1]}
      </h3>

      {published ? (
        <div className={`mt-5 ${reduced ? '' : 'animate-fade-slide'}`}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-mint/10 text-mint">
            <IconCheck className="h-6 w-6" />
          </span>
          <p className="mt-3 font-display text-xl font-extrabold text-ink sm:text-2xl">
            Your listing is live in the preview.
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            {listingTitle(published)} in {published.city}, at{' '}
            <span className="num font-semibold text-ink">{formatUSD(published.pricePerDay)}</span> a
            day. It is saved in this browser only.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/" className="btn-primary">
              See it in Browse
            </Link>
            <Link to="/account" className="btn-navy">
              Manage in My cars
            </Link>
            <button type="button" className="btn-ghost" onClick={listAnother}>
              List another car
            </button>
          </div>
        </div>
      ) : !isSignedIn ? (
        <div className="card mt-5 p-5">
          <p className="label-micro">Preview sign-in</p>
          <p className="mt-2 text-[15px] font-semibold leading-snug text-ink">
            Sign in to the preview to publish a listing.
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            It asks for a first name and nothing else, and it stays in this browser.
          </p>
          <button type="button" className="btn-primary mt-4" onClick={() => openSignIn()}>
            Sign in
          </button>
        </div>
      ) : (
        <div className={`mt-5 ${reduced ? '' : 'animate-fade-slide'}`} key={step}>
          {step === 1 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="wizard-year" className="label-micro block">
                  Year
                </label>
                <input
                  id="wizard-year"
                  type="number"
                  inputMode="numeric"
                  min={MIN_YEAR}
                  max={MAX_YEAR}
                  step={1}
                  placeholder={String(CURRENT_YEAR - 6)}
                  value={draft.year}
                  onChange={(event) => setField('year', event.target.value)}
                  aria-invalid={errors.year ? true : undefined}
                  aria-describedby={errors.year ? 'wizard-year-error' : undefined}
                  className={`field num mt-1.5 ${errors.year ? 'border-red-500' : ''}`}
                />
                <FieldError id="wizard-year-error" message={errors.year} />
              </div>

              <div>
                <label htmlFor="wizard-make" className="label-micro block">
                  Make
                </label>
                <input
                  id="wizard-make"
                  type="text"
                  autoComplete="off"
                  placeholder="Toyota"
                  value={draft.make}
                  onChange={(event) => setField('make', event.target.value)}
                  aria-invalid={errors.make ? true : undefined}
                  aria-describedby={errors.make ? 'wizard-make-error' : undefined}
                  className={`field mt-1.5 ${errors.make ? 'border-red-500' : ''}`}
                />
                <FieldError id="wizard-make-error" message={errors.make} />
              </div>

              <div>
                <label htmlFor="wizard-model" className="label-micro block">
                  Model
                </label>
                <input
                  id="wizard-model"
                  type="text"
                  autoComplete="off"
                  placeholder="Corolla"
                  value={draft.model}
                  onChange={(event) => setField('model', event.target.value)}
                  aria-invalid={errors.model ? true : undefined}
                  aria-describedby={errors.model ? 'wizard-model-error' : undefined}
                  className={`field mt-1.5 ${errors.model ? 'border-red-500' : ''}`}
                />
                <FieldError id="wizard-model-error" message={errors.model} />
              </div>

              <div>
                <label htmlFor="wizard-class" className="label-micro block">
                  Class
                </label>
                <select
                  id="wizard-class"
                  className="field mt-1.5"
                  value={draft.vehicleClass}
                  onChange={(event) => setField('vehicleClass', event.target.value as VehicleClass)}
                >
                  {VEHICLE_CLASSES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="wizard-seats" className="label-micro block">
                  Seats
                </label>
                <select
                  id="wizard-seats"
                  className="field mt-1.5"
                  value={draft.seats}
                  onChange={(event) => setField('seats', Number(event.target.value))}
                >
                  {SEAT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="wizard-transmission" className="label-micro block">
                  Transmission
                </label>
                <select
                  id="wizard-transmission"
                  className="field mt-1.5"
                  value={draft.transmission}
                  onChange={(event) =>
                    setField('transmission', event.target.value as Transmission)
                  }
                >
                  {TRANSMISSIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="wizard-fuel" className="label-micro block">
                  Fuel
                </label>
                <select
                  id="wizard-fuel"
                  className="field mt-1.5"
                  value={draft.fuel}
                  onChange={(event) => setField('fuel', event.target.value as Fuel)}
                >
                  {FUELS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="wizard-city" className="label-micro block">
                  City
                </label>
                <select
                  id="wizard-city"
                  className="field mt-1.5 sm:max-w-xs"
                  value={draft.city}
                  onChange={(event) => setField('city', event.target.value as City)}
                >
                  {siteConfig.cities.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  Renters filter by city first, so pick the one you would actually meet in.
                </p>
              </div>

              <div>
                <label
                  htmlFor="wizard-blurb"
                  className="label-micro flex items-baseline justify-between gap-2"
                >
                  <span>One honest line about it</span>
                  <span className="num font-mono text-[11px] tracking-normal text-ink-faint">
                    {draft.blurb.length}/{BLURB_MAX}
                  </span>
                </label>
                <input
                  id="wizard-blurb"
                  type="text"
                  maxLength={BLURB_MAX}
                  autoComplete="off"
                  placeholder="Small sedan, easy to park downtown."
                  value={draft.blurb}
                  onChange={(event) => setField('blurb', event.target.value)}
                  className="field mt-1.5"
                />
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  Optional. Leave it blank and it reads &ldquo;Listed by a neighbor in {draft.city}.&rdquo;
                </p>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="wizard-pricePerDay" className="label-micro block">
                  Price a day
                </label>
                <div className="relative mt-1.5 sm:max-w-[220px]">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-faint"
                  >
                    $
                  </span>
                  <input
                    id="wizard-pricePerDay"
                    type="number"
                    inputMode="numeric"
                    min={MIN_PRICE}
                    max={MAX_PRICE}
                    step={1}
                    placeholder="30"
                    value={draft.pricePerDay}
                    onChange={(event) => setField('pricePerDay', event.target.value)}
                    aria-invalid={errors.pricePerDay ? true : undefined}
                    aria-describedby={
                      errors.pricePerDay ? 'wizard-price-error' : 'wizard-price-nudge'
                    }
                    className={`field num pl-7 ${errors.pricePerDay ? 'border-red-500' : ''}`}
                  />
                </div>
                <FieldError id="wizard-price-error" message={errors.pricePerDay} />

                <div
                  data-testid="wizard-price-nudge"
                  id="wizard-price-nudge"
                  className="mt-3 rounded-xl border border-line bg-surface px-4 py-3"
                >
                  <p className="text-sm leading-relaxed text-ink-muted">
                    {classAverage > 0
                      ? `Sample ${draft.vehicleClass} listings average ${formatUSD(classAverage)} a day. You set your own price.`
                      : `There are no sample ${draft.vehicleClass} listings to average yet. You set your own price.`}
                  </p>
                  {classAverage > 0 ? (
                    <button
                      type="button"
                      className="btn-ghost btn-sm mt-2 bg-white"
                      onClick={() => setField('pricePerDay', String(classAverage))}
                    >
                      Use {formatUSD(classAverage)}
                    </button>
                  ) : null}
                </div>

                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  Whatever you type is the whole nightly number a renter sees. Nothing is added on
                  top of it.
                </p>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
              <div>
                <VehicleSilhouette vehicleClass={draft.vehicleClass} />
                <p className="label-micro mt-2">Preview of your listing</p>
              </div>

              <div>
                <p className="font-display text-lg font-extrabold leading-snug text-ink">
                  {composedTitle || 'Your car'}
                </p>
                <dl className="mt-3 divide-y divide-line border-t border-line">
                  {reviewRows.map((row) => (
                    <div key={row.label} className="flex gap-4 py-2.5">
                      <dt className="label-micro w-[104px] shrink-0 pt-0.5">{row.label}</dt>
                      <dd className="min-w-0 flex-1 text-sm leading-relaxed text-ink">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  Publishing saves this car in your browser and puts it at the top of Browse. No
                  money moves and nobody is charged.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {published ? null : (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <button
            type="button"
            data-testid="wizard-back"
            className="btn-ghost"
            onClick={goBack}
            disabled={step === 1 || !isSignedIn}
          >
            Back
          </button>

          {step < STEP_TITLES.length ? (
            <button
              type="button"
              data-testid="wizard-next"
              className="btn-primary"
              onClick={goNext}
              disabled={!isSignedIn}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              data-testid="wizard-publish"
              className="btn-primary"
              onClick={handlePublish}
            >
              Publish listing
            </button>
          )}

          <p className="label-micro ml-auto hidden sm:block">Nothing here is booked</p>
        </div>
      )}
    </section>
  )
}

export default ListingWizard

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CoastalHero } from '../components/CoastalHero'
import { EmptyState } from '../components/EmptyState'
import { FilterBar } from '../components/FilterBar'
import { ListingCard } from '../components/ListingCard'
import { MileMarker, RoadHairline } from '../components/RoadLine'
import { Reveal } from '../components/Reveal'
import { SearchRow } from '../components/SearchRow'
import { SkeletonGrid } from '../components/Skeleton'
import { WaveDivider } from '../components/WaveDivider'
import { applyFilters, defaultFilters, priceCeiling, wouldMatchWithoutPrice } from '../lib/filters'
import { useReducedMotion } from '../lib/motion'
import { formatUSD } from '../lib/pricing'
import { NEARBY_CITY, siteConfig } from '../site.config'
import type { Filters } from '../types'
import { useAppData } from '../state/AppState'

export function Browse(): JSX.Element {
  const { listings } = useAppData()
  const reduced = useReducedMotion()
  const delay = reduced ? 0 : siteConfig.searchDelayMs

  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [applied, setApplied] = useState<Filters>(filters)
  const [loading, setLoading] = useState(delay > 0)
  // Bumped whenever a fresh set of results lands, so the cascade replays.
  const [runId, setRunId] = useState(0)
  const timer = useRef<number | null>(null)

  const startLoad = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    if (delay <= 0) {
      setLoading(false)
      setRunId((n) => n + 1)
      return
    }
    setLoading(true)
    timer.current = window.setTimeout(() => {
      timer.current = null
      setLoading(false)
      setRunId((n) => n + 1)
    }, delay)
  }, [delay])

  useEffect(() => {
    startLoad()
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [startLoad])

  /**
   * The shimmer is cosmetic: `applied` moves the moment a control moves, so the
   * grid is already correct by the time the placeholder clears.
   */
  const commit = useCallback((next: Filters, shimmer: boolean) => {
    setFilters(next)
    setApplied(next)
    if (shimmer) startLoad()
  }, [startLoad])

  const results = useMemo(() => applyFilters(listings, applied), [listings, applied])

  const activeCity = applied.city === 'all' ? null : applied.city
  const nearby = activeCity ? NEARBY_CITY[activeCity] : null
  // Only send someone up the road if there is genuinely something waiting there,
  // otherwise the suggestion bounces them between two empty cities.
  const nearbyHasMatches = useMemo(
    () => (nearby ? applyFilters(listings, { ...applied, city: nearby }).length > 0 : false),
    [listings, applied, nearby],
  )

  function renderEmptyState(): JSX.Element {
    if (activeCity && applied.price !== 'any' && wouldMatchWithoutPrice(listings, applied)) {
      const ceiling = formatUSD(priceCeiling(applied.price))
      // Name the neighbor only when it really has something at this price,
      // otherwise the sentence sends the renter to another empty grid.
      const title =
        nearby && nearbyHasMatches
          ? `Nothing under ${ceiling} in ${activeCity} those days - try nearby ${nearby}.`
          : `Nothing under ${ceiling} in ${activeCity} those days.`
      return (
        <EmptyState
          title={title}
          body={`There are cars parked in ${activeCity}. None of them sit under ${ceiling} a day.`}
          action={
            <button
              type="button"
              className="btn-ghost"
              onClick={() => commit({ ...filters, price: 'any' }, true)}
            >
              Show any price
            </button>
          }
        />
      )
    }

    if (activeCity && nearby && nearbyHasMatches) {
      return (
        <EmptyState
          title={`Nothing in ${activeCity} matches those filters.`}
          body={`${nearby} is the closest stop with a match, a short drive up the road.`}
          action={
            <button
              type="button"
              className="btn-ghost"
              onClick={() => commit({ ...filters, city: nearby }, true)}
            >
              Try {nearby}
            </button>
          }
        />
      )
    }

    return (
      <EmptyState
        title="Nothing matches those filters."
        body="Clear a chip or two and the coast opens back up."
        action={
          <button type="button" className="btn-ghost" onClick={() => commit(defaultFilters(), true)}>
            Clear filters
          </button>
        }
      />
    )
  }

  return (
    <div>
      {/* M3 / E1: the coastal scene, with the search card floating on the sand. */}
      <CoastalHero>
        <div className="shell relative pb-28 pt-10 md:pb-36 md:pt-16">
          <p className="label-micro text-emerald">{siteConfig.region}</p>
          <h1 className="mt-3 max-w-3xl font-display text-[34px] font-extrabold leading-[1.04] tracking-[-0.03em] text-ink sm:text-5xl md:text-6xl">
            {siteConfig.headline}
          </h1>
          {/* Kept clear of the sun disc: emerald on gold is 3.69:1 and would fail AA. */}
          <p className="mt-4 max-w-[16rem] font-display text-lg font-bold tracking-[-0.01em] text-emerald sm:max-w-none sm:text-xl">
            {siteConfig.priceLine}
          </p>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:text-base">
            Browse sample cars from neighbors up and down the coast, and see the whole price before
            you ever tap request.
          </p>
        </div>

        {/* The search card lifts off the sand. */}
        <div className="shell relative z-10 -mb-10 -translate-y-16 md:-mb-14 md:-translate-y-20">
          <SearchRow
            filters={filters}
            onChange={(next) => commit(next, false)}
            onSearch={() => startLoad()}
          />
        </div>
      </CoastalHero>

      <WaveDivider to="white" className="bg-sand" />

      <section className="relative band-white pb-14 pt-2 md:pb-20">
        <RoadHairline />
        <div className="shell relative">
          <Reveal className="flex items-center justify-between gap-4">
            <MileMarker>The fleet</MileMarker>
          </Reveal>

          <div className="mt-4">
            <FilterBar
              filters={filters}
              onChange={(next) => commit(next, true)}
              resultCount={results.length}
            />
          </div>

          <p role="status" aria-live="polite" className="sr-only">
            {loading
              ? 'Updating results'
              : `${results.length} ${results.length === 1 ? 'car' : 'cars'} ready`}
          </p>

          <div className="mt-6">
            {loading ? (
              <SkeletonGrid count={6} />
            ) : (
              <>
                <h2 className="sr-only">Cars</h2>
                <div
                  data-testid="results-grid"
                  className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
                >
                  {results.map((listing, index) => (
                    <ListingCard
                      key={`${runId}-${listing.id}`}
                      listing={listing}
                      index={index}
                    />
                  ))}
                </div>
                {results.length === 0 ? <div className="py-2">{renderEmptyState()}</div> : null}
              </>
            )}
          </div>
        </div>
      </section>

      <WaveDivider to="aqua" flip className="bg-white" />

      <section className="band-aqua py-12 md:py-16">
        <div className="shell">
          <Reveal className="card-flat flex flex-col gap-2 px-6 py-6 md:px-8 md:py-7">
            <p className="font-display text-xl font-extrabold tracking-[-0.02em] text-ink md:text-2xl">
              {siteConfig.priceLine}
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
              Every card here is a sample record in a preview build. Nothing is booked and no money
              moves.
            </p>
          </Reveal>
        </div>
      </section>

      <WaveDivider to="sand" className="bg-emerald-wash" />
    </div>
  )
}

export default Browse

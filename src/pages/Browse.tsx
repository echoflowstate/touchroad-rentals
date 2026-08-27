import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { FilterBar } from '../components/FilterBar'
import { ListingCard } from '../components/ListingCard'
import { SearchRow } from '../components/SearchRow'
import { SkeletonGrid } from '../components/Skeleton'
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
  const timer = useRef<number | null>(null)

  const startLoad = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    if (delay <= 0) {
      setLoading(false)
      return
    }
    setLoading(true)
    timer.current = window.setTimeout(() => {
      timer.current = null
      setLoading(false)
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
    <div className="pb-16">
      <section className="relative bg-navy">
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(168deg, #0a0f1c 0%, #111a2e 58%, #182440 100%)' }}
          />
          <div className="absolute left-1/2 top-[-42%] h-[150%] w-[125%] max-w-[980px] -translate-x-1/2">
            <div className="hero-glow" />
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 md:pb-24 md:pt-20">
          <p className="label-micro text-brand-300">{siteConfig.region}</p>
          <h1 className="mt-3 max-w-3xl font-display text-[32px] font-extrabold leading-[1.06] tracking-[-0.03em] text-white sm:text-5xl md:text-6xl">
            {siteConfig.headline}
          </h1>
          <p className="mt-4 font-mono text-[13px] uppercase tracking-[0.12em] text-brand-300 sm:text-sm">
            {siteConfig.priceLine}
          </p>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70 sm:text-base">
            Browse sample cars from neighbors up and down the coast, and see the whole price before
            you ever tap request.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-6 max-w-6xl px-4 sm:px-6 md:-mt-16">
        <SearchRow
          filters={filters}
          onChange={(next) => commit(next, false)}
          onSearch={() => startLoad()}
        />
      </div>

      <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-6 md:mt-10">
        <FilterBar
          filters={filters}
          onChange={(next) => commit(next, true)}
          resultCount={results.length}
        />

        <p role="status" aria-live="polite" className="sr-only">
          {loading ? 'Updating results' : `${results.length} ${results.length === 1 ? 'car' : 'cars'} ready`}
        </p>

        <div className="mt-5 md:mt-6">
          {loading ? (
            <SkeletonGrid count={6} />
          ) : (
            <>
              <h2 className="sr-only">Cars</h2>
              <div
                data-testid="results-grid"
                className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
              >
                {results.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              {results.length === 0 ? <div className="py-2">{renderEmptyState()}</div> : null}
            </>
          )}
        </div>

        <div className="card-flat mt-10 flex flex-col gap-1 px-5 py-4 md:mt-12">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink-muted">
            {siteConfig.priceLine}
          </p>
          <p className="text-sm leading-relaxed text-ink-muted">
            Every card here is a sample record in a preview build. Nothing is booked and no money
            moves.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Browse

import { useCountUp } from '../lib/countUp'
import { VEHICLE_CLASSES } from '../types'
import type { Filters, PriceFilter, SortKey, VehicleClass } from '../types'

export interface FilterBarProps {
  filters: Filters
  onChange: (next: Filters) => void
  resultCount: number
}

const PRICE_CHIPS: Array<{ value: PriceFilter; label: string }> = [
  { value: 'under30', label: 'Under $30' },
  { value: 'under45', label: 'Under $45' },
  { value: 'any', label: 'Any' },
]

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
]

/** Scrolls sideways on a 360px phone, wraps once there is room for it. */
const ROW =
  'flex flex-nowrap gap-2 overflow-x-auto -mx-4 px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:flex-wrap md:overflow-visible md:px-0'

function chipClass(active: boolean): string {
  return `chip shrink-0 ${active ? 'chip-active' : ''}`
}

export function FilterBar({ filters, onChange, resultCount }: FilterBarProps): JSX.Element {
  // The count rolls to its new value so a filter change reads as a change.
  const shownCount = useCountUp(resultCount)

  // E4: how many filters are actually narrowing the board right now.
  const activeCount =
    (filters.price !== 'any' ? 1 : 0) +
    (filters.vehicleClass !== 'all' ? 1 : 0) +
    (filters.seatsFivePlus ? 1 : 0) +
    (filters.automaticOnly ? 1 : 0)

  function setPrice(value: PriceFilter) {
    onChange({ ...filters, price: value })
  }

  function toggleClass(value: VehicleClass) {
    onChange({ ...filters, vehicleClass: filters.vehicleClass === value ? 'all' : value })
  }

  return (
    <section aria-label="Filters" className="flex flex-col gap-2">
      <div className={ROW} role="group" aria-label="Daily price">
        {PRICE_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={chipClass(filters.price === chip.value)}
            aria-pressed={filters.price === chip.value}
            onClick={() => setPrice(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className={ROW} role="group" aria-label="Vehicle class">
        {VEHICLE_CLASSES.map((value) => (
          <button
            key={value}
            type="button"
            className={chipClass(filters.vehicleClass === value)}
            aria-pressed={filters.vehicleClass === value}
            onClick={() => toggleClass(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className={ROW} role="group" aria-label="More filters">
          <button
            type="button"
            className={chipClass(filters.seatsFivePlus)}
            aria-pressed={filters.seatsFivePlus}
            onClick={() => onChange({ ...filters, seatsFivePlus: !filters.seatsFivePlus })}
          >
            Seats 5+
          </button>
          <button
            type="button"
            className={chipClass(filters.automaticOnly)}
            aria-pressed={filters.automaticOnly}
            onClick={() => onChange({ ...filters, automaticOnly: !filters.automaticOnly })}
          >
            Automatic
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <label className="label-micro shrink-0" htmlFor="sort-select">
            Sort
          </label>
          <select
            id="sort-select"
            className="field w-full md:w-[190px]"
            value={filters.sort}
            onChange={(event) => onChange({ ...filters, sort: event.target.value as SortKey })}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <p className="label-micro">
          <span className="num tabular-nums">{shownCount}</span>{' '}
          {resultCount === 1 ? 'car' : 'cars'}
        </p>
        {activeCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-tint px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-emerald-deep">
            <span
              aria-hidden="true"
              className="grid h-4 w-4 place-items-center rounded-full bg-emerald text-[9px] font-bold leading-none text-white"
            >
              {activeCount}
            </span>
            {activeCount === 1 ? 'filter on' : 'filters on'}
          </span>
        ) : null}
      </div>
    </section>
  )
}

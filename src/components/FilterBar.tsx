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

      <p className="label-micro pt-1">
        {resultCount} {resultCount === 1 ? 'car' : 'cars'}
      </p>
    </section>
  )
}

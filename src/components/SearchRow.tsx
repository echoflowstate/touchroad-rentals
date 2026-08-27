import { addDays } from '../lib/pricing'
import { CITIES } from '../site.config'
import type { City, Filters } from '../types'
import { IconSearch } from './Icons'

export interface SearchRowProps {
  filters: Filters
  onChange: (next: Filters) => void
  onSearch: () => void
}

export function SearchRow({ filters, onChange, onSearch }: SearchRowProps): JSX.Element {
  function handleCity(value: string) {
    onChange({ ...filters, city: value === 'all' ? 'all' : (value as City) })
  }

  // ISO dates compare correctly as strings, so the drop-off can never land on
  // or before the pickup and push the quote negative.
  function handleStart(value: string) {
    if (!value) return
    const endDate = value >= filters.endDate ? addDays(value, 1) : filters.endDate
    onChange({ ...filters, startDate: value, endDate })
  }

  function handleEnd(value: string) {
    if (!value) return
    const endDate = value <= filters.startDate ? addDays(filters.startDate, 1) : value
    onChange({ ...filters, endDate })
  }

  return (
    <form
      className="card-flat p-4 shadow-lift md:p-5"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch()
      }}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.3fr_1fr_1fr_auto] md:items-end md:gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label-micro" htmlFor="search-city">
            Where
          </label>
          <select
            id="search-city"
            className="field"
            value={filters.city}
            onChange={(event) => handleCity(event.target.value)}
          >
            <option value="all">All cities</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label-micro" htmlFor="search-start">
            Pick up
          </label>
          <input
            id="search-start"
            type="date"
            className="field"
            value={filters.startDate}
            onChange={(event) => handleStart(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label-micro" htmlFor="search-end">
            Drop off
          </label>
          <input
            id="search-end"
            type="date"
            className="field"
            min={filters.startDate}
            value={filters.endDate}
            onChange={(event) => handleEnd(event.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary btn-glare h-[48px] w-full md:w-auto md:px-7">
          <IconSearch className="h-5 w-5" />
          Search
        </button>
      </div>
    </form>
  )
}

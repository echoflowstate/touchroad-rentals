import { CITIES } from '../site.config'
import type { City, Filters } from '../types'
import { CityHint } from './CityHint'
import { DateRangeField } from './DateRangeField'
import { IconSearch } from './Icons'

export interface SearchRowProps {
  filters: Filters
  onChange: (next: Filters) => void
  onSearch: () => void
  /** A3: called when a range is chosen, so the hero sun can acknowledge it. */
  onDatesPicked?: () => void
}

export function SearchRow({
  filters,
  onChange,
  onSearch,
  onDatesPicked,
}: SearchRowProps): JSX.Element {
  function handleCity(value: string) {
    onChange({ ...filters, city: value === 'all' ? 'all' : (value as City) })
  }

  // The picker orders the pair before it hands them over, so the drop-off can
  // never land before the pick-up and push the quote negative.
  function handleDates(start: string, end: string) {
    onChange({ ...filters, startDate: start, endDate: end })
    onDatesPicked?.()
  }

  return (
    <form
      className="card-flat p-4 shadow-lift md:p-5"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch()
      }}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1.4fr_auto] md:items-end md:gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center">
            <label className="label-micro" htmlFor="search-city">
              Where
            </label>
            {/* Beside the label, not inside it: the hint is decoration and has
                no business in the field's accessible name. */}
            <CityHint active={filters.city === 'all'} />
          </span>
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

        <DateRangeField
          id="search-dates"
          label="Trip dates"
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={handleDates}
        />

        <button type="submit" className="btn-primary btn-glare h-[48px] w-full md:w-auto md:px-7">
          <IconSearch className="h-5 w-5" />
          Search
        </button>
      </div>
    </form>
  )
}

import { useState } from 'react'
import { SAMPLE_FLEET } from '../data/fleet'
import { estimateMonthly, fleetAverageForClass, formatUSD } from '../lib/pricing'
import { VEHICLE_CLASSES } from '../types'
import type { VehicleClass } from '../types'

const MIN_RATE = 5
const MAX_RATE = 500
const MIN_DAYS = 1
const MAX_DAYS = 30
const FALLBACK_RATE = 30

/** Sample average for a class, with a neutral floor so the input is never blank. */
function averageRate(vehicleClass: VehicleClass): number {
  const average = fleetAverageForClass(SAMPLE_FLEET, vehicleClass)
  return average > 0 ? average : FALLBACK_RATE
}

export function EarningsTeaser(): JSX.Element {
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>('Car')
  const [days, setDays] = useState(8)
  const [rate, setRate] = useState(() => String(averageRate('Car')))
  const [touched, setTouched] = useState(false)

  const suggested = averageRate(vehicleClass)
  const parsed = Number(rate)
  const safeRate =
    rate.trim() === '' || !Number.isFinite(parsed)
      ? 0
      : Math.min(MAX_RATE, Math.max(0, Math.round(parsed)))
  const result = estimateMonthly(safeRate, days)

  function changeClass(next: VehicleClass): void {
    setVehicleClass(next)
    setTouched(false)
    setRate(String(averageRate(next)))
  }

  return (
    <section className="card-flat p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Run the numbers</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
        Pick a class, pick how many days a month you would actually hand over the keys, and set the
        price you want. The whole rate is yours.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="teaser-class" className="label-micro block">
            Vehicle class
          </label>
          <select
            id="teaser-class"
            className="field mt-1.5"
            value={vehicleClass}
            onChange={(event) => changeClass(event.target.value as VehicleClass)}
          >
            {VEHICLE_CLASSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="teaser-days" className="label-micro flex items-baseline justify-between gap-2">
            <span>Days a month</span>
            <span className="num font-mono text-[13px] font-semibold tracking-normal text-ink">
              {days}
            </span>
          </label>
          <input
            id="teaser-days"
            type="range"
            min={MIN_DAYS}
            max={MAX_DAYS}
            step={1}
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="focusable mt-1.5 h-[48px] w-full cursor-pointer accent-emerald"
          />
        </div>

        <div>
          <label htmlFor="teaser-rate" className="label-micro block">
            Your price a day
          </label>
          <input
            id="teaser-rate"
            type="number"
            inputMode="numeric"
            min={MIN_RATE}
            max={MAX_RATE}
            step={1}
            value={rate}
            onChange={(event) => {
              setTouched(true)
              setRate(event.target.value)
            }}
            className="field num mt-1.5"
          />
        </div>
      </div>

      {touched && safeRate !== suggested ? (
        <button
          type="button"
          className="btn-ghost btn-sm mt-3"
          onClick={() => {
            setTouched(false)
            setRate(String(suggested))
          }}
        >
          Back to the sample {vehicleClass} average
        </button>
      ) : null}

      <div className="mt-5 rounded-xl border border-line bg-sand px-4 py-4">
        <p className="label-micro">Rough monthly estimate</p>
        <p
          data-testid="earnings-result"
          className="mt-1.5 text-[15px] leading-snug text-ink-muted sm:text-base"
        >
          {'at '}
          <span className="num font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {formatUSD(safeRate)}
          </span>
          {"/day that's ~"}
          <span className="num font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {formatUSD(result)}
          </span>
          {'/month'}
        </p>
        <p className="label-micro mt-3 normal-case tracking-[0.04em]">
          An estimate from the numbers you picked. Nothing is promised and nothing is charged.
        </p>
      </div>
    </section>
  )
}

export default EarningsTeaser

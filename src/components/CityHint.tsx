import { useEffect, useState } from 'react'
import { useReducedMotion } from '../lib/motion'
import { CITIES } from '../site.config'

/**
 * A3: the search card's own idle. The hint beside the Where label works through
 * the coast a city at a time, so the field suggests somewhere real to look
 * rather than sitting there empty.
 *
 * The city field is a select rather than a free text box, so this is a hint
 * next to the label rather than a placeholder inside the control: rewriting the
 * "All cities" option to say "Try Destin" would make the option lie about what
 * choosing it does. It is decorative, so it is hidden from assistive tech, and
 * it stops entirely once the visitor has chosen a city or asked for less motion.
 */

/** How long each city stays up. Slow enough to read, slow enough to ignore. */
const DWELL_MS = 3600

export function CityHint({ active }: { active: boolean }): JSX.Element | null {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!active || reduced) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % CITIES.length)
    }, DWELL_MS)
    return () => window.clearInterval(timer)
  }, [active, reduced])

  if (!active) return null

  const city = CITIES[index % CITIES.length]
  return (
    <span
      aria-hidden="true"
      data-testid="city-hint"
      className="label-micro ml-2 inline-flex items-center gap-1 normal-case tracking-normal text-ink-faint/85"
    >
      <span aria-hidden="true" className="text-emerald">
        &middot;
      </span>
      <span key={reduced ? 'static' : city} className={reduced ? '' : 'animate-hint-in'}>
        Try {city}
      </span>
    </span>
  )
}

export default CityHint

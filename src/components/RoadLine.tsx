import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../lib/motion'

/**
 * M1: a dashed road running down the page that fills as you scroll, with a small
 * top-view car travelling it. On desktop it sits in the left gutter; on phones
 * it collapses to a hairline centered behind the content so it never competes
 * with the text. Section labels dock onto it like mile markers.
 *
 * The whole thing is decorative: it is aria-hidden, and under reduced motion it
 * renders as a static, fully drawn road with the car parked at the top.
 */

export function RoadLine({ className }: { className?: string }): JSX.Element {
  const reduced = useReducedMotion()
  const [progress, setProgress] = useState(0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    if (reduced) {
      setProgress(1)
      return
    }
    const read = () => {
      frame.current = null
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      const next = scrollable > 0 ? window.scrollY / scrollable : 0
      setProgress(Math.min(1, Math.max(0, next)))
    }
    const onScroll = () => {
      if (frame.current !== null) return
      frame.current = window.requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [reduced])

  const pct = Math.round(progress * 1000) / 10

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-y-0 left-3 z-20 hidden w-8 lg:block ${className ?? ''}`}
    >
      <div className="relative h-full w-full">
        {/* The unfilled road */}
        <div
          className="absolute inset-y-8 left-1/2 w-[3px] -translate-x-1/2 rounded-full"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, rgba(15,46,40,0.16) 0 10px, transparent 10px 22px)',
          }}
        />
        {/* The filled road, growing with scroll */}
        <div
          className="absolute left-1/2 top-8 w-[3px] -translate-x-1/2 rounded-full"
          style={{
            height: `calc(${pct}% - 4rem)`,
            maxHeight: 'calc(100% - 4rem)',
            backgroundImage:
              'repeating-linear-gradient(to bottom, #0B7458 0 10px, transparent 10px 22px)',
            transition: reduced ? 'none' : 'height 120ms linear',
          }}
        />
        {/* The traveling car marker, seen from above */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: `calc(2rem + (${pct} / 100) * (100% - 4rem))`,
            transition: reduced ? 'none' : 'top 120ms linear',
          }}
        >
          <TopViewCar />
        </div>
      </div>
    </div>
  )
}

/** A tiny car seen from directly above, nose pointing down the road. */
export function TopViewCar({ size = 26 }: { size?: number }): JSX.Element {
  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 20 30"
      aria-hidden="true"
      focusable="false"
      className="drop-shadow-[0_2px_4px_rgba(47,36,20,0.28)]"
    >
      {/* body */}
      <rect x="3" y="1.5" width="14" height="27" rx="5.5" fill="#0B7458" />
      {/* roof and glass */}
      <rect x="5.2" y="8" width="9.6" height="10" rx="3" fill="#AEE5DC" />
      <path d="M5.6 7.4c1.2-2.1 2.6-3.1 4.4-3.1s3.2 1 4.4 3.1z" fill="#7FD4C8" />
      <path d="M5.6 22.2c1.2 2.1 2.6 3.1 4.4 3.1s3.2-1 4.4-3.1z" fill="#7FD4C8" />
      {/* mirrors */}
      <rect x="1.4" y="10.6" width="2" height="3" rx="1" fill="#085943" />
      <rect x="16.6" y="10.6" width="2" height="3" rx="1" fill="#085943" />
      {/* headlights */}
      <rect x="5.2" y="1.9" width="3" height="1.6" rx="0.8" fill="#FFC65C" />
      <rect x="11.8" y="1.9" width="3" height="1.6" rx="0.8" fill="#FFC65C" />
    </svg>
  )
}

/**
 * The phone counterpart: a hairline of road behind a section, no car. Cheap
 * enough to drop in anywhere and invisible on desktop where M1 already runs.
 */
export function RoadHairline({ className }: { className?: string }): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 lg:hidden ${className ?? ''}`}
      style={{
        backgroundImage:
          'repeating-linear-gradient(to bottom, rgba(15,46,40,0.10) 0 8px, transparent 8px 18px)',
      }}
    />
  )
}

/** A mile-marker label that docks onto the road line. */
export function MileMarker({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald" />
      <span className="label-micro">{children}</span>
    </span>
  )
}

export default RoadLine

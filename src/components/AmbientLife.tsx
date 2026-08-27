import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from '../lib/motion'

/**
 * A2, ambient life. The coast is not still, but it is not busy either, so this
 * is deliberately rationed.
 *
 * One actor is allowed on stage at a time and a gull crosses at most once per
 * forty seconds of active scrolling. Active is the operative word: the clock
 * only advances while scroll events are actually arriving, so a page left open
 * in a background tab never accumulates a debt of birds that all take off at
 * once when it is scrolled again. Anything the visitor cannot see is paused,
 * and none of it exists at all when less motion is asked for.
 */

/** Seconds of active scrolling between gulls. */
export const AMBIENT_GAP_MS = 40_000
/** How long one crossing takes, after which the stage is clear again. */
export const AMBIENT_FLIGHT_MS = 13_000
/** A single scroll event never contributes more than this to the clock. */
const MAX_STEP_MS = 250

export interface AmbientLifeProps {
  gapMs?: number
  flightMs?: number
}

export function AmbientLife({
  gapMs = AMBIENT_GAP_MS,
  flightMs = AMBIENT_FLIGHT_MS,
}: AmbientLifeProps): JSX.Element | null {
  const reduced = useReducedMotion()
  const [flight, setFlight] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const clock = useRef({ active: 0, last: 0, onStage: false, released: 0 })

  useEffect(() => {
    setHost(document.getElementById('ambient-layer'))
  }, [])

  useEffect(() => {
    if (reduced) return
    let timer: number | null = null

    const onScroll = () => {
      const state = clock.current
      const now = performance.now()
      const step = state.last === 0 ? 0 : Math.min(now - state.last, MAX_STEP_MS)
      state.last = now
      state.active += step
      if (state.onStage || state.active < gapMs) return

      state.active = 0
      state.onStage = true
      state.released += 1
      setFlight(state.released)
      timer = window.setTimeout(() => {
        clock.current.onStage = false
        setFlight(null)
      }, flightMs)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [reduced, gapMs, flightMs])

  // Off screen is off duty. The clock stops too, so a tab left in the
  // background does not come back owing a flock.
  useEffect(() => {
    if (reduced) return
    const sync = () => {
      const hidden = document.visibilityState === 'hidden'
      setPaused(hidden)
      if (hidden) clock.current.last = 0
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [reduced])

  if (reduced || flight === null) return null

  const gull = (
    <span
      key={flight}
      data-testid="ambient-gull"
      aria-hidden="true"
      className="absolute left-0 top-[22%] animate-gull-cross sm:top-[18%]"
      style={{ animationPlayState: paused ? 'paused' : 'running' }}
    >
      <svg width="30" height="14" viewBox="0 0 26 12" fill="none" focusable="false">
        <path
          d="M1 8c3.5 0 5.5-5 6.5-5S12 8 13 8s3-5 5.5-5S23.5 8 25 8"
          stroke="#0F2E28"
          strokeOpacity="0.26"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  )

  return host ? createPortal(gull, host) : gull
}

/**
 * The palm shadow that falls across one section edge. Unlike the gull this is
 * not an actor: it is weather, in the same family as the shimmer already on the
 * water, so it stays for as long as the section does and simply sways.
 */
export function PalmShadow({ className }: { className?: string }): JSX.Element | null {
  const reduced = useReducedMotion()
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (reduced) return
    const sync = () => setPaused(document.visibilityState === 'hidden')
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [reduced])

  if (reduced) return null

  return (
    <span
      data-testid="palm-shadow"
      aria-hidden="true"
      className={`pointer-events-none absolute -left-10 -top-6 hidden origin-top-left animate-sway md:block ${className ?? ''}`}
      style={{ animationPlayState: paused ? 'paused' : 'running' }}
    >
      <svg width="220" height="150" viewBox="0 0 220 150" fill="none" focusable="false">
        <g fill="#0F2E28" opacity="0.055">
          <path d="M2 6c46 2 84 18 112 46-30-14-58-20-84-18 28 8 52 22 72 44-30-16-58-24-84-24 26 12 46 30 60 54-34-26-66-42-96-48z" />
          <path d="M14 2c40 14 70 38 90 72-26-20-52-34-78-42 22 18 38 40 48 66-26-32-52-54-78-66z" />
        </g>
      </svg>
    </span>
  )
}

export default AmbientLife

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './motion'

/**
 * Counts a number up to its target once, on a short ease-out. Used only for
 * display figures that nothing asserts; anything with an exact expected value
 * (the earnings teaser, the calculator) is rendered directly instead.
 *
 * Under reduced motion it returns the target immediately.
 */
export function useCountUp(target: number, duration = 650): number {
  const reduced = useReducedMotion()
  const [value, setValue] = useState(target)
  const frame = useRef<number | null>(null)
  const from = useRef(target)

  useEffect(() => {
    if (reduced || typeof window === 'undefined' || !window.requestAnimationFrame) {
      setValue(target)
      return
    }
    const start = from.current
    if (start === target) return
    const t0 = performance.now()

    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      // ease-out cubic: fast first, settles gently
      const eased = 1 - Math.pow(1 - p, 3)
      const next = Math.round(start + (target - start) * eased)
      setValue(next)
      if (p < 1) {
        frame.current = window.requestAnimationFrame(step)
      } else {
        from.current = target
        frame.current = null
      }
    }
    frame.current = window.requestAnimationFrame(step)
    return () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current)
      from.current = target
    }
  }, [target, duration, reduced])

  return value
}

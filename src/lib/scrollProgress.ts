import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './motion'

/**
 * How far down the document the visitor has scrolled, 0 to 1.
 *
 * One reader, shared. The road line's car and the Coast Day's sun both hang off
 * this, which is the only reason they stay in step: two separate scroll
 * listeners drift apart under load, and the sun arriving somewhere the car has
 * not is exactly the kind of thing that reads as broken.
 *
 * Reads are coalesced into a single animation frame, so a fast scroll costs one
 * layout read per frame no matter how many listeners are attached.
 */
export function useScrollProgress(restingValue = 0): number {
  const reduced = useReducedMotion()
  const [progress, setProgress] = useState(reduced ? restingValue : 0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    if (reduced) {
      setProgress(restingValue)
      return
    }

    const read = () => {
      frame.current = null
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      const next = scrollable > 0 ? window.scrollY / scrollable : 0
      setProgress(next < 0 ? 0 : next > 1 ? 1 : next)
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
  }, [reduced, restingValue])

  return progress
}

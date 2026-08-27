import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { useReducedMotion } from '../lib/motion'

/**
 * E10: one reveal, shared by every section. Elements arrive on the same easing
 * and duration tokens declared in index.css, staggered by their order in the
 * group. Under reduced motion the element is simply already there - the CSS
 * forces the finished state, so nothing can be left invisible.
 */

export interface RevealProps {
  children: ReactNode
  /** Stagger step in ms, applied as index * step. */
  delay?: number
  as?: ElementType
  className?: string
}

export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className,
}: RevealProps): JSX.Element {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) {
      setShown(true)
      return
    }
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            observer.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [reduced])

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${shown ? 'reveal-in' : ''} ${className ?? ''}`}
      style={reduced ? undefined : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}

export default Reveal

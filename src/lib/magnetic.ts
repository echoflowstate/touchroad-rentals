import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './motion'

/**
 * E9: a primary button leans toward the cursor by a few pixels and springs back
 * when it leaves. Capped at 6px so it reads as a nudge rather than a toy, and
 * limited to devices with a fine pointer - on touch the element must not move
 * under a finger that is already on it.
 *
 * Returns a ref to attach and the transform style to spread onto the element.
 */
export function useMagnetic(strength = 6) {
  const ref = useRef<HTMLElement | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const reduced = useReducedMotion()
  const [fine, setFine] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setFine(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  useEffect(() => {
    const node = ref.current
    if (!node || reduced || !fine) return
    let frame: number | null = null

    const onMove = (event: PointerEvent) => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(() => {
        frame = null
        const rect = node.getBoundingClientRect()
        const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
        const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
        const clamp = (v: number) => Math.max(-1, Math.min(1, v)) * strength
        setOffset({ x: clamp(dx), y: clamp(dy) })
      })
    }
    const onLeave = () => setOffset({ x: 0, y: 0 })

    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerleave', onLeave)
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerleave', onLeave)
    }
  }, [reduced, fine, strength])

  const style =
    reduced || !fine
      ? undefined
      : {
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          transition:
            offset.x === 0 && offset.y === 0
              ? 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)'
              : 'transform 120ms ease-out',
        }

  return { ref, style }
}

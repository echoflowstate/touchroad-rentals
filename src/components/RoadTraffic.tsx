import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../lib/motion'

/**
 * The road, and the cars that drive along it.
 *
 * The cars are positioned from the road's own path rather than from keyframes
 * that approximate it. Two separately-timed CSS animations cannot stay in
 * register with a curve that stretches horizontally with the viewport - the
 * error grows as the window narrows - so a single animation frame computes the
 * x, the y on the path, and the local slope together. That makes the tyres sit
 * on the surface at every width by construction.
 *
 * Cost is one transform write per car per frame, and the loop is parked
 * whenever the hero is scrolled out of view or the visitor prefers less motion.
 */

const VB_W = 1440
const VB_H = 180

/** Road surface, and the dashed centre line that rides just under it. */
const SURFACE = 'M0 70C300 30 620 14 780 17c220 4 420 25 660 51'
const SURFACE_FILL = 'M0 70C300 30 620 14 780 17c220 4 420 25 660 51v112H0z'
const CENTRE = 'M0 84C300 44 620 28 780 31c220 4 420 25 660 51'


/**
 * The SURFACE curve sampled at even x intervals, used when SVG path geometry is
 * unavailable. Regenerate by walking the path in a browser if SURFACE changes.
 */
const SURFACE_SAMPLES: Array<[number, number]> = [
  [0, 70], [72, 60.9], [144, 52.7], [216, 45.4], [288, 38.8], [360, 33.1],
  [432, 28], [504, 23.8], [576, 20.4], [648, 18], [720, 16.7], [792, 17.2],
  [864, 19.4], [936, 22.7], [1008, 27.1], [1080, 32.4], [1152, 38.6],
  [1224, 45.4], [1296, 52.7], [1368, 60.2], [1440, 68],
]

interface Lane {
  /** Seconds for one full crossing. */
  period: number
  /** 1 drives left to right, -1 drives right to left. */
  direction: 1 | -1
  /** Extra px above the surface, so the far lane sits deeper into the scene. */
  lift: number
  /** How far the tyres sit below the surface line, in px. */
  sink: number
}

export function RoadTraffic({ style }: { style?: React.CSSProperties }): JSX.Element {
  const reduced = useReducedMotion()
  const hostRef = useRef<HTMLDivElement | null>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const nearRef = useRef<HTMLDivElement | null>(null)
  const farRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    const path = pathRef.current
    const near = nearRef.current
    const far = farRef.current
    if (!host || !path || !near || !far) return

    // Sample the surface once into a monotonic x -> y table, then look the car's
    // position up in it. getPointAtLength per frame would be needless work.
    // Not every environment implements SVG path geometry (jsdom does not), so
    // fall back to a baked sample of the same curve rather than throwing.
    const table: Array<{ x: number; y: number }> = []
    if (typeof path.getTotalLength === 'function' && typeof path.getPointAtLength === 'function') {
      const SAMPLES = 160
      const total = path.getTotalLength()
      for (let i = 0; i <= SAMPLES; i += 1) {
        const pt = path.getPointAtLength((total * i) / SAMPLES)
        table.push({ x: pt.x, y: pt.y })
      }
    } else {
      table.push(...SURFACE_SAMPLES.map(([x, y]) => ({ x, y })))
    }

    const yAt = (vbX: number): number => {
      if (vbX <= table[0].x) return table[0].y
      const last = table[table.length - 1]
      if (vbX >= last.x) return last.y
      let lo = 0
      let hi = table.length - 1
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (table[mid].x <= vbX) lo = mid
        else hi = mid
      }
      const a = table[lo]
      const b = table[hi]
      const f = b.x === a.x ? 0 : (vbX - a.x) / (b.x - a.x)
      return a.y + (b.y - a.y) * f
    }

    const lanes: Array<{ node: HTMLDivElement; lane: Lane }> = [
      { node: near, lane: { period: 17, direction: 1, lift: 0, sink: 6 } },
      { node: far, lane: { period: 27, direction: -1, lift: 34, sink: 4 } },
    ]

    if (reduced) {
      // Parked, but still correctly seated on the road.
      const width = host.clientWidth
      for (const { node, lane } of lanes) {
        const x = width * (lane.direction === 1 ? 0.18 : 0.74)
        place(node, lane, x, width)
      }
      return
    }

    function place(node: HTMLDivElement, lane: Lane, centreX: number, width: number) {
      const scale = width / VB_W
      const vbX = width === 0 ? 0 : (centreX / width) * VB_W
      // The svg is VB_H tall in both viewBox units and px, so y maps 1:1.
      const surfaceY = yAt(vbX)
      // local slope, in screen space, so the nose follows the camber
      const d = 12
      const slope =
        (yAt(Math.min(VB_W, vbX + d)) - yAt(Math.max(0, vbX - d))) /
        ((Math.min(VB_W, vbX + d) - Math.max(0, vbX - d)) * scale)
      const deg = (Math.atan(slope) * 180) / Math.PI
      const w = node.offsetWidth
      const h = node.offsetHeight
      const left = centreX - w / 2
      const top = surfaceY - lane.lift - h + lane.sink
      const flip = lane.direction === -1 ? ' scaleX(-1)' : ''
      node.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0) rotate(${deg.toFixed(2)}deg)${flip}`
    }

    let frame: number | null = null
    let running = true
    const t0 = performance.now()

    const tick = (now: number) => {
      if (!running) return
      const width = host.clientWidth
      for (const { node, lane } of lanes) {
        const w = node.offsetWidth
        const span = width + w * 2
        const progress = (((now - t0) / 1000) % lane.period) / lane.period
        const travelled = progress * span
        const centreX = lane.direction === 1 ? -w + travelled : width + w - travelled
        place(node, lane, centreX, width)
      }
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)

    // Stop the loop whenever the scene is not on screen.
    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && !running) {
              running = true
              frame = window.requestAnimationFrame(tick)
            } else if (!entry.isIntersecting && running) {
              running = false
              if (frame !== null) window.cancelAnimationFrame(frame)
            }
          }
        },
        { rootMargin: '80px' },
      )
      observer.observe(host)
    }

    return () => {
      running = false
      if (frame !== null) window.cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [reduced])

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-[180px]"
      style={style}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        focusable="false"
      >
        <path d={SURFACE_FILL} fill="#0F2E28" opacity="0.88" />
        <path
          d={CENTRE}
          fill="none"
          stroke="#FFF6E4"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="26 30"
          opacity="0.85"
        />
        {/* Measured against, never painted. */}
        <path ref={pathRef} d={SURFACE} fill="none" stroke="none" />
      </svg>

      <div
        ref={farRef}
        data-testid="road-car-far"
        className="absolute left-0 top-0 w-16 origin-bottom will-change-transform sm:w-20"
        style={{ opacity: 0.5 }}
      >
        <SideCar tone="far" spin={!reduced} />
      </div>

      <div
        ref={nearRef}
        data-testid="road-car-near"
        className="absolute left-0 top-0 w-28 origin-bottom will-change-transform sm:w-36 lg:w-44"
      >
        <span className={`block ${reduced ? '' : 'animate-car-bob'}`}>
          <SideCar spin={!reduced} />
        </span>
      </div>
    </div>
  )
}

/** A small side-on car in the brand palette, matching the silhouette family. */
export function SideCar({
  tone = 'near',
  spin = false,
}: {
  tone?: 'near' | 'far'
  spin?: boolean
}): JSX.Element {
  const body = tone === 'far' ? '#3FA694' : '#0B7458'
  const glass = tone === 'far' ? '#CFEFE8' : '#AEE5DC'
  return (
    <svg viewBox="0 0 200 90" aria-hidden="true" focusable="false" className="block w-full">
      <ellipse cx="100" cy="80" rx="74" ry="6" fill="#0F2E28" opacity="0.16" />
      <path
        d="M18 62c0-9 5-14 13-16l16-4 16-13c5-4 11-6 18-6h24c9 0 17 4 23 11l12 14 20 5c8 2 12 7 12 15v6c0 4-3 7-7 7H25c-4 0-7-3-7-7z"
        fill={body}
      />
      <path d="M69 33c3-3 7-4 11-4h20c7 0 13 3 18 9l8 9H60z" fill={glass} />
      <rect x="96" y="30" width="3" height="17" fill={body} opacity="0.7" />
      <rect x="24" y="52" width="12" height="6" rx="3" fill="#FFC65C" />
      <rect x="166" y="52" width="10" height="6" rx="3" fill="#F2542E" />
      {[58, 146].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="72" r="14" fill="#0F2E28" />
          <g
            className={spin ? 'animate-wheel-spin' : undefined}
            style={{ transformOrigin: `${cx}px 72px` }}
          >
            <circle cx={cx} cy="72" r="6" fill="#7FD4C8" />
            <rect
              x={cx - 0.9}
              y="64"
              width="1.8"
              height="16"
              rx="0.9"
              fill="#0F2E28"
              opacity="0.55"
            />
          </g>
        </g>
      ))}
    </svg>
  )
}

export default RoadTraffic

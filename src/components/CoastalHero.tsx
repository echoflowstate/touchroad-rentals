import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from '../lib/motion'
import { RoadTraffic } from './RoadTraffic'

/**
 * M3 / E1: the coastal scene behind the Browse hero, drawn entirely in code.
 *
 * Layers, back to front: a warm gradient sky, a sun disc with a slow glow, a
 * band of shimmering water, a sand foreground, and a road ribbon sweeping across
 * it that a small car drives in along once on load before settling near the
 * search card. On desktop the layers separate slightly under the pointer.
 *
 * Everything here is decoration, so the whole scene is aria-hidden and the
 * content that sits on top of it is a normal child.
 */

export function CoastalHero({
  children,
  sunPulse = 0,
}: {
  children: ReactNode
  /**
   * A3: bumped whenever the search card takes a set of dates. The sun gives one
   * small nod to say it heard, and only when it changes.
   */
  sunPulse?: number
}): JSX.Element {
  const reduced = useReducedMotion()
  const sceneRef = useRef<HTMLDivElement | null>(null)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [fine, setFine] = useState(false)

  // Pointer parallax is a desktop-with-a-mouse affordance only.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setFine(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  useEffect(() => {
    if (reduced || !fine) return
    const node = sceneRef.current
    if (!node) return
    let frame: number | null = null
    const onMove = (event: PointerEvent) => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(() => {
        frame = null
        const rect = node.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width - 0.5
        const y = (event.clientY - rect.top) / rect.height - 0.5
        setParallax({ x, y })
      })
    }
    const onLeave = () => setParallax({ x: 0, y: 0 })
    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerleave', onLeave)
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerleave', onLeave)
    }
  }, [reduced, fine])

  const layer = (depth: number): React.CSSProperties =>
    reduced || !fine
      ? {}
      : {
          transform: `translate3d(${parallax.x * depth}px, ${parallax.y * depth * 0.6}px, 0)`,
          transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
        }

  return (
    <div ref={sceneRef} className="relative isolate min-h-[620px] overflow-hidden pb-20 sm:pb-10 md:min-h-[720px] md:pb-0">
      {/* ---- the scene ---- */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {/*
          Sky, water and sand all read the Coast Day. The hero opens the page at
          dawn and warms as it is scrolled past, so the scene is never out of
          step with the light on the rest of the page. The fallbacks keep the
          original palette if the day is not running.
        */}
        <div
          data-day="sky"
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(178deg, #FFF6E6 0%, #FFEFD6 44%, #FDE6CD 74%, #F7F2E9 100%)',
          }}
        />

        {/* Sun with a soft pulsing glow */}
        <div
          className="absolute right-[8%] top-[11%] sm:right-[14%] sm:top-[18%]"
          style={layer(14)}
        >
          <div className="relative">
            <div
              data-day="glow-color"
              className={`absolute -inset-16 rounded-full blur-2xl ${
                reduced ? '' : 'animate-sun-pulse'
              }`}
              style={{ backgroundColor: 'rgba(255, 198, 92, 0.4)' }}
            />
            <div
              key={reduced ? 'sun' : `sun-${sunPulse}`}
              data-day="sun-color"
              data-testid="hero-sun"
              className={`relative h-16 w-16 rounded-full bg-gold sm:h-24 sm:w-24 ${
                reduced || sunPulse === 0 ? '' : 'animate-sun-ack'
              }`}
            />
          </div>
        </div>

        {/* Far water band */}
        <div
          className={`absolute inset-x-0 top-[58%] h-[15%] ${reduced ? '' : 'animate-water-bob'}`}
          style={layer(8)}
        >
          <div
            data-day="water"
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(180deg, #AEE5DC 0%, #3FA694 100%)',
            }}
          />
          {/* Glints on the water */}
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className={`absolute inset-0 h-full w-full ${reduced ? '' : 'animate-water-shimmer'}`}
            focusable="false"
          >
            <g fill="#FFF6E4" opacity="0.55">
              <rect x="120" y="34" width="90" height="4" rx="2" />
              <rect x="300" y="58" width="140" height="4" rx="2" />
              <rect x="560" y="30" width="70" height="4" rx="2" />
              <rect x="720" y="70" width="180" height="4" rx="2" />
              <rect x="1000" y="44" width="110" height="4" rx="2" />
              <rect x="1220" y="66" width="90" height="4" rx="2" />
            </g>
            <g fill="#FFC65C" opacity="0.5">
              <rect x="430" y="20" width="60" height="3" rx="1.5" />
              <rect x="880" y="36" width="90" height="3" rx="1.5" />
            </g>
          </svg>
        </div>

        {/* Shoreline foam */}
        <svg
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-[72%] h-[5%] w-full"
          focusable="false"
        >
          <path
            data-day="beach-fill"
            d="M0 30c160 22 320 22 480 4s320-26 480-6 300 26 480 14v24H0z"
            fill="#F7F2E9"
          />
          <path
            d="M0 30c160 22 320 22 480 4s320-26 480-6 300 26 480 14"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            opacity="0.8"
          />
        </svg>

        {/* Sand foreground */}
        <div
          data-day="beach"
          className="absolute inset-x-0 bottom-0 top-[70%]"
          style={{
            backgroundImage: 'linear-gradient(180deg, #F7F2E9 0%, #F3EADB 70%, #EFE7D8 100%)',
          }}
        />

        <RoadTraffic style={layer(3)} />

        {/* Gulls drifting across the sky */}
        {!reduced && (
          <>
            <Gull className="absolute left-0 top-[7%] animate-gull-drift" delay="0s" scale={1} />
            <Gull
              className="absolute left-0 top-[13%] animate-gull-drift"
              delay="-9s"
              scale={0.72}
            />
            <Gull
              className="absolute left-0 top-[18%] animate-gull-drift"
              delay="-17s"
              scale={0.55}
            />
          </>
        )}

        {/* Slow clouds, well behind everything else */}
        {!reduced && (
          <>
            <Cloud className="absolute left-0 top-[8%] animate-cloud-drift" delay="0s" width={150} />
            <Cloud
              className="absolute left-0 top-[30%] animate-cloud-drift"
              delay="-34s"
              width={104}
            />
          </>
        )}
      </div>

      {/* ---- the content riding on the scene ---- */}
      {children}
    </div>
  )
}

/** A gull: two strokes, which is all a bird needs at this distance. */
function Gull({
  className,
  delay,
  scale = 1,
}: {
  className?: string
  delay: string
  scale?: number
}): JSX.Element {
  return (
    <span className={className} style={{ animationDelay: delay }} aria-hidden="true">
      <svg
        width={26 * scale}
        height={12 * scale}
        viewBox="0 0 26 12"
        fill="none"
        focusable="false"
      >
        <path
          d="M1 8c3.5 0 5.5-5 6.5-5S12 8 13 8s3-5 5.5-5S23.5 8 25 8"
          stroke="#0F2E28"
          strokeOpacity="0.3"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  )
}

/** Soft cloud shapes, kept very light so they never compete with the copy. */
function Cloud({
  className,
  delay,
  width,
}: {
  className?: string
  delay: string
  width: number
}): JSX.Element {
  return (
    <span className={className} style={{ animationDelay: delay }} aria-hidden="true">
      <svg width={width} height={width * 0.4} viewBox="0 0 150 60" fill="none" focusable="false">
        <g fill="#FFFFFF" opacity="0.55">
          <ellipse cx="46" cy="38" rx="34" ry="16" />
          <ellipse cx="80" cy="30" rx="28" ry="19" />
          <ellipse cx="110" cy="40" rx="26" ry="14" />
        </g>
      </svg>
    </span>
  )
}

export default CoastalHero

/**
 * The lighter sibling used by the inner pages: warm sky, a sun in the corner and
 * a drifting road hint, with ink text rather than the full coastal scene. Keeps
 * How it works, Host, and Account in the same weather as Browse without
 * repeating the whole illustration.
 */
export function SunBand({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}): JSX.Element {
  const reduced = useReducedMotion()
  return (
    <section className={`relative isolate overflow-hidden ${className ?? ''}`}>
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(174deg, #FFF6E6 0%, #FFEEDA 46%, #F9F0E2 78%, #F7F2E9 100%)',
          }}
        />
        <div className="absolute right-[8%] top-[16%]">
          <div className="relative">
            <div
              className={`absolute -inset-12 rounded-full bg-gold/35 blur-2xl ${
                reduced ? '' : 'animate-sun-pulse'
              }`}
            />
            <div className="relative h-14 w-14 rounded-full bg-gold sm:h-20 sm:w-20" />
          </div>
        </div>
        {/* A road hint drifting across the base of the band */}
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-16 w-full"
          focusable="false"
        >
          <path
            d="M-40 96C260 58 560 44 860 52c220 6 380 20 620 40v28H-40z"
            fill="#0F2E28"
            opacity="0.08"
          />
          <path
            d="M-40 96C260 58 560 44 860 52c220 6 380 20 620 40"
            fill="none"
            stroke="#0B7458"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="20 26"
            opacity="0.35"
          />
        </svg>
      </div>
      {children}
    </section>
  )
}

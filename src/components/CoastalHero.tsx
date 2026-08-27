import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from '../lib/motion'

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

export function CoastalHero({ children }: { children: ReactNode }): JSX.Element {
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
    <div ref={sceneRef} className="relative isolate min-h-[620px] overflow-hidden md:min-h-[720px]">
      {/* ---- the scene ---- */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {/* Sky */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(178deg, #FFF6E6 0%, #FFEFD6 34%, #FDE6CD 58%, #F7F2E9 100%)',
          }}
        />

        {/* Sun with a soft pulsing glow */}
        <div
          className="absolute right-[8%] top-[11%] sm:right-[14%] sm:top-[18%]"
          style={layer(14)}
        >
          <div className="relative">
            <div
              className={`absolute -inset-16 rounded-full bg-gold/40 blur-2xl ${
                reduced ? '' : 'animate-sun-pulse'
              }`}
            />
            <div className="relative h-16 w-16 rounded-full bg-gold sm:h-24 sm:w-24" />
          </div>
        </div>

        {/* Far water band */}
        <div className="absolute inset-x-0 top-[58%] h-[15%]" style={layer(8)}>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, #AEE5DC 0%, #7FD4C8 55%, #3FA694 100%)',
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
          className="absolute inset-x-0 bottom-0 top-[75%]"
          style={{
            background: 'linear-gradient(180deg, #F7F2E9 0%, #F3EADB 62%, #EFE7D8 100%)',
          }}
        />

        {/* The road ribbon sweeping across the sand */}
        <div className="absolute inset-x-0 bottom-0 top-[80%]" style={layer(5)}>
          <svg
            viewBox="0 0 1440 240"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            focusable="false"
          >
            <path
              d="M-40 210C240 150 520 122 820 130c240 6 420 26 700 66v60H-40z"
              fill="#0F2E28"
              opacity="0.86"
            />
            <path
              d="M-40 218C240 158 520 130 820 138c240 6 420 26 700 66"
              fill="none"
              stroke="#FFF6E4"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="26 30"
              opacity="0.85"
            />
          </svg>
        </div>

        {/* The car that drives in once and settles */}
        <div
          className={`absolute bottom-[3%] left-[6%] w-24 sm:w-32 lg:w-40 ${
            reduced ? '' : 'animate-car-drive-in'
          }`}
          style={layer(3)}
        >
          <SideCar />
        </div>
      </div>

      {/* ---- the content riding on the scene ---- */}
      {children}
    </div>
  )
}

/** A small side-on car in the brand palette, matching the silhouette family. */
function SideCar(): JSX.Element {
  return (
    <svg viewBox="0 0 200 90" aria-hidden="true" focusable="false" className="w-full">
      <ellipse cx="100" cy="80" rx="74" ry="6" fill="#0F2E28" opacity="0.16" />
      <path
        d="M18 62c0-9 5-14 13-16l16-4 16-13c5-4 11-6 18-6h24c9 0 17 4 23 11l12 14 20 5c8 2 12 7 12 15v6c0 4-3 7-7 7H25c-4 0-7-3-7-7z"
        fill="#0B7458"
      />
      <path
        d="M69 33c3-3 7-4 11-4h20c7 0 13 3 18 9l8 9H60z"
        fill="#AEE5DC"
      />
      <rect x="96" y="30" width="3" height="17" fill="#0B7458" opacity="0.7" />
      <rect x="24" y="52" width="12" height="6" rx="3" fill="#FFC65C" />
      <rect x="166" y="52" width="10" height="6" rx="3" fill="#F2542E" />
      <g>
        <circle cx="58" cy="72" r="14" fill="#0F2E28" />
        <circle cx="58" cy="72" r="6" fill="#7FD4C8" />
        <circle cx="146" cy="72" r="14" fill="#0F2E28" />
        <circle cx="146" cy="72" r="6" fill="#7FD4C8" />
      </g>
    </svg>
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

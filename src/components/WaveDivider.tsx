/**
 * M2: every section boundary on the site is one of these. There are no hard
 * horizontal cuts anywhere - a band always dissolves into the next through a
 * soft curve, and the alternation runs sand -> white -> aqua and back.
 */

export type BandTone = 'sand' | 'white' | 'aqua' | 'ink'

const TONE_FILL: Record<BandTone, string> = {
  sand: '#F7F2E9',
  white: '#FFFFFF',
  aqua: '#EAF4F1',
  ink: '#0F2E28',
}

export interface WaveDividerProps {
  /** The band the wave is flowing into: this is the color the curve paints. */
  to: BandTone
  /** Flips the curve so successive dividers do not read as a repeat. */
  flip?: boolean
  /** Height of the curve in px. Smaller on phones by default. */
  height?: number
  className?: string
}

export function WaveDivider({
  to,
  flip = false,
  height = 64,
  className,
}: WaveDividerProps): JSX.Element {
  const fill = TONE_FILL[to]
  // Two stacked curves: a faint one behind gives the water some depth.
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative w-full leading-none ${className ?? ''}`}
      style={{ height }}
    >
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={flip ? { transform: 'scaleX(-1)' } : undefined}
        focusable="false"
      >
        <path
          d="M0 46c180 40 340 40 520 12s340-40 520-10 260 44 400 30v22H0z"
          fill={fill}
          opacity="0.45"
        />
        <path
          d="M0 62c190 32 350 26 530-2s330-42 500-16 270 38 410 26v30H0z"
          fill={fill}
        />
      </svg>
    </div>
  )
}

/**
 * A section wrapped in its band color, with the wave that carries the eye into
 * the next one already attached. Keeps every page from re-deriving the pattern.
 */
export interface BandProps {
  tone: BandTone
  next?: BandTone
  flip?: boolean
  children: React.ReactNode
  className?: string
  id?: string
}

export function Band({ tone, next, flip, children, className, id }: BandProps): JSX.Element {
  return (
    <>
      <section id={id} className={`band-${tone} ${className ?? ''}`}>
        {children}
      </section>
      {next ? <WaveDivider to={next} flip={flip} className={`band-${tone}`} /> : null}
    </>
  )
}

export default WaveDivider

/**
 * M2: every section boundary on the site is one of these. There are no hard
 * horizontal cuts anywhere - a band always dissolves into the next through a
 * soft curve, and the alternation runs sand -> white -> aqua and back.
 */

export type BandTone = 'sand' | 'white' | 'aqua' | 'ink'

const TONE_FILL: Record<BandTone, string> = {
  sand: 'rgba(247, 242, 233, 0.87)',
  white: 'rgba(255, 255, 255, 0.85)',
  aqua: 'rgba(234, 244, 241, 0.84)',
  ink: '#0F2E28',
}

/**
 * A1: the role the Coast Day paints this wave as, so a curve never hands over
 * to a band of a slightly different colour. Ink is night and stays put.
 */
const TONE_ROLE: Partial<Record<BandTone, string>> = {
  sand: 'fill-ground',
  white: 'fill-surface',
  aqua: 'fill-wash',
}

const TONE_ALPHA: Partial<Record<BandTone, string>> = {
  sand: '0.87',
  white: '0.85',
  aqua: '0.84',
}

export interface WaveDividerProps {
  /** The band the wave is flowing into: this is the color the curve paints. */
  to: BandTone
  /** Flips the curve so successive dividers do not read as a repeat. */
  flip?: boolean
  /** Height of the curve in px. Smaller on phones by default. */
  height?: number
  className?: string
  /**
   * A1: the Coast Day role for the band the wave is leaving, so the strip
   * behind the curve keeps up with the section above it.
   */
  wrapperDay?: string
  wrapperAlpha?: string
}

export function WaveDivider({
  to,
  flip = false,
  height = 64,
  className,
  wrapperDay,
  wrapperAlpha,
}: WaveDividerProps): JSX.Element {
  const fill = TONE_FILL[to]
  // Two stacked curves: a faint one behind gives the water some depth.
  return (
    <div
      aria-hidden="true"
      data-day={wrapperDay}
      data-day-alpha={wrapperAlpha}
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
          data-day={TONE_ROLE[to]}
          data-day-alpha={TONE_ALPHA[to]}
          d="M0 46c180 40 340 40 520 12s340-40 520-10 260 44 400 30v22H0z"
          fill={fill}
          opacity="0.45"
        />
        <path
          data-day={TONE_ROLE[to]}
          data-day-alpha={TONE_ALPHA[to]}
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

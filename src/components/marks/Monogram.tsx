import { MarkFrame, SMALL_AT, useMarkId, type MarkProps } from './frame'

/**
 * L2 "TR Monogram". The T's stem is a road seen in perspective: narrow where it
 * meets the crossbar, widening as it comes forward, with a centre line whose
 * dashes grow the same way. The R's leg leaves the bowl and sweeps out into a
 * cresting wave rather than landing as a straight diagonal.
 *
 * At small sizes the smallest centre-line dash is dropped and the rest fatten,
 * because three marks that size close up into a smear.
 */
export function Monogram({
  size = 40,
  className,
  badge = true,
  title,
}: MarkProps): JSX.Element {
  const uid = useMarkId('tr-l2')
  const small = size <= SMALL_AT

  return (
    <MarkFrame
      size={size}
      className={className}
      badge={badge}
      title={title}
      uid={uid}
      markKey="L2"
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF3DC" />
          <stop offset="100%" stopColor="#FDFBF7" />
        </linearGradient>
        <linearGradient id={`${uid}-road`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B7458" />
          <stop offset="100%" stopColor="#0F2E28" />
        </linearGradient>
        <linearGradient id={`${uid}-leg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F2E28" />
          <stop offset="62%" stopColor="#0B7458" />
          <stop offset="100%" stopColor="#3FA694" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="64" height="64" fill={`url(#${uid}-sky)`} />

      {/* A sun in the field behind the letters, the way it sits behind the
          horizon on the rest of the site. */}
      <circle cx="52" cy="13" r="7.5" fill="#FFC65C" opacity="0.9" />

      {/* T: crossbar, then the stem as a road coming forward. */}
      <rect x="4.5" y="11" width="27" height="9.4" rx="1.6" fill="#0F2E28" />
      <path d="M14.4 20.4h6.9l2.4 33.6h-11.7z" fill={`url(#${uid}-road)`} />
      <g fill="#FFF6E4">
        {!small && <rect x="17.1" y="24.5" width="1.6" height="3.2" rx="0.8" />}
        <rect x="16.8" y="32" width="2.3" height="4" rx="1.15" />
        <rect x="16.4" y="42.4" width="3.1" height="5.2" rx="1.55" />
      </g>

      {/* R: stem and bowl. */}
      <rect x="33.5" y="11" width="7.6" height="43" rx="1.4" fill="#0F2E28" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M39 11h11.4c5.9 0 10.1 3.9 10.1 9.2s-4.2 9.2-10.1 9.2H39zm3.6 5.8v6.8h7.6c2.6 0 4.2-1.4 4.2-3.4s-1.6-3.4-4.2-3.4z"
        fill="#0F2E28"
      />

      {/* The leg. It descends like an R's leg first, so the monogram still
          reads as TR, and only turns over into a crest at the very end. */}
      <path
        d="M43.4 29.4c3.2 6.4 6.6 11.8 10.6 15.8 2.2 2.2 4.2 2.6 6.2 1"
        fill="none"
        stroke={`url(#${uid}-leg)`}
        strokeWidth={small ? 8.4 : 7.6}
        strokeLinecap="round"
      />
      {/* The lip of the wave curling back over the foot of the leg. */}
      <path
        d="M54 45.2c2.4 2.4 4.4 3 6.2 1.8-.2 4.2-3.4 6-7.2 4.4 1-1.8 1.4-3.8 1-6.2z"
        fill="#AEE5DC"
      />
    </MarkFrame>
  )
}

export default Monogram

import { MarkFrame, SMALL_AT, useMarkId, type MarkProps } from './frame'

/**
 * L1 "Horizon". A disc holding the whole coast in section: warm sky at the top,
 * a half-set sun on the waterline, a band of Gulf, then beach, and a road
 * running out of the bottom edge to a vanishing point on the shore.
 *
 * The road needs sand on both sides of it or the silhouette stops reading as a
 * road and starts reading as a dark wedge, which is why the horizon sits high
 * and the water band stays thin. The centre line grows as the road comes
 * forward, and that perspective is the one detail that has to survive at 16px.
 */
export function Horizon({
  size = 40,
  className,
  badge = true,
  title,
}: MarkProps): JSX.Element {
  const uid = useMarkId('tr-l1')
  const small = size <= SMALL_AT

  return (
    <MarkFrame
      size={size}
      className={className}
      badge={badge}
      title={title}
      uid={uid}
      markKey="L1"
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF3DC" />
          <stop offset="100%" stopColor="#FDD9A9" />
        </linearGradient>
        <linearGradient id={`${uid}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#AEE5DC" />
          <stop offset="100%" stopColor="#3FA694" />
        </linearGradient>
        <linearGradient id={`${uid}-beach`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7EEDC" />
          <stop offset="100%" stopColor="#E8D9BC" />
        </linearGradient>
        <linearGradient id={`${uid}-road`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B7458" />
          <stop offset="100%" stopColor="#0F2E28" />
        </linearGradient>
        <clipPath id={`${uid}-disc`}>
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${uid}-disc)`}>
        <rect x="0" y="0" width="64" height="28" fill={`url(#${uid}-sky)`} />

        {/* The sun, half of it already below the waterline. */}
        <circle cx="32" cy="28" r={small ? 12 : 10.5} fill="#FFC65C" />

        <rect x="0" y="28" width="64" height="9" fill={`url(#${uid}-sea)`} />
        <rect x="0" y="27.2" width="64" height="1.6" fill="#FFF6E4" opacity="0.9" />
        <rect x="0" y="37" width="64" height="27" fill={`url(#${uid}-beach)`} />
        <rect x="0" y="36.4" width="64" height="1.2" fill="#FFFFFF" opacity="0.75" />

        {/* The road, converging on the point where it meets the shore. */}
        <path d="M32 37 52 64H12Z" fill={`url(#${uid}-road)`} />
        <g fill="#FFF6E4">
          {!small && <rect x="31.3" y="41.5" width="1.4" height="2.6" rx="0.7" />}
          <rect x="30.8" y="47" width="2.4" height="4" rx="1.2" />
          <rect x="30.1" y="54.5" width="3.8" height="5.8" rx="1.9" />
        </g>
      </g>

      <circle
        cx="32"
        cy="32"
        r="29.1"
        fill="none"
        stroke="#0F2E28"
        strokeOpacity="0.14"
        strokeWidth="1.8"
      />
    </MarkFrame>
  )
}

export default Horizon

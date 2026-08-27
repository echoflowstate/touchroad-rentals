import { MarkFrame, SMALL_AT, useMarkId, type MarkProps } from './frame'

/**
 * L3 "Key to the Coast". A key laid on its side: the head is a sun disc sitting
 * over a small wave crest, and the blade is a length of road with its dashed
 * centre line, notched along the bottom edge so the notches read as key teeth
 * and as road markings at the same time.
 *
 * The key silhouette is what carries the mark at 16px, so the head is large, the
 * blade is thick, and there are only two teeth.
 */
export function CoastKey({
  size = 40,
  className,
  badge = true,
  title,
}: MarkProps): JSX.Element {
  const uid = useMarkId('tr-l3')
  const small = size <= SMALL_AT

  return (
    <MarkFrame
      size={size}
      className={className}
      badge={badge}
      title={title}
      uid={uid}
      markKey="L3"
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF3DC" />
          <stop offset="100%" stopColor="#FDE8C8" />
        </linearGradient>
        <linearGradient id={`${uid}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7FD4C8" />
          <stop offset="100%" stopColor="#3FA694" />
        </linearGradient>
        <linearGradient id={`${uid}-blade`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0B7458" />
          <stop offset="100%" stopColor="#0F2E28" />
        </linearGradient>
        <clipPath id={`${uid}-head`}>
          <circle cx="21" cy="32" r="17" />
        </clipPath>
      </defs>

      {/* The blade first, so the head sits over the joint. */}
      <path
        d="M21 26.5h39.5v11H55V31h-4.5v6.5H45V31h-4.5v6.5H21z"
        fill={`url(#${uid}-blade)`}
      />
      {!small && (
        <path
          d="M27 29.6h25"
          stroke="#FFF6E4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="3 3.6"
          fill="none"
        />
      )}

      {/* The head: sun over water, held in a round bezel. */}
      <g clipPath={`url(#${uid}-head)`}>
        <rect x="4" y="15" width="34" height="34" fill={`url(#${uid}-sky)`} />
        <circle cx="21" cy="27.5" r={small ? 8.5 : 7.5} fill="#FFC65C" />
        <path
          d="M4 38.5c4.2-4.6 8.4-4.6 12.6 0s8.4 4.6 12.6 0c3 3.3 6 4.3 9 3v9H4z"
          fill={`url(#${uid}-sea)`}
        />
      </g>
      <circle
        cx="21"
        cy="32"
        r="16.1"
        fill="none"
        stroke="#0F2E28"
        strokeOpacity="0.16"
        strokeWidth="1.8"
      />
    </MarkFrame>
  )
}

export default CoastKey

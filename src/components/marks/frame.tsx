import { useId, type ReactNode } from 'react'

/**
 * A4, the logo studio. Three complete marks share this frame so they are drawn
 * on the same 64 unit field, clip to the same app-icon tile, and answer the same
 * props. Swapping one for another is a one-line change in the site config.
 *
 * Everything is code drawn. No mark needs an image file, and every one of them
 * has to survive being shrunk to 16 square, which is why the shapes stay few and
 * fat and the fine detail coarsens as the badge gets small.
 */

export interface MarkProps {
  /** Rendered size in px. The geometry is always 64 units square. */
  size?: number
  className?: string
  /** Draws the rounded app-icon tile behind the glyph. Off gives a bare mark. */
  badge?: boolean
  /** Supplying a title turns the mark into an image with that accessible name. */
  title?: string
}

/** Below this the marks drop their finest detail and fatten what is left. */
export const SMALL_AT = 28

/** Stable per-instance id prefix, safe to put inside url(#...). */
export function useMarkId(prefix: string): string {
  return `${prefix}-${useId().replace(/:/g, '')}`
}

export function MarkFrame({
  size = 40,
  className,
  badge = true,
  title,
  uid,
  markKey,
  children,
}: MarkProps & { uid: string; markKey: string; children: ReactNode }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      data-mark={markKey}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <clipPath id={`${uid}-tile`}>
          <rect x="0" y="0" width="64" height="64" rx={badge ? 15 : 0} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}-tile)`}>
        {badge ? <rect x="0" y="0" width="64" height="64" fill="#FDFBF7" /> : null}
        {children}
      </g>
      {badge ? (
        <rect
          x="0.75"
          y="0.75"
          width="62.5"
          height="62.5"
          rx="14.25"
          fill="none"
          stroke="#0F2E28"
          strokeOpacity="0.1"
          strokeWidth="1.5"
        />
      ) : null}
    </svg>
  )
}

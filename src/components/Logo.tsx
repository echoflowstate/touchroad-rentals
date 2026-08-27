import { useId } from 'react'
import { siteConfig } from '../site.config'

/**
 * The Touch Road mark, drawn in code so it stays crisp at every size and needs
 * no image file. A road ribbon sweeps up from the bottom left, carries a dashed
 * center line, and breaks into a cresting wave on the right; a sun disc sits in
 * the upper field. It has to read at 24px, so the shapes stay few and fat and
 * the dashes coarsen as the badge shrinks.
 */

export interface LogoMarkProps {
  size?: number
  className?: string
  /** Rounds the badge like an app icon. Off gives a bare glyph. */
  badge?: boolean
  title?: string
}

export function LogoMark({
  size = 40,
  className,
  badge = true,
  title,
}: LogoMarkProps): JSX.Element {
  // Stable per-instance ids so several marks on one page never collide and the
  // gradient references survive re-renders.
  const uid = `tr-mark-${useId().replace(/:/g, '')}`
  const small = size <= 28

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF3DC" />
          <stop offset="52%" stopColor="#FDE8C8" />
          <stop offset="100%" stopColor="#F7F2E9" />
        </linearGradient>
        <linearGradient id={`${uid}-wave`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7FD4C8" />
          <stop offset="100%" stopColor="#0B7458" />
        </linearGradient>
        <linearGradient id={`${uid}-road`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#0F2E28" />
          <stop offset="100%" stopColor="#0B7458" />
        </linearGradient>
        <clipPath id={`${uid}-clip`}>
          <rect x="0" y="0" width="64" height="64" rx={badge ? 15 : 0} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${uid}-clip)`}>
        {/* Warm sky field */}
        <rect x="0" y="0" width="64" height="64" fill={`url(#${uid}-sky)`} />

        {/* Sun disc in the upper field. It swells a little on hover, which is
            the only thing the mark does interactively. */}
        <circle
          cx="45.5"
          cy="17.5"
          r={small ? 8 : 7.5}
          fill="#FFC65C"
          className="origin-center transition-transform duration-500 ease-spring group-hover/logo:scale-110"
          style={{ transformOrigin: '45.5px 17.5px' }}
        />
        {!small && (
          <circle
            cx="45.5"
            cy="17.5"
            r="10.5"
            fill="#FFC65C"
            opacity="0.28"
            className="origin-center transition-transform duration-700 ease-spring group-hover/logo:scale-125"
            style={{ transformOrigin: '45.5px 17.5px' }}
          />
        )}

        {/* The cresting wave on the right, curling back on itself */}
        <path
          d="M64 46.5c-5.4 0-8.2-3.6-11.6-7.4-3.2-3.6-6.9-6.1-11.6-5.2-4 .8-6.3 3.7-7.2 7.2 2.5-2.1 5.3-2.6 8.1-1.2 2.6 1.3 4 3.6 6.2 6.1 2.9 3.3 6.6 5.9 11.5 6.2H64z"
          fill={`url(#${uid}-wave)`}
        />

        {/* Road ribbon sweeping from bottom left into the wave */}
        <path
          d="M-2 64c2.5-13 9-23.5 19.5-31C25.5 27.2 34 24.6 43 24.2l1.2 9.4c-7.6.3-14.4 2.4-20 6.5C16.6 45.9 11.6 53.9 9.6 64z"
          fill={`url(#${uid}-road)`}
        />

        {/* Dashed center line riding the ribbon */}
        <path
          d="M2.8 64C5.5 52.6 11.4 43.4 20.7 36.8c6.4-4.6 14-7.1 22.7-7.5"
          fill="none"
          stroke="#FFF6E4"
          strokeWidth={small ? 2.6 : 2}
          strokeLinecap="round"
          strokeDasharray={small ? '5 5' : '4 5'}
          opacity="0.95"
        />
      </g>

      {badge && (
        <rect
          x="0.75"
          y="0.75"
          width="62.5"
          height="62.5"
          rx="14.25"
          fill="none"
          stroke="#0F2E28"
          strokeOpacity="0.10"
          strokeWidth="1.5"
        />
      )}
    </svg>
  )
}

export interface LogoProps {
  /** Mark size in px; the wordmark scales with it. */
  size?: number
  className?: string
  /** Hide the words and show only the badge (tab bar, favicon, tight spots). */
  markOnly?: boolean
  /** Light wordmark for dark grounds. */
  tone?: 'ink' | 'light'
}

/**
 * Mark plus wordmark. "TOUCH ROAD" carries the weight, "RENTALS" sits beneath it
 * small and tracked, so the lockup stays legible when the mark is tiny.
 */
export function Logo({
  size = 36,
  className,
  markOnly = false,
  tone = 'ink',
}: LogoProps): JSX.Element {
  const [first, ...rest] = siteConfig.brandName.split(' ')
  const second = rest.slice(0, -1).join(' ')
  const third = rest[rest.length - 1] ?? ''
  const wordTone = tone === 'light' ? 'text-white' : 'text-ink'
  const subTone = tone === 'light' ? 'text-white/70' : 'text-emerald'

  if (markOnly) {
    return <LogoMark size={size} className={className} title={siteConfig.brandName} />
  }

  return (
    <span className={`group/logo inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <LogoMark size={size} />
      <span className="flex flex-col justify-center leading-none">
        <span
          className={`font-display font-extrabold uppercase leading-none tracking-[-0.01em] ${wordTone}`}
          style={{ fontSize: size * 0.44 }}
        >
          {first} {second}
        </span>
        <span
          className={`font-display font-bold uppercase leading-none ${subTone}`}
          style={{ fontSize: size * 0.235, letterSpacing: size * 0.052 }}
        >
          {third}
        </span>
      </span>
    </span>
  )
}

export default Logo

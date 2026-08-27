import { siteConfig } from '../site.config'
import { MARKS, type BrandMark, type MarkProps } from './marks'

/**
 * The brand lockup. The badge itself is whichever of the three logo studio
 * marks siteConfig.brandMark names, so every placement on the site - nav, tab
 * bar, footer, favicon set, social image - moves together when that one line
 * changes. Nothing here knows which mark it is drawing.
 */

export interface LogoMarkProps extends MarkProps {
  /** Overrides the configured mark. Only the logo sheet has any use for this. */
  mark?: BrandMark
}

export function LogoMark({ mark, ...props }: LogoMarkProps): JSX.Element {
  const Mark = MARKS[mark ?? siteConfig.brandMark]
  return <Mark {...props} />
}

export interface LogoProps {
  /** Mark size in px; the wordmark scales with it. */
  size?: number
  className?: string
  /** Hide the words and show only the badge (tab bar, favicon, tight spots). */
  markOnly?: boolean
  /** Light wordmark for dark grounds. */
  tone?: 'ink' | 'light'
  mark?: BrandMark
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
  mark,
}: LogoProps): JSX.Element {
  const [first, ...rest] = siteConfig.brandName.split(' ')
  const second = rest.slice(0, -1).join(' ')
  const third = rest[rest.length - 1] ?? ''
  const wordTone = tone === 'light' ? 'text-white' : 'text-ink'
  const subTone = tone === 'light' ? 'text-white/70' : 'text-emerald'

  if (markOnly) {
    return <LogoMark mark={mark} size={size} className={className} title={siteConfig.brandName} />
  }

  return (
    <span className={`group/logo inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <LogoMark mark={mark} size={size} />
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

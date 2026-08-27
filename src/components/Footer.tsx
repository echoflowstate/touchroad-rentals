import { Link } from 'react-router-dom'
import { siteConfig } from '../site.config'
import { Logo } from './Logo'
import { WaveDivider } from './WaveDivider'

const FOOTER_LINKS = [
  { to: '/', label: 'Browse' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/host', label: 'Host your car' },
  { to: '/account', label: 'Account' },
] as const

/**
 * The closing band. Deep sea ink rather than the old navy, entered through a
 * wave like every other boundary on the site.
 */
export function Footer() {
  const year = new Date().getFullYear()

  return (
    <>
      {/* The page waves straight into the footer rather than stopping at it. */}
      <div className="bg-sand">
        <WaveDivider to="ink" flip height={72} />
      </div>
      <footer className="bg-ink pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom,0px)+20px)] text-white/80 md:pb-0">
        <div className="shell py-12 md:py-16">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
            <div>
              <Logo size={42} tone="light" />

              <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/75">
                {siteConfig.neighborLine}
              </p>

              <p className="mt-6 font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-aqua">
                {siteConfig.comingSoon}
              </p>
            </div>

            <nav aria-label="Footer">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/60">
                Explore
              </p>
              <ul className="mt-4 space-y-1">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="focusable inline-flex min-h-[44px] items-center text-sm font-medium text-white/80 transition-colors hover:text-aqua"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-white/15 pt-6 text-[12px] leading-relaxed text-white/70 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {siteConfig.brandName} - preview build. Sample listings for demonstration. No real
              bookings, no payments.
            </p>
            <p className="font-mono text-[11px] tracking-wide text-white/70">{year}</p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Footer

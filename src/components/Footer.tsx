import { Link } from 'react-router-dom'
import { siteConfig } from '../site.config'

const FOOTER_LINKS = [
  { to: '/', label: 'Browse' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/host', label: 'Host your car' },
  { to: '/account', label: 'Account' },
] as const

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-navy md:mt-16 text-white/70 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom,0px)+20px)] md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-navy-700">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M4 17.5c4.2 0 5.1-11 8.4-11 3 0 3.2 6.4 7.6 6.4"
                    stroke="#5C8CFF"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <circle cx="19.2" cy="12.6" r="1.7" fill="#5C8CFF" />
                </svg>
              </span>
              <span className="font-display text-lg font-extrabold tracking-[-0.02em] text-white">
                {siteConfig.brandName}
              </span>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              {siteConfig.neighborLine}
            </p>

            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-brand-300">
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
                    className="focusable inline-flex min-h-[44px] items-center text-sm text-white/75 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-navy-600 pt-6 text-[12px] leading-relaxed text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {siteConfig.brandName} - preview build. Sample listings for demonstration. No real
            bookings, no payments.
          </p>
          <p className="font-mono text-[11px] tracking-wide text-white/60">{year}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useReducedMotion } from '../lib/motion'
import { siteConfig } from '../site.config'
import { useAppData } from '../state/AppState'
import { AuthSheet } from './AuthSheet'
import { Footer } from './Footer'
import { IconAccount, IconBrowse, IconHost, IconSteps } from './Icons'
import { PreviewRibbon } from './PreviewRibbon'

interface NavItem {
  to: string
  label: string
  tabLabel: string
  Icon: (p: { className?: string }) => JSX.Element
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Browse', tabLabel: 'Browse', Icon: IconBrowse },
  { to: '/how-it-works', label: 'How it works', tabLabel: 'How it', Icon: IconSteps },
  { to: '/host', label: 'Host your car', tabLabel: 'Host', Icon: IconHost },
  { to: '/account', label: 'Account', tabLabel: 'Account', Icon: IconAccount },
]

function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** The mark: a navy tile with a brand-blue road arc rolling toward a pin. */
function BrandMark() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path
          d="M4 17.5c4.2 0 5.1-11 8.4-11 3 0 3.2 6.4 7.6 6.4"
          stroke="#2E6BFF"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="19.2" cy="12.6" r="1.7" fill="#5C8CFF" />
      </svg>
    </span>
  )
}

function DesktopNav() {
  const { session, isSignedIn, openSignIn } = useAppData()
  const initial = session ? session.name.trim().charAt(0).toUpperCase() : ''

  return (
    <header
      data-testid="desktop-nav"
      className="sticky top-[29px] z-30 hidden border-b border-line bg-white/85 backdrop-blur md:block"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link to="/" className="focusable flex items-center gap-2.5 rounded-xl">
          <BrandMark />
          <span className="font-display text-[17px] font-extrabold tracking-[-0.02em] text-ink">
            {siteConfig.brandName}
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-auto">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cx(
                      'focusable relative inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium transition-colors',
                      isActive ? 'text-brand' : 'text-ink-muted hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{item.label}</span>
                      <span
                        aria-hidden="true"
                        className={cx(
                          'pointer-events-none absolute inset-x-3 bottom-1 h-0.5 origin-left rounded-full bg-brand transition-transform duration-200 ease-out',
                          isActive ? 'scale-x-100' : 'scale-x-0',
                        )}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center">
          {isSignedIn && session ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-navy py-1 pl-1 pr-3.5 text-[13px] font-semibold text-white">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand font-mono text-[11px] uppercase leading-none text-white">
                {initial}
              </span>
              <span className="max-w-[9rem] truncate">{session.name}</span>
            </span>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openSignIn()}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

function BottomTabs() {
  const reduced = useReducedMotion()

  return (
    <nav
      data-testid="bottom-tabs"
      aria-label="Primary tabs"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-600 bg-navy pb-[env(safe-area-inset-bottom,0px)] md:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {NAV_ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cx(
                  'focusable flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1 pb-2 pt-1.5 transition-colors',
                  isActive ? 'text-brand-300' : 'text-white/55',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={cx(
                      'h-[3px] w-6 rounded-full',
                      isActive ? 'bg-brand' : 'bg-transparent',
                      isActive && !reduced && 'animate-pop',
                    )}
                  />
                  <item.Icon className="h-6 w-6" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] leading-none">
                    {item.tabLabel}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface">
      <a
        href="#main"
        className="focusable sr-only left-3 top-9 z-50 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink shadow-card focus:not-sr-only focus:absolute"
      >
        Skip to content
      </a>

      <PreviewRibbon />
      <DesktopNav />

      <main
        id="main"
        className="flex-1 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom,0px)+16px)] md:pb-0"
      >
        {children}
      </main>

      <Footer />
      <BottomTabs />
      <AuthSheet />
    </div>
  )
}

export default AppShell

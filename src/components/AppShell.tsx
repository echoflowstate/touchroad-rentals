import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useReducedMotion } from '../lib/motion'
import { useAppData } from '../state/AppState'
import { AuthSheet } from './AuthSheet'
import { Footer } from './Footer'
import { IconAccount, IconBrowse, IconHost, IconSteps } from './Icons'
import { Logo } from './Logo'
import { PreviewRibbon } from './PreviewRibbon'
import { RoadLine } from './RoadLine'

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

function DesktopNav() {
  const { session, isSignedIn, openSignIn } = useAppData()
  const initial = session ? session.name.trim().charAt(0).toUpperCase() : ''

  return (
    <header
      data-testid="desktop-nav"
      data-day="ground"
      data-day-alpha="0.95"
      className="sticky top-[29px] z-30 hidden border-b border-line-soft bg-sand/95 backdrop-blur md:block"
    >
      <div className="shell flex h-[72px] items-center gap-6">
        <Link to="/" className="focusable flex items-center rounded-2xl" aria-label="Touch Road Rentals, home">
          <Logo size={40} />
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
                      'focusable relative inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold transition-colors duration-200',
                      isActive ? 'text-emerald' : 'text-ink-muted hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="font-display">{item.label}</span>
                      {/* E8: the underline grows from the left rather than blinking on. */}
                      <span
                        aria-hidden="true"
                        className={cx(
                          'pointer-events-none absolute inset-x-3 bottom-1.5 h-[3px] origin-left rounded-full bg-emerald transition-transform duration-300 ease-coast',
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
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald py-1 pl-1 pr-3.5 text-[13px] font-semibold text-white">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-deep font-mono text-[11px] uppercase leading-none text-white">
                {initial}
              </span>
              <span className="max-w-[9rem] truncate">{session.name}</span>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-glare btn-sm"
              onClick={() => openSignIn()}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

/**
 * E8: a floating rounded bar rather than a full-width slab, with an emerald pill
 * that slides under the active tab and an icon that bounces once on switch.
 */
function BottomTabs() {
  const reduced = useReducedMotion()
  const location = useLocation()
  const [bounceKey, setBounceKey] = useState(0)
  const previous = useRef(location.pathname)

  useEffect(() => {
    if (previous.current !== location.pathname) {
      previous.current = location.pathname
      setBounceKey((n) => n + 1)
    }
  }, [location.pathname])

  const activeIndex = NAV_ITEMS.findIndex((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to),
  )
  // A car detail route still belongs to the Browse tab.
  const pillIndex = activeIndex === -1 ? 0 : activeIndex

  return (
    <nav
      data-testid="bottom-tabs"
      aria-label="Primary tabs"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] md:hidden"
    >
      <div className="relative mx-auto max-w-md rounded-[26px] border border-line-soft bg-white/95 shadow-tabbar backdrop-blur">
        {/* The sliding emerald pill */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1.5 top-1.5 rounded-[20px] bg-emerald-tint"
          style={{
            width: `calc(${100 / NAV_ITEMS.length}% - 8px)`,
            left: `calc(${(pillIndex * 100) / NAV_ITEMS.length}% + 4px)`,
            transition: reduced ? 'none' : 'left 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
        <ul className="relative flex">
          {NAV_ITEMS.map((item, index) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cx(
                    'focusable flex min-h-[58px] w-full flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-2 transition-colors duration-200',
                    isActive || index === pillIndex ? 'text-emerald' : 'text-ink-muted',
                  )
                }
              >
                <span
                  key={index === pillIndex ? bounceKey : 'idle'}
                  aria-hidden="true"
                  className={cx(index === pillIndex && !reduced && 'animate-icon-bounce')}
                >
                  <item.Icon className="h-[22px] w-[22px]" />
                </span>
                <span className="font-mono text-[10px] uppercase leading-none tracking-[0.1em]">
                  {item.tabLabel}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="isolate flex min-h-[100dvh] flex-col bg-sand">
      {/*
        A1: the Coast Day paints here. It is a fixed layer at a negative z-index
        inside an isolated root, which puts it above the page ground and below
        every piece of content without any of them needing a stacking context of
        their own. Browse portals the scene in; every other route leaves it
        empty and the static palette stands.
      */}
      <div
        id="day-layer"
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
      />

      {/*
        A2: ambient actors go above the page rather than behind it. A gull
        drifting behind an opaque band is a gull nobody ever sees. It sits under
        the navigation and the tab bar and takes no pointer events.
      */}
      <div
        id="ambient-layer"
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
      />

      <a
        href="#main"
        className="focusable sr-only left-3 top-9 z-50 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink shadow-card focus:not-sr-only focus:absolute"
      >
        Skip to content
      </a>

      <PreviewRibbon />
      <DesktopNav />
      {/* M1: the road line runs the length of the page in the left gutter. */}
      <RoadLine />

      <main
        id="main"
        className="flex-1 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom,0px)+20px)] md:pb-0"
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

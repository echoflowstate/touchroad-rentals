import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  body: string
  action?: ReactNode
}

/**
 * E5: a beach umbrella planted in the sand with a small car parked beside it.
 * Drawn here so an empty grid still feels like the same coast rather than a
 * dead end, and so no icon set is needed.
 */
function BeachScene(): JSX.Element {
  return (
    <svg
      width="132"
      height="96"
      viewBox="0 0 132 96"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* sun */}
      <circle cx="104" cy="22" r="11" fill="#FFC65C" />
      <circle cx="104" cy="22" r="16" fill="#FFC65C" opacity="0.25" />

      {/* sand line */}
      <path
        d="M2 76c22 6 44 6 66 1s44-6 62 1"
        stroke="#E2D6C1"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* umbrella pole */}
      <path d="M40 34v44" stroke="#0F2E28" strokeWidth="3" strokeLinecap="round" />
      {/* umbrella canopy, coral and cream gores - sways from the top of the pole */}
      <g className="animate-sway" style={{ transformOrigin: '40px 36px' }}>
      <path d="M14 36c0-14 12-24 26-24s26 10 26 24z" fill="#FF6B4A" />
      <path d="M27 36c0-14 5.8-24 13-24s13 10 13 24z" fill="#FFF6E4" />
      <path
        d="M14 36c0-14 12-24 26-24s26 10 26 24"
        stroke="#0F2E28"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />

      </g>

      {/* small car parked to the right */}
      <g>
        <path
          d="M74 74c0-4 2-6 5-7l7-2 7-6c2-2 5-3 8-3h10c4 0 7 2 10 5l5 6 8 2c3 1 5 3 5 6v3c0 2-1 3-3 3H77c-2 0-3-1-3-3z"
          fill="#0B7458"
        />
        <path d="M97 58c1-1 3-2 5-2h9c3 0 6 1 8 4l3 4H92z" fill="#AEE5DC" />
        <circle cx="90" cy="80" r="6" fill="#0F2E28" />
        <circle cx="90" cy="80" r="2.5" fill="#7FD4C8" />
        <circle cx="120" cy="80" r="6" fill="#0F2E28" />
        <circle cx="120" cy="80" r="2.5" fill="#7FD4C8" />
      </g>
    </svg>
  )
}

export function EmptyState({ title, body, action }: EmptyStateProps): JSX.Element {
  return (
    <div
      data-testid="empty-state"
      className="card-flat mx-auto flex max-w-xl flex-col items-center px-6 py-12 text-center"
    >
      <div className="grid place-items-center rounded-3xl bg-sand px-6 py-4">
        <BeachScene />
      </div>
      <h2 className="mt-6 max-w-md font-display text-xl font-extrabold leading-snug tracking-[-0.02em] text-ink">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

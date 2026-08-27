import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  body: string
  action?: ReactNode
}

/** A road running to a horizon dot, drawn here so no icon set is needed. */
function RoadGlyph(): JSX.Element {
  return (
    <svg width="46" height="46" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M13.5 40.5 19.5 14h9l6 26.5"
        stroke="#5C8CFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 18.5v3.4M24 26.4v3.4M24 34.3v3.4"
        stroke="#8FB0FF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="9" r="3.2" stroke="#2E6BFF" strokeWidth="2" />
    </svg>
  )
}

export function EmptyState({ title, body, action }: EmptyStateProps): JSX.Element {
  return (
    <div
      data-testid="empty-state"
      className="card-flat mx-auto flex max-w-xl flex-col items-center px-6 py-12 text-center"
    >
      <div
        className="grid h-24 w-24 place-items-center rounded-2xl"
        style={{ background: 'linear-gradient(158deg, #0a0f1c 0%, #182440 100%)' }}
      >
        <RoadGlyph />
      </div>
      <h2 className="mt-6 max-w-md font-display text-xl font-bold leading-snug text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

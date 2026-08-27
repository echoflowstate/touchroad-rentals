import type { ReactNode } from 'react'

interface IconProps {
  className?: string
}

/**
 * One drawing surface for every glyph so weight, size, and a11y stay identical.
 * Sizing classes passed via className win over the width/height attributes.
 */
function Glyph({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  )
}

export function IconBrowse({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M5.6 13.2 7.1 8.7a2.2 2.2 0 0 1 2.1-1.5h5.6a2.2 2.2 0 0 1 2.1 1.5l1.5 4.5" />
      <rect x="3.4" y="13.2" width="17.2" height="5" rx="1.6" />
      <path d="M6.7 15.8h1.7" />
      <path d="M15.6 15.8h1.7" />
    </Glyph>
  )
}

export function IconSteps({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="5" cy="6.3" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="5" cy="17.7" r="1.5" />
      <path d="M5 7.8v2.7" />
      <path d="M5 13.5v2.7" />
      <path d="M9.6 6.3h10.4" />
      <path d="M9.6 12h7.4" />
      <path d="M9.6 17.7h10.4" />
    </Glyph>
  )
}

export function IconHost({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="8.6" cy="8.6" r="3.9" />
      <path d="m11.4 11.4 8.1 8.1" />
      <path d="m15.3 15.3 2.1-2.1" />
      <path d="m17.7 17.7 1.9-1.9" />
    </Glyph>
  )
}

export function IconAccount({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="8.4" r="3.6" />
      <path d="M4.9 19.6a7.1 7.1 0 0 1 14.2 0" />
    </Glyph>
  )
}

export function IconCheck({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="m5 12.6 4.4 4.4L19 7.4" />
    </Glyph>
  )
}

export function IconClose({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M6.4 6.4l11.2 11.2" />
      <path d="M17.6 6.4 6.4 17.6" />
    </Glyph>
  )
}

export function IconSearch({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="10.8" cy="10.8" r="6.2" />
      <path d="m15.4 15.4 4.2 4.2" />
    </Glyph>
  )
}

export function IconChevronLeft({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M14.6 5.4 8 12l6.6 6.6" />
    </Glyph>
  )
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="m9.4 5.4 6.6 6.6-6.6 6.6" />
    </Glyph>
  )
}

export function IconSeat({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M8.2 4.8a2 2 0 0 1 2 1.7l1 6.9" />
      <path d="M7 13.4h9a2.4 2.4 0 0 1 2.4 2.4v3.4" />
    </Glyph>
  )
}

export function IconGear({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.4v2.3" />
      <path d="M12 18.3v2.3" />
      <path d="M20.6 12h-2.3" />
      <path d="M5.7 12H3.4" />
      <path d="m18.1 5.9-1.7 1.7" />
      <path d="m7.6 16.4-1.7 1.7" />
      <path d="m18.1 18.1-1.7-1.7" />
      <path d="M7.6 7.6 5.9 5.9" />
    </Glyph>
  )
}

export function IconFuel({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M5.6 20.4h9.6" />
      <path d="M7 20.4V6a1.8 1.8 0 0 1 1.8-1.8h3.6A1.8 1.8 0 0 1 14.2 6v14.4" />
      <path d="M7 11h7.2" />
      <path d="M14.2 9.4h2.6a1.6 1.6 0 0 1 1.6 1.6v4.5a1.6 1.6 0 0 0 3.2 0V9.2l-2.2-2.2" />
    </Glyph>
  )
}

export function IconPin({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M12 20.6s6.6-5.5 6.6-10.1a6.6 6.6 0 1 0-13.2 0c0 4.6 6.6 10.1 6.6 10.1Z" />
      <circle cx="12" cy="10.3" r="2.4" />
    </Glyph>
  )
}

export function IconTrash({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M4.8 6.8h14.4" />
      <path d="M9.4 6.8V5.4A1.4 1.4 0 0 1 10.8 4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.4" />
      <path d="m6.7 6.8.8 12a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5l.8-12" />
      <path d="M10.4 10.6v6" />
      <path d="M13.6 10.6v6" />
    </Glyph>
  )
}

export function IconPencil({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M4.8 19.2h3.4L19 8.4a2.4 2.4 0 0 0-3.4-3.4L4.8 15.8Z" />
      <path d="m14.6 6 3.4 3.4" />
    </Glyph>
  )
}

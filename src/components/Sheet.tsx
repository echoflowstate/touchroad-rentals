import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from '../lib/motion'
import { IconClose } from './Icons'

export interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableWithin(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true',
  )
}

/**
 * Bottom sheet on phones, centered dialog from md up. Shared by the sign-in
 * sheet, the request confirmation, and the listing editors.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps): JSX.Element | null {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const reduced = useReducedMotion()
  const titleId = useId()

  // The element that opened the sheet has to be captured before React commits
  // autofocus, otherwise an autofocused field inside the panel records itself
  // as the return target and focus lands on nothing when the sheet closes.
  useLayoutEffect(() => {
    if (!open) return
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
  }, [open])

  // Move focus in on open, hand it back on close. An autofocused field inside
  // the panel keeps focus - the panel only claims it when nothing else has.
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (panel && !panel.contains(document.activeElement)) panel.focus()

    return () => {
      const previous = returnFocusRef.current
      returnFocusRef.current = null
      if (previous && document.contains(previous) && document.body.contains(previous)) {
        previous.focus()
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return
      const items = focusableWithin(panel)
      if (items.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (!(active instanceof HTMLElement) || !panel.contains(active) || active === panel) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
        return
      }
      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  // sheet-up slides on the phone layout; the centered desktop panel is already
  // transformed into place, so it fades instead.
  const panelMotion = reduced ? '' : 'animate-sheet-up md:animate-fade-in'

  return createPortal(
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`sheet-backdrop ${reduced ? '' : 'animate-fade-in'}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`sheet-panel flex max-h-[88vh] flex-col overflow-hidden focus:outline-none ${panelMotion}`}
      >
        <div aria-hidden="true" className="flex shrink-0 justify-center pt-3 md:hidden">
          <span className="h-1.5 w-10 rounded-full bg-navy/15" />
        </div>

        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-4 md:pt-6">
          <h2 id={titleId} className="font-display text-xl font-extrabold leading-tight text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focusable -mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>

        {footer ? (
          <div className="shrink-0 border-t border-line px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </>,
    document.body,
  )
}

export default Sheet

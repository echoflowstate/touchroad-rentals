import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../lib/motion'

/**
 * The confirmation banner.
 *
 * Two places ask the visitor to stand behind a location before the product acts
 * on it: choosing where to search, and agreeing where the keys change hands.
 * Both use this, so the question is asked the same way twice.
 *
 * It is an alertdialog rather than a live region because it is asking for a
 * decision, not announcing one, and the decision is what unblocks the flow. It
 * does not trap focus: the banner sits in the page next to the control it is
 * about, and moving focus to Confirm is enough to make it reachable without
 * stealing the page from someone who wants to change their mind instead.
 */

export interface ConfirmBannerProps {
  open: boolean
  /** The question, exactly as it should read. */
  question: string
  /** What is actually being confirmed, in the visitor's own terms. */
  detail?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  /** Ties the banner to the control it is about, for assistive tech. */
  id?: string
  className?: string
}

export function ConfirmBanner({
  open,
  question,
  detail,
  confirmLabel = 'Yes, confirm',
  cancelLabel = 'Change it',
  onConfirm,
  onCancel,
  id,
  className,
}: ConfirmBannerProps): JSX.Element | null {
  const reduced = useReducedMotion()
  const confirmRef = useRef<HTMLButtonElement | null>(null)

  // A question nobody can reach is not a question. Focus lands on Confirm so
  // the keyboard answer is Enter, and Escape is the same as changing your mind.
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => confirmRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      role="alertdialog"
      aria-labelledby={`${id ?? 'confirm'}-question`}
      aria-describedby={detail ? `${id ?? 'confirm'}-detail` : undefined}
      data-testid="confirm-banner"
      className={`relative overflow-hidden rounded-2xl border border-coral/40 bg-coral-tint px-4 py-3.5 shadow-card ${
        reduced ? '' : 'animate-banner-in'
      } ${className ?? ''}`}
    >
      {/* A coral edge, so the banner reads as a stop rather than a notice. */}
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-coral" />

      <div className="flex flex-col gap-3 pl-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className={`mt-0.5 shrink-0 ${reduced ? '' : 'animate-pin-drop'}`}
          >
            <PinGlyph />
          </span>
          <div className="min-w-0">
            <p
              id={`${id ?? 'confirm'}-question`}
              className="font-display text-[15px] font-bold leading-snug text-ink"
            >
              {question}
            </p>
            {detail ? (
              <p
                id={`${id ?? 'confirm'}-detail`}
                className="mt-0.5 text-[13px] leading-relaxed text-coral-text"
              >
                {detail}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            data-testid="confirm-banner-cancel"
            onClick={onCancel}
            className="btn-ghost btn-sm"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            data-testid="confirm-banner-confirm"
            onClick={onConfirm}
            className="btn-primary btn-sm btn-glare"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/** A map pin, drawn to match the weight of the rest of the icon set. */
function PinGlyph(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" focusable="false">
      <path
        d="M12 2.6c3.9 0 7 3.1 7 7 0 4.9-7 11.8-7 11.8S5 14.5 5 9.6c0-3.9 3.1-7 7-7z"
        fill="#F2542E"
      />
      <circle cx="12" cy="9.5" r="2.7" fill="#FFEDE7" />
    </svg>
  )
}

export default ConfirmBanner

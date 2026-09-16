import { createPortal } from 'react-dom'
import { useReducedMotion } from '../lib/motion'
import { useAppData } from '../state/AppState'

/**
 * Short confirmations for things that happen without a page change: switching
 * sides, confirming a location, marking a car collected.
 *
 * One at a time, portaled to the body so no transformed ancestor can pull it
 * out of the viewport, and announced politely rather than assertively: these
 * report that something worked, they do not interrupt.
 */
export function ToastHost(): JSX.Element | null {
  const { toasts, dismissToast } = useAppData()
  const reduced = useReducedMotion()

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tab-bar-total)+12px)] z-[70] flex justify-center px-4 md:bottom-6 md:justify-end md:pr-6"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-testid="toast"
          data-tone={toast.tone}
          className={`pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3 shadow-lift ${
            toast.tone === 'coral' ? 'bg-coral text-ink' : 'bg-ink text-white'
          } ${reduced ? '' : 'animate-toast-in'}`}
        >
          <span
            aria-hidden="true"
            className={`h-2 w-2 shrink-0 rounded-full ${
              toast.tone === 'coral' ? 'bg-coral-graphic' : 'bg-aqua'
            }`}
          />
          <p className="text-[13px] font-semibold leading-snug">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="focusable -mr-1 ml-1 shrink-0 rounded-lg px-1.5 py-1 text-[11px] font-bold uppercase tracking-wider opacity-70 transition-opacity hover:opacity-100"
          >
            Close
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}

export default ToastHost

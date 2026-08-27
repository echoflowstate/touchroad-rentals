import { siteConfig } from '../site.config'

/**
 * The one line that never leaves the screen. It is the honesty of the whole
 * preview, so it is never conditional and never dismissible. In the coastal
 * system it reads as a warm sand chip with sea-ink text rather than a dark bar.
 */
export function PreviewRibbon() {
  return (
    <div
      data-testid="preview-ribbon"
      className="sticky top-0 z-40 overflow-hidden border-b border-line bg-sand-200/90 backdrop-blur"
    >
      <p className="shell flex h-7 items-center justify-center gap-2 text-center font-mono text-[11px] leading-none tracking-wide text-ink">
        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
        {siteConfig.previewRibbon}
      </p>
    </div>
  )
}

export default PreviewRibbon

import { siteConfig } from '../site.config'

/**
 * The one line that never leaves the screen. It is the honesty of the whole
 * preview, so it is never conditional and never dismissible.
 */
export function PreviewRibbon() {
  return (
    <div
      data-testid="preview-ribbon"
      className="sticky top-0 z-40 overflow-hidden border-b border-brand bg-navy"
    >
      <p className="mx-auto flex h-7 max-w-6xl items-center justify-center px-3 text-center font-mono text-[11px] leading-none tracking-wide text-white/80">
        {siteConfig.previewRibbon}
      </p>
    </div>
  )
}

export default PreviewRibbon

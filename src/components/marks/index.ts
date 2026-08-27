import { CoastKey } from './CoastKey'
import { Horizon } from './Horizon'
import { Monogram } from './Monogram'
import type { MarkProps } from './frame'

export type { MarkProps } from './frame'
export { CoastKey } from './CoastKey'
export { Horizon } from './Horizon'
export { Monogram } from './Monogram'

/** The three candidate marks. siteConfig.brandMark names the one that ships. */
export type BrandMark = 'L1' | 'L2' | 'L3'

export const MARKS: Record<BrandMark, (props: MarkProps) => JSX.Element> = {
  L1: Horizon,
  L2: Monogram,
  L3: CoastKey,
}

export const MARK_NAMES: Record<BrandMark, string> = {
  L1: 'Horizon',
  L2: 'TR Monogram',
  L3: 'Key to the Coast',
}

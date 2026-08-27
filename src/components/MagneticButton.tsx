import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useMagnetic } from '../lib/magnetic'

/**
 * E9: a primary call to action that leans toward the cursor by at most 6px and
 * springs back, paired with the sun-glare sweep from `.btn-glare`. Both are
 * pointer-and-motion gated inside the hook and the stylesheet, so on a touch
 * screen and under reduced motion this is an ordinary button.
 */
export interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function MagneticButton({
  children,
  className,
  ...rest
}: MagneticButtonProps): JSX.Element {
  const { ref, style } = useMagnetic(6)

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      className={`btn-glare ${className ?? ''}`}
      style={style}
      {...rest}
    >
      {children}
    </button>
  )
}

export default MagneticButton

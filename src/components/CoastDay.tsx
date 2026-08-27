import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { lightAt, paintFor, RESTING_PROGRESS, sunTransform, type DayRole } from '../lib/coastDay'
import { useReducedMotion } from '../lib/motion'
import { AmbientLife } from './AmbientLife'

/**
 * A1, the Coast Day. The Home page runs through one day of light as it is
 * scrolled: dawn at the hero, late morning into noon across the fleet, the warm
 * part of the afternoon at the price band, and early dusk by the footer.
 *
 * Anything that belongs to the scene says so with a data-day attribute naming
 * its role, and this paints it. That indirection is what lets the sky, the
 * water, every band ground, the wave between two bands, the navigation and the
 * card shadows all move together without any of them knowing about scroll.
 *
 * It paints elements rather than publishing custom properties on the document
 * root because root custom properties are inherited by every node: writing them
 * every frame invalidated the whole document and, under a 6x CPU throttle, took
 * scrolling from 16.7ms a frame to 166.8. Nothing here holds React state
 * either, so a fast scroll costs one layout read and a short list of style
 * writes per frame and never a re-render.
 */

const CARD_SELECTOR = '[data-day], .card'
/** The sun and its glow, which move every frame while their colour does not. */
/** The sun and its glow, which move every frame while their colour does not. */
const TRAVELLERS = '[data-day="sun"], [data-day="glow"]'

/*
 * Three findings from measuring the moving light under a 6x CPU throttle, two
 * of them against the usual advice.
 *
 * A 64px CSS blur on the glow cost a whole frame interval every time the sun
 * moved; multi-stop radial gradient stops give the same softness for nothing.
 * will-change: transform on the sun and its glow made scrolling slower rather
 * than faster, because they sit behind the entire page and promoting them
 * forces everything painting above them to be re-composited. And folding the
 * sun into the sky element's own gradient, which sounds like it should be free
 * since that gradient is repainted anyway, was worse still: it turns a small
 * moving element into a full viewport radial gradient rasterised every frame.
 *
 * A small disc, a 380px halo of gradient stops, no compositor hints.
 */

/**
 * The card shadow moves in steps rather than continuously. Repainting the drop
 * shadow of every card on the page each frame cost a whole frame interval under
 * a 6x CPU throttle, and it buys nothing: the shadow changes slowly, .card
 * already transitions box-shadow over 300ms, and ten steps across the page
 * blend into a shadow that simply lengthens as the day goes on.
 */
const SHADOW_STEPS = 10

export function CoastDay(): JSX.Element | null {
  const reduced = useReducedMotion()
  const [host, setHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setHost(document.getElementById('day-layer'))
  }, [])

  useEffect(() => {
    if (!host) return
    const root = document.documentElement
    let targets: HTMLElement[] = []
    let travellers: HTMLElement[] = []
    const touched = new Set<HTMLElement>()

    const collect = () => {
      targets = Array.from(document.querySelectorAll<HTMLElement>(CARD_SELECTOR))
      travellers = Array.from(document.querySelectorAll<HTMLElement>(TRAVELLERS))
    }

    let shadowStep = -1

    const apply = (progress: number) => {
      const light = lightAt(progress)
      const nextShadowStep = Math.round(progress * SHADOW_STEPS)
      const paintShadows = nextShadowStep !== shadowStep
      shadowStep = nextShadowStep

      for (const element of targets) {
        const role = (element.dataset.day ?? 'card') as DayRole
        if (role === 'card' && !paintShadows) continue
        const alpha = Number(element.dataset.dayAlpha ?? '1')
        const paint = paintFor(role, light, Number.isFinite(alpha) ? alpha : 1)
        if (paint.style) {
          for (const key of Object.keys(paint.style)) {
            element.style.setProperty(kebab(key), paint.style[key])
          }
        }
        if (paint.attr) {
          for (const key of Object.keys(paint.attr)) element.setAttribute(key, paint.attr[key])
        }
        touched.add(element)
      }
      const transform = sunTransform(light, window.innerWidth, window.innerHeight)
      for (const element of travellers) {
        element.style.transform = transform
        touched.add(element)
      }

      // Nothing in the stylesheet selects on these, so writing them is free and
      // it gives the day a name that a test or a screenshot can read back.
      root.dataset.dayPhase = light.label
      root.dataset.dayProgress = light.progress.toFixed(3)
    }

    const clear = () => {
      for (const element of touched) {
        element.style.removeProperty('background')
        element.style.removeProperty('background-image')
        element.style.removeProperty('background-color')
        element.style.removeProperty('box-shadow')
        element.style.removeProperty('opacity')
        element.style.removeProperty('left')
        element.style.removeProperty('top')
        element.style.removeProperty('transform')
      }
      touched.clear()
      delete root.dataset.dayPhase
      delete root.dataset.dayProgress
    }

    // The results grid re-renders whenever a filter changes, so the target list
    // is rebuilt when the tree does rather than re-queried on every frame.
    let dirty = false
    const observer =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(() => {
            dirty = true
          })
    observer?.observe(document.body, { childList: true, subtree: true })

    collect()

    // Less motion means one steady late morning rather than a moving day.
    if (reduced) {
      apply(RESTING_PROGRESS)
      // The grid still arrives after the first paint, so catch it once.
      const settle = window.setTimeout(() => {
        collect()
        apply(RESTING_PROGRESS)
      }, 120)
      return () => {
        window.clearTimeout(settle)
        observer?.disconnect()
        clear()
      }
    }

    let frame: number | null = null
    const read = () => {
      frame = null
      if (dirty) {
        dirty = false
        collect()
        // New cards need the current shadow, so force one pass.
        shadowStep = -1
      }
      const scrollable = root.scrollHeight - window.innerHeight
      apply(scrollable > 0 ? window.scrollY / scrollable : 0)
    }
    const onScroll = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(read)
    }

    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    // The first frames of the page still have cards arriving; keep up with them
    // until the tree settles.
    const settle = window.setInterval(read, 200)
    const stopSettling = window.setTimeout(() => window.clearInterval(settle), 2000)

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.clearInterval(settle)
      window.clearTimeout(stopSettling)
      observer?.disconnect()
      clear()
    }
  }, [reduced, host])

  if (!host) return null

  return createPortal(
    <div data-testid="coast-day" className="absolute inset-0 overflow-hidden">
      <div
        data-day="sky"
        data-testid="coast-day-sky"
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(178deg, #FFE9DC 0%, #FFDCC4 44%, #FDF1E4 74%, #FAF2E7 100%)',
        }}
      />

      {/* The halo is the expensive layer, so phones get the disc alone. */}
      <div
        data-day="glow"
        aria-hidden="true"
        className="absolute left-0 top-0 hidden h-[380px] w-[380px] rounded-full sm:block"
      />
      <div
        data-day="sun"
        data-testid="coast-day-sun"
        aria-hidden="true"
        className="absolute left-0 top-0 h-24 w-24 rounded-full sm:h-32 sm:w-32"
      />

      {/* The first star, which only ever arrives at the very end of the day. */}
      <div
        data-day="star"
        data-testid="coast-day-star"
        aria-hidden="true"
        className="absolute left-[16%] top-[13%] opacity-0 sm:left-[24%]"
      >
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" focusable="false">
          <circle cx="13" cy="13" r="9" fill="#FFFFFF" opacity="0.35" />
          <path
            d="M13 3c.7 6 3.3 8.6 9.3 9.3-6 .7-8.6 3.3-9.3 9.3-.7-6-3.3-8.6-9.3-9.3C9.7 11.6 12.3 9 13 3z"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      <AmbientLife />
    </div>,
    host,
  )
}

/** backgroundColor -> background-color, so setProperty accepts it. */
function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

export default CoastDay

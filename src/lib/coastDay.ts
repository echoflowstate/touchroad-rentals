/**
 * A1, the Coast Day. One day of light laid over the length of the Home page.
 *
 * Scroll progress runs 0 to 1 and the light runs dawn to early dusk with it.
 * Everything here is pure: it takes a progress value and returns the colours,
 * the sun's place in the sky and the shape of the shadows at that moment. The
 * component layer does nothing but hand these to CSS custom properties.
 *
 * Two rules govern the palette. The arc is continuous and calm, so consecutive
 * stops are close together and the blend between them is eased rather than
 * linear. And every ground stays light enough that ink, muted ink and emerald
 * hold AA on it at any point in the day, which is measured rather than assumed.
 */

export interface DayStop {
  /** Scroll progress this stop describes. */
  at: number
  label: string
  /** Sky gradient, top to bottom. */
  sky: [string, string, string]
  /** The page ground. */
  ground: string
  /** Raised surfaces: cards, and the white band. */
  surface: string
  /** The aqua band. */
  wash: string
  /** The water in the hero scene. */
  water: [string, string]
  /** The beach in the hero scene. */
  beach: string
  sunColor: string
  glow: string
  /** 0 sits the sun on the horizon, 1 puts it at the top of its arc. */
  altitude: number
  /** Shadows lengthen and cool at the ends of the day. */
  shadow: { y: number; blur: number; alpha: number; rgb: string }
  /** How much the coral accent is allowed to strengthen. */
  warm: number
  /** The first star, which only ever shows at the very end. */
  star: number
}

/**
 * Dawn through early dusk. The order matches the way the Home page reads: the
 * hero opens the day, the fleet runs through late morning into noon, the price
 * band sits in the warm part of the afternoon, and the footer closes at dusk.
 */
export const DAY: DayStop[] = [
  {
    at: 0,
    label: 'Dawn',
    sky: ['#FFE9DC', '#FFDCC4', '#FDF1E4'],
    ground: '#FAF2E7',
    surface: '#FFFCF7',
    wash: '#F1F1E9',
    water: ['#BEDFDE', '#5FAFA8'],
    beach: '#F6EDDF',
    sunColor: '#FFB877',
    glow: 'rgba(255, 168, 108, 0.42)',
    altitude: 0.1,
    shadow: { y: 15, blur: 34, alpha: 0.13, rgb: '58, 68, 92' },
    warm: 0.34,
    star: 0,
  },
  {
    at: 0.3,
    label: 'Late morning',
    sky: ['#EAF4FA', '#FFF6E9', '#F8F3EA'],
    ground: '#F7F2E9',
    surface: '#FFFFFF',
    wash: '#EAF4F1',
    water: ['#AEE5DC', '#3FA694'],
    beach: '#F3EADB',
    sunColor: '#FFD37E',
    glow: 'rgba(255, 208, 126, 0.32)',
    altitude: 0.74,
    shadow: { y: 8, blur: 20, alpha: 0.08, rgb: '47, 36, 20' },
    warm: 0.14,
    star: 0,
  },
  {
    at: 0.5,
    label: 'Bright noon',
    sky: ['#DDEFF9', '#FDFAF1', '#F7F2E9'],
    ground: '#F8F4ED',
    surface: '#FFFFFF',
    wash: '#E5F3EF',
    water: ['#A6E6E0', '#31A498'],
    beach: '#F4ECDF',
    sunColor: '#FFE9AC',
    glow: 'rgba(255, 232, 172, 0.26)',
    altitude: 1,
    shadow: { y: 5, blur: 14, alpha: 0.07, rgb: '47, 36, 20' },
    warm: 0.08,
    star: 0,
  },
  {
    at: 0.68,
    label: 'High afternoon',
    sky: ['#E4F0F6', '#FFF4E3', '#F7F2E9'],
    ground: '#F8F1E5',
    surface: '#FFFDFA',
    wash: '#E9F3EE',
    water: ['#ACE2D8', '#3CA08F'],
    beach: '#F3E9D8',
    sunColor: '#FFDA8E',
    glow: 'rgba(255, 214, 138, 0.3)',
    altitude: 0.72,
    shadow: { y: 8, blur: 20, alpha: 0.08, rgb: '52, 40, 22' },
    warm: 0.2,
    star: 0,
  },
  {
    at: 0.85,
    label: 'Golden hour',
    sky: ['#FFE6C4', '#FFD2A4', '#FAEEDF'],
    ground: '#F9EFDD',
    surface: '#FFFBF3',
    wash: '#F2EFE2',
    water: ['#C6DFCF', '#6BA898'],
    beach: '#F5E8D0',
    sunColor: '#FF9E52',
    glow: 'rgba(255, 148, 74, 0.4)',
    altitude: 0.2,
    shadow: { y: 14, blur: 30, alpha: 0.12, rgb: '96, 62, 30' },
    warm: 1,
    star: 0,
  },
  {
    at: 1,
    label: 'Early dusk',
    sky: ['#F0D8CE', '#E7C7C6', '#F4E7DE'],
    ground: '#F5ECE6',
    surface: '#FEFAF6',
    wash: '#ECE9E4',
    water: ['#B9CBD2', '#5D7F87'],
    beach: '#EFE3D6',
    sunColor: '#FF8A5C',
    glow: 'rgba(226, 122, 96, 0.34)',
    altitude: 0.02,
    shadow: { y: 17, blur: 36, alpha: 0.13, rgb: '62, 56, 84' },
    warm: 0.7,
    star: 1,
  },
]

/** The state the page settles on when the visitor prefers less motion. */
export const RESTING_PROGRESS = 0.3

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

/** Eased blend, so no two stops ever hand over with a visible edge. */
function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseHex(a)
  const pb = parseHex(b)
  const to = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${to(pa[0] + (pb[0] - pa[0]) * t)}${to(pa[1] + (pb[1] - pa[1]) * t)}${to(pa[2] + (pb[2] - pa[2]) * t)}`
}

function parseHex(value: string): [number, number, number] {
  const hex = value.replace('#', '')
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ]
}

/** rgba() strings blend channel by channel, alpha included. */
function mixRGBA(a: string, b: string, t: number): string {
  const pa = parseRGBA(a)
  const pb = parseRGBA(b)
  const mix = pa.map((value, index) => value + (pb[index] - value) * t)
  return `rgba(${Math.round(mix[0])}, ${Math.round(mix[1])}, ${Math.round(mix[2])}, ${mix[3].toFixed(3)})`
}

function parseRGBA(value: string): [number, number, number, number] {
  const parts = value.replace(/rgba?\(|\)/g, '').split(',').map((part) => Number(part.trim()))
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1]
}

function mixNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export interface DayLight extends Omit<DayStop, 'at'> {
  progress: number
  /** Where the sun sits, as percentages of the viewport. */
  sunLeft: number
  sunTop: number
  /** Radius of the sun and its halo, in px. */
  glowRadius: number
}

/** The light at a given scroll progress. */
export function lightAt(progress: number): DayLight {
  const p = clamp01(progress)
  let lower = DAY[0]
  let upper = DAY[DAY.length - 1]
  for (let i = 0; i < DAY.length - 1; i += 1) {
    if (p >= DAY[i].at && p <= DAY[i + 1].at) {
      lower = DAY[i]
      upper = DAY[i + 1]
      break
    }
  }
  const span = upper.at - lower.at
  const t = span === 0 ? 0 : smooth((p - lower.at) / span)

  const altitude = mixNumber(lower.altitude, upper.altitude, t)
  return {
    progress: p,
    label: t < 0.5 ? lower.label : upper.label,
    sky: [
      mixHex(lower.sky[0], upper.sky[0], t),
      mixHex(lower.sky[1], upper.sky[1], t),
      mixHex(lower.sky[2], upper.sky[2], t),
    ],
    ground: mixHex(lower.ground, upper.ground, t),
    surface: mixHex(lower.surface, upper.surface, t),
    wash: mixHex(lower.wash, upper.wash, t),
    water: [
      mixHex(lower.water[0], upper.water[0], t),
      mixHex(lower.water[1], upper.water[1], t),
    ],
    beach: mixHex(lower.beach, upper.beach, t),
    sunColor: mixHex(lower.sunColor, upper.sunColor, t),
    glow: mixRGBA(lower.glow, upper.glow, t),
    altitude,
    shadow: {
      y: mixNumber(lower.shadow.y, upper.shadow.y, t),
      blur: mixNumber(lower.shadow.blur, upper.shadow.blur, t),
      alpha: mixNumber(lower.shadow.alpha, upper.shadow.alpha, t),
      rgb: mixHex(`#${rgbToHex(lower.shadow.rgb)}`, `#${rgbToHex(upper.shadow.rgb)}`, t)
        .replace('#', ''),
    },
    warm: mixNumber(lower.warm, upper.warm, t),
    star: mixNumber(lower.star, upper.star, t),
    // The sun crosses the sky left to right and rides a shallow arc, both from
    // the one progress value that also drives the road line's car.
    sunLeft: 8 + p * 78,
    sunTop: 74 - altitude * 58,
    // A low sun sits bigger and softer than a high one.
    glowRadius: 210 - altitude * 60,
  }
}

function rgbToHex(rgb: string): string {
  return rgb
    .split(',')
    .map((part) => Number(part.trim()).toString(16).padStart(2, '0'))
    .join('')
}

function hexToRGB(hex: string): string {
  const [r, g, b] = parseHex(hex.length === 6 ? `#${hex}` : hex)
  return `${r}, ${g}, ${b}`
}

/** A day colour at a given opacity, so a band can be laid over the sky. */
/** The same rgba colour at a fraction of its own opacity. */
function fade(rgba: string, factor: number): string {
  const [r, g, b, a] = parseRGBA(rgba)
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${(a * factor).toFixed(3)})`
}

export function withAlpha(hex: string, alpha: number): string {
  return alpha >= 1 ? hex : `rgba(${hexToRGB(hex)}, ${alpha})`
}

/** The card shadow at this point in the day: long and cool at both ends. */
export function shadowCSS(light: DayLight): string {
  const rgb = hexToRGB(light.shadow.rgb)
  return `0 1px 2px rgba(${rgb}, ${(light.shadow.alpha * 0.5).toFixed(3)}), 0 ${light.shadow.y.toFixed(1)}px ${light.shadow.blur.toFixed(1)}px rgba(${rgb}, ${light.shadow.alpha.toFixed(3)})`
}

/**
 * What each part of the scene should look like right now.
 *
 * The Coast Day paints these onto the elements that carry a data-day attribute
 * rather than publishing custom properties on the document root. Root custom
 * properties are inherited by every node, so changing eighteen of them on every
 * scroll frame invalidates the computed style of the whole document: measured
 * under a 6x CPU throttle that took the Home page from 16.7ms a frame to 166.8.
 * Painting the twenty or so elements that are actually part of the scene keeps
 * the invalidation where it belongs.
 */
export type DayRole =
  | 'sky'
  | 'sun'
  | 'glow'
  | 'ground'
  | 'surface'
  | 'wash'
  | 'water'
  | 'beach'
  | 'beach-fill'
  | 'fill-ground'
  | 'fill-surface'
  | 'fill-wash'
  | 'sun-color'
  | 'glow-color'
  | 'star'
  | 'card'

/**
 * The sun and its glow are placed with a transform rather than with left and
 * top, so moving them is a compositor job and never a layout one.
 */
export function sunTransform(light: DayLight, width: number, height: number): string {
  const x = (light.sunLeft / 100) * width
  const y = (light.sunTop / 100) * height
  return `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`
}

export interface Paint {
  /** Inline style properties to set. */
  style?: Record<string, string>
  /** SVG presentation attributes to set. */
  attr?: Record<string, string>
}

export function paintFor(role: DayRole, light: DayLight, alpha: number): Paint {
  switch (role) {
    case 'sky':
      return {
        style: {
          backgroundImage: `linear-gradient(178deg, ${light.sky[0]} 0%, ${light.sky[1]} 44%, ${light.sky[2]} 74%, ${light.ground} 100%)`,
        },
      }
    case 'sun':
      return { style: { backgroundColor: light.sunColor } }
    case 'glow':
      // Stops rather than a CSS blur. A 64px filter on this element cost a
      // whole frame interval under a 6x CPU throttle every time the sun moved;
      // a multi-stop radial gradient gives the same soft falloff for nothing.
      return {
        style: {
          backgroundImage: `radial-gradient(closest-side, ${light.glow} 0%, ${fade(light.glow, 0.55)} 34%, ${fade(light.glow, 0.2)} 62%, ${fade(light.glow, 0)} 100%)`,
        },
      }
    case 'ground':
      return { style: { backgroundColor: withAlpha(light.ground, alpha) } }
    case 'surface':
      return { style: { backgroundColor: withAlpha(light.surface, alpha) } }
    case 'wash':
      return { style: { backgroundColor: withAlpha(light.wash, alpha) } }
    case 'water':
      return {
        style: {
          backgroundImage: `linear-gradient(180deg, ${light.water[0]} 0%, ${light.water[1]} 100%)`,
        },
      }
    case 'beach':
      return {
        style: {
          backgroundImage: `linear-gradient(180deg, ${light.ground} 0%, ${light.beach} 70%, ${light.beach} 100%)`,
        },
      }
    case 'beach-fill':
      return { attr: { fill: light.beach } }
    case 'fill-ground':
      return { attr: { fill: withAlpha(light.ground, alpha) } }
    case 'fill-surface':
      return { attr: { fill: withAlpha(light.surface, alpha) } }
    case 'fill-wash':
      return { attr: { fill: withAlpha(light.wash, alpha) } }
    case 'sun-color':
      return { style: { backgroundColor: light.sunColor } }
    case 'glow-color':
      return { style: { backgroundColor: light.glow } }
    case 'star':
      return { style: { opacity: light.star.toFixed(3) } }
    case 'card':
      return { style: { boxShadow: shadowCSS(light) } }
    default:
      return {}
  }
}

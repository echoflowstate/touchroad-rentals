import type { VehicleClass } from '../types'

export interface VehicleSilhouetteProps {
  vehicleClass: VehicleClass
  variant?: 'card' | 'hero'
  className?: string
}

/**
 * Every class is drawn in the same 400x200 profile frame, facing left, with the
 * tires resting on GROUND. Road vehicles share one wheel radius; the cart keeps
 * the same ground line on purposely smaller wheels so it never reads as a car.
 */
const GROUND = 174
const WHEEL_CY = 152
const WHEEL_R = 22
const CART_R = 15
const CART_CY = GROUND - CART_R

const BODY_TOP = '#C9D6F5'
const GLASS = '#5C8CFF'
const TIRE = '#0a0f1c'
const HUB = '#22314f'
const SEAM = '#1F53D8'

interface ShapeProps {
  fill: string
}

function Wheel({ cx, cy = WHEEL_CY, r = WHEEL_R }: { cx: number; cy?: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TIRE} />
      <circle cx={cx} cy={cy} r={r * 0.4} fill={HUB} />
    </g>
  )
}

function Shadow({ from, to }: { from: number; to: number }) {
  return (
    <ellipse
      cx={(from + to) / 2}
      cy={GROUND + 6}
      rx={(to - from) / 2}
      ry={6}
      fill="#000"
      opacity={0.18}
    />
  )
}

function Glass({ d, opacity = 0.55 }: { d: string; opacity?: number }) {
  return <path d={d} fill={GLASS} fillOpacity={opacity} />
}

function Seam({ d, width = 2.5, color = SEAM, opacity = 0.3 }: { d: string; width?: number; color?: string; opacity?: number }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeOpacity={opacity}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

function CarShape({ fill }: ShapeProps) {
  return (
    <g>
      <Shadow from={46} to={357} />
      <Wheel cx={110} />
      <Wheel cx={298} />
      <path
        d="M46 152 L46 138 Q46 124 62 120 L122 111 L158 84 Q163 80 171 80 L242 80 Q250 80 254 85 L288 116 L340 122 Q357 125 357 140 L357 152 L324 152 A26 26 0 0 0 272 152 L136 152 A26 26 0 0 0 84 152 Z"
        fill={fill}
      />
      <Glass d="M133 108 L163 87 L240 87 L268 109 Z" />
      <Seam d="M199 88 L199 147" />
      <Seam d="M50 128 L62 126" width={4} color={BODY_TOP} opacity={0.7} />
    </g>
  )
}

function SuvShape({ fill }: ShapeProps) {
  return (
    <g>
      <Shadow from={44} to={358} />
      <Wheel cx={108} />
      <Wheel cx={300} />
      <path
        d="M44 142 L44 121 Q44 110 58 106 L110 99 L137 68 Q141 63 149 63 L336 63 Q349 63 352 73 L358 106 L358 142 L326 142 A26 26 0 0 0 274 142 L134 142 A26 26 0 0 0 82 142 Z"
        fill={fill}
      />
      <Seam d="M152 59 L332 59" width={3} color={BODY_TOP} opacity={0.75} />
      <Glass d="M124 97 L149 70 L330 70 L336 97 Z" />
      <Seam d="M196 72 L196 138" />
      <Seam d="M262 72 L262 138" />
    </g>
  )
}

function TruckShape({ fill }: ShapeProps) {
  return (
    <g>
      <Shadow from={40} to={356} />
      <Wheel cx={104} />
      <Wheel cx={306} />
      <path
        d="M40 146 L40 124 Q40 112 55 108 L104 100 L130 70 Q134 66 142 66 L218 66 Q226 66 226 74 L226 120 L240 120 L240 106 L356 106 L356 146 L332 146 A26 26 0 0 0 280 146 L130 146 A26 26 0 0 0 78 146 Z"
        fill={fill}
      />
      <Glass d="M120 98 L141 74 L218 74 L218 98 Z" />
      <Seam d="M186 76 L186 142" />
      <Seam d="M250 117 L348 117" />
      <Seam d="M44 128 L56 126" width={4} color={BODY_TOP} opacity={0.7} />
    </g>
  )
}

function VanShape({ fill }: ShapeProps) {
  return (
    <g>
      <Shadow from={36} to={362} />
      <Wheel cx={96} />
      <Wheel cx={312} />
      <path
        d="M36 150 L36 126 Q36 112 50 106 L88 92 L106 62 Q110 56 120 56 L348 56 Q361 56 362 68 L362 150 L338 150 A26 26 0 0 0 286 150 L122 150 A26 26 0 0 0 70 150 Z"
        fill={fill}
      />
      <Glass d="M98 94 L117 66 L340 66 L340 94 Z" />
      <Seam d="M152 68 L152 146" />
      <Seam d="M200 68 L200 146" />
      <Seam d="M206 104 L340 104" opacity={0.22} />
    </g>
  )
}

function ConvertibleShape({ fill }: ShapeProps) {
  return (
    <g>
      <Shadow from={46} to={357} />
      <Wheel cx={110} />
      <Wheel cx={298} />
      <path
        d="M46 152 L46 138 Q46 124 62 120 L124 111 L150 106 L166 124 L240 124 L252 103 L292 110 L340 121 Q357 125 357 140 L357 152 L324 152 A26 26 0 0 0 272 152 L136 152 A26 26 0 0 0 84 152 Z"
        fill={fill}
      />
      {/* folded top stacked behind the seats */}
      <path d="M246 108 Q272 92 302 110 Z" fill={fill} />
      <Seam d="M250 106 L298 109" opacity={0.28} />
      <rect x={194} y={90} width={17} height={34} rx={8} fill={fill} />
      <rect x={216} y={90} width={17} height={34} rx={8} fill={fill} />
      {/* windshield frame standing on its own, no roof */}
      <Glass d="M152 104 L176 81 L192 81 L192 104 Z" opacity={0.5} />
      <Seam d="M150 105 L175 79 L193 79" width={4.5} color={BODY_TOP} opacity={0.9} />
    </g>
  )
}

function GolfCartShape({ fill }: ShapeProps) {
  return (
    <g>
      <Shadow from={100} to={300} />
      <Wheel cx={129} cy={CART_CY} r={CART_R} />
      <Wheel cx={267} cy={CART_CY} r={CART_R} />
      <path
        d="M100 150 L100 132 Q100 124 109 123 L150 120 L150 138 L240 138 L240 112 Q240 106 248 106 L292 106 Q300 106 300 114 L300 150 L286 150 A19 19 0 0 0 248 150 L148 150 A19 19 0 0 0 110 150 Z"
        fill={fill}
      />
      {/* flat canopy on two thin posts, open sides */}
      <rect x={104} y={50} width={194} height={11} rx={5} fill={fill} />
      <rect x={116} y={58} width={6} height={66} rx={3} fill={fill} />
      <rect x={284} y={58} width={6} height={50} rx={3} fill={fill} />
      <Glass d="M126 120 L134 63 L146 63 L138 120 Z" opacity={0.45} />
      {/* bench seat */}
      <rect x={154} y={128} width={70} height={10} rx={3} fill={fill} />
      <rect x={219} y={94} width={17} height={44} rx={7} fill={fill} />
      <Seam d="M158 133 L218 133" opacity={0.28} />
    </g>
  )
}

const SHAPES: Record<VehicleClass, (props: ShapeProps) => JSX.Element> = {
  Car: CarShape,
  SUV: SuvShape,
  Truck: TruckShape,
  Van: VanShape,
  Convertible: ConvertibleShape,
  'Golf cart': GolfCartShape,
}

function slugFor(vehicleClass: VehicleClass): string {
  return vehicleClass.toLowerCase().replace(/\s+/g, '-')
}

export function VehicleSilhouette({
  vehicleClass,
  variant = 'card',
  className,
}: VehicleSilhouetteProps): JSX.Element {
  const isHero = variant === 'hero'
  const gradientId = `tr-grad-${slugFor(vehicleClass)}`
  const Shape = SHAPES[vehicleClass]
  const wrapperClass = [
    'relative overflow-hidden rounded-2xl',
    isHero ? 'aspect-[16/9]' : 'aspect-[16/10]',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      role="img"
      aria-label={`${vehicleClass} silhouette`}
      className={wrapperClass}
      style={{ background: 'linear-gradient(158deg, #0a0f1c 0%, #111a2e 54%, #182440 100%)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-28%] h-[96%] w-[78%] -translate-x-1/2 rounded-full"
        style={{
          background: 'radial-gradient(closest-side, rgba(46,107,255,0.30), rgba(46,107,255,0))',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-18%] bottom-[7%] h-[72%] rounded-[100%] border-t border-brand/20"
      />
      <div className={`relative flex h-full w-full items-center justify-center ${isHero ? 'p-3' : 'p-5'}`}>
        <svg
          aria-hidden="true"
          viewBox="0 0 400 200"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0.28" y2="1">
              <stop offset="0%" stopColor={BODY_TOP} />
              <stop offset="100%" stopColor="#8FB0FF" />
            </linearGradient>
          </defs>
          <Shape fill={`url(#${gradientId})`} />
        </svg>
      </div>
    </div>
  )
}

export default VehicleSilhouette

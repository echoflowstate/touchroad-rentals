import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { SAMPLE_FLEET } from '../data/fleet'
import { formatUSD } from '../lib/pricing'
import { MileMarker } from '../components/RoadLine'
import { Reveal } from '../components/Reveal'
import { SunBand } from '../components/CoastalHero'
import { WaveDivider } from '../components/WaveDivider'
import { siteConfig } from '../site.config'

interface Step {
  title: string
  body: string
}

const RENTER_STEPS: Step[] = [
  {
    title: 'Find it',
    body: 'Pick a city and your dates, and read the whole nightly price on the card before you tap anything.',
  },
  {
    title: 'Request it',
    body: 'Send a request to the neighbor who owns the car, with the exact days you want it.',
  },
  {
    title: 'Drive it',
    body: 'Meet the host at the spot you both agreed on, take the keys, and drive.',
  },
]

const HOST_STEPS: Step[] = [
  {
    title: 'List it',
    body: 'Add your car in a few taps: year, make, model, city, and the nightly rate you want.',
  },
  {
    title: 'Approve requests',
    body: 'You decide who drives your car and which days it leaves the driveway.',
  },
  {
    title: 'Get paid',
    body: 'You set the price, you keep the earnings.',
  },
]

interface StepColumnProps {
  heading: string
  lede: string
  steps: Step[]
  tone: 'ink' | 'emerald'
}

function StepColumn({ heading, lede, steps, tone }: StepColumnProps): JSX.Element {
  const circle = tone === 'ink' ? 'bg-ink text-white' : 'bg-emerald text-white'

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">{heading}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{lede}</p>

      <ol className="mt-5 space-y-5">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3.5">
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-semibold ${circle}`}
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-[15px] font-bold text-ink">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function HowItWorks(): JSX.Element {
  const facts = useMemo(() => {
    const lowest = SAMPLE_FLEET.reduce(
      (min, listing) => (listing.pricePerDay < min ? listing.pricePerDay : min),
      SAMPLE_FLEET[0]?.pricePerDay ?? 0,
    )
    const cities = new Set(SAMPLE_FLEET.map((listing) => listing.city)).size

    return [
      { label: 'Lowest sample rate', value: formatUSD(lowest) },
      { label: 'Cities with sample cars', value: String(cities) },
      { label: 'Service fees', value: '$0' },
    ]
  }, [])

  return (
    <div>
      <SunBand>
        <div className="shell relative pb-16 pt-12 md:pb-20 md:pt-16">
          <MileMarker>How it works</MileMarker>
          <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink sm:text-4xl md:text-5xl">
            Rent from your neighbors.
          </h1>
          <p className="mt-3 font-display text-lg font-bold tracking-[-0.01em] text-emerald sm:text-xl">
            {siteConfig.neighborLine}
          </p>
        </div>
      </SunBand>
      <WaveDivider to="white" className="bg-sand" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-8 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-2 md:gap-6">
          <StepColumn
            heading="For renters"
            lede="Three steps from a car parked down the street to the keys in your hand."
            steps={RENTER_STEPS}
            tone="ink"
          />
          <StepColumn
            heading="For hosts"
            lede="Three steps from a car sitting in your driveway to a car out earning."
            steps={HOST_STEPS}
            tone="emerald"
          />
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ink-muted">
          This is a preview build. Requests you send here are saved on your own device, nothing is
          booked, and no money moves.
        </p>
      </div>

      <WaveDivider to="aqua" flip className="bg-white" />
      <section className="band-aqua py-14 md:py-20">
        <div className="shell">
          <Reveal>
            <MileMarker>Why cheaper?</MileMarker>
            <h2 className="mt-4 font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink sm:text-3xl">
              No counter, no lot, no fee stack.
            </h2>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted sm:text-base">
              These are cars that are already parked. Nobody staffs a rental counter for them,
              nobody lights a lot overnight, and nobody runs a shuttle out to one. The neighbor who
              owns the car sets a nightly rate, and that rate is the whole number. Nothing is added
              at the end, so the figure on the card is the figure you pay.
            </p>
          </Reveal>

          <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {facts.map((fact, index) => (
              <Reveal key={fact.label} delay={index * 70}>
                <div className="card-flat h-full px-5 py-5">
                  <dt className="label-micro">{fact.label}</dt>
                  <dd className="num mt-2 text-3xl font-extrabold text-ink">{fact.value}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>
      <WaveDivider to="sand" className="bg-emerald-wash" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="card-flat mt-10 px-5 py-5 md:mt-12">
          <p className="text-sm leading-relaxed text-ink-muted">{siteConfig.comingSoon}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm leading-relaxed text-ink-muted sm:flex-1">
            Try it from either side: put a car on the board, or go find one for the weekend.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/host" className="btn-primary">
              List your car
            </Link>
            <Link to="/" className="btn-ghost">
              Browse cars
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HowItWorks

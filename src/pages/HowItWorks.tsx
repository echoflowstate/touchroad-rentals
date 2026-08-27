import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { SAMPLE_FLEET } from '../data/fleet'
import { formatUSD } from '../lib/pricing'
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
    body: 'You set the price, and you keep the earnings.',
  },
]

interface StepColumnProps {
  heading: string
  lede: string
  steps: Step[]
  tone: 'navy' | 'brand'
}

function StepColumn({ heading, lede, steps, tone }: StepColumnProps): JSX.Element {
  const circle = tone === 'navy' ? 'bg-navy text-white' : 'bg-brand text-white'

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
      { label: 'Cities in the preview', value: String(cities) },
      { label: 'Service fees', value: '$0' },
    ]
  }, [])

  return (
    <div className="pb-16">
      <section className="relative bg-navy">
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(168deg, #0a0f1c 0%, #111a2e 62%, #182440 100%)' }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 md:pb-14 md:pt-14">
          <h1 className="font-display text-[30px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-4xl md:text-5xl">
            How it works
          </h1>
          <p className="mt-3 font-mono text-[13px] uppercase tracking-[0.12em] text-brand-300">
            {siteConfig.neighborLine}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-8 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-2 md:gap-6">
          <StepColumn
            heading="For renters"
            lede="Three steps from a car parked down the street to the keys in your hand."
            steps={RENTER_STEPS}
            tone="navy"
          />
          <StepColumn
            heading="For hosts"
            lede="Three steps from a car sitting in your driveway to a car out earning."
            steps={HOST_STEPS}
            tone="brand"
          />
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ink-muted">
          This is a preview build. Requests you send here are saved on your own device, nothing is
          booked, and no money moves.
        </p>
      </div>

      <section className="relative mt-10 overflow-hidden bg-navy md:mt-14">
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(150deg, #111a2e 0%, #0a0f1c 55%, #182440 100%)' }}
          />
          <div className="absolute left-1/2 top-[-30%] h-[150%] w-[120%] max-w-[900px] -translate-x-1/2">
            <div className="hero-glow" />
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <h2 className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-white sm:text-3xl">
            Why cheaper?
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/75 sm:text-base">
            These are cars that belong to neighbors, and most of them are already parked when you
            need one. There is no rental counter to staff, no lot to light through the night, and no
            shuttle bus running loops out to a terminal. A host picks a nightly rate that makes
            sense for a car that would otherwise sit still, and that rate is the number printed on
            the card. Nothing is stacked on top at the end, which is why the fees line reads $0
            instead of a list. The math in this preview is plain arithmetic, nightly rate times
            days, and you can watch it add up before you request a thing.
          </p>

          <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
              >
                <dt className="label-micro text-brand-300">{fact.label}</dt>
                <dd className="num mt-1 font-display text-2xl font-extrabold text-white">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="card-flat mt-10 px-5 py-5 md:mt-12">
          <p className="text-sm leading-relaxed text-ink-muted">{siteConfig.comingSoon}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              aria-hidden={false}
              className="inline-flex items-center rounded-full border border-line bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted"
            >
              App Store
            </span>
            <span
              aria-hidden={false}
              className="inline-flex items-center rounded-full border border-line bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted"
            >
              Google Play
            </span>
          </div>
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

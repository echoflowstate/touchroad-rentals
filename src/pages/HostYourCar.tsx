import { EarningsTeaser } from '../components/EarningsTeaser'
import { ListingWizard } from '../components/ListingWizard'
import { siteConfig } from '../site.config'

interface HostPoint {
  title: string
  body: string
}

const HOST_POINTS: HostPoint[] = [
  {
    title: 'You set the price',
    body: 'The number you type is the number a renter reads on the card. Nothing is stacked on top of it, and the fees line stays at $0.',
  },
  {
    title: 'You choose the requests',
    body: 'A request is a message asking for particular days. You decide who drives your car and when it leaves the driveway.',
  },
  {
    title: 'Nothing here charges anyone',
    body: 'This is a preview build. A listing you publish is saved on this device, nothing is booked, and no money moves.',
  },
]

export function HostYourCar(): JSX.Element {
  return (
    <div className="pb-16">
      <section className="relative overflow-hidden bg-navy">
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(158deg, #0a0f1c 0%, #111a2e 58%, #182440 100%)' }}
          />
          <div className="absolute left-1/2 top-[-42%] h-[150%] w-[130%] max-w-[880px] -translate-x-1/2">
            <div className="hero-glow" />
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-11 pt-10 sm:px-6 md:pb-16 md:pt-14">
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-brand-300">
            Host preview - {siteConfig.region}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-[30px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-4xl md:text-5xl">
            Your parked car could cover a bill or two.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/75 sm:text-base">
            Put it on the board for the days you are not driving it, pick the price you want, and
            watch the plain arithmetic before anything else happens.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-8 md:mt-10">
          <EarningsTeaser />
        </div>

        <section className="mt-8 md:mt-10">
          <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
            What hosting means on a preview build
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {HOST_POINTS.map((point, index) => (
              <article key={point.title} className="card p-5">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 font-mono text-[13px] font-semibold text-brand-600"
                >
                  {index + 1}
                </span>
                <h3 className="mt-3 font-display text-[15px] font-bold text-ink">{point.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{point.body}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-8 md:mt-10">
          <ListingWizard />
        </div>
      </div>
    </div>
  )
}

export default HostYourCar

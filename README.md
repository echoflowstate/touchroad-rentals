# Touch Road Rentals - web preview

A working web preview of a peer-to-peer car rental marketplace for the Emerald Coast,
Florida. It runs entirely in the browser: the sample fleet ships in the code, accounts and
new listings live in `localStorage`, and there is no backend, no payments, and no real
bookings.

The preview exists to answer one question: does the app idea hold up on screen?

## The founding principle

Keep it genuinely cheap for renters. The nightly rate on the card is the whole price, and
the calculator on every car detail page shows a service fee line that reads `$0`.

- "The price you see is the price you drive."
- "Rent from your neighbors, not a counter."

## What is real and what is not

Real: the browse filters, the sort, the price calculator, the listing wizard, the demo
sign-in, and the fact that a listing you publish shows up in Browse and survives a reload.

Not real: the twelve seeded vehicles, every one of which is badged **Sample listing**;
the hosts, who are first names on demonstration records; and the requests, which are
stored in your own browser and sent nowhere.

There is no phone number, email address, or mailing address in this build, and it makes no
claims about anything it cannot stand behind.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type check plus production bundle
npm run preview    # serve the build on http://localhost:4173
npm test           # the assertion suite
```

## Proof scripts

```bash
bash scripts/audit.sh          # claims audit: banned language, dashes, store links, contacts
node scripts/make-og.mjs       # regenerate public/og.png
npm run preview &              # then, against the running preview:
node scripts/shots.mjs         # stills at 1440 and 390, interaction filmstrip, layout report
```

`scripts/shots.mjs` writes into `proof/`.

## Configuration

Everything brand-level lives in `src/site.config.ts`: the name, the region, the thirteen
city options, the positioning lines, the preview ribbon text, the storage keys, and a
`noindex` flag that defaults to `false`. Every render reads from that file.

## Deploying

`netlify.toml` is included with a single-page-app redirect, so `npm run build` and a drop of
`dist/` is the whole deploy.

## Layout

```
src/
  site.config.ts     brand strings, the 13 cities, storage keys
  types.ts           Listing, Trip, Session, Filters
  data/fleet.ts      the 12 seeded sample vehicles
  lib/               pricing math, filter and sort logic, storage, reduced motion
  state/AppState.tsx one provider: listings, trips, session, sign-in sheet
  components/        shell, cards, silhouettes, sheets, calculator, wizard
  pages/             Browse, CarDetail, HowItWorks, HostYourCar, Account
  test/              calculator, wizard, browse, and claims assertions
scripts/             claims audit, social image, proof capture
```

Coming soon to the App Store and Google Play.

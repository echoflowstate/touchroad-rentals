import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  addMonths,
  buildMonthGrid,
  longDateLabel,
  monthKeyOf,
  monthLabel,
  monthOfYear,
  orderRange,
  shiftDays,
  shiftMonths,
  WEEKDAY_LABELS,
  weekdayIndex,
  withinRange,
  type DayCell,
} from '../lib/calendar'
import { useMediaQuery, useReducedMotion } from '../lib/motion'
import { daysBetween, formatShortDate, todayISO } from '../lib/pricing'
import { IconChevronLeft, IconChevronRight } from './Icons'
import { Sheet } from './Sheet'

/**
 * A5: the trip planner. One hand-rolled range picker stands in for every date
 * entry on the site, so the pick-up and the drop-off are chosen together and the
 * days between them are drawn as a road rather than counted in the head.
 *
 * Two shells, one calendar: a popover anchored to the field from md up, and the
 * shared bottom sheet on phones. The popover is portaled to the body and placed
 * with fixed coordinates because the search card sits inside an animated,
 * overflow-clipped hero, and neither an absolute child nor a plain fixed one
 * survives that.
 *
 * The picker never does date math of its own beyond ordering: it hands a start
 * and an end to the caller and the pricing helpers stay the single source of
 * truth for how many days that is.
 */

const DESKTOP_QUERY = '(min-width: 768px)'
/** Dash period for the road, in normalized pathLength units. */
const ROAD_DASH = '0.018 0.018'

export interface DateRangeFieldProps {
  /** Base id for the trigger; the popover derives its own ids from it. */
  id: string
  startDate: string
  endDate: string
  onChange: (start: string, end: string) => void
  /** Visible label above the field. */
  label?: string
  className?: string
}

/** "Mar 12 - Mar 15 · 3 days", or a prompt when nothing is chosen yet. */
export function formatRangeLabel(start: string, end: string): string {
  if (!start || !end) return 'Add your dates'
  const days = daysBetween(start, end)
  return `${formatShortDate(start)} - ${formatShortDate(end)} · ${days} ${days === 1 ? 'day' : 'days'}`
}

export function DateRangeField({
  id,
  startDate,
  endDate,
  onChange,
  label = 'Trip dates',
  className,
}: DateRangeFieldProps): JSX.Element {
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const today = todayISO()

  const [open, setOpen] = useState(false)
  const [draftStart, setDraftStart] = useState(startDate)
  const [draftEnd, setDraftEnd] = useState(endDate)
  const [awaitingEnd, setAwaitingEnd] = useState(false)
  const [hover, setHover] = useState('')
  const [viewMonth, setViewMonth] = useState(() => monthKeyOf(startDate || today))
  const [focusDate, setFocusDate] = useState(startDate || today)
  const [slide, setSlide] = useState<'left' | 'right' | null>(null)

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const labelId = `${id}-label`
  const valueId = `${id}-value`

  const openPicker = useCallback(() => {
    const floor = todayISO()
    const seedStart = startDate && startDate >= floor ? startDate : floor
    setDraftStart(startDate)
    setDraftEnd(endDate)
    setAwaitingEnd(false)
    setHover('')
    setViewMonth(monthKeyOf(seedStart))
    setFocusDate(seedStart)
    setSlide(null)
    setOpen(true)
  }, [startDate, endDate])

  const closePicker = useCallback(() => setOpen(false), [])

  const commit = useCallback(
    (start: string, end: string) => {
      const ordered = orderRange(start, end)
      onChange(ordered.start, ordered.end)
    },
    [onChange],
  )

  // Picking runs as a small two-beat machine: the first day always starts a new
  // range, the second closes it. Choosing an end before the start swaps them
  // rather than refusing the pick.
  const pick = useCallback(
    (iso: string) => {
      if (!iso || iso < today) return
      if (!awaitingEnd || !draftStart) {
        setDraftStart(iso)
        setDraftEnd('')
        setAwaitingEnd(true)
        setFocusDate(iso)
        setHover('')
        return
      }
      const ordered = orderRange(draftStart, iso)
      setDraftStart(ordered.start)
      setDraftEnd(ordered.end)
      setAwaitingEnd(false)
      setFocusDate(iso)
      setHover('')
      if (desktop) {
        commit(ordered.start, ordered.end)
        setOpen(false)
      }
    },
    [today, awaitingEnd, draftStart, desktop, commit],
  )

  const clear = useCallback(() => {
    setDraftStart('')
    setDraftEnd('')
    setAwaitingEnd(false)
    setHover('')
  }, [])

  const confirm = useCallback(() => {
    if (!draftStart) return
    // A lone pick-up is a same-day trip, which the pricing floor reads as a day.
    commit(draftStart, draftEnd || draftStart)
    setOpen(false)
  }, [draftStart, draftEnd, commit])

  // The range the grid should paint right now: the settled one, or the one the
  // pointer is proposing while the end is still open.
  const preview = useMemo(() => {
    if (draftStart && draftEnd) return orderRange(draftStart, draftEnd)
    if (draftStart && awaitingEnd && hover) return orderRange(draftStart, hover)
    if (draftStart) return { start: draftStart, end: draftStart }
    return null
  }, [draftStart, draftEnd, awaitingEnd, hover])

  const dayCount = preview ? daysBetween(preview.start, preview.end) : 0

  const months = desktop ? [viewMonth, addMonths(viewMonth, 1)] : [viewMonth]
  const firstAllowedMonth = monthKeyOf(today)
  const canGoBack = viewMonth > firstAllowedMonth

  const step = useCallback(
    (delta: number) => {
      setViewMonth((current) => {
        const next = addMonths(current, delta)
        return next < firstAllowedMonth ? current : next
      })
      setSlide(delta > 0 ? 'right' : 'left')
    },
    [firstAllowedMonth],
  )

  // Keyboard travel across the grid. Focus is clamped at today, so the arrows
  // can never park on a day that cannot be picked.
  const moveFocus = useCallback(
    (days: number) => {
      setFocusDate((current) => {
        const next = shiftDays(current || today, days)
        return next < today ? today : next
      })
    },
    [today],
  )

  const onGridKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          moveFocus(-1)
          break
        case 'ArrowRight':
          event.preventDefault()
          moveFocus(1)
          break
        case 'ArrowUp':
          event.preventDefault()
          moveFocus(-7)
          break
        case 'ArrowDown':
          event.preventDefault()
          moveFocus(7)
          break
        case 'Home':
          event.preventDefault()
          moveFocus(-weekdayIndex(focusDate))
          break
        case 'End':
          event.preventDefault()
          moveFocus(6 - weekdayIndex(focusDate))
          break
        case 'PageUp':
          event.preventDefault()
          setFocusDate((current) => {
            const next = shiftMonths(current, -1)
            return next < today ? today : next
          })
          break
        case 'PageDown':
          event.preventDefault()
          setFocusDate((current) => shiftMonths(current, 1))
          break
        default:
          break
      }
    },
    [moveFocus, focusDate, today],
  )

  // Keep the focused day on screen, then hand it the actual DOM focus. Both
  // months are considered on desktop so arrowing sideways does not jump a page.
  const gridsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const focusMonth = monthKeyOf(focusDate)
    setViewMonth((current) => {
      const last = desktop ? addMonths(current, 1) : current
      if (focusMonth < current) return focusMonth
      if (focusMonth > last) return desktop ? addMonths(focusMonth, -1) : focusMonth
      return current
    })
  }, [focusDate, open, desktop])

  const shouldFocusCell = useRef(false)
  useEffect(() => {
    if (!open || !shouldFocusCell.current) return
    const host = gridsRef.current
    if (!host) return
    const cell = host.querySelector<HTMLElement>(`[data-day="${focusDate}"]`)
    if (cell) cell.focus()
  }, [focusDate, viewMonth, open])

  const body = (
    <CalendarBody
      idBase={id}
      months={months}
      today={today}
      preview={preview}
      draftStart={draftStart}
      draftEnd={draftEnd}
      focusDate={focusDate}
      dayCount={dayCount}
      awaitingEnd={awaitingEnd}
      canGoBack={canGoBack}
      slide={slide}
      gridsRef={gridsRef}
      onStep={step}
      onPick={pick}
      onHover={setHover}
      onKeyDown={(event) => {
        shouldFocusCell.current = true
        onGridKeyDown(event)
      }}
      onCellFocus={(iso) => {
        shouldFocusCell.current = false
        setFocusDate(iso)
      }}
    />
  )

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <span className="label-micro" id={labelId}>
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        data-testid={`${id}-trigger`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${valueId}`}
        onClick={() => (open ? closePicker() : openPicker())}
        className="field flex items-center justify-between gap-2 text-left"
      >
        <span
          id={valueId}
          className={`truncate text-sm ${startDate && endDate ? 'text-ink' : 'text-ink-faint'}`}
        >
          {formatRangeLabel(startDate, endDate)}
        </span>
        <CalendarGlyph />
      </button>

      {open && desktop ? (
        <Popover anchorRef={triggerRef} onClose={closePicker} labelledBy={`${id}-heading`}>
          <div className="px-5 pb-4 pt-5">
            <div className="flex items-start justify-between gap-4">
              <h2
                id={`${id}-heading`}
                className="font-display text-base font-extrabold leading-tight text-ink"
              >
                Pick up and drop off
              </h2>
              <button
                type="button"
                onClick={clear}
                className="focusable rounded-lg px-1.5 py-1 text-[13px] font-semibold text-emerald underline decoration-emerald/35 underline-offset-4 transition-colors hover:text-emerald-deep"
              >
                Clear
              </button>
            </div>
            {body}
          </div>
        </Popover>
      ) : null}

      {open && !desktop ? (
        <Sheet
          open={open}
          onClose={closePicker}
          title="Pick up and drop off"
          footer={
            <div className="flex items-center gap-3">
              <button type="button" onClick={clear} className="btn-ghost flex-1">
                Clear
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={!draftStart}
                className="btn-primary flex-[1.4]"
              >
                Confirm dates
              </button>
            </div>
          }
        >
          {body}
        </Sheet>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ shells */

/**
 * The desktop popover. Fixed to viewport coordinates read from the trigger,
 * re-read on scroll and resize, and flipped above the field when the room below
 * runs out. Tab is trapped inside it and Escape hands focus back to the field.
 */
function Popover({
  anchorRef,
  onClose,
  labelledBy,
  children,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>
  onClose: () => void
  labelledBy: string
  children: React.ReactNode
}): JSX.Element {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const reduced = useReducedMotion()

  const place = useCallback(() => {
    const trigger = anchorRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return
    const rect = trigger.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = panel.offsetWidth
    const height = panel.offsetHeight

    let left = rect.left
    if (left + width > vw - 12) left = vw - width - 12
    if (left < 12) left = 12

    let top = rect.bottom + 8
    if (top + height > vh - 12) {
      const above = rect.top - height - 8
      top = above >= 12 ? above : Math.max(12, vh - height - 12)
    }

    panel.style.left = `${Math.round(left)}px`
    panel.style.top = `${Math.round(top)}px`
  }, [anchorRef])

  useLayoutEffect(() => {
    place()
  })

  useEffect(() => {
    const onScroll = () => place()
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
    }
  }, [place])

  // Clicking anywhere outside closes, which is the popover equivalent of the
  // sheet backdrop.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const panel = panelRef.current
      const trigger = anchorRef.current
      const target = event.target
      if (!(target instanceof Node)) return
      if (panel?.contains(target) || trigger?.contains(target)) return
      onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [onClose, anchorRef])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        anchorRef.current?.focus()
        return
      }
      if (event.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, anchorRef])

  // Focus lands on the grid's active day so the arrows work straight away.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const cell = panel.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')
    if (cell) cell.focus()
    else panel.focus()
    return () => {
      const trigger = anchorRef.current
      if (trigger && document.body.contains(trigger)) trigger.focus()
    }
  }, [anchorRef])

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      data-testid="date-popover"
      className={`fixed z-[60] w-[min(724px,calc(100vw-24px))] overflow-hidden rounded-4xl border border-line-soft bg-sand-50 shadow-lift focus:outline-none ${
        reduced ? '' : 'animate-popover-in'
      }`}
      style={{ top: 0, left: 0 }}
    >
      {/* The wave-curved top edge, so the card opens like every other coastal
          surface on the site rather than as a plain rectangle. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 724 26"
        preserveAspectRatio="none"
        className="block h-6 w-full"
        focusable="false"
      >
        <path d="M0 0h724v14c-120 16-240 16-362 4S120 4 0 20z" fill="#EAF4F1" />
      </svg>
      {children}
    </div>,
    document.body,
  )
}

/* ---------------------------------------------------------------- calendar */

interface CalendarBodyProps {
  idBase: string
  months: string[]
  today: string
  preview: { start: string; end: string } | null
  draftStart: string
  draftEnd: string
  focusDate: string
  dayCount: number
  awaitingEnd: boolean
  canGoBack: boolean
  slide: 'left' | 'right' | null
  gridsRef: React.RefObject<HTMLDivElement>
  onStep: (delta: number) => void
  onPick: (iso: string) => void
  onHover: (iso: string) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  onCellFocus: (iso: string) => void
}

function CalendarBody({
  idBase,
  months,
  today,
  preview,
  draftStart,
  draftEnd,
  focusDate,
  dayCount,
  awaitingEnd,
  canGoBack,
  slide,
  gridsRef,
  onStep,
  onPick,
  onHover,
  onKeyDown,
  onCellFocus,
}: CalendarBodyProps): JSX.Element {
  const reduced = useReducedMotion()
  const road = useRoadPath(gridsRef, [
    months.join(),
    preview?.start ?? '',
    preview?.end ?? '',
  ])

  // A horizontal drag changes the month on touch. The threshold is generous
  // enough that tapping a day never counts as a swipe.
  const swipe = useRef({ x: 0, active: false, moved: false })
  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === 'mouse') return
    swipe.current = { x: event.clientX, active: true, moved: false }
  }
  const onPointerUp = (event: React.PointerEvent) => {
    if (!swipe.current.active) return
    const dx = event.clientX - swipe.current.x
    swipe.current.active = false
    if (Math.abs(dx) < 48) return
    swipe.current.moved = true
    onStep(dx < 0 ? 1 : -1)
    window.setTimeout(() => {
      swipe.current.moved = false
    }, 60)
  }
  const onClickCapture = (event: React.MouseEvent) => {
    if (!swipe.current.moved) return
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div className="pt-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span
          data-testid="road-day-count"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-tint px-3 py-1.5 font-display text-[13px] font-bold text-emerald-deep"
        >
          <RoadPin />
          {dayCount > 0
            ? `${dayCount} ${dayCount === 1 ? 'day' : 'days'} on the road`
            : 'Choose a pick-up day'}
        </span>
        <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint sm:block">
          {awaitingEnd ? 'Now the drop off' : 'Start with the pick up'}
        </span>
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onStep(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="focusable grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-muted transition-colors hover:bg-white disabled:opacity-30"
        >
          <IconChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 justify-around gap-6">
          {months.map((key) => (
            <MonthHeading key={key} monthKey={key} id={`${idBase}-month-${key}`} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => onStep(1)}
          aria-label="Next month"
          className="focusable grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-muted transition-colors hover:bg-white"
        >
          <IconChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={gridsRef}
        className="relative touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
        onMouseLeave={() => onHover('')}
      >
        <div className="grid gap-6 md:grid-cols-2">
          {months.map((key, index) => (
            <MonthGrid
              key={key}
              monthKey={key}
              headingId={`${idBase}-month-${key}`}
              today={today}
              preview={preview}
              draftStart={draftStart}
              draftEnd={draftEnd}
              focusDate={focusDate}
              onPick={onPick}
              onHover={onHover}
              onCellFocus={onCellFocus}
              reduced={reduced}
              slideClass={
                reduced || slide === null || index > 0
                  ? ''
                  : slide === 'right'
                    ? 'animate-month-in-right'
                    : 'animate-month-in-left'
              }
            />
          ))}
        </div>

        {/* THE ROAD RANGE. Painted over the grid, never in it, so the tiles keep
            their own hit areas. pathLength is normalized, which lets the wipe
            and the travelling dashes work without measuring the path. */}
        {road ? (
          <svg
            key={`${preview?.start ?? ''}-${preview?.end ?? ''}`}
            data-testid="road-range"
            aria-hidden="true"
            focusable="false"
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${road.width} ${road.height}`}
          >
            <path
              data-testid="road-range-path"
              d={road.d}
              fill="none"
              stroke="#0F2E28"
              strokeOpacity="0.11"
              strokeWidth="6"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              className={reduced ? undefined : 'animate-road-draw'}
            />
            <path
              d={road.d}
              fill="none"
              stroke="#0B7458"
              strokeOpacity="0.6"
              strokeWidth="1.8"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={ROAD_DASH}
              className={reduced ? undefined : 'animate-road-flow'}
            />
          </svg>
        ) : null}
      </div>

      <p className="mt-3 border-t border-line-soft pt-3 text-[13px] leading-relaxed text-ink-muted">
        {draftStart && draftEnd
          ? `Pick up ${longDateLabel(draftStart)}, drop off ${longDateLabel(draftEnd)}.`
          : 'Same day back is one day of rental.'}
      </p>
    </div>
  )
}

function MonthHeading({ monthKey, id }: { monthKey: string; id: string }): JSX.Element {
  // The sun walks the arc as the months advance: January sits at one end of the
  // year, December at the other.
  const t = monthOfYear(monthKey) / 11
  const inv = 1 - t
  const x = inv * inv * 6 + 2 * inv * t * 60 + t * t * 114
  const y = inv * inv * 13 + 2 * inv * t * -7 + t * t * 13

  return (
    <span className="flex flex-col items-center gap-1">
      <span id={id} className="font-display text-[15px] font-extrabold text-ink">
        {monthLabel(monthKey)}
      </span>
      <svg width="120" height="16" viewBox="0 0 120 16" aria-hidden="true" focusable="false">
        <path
          d="M6 13Q60 -7 114 13"
          fill="none"
          stroke="#0B7458"
          strokeOpacity="0.28"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx={x.toFixed(2)} cy={y.toFixed(2)} r="3.2" fill="#FFC65C" />
        <circle cx={x.toFixed(2)} cy={y.toFixed(2)} r="5.4" fill="#FFC65C" opacity="0.3" />
      </svg>
    </span>
  )
}

function MonthGrid({
  monthKey,
  headingId,
  today,
  preview,
  draftStart,
  draftEnd,
  focusDate,
  onPick,
  onHover,
  onCellFocus,
  reduced,
  slideClass,
}: {
  monthKey: string
  headingId: string
  today: string
  preview: { start: string; end: string } | null
  draftStart: string
  draftEnd: string
  focusDate: string
  onPick: (iso: string) => void
  onHover: (iso: string) => void
  onCellFocus: (iso: string) => void
  reduced: boolean
  slideClass: string
}): JSX.Element {
  const rows = buildMonthGrid(monthKey, today)

  return (
    <div className={slideClass}>
      <div role="grid" aria-labelledby={headingId} className="select-none">
        <div role="row" className="grid grid-cols-7">
          {WEEKDAY_LABELS.map((weekday) => (
            <span
              key={weekday.short}
              role="columnheader"
              aria-label={weekday.long}
              className="pb-1 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint"
            >
              {weekday.short}
            </span>
          ))}
        </div>
        {rows.map((cells, rowIndex) => (
          <div role="row" key={rowIndex} className="grid grid-cols-7 gap-y-1">
            {cells.map((cell, columnIndex) => (
              <DayTile
                key={cell.iso || `pad-${rowIndex}-${columnIndex}`}
                cell={cell}
                monthKey={monthKey}
                preview={preview}
                draftStart={draftStart}
                draftEnd={draftEnd}
                focusDate={focusDate}
                onPick={onPick}
                onHover={onHover}
                onCellFocus={onCellFocus}
                reduced={reduced}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function DayTile({
  cell,
  monthKey,
  preview,
  draftStart,
  draftEnd,
  focusDate,
  onPick,
  onHover,
  onCellFocus,
  reduced,
}: {
  cell: DayCell
  monthKey: string
  preview: { start: string; end: string } | null
  draftStart: string
  draftEnd: string
  focusDate: string
  onPick: (iso: string) => void
  onHover: (iso: string) => void
  onCellFocus: (iso: string) => void
  reduced: boolean
}): JSX.Element {
  if (!cell.inMonth) {
    return <span role="gridcell" className="min-h-[44px]" />
  }

  const inRange = preview ? withinRange(cell.iso, preview.start, preview.end) : false
  const isStart = cell.iso === draftStart
  const isEnd = Boolean(draftEnd) && cell.iso === draftEnd
  const isEdge = isStart || isEnd
  const isFocusTarget = cell.iso === focusDate

  const tone = cell.isPast
    ? 'opacity-30 text-ink-muted'
    : isEdge
      ? 'bg-emerald text-white shadow-card'
      : inRange
        ? 'bg-aqua-light/45 text-ink'
        : 'bg-sand text-ink hover:bg-emerald-tint'

  return (
    <button
      type="button"
      role="gridcell"
      data-day={cell.iso}
      data-group={`${monthKey}:${cell.row}`}
      data-inroad={inRange ? 'true' : undefined}
      data-testid={isStart ? 'road-start-cell' : isEnd ? 'road-end-cell' : undefined}
      aria-label={longDateLabel(cell.iso)}
      aria-selected={isEdge}
      aria-current={cell.isToday ? 'date' : undefined}
      disabled={cell.isPast}
      tabIndex={isFocusTarget ? 0 : -1}
      onClick={() => onPick(cell.iso)}
      onMouseEnter={() => onHover(cell.iso)}
      onFocus={() => onCellFocus(cell.iso)}
      className={`num relative mx-0.5 grid min-h-[44px] place-items-center rounded-xl text-[15px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-1 focus-visible:ring-offset-sand-50 ${tone}`}
    >
      {cell.day}

      {/* Weekends get the faintest sun-gold tick in the corner. */}
      {cell.isWeekend && !cell.isPast && !isEdge ? (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-gold/70"
        />
      ) : null}

      {cell.isToday && !isEdge ? (
        <span
          aria-hidden="true"
          className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald"
        />
      ) : null}

      {isStart ? (
        <span
          aria-hidden="true"
          data-testid="road-car-marker"
          className={`absolute -top-2 left-1/2 -translate-x-1/2 ${reduced ? '' : 'animate-car-settle'}`}
        >
          <TinyCar />
        </span>
      ) : null}

      {isEnd ? (
        <span
          aria-hidden="true"
          data-testid="road-flag-marker"
          className={`absolute -top-2 left-1/2 -translate-x-1/2 ${reduced ? '' : 'animate-flag-plant'}`}
        >
          <TinyWave />
        </span>
      ) : null}
    </button>
  )
}

/* ------------------------------------------------------------------ shapes */

function CalendarGlyph(): JSX.Element {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <rect
        x="3.2"
        y="5"
        width="17.6"
        height="16"
        rx="4"
        stroke="#4A6B62"
        strokeWidth="1.7"
      />
      <path d="M3.4 10h17.2" stroke="#4A6B62" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M7.5 14.6h9"
        stroke="#0B7458"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeDasharray="2.4 2.6"
      />
      <path d="M8 3v3.4M16 3v3.4" stroke="#4A6B62" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function RoadPin(): JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path
        d="M1 10.5C2.4 5.6 4.4 2.6 7 1.5"
        stroke="#0B7458"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="2 2.2"
        fill="none"
      />
      <circle cx="9.4" cy="3" r="2.2" fill="#FFC65C" />
    </svg>
  )
}

/** The car that parks on the pick-up day. Four shapes, legible at 18px. */
function TinyCar(): JSX.Element {
  return (
    <svg width="22" height="12" viewBox="0 0 44 24" aria-hidden="true" focusable="false">
      <path
        d="M3 16c0-2.6 1.6-4 4-4.6l4.4-1L15 6.4c1.4-1.3 3-2 5-2h6c2.6 0 4.8 1.1 6.4 3.2L34.6 11l4.6 1.2c2 .5 2.8 1.9 2.8 4v1.4c0 1-.8 1.8-1.8 1.8H4.8C3.8 19.4 3 18.6 3 17.6z"
        fill="#0F2E28"
      />
      <path d="M16 9c.8-.9 1.8-1.3 3-1.3h5c1.8 0 3.2.8 4.4 2.4l1.6 2H13.6z" fill="#AEE5DC" />
      <circle cx="13" cy="19" r="3.4" fill="#0F2E28" />
      <circle cx="13" cy="19" r="1.4" fill="#7FD4C8" />
      <circle cx="32" cy="19" r="3.4" fill="#0F2E28" />
      <circle cx="32" cy="19" r="1.4" fill="#7FD4C8" />
    </svg>
  )
}

/** The wave that marks the drop-off day, on a short flag pole. */
function TinyWave(): JSX.Element {
  return (
    <svg width="20" height="14" viewBox="0 0 40 28" aria-hidden="true" focusable="false">
      <path d="M7 26V4" stroke="#0F2E28" strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M7 4h20c4 0 6 2.4 6 5.4S31 15 27 15H7z"
        fill="#F2542E"
      />
      <path
        d="M2 24c3.4-3 6.6-3 10 0s6.6 3 10 0 6.6-3 10 0"
        fill="none"
        stroke="#0B7458"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* -------------------------------------------------------------- road maths */

interface RoadShape {
  d: string
  width: number
  height: number
}

/**
 * Turns the highlighted cells into a road.
 *
 * Cells in the same row of the same month become one straight run, laid along
 * the bottom of the tiles so it passes under the numerals instead of striking
 * through them. Where a range wraps onto the next week the road hooks off the
 * right edge of the grid and picks up again at the left, the way a line of text
 * wraps; where it crosses into the second month on desktop it climbs the gutter
 * between the two grids. Both beat a straight connector, which reads as a line
 * slashing across the calendar rather than as a road.
 *
 * Every coordinate comes from the live layout, so one routine covers the phone's
 * single month and the desktop pair.
 */
function useRoadPath(
  hostRef: { readonly current: HTMLElement | null },
  deps: string[],
): RoadShape | null {
  const [shape, setShape] = useState<RoadShape | null>(null)
  const signature = deps.join('|')

  const measure = useCallback(() => {
    const host = hostRef.current
    if (!host) {
      setShape(null)
      return
    }
    const cells = Array.from(host.querySelectorAll<HTMLElement>('[data-inroad="true"]'))
    if (cells.length < 2) {
      setShape(null)
      return
    }

    const base = host.getBoundingClientRect()
    interface Run {
      x1: number
      x2: number
      y: number
      /** Bounds of the month grid this run belongs to, so the road can leave it. */
      left: number
      right: number
      grid: string
    }
    const runs: Run[] = []
    let group = ''
    for (const cell of cells) {
      const next = cell.dataset.group ?? ''
      const rect = cell.getBoundingClientRect()
      const cx = rect.left - base.left + rect.width / 2
      // The road rides the lower third of the tile, under the numeral.
      const cy = rect.bottom - base.top - 9
      if (next !== group) {
        const grid = cell.closest('[role="grid"]')
        const gridRect = grid ? grid.getBoundingClientRect() : base
        runs.push({
          x1: cx,
          x2: cx,
          y: cy,
          left: gridRect.left - base.left,
          right: gridRect.right - base.left,
          grid: next.split(':')[0],
        })
        group = next
      } else {
        runs[runs.length - 1].x2 = cx
      }
    }

    const n = (value: number) => value.toFixed(1)
    let d = ''
    runs.forEach((run, index) => {
      d += `M${n(run.x1)} ${n(run.y)}L${n(run.x2)} ${n(run.y)}`
      const next = runs[index + 1]
      if (!next) return

      const exitX = run.right - 2
      const entryX = next.left + 2

      // Off the right edge of the week that is ending.
      d += `M${n(run.x2)} ${n(run.y)}C${n(run.x2 + 16)} ${n(run.y)},${n(exitX - 10)} ${n(run.y)},${n(exitX)} ${n(run.y)}`

      // Between the two desktop months, climb the gutter rather than cutting
      // back across the grid.
      if (next.grid !== run.grid) {
        const gutter = (run.right + next.left) / 2
        d += `M${n(exitX)} ${n(run.y)}C${n(gutter)} ${n(run.y)},${n(gutter)} ${n(next.y)},${n(entryX)} ${n(next.y)}`
      }

      // And back in from the left edge of the week that is starting.
      d += `M${n(entryX)} ${n(next.y)}C${n(entryX + 10)} ${n(next.y)},${n(next.x1 - 16)} ${n(next.y)},${n(next.x1)} ${n(next.y)}`
    })

    setShape({
      d,
      width: Math.max(1, Math.round(base.width)),
      height: Math.max(1, Math.round(base.height)),
    })
  }, [hostRef])

  useLayoutEffect(() => {
    measure()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, measure])

  useEffect(() => {
    const host = hostRef.current
    if (!host || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => measure())
    observer.observe(host)
    return () => observer.disconnect()
  }, [hostRef, measure])

  return shape
}

export default DateRangeField

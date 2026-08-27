import { parseISODate, toISODate, todayISO } from './pricing'

/**
 * Grid math for the trip planner. Everything here is pure and works in ISO
 * strings, which sort lexicographically, so a date compare is a string compare.
 *
 * Months are addressed by a "YYYY-MM" key rather than a Date, so the picker can
 * carry the visible month in state without ever holding a mutable Date.
 */

export interface DayCell {
  /** YYYY-MM-DD. Empty for the padding cells around the month. */
  iso: string
  /** Day of the month, or 0 for padding. */
  day: number
  /** False for the leading and trailing padding cells. */
  inMonth: boolean
  /** Before today. Never selectable. */
  isPast: boolean
  isToday: boolean
  /** Saturday or Sunday, which get the sun-gold corner tick. */
  isWeekend: boolean
  /** 0-based row within the grid, used to group the road into runs. */
  row: number
}

export const WEEKDAY_LABELS = [
  { short: 'Su', long: 'Sunday' },
  { short: 'Mo', long: 'Monday' },
  { short: 'Tu', long: 'Tuesday' },
  { short: 'We', long: 'Wednesday' },
  { short: 'Th', long: 'Thursday' },
  { short: 'Fr', long: 'Friday' },
  { short: 'Sa', long: 'Saturday' },
] as const

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** "2026-03" for the month that contains an ISO date. */
export function monthKeyOf(iso: string): string {
  const date = parseISODate(iso)
  if (!date) return monthKeyOf(todayISO())
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function partsOf(key: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(key)
  if (!match) {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  }
  return { year: Number(match[1]), month: Number(match[2]) - 1 }
}

export function addMonths(key: string, delta: number): string {
  const { year, month } = partsOf(key)
  const shifted = new Date(year, month + delta, 1)
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}`
}

/** "March 2026". */
export function monthLabel(key: string): string {
  const { year, month } = partsOf(key)
  return `${MONTH_NAMES[month]} ${year}`
}

/** 0 for January through 11 for December. Drives the sun along its arc. */
export function monthOfYear(key: string): number {
  return partsOf(key).month
}

/** Lexicographic month compare: negative when a is earlier. */
export function compareMonths(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * Six weeks of cells, Sunday first, trimmed of any wholly empty trailing row.
 * Padding cells carry no date, so the road can never run over a day that is not
 * part of the month being shown.
 */
export function buildMonthGrid(key: string, today: string = todayISO()): DayCell[][] {
  const { year, month } = partsOf(key)
  const first = new Date(year, month, 1)
  const lead = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const rows: DayCell[][] = []
  let cursor = 1 - lead

  for (let row = 0; row < 6; row += 1) {
    const cells: DayCell[] = []
    for (let column = 0; column < 7; column += 1) {
      const day = cursor
      cursor += 1
      if (day < 1 || day > daysInMonth) {
        cells.push({
          iso: '',
          day: 0,
          inMonth: false,
          isPast: false,
          isToday: false,
          isWeekend: column === 0 || column === 6,
          row,
        })
        continue
      }
      const iso = toISODate(new Date(year, month, day))
      cells.push({
        iso,
        day,
        inMonth: true,
        isPast: iso < today,
        isToday: iso === today,
        isWeekend: column === 0 || column === 6,
        row,
      })
    }
    if (cells.some((cell) => cell.inMonth)) rows.push(cells)
  }

  return rows
}

/** Inclusive membership, tolerant of a half-made selection. */
export function withinRange(iso: string, start: string, end: string): boolean {
  if (!iso || !start || !end) return false
  const lo = start <= end ? start : end
  const hi = start <= end ? end : start
  return iso >= lo && iso <= hi
}

/** 0 for Sunday through 6 for Saturday, read locally rather than in UTC. */
export function weekdayIndex(iso: string): number {
  const date = parseISODate(iso)
  return date ? date.getDay() : 0
}

/**
 * The same day one or more months away, clamped to the end of a shorter month
 * so the 31st never falls through February.
 */
export function shiftMonths(iso: string, delta: number): string {
  const date = parseISODate(iso)
  if (!date) return iso
  const day = date.getDate()
  const target = new Date(date.getFullYear(), date.getMonth() + delta, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, lastDay))
  return toISODate(target)
}

/** Moves an ISO date by a number of days without touching the caller's value. */
export function shiftDays(iso: string, amount: number): string {
  const date = parseISODate(iso)
  if (!date) return iso
  date.setDate(date.getDate() + amount)
  return toISODate(date)
}

/** "March 12, 2026" for the cell's accessible name. */
export function longDateLabel(iso: string): string {
  const date = parseISODate(iso)
  if (!date) return iso
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/**
 * A start and end in the order the rest of the app expects. Picking the end
 * before the start swaps them rather than rejecting the pick.
 */
export function orderRange(a: string, b: string): { start: string; end: string } {
  return a <= b ? { start: a, end: b } : { start: b, end: a }
}

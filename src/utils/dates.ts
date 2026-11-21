export const MONTH_SHORT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
] as const

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

export const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export const DAY_INITIAL = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const

export interface ISOWeekInfo {
  year: number
  weekNumber: number
  weekKey: string // `${year}-W${weekNumber}`
  startKey: string // Monday YYYY-MM-DD
  endKey: string // Sunday YYYY-MM-DD
  days: string[] // 7 YYYY-MM-DD strings (Mon..Sun)
  monthIndex: number // 0..11 (based on Thursday of the ISO week)
  quarter: 1 | 2 | 3 | 4
  dateRangeLabel: string // e.g. "Nov 16-22" or "Jan 26 to Feb 1"
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function getTodayKey(): string {
  return formatDateKey(new Date())
}

export function addDays(key: string, delta: number): string {
  const d = parseDateKey(key)
  d.setDate(d.getDate() + delta)
  return formatDateKey(d)
}

export function diffDays(aKey: string, bKey: string): number {
  const a = parseDateKey(aKey)
  const b = parseDateKey(bKey)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function formatPrettyDay(key: string): string {
  const d = parseDateKey(key)
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
  return `${dow} ${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`
}

export function formatShortRange(startKey: string, endKey: string): string {
  const s = parseDateKey(startKey)
  const e = parseDateKey(endKey)
  if (startKey === endKey) {
    return `${MONTH_ABBR[s.getMonth()]} ${s.getDate()}`
  }
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${MONTH_ABBR[s.getMonth()]} ${s.getDate()}-${e.getDate()}`
  }
  return `${MONTH_ABBR[s.getMonth()]} ${s.getDate()} to ${MONTH_ABBR[e.getMonth()]} ${e.getDate()}`
}

export function getMondayOfISOWeek1(year: number): Date {
  // ISO week 1 is the week containing Jan 4 (equivalently, the year's first Thursday)
  const jan4 = new Date(year, 0, 4)
  const day = jan4.getDay() // 0=Sun..6=Sat
  const isoDay = day === 0 ? 7 : day // 1=Mon..7=Sun
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - (isoDay - 1))
  return monday
}

export function getISOWeeksForYear(year: number): ISOWeekInfo[] {
  const startMonday = getMondayOfISOWeek1(year)
  const nextYearMonday = getMondayOfISOWeek1(year + 1)
  const totalWeeks = Math.round((nextYearMonday.getTime() - startMonday.getTime()) / (7 * 86_400_000))

  const weeks: ISOWeekInfo[] = []
  for (let w = 1; w <= totalWeeks; w++) {
    const mon = new Date(startMonday)
    mon.setDate(startMonday.getDate() + (w - 1) * 7)
    const days: string[] = []
    for (let i = 0; i < 7; i++) {
      const cur = new Date(mon)
      cur.setDate(mon.getDate() + i)
      days.push(formatDateKey(cur))
    }
    // ISO week belongs to the month of its Thursday (index 3)
    const thu = parseDateKey(days[3])
    const monthIndex = thu.getMonth()
    const quarter = (Math.floor(monthIndex / 3) + 1) as 1 | 2 | 3 | 4
    weeks.push({
      year,
      weekNumber: w,
      weekKey: `${year}-W${w}`,
      startKey: days[0],
      endKey: days[6],
      days,
      monthIndex,
      quarter,
      dateRangeLabel: formatShortRange(days[0], days[6]),
    })
  }
  return weeks
}

export function getISOWeekInfoForDate(dateKey: string): { year: number; weekNumber: number; weekKey: string } {
  const d = parseDateKey(dateKey)
  const day = d.getDay()
  const isoDay = day === 0 ? 7 : day
  const thu = new Date(d)
  thu.setDate(d.getDate() + (4 - isoDay))
  const isoYear = thu.getFullYear()
  const week1Mon = getMondayOfISOWeek1(isoYear)
  const diff = Math.round((thu.getTime() - week1Mon.getTime()) / 86_400_000)
  const weekNumber = Math.floor(diff / 7) + 1
  return { year: isoYear, weekNumber, weekKey: `${isoYear}-W${weekNumber}` }
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function isWeekendKey(dateKey: string): boolean {
  const dow = parseDateKey(dateKey).getDay()
  return dow === 0 || dow === 6
}

export function getYearProgress(year: number, todayKey: string, totalWeeks: number) {
  const today = parseDateKey(todayKey)
  const todayYear = today.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)
  const totalDays = Math.round((dec31.getTime() - jan1.getTime()) / 86_400_000) + 1

  if (todayYear > year) {
    return {
      currentWeek: totalWeeks,
      totalWeeks,
      daysLeft: 0,
      percentGone: 100,
      isCurrentYear: false,
    }
  }
  if (todayYear < year) {
    return {
      currentWeek: 0,
      totalWeeks,
      daysLeft: totalDays,
      percentGone: 0,
      isCurrentYear: false,
    }
  }

  const dayOfYear = Math.round((today.getTime() - jan1.getTime()) / 86_400_000) + 1
  const daysLeft = Math.max(0, totalDays - dayOfYear)
  const percentGone = Math.min(100, Math.round((dayOfYear / totalDays) * 100))
  const { weekNumber } = getISOWeekInfoForDate(todayKey)

  return {
    currentWeek: Math.min(totalWeeks, weekNumber),
    totalWeeks,
    daysLeft,
    percentGone,
    isCurrentYear: true,
  }
}

export function formatMinutes(mins: number): string {
  if (mins <= 0) return '0 min'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

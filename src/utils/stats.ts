import type { Habit, LabEntry, YearBoardData } from '../types/yearBoard'
import { addDays, getISOWeekInfoForDate, getISOWeeksForYear, type ISOWeekInfo } from './dates'

export function getLabMinutesForDate(labEntries: LabEntry[], dateKey: string): number {
  let total = 0
  for (const e of labEntries) {
    if (e.date === dateKey) total += e.minutes
  }
  return total
}

export function isHabitDoneOnDate(
  habit: Habit,
  dateKey: string,
  habitCheckins: YearBoardData['habitCheckins'],
  labEntries: LabEntry[],
): boolean {
  if (habitCheckins[habit.id]?.[dateKey]) return true
  if (habit.isLabs) {
    const target = habit.dailyMinutesTarget ?? 20
    return getLabMinutesForDate(labEntries, dateKey) >= target
  }
  return false
}

export function getHabitWeekCount(
  habit: Habit,
  week: ISOWeekInfo,
  habitCheckins: YearBoardData['habitCheckins'],
  labEntries: LabEntry[],
): number {
  let count = 0
  for (const day of week.days) {
    if (isHabitDoneOnDate(habit, day, habitCheckins, labEntries)) {
      count++
    }
  }
  return count
}

export function getHabitStreak(
  habit: Habit,
  todayKey: string,
  habitCheckins: YearBoardData['habitCheckins'],
  labEntries: LabEntry[],
): { count: number; unit: 'day' | 'week' } {
  if (habit.weeklyTarget >= 7) {
    // Daily streak ending today (or yesterday if today not yet done)
    let cursor = todayKey
    if (!isHabitDoneOnDate(habit, cursor, habitCheckins, labEntries)) {
      cursor = addDays(cursor, -1)
    }
    let streak = 0
    for (let i = 0; i < 400; i++) {
      if (isHabitDoneOnDate(habit, cursor, habitCheckins, labEntries)) {
        streak++
        cursor = addDays(cursor, -1)
      } else {
        break
      }
    }
    return { count: streak, unit: 'day' }
  }

  // Weekly streak: consecutive ISO weeks hitting weeklyTarget
  const currentIso = getISOWeekInfoForDate(todayKey)
  const weeksThisYear = getISOWeeksForYear(currentIso.year)
  const weeksPrevYear = getISOWeeksForYear(currentIso.year - 1)
  const allWeeks = [...weeksPrevYear, ...weeksThisYear]
  const curIdx = allWeeks.findIndex(
    (w) => w.year === currentIso.year && w.weekNumber === currentIso.weekNumber,
  )
  if (curIdx === -1) return { count: 0, unit: 'week' }

  let idx = curIdx
  const curCount = getHabitWeekCount(habit, allWeeks[idx], habitCheckins, labEntries)
  let streak = 0
  if (curCount >= habit.weeklyTarget) {
    streak++
  }
  idx--
  while (idx >= 0) {
    const c = getHabitWeekCount(habit, allWeeks[idx], habitCheckins, labEntries)
    if (c >= habit.weeklyTarget) {
      streak++
      idx--
    } else {
      break
    }
  }
  return { count: streak, unit: 'week' }
}

export function getPerfectWeeksStats(
  year: number,
  todayKey: string,
  habits: Habit[],
  habitCheckins: YearBoardData['habitCheckins'],
  labEntries: LabEntry[],
): {
  total: number
  bestRun: number
  perfectWeekKeys: Set<string>
} {
  const perfectWeekKeys = new Set<string>()
  if (habits.length === 0) {
    return { total: 0, bestRun: 0, perfectWeekKeys }
  }

  const weeks = getISOWeeksForYear(year)
  let total = 0
  let currentRun = 0
  let bestRun = 0

  for (const week of weeks) {
    // Only count weeks that have started
    if (week.startKey > todayKey) {
      currentRun = 0
      continue
    }
    const allHit = habits.every(
      (h) => getHabitWeekCount(h, week, habitCheckins, labEntries) >= h.weeklyTarget,
    )
    if (allHit) {
      perfectWeekKeys.add(week.weekKey)
      total++
      currentRun++
      if (currentRun > bestRun) bestRun = currentRun
    } else {
      currentRun = 0
    }
  }

  return { total, bestRun, perfectWeekKeys }
}

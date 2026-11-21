import {
  addDays,
  formatDateKey,
  getISOWeekInfoForDate,
  getTodayKey,
  parseDateKey,
  type Habit,
  type Plan,
  type QuarterGoal,
  type YearBoardData,
} from '@year-board/shared'

function yDate(year: number, month: number, day: number): string {
  return formatDateKey(new Date(year, month - 1, day))
}

export function createSampleYearBoardData(): YearBoardData {
  const todayKey = getTodayKey()
  const today = parseDateKey(todayKey)
  const year = today.getFullYear()
  const curIso = getISOWeekInfoForDate(todayKey)

  const habits: Habit[] = [
    { id: 'habit-gym', name: 'Gym', color: 'green', weeklyTarget: 4 },
    { id: 'habit-read', name: 'Read 20 min', color: 'purple', weeklyTarget: 7 },
    { id: 'habit-meditate', name: 'Meditate', color: 'blue', weeklyTarget: 7 },
  ]

  const plans: Plan[] = [
    { id: 'p-1', title: 'Set the year up', startDate: yDate(year, 1, 5), endDate: yDate(year, 1, 5), category: 'work', status: 'done' },
    { id: 'p-2', title: 'Rust sprint', startDate: yDate(year, 1, 12), endDate: yDate(year, 1, 16), category: 'learning', status: 'done' },
    { id: 'p-3', title: 'Jaipur trip', startDate: yDate(year, 2, 6), endDate: yDate(year, 2, 9), category: 'travel', status: 'done' },
    { id: 'p-4', title: 'First 10k run', startDate: yDate(year, 3, 1), endDate: yDate(year, 3, 1), category: 'health', status: 'done' },
    { id: 'p-5', title: 'Q1 review', startDate: yDate(year, 3, 5), endDate: yDate(year, 3, 6), category: 'work', status: 'done' },
    { id: 'p-6', title: 'Q2 planning', startDate: yDate(year, 3, 30), endDate: yDate(year, 3, 31), category: 'work', status: 'done' },
    { id: 'p-7', title: "Mom's birthday", startDate: yDate(year, 4, 15), endDate: yDate(year, 4, 15), category: 'personal', status: 'done' },
    { id: 'p-8', title: 'Manali workcation', startDate: yDate(year, 5, 4), endDate: yDate(year, 5, 13), category: 'travel', status: 'done' },
    { id: 'p-9', title: 'Talk prep', startDate: yDate(year, 5, 26), endDate: yDate(year, 5, 28), category: 'learning', status: 'missed' },
    { id: 'p-10', title: 'Conference', startDate: yDate(year, 6, 12), endDate: yDate(year, 6, 13), category: 'learning', status: 'done' },
    { id: 'p-11', title: 'Mid-year review', startDate: yDate(year, 7, 1), endDate: yDate(year, 7, 1), category: 'work', status: 'done' },
    { id: 'p-12', title: 'Half marathon', startDate: yDate(year, 8, 2), endDate: yDate(year, 8, 2), category: 'health', status: 'done' },
    { id: 'p-13', title: 'Independence Day', startDate: yDate(year, 8, 15), endDate: yDate(year, 8, 15), category: 'personal', status: 'done' },
    { id: 'p-14', title: 'Launch week', startDate: yDate(year, 9, 1), endDate: yDate(year, 9, 3), category: 'work', status: 'done' },
    { id: 'p-15', title: 'Q4 planning', startDate: yDate(year, 9, 28), endDate: yDate(year, 9, 28), category: 'work', status: 'done' },
    { id: 'p-16', title: 'Goa', startDate: yDate(year, 10, 22), endDate: yDate(year, 10, 25), category: 'travel', status: 'done' },
    { id: 'p-17', title: 'Diwali', startDate: yDate(year, 11, 8), endDate: yDate(year, 11, 8), category: 'personal', status: 'done' },
    { id: 'p-18', title: 'Gym with Riya', startDate: yDate(year, 11, 9), endDate: yDate(year, 11, 9), category: 'health', status: 'done' },
    { id: 'p-19', title: 'Recording week', startDate: yDate(year, 11, 10), endDate: yDate(year, 11, 12), category: 'work', status: 'done' },
    { id: 'p-20', title: 'Read: Deep Work', startDate: yDate(year, 11, 16), endDate: yDate(year, 11, 20), category: 'learning', status: 'planned' },
    { id: 'p-21', title: 'Year-end retro', startDate: yDate(year, 12, 4), endDate: yDate(year, 12, 4), category: 'work', status: 'planned' },
    { id: 'p-22', title: 'Year-end break', startDate: yDate(year, 12, 24), endDate: yDate(year, 12, 30), category: 'travel', status: 'planned' },
    { id: 'p-23', title: "New Year's Eve", startDate: yDate(year, 12, 31), endDate: yDate(year, 12, 31), category: 'personal', status: 'planned' },
  ]

  const habitCheckins: Record<string, Record<string, boolean>> = {
    'habit-gym': {},
    'habit-read': {},
    'habit-meditate': {},
  }

  const jan1 = new Date(year, 0, 1)
  const totalDays = Math.floor((today.getTime() - jan1.getTime()) / 86_400_000)

  for (let i = 0; i <= totalDays; i++) {
    const key = addDays(yDate(year, 1, 1), i)
    const d = parseDateKey(key)
    const dow = d.getDay()
    const daysAgo = totalDays - i

    if (daysAgo <= 63) {
      if (dow === 1 || dow === 3 || dow === 5 || dow === 6) {
        habitCheckins['habit-gym'][key] = true
      }
    } else {
      const hash = (i * 37 + 13) % 10
      if ((dow === 1 || dow === 3 || dow === 5 || dow === 6) && hash > 2) {
        habitCheckins['habit-gym'][key] = true
      }
    }

    if (daysAgo < 63) {
      habitCheckins['habit-read'][key] = true
    } else if ((i * 19 + 5) % 10 > 2) {
      habitCheckins['habit-read'][key] = true
    }

    if (daysAgo < 67) {
      habitCheckins['habit-meditate'][key] = true
    } else if ((i * 23 + 7) % 10 > 2) {
      habitCheckins['habit-meditate'][key] = true
    }
  }

  const quarterGoals: QuarterGoal[] = [
    { id: 'qg-1', year, quarter: 1, title: 'Ship side project', done: true },
    { id: 'qg-2', year, quarter: 1, title: 'Run a 10k', done: true },
    { id: 'qg-3', year, quarter: 2, title: 'Speak at one conference', done: true },
    { id: 'qg-4', year, quarter: 3, title: 'Ship product v2', done: true },
    { id: 'qg-5', year, quarter: 3, title: 'Half marathon', done: true },
    { id: 'qg-6', year, quarter: 4, title: 'Read 12 books', done: false },
    { id: 'qg-7', year, quarter: 4, title: 'Take a real break', done: false },
  ]

  const weekMeta: YearBoardData['weekMeta'] = {
    [`${year}-W2`]: { focus: 'Set the year up', notes: 'Clean calendar, set Q1 goals, lock in workout days.' },
    [`${year}-W19`]: { focus: 'Work from the mountains', notes: '' },
    [`${year}-W36`]: { focus: 'Launch week', notes: 'Ship v2, monitor metrics, celebrate with the team.' },
    [curIso.weekKey]: {
      focus: 'Finish Q4 milestone',
      notes: 'Keep mornings clear for deep work. Wrap up Deep Work reading by Friday.',
    },
  }

  return {
    ownerName: 'My Year',
    plans,
    habits,
    habitCheckins,
    labEntries: [],
    quarterGoals,
    weekMeta,
    hiddenCategories: [],
    density: 'comfortable',
    view: 'weeks',
    theme: 'dark',
    tourSeen: false,
  }
}

export function createEmptyYearBoardData(): YearBoardData {
  return {
    ownerName: 'My Year',
    plans: [],
    habits: [],
    habitCheckins: {},
    labEntries: [],
    quarterGoals: [],
    weekMeta: {},
    hiddenCategories: [],
    density: 'comfortable',
    view: 'weeks',
    theme: 'dark',
    tourSeen: true,
  }
}

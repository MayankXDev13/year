export type CategoryId = 'work' | 'learning' | 'health' | 'travel' | 'personal'

export type HabitColor = 'green' | 'purple' | 'blue' | 'teal' | 'amber' | 'pink'

export type PlanStatus = 'planned' | 'done' | 'missed'

export type BoardView = 'weeks' | 'days'

export type BoardDensity = 'comfortable' | 'compact'

export type ShareScope = 'week' | 'month' | 'year'

export interface Plan {
  id: string
  title: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  category: CategoryId
  status: PlanStatus
  notes?: string
}

export interface Habit {
  id: string
  name: string
  color: HabitColor
  weeklyTarget: number // 1..7
  isLabs?: boolean
  dailyMinutesTarget?: number // e.g., 20 for Labs
}

export interface QuarterGoal {
  id: string
  year: number
  quarter: 1 | 2 | 3 | 4
  title: string
  done: boolean
}

export interface WeekMeta {
  focus: string
  notes: string
}

export interface LabEntry {
  id: string
  date: string // YYYY-MM-DD
  topic: string
  minutes: number
}

export interface YearBoardData {
  ownerName: string
  plans: Plan[]
  habits: Habit[]
  /** habitId -> Record<'YYYY-MM-DD', boolean> */
  habitCheckins: Record<string, Record<string, boolean>>
  /** Lab/focus logged minutes entries */
  labEntries: LabEntry[]
  quarterGoals: QuarterGoal[]
  /** `${year}-W${weekNumber}` -> WeekMeta */
  weekMeta: Record<string, WeekMeta>
  hiddenCategories: CategoryId[]
  density: BoardDensity
  view: BoardView
  theme: 'dark' | 'light'
  tourSeen: boolean
}

export const CATEGORIES: {
  id: CategoryId
  label: string
  colorVar: string
  tintVar: string
  inkVar: string
}[] = [
  { id: 'work', label: 'Work', colorVar: 'var(--yb-work)', tintVar: 'var(--yb-work-tint)', inkVar: 'var(--yb-work-ink)' },
  { id: 'learning', label: 'Learning', colorVar: 'var(--yb-learning)', tintVar: 'var(--yb-learning-tint)', inkVar: 'var(--yb-learning-ink)' },
  { id: 'health', label: 'Health', colorVar: 'var(--yb-health)', tintVar: 'var(--yb-health-tint)', inkVar: 'var(--yb-health-ink)' },
  { id: 'travel', label: 'Travel', colorVar: 'var(--yb-travel)', tintVar: 'var(--yb-travel-tint)', inkVar: 'var(--yb-travel-ink)' },
  { id: 'personal', label: 'Personal', colorVar: 'var(--yb-personal)', tintVar: 'var(--yb-personal-tint)', inkVar: 'var(--yb-personal-ink)' },
]

export const HABIT_COLORS: {
  id: HabitColor
  label: string
  colorVar: string
  tintVar: string
  inkVar: string
}[] = [
  { id: 'green', label: 'Green', colorVar: 'var(--yb-green)', tintVar: 'var(--yb-green-tint)', inkVar: 'var(--yb-green-ink)' },
  { id: 'purple', label: 'Purple', colorVar: 'var(--yb-purple)', tintVar: 'var(--yb-purple-tint)', inkVar: 'var(--yb-purple-ink)' },
  { id: 'blue', label: 'Blue', colorVar: 'var(--yb-blue)', tintVar: 'var(--yb-blue-tint)', inkVar: 'var(--yb-blue-ink)' },
  { id: 'teal', label: 'Teal', colorVar: 'var(--yb-teal)', tintVar: 'var(--yb-teal-tint)', inkVar: 'var(--yb-teal-ink)' },
  { id: 'amber', label: 'Amber', colorVar: 'var(--yb-amber)', tintVar: 'var(--yb-amber-tint)', inkVar: 'var(--yb-amber-ink)' },
  { id: 'pink', label: 'Pink', colorVar: 'var(--yb-pink)', tintVar: 'var(--yb-pink-tint)', inkVar: 'var(--yb-pink-ink)' },
]

export function getCategoryMeta(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]
}

export function getHabitColorMeta(color: HabitColor) {
  return HABIT_COLORS.find((c) => c.id === color) ?? HABIT_COLORS[0]
}

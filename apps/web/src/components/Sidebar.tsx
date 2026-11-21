import { useState } from 'react'
import {
  Archive,
  ArchiveRestore,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Flame,
  MoreHorizontal,
  Plus,
  X,
} from 'lucide-react'
import {
  CATEGORIES,
  formatPrettyDay,
  getHabitColorMeta,
  getHabitStreak,
  getHabitWeekCount,
  isHabitDoneOnDate,
  parseDateKey,
  type CategoryId,
  type Habit,
  type ISOWeekInfo,
  type LabEntry,
  type QuarterGoal,
  type YearBoardData,
} from '@year-board/shared'

interface SidebarProps {
  year: number
  todayKey: string
  currentWeek: ISOWeekInfo | undefined
  collapsed: boolean
  onToggleCollapse: () => void
  habits: Habit[]
  habitCheckins: YearBoardData['habitCheckins']
  labEntries: LabEntry[]
  activeHabitOverlayId: string | null
  onToggleHabitOverlay: (habitId: string) => void
  onToggleHabitToday: (habitId: string) => void
  onToggleArchiveHabit: (habitId: string, archived: boolean) => void
  onOpenAddHabit: () => void
  onOpenEditHabit: (habit: Habit) => void
  perfectWeeks: { total: number; bestRun: number }
  quarterGoals: QuarterGoal[]
  onToggleGoal: (goalId: string) => void
  onAddGoal: (quarter: 1 | 2 | 3 | 4, title: string) => void
  onDeleteGoal: (goalId: string) => void
  hiddenCategories: CategoryId[]
  onToggleCategory: (category: CategoryId) => void
}

export function Sidebar({
  year,
  todayKey,
  currentWeek,
  collapsed,
  onToggleCollapse,
  habits,
  habitCheckins,
  labEntries,
  activeHabitOverlayId,
  onToggleHabitOverlay,
  onToggleHabitToday,
  onToggleArchiveHabit,
  onOpenAddHabit,
  onOpenEditHabit,
  perfectWeeks,
  quarterGoals,
  onToggleGoal,
  onAddGoal,
  onDeleteGoal,
  hiddenCategories,
  onToggleCategory,
}: SidebarProps) {
  const [addingQuarter, setAddingQuarter] = useState<1 | 2 | 3 | 4 | null>(null)
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const activeHabits = habits.filter((h) => !h.archived)
  const archivedHabits = habits.filter((h) => h.archived)

  const todayDate = parseDateKey(todayKey)
  const todayYear = todayDate.getFullYear()
  const currentQuarter = (Math.floor(todayDate.getMonth() / 3) + 1) as 1 | 2 | 3 | 4

  if (collapsed) {
    return (
      <aside className="flex shrink-0 flex-col items-center gap-3 border-r border-[var(--card-edge)] px-2 py-4">
        <button
          type="button"
          aria-label="Expand sidebar"
          onClick={onToggleCollapse}
          className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[var(--card-edge)] bg-[var(--surface)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--card-edge-hover)] hover:text-[var(--foreground)]"
        >
          <ChevronRight className="size-4" />
        </button>
        {activeHabits.map((habit) => {
          const doneToday = isHabitDoneOnDate(habit, todayKey, habitCheckins, labEntries)
          const meta = getHabitColorMeta(habit.color)
          return (
            <button
              key={habit.id}
              type="button"
              title={`${habit.name} — click to toggle today`}
              onClick={() => onToggleHabitToday(habit.id)}
              style={{
                background: doneToday ? meta.colorVar : meta.tintVar,
                color: doneToday ? 'var(--yb-on)' : meta.inkVar,
              }}
              className="grid size-9 cursor-pointer place-items-center rounded-full transition-transform hover:scale-105"
            >
              <Check className="size-4 stroke-[2.5]" />
            </button>
          )
        })}
      </aside>
    )
  }

  return (
    <aside className="w-full shrink-0 border-b border-[var(--card-edge)] p-4 lg:w-[276px] lg:border-r lg:border-b-0 lg:px-5 lg:py-4">
      {/* Habits header */}
      <div data-tour="habits-section">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-[var(--muted-foreground)]">Habits · today</div>
            <div className="font-montserrat text-base font-semibold text-[var(--foreground)]">
              {formatPrettyDay(todayKey)}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Add habit"
              title="Add habit"
              onClick={onOpenAddHabit}
              className="grid size-7 cursor-pointer place-items-center rounded-md border border-[var(--card-edge)] bg-[var(--surface)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--card-edge-hover)] hover:text-[var(--foreground)]"
            >
              <Plus className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              onClick={onToggleCollapse}
              className="hidden size-7 cursor-pointer place-items-center rounded-md border border-[var(--card-edge)] bg-[var(--surface)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--card-edge-hover)] hover:text-[var(--foreground)] lg:grid"
            >
              <ChevronLeft className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Active habit cards */}
        {activeHabits.length === 0 ? (
          <button
            type="button"
            onClick={onOpenAddHabit}
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--card-edge-hover)] bg-[var(--surface)]/50 px-4 py-6 text-center transition-colors hover:bg-[var(--accent-surface)]"
          >
            <Plus className="size-5 text-[var(--muted-foreground)]" />
            <span className="text-xs font-semibold text-[var(--foreground)]">
              Add your first habit
            </span>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              Track daily or weekly streaks
            </span>
          </button>
        ) : (
          <div className="flex flex-col gap-2.5">
            {activeHabits.map((habit, idx) => {
              const meta = getHabitColorMeta(habit.color)
              const doneToday = isHabitDoneOnDate(habit, todayKey, habitCheckins, labEntries)
              const weekCount = currentWeek
                ? getHabitWeekCount(habit, currentWeek, habitCheckins, labEntries)
                : 0
              const streak = getHabitStreak(habit, todayKey, habitCheckins, labEntries)
              const isOverlay = activeHabitOverlayId === habit.id

              return (
                <div
                  key={habit.id}
                  style={{
                    background: meta.tintVar,
                    borderColor: isOverlay ? meta.colorVar : 'var(--card-edge)',
                    boxShadow: isOverlay ? `0 0 0 1px ${meta.colorVar}` : undefined,
                  }}
                  className="group relative flex items-center gap-3 rounded-xl border p-3 transition-all"
                >
                  {/* Circular toggle */}
                  <button
                    type="button"
                    aria-pressed={doneToday}
                    aria-label={
                      doneToday
                        ? `Undo ${habit.name} for today`
                        : `Mark ${habit.name} done for today`
                    }
                    onClick={() => onToggleHabitToday(habit.id)}
                    style={{
                      background: doneToday ? meta.colorVar : 'transparent',
                      borderColor: meta.colorVar,
                      color: doneToday ? 'var(--yb-on)' : meta.inkVar,
                    }}
                    className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border-2 transition-transform active:scale-95"
                  >
                    <Check
                      className={`size-5 stroke-[2.5] ${doneToday ? 'opacity-100' : 'opacity-35'}`}
                    />
                  </button>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-semibold text-[var(--foreground)]">
                        {habit.name}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                      <Flame className="size-3 shrink-0" style={{ color: 'var(--yb-flame)' }} />
                      <span className="truncate">
                        {streak.count}-{streak.unit} streak
                      </span>
                    </div>

                    {/* Segmented weekly bar */}
                    <div className="mt-2 flex items-center gap-1">
                      {Array.from({ length: habit.weeklyTarget }).map((_, barIdx) => {
                        const filled = barIdx < weekCount
                        return (
                          <span
                            key={barIdx}
                            style={{
                              background: filled ? meta.colorVar : 'var(--yb-cell-weekend)',
                            }}
                            className="h-1.5 flex-1 rounded-full transition-colors"
                          />
                        )
                      })}
                    </div>

                    <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                      {weekCount} of {habit.weeklyTarget} this week
                    </div>
                  </div>

                  {/* Right actions: edit + eye */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${habit.name}`}
                      onClick={() => onOpenEditHabit(habit)}
                      className="grid size-6 cursor-pointer place-items-center rounded-md text-[var(--muted-foreground)] opacity-60 transition-opacity hover:bg-black/15 hover:text-[var(--foreground)] hover:opacity-100 dark:hover:bg-white/10"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      data-tour={idx === 0 ? 'habit-eye' : undefined}
                      aria-pressed={isOverlay}
                      aria-label={
                        isOverlay
                          ? `Hide ${habit.name} from the year board`
                          : `Show ${habit.name} on the year board`
                      }
                      title={isOverlay ? 'Hide from year board' : 'Show on year board'}
                      onClick={() => onToggleHabitOverlay(habit.id)}
                      style={{
                        background: isOverlay ? meta.colorVar : 'transparent',
                        color: isOverlay ? 'var(--yb-on)' : 'var(--muted-foreground)',
                        borderColor: isOverlay ? meta.colorVar : 'var(--card-edge)',
                      }}
                      className="grid size-7 cursor-pointer place-items-center rounded-lg border transition-colors hover:border-[var(--card-edge-hover)]"
                    >
                      {isOverlay ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Archived habits collapsible */}
        {archivedHabits.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowArchived((s) => !s)}
              className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-surface)] hover:text-[var(--foreground)]"
            >
              <span className="inline-flex items-center gap-1.5">
                <Archive className="size-3.5" />
                Archived habits ({archivedHabits.length})
              </span>
              <ChevronDown
                className={`size-3.5 transition-transform ${showArchived ? 'rotate-180' : ''}`}
              />
            </button>

            {showArchived && (
              <div className="mt-1.5 flex flex-col gap-1.5">
                {archivedHabits.map((habit) => {
                  const meta = getHabitColorMeta(habit.color)
                  const isOverlay = activeHabitOverlayId === habit.id
                  const totalDone = Object.values(habitCheckins[habit.id] ?? {}).filter(Boolean).length

                  return (
                    <div
                      key={habit.id}
                      style={{
                        borderColor: isOverlay ? meta.colorVar : 'var(--card-edge)',
                      }}
                      className="flex items-center justify-between gap-2 rounded-lg border bg-[var(--surface)]/60 px-2.5 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full opacity-75"
                          style={{ background: meta.colorVar }}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-xs font-medium text-[var(--foreground)]">
                            {habit.name}
                          </div>
                          <div className="text-[10px] text-[var(--muted-foreground)]">
                            {totalDone} {totalDone === 1 ? 'day' : 'days'} logged
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          title={isOverlay ? 'Hide from year board' : 'Show past check-ins on board'}
                          onClick={() => onToggleHabitOverlay(habit.id)}
                          style={{
                            background: isOverlay ? meta.colorVar : 'transparent',
                            color: isOverlay ? 'var(--yb-on)' : 'var(--muted-foreground)',
                          }}
                          className="grid size-7 cursor-pointer place-items-center rounded-md border border-[var(--card-edge)] hover:border-[var(--card-edge-hover)]"
                        >
                          {isOverlay ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                        <button
                          type="button"
                          title={`Unarchive ${habit.name}`}
                          aria-label={`Unarchive ${habit.name}`}
                          onClick={() => onToggleArchiveHabit(habit.id, false)}
                          className="grid size-7 cursor-pointer place-items-center rounded-md border border-[var(--card-edge)] text-[var(--muted-foreground)] hover:border-[var(--card-edge-hover)] hover:text-[var(--foreground)]"
                        >
                          <ArchiveRestore className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Perfect weeks card */}
      <div
        data-tour="perfect-weeks"
        style={{ background: 'var(--yb-ok-tint)' }}
        className="mt-5 rounded-xl border border-[var(--card-edge)] p-3.5"
      >
        <div
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: 'var(--yb-ok-ink)' }}
        >
          <CheckCircle2 className="size-3.5" style={{ color: 'var(--yb-ok)' }} />
          Perfect weeks
        </div>
        <div className="font-montserrat mt-1 text-xl font-bold text-[var(--foreground)]">
          {perfectWeeks.total} perfect {perfectWeeks.total === 1 ? 'week' : 'weeks'}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
          {perfectWeeks.total} this year · best run {perfectWeeks.bestRun}{' '}
          {perfectWeeks.bestRun === 1 ? 'week' : 'weeks'}. A perfect week means every active habit
          hit its target.
        </p>
      </div>

      {/* Quarter goals */}
      <div data-tour="quarter-goals" className="mt-6">
        <div className="mb-2.5 text-xs font-medium text-[var(--muted-foreground)]">
          Quarter goals
        </div>
        <div className="flex flex-col gap-2">
          {([1, 2, 3, 4] as const).map((q) => {
            const goals = quarterGoals.filter((g) => g.year === year && g.quarter === q)
            const isCurrent = year === todayYear && q === currentQuarter
            const isPast = year < todayYear || (year === todayYear && q < currentQuarter)
            const allDone = goals.length > 0 && goals.every((g) => g.done)
            const badge = isCurrent ? 'Now' : allDone || isPast ? 'Done' : 'Upcoming'

            return (
              <div
                key={q}
                className={`rounded-xl border p-3 transition-colors ${
                  isCurrent
                    ? 'border-[var(--foreground)]/55 bg-[var(--surface)]'
                    : 'border-[var(--card-edge)] bg-[var(--surface)]/60'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--foreground)]">
                    Q{q} goals
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-medium ${
                        isCurrent ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
                      }`}
                    >
                      {badge}
                    </span>
                    {goals.length < 5 && (
                      <button
                        type="button"
                        aria-label={`Add Q${q} goal`}
                        onClick={() => {
                          setAddingQuarter(addingQuarter === q ? null : q)
                          setNewGoalTitle('')
                        }}
                        className="grid size-5 cursor-pointer place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--accent-surface)] hover:text-[var(--foreground)]"
                      >
                        <Plus className="size-3" />
                      </button>
                    )}
                  </div>
                </div>

                {goals.length === 0 && addingQuarter !== q ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingQuarter(q)
                      setNewGoalTitle('')
                    }}
                    className="cursor-pointer text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    + Add up to 5 goals
                  </button>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {goals.map((goal) => (
                      <li key={goal.id} className="group flex items-start gap-2 text-xs">
                        <button
                          type="button"
                          aria-pressed={goal.done}
                          aria-label={`${goal.done ? 'Mark not done' : 'Mark done'}: ${goal.title}`}
                          onClick={() => onToggleGoal(goal.id)}
                          className={`mt-0.5 grid size-4 shrink-0 cursor-pointer place-items-center rounded border transition-colors ${
                            goal.done
                              ? 'border-[var(--yb-ok)] bg-[var(--yb-ok)] text-[var(--yb-on)]'
                              : 'border-[var(--card-edge-hover)] hover:border-[var(--foreground)]'
                          }`}
                        >
                          {goal.done && <Check className="size-2.5 stroke-[3]" />}
                        </button>
                        <span
                          className={`min-w-0 flex-1 leading-snug ${
                            goal.done
                              ? 'text-[var(--muted-foreground)] line-through'
                              : 'text-[var(--foreground)]'
                          }`}
                        >
                          {goal.title}
                        </span>
                        <button
                          type="button"
                          aria-label={`Delete goal ${goal.title}`}
                          onClick={() => onDeleteGoal(goal.id)}
                          className="cursor-pointer text-[var(--muted-foreground)] opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                        >
                          <X className="size-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {addingQuarter === q && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (newGoalTitle.trim()) {
                        onAddGoal(q, newGoalTitle.trim())
                        setNewGoalTitle('')
                        setAddingQuarter(null)
                      }
                    }}
                    className="mt-2 flex items-center gap-1.5"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      placeholder={`New Q${q} goal...`}
                      className="h-7 min-w-0 flex-1 rounded-md border border-[var(--card-edge-hover)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
                    />
                    <button
                      type="submit"
                      className="h-7 cursor-pointer rounded-md bg-[var(--foreground)] px-2 text-xs font-medium text-[var(--background)]"
                    >
                      Add
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Category filters: Show */}
      <div data-tour="category-filters" className="mt-6">
        <div className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">Show</div>
        <div role="group" aria-label="Filter categories" className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const visible = !hiddenCategories.includes(cat.id)
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={visible}
                onClick={() => onToggleCategory(cat.id)}
                className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-medium transition-all ${
                  visible
                    ? 'border-[var(--card-edge-hover)] text-[var(--foreground)]'
                    : 'border-[var(--card-edge)] text-[var(--muted-foreground)] opacity-45 line-through'
                }`}
              >
                <span className="size-2 rounded-full" style={{ background: cat.colorVar }} />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

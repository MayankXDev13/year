import { useEffect } from 'react'
import { Check, ChevronLeft, ChevronRight, Pencil, Plus, X } from 'lucide-react'
import {
  DAY_INITIAL,
  DAY_SHORT,
  formatShortRange,
  getCategoryMeta,
  getHabitColorMeta,
  getHabitWeekCount,
  isHabitDoneOnDate,
  parseDateKey,
  type Habit,
  type ISOWeekInfo,
  type LabEntry,
  type Plan,
  type PlanStatus,
  type WeekMeta,
  type YearBoardData,
} from '@year-board/shared'

interface WeekDrawerProps {
  week: ISOWeekInfo | null
  todayKey: string
  currentWeekKey: string
  habits: Habit[]
  habitCheckins: YearBoardData['habitCheckins']
  labEntries: LabEntry[]
  plans: Plan[]
  weekMeta: WeekMeta
  onClose: () => void
  onNavigateWeek: (delta: -1 | 1) => void
  onUpdateWeekMeta: (weekKey: string, patch: Partial<WeekMeta>) => void
  onToggleHabitOnDate: (habitId: string, dateKey: string) => void
  onOpenNewPlan: (startDate: string, endDate: string) => void
  onOpenEditPlan: (plan: Plan) => void
  onCyclePlanStatus: (planId: string) => void
}

const STATUS_BADGE: Record<PlanStatus, { label: string; className: string }> = {
  planned: {
    label: 'Planned',
    className: 'border-[var(--card-edge-hover)] text-[var(--muted-foreground)]',
  },
  done: {
    label: 'Happened',
    className: 'border-[var(--yb-ok)]/50 bg-[var(--yb-ok-tint)] text-[var(--yb-ok-ink)]',
  },
  missed: {
    label: 'Missed',
    className: 'border-red-500/40 bg-red-500/10 text-red-400',
  },
}

export function WeekDrawer({
  week,
  todayKey,
  currentWeekKey,
  habits,
  habitCheckins,
  labEntries,
  plans,
  weekMeta,
  onClose,
  onNavigateWeek,
  onUpdateWeekMeta,
  onToggleHabitOnDate,
  onOpenNewPlan,
  onOpenEditPlan,
  onCyclePlanStatus,
}: WeekDrawerProps) {
  useEffect(() => {
    if (!week) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [week, onClose])

  if (!week) return null

  const isThisWeek = week.weekKey === currentWeekKey
  const isPastWeek = week.endKey < todayKey
  const weekTag = isThisWeek ? 'this week' : isPastWeek ? 'past' : 'upcoming'

  // Show active habits + any archived habit that has check-ins during this week
  const visibleHabits = habits.filter(
    (h) => !h.archived || getHabitWeekCount(h, week, habitCheckins, labEntries) > 0,
  )

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
      />

      <aside
        role="dialog"
        aria-label={`Week ${week.weekNumber} details`}
        className="relative z-10 flex h-full w-full max-w-[390px] flex-col border-r border-[var(--card-edge-hover)] bg-[var(--yb-sheet)] shadow-2xl"
      >
        {/* Drawer header */}
        <div className="flex items-start justify-between border-b border-[var(--card-edge)] px-5 py-4">
          <div>
            <div className="text-xs font-medium text-[var(--muted-foreground)]">
              Week {week.weekNumber} · {weekTag}
            </div>
            <h2 className="font-montserrat mt-0.5 text-xl font-bold text-[var(--foreground)]">
              {week.dateRangeLabel}, {week.year}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => onNavigateWeek(-1)}
              className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[var(--card-edge)] text-[var(--muted-foreground)] hover:border-[var(--card-edge-hover)] hover:text-[var(--foreground)]"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next week"
              onClick={() => onNavigateWeek(1)}
              className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[var(--card-edge)] text-[var(--muted-foreground)] hover:border-[var(--card-edge-hover)] hover:text-[var(--foreground)]"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Close week drawer"
              onClick={onClose}
              className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[var(--card-edge)] text-[var(--muted-foreground)] hover:border-[var(--card-edge-hover)] hover:text-[var(--foreground)]"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Week focus */}
          <div>
            <label
              htmlFor="week-focus-input"
              className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]"
            >
              Week focus · shows on the board
            </label>
            <input
              id="week-focus-input"
              type="text"
              value={weekMeta.focus}
              onChange={(e) => onUpdateWeekMeta(week.weekKey, { focus: e.target.value })}
              placeholder="Give this week a focus..."
              className="h-10 w-full rounded-lg border border-[var(--card-edge-hover)] bg-[var(--background)] px-3 text-sm font-medium text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)]/60 focus:border-[var(--foreground)]"
            />
          </div>

          {/* Habits this week grid */}
          {visibleHabits.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-[var(--muted-foreground)]">
                <span>Habits this week</span>
                <span className="text-[10px] opacity-75">Past &amp; today only</span>
              </div>
              <div className="grid grid-cols-[1fr_repeat(7,28px)_36px] items-center gap-1">
                <div />
                {DAY_INITIAL.map((d, i) => (
                  <div
                    key={i}
                    className="text-center text-[11px] font-medium text-[var(--muted-foreground)]"
                  >
                    {d}
                  </div>
                ))}
                <div />

                {visibleHabits.map((habit) => {
                  const meta = getHabitColorMeta(habit.color)
                  const count = getHabitWeekCount(habit, week, habitCheckins, labEntries)
                  return (
                    <div key={habit.id} className="contents">
                      <div className="flex items-center gap-1 truncate pr-2 text-xs font-medium text-[var(--foreground)]">
                        <span className={`truncate ${habit.archived ? 'opacity-60' : ''}`}>
                          {habit.name}
                        </span>
                      </div>

                      {week.days.map((dayKey) => {
                        const done = isHabitDoneOnDate(habit, dayKey, habitCheckins, labEntries)
                        const isToday = dayKey === todayKey
                        const isFuture = dayKey > todayKey
                        return (
                          <button
                            key={dayKey}
                            type="button"
                            disabled={isFuture}
                            aria-pressed={done}
                            title={
                              isFuture
                                ? "Can't log future days"
                                : `${habit.name} on ${dayKey}`
                            }
                            aria-label={
                              isFuture
                                ? `${habit.name} on ${dayKey} (future day locked)`
                                : `${habit.name} on ${dayKey}`
                            }
                            onClick={() => {
                              if (!isFuture) onToggleHabitOnDate(habit.id, dayKey)
                            }}
                            style={{
                              background: done ? meta.colorVar : 'transparent',
                              color: done ? 'var(--yb-on)' : 'transparent',
                              borderColor: isToday
                                ? 'var(--foreground)'
                                : done
                                  ? meta.colorVar
                                  : 'var(--card-edge-hover)',
                            }}
                            className={`grid size-7 place-items-center rounded-md border transition-transform ${
                              isFuture
                                ? 'cursor-not-allowed border-dashed opacity-30'
                                : 'cursor-pointer active:scale-95'
                            } ${isToday ? 'ring-1 ring-[var(--foreground)]' : ''}`}
                          >
                            {done && <Check className="size-3.5 stroke-[3]" />}
                          </button>
                        )
                      })}

                      <div className="font-mono-num text-right text-xs text-[var(--muted-foreground)]">
                        {count}/{habit.weeklyTarget}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Daily plans list Mon..Sun */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                Plans this week
              </span>
              <button
                type="button"
                onClick={() => onOpenNewPlan(week.startKey, week.startKey)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent-surface)]"
              >
                <Plus className="size-3.5" />
                Add plan
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {week.days.map((dayKey, idx) => {
                const d = parseDateKey(dayKey)
                const isToday = dayKey === todayKey
                const dayPlans = plans.filter((p) => p.startDate <= dayKey && p.endDate >= dayKey)

                return (
                  <div
                    key={dayKey}
                    className={`flex items-start gap-3 rounded-xl border p-2.5 transition-colors ${
                      isToday
                        ? 'border-[var(--foreground)]/50 bg-[var(--accent-surface)]'
                        : 'border-[var(--card-edge)] bg-[var(--background)]/40'
                    }`}
                  >
                    <button
                      type="button"
                      title={`Add plan on ${dayKey}`}
                      onClick={() => onOpenNewPlan(dayKey, dayKey)}
                      className="flex w-10 shrink-0 cursor-pointer flex-col items-center rounded-lg bg-[var(--surface)] py-1 text-center hover:bg-[var(--accent-surface)]"
                    >
                      <span className="text-[10px] font-medium text-[var(--muted-foreground)]">
                        {DAY_SHORT[idx]}
                      </span>
                      <span className="font-montserrat text-sm font-bold text-[var(--foreground)]">
                        {d.getDate()}
                      </span>
                    </button>

                    <div className="min-w-0 flex-1 pt-0.5">
                      {dayPlans.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => onOpenNewPlan(dayKey, dayKey)}
                          className="cursor-pointer text-xs text-[var(--muted-foreground)]/70 hover:text-[var(--foreground)]"
                        >
                          Nothing planned
                        </button>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {dayPlans.map((plan) => {
                            const cat = getCategoryMeta(plan.category)
                            const badge = STATUS_BADGE[plan.status]
                            return (
                              <div
                                key={plan.id}
                                style={{
                                  background: cat.tintVar,
                                  borderColor:
                                    plan.status === 'missed' ? cat.colorVar : 'transparent',
                                }}
                                className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="size-2 shrink-0 rounded-full"
                                      style={{ background: cat.colorVar }}
                                    />
                                    <span
                                      className={`truncate text-xs font-semibold ${
                                        plan.status === 'missed'
                                          ? 'text-[var(--muted-foreground)] line-through'
                                          : 'text-[var(--foreground)]'
                                      }`}
                                    >
                                      {plan.title}
                                    </span>
                                  </div>
                                  <div className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                                    {formatShortRange(plan.startDate, plan.endDate)} · {cat.label}
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    type="button"
                                    title="Cycle status: Planned → Happened → Missed"
                                    onClick={() => onCyclePlanStatus(plan.id)}
                                    className={`cursor-pointer rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${badge.className}`}
                                  >
                                    {badge.label}
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Edit ${plan.title}`}
                                    onClick={() => onOpenEditPlan(plan)}
                                    className="grid size-6 cursor-pointer place-items-center rounded text-[var(--muted-foreground)] hover:bg-black/15 hover:text-[var(--foreground)] dark:hover:bg-white/10"
                                  >
                                    <Pencil className="size-3" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Week notes */}
          <div className="mt-5 pb-4">
            <label
              htmlFor="week-notes-input"
              className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]"
            >
              Notes
            </label>
            <textarea
              id="week-notes-input"
              rows={3}
              value={weekMeta.notes}
              onChange={(e) => onUpdateWeekMeta(week.weekKey, { notes: e.target.value })}
              placeholder="Reflections, wins, or reminders for this week..."
              className="w-full resize-none rounded-lg border border-[var(--card-edge-hover)] bg-[var(--background)] p-3 text-xs leading-relaxed text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]/60 focus:border-[var(--foreground)]"
            />
          </div>
        </div>
      </aside>
    </div>
  )
}

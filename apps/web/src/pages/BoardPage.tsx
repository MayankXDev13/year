import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Loader2, X } from 'lucide-react'
import {
  getHabitWeekCount,
  getISOWeekInfoForDate,
  getISOWeeksForYear,
  getPerfectWeeksStats,
  getTodayKey,
  getYearProgress,
  parseDateKey,
  type BoardDensity,
  type BoardView,
  type CategoryId,
  type Habit,
  type Plan,
  type PlanStatus,
  type ShareScope,
  type WeekMeta,
  type YearBoardData,
} from '@year-board/shared'
import { DaysBoard } from '../components/DaysBoard'
import { HabitModal, PlanModal, ShareModal } from '../components/Modals'
import { Sidebar } from '../components/Sidebar'
import { SpotlightTour } from '../components/SpotlightTour'
import { Toolbar } from '../components/Toolbar'
import { WeekDrawer } from '../components/WeekDrawer'
import { WeeksBoard } from '../components/WeeksBoard'
import { ApiError } from '../lib/api'
import { useSession } from '../lib/auth-client'
import { useBoardMutations, useBoardQuery } from '../lib/queries'
import { fireConfetti } from '../utils/confetti'
import { createSampleYearBoardData } from '../utils/sampleData'

const STORAGE_KEY = 'year-board-data-v1'

function loadLocalData(): YearBoardData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<YearBoardData>
      if (parsed && Array.isArray(parsed.plans) && Array.isArray(parsed.habits)) {
        return {
          ...createSampleYearBoardData(),
          ...parsed,
          habits: parsed.habits.filter((h) => !h.isLabs),
        }
      }
    }
  } catch {
    // ignore storage errors
  }
  return createSampleYearBoardData()
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function BoardPage() {
  const todayKey = useMemo(() => getTodayKey(), [])
  const todayDate = useMemo(() => parseDateKey(todayKey), [todayKey])
  const currentIso = useMemo(() => getISOWeekInfoForDate(todayKey), [todayKey])

  const { data: sessionData } = useSession()
  const authUser = sessionData?.user ?? null
  const isAuthenticated = Boolean(authUser)

  const [localData, setLocalData] = useState<YearBoardData>(loadLocalData)
  const [toastError, setToastError] = useState<string | null>(null)

  const boardQuery = useBoardQuery(isAuthenticated)
  const mutations = useBoardMutations((msg) => {
    if (msg.toLowerCase().includes('please sign in')) return
    setToastError(msg)
  })

  const data: YearBoardData = isAuthenticated && boardQuery.data ? boardQuery.data : localData

  const [year, setYear] = useState<number>(todayDate.getFullYear())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeHabitOverlayId, setActiveHabitOverlayId] = useState<string | null>(null)
  const [openWeekKey, setOpenWeekKey] = useState<string | null>(null)

  const [tourOpen, setTourOpen] = useState(false)
  const [shareScope, setShareScope] = useState<ShareScope | null>(null)
  const [planModal, setPlanModal] = useState<{
    open: boolean
    plan: Plan | null
    range: { startDate: string; endDate: string } | null
  }>({ open: false, plan: null, range: null })
  const [habitModal, setHabitModal] = useState<{
    open: boolean
    habit: Habit | null
  }>({ open: false, habit: null })

  const [dragRange, setDragRange] = useState<{ start: string; end: string } | null>(null)
  const dragDidMoveRef = useRef(false)
  const suppressNextClickRef = useRef(false)
  const weekMetaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localData))
    } catch {
      // ignore quota errors
    }
  }, [localData])

  useEffect(() => {
    if (!dragRange) return
    const handleMouseUp = () => {
      if (dragDidMoveRef.current) {
        const lo = dragRange.start <= dragRange.end ? dragRange.start : dragRange.end
        const hi = dragRange.start <= dragRange.end ? dragRange.end : dragRange.start
        suppressNextClickRef.current = true
        setPlanModal({ open: true, plan: null, range: { startDate: lo, endDate: hi } })
        setTimeout(() => {
          suppressNextClickRef.current = false
        }, 50)
      }
      setDragRange(null)
      dragDidMoveRef.current = false
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [dragRange])

  const weeks = useMemo(() => getISOWeeksForYear(year), [year])
  const currentYearWeeks = useMemo(
    () => (year === currentIso.year ? weeks : getISOWeeksForYear(currentIso.year)),
    [year, currentIso.year, weeks],
  )
  const currentWeekInfo = useMemo(
    () => currentYearWeeks.find((w) => w.weekKey === currentIso.weekKey),
    [currentYearWeeks, currentIso.weekKey],
  )

  const yearProgress = useMemo(
    () => getYearProgress(year, todayKey, weeks.length),
    [year, todayKey, weeks.length],
  )

  const visiblePlans = useMemo(() => {
    const hidden = new Set(data.hiddenCategories)
    return data.plans.filter((p) => !hidden.has(p.category))
  }, [data.plans, data.hiddenCategories])

  const perfectWeeks = useMemo(
    () => getPerfectWeeksStats(year, todayKey, data.habits, data.habitCheckins, data.labEntries),
    [year, todayKey, data.habits, data.habitCheckins, data.labEntries],
  )

  const activeHabitOverlay = useMemo(
    () => data.habits.find((h) => h.id === activeHabitOverlayId) ?? null,
    [data.habits, activeHabitOverlayId],
  )

  const openWeekObj = useMemo(() => {
    if (!openWeekKey) return null
    const inSelected = weeks.find((w) => w.weekKey === openWeekKey)
    if (inSelected) return inSelected
    const match = /^(\d{4})-W(\d+)$/.exec(openWeekKey)
    if (!match) return null
    return getISOWeeksForYear(Number(match[1])).find((w) => w.weekKey === openWeekKey) ?? null
  }, [openWeekKey, weeks])

  const handleDayMouseDown = useCallback((dateKey: string) => {
    dragDidMoveRef.current = false
    setDragRange({ start: dateKey, end: dateKey })
  }, [])

  const handleDayMouseEnter = useCallback((dateKey: string) => {
    setDragRange((prev) => {
      if (!prev) return null
      if (prev.start !== dateKey) dragDidMoveRef.current = true
      return { ...prev, end: dateKey }
    })
  }, [])

  const handleOpenWeek = useCallback((weekKey: string) => {
    if (suppressNextClickRef.current) return
    setOpenWeekKey(weekKey)
  }, [])

  const handleNavigateWeek = useCallback(
    (delta: -1 | 1) => {
      if (!openWeekObj) return
      const yearWeeks = getISOWeeksForYear(openWeekObj.year)
      const idx = yearWeeks.findIndex((w) => w.weekKey === openWeekObj.weekKey)
      if (idx === -1) return
      const nextIdx = idx + delta
      if (nextIdx >= 0 && nextIdx < yearWeeks.length) {
        setOpenWeekKey(yearWeeks[nextIdx].weekKey)
      } else if (delta === 1) {
        const nextYearWeeks = getISOWeeksForYear(openWeekObj.year + 1)
        setYear(openWeekObj.year + 1)
        setOpenWeekKey(nextYearWeeks[0].weekKey)
      } else {
        const prevYearWeeks = getISOWeeksForYear(openWeekObj.year - 1)
        setYear(openWeekObj.year - 1)
        setOpenWeekKey(prevYearWeeks[prevYearWeeks.length - 1].weekKey)
      }
    },
    [openWeekObj],
  )

  const handleJumpToThisWeek = useCallback(() => {
    setYear(currentIso.year)
    setTimeout(() => {
      const el = document.getElementById(`yb-w-${currentIso.weekNumber}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
  }, [currentIso])

  const handleToggleHabitOnDate = useCallback(
    (habitId: string, dateKey: string) => {
      // Strictly disallow future dates
      if (dateKey > todayKey) {
        setToastError('You can only update today or past days, not future dates.')
        return
      }

      // Check if toggling ON completes this habit's weekly target -> fire confetti!
      const habit = data.habits.find((h) => h.id === habitId)
      const currentlyDone = Boolean(data.habitCheckins[habitId]?.[dateKey])
      if (habit && !currentlyDone) {
        const targetIso = getISOWeekInfoForDate(dateKey)
        const targetWeek = getISOWeeksForYear(targetIso.year).find(
          (w) => w.weekKey === targetIso.weekKey,
        )
        if (targetWeek) {
          const beforeCount = getHabitWeekCount(habit, targetWeek, data.habitCheckins, data.labEntries)
          if (beforeCount < habit.weeklyTarget && beforeCount + 1 >= habit.weeklyTarget) {
            fireConfetti()
          }
        }
      }

      if (isAuthenticated) {
        mutations.toggleHabitCheckin.mutate({ habitId, dateKey, todayKey })
        return
      }

      setLocalData((prev) => {
        const currentMap = prev.habitCheckins[habitId] ?? {}
        const prevDone = !!currentMap[dateKey]
        const nextMap = { ...currentMap }
        if (prevDone) delete nextMap[dateKey]
        else nextMap[dateKey] = true
        return {
          ...prev,
          habitCheckins: { ...prev.habitCheckins, [habitId]: nextMap },
        }
      })
    },
    [todayKey, data.habits, data.habitCheckins, data.labEntries, isAuthenticated, mutations.toggleHabitCheckin],
  )

  const handleSavePlan = useCallback(
    (planInput: Omit<Plan, 'id'>, existingId?: string) => {
      if (isAuthenticated) {
        mutations.savePlan.mutate({ plan: planInput, existingId })
        return
      }
      setLocalData((prev) => {
        if (existingId) {
          return {
            ...prev,
            plans: prev.plans.map((p) =>
              p.id === existingId ? { ...planInput, id: existingId } : p,
            ),
          }
        }
        return {
          ...prev,
          plans: [...prev.plans, { ...planInput, id: uid('plan') }],
        }
      })
    },
    [isAuthenticated, mutations.savePlan],
  )

  const handleDeletePlan = useCallback(
    (planId: string) => {
      if (isAuthenticated) {
        mutations.deletePlan.mutate(planId)
        return
      }
      setLocalData((prev) => ({
        ...prev,
        plans: prev.plans.filter((p) => p.id !== planId),
      }))
    },
    [isAuthenticated, mutations.deletePlan],
  )

  const handleCyclePlanStatus = useCallback(
    (planId: string) => {
      const order: PlanStatus[] = ['planned', 'done', 'missed']
      const target = data.plans.find((p) => p.id === planId)
      if (!target) return
      const next = order[(order.indexOf(target.status) + 1) % order.length]
      if (isAuthenticated) {
        mutations.updatePlanStatus.mutate({ planId, status: next })
        return
      }
      setLocalData((prev) => ({
        ...prev,
        plans: prev.plans.map((p) => (p.id === planId ? { ...p, status: next } : p)),
      }))
    },
    [data.plans, isAuthenticated, mutations.updatePlanStatus],
  )

  const handleSaveHabit = useCallback(
    (habitInput: Omit<Habit, 'id'>, existingId?: string) => {
      if (isAuthenticated) {
        mutations.saveHabit.mutate({ habit: habitInput, existingId })
        return
      }
      setLocalData((prev) => {
        if (existingId) {
          return {
            ...prev,
            habits: prev.habits.map((h) =>
              h.id === existingId ? { ...habitInput, id: existingId } : h,
            ),
          }
        }
        return {
          ...prev,
          habits: [...prev.habits, { ...habitInput, id: uid('habit') }],
        }
      })
    },
    [isAuthenticated, mutations.saveHabit],
  )

  const handleToggleArchiveHabit = useCallback(
    (habitId: string, archived: boolean) => {
      if (isAuthenticated) {
        mutations.toggleArchiveHabit.mutate({ habitId, archived })
        return
      }
      setLocalData((prev) => ({
        ...prev,
        habits: prev.habits.map((h) => (h.id === habitId ? { ...h, archived } : h)),
      }))
    },
    [isAuthenticated, mutations.toggleArchiveHabit],
  )

  const handleDeleteHabit = useCallback(
    (habitId: string) => {
      setActiveHabitOverlayId((cur) => (cur === habitId ? null : cur))
      if (isAuthenticated) {
        mutations.deleteHabit.mutate(habitId)
        return
      }
      setLocalData((prev) => ({
        ...prev,
        habits: prev.habits.filter((h) => h.id !== habitId),
      }))
    },
    [isAuthenticated, mutations.deleteHabit],
  )

  const handleUpdateWeekMeta = useCallback(
    (weekKey: string, patch: Partial<WeekMeta>) => {
      const existing = data.weekMeta[weekKey] ?? { focus: '', notes: '' }
      const nextMeta: WeekMeta = { ...existing, ...patch }
      if (isAuthenticated) {
        if (weekMetaTimerRef.current) clearTimeout(weekMetaTimerRef.current)
        weekMetaTimerRef.current = setTimeout(() => {
          mutations.upsertWeekMeta.mutate({ weekKey, meta: nextMeta })
        }, 350)
      }
      setLocalData((prev) => ({
        ...prev,
        weekMeta: { ...prev.weekMeta, [weekKey]: nextMeta },
      }))
    },
    [data.weekMeta, isAuthenticated, mutations.upsertWeekMeta],
  )

  const handleToggleGoal = useCallback(
    (goalId: string) => {
      const target = data.quarterGoals.find((g) => g.id === goalId)
      if (!target) return
      if (isAuthenticated) {
        mutations.toggleGoal.mutate({ goalId, done: !target.done })
        return
      }
      setLocalData((prev) => ({
        ...prev,
        quarterGoals: prev.quarterGoals.map((g) =>
          g.id === goalId ? { ...g, done: !g.done } : g,
        ),
      }))
    },
    [data.quarterGoals, isAuthenticated, mutations.toggleGoal],
  )

  const handleAddGoal = useCallback(
    (quarter: 1 | 2 | 3 | 4, title: string) => {
      if (isAuthenticated) {
        mutations.addGoal.mutate({ year, quarter, title })
        return
      }
      setLocalData((prev) => ({
        ...prev,
        quarterGoals: [
          ...prev.quarterGoals,
          { id: uid('qg'), year, quarter, title, done: false },
        ],
      }))
    },
    [year, isAuthenticated, mutations.addGoal],
  )

  const handleDeleteGoal = useCallback(
    (goalId: string) => {
      if (isAuthenticated) {
        mutations.deleteGoal.mutate(goalId)
        return
      }
      setLocalData((prev) => ({
        ...prev,
        quarterGoals: prev.quarterGoals.filter((g) => g.id !== goalId),
      }))
    },
    [isAuthenticated, mutations.deleteGoal],
  )

  const handleToggleCategory = useCallback(
    (category: CategoryId) => {
      const exists = data.hiddenCategories.includes(category)
      const next = exists
        ? data.hiddenCategories.filter((c) => c !== category)
        : [...data.hiddenCategories, category]
      if (isAuthenticated) {
        mutations.updatePreferences.mutate({ hiddenCategories: next })
        return
      }
      setLocalData((prev) => ({ ...prev, hiddenCategories: next }))
    },
    [data.hiddenCategories, isAuthenticated, mutations.updatePreferences],
  )

  const handleUpdatePref = useCallback(
    (patch: Partial<Pick<YearBoardData, 'ownerName' | 'density' | 'view' | 'theme' | 'tourSeen'>>) => {
      if (isAuthenticated) {
        mutations.updatePreferences.mutate(patch)
        return
      }
      setLocalData((prev) => ({ ...prev, ...patch }))
    },
    [isAuthenticated, mutations.updatePreferences],
  )

  const queryErrorMessage =
    isAuthenticated &&
    boardQuery.isError &&
    !(boardQuery.error instanceof ApiError && boardQuery.error.status === 401)
      ? boardQuery.error instanceof Error
        ? boardQuery.error.message
        : 'Could not load your Year Board from the server.'
      : null

  return (
    <div className="yb-backdrop min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Toolbar
        year={year}
        onYearChange={setYear}
        onJumpToThisWeek={handleJumpToThisWeek}
        onOpenTour={() => setTourOpen(true)}
        view={data.view}
        onViewChange={(view: BoardView) => handleUpdatePref({ view })}
        density={data.density}
        onDensityChange={(density: BoardDensity) => handleUpdatePref({ density })}
        onOpenShare={(scope) => setShareScope(scope)}
        currentWeekInfo={currentWeekInfo}
        currentMonthIndex={todayDate.getMonth()}
      />

      {(toastError || queryErrorMessage) && (
        <div className="mx-auto max-w-[1440px] px-4 pt-3 sm:px-6">
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{toastError ?? queryErrorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setToastError(null)
                if (boardQuery.isError) boardQuery.refetch()
              }}
              className="grid size-6 cursor-pointer place-items-center rounded hover:bg-red-500/20"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {isAuthenticated && boardQuery.isLoading ? (
        <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading your Year Board...</span>
        </div>
      ) : (
        <div className="mx-auto flex max-w-[1440px] flex-col lg:flex-row">
          <Sidebar
            year={year}
            todayKey={todayKey}
            currentWeek={currentWeekInfo}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            habits={data.habits}
            habitCheckins={data.habitCheckins}
            labEntries={data.labEntries}
            activeHabitOverlayId={activeHabitOverlayId}
            onToggleHabitOverlay={(id) =>
              setActiveHabitOverlayId((cur) => (cur === id ? null : id))
            }
            onToggleHabitToday={(id) => handleToggleHabitOnDate(id, todayKey)}
            onToggleArchiveHabit={handleToggleArchiveHabit}
            onOpenAddHabit={() => setHabitModal({ open: true, habit: null })}
            onOpenEditHabit={(habit) => setHabitModal({ open: true, habit })}
            perfectWeeks={{ total: perfectWeeks.total, bestRun: perfectWeeks.bestRun }}
            quarterGoals={data.quarterGoals}
            onToggleGoal={handleToggleGoal}
            onAddGoal={handleAddGoal}
            onDeleteGoal={handleDeleteGoal}
            hiddenCategories={data.hiddenCategories}
            onToggleCategory={handleToggleCategory}
          />

          <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-7">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="font-montserrat shrink-0 text-sm font-bold text-[var(--foreground)]">
                Week {yearProgress.currentWeek} of {yearProgress.totalWeeks}
              </span>
              <div className="h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-[var(--yb-cell-weekend)]">
                <div
                  style={{ width: `${yearProgress.percentGone}%` }}
                  className="h-full rounded-full bg-[var(--foreground)]/85 transition-all duration-300"
                />
              </div>
              <span className="font-mono-num shrink-0 text-xs text-[var(--muted-foreground)]">
                {yearProgress.daysLeft} days left · {yearProgress.percentGone}% gone
              </span>
            </div>

            {data.view === 'weeks' ? (
              <WeeksBoard
                year={year}
                weeks={weeks}
                todayKey={todayKey}
                currentWeekKey={currentIso.weekKey}
                plans={visiblePlans}
                weekMeta={data.weekMeta}
                density={data.density}
                perfectWeekKeys={perfectWeeks.perfectWeekKeys}
                activeHabitOverlay={activeHabitOverlay}
                habitCheckins={data.habitCheckins}
                labEntries={data.labEntries}
                dragRange={dragRange}
                onDayMouseDown={handleDayMouseDown}
                onDayMouseEnter={handleDayMouseEnter}
                onOpenWeek={handleOpenWeek}
              />
            ) : (
              <DaysBoard
                year={year}
                todayKey={todayKey}
                plans={visiblePlans}
                density={data.density}
                activeHabitOverlay={activeHabitOverlay}
                habitCheckins={data.habitCheckins}
                labEntries={data.labEntries}
                dragRange={dragRange}
                onDayMouseDown={handleDayMouseDown}
                onDayMouseEnter={handleDayMouseEnter}
                onOpenWeek={handleOpenWeek}
              />
            )}
          </main>
        </div>
      )}

      <WeekDrawer
        week={openWeekObj}
        todayKey={todayKey}
        currentWeekKey={currentIso.weekKey}
        habits={data.habits}
        habitCheckins={data.habitCheckins}
        labEntries={data.labEntries}
        plans={visiblePlans}
        weekMeta={
          openWeekObj
            ? data.weekMeta[openWeekObj.weekKey] ?? { focus: '', notes: '' }
            : { focus: '', notes: '' }
        }
        onClose={() => setOpenWeekKey(null)}
        onNavigateWeek={handleNavigateWeek}
        onUpdateWeekMeta={handleUpdateWeekMeta}
        onToggleHabitOnDate={handleToggleHabitOnDate}
        onOpenNewPlan={(startDate, endDate) =>
          setPlanModal({ open: true, plan: null, range: { startDate, endDate } })
        }
        onOpenEditPlan={(plan) => setPlanModal({ open: true, plan, range: null })}
        onCyclePlanStatus={handleCyclePlanStatus}
      />

      {planModal.open && (
        <PlanModal
          key={planModal.plan?.id ?? `${planModal.range?.startDate}-${planModal.range?.endDate}`}
          open={planModal.open}
          initialPlan={planModal.plan}
          initialRange={planModal.range}
          onClose={() => setPlanModal({ open: false, plan: null, range: null })}
          onSave={handleSavePlan}
          onDelete={handleDeletePlan}
        />
      )}

      {habitModal.open && (
        <HabitModal
          key={habitModal.habit?.id ?? 'new-habit'}
          open={habitModal.open}
          initialHabit={habitModal.habit}
          onClose={() => setHabitModal({ open: false, habit: null })}
          onSave={handleSaveHabit}
          onToggleArchive={handleToggleArchiveHabit}
          onDelete={handleDeleteHabit}
        />
      )}

      {tourOpen && (
        <SpotlightTour
          open={tourOpen}
          currentWeekNumber={currentIso.weekNumber}
          onClose={() => {
            setTourOpen(false)
            if (!data.tourSeen) handleUpdatePref({ tourSeen: true })
          }}
        />
      )}

      <ShareModal
        open={shareScope !== null}
        scope={shareScope ?? 'year'}
        year={year}
        monthIndex={todayDate.getMonth()}
        week={currentWeekInfo}
        weeks={weeks}
        visiblePlans={visiblePlans}
        weekMeta={data.weekMeta}
        quarterGoals={data.quarterGoals}
        ownerName={data.ownerName}
        onOwnerNameChange={(ownerName) => handleUpdatePref({ ownerName })}
        theme={data.theme}
        onClose={() => setShareScope(null)}
      />
    </div>
  )
}

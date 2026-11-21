import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DaysBoard } from './components/DaysBoard'
import { HabitModal, PlanModal, ShareModal, TourModal } from './components/Modals'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { WeekDrawer } from './components/WeekDrawer'
import { WeeksBoard } from './components/WeeksBoard'
import {
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
import { createEmptyYearBoardData, createSampleYearBoardData } from './utils/sampleData'

const STORAGE_KEY = 'year-board-data-v1'

function loadInitialData(): YearBoardData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<YearBoardData>
      if (parsed && Array.isArray(parsed.plans) && Array.isArray(parsed.habits)) {
        return {
          ...createSampleYearBoardData(),
          ...parsed,
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

export function App() {
  const todayKey = useMemo(() => getTodayKey(), [])
  const todayDate = useMemo(() => parseDateKey(todayKey), [todayKey])
  const currentIso = useMemo(() => getISOWeekInfoForDate(todayKey), [todayKey])

  const [data, setData] = useState<YearBoardData>(loadInitialData)
  const [year, setYear] = useState<number>(todayDate.getFullYear())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeHabitOverlayId, setActiveHabitOverlayId] = useState<string | null>(null)
  const [openWeekKey, setOpenWeekKey] = useState<string | null>(null)

  // Modals
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

  // Drag-to-create plan state
  const [dragRange, setDragRange] = useState<{ start: string; end: string } | null>(null)
  const dragDidMoveRef = useRef(false)
  const suppressNextClickRef = useRef(false)

  // Persist data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore quota errors
    }
  }, [data])

  // Sync dark/light class on <html>
  useEffect(() => {
    const root = document.documentElement
    if (data.theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [data.theme])

  // Global mouseup finishes drag-to-create plan
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

  const labsHabit = useMemo(
    () => data.habits.find((h) => h.isLabs),
    [data.habits],
  )

  const openWeekObj = useMemo(() => {
    if (!openWeekKey) return null
    const inSelected = weeks.find((w) => w.weekKey === openWeekKey)
    if (inSelected) return inSelected
    const match = /^(\d{4})-W(\d+)$/.exec(openWeekKey)
    if (!match) return null
    return getISOWeeksForYear(Number(match[1])).find((w) => w.weekKey === openWeekKey) ?? null
  }, [openWeekKey, weeks])

  // Handlers
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

  const handleNavigateWeek = useCallback((delta: -1 | 1) => {
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
  }, [openWeekObj])

  const handleJumpToThisWeek = useCallback(() => {
    setYear(currentIso.year)
    setTimeout(() => {
      const el = document.getElementById(`yb-w-${currentIso.weekNumber}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 60)
  }, [currentIso])

  const handleToggleHabitOnDate = useCallback((habitId: string, dateKey: string) => {
    setData((prev) => {
      const habit = prev.habits.find((h) => h.id === habitId)
      const currentMap = prev.habitCheckins[habitId] ?? {}
      const currentlyDone = !!currentMap[dateKey]

      // If it's a Labs habit and user clicks in week grid, toggle manual check-in AND clear/add minimal lab entry if needed
      let nextLabEntries = prev.labEntries
      if (habit?.isLabs) {
        const target = habit.dailyMinutesTarget ?? 20
        const dayTotal = prev.labEntries
          .filter((e) => e.date === dateKey)
          .reduce((s, e) => s + e.minutes, 0)
        if (!currentlyDone && dayTotal < target) {
          nextLabEntries = [
            ...prev.labEntries,
            { id: uid('lab'), date: dateKey, topic: 'Labs', minutes: target - dayTotal },
          ]
        } else if (currentlyDone || dayTotal >= target) {
          nextLabEntries = prev.labEntries.filter((e) => e.date !== dateKey)
        }
      }

      const nextMap = { ...currentMap }
      if (currentlyDone) {
        delete nextMap[dateKey]
      } else {
        nextMap[dateKey] = true
      }
      return {
        ...prev,
        habitCheckins: { ...prev.habitCheckins, [habitId]: nextMap },
        labEntries: nextLabEntries,
      }
    })
  }, [])

  const handleAddLabEntry = useCallback((dateKey: string, topic: string, minutes: number) => {
    setData((prev) => ({
      ...prev,
      labEntries: [...prev.labEntries, { id: uid('lab'), date: dateKey, topic, minutes }],
    }))
  }, [])

  const handleSavePlan = useCallback((planInput: Omit<Plan, 'id'>, existingId?: string) => {
    setData((prev) => {
      if (existingId) {
        return {
          ...prev,
          plans: prev.plans.map((p) => (p.id === existingId ? { ...planInput, id: existingId } : p)),
        }
      }
      return {
        ...prev,
        plans: [...prev.plans, { ...planInput, id: uid('plan') }],
      }
    })
  }, [])

  const handleDeletePlan = useCallback((planId: string) => {
    setData((prev) => ({
      ...prev,
      plans: prev.plans.filter((p) => p.id !== planId),
    }))
  }, [])

  const handleCyclePlanStatus = useCallback((planId: string) => {
    const order: PlanStatus[] = ['planned', 'done', 'missed']
    setData((prev) => ({
      ...prev,
      plans: prev.plans.map((p) => {
        if (p.id !== planId) return p
        const next = order[(order.indexOf(p.status) + 1) % order.length]
        return { ...p, status: next }
      }),
    }))
  }, [])

  const handleSaveHabit = useCallback((habitInput: Omit<Habit, 'id'>, existingId?: string) => {
    setData((prev) => {
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
  }, [])

  const handleDeleteHabit = useCallback((habitId: string) => {
    setActiveHabitOverlayId((cur) => (cur === habitId ? null : cur))
    setData((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== habitId),
    }))
  }, [])

  const handleUpdateWeekMeta = useCallback((weekKey: string, patch: Partial<WeekMeta>) => {
    setData((prev) => {
      const existing = prev.weekMeta[weekKey] ?? { focus: '', notes: '' }
      return {
        ...prev,
        weekMeta: {
          ...prev.weekMeta,
          [weekKey]: { ...existing, ...patch },
        },
      }
    })
  }, [])

  const handleToggleGoal = useCallback((goalId: string) => {
    setData((prev) => ({
      ...prev,
      quarterGoals: prev.quarterGoals.map((g) =>
        g.id === goalId ? { ...g, done: !g.done } : g,
      ),
    }))
  }, [])

  const handleAddGoal = useCallback(
    (quarter: 1 | 2 | 3 | 4, title: string) => {
      setData((prev) => ({
        ...prev,
        quarterGoals: [
          ...prev.quarterGoals,
          { id: uid('qg'), year, quarter, title, done: false },
        ],
      }))
    },
    [year],
  )

  const handleDeleteGoal = useCallback((goalId: string) => {
    setData((prev) => ({
      ...prev,
      quarterGoals: prev.quarterGoals.filter((g) => g.id !== goalId),
    }))
  }, [])

  const handleToggleCategory = useCallback((category: CategoryId) => {
    setData((prev) => {
      const exists = prev.hiddenCategories.includes(category)
      return {
        ...prev,
        hiddenCategories: exists
          ? prev.hiddenCategories.filter((c) => c !== category)
          : [...prev.hiddenCategories, category],
      }
    })
  }, [])

  return (
    <div className="yb-backdrop min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Toolbar
        year={year}
        onYearChange={setYear}
        onJumpToThisWeek={handleJumpToThisWeek}
        onOpenTour={() => setTourOpen(true)}
        view={data.view}
        onViewChange={(view: BoardView) => setData((p) => ({ ...p, view }))}
        density={data.density}
        onDensityChange={(density: BoardDensity) => setData((p) => ({ ...p, density }))}
        labsTargetMinutes={labsHabit?.dailyMinutesTarget ?? 20}
        onLabsTargetChange={(minutes) =>
          setData((p) => ({
            ...p,
            habits: p.habits.map((h) =>
              h.isLabs ? { ...h, dailyMinutesTarget: minutes } : h,
            ),
          }))
        }
        theme={data.theme}
        onToggleTheme={() =>
          setData((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))
        }
        onOpenShare={(scope) => setShareScope(scope)}
        onResetSample={() => {
          setActiveHabitOverlayId(null)
          setOpenWeekKey(null)
          setData(createSampleYearBoardData())
        }}
        onClearAll={() => {
          setActiveHabitOverlayId(null)
          setOpenWeekKey(null)
          setData((prev) => ({ ...createEmptyYearBoardData(), theme: prev.theme }))
        }}
        currentWeekInfo={currentWeekInfo}
        currentMonthIndex={todayDate.getMonth()}
      />

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
          onQuickLogLabs={(mins) => handleAddLabEntry(todayKey, 'Labs', mins)}
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

        {/* Main Year Board canvas */}
        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-7">
          {/* Year progress bar header */}
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

      {/* Week Detail Drawer */}
      <WeekDrawer
        week={openWeekObj}
        todayKey={todayKey}
        currentWeekKey={currentIso.weekKey}
        habits={data.habits}
        habitCheckins={data.habitCheckins}
        labEntries={data.labEntries}
        plans={visiblePlans}
        weekMeta={openWeekObj ? data.weekMeta[openWeekObj.weekKey] ?? { focus: '', notes: '' } : { focus: '', notes: '' }}
        onClose={() => setOpenWeekKey(null)}
        onNavigateWeek={handleNavigateWeek}
        onUpdateWeekMeta={handleUpdateWeekMeta}
        onToggleHabitOnDate={handleToggleHabitOnDate}
        onAddLabEntry={handleAddLabEntry}
        onOpenNewPlan={(startDate, endDate) =>
          setPlanModal({ open: true, plan: null, range: { startDate, endDate } })
        }
        onOpenEditPlan={(plan) => setPlanModal({ open: true, plan, range: null })}
        onCyclePlanStatus={handleCyclePlanStatus}
      />

      {/* Plan Create / Edit Modal */}
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

      {/* Habit Create / Edit Modal */}
      {habitModal.open && (
        <HabitModal
          key={habitModal.habit?.id ?? 'new-habit'}
          open={habitModal.open}
          initialHabit={habitModal.habit}
          onClose={() => setHabitModal({ open: false, habit: null })}
          onSave={handleSaveHabit}
          onDelete={handleDeleteHabit}
        />
      )}

      {/* 11-step Guided Tour Modal */}
      {tourOpen && (
        <TourModal
          open={tourOpen}
          onClose={() => {
            setTourOpen(false)
            if (!data.tourSeen) setData((p) => ({ ...p, tourSeen: true }))
          }}
        />
      )}

      {/* Share Modal */}
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
        onOwnerNameChange={(ownerName) => setData((p) => ({ ...p, ownerName }))}
        theme={data.theme}
        onClose={() => setShareScope(null)}
      />
    </div>
  )
}

export default App

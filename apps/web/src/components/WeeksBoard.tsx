import { useMemo } from 'react'
import {
  getCategoryMeta,
  getHabitColorMeta,
  getHabitWeekCount,
  isHabitDoneOnDate,
  MONTH_SHORT,
  type BoardDensity,
  type Habit,
  type ISOWeekInfo,
  type LabEntry,
  type Plan,
  type YearBoardData,
} from '@year-board/shared'

interface WeeksBoardProps {
  year: number
  weeks: ISOWeekInfo[]
  todayKey: string
  currentWeekKey: string
  plans: Plan[]
  weekMeta: YearBoardData['weekMeta']
  density: BoardDensity
  perfectWeekKeys: Set<string>
  activeHabitOverlay: Habit | null
  habitCheckins: YearBoardData['habitCheckins']
  labEntries: LabEntry[]
  dragRange: { start: string; end: string } | null
  onDayMouseDown: (dateKey: string) => void
  onDayMouseEnter: (dateKey: string) => void
  onOpenWeek: (weekKey: string, focusDayKey?: string) => void
}

const QUARTER_GROUPS: {
  quarter: 1 | 2 | 3 | 4
  label: string
  months: number[]
}[] = [
  { quarter: 1, label: 'Q1 · Jan to Mar', months: [0, 1, 2] },
  { quarter: 3, label: 'Q3 · Jul to Sep', months: [6, 7, 8] },
  { quarter: 2, label: 'Q2 · Apr to Jun', months: [3, 4, 5] },
  { quarter: 4, label: 'Q4 · Oct to Dec', months: [9, 10, 11] },
]

function isDateInDrag(dateKey: string, dragRange: { start: string; end: string } | null): boolean {
  if (!dragRange) return false
  const lo = dragRange.start <= dragRange.end ? dragRange.start : dragRange.end
  const hi = dragRange.start <= dragRange.end ? dragRange.end : dragRange.start
  return dateKey >= lo && dateKey <= hi
}

interface PlacedBar {
  plan: Plan
  colStart: number // 1..7
  colEnd: number // 2..8
  lane: number // 0..2
}

function layoutWeekPlans(week: ISOWeekInfo, plans: Plan[]): PlacedBar[] {
  const overlapping = plans
    .filter((p) => p.startDate <= week.endKey && p.endDate >= week.startKey)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || b.endDate.localeCompare(a.endDate))

  const lanes: number[][] = []
  const placed: PlacedBar[] = []

  for (const plan of overlapping) {
    let startIdx = week.days.findIndex((d) => d >= plan.startDate)
    if (startIdx === -1) startIdx = 0
    let endIdx = 6
    for (let i = 6; i >= 0; i--) {
      if (week.days[i] <= plan.endDate) {
        endIdx = i
        break
      }
    }
    if (endIdx < startIdx) continue

    let laneIdx = -1
    for (let l = 0; l < 3; l++) {
      const occ = lanes[l] ?? []
      const conflict = occ.some((day) => day >= startIdx && day <= endIdx)
      if (!conflict) {
        laneIdx = l
        break
      }
    }
    if (laneIdx === -1) continue

    if (!lanes[laneIdx]) lanes[laneIdx] = []
    for (let d = startIdx; d <= endIdx; d++) lanes[laneIdx].push(d)

    placed.push({
      plan,
      colStart: startIdx + 1,
      colEnd: endIdx + 2,
      lane: laneIdx,
    })
  }

  return placed
}

export function WeeksBoard({
  weeks,
  todayKey,
  currentWeekKey,
  plans,
  weekMeta,
  density,
  perfectWeekKeys,
  activeHabitOverlay,
  habitCheckins,
  labEntries,
  dragRange,
  onDayMouseDown,
  onDayMouseEnter,
  onOpenWeek,
}: WeeksBoardProps) {
  const weeksByMonth = useMemo(() => {
    const map = new Map<number, ISOWeekInfo[]>()
    for (let m = 0; m < 12; m++) map.set(m, [])
    for (const w of weeks) {
      map.get(w.monthIndex)?.push(w)
    }
    return map
  }, [weeks])

  const cellHeight = density === 'compact' ? 30 : 43
  const overlayColorMeta = activeHabitOverlay
    ? getHabitColorMeta(activeHabitOverlay.color)
    : null

  return (
    <div className="select-none">
      {/* 2-column quarter grid: Q1/Q3 top, Q2/Q4 bottom */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-6 xl:grid-cols-2">
        {QUARTER_GROUPS.map((group) => (
          <section key={group.quarter} className="min-w-0">
            <h2 className="mb-2.5 text-xs font-medium text-[var(--muted-foreground)]">
              {group.label}
            </h2>
            <div className="flex flex-col gap-2">
              {group.months.map((monthIdx) => {
                const monthWeeks = weeksByMonth.get(monthIdx) ?? []
                return (
                  <div key={monthIdx} className="flex items-stretch gap-2.5">
                    <div className="flex w-9 shrink-0 items-center justify-end border-r border-[var(--card-edge-hover)] pr-2">
                      <span className="font-montserrat text-[11px] font-bold tracking-wider text-[var(--muted-foreground)]">
                        {MONTH_SHORT[monthIdx]}
                      </span>
                    </div>

                    <div className="grid min-w-0 flex-1 grid-cols-5 gap-1.5">
                      {monthWeeks.map((week) => {
                        const isNow = week.weekKey === currentWeekKey
                        const isPast = week.endKey < todayKey
                        const isPerfect = !activeHabitOverlay && perfectWeekKeys.has(week.weekKey)
                        const bars = layoutWeekPlans(week, plans)
                        const meta = weekMeta[week.weekKey]
                        const weekPlans = plans.filter(
                          (p) => p.startDate <= week.endKey && p.endDate >= week.startKey,
                        )

                        const habitWeekCount = activeHabitOverlay
                          ? getHabitWeekCount(activeHabitOverlay, week, habitCheckins, labEntries)
                          : 0
                        const habitTargetHit = activeHabitOverlay
                          ? habitWeekCount >= activeHabitOverlay.weeklyTarget
                          : false

                        let caption = ''
                        let captionStrong = false
                        if (activeHabitOverlay) {
                          if (week.startKey <= todayKey) {
                            caption = habitTargetHit
                              ? `${habitWeekCount} of ${activeHabitOverlay.weeklyTarget} · target hit`
                              : `${habitWeekCount} of ${activeHabitOverlay.weeklyTarget}`
                          }
                        } else if (meta?.focus?.trim()) {
                          caption = meta.focus.trim()
                          captionStrong = true
                        } else if (weekPlans.length > 0) {
                          caption = weekPlans.map((p) => p.title).join(' · ')
                        }

                        return (
                          <div
                            key={week.weekKey}
                            id={`yb-w-${week.weekNumber}`}
                            style={{
                              background: isPerfect
                                ? 'var(--yb-ok-tint)'
                                : isPast
                                  ? 'var(--yb-tile-past)'
                                  : 'var(--yb-tile)',
                              borderColor: isNow
                                ? undefined
                                : isPerfect
                                  ? 'var(--yb-ok)'
                                  : 'var(--card-edge)',
                            }}
                            className={`@container relative flex min-w-0 flex-col gap-1.5 rounded-lg transition-colors ${
                              isNow
                                ? 'border-2 border-[var(--foreground)]/80 p-[6px]'
                                : 'border p-[7px] hover:border-[var(--card-edge-hover)]'
                            }`}
                          >
                            {/* Week header */}
                            <button
                              type="button"
                              aria-label={`Open week ${week.weekNumber}, ${week.dateRangeLabel}, ${weekPlans.length} plans`}
                              onClick={() => onOpenWeek(week.weekKey)}
                              className="flex h-[20px] min-w-0 w-full cursor-pointer items-center justify-between gap-1 text-left outline-none"
                            >
                              <span className="inline-flex items-center gap-1">
                                <span
                                  className={`font-montserrat text-[12px] font-semibold ${
                                    isNow
                                      ? 'text-[var(--foreground)]'
                                      : 'text-[var(--muted-foreground)]'
                                  }`}
                                >
                                  W{week.weekNumber}
                                </span>
                                {isNow && (
                                  <span className="rounded bg-[var(--foreground)] px-1 py-px text-[9px] font-bold tracking-wide text-[var(--background)]">
                                    NOW
                                  </span>
                                )}
                              </span>
                              <span className="hidden truncate text-[10px] text-[var(--muted-foreground)] @[118px]:inline">
                                {week.dateRangeLabel}
                              </span>
                            </button>

                            {/* 7 day cells + plan bars */}
                            <div className="relative">
                              <div className="grid grid-cols-7 gap-0.5">
                                {week.days.map((dayKey, dayIdx) => {
                                  const isWeekend = dayIdx >= 5
                                  const isToday = dayKey === todayKey
                                  const inDrag = isDateInDrag(dayKey, dragRange)
                                  const habitDone =
                                    activeHabitOverlay &&
                                    isHabitDoneOnDate(
                                      activeHabitOverlay,
                                      dayKey,
                                      habitCheckins,
                                      labEntries,
                                    )

                                  let bg = isWeekend ? 'var(--yb-cell-weekend)' : 'var(--yb-cell)'
                                  if (inDrag) {
                                    bg = 'var(--yb-hi)'
                                  } else if (habitDone && overlayColorMeta) {
                                    bg = overlayColorMeta.colorVar
                                  }

                                  return (
                                    <button
                                      key={dayKey}
                                      type="button"
                                      aria-label={`Day ${dayKey}`}
                                      onMouseDown={(e) => {
                                        if (e.button === 0) onDayMouseDown(dayKey)
                                      }}
                                      onMouseEnter={() => onDayMouseEnter(dayKey)}
                                      onClick={() => onOpenWeek(week.weekKey, dayKey)}
                                      style={{
                                        height: `${cellHeight}px`,
                                        background: bg,
                                        boxShadow: isToday
                                          ? 'inset 0 0 0 2px var(--foreground)'
                                          : undefined,
                                      }}
                                      className="cursor-pointer rounded-[3px] p-0 outline-none transition-colors hover:brightness-125"
                                    />
                                  )
                                })}
                              </div>

                              {/* Stacked plan bars */}
                              {bars.length > 0 && (
                                <div
                                  aria-hidden="true"
                                  className={`pointer-events-none absolute inset-0 box-border grid content-start gap-x-0.5 py-[4px] transition-opacity ${
                                    activeHabitOverlay ? 'opacity-25' : 'opacity-100'
                                  }`}
                                  style={{
                                    gridTemplateColumns: 'repeat(7, minmax(0px, 1fr))',
                                    gridTemplateRows: `repeat(3, ${density === 'compact' ? 6 : 8}px)`,
                                    rowGap: '3px',
                                  }}
                                >
                                  {bars.map((bar) => {
                                    const cat = getCategoryMeta(bar.plan.category)
                                    const isMissed = bar.plan.status === 'missed'
                                    return (
                                      <span
                                        key={`${bar.plan.id}-${bar.lane}`}
                                        title={`${bar.plan.title} (${cat.label})${isMissed ? ' · Missed' : ''}`}
                                        style={{
                                          gridRow: bar.lane + 1,
                                          gridColumn: `${bar.colStart} / ${bar.colEnd}`,
                                          background: isMissed ? 'transparent' : cat.colorVar,
                                          border: isMissed ? `1.5px solid ${cat.colorVar}` : undefined,
                                          borderRadius: '3px',
                                        }}
                                      />
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Bottom caption */}
                            <div className="min-h-[15px] truncate text-[11px] leading-tight">
                              {caption ? (
                                <span
                                  style={{
                                    color:
                                      activeHabitOverlay && habitTargetHit && overlayColorMeta
                                        ? overlayColorMeta.inkVar
                                        : undefined,
                                  }}
                                  className={
                                    captionStrong
                                      ? 'font-montserrat font-semibold text-[var(--foreground)]'
                                      : 'text-[var(--muted-foreground)]'
                                  }
                                >
                                  {caption}
                                </span>
                              ) : (
                                <span className="opacity-0">&nbsp;</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Footer note / Habit overlay banner */}
      <div className="mt-6 text-xs text-[var(--muted-foreground)]">
        {activeHabitOverlay ? (
          <p>
            Showing <strong className="text-[var(--foreground)]">{activeHabitOverlay.name}</strong>{' '}
            check-ins across the year: filled days are days you did it. Plans are dimmed. Click the
            eye again to go back.
          </p>
        ) : (
          <p>
            Weeks run Monday to Sunday. W1 is the week that holds the year’s first Thursday, so it
            can start in late December. Drag across days to add a plan.
          </p>
        )}
      </div>
    </div>
  )
}

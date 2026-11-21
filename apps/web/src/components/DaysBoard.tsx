import { useMemo } from 'react'
import {
  formatDateKey,
  getCategoryMeta,
  getDaysInMonth,
  getHabitColorMeta,
  getISOWeekInfoForDate,
  isHabitDoneOnDate,
  isWeekendKey,
  MONTH_SHORT,
  type BoardDensity,
  type Habit,
  type LabEntry,
  type Plan,
  type YearBoardData,
} from '@year-board/shared'

interface DaysBoardProps {
  year: number
  todayKey: string
  plans: Plan[]
  density: BoardDensity
  activeHabitOverlay: Habit | null
  habitCheckins: YearBoardData['habitCheckins']
  labEntries: LabEntry[]
  dragRange: { start: string; end: string } | null
  onDayMouseDown: (dateKey: string) => void
  onDayMouseEnter: (dateKey: string) => void
  onOpenWeek: (weekKey: string, focusDayKey?: string) => void
}

function isDateInDrag(dateKey: string, dragRange: { start: string; end: string } | null): boolean {
  if (!dragRange) return false
  const lo = dragRange.start <= dragRange.end ? dragRange.start : dragRange.end
  const hi = dragRange.start <= dragRange.end ? dragRange.end : dragRange.start
  return dateKey >= lo && dateKey <= hi
}

export function DaysBoard({
  year,
  todayKey,
  plans,
  density,
  activeHabitOverlay,
  habitCheckins,
  labEntries,
  dragRange,
  onDayMouseDown,
  onDayMouseEnter,
  onOpenWeek,
}: DaysBoardProps) {
  // Build fast lookup: dateKey -> Plan[]
  const plansByDate = useMemo(() => {
    const map = new Map<string, Plan[]>()
    const yearStart = `${year}-01-01`
    const yearEnd = `${year}-12-31`
    for (const plan of plans) {
      if (plan.endDate < yearStart || plan.startDate > yearEnd) continue
      const start = plan.startDate < yearStart ? yearStart : plan.startDate
      const end = plan.endDate > yearEnd ? yearEnd : plan.endDate
      const [sy, sm, sd] = start.split('-').map(Number)
      const [ey, em, ed] = end.split('-').map(Number)
      const cur = new Date(sy, sm - 1, sd)
      const last = new Date(ey, em - 1, ed)
      while (cur <= last) {
        const key = formatDateKey(cur)
        const list = map.get(key)
        if (list) list.push(plan)
        else map.set(key, [plan])
        cur.setDate(cur.getDate() + 1)
      }
    }
    return map
  }, [plans, year])

  const rowHeight = density === 'compact' ? 'h-7' : 'h-9'
  const overlayColorMeta = activeHabitOverlay
    ? getHabitColorMeta(activeHabitOverlay.color)
    : null

  return (
    <div className="select-none overflow-x-auto pb-2">
      <div className="min-w-[760px]">
        {/* Header 1..31 */}
        <div className="mb-1.5 flex items-center gap-2.5">
          <div className="w-10 shrink-0" />
          <div className="grid flex-1 grid-cols-31 gap-1">
            {Array.from({ length: 31 }, (_, i) => (
              <div
                key={i}
                className="font-mono-num text-center text-[11px] text-[var(--muted-foreground)]"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* 4 quarter blocks of 3 months each */}
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((qIdx) => (
            <div
              key={qIdx}
              className="flex flex-col gap-1.5"
            >
              {[0, 1, 2].map((mOffset) => {
                const monthIdx = qIdx * 3 + mOffset
                const daysCount = getDaysInMonth(year, monthIdx)
                return (
                  <div key={monthIdx} className="flex items-center gap-2.5">
                    <div className="flex w-10 shrink-0 items-center justify-end border-r-2 border-[var(--card-edge-hover)] pr-2">
                      <span className="font-montserrat text-[11px] font-bold tracking-wider text-[var(--muted-foreground)]">
                        {MONTH_SHORT[monthIdx]}
                      </span>
                    </div>

                    <div className="grid flex-1 grid-cols-31 gap-1">
                      {Array.from({ length: 31 }, (_, dayIdx) => {
                        const dayNum = dayIdx + 1
                        if (dayNum > daysCount) {
                          return <div key={dayIdx} className={rowHeight} />
                        }
                        const dateKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                        const isToday = dateKey === todayKey
                        const weekend = isWeekendKey(dateKey)
                        const inDrag = isDateInDrag(dateKey, dragRange)
                        const dayPlans = plansByDate.get(dateKey) ?? []
                        const primaryPlan = dayPlans[0]
                        const primaryCat = primaryPlan ? getCategoryMeta(primaryPlan.category) : null
                        const isMissed = primaryPlan?.status === 'missed'
                        const habitDone =
                          activeHabitOverlay &&
                          isHabitDoneOnDate(activeHabitOverlay, dateKey, habitCheckins, labEntries)

                        let bg = weekend ? 'var(--yb-cell-weekend)' : 'var(--yb-cell)'
                        let textColor = 'var(--muted-foreground)'
                        let borderStyle: string | undefined

                        if (inDrag) {
                          bg = 'var(--yb-hi)'
                          textColor = 'var(--foreground)'
                        } else if (activeHabitOverlay) {
                          if (habitDone && overlayColorMeta) {
                            bg = overlayColorMeta.colorVar
                            textColor = 'var(--yb-on)'
                          }
                        } else if (primaryPlan && primaryCat) {
                          if (isMissed) {
                            bg = 'transparent'
                            borderStyle = `1.5px solid ${primaryCat.colorVar}`
                            textColor = primaryCat.inkVar
                          } else {
                            bg = primaryCat.colorVar
                            textColor = 'var(--yb-on)'
                          }
                        }

                        const tooltip = activeHabitOverlay
                          ? `${dateKey} · ${activeHabitOverlay.name}: ${habitDone ? 'Done' : 'Not done'}`
                          : dayPlans.length > 0
                            ? `${dateKey} · ${dayPlans.map((p) => `${p.title}${p.status === 'missed' ? ' (missed)' : ''}`).join(', ')}`
                            : `${dateKey} · Drag to add plan`

                        return (
                          <button
                            key={dayIdx}
                            type="button"
                            title={tooltip}
                            aria-label={tooltip}
                            onMouseDown={(e) => {
                              if (e.button === 0) onDayMouseDown(dateKey)
                            }}
                            onMouseEnter={() => onDayMouseEnter(dateKey)}
                            onClick={() => {
                              const iso = getISOWeekInfoForDate(dateKey)
                              onOpenWeek(iso.weekKey, dateKey)
                            }}
                            style={{
                              background: bg,
                              color: textColor,
                              border: borderStyle,
                              boxShadow: isToday
                                ? 'inset 0 0 0 2px var(--foreground)'
                                : undefined,
                            }}
                            className={`${rowHeight} font-mono-num relative flex cursor-pointer items-center justify-center rounded-[5px] text-[11px] font-medium transition-transform hover:z-10 hover:scale-105 hover:brightness-110`}
                          >
                            {dayNum}
                            {!activeHabitOverlay && dayPlans.length > 1 && (
                              <span className="absolute right-0.5 bottom-0.5 size-1.5 rounded-full bg-current opacity-80" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
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
            Each row is a month and each square is a day. Outlined squares are plans marked missed.
            Drag across days to add a plan.
          </p>
        )}
      </div>
    </div>
  )
}

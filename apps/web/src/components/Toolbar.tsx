import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Share,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import {
  MONTH_ABBR,
  MONTH_NAMES,
  type BoardDensity,
  type BoardView,
  type ISOWeekInfo,
  type ShareScope,
} from '@year-board/shared'

interface ToolbarProps {
  year: number
  onYearChange: (year: number) => void
  onJumpToThisWeek: () => void
  onOpenTour: () => void
  view: BoardView
  onViewChange: (view: BoardView) => void
  density: BoardDensity
  onDensityChange: (density: BoardDensity) => void
  onOpenShare: (scope: ShareScope) => void
  onClearLocalData?: () => void
  currentWeekInfo: ISOWeekInfo | undefined
  currentMonthIndex: number
}

export function Toolbar({
  year,
  onYearChange,
  onJumpToThisWeek,
  onOpenTour,
  view,
  onViewChange,
  density,
  onDensityChange,
  onOpenShare,
  onClearLocalData,
  currentWeekInfo,
  currentMonthIndex,
}: ToolbarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const shareRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSettingsOpen(false)
        setShareOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  const yearShort = String(year).slice(-2)
  const monthAbbr = MONTH_ABBR[currentMonthIndex].toUpperCase()
  const monthName = MONTH_NAMES[currentMonthIndex]

  return (
    <div className="border-b border-[var(--card-edge)] bg-[var(--background)]/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Left: Year switcher + This week */}
        <div data-tour="year-nav" className="flex items-center gap-2.5">
          <div className="inline-flex h-10 items-center rounded-lg border border-[var(--card-edge)] bg-[var(--surface)] px-1">
            <button
              type="button"
              aria-label="Previous year"
              onClick={() => onYearChange(year - 1)}
              className="grid size-8 cursor-pointer place-items-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-surface)] hover:text-[var(--foreground)]"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="font-montserrat min-w-[68px] select-none text-center text-lg font-semibold tracking-tight">
              {year}
            </span>
            <button
              type="button"
              aria-label="Next year"
              onClick={() => onYearChange(year + 1)}
              className="grid size-8 cursor-pointer place-items-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-surface)] hover:text-[var(--foreground)]"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onJumpToThisWeek}
            className="h-10 cursor-pointer rounded-lg border border-[var(--card-edge)] bg-[var(--surface)] px-3.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--card-edge-hover)] hover:bg-[var(--accent-surface)]"
          >
            This week
          </button>
        </div>

        {/* Right: How it works, Weeks/Days, Settings, Share */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenTour}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-surface)] hover:text-[var(--foreground)]"
          >
            <HelpCircle className="size-4" />
            <span className="hidden sm:inline">How it works</span>
          </button>

          {/* Weeks / Days segmented control */}
          <div
            data-tour="view-toggle"
            role="group"
            aria-label="Board view"
            className="inline-flex h-10 items-center rounded-lg border border-[var(--card-edge)] bg-[var(--surface)] p-1"
          >
            <button
              type="button"
              aria-pressed={view === 'weeks'}
              onClick={() => onViewChange('weeks')}
              className={`h-8 cursor-pointer rounded-md px-3 text-sm font-medium transition-colors ${
                view === 'weeks'
                  ? 'bg-[#ea580c]/20 text-[var(--foreground)] shadow-xs ring-1 ring-[#ea580c]/30'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Weeks
            </button>
            <button
              type="button"
              aria-pressed={view === 'days'}
              onClick={() => onViewChange('days')}
              className={`h-8 cursor-pointer rounded-md px-3 text-sm font-medium transition-colors ${
                view === 'days'
                  ? 'bg-[#ea580c]/20 text-[var(--foreground)] shadow-xs ring-1 ring-[#ea580c]/30'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Days
            </button>
          </div>

          {/* Board settings popover (Density only) */}
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              aria-label="Board settings"
              aria-expanded={settingsOpen}
              onClick={() => {
                setSettingsOpen((o) => !o)
                setShareOpen(false)
              }}
              className="grid size-10 cursor-pointer place-items-center rounded-lg border border-[var(--card-edge)] bg-[var(--surface)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--card-edge-hover)] hover:text-[var(--foreground)]"
            >
              <SlidersHorizontal className="size-4" />
            </button>

            {settingsOpen && (
              <div
                role="menu"
                className="absolute right-0 z-40 mt-2 w-60 rounded-xl border border-[var(--card-edge-hover)] bg-[var(--yb-sheet)] p-3.5 shadow-2xl"
              >
                <div className="mb-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                  Density
                </div>
                <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-[var(--card-edge)] bg-[var(--surface)] p-1">
                  {(['comfortable', 'compact'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        onDensityChange(d)
                        setSettingsOpen(false)
                        setConfirmClear(false)
                      }}
                      className={`h-8 cursor-pointer rounded-md text-xs font-medium capitalize transition-colors ${
                        density === d
                          ? 'bg-[var(--foreground)] text-[var(--background)]'
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                {onClearLocalData && (
                  <div className="mt-3 border-t border-[var(--card-edge)] pt-3">
                    {!confirmClear ? (
                      <button
                        type="button"
                        onClick={() => setConfirmClear(true)}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        <Trash2 className="size-3.5" />
                        Clear local data
                      </button>
                    ) : (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5">
                        <p className="text-[11px] font-medium text-red-300">
                          Clear all local habits &amp; plans?
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfirmClear(false)}
                            className="h-7 flex-1 cursor-pointer rounded-md border border-[var(--card-edge)] text-[11px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClearLocalData()
                              setConfirmClear(false)
                              setSettingsOpen(false)
                            }}
                            className="h-7 flex-1 cursor-pointer rounded-md bg-red-500 text-[11px] font-semibold text-white hover:bg-red-600"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Share dropdown */}
          <div className="relative" ref={shareRef}>
            <button
              type="button"
              data-tour="share-btn"
              aria-expanded={shareOpen}
              onClick={() => {
                setShareOpen((o) => !o)
                setSettingsOpen(false)
              }}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[var(--foreground)] px-3.5 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
            >
              <Share className="size-4" />
              <span>Share</span>
              <ChevronDown className="size-3.5 opacity-70" />
            </button>

            {shareOpen && (
              <div
                role="menu"
                className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-[var(--card-edge-hover)] bg-[var(--yb-sheet)] p-1.5 shadow-2xl"
              >
                <button
                  type="button"
                  onClick={() => {
                    onOpenShare('week')
                    setShareOpen(false)
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-[var(--accent-surface)]"
                >
                  <span className="font-montserrat grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-surface)] text-xs font-bold">
                    W{currentWeekInfo?.weekNumber ?? 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      Share this week
                    </div>
                    <div className="truncate text-xs text-[var(--muted-foreground)]">
                      {currentWeekInfo?.dateRangeLabel ?? 'Current week'} · plans and focus
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenShare('month')
                    setShareOpen(false)
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-[var(--accent-surface)]"
                >
                  <span className="font-montserrat grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-surface)] text-xs font-bold">
                    {monthAbbr}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      Share {monthName}
                    </div>
                    <div className="truncate text-xs text-[var(--muted-foreground)]">
                      The month as a calendar
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenShare('year')
                    setShareOpen(false)
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-[var(--accent-surface)]"
                >
                  <span className="font-montserrat grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-surface)] text-xs font-bold">
                    {yearShort}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      Share all of {year}
                    </div>
                    <div className="truncate text-xs text-[var(--muted-foreground)]">
                      Your whole year on one page
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface TourStep {
  title: string
  body: string
  selector?: string
}

const STEPS: TourStep[] = [
  {
    title: 'Your whole year on one wall',
    body: 'The Year Board is a wall planner for your entire year: plans, daily habits, and quarter goals all on one screen. Take a quick interactive tour of how everything works.',
  },
  {
    title: 'Every week of the year',
    body: 'Each row is a month and each block is a week, Monday to Sunday. Coloured bars are your plans — drag across any days to create a new multi-day plan.',
    selector: '[data-tour="year-grid"]',
  },
  {
    title: 'Open any week',
    body: 'Click any week tile to open the Week Drawer. Give the week a focus (shown right on the board), check off past or today’s habits, mark whether plans happened or were missed, and keep notes.',
    selector: '[data-tour="current-week"]',
  },
  {
    title: 'Habits for today',
    body: 'Tick a habit with one tap to log today. You can also catch up on missed past days in the Week Drawer (future days stay locked). Hit your weekly target to celebrate with confetti!',
    selector: '[data-tour="habits-section"]',
  },
  {
    title: 'Light up a habit across the year',
    body: 'Press the eye icon on any active or archived habit to light up every day you completed it across the whole year. Archive completed habits anytime without losing their history.',
    selector: '[data-tour="habit-eye"]',
  },
  {
    title: 'Perfect weeks',
    body: 'A perfect week is one where every active habit hit its weekly target. Those weeks turn green on the board and track your best consecutive run.',
    selector: '[data-tour="perfect-weeks"]',
  },
  {
    title: 'Quarter goals',
    body: 'Write up to five goals for each quarter and tick them off as you go. The current quarter is outlined so you always stay focused.',
    selector: '[data-tour="quarter-goals"]',
  },
  {
    title: 'Show what matters',
    body: 'Plans have categories (Work, Learning, Health, Travel, Personal). Toggle a category off to hide it from the board and from shared images.',
    selector: '[data-tour="category-filters"]',
  },
  {
    title: 'Weeks or Days',
    body: 'Switch to Days to view the year as a 12×31 calendar strip. Use Board Settings beside it to switch between Comfortable and Compact density.',
    selector: '[data-tour="view-toggle"]',
  },
  {
    title: 'Share your year',
    body: 'Export this week, the current month, or your whole year as a crisp PNG image or text summary. Hidden categories stay hidden from what you share.',
    selector: '[data-tour="share-btn"]',
  },
]

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

interface SpotlightTourProps {
  open: boolean
  currentWeekNumber: number
  onClose: () => void
}

export function SpotlightTour({ open, currentWeekNumber, onClose }: SpotlightTourProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<SpotlightRect | null>(null)

  const resolveElement = useCallback(
    (selector?: string): HTMLElement | null => {
      if (!selector) return null
      if (selector === '[data-tour="current-week"]') {
        return document.getElementById(`yb-w-${currentWeekNumber}`)
      }
      return document.querySelector<HTMLElement>(selector)
    },
    [currentWeekNumber],
  )

  const updateSpotlight = useCallback(() => {
    const step = STEPS[stepIndex]
    const el = resolveElement(step?.selector)
    if (!el) {
      setRect(null)
      return
    }
    const r = el.getBoundingClientRect()
    const pad = 6
    setRect({
      top: Math.max(8, r.top - pad),
      left: Math.max(8, r.left - pad),
      width: Math.min(window.innerWidth - 16, r.width + pad * 2),
      height: Math.min(window.innerHeight - 16, r.height + pad * 2),
    })
  }, [stepIndex, resolveElement])

  useEffect(() => {
    if (!open) return
    const step = STEPS[stepIndex]
    const el = resolveElement(step?.selector)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    }
    const t1 = setTimeout(updateSpotlight, 60)
    const t2 = setTimeout(updateSpotlight, 320)

    window.addEventListener('resize', updateSpotlight)
    window.addEventListener('scroll', updateSpotlight, true)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('resize', updateSpotlight)
      window.removeEventListener('scroll', updateSpotlight, true)
    }
  }, [open, stepIndex, resolveElement, updateSpotlight])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') {
        setStepIndex((s) => (s < STEPS.length - 1 ? s + 1 : s))
      }
      if (e.key === 'ArrowLeft') {
        setStepIndex((s) => (s > 0 ? s - 1 : s))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const current = STEPS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1

  // Compute smart card placement near the spotlight (or centered when no target)
  let cardStyle: React.CSSProperties = {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }

  if (rect) {
    const cardW = 360
    const cardH = 220
    const vw = window.innerWidth
    const vh = window.innerHeight

    if (rect.left + rect.width + cardW + 24 < vw) {
      // Place to the right of target
      cardStyle = {
        top: Math.max(16, Math.min(vh - cardH - 16, rect.top)),
        left: rect.left + rect.width + 16,
      }
    } else if (rect.left - cardW - 24 > 0) {
      // Place to the left of target
      cardStyle = {
        top: Math.max(16, Math.min(vh - cardH - 16, rect.top)),
        left: rect.left - cardW - 16,
      }
    } else if (rect.top + rect.height + cardH + 24 < vh) {
      // Place below target
      cardStyle = {
        top: rect.top + rect.height + 16,
        left: Math.max(16, Math.min(vw - cardW - 16, rect.left)),
      }
    } else {
      // Place at bottom-right cleanly
      cardStyle = {
        bottom: 20,
        right: 20,
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Dimmed backdrop when no spotlight target */}
      {!rect && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
        />
      )}

      {/* Glowing spotlight cutout around the active UI element */}
      {rect && (
        <div
          onClick={onClose}
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.62)',
          }}
          className="pointer-events-none fixed rounded-xl ring-2 ring-[#ea580c] transition-all duration-300"
        />
      )}

      {/* Floating tutorial card */}
      <div
        role="dialog"
        aria-label="How Year Board works"
        style={cardStyle}
        className="fixed z-10 w-[calc(100vw-32px)] max-w-[360px] rounded-2xl border border-[var(--card-edge-hover)] bg-[var(--yb-sheet)] p-5 shadow-2xl transition-all duration-300"
      >
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span className="font-mono-num">
            {stepIndex + 1} of {STEPS.length}
          </span>
          <button
            type="button"
            aria-label="Close tour"
            onClick={onClose}
            className="grid size-7 cursor-pointer place-items-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--accent-surface)] hover:text-[var(--foreground)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <h3 className="font-montserrat mt-2 text-base font-bold text-[var(--foreground)]">
          {current.title}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
          {current.body}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Step ${idx + 1}`}
                onClick={() => setStepIndex(idx)}
                className={`h-1.5 cursor-pointer rounded-full transition-all ${
                  idx === stepIndex
                    ? 'w-4 bg-[#ea580c]'
                    : 'w-1.5 bg-[var(--card-edge-hover)] hover:bg-[var(--muted-foreground)]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {isFirst ? (
              <button
                type="button"
                onClick={onClose}
                className="h-8 cursor-pointer rounded-lg px-2.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Skip
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStepIndex((s) => Math.max(0, s - 1))}
                className="h-8 cursor-pointer rounded-lg px-2.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Back
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isLast) onClose()
                else setStepIndex((s) => s + 1)
              }}
              className="h-8 cursor-pointer rounded-lg bg-[var(--foreground)] px-3.5 text-xs font-semibold text-[var(--background)] hover:opacity-90"
            >
              {isFirst ? 'Show me' : isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

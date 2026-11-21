import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Download, Trash2, X } from 'lucide-react'
import {
  CATEGORIES,
  formatShortRange,
  getDaysInMonth,
  HABIT_COLORS,
  MONTH_NAMES,
  MONTH_SHORT,
  type CategoryId,
  type Habit,
  type HabitColor,
  type ISOWeekInfo,
  type Plan,
  type PlanStatus,
  type QuarterGoal,
  type ShareScope,
  type YearBoardData,
} from '@year-board/shared'

/* ============================================================================
 * 1. Plan Modal (Create / Edit)
 * ========================================================================== */

interface PlanModalProps {
  open: boolean
  initialPlan: Plan | null
  initialRange: { startDate: string; endDate: string } | null
  onClose: () => void
  onSave: (plan: Omit<Plan, 'id'>, existingId?: string) => void
  onDelete: (planId: string) => void
}

export function PlanModal({
  open,
  initialPlan,
  initialRange,
  onClose,
  onSave,
  onDelete,
}: PlanModalProps) {
  const [title, setTitle] = useState(initialPlan?.title ?? '')
  const [startDate, setStartDate] = useState(
    initialPlan?.startDate ?? initialRange?.startDate ?? '',
  )
  const [endDate, setEndDate] = useState(initialPlan?.endDate ?? initialRange?.endDate ?? '')
  const [category, setCategory] = useState<CategoryId>(initialPlan?.category ?? 'work')
  const [status, setStatus] = useState<PlanStatus>(initialPlan?.status ?? 'planned')
  const [notes, setNotes] = useState(initialPlan?.notes ?? '')

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !startDate || !endDate) return
    const lo = startDate <= endDate ? startDate : endDate
    const hi = startDate <= endDate ? endDate : startDate
    onSave(
      { title: title.trim(), startDate: lo, endDate: hi, category, status, notes: notes.trim() },
      initialPlan?.id,
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-label={initialPlan ? 'Edit plan' : 'Add plan'}
        className="w-full max-w-md rounded-2xl border border-[var(--card-edge-hover)] bg-[var(--yb-sheet)] p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-montserrat text-base font-bold text-[var(--foreground)]">
            {initialPlan ? 'Edit plan' : 'New plan'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 cursor-pointer place-items-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent-surface)] hover:text-[var(--foreground)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
              Title
            </label>
            <input
              autoFocus
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Jaipur trip, Rust sprint, Half marathon"
              className="h-10 w-full rounded-lg border border-[var(--card-edge-hover)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                Start date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--card-edge-hover)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                End date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--card-edge-hover)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  style={{
                    background: category === cat.id ? cat.tintVar : 'transparent',
                    borderColor: category === cat.id ? cat.colorVar : 'var(--card-edge)',
                  }}
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium text-[var(--foreground)] transition-colors"
                >
                  <span className="size-2 rounded-full" style={{ background: cat.colorVar }} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
              Outcome
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'planned', label: 'Planned' },
                  { id: 'done', label: 'Happened' },
                  { id: 'missed', label: 'Missed' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatus(opt.id)}
                  className={`h-9 cursor-pointer rounded-lg border text-xs font-medium transition-colors ${
                    status === opt.id
                      ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                      : 'border-[var(--card-edge)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
              Notes (optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra details..."
              className="w-full resize-none rounded-lg border border-[var(--card-edge-hover)] bg-[var(--background)] p-2.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
            />
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            {initialPlan ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialPlan.id)
                  onClose()
                }}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 cursor-pointer rounded-lg border border-[var(--card-edge)] px-3.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 cursor-pointer rounded-lg bg-[var(--foreground)] px-4 text-xs font-semibold text-[var(--background)] hover:opacity-90"
              >
                {initialPlan ? 'Save changes' : 'Add plan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ============================================================================
 * 2. Habit Modal (Create / Edit)
 * ========================================================================== */

interface HabitModalProps {
  open: boolean
  initialHabit: Habit | null
  onClose: () => void
  onSave: (habit: Omit<Habit, 'id'>, existingId?: string) => void
  onDelete: (habitId: string) => void
}

export function HabitModal({ open, initialHabit, onClose, onSave, onDelete }: HabitModalProps) {
  const [name, setName] = useState(initialHabit?.name ?? '')
  const [color, setColor] = useState<HabitColor>(initialHabit?.color ?? 'green')
  const [weeklyTarget, setWeeklyTarget] = useState(initialHabit?.weeklyTarget ?? 5)
  const [dailyMinutesTarget, setDailyMinutesTarget] = useState(
    initialHabit?.dailyMinutesTarget ?? 20,
  )

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(
      {
        name: name.trim(),
        color,
        weeklyTarget,
        isLabs: initialHabit?.isLabs,
        dailyMinutesTarget: initialHabit?.isLabs ? dailyMinutesTarget : undefined,
      },
      initialHabit?.id,
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-label={initialHabit ? 'Edit habit' : 'New habit'}
        className="w-full max-w-sm rounded-2xl border border-[var(--card-edge-hover)] bg-[var(--yb-sheet)] p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-montserrat text-base font-bold text-[var(--foreground)]">
            {initialHabit ? 'Edit habit' : 'New habit'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 cursor-pointer place-items-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent-surface)] hover:text-[var(--foreground)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
              Habit name
            </label>
            <input
              autoFocus
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gym, Read 20 min, Journal"
              className="h-10 w-full rounded-lg border border-[var(--card-edge-hover)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
              Color
            </label>
            <div className="flex items-center gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={c.label}
                  onClick={() => setColor(c.id)}
                  style={{ background: c.colorVar }}
                  className={`grid size-8 cursor-pointer place-items-center rounded-full transition-transform ${
                    color === c.id ? 'scale-110 ring-2 ring-[var(--foreground)] ring-offset-2 ring-offset-[var(--yb-sheet)]' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {color === c.id && <Check className="size-4 text-[var(--yb-on)] stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--muted-foreground)]">Weekly target</span>
              <span className="font-mono-num font-semibold text-[var(--foreground)]">
                {weeklyTarget} {weeklyTarget === 1 ? 'day' : 'days'} / week
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setWeeklyTarget(n)}
                  className={`h-9 cursor-pointer rounded-lg border text-xs font-semibold transition-colors ${
                    weeklyTarget === n
                      ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                      : 'border-[var(--card-edge)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {initialHabit?.isLabs && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--muted-foreground)]">
                  Daily minutes target
                </span>
                <span className="font-mono-num font-semibold text-[var(--foreground)]">
                  {dailyMinutesTarget} min
                </span>
              </div>
              <input
                type="number"
                min={5}
                max={240}
                step={5}
                value={dailyMinutesTarget}
                onChange={(e) => setDailyMinutesTarget(Math.max(5, Number(e.target.value) || 20))}
                className="h-9 w-full rounded-lg border border-[var(--card-edge-hover)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
              />
            </div>
          )}

          <div className="mt-1 flex items-center justify-between">
            {initialHabit && !initialHabit.isLabs ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialHabit.id)
                  onClose()
                }}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 cursor-pointer rounded-lg border border-[var(--card-edge)] px-3.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 cursor-pointer rounded-lg bg-[var(--foreground)] px-4 text-xs font-semibold text-[var(--background)] hover:opacity-90"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ============================================================================
 * 3. Interactive 11-Step Tour Modal ("How it works")
 * ========================================================================== */

const TOUR_STEPS = [
  {
    title: 'Your whole year on one wall',
    body: 'The Year board is a wall planner for your year: plans, daily habits, quarter goals and your focus time, all on one screen. Here is a quick look at what you can do. It takes about a minute.',
  },
  {
    title: 'Every week of the year',
    body: 'Each row is a month and each block is a week, Monday to Sunday. Coloured bars are plans: a trip, an exam, a launch. Click a week to open it, or drag across days to create a new plan.',
  },
  {
    title: 'Open a week',
    body: 'A week shows its plans, a check grid for your habits and the focus time you spent. Give the week a focus, which shows on the board, and keep notes. When a plan is over, mark whether it happened, so you can see planned against done.',
  },
  {
    title: 'Habits for today',
    body: 'Tick a habit with one tap to log today. Each habit has a weekly target and keeps a streak. Press the eye to light up every day you did it across the whole year.',
  },
  {
    title: 'The Labs habit ticks itself',
    body: 'Your focus and lab sessions are counted for you. A day counts automatically when you hit your daily target. Change the target from Board settings or the three dots on its card.',
  },
  {
    title: 'Perfect weeks',
    body: 'A perfect week is one where every habit hit its target. Those weeks turn green on the board, and you can see your best run.',
  },
  {
    title: 'Quarter goals',
    body: 'Write up to five goals for each quarter and tick them off as you go. The current quarter is outlined.',
  },
  {
    title: 'Show what matters',
    body: 'Plans have a category. Turn a category off to hide it from the board and from what you share.',
  },
  {
    title: 'Weeks or Days',
    body: 'Switch to Days to see the year as a calendar strip. The settings button beside it sets the board density and your Labs target. Arrows at the top move between years, and This week jumps back to today.',
  },
  {
    title: 'Share your year',
    body: 'Share a week, a month or the whole year as a crisp PNG image, or copy a clean summary. Hidden categories stay hidden from what you share.',
  },
  {
    title: 'That is the Year board',
    body: 'Everything saves locally in your browser automatically. Drag across any days to add your first plan, or click a habit to tick today.',
  },
]

interface TourModalProps {
  open: boolean
  onClose: () => void
}

export function TourModal({ open, onClose }: TourModalProps) {
  const [step, setStep] = useState(0)

  if (!open) return null

  const current = TOUR_STEPS[step]
  const isFirst = step === 0
  const isLast = step === TOUR_STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-label="How Year Board works"
        className="w-full max-w-[400px] rounded-2xl border border-[var(--card-edge-hover)] bg-[var(--yb-sheet)] p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>
            {step + 1} of {TOUR_STEPS.length}
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

        <h3 className="font-montserrat mt-2 text-lg font-bold text-[var(--foreground)]">
          {current.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {current.body}
        </p>

        <div className="mt-6 flex items-center justify-between gap-3">
          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Step ${idx + 1}`}
                onClick={() => setStep(idx)}
                className={`h-1.5 cursor-pointer rounded-full transition-all ${
                  idx === step
                    ? 'w-4 bg-[var(--foreground)]'
                    : 'w-1.5 bg-[var(--card-edge-hover)] hover:bg-[var(--muted-foreground)]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isFirst ? (
              <button
                type="button"
                onClick={onClose}
                className="h-9 cursor-pointer rounded-lg px-3 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Skip
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="h-9 cursor-pointer rounded-lg px-3 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Back
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isLast) onClose()
                else setStep((s) => s + 1)
              }}
              className="h-9 cursor-pointer rounded-lg bg-[var(--foreground)] px-4 text-xs font-semibold text-[var(--background)] hover:opacity-90"
            >
              {isFirst ? 'Show me' : isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
 * 4. Share Modal (Week / Month / Year PNG Canvas + Summary Copy)
 * ========================================================================== */

interface ShareModalProps {
  open: boolean
  scope: ShareScope
  year: number
  monthIndex: number
  week: ISOWeekInfo | undefined
  weeks: ISOWeekInfo[]
  visiblePlans: Plan[]
  weekMeta: YearBoardData['weekMeta']
  quarterGoals: QuarterGoal[]
  ownerName: string
  onOwnerNameChange: (name: string) => void
  theme: 'dark' | 'light'
  onClose: () => void
}

const CAT_HEX_DARK: Record<CategoryId, string> = {
  work: '#6b95f0',
  learning: '#a183ee',
  health: '#35b4c4',
  travel: '#d4a94f',
  personal: '#e56b97',
}

const CAT_HEX_LIGHT: Record<CategoryId, string> = {
  work: '#2f62d6',
  learning: '#7c4ddb',
  health: '#0e8fa3',
  travel: '#b98318',
  personal: '#cf3c6f',
}

export function ShareModal({
  open,
  scope,
  year,
  monthIndex,
  week,
  weeks,
  visiblePlans,
  weekMeta,
  quarterGoals,
  ownerName,
  onOwnerNameChange,
  theme,
  onClose,
}: ShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [includeGoals, setIncludeGoals] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 1200
    const H = 680
    canvas.width = W
    canvas.height = H

    const dark = theme === 'dark'
    const bg = dark ? '#0c0a09' : '#fafaf9'
    const surface = dark ? '#161412' : '#ffffff'
    const border = dark ? 'rgba(255,247,237,0.14)' : 'rgba(24,24,27,0.12)'
    const fg = dark ? '#f5f5f4' : '#18181b'
    const muted = dark ? '#a1a1aa' : '#71717a'
    const cellBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
    const catHex = dark ? CAT_HEX_DARK : CAT_HEX_LIGHT

    // Background
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Subtle warm top glow
    const grad = ctx.createRadialGradient(W / 2, -60, 20, W / 2, 0, 560)
    grad.addColorStop(0, dark ? 'rgba(234,88,12,0.18)' : 'rgba(217,119,6,0.1)')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Header
    ctx.fillStyle = muted
    ctx.font = '600 14px Manrope, sans-serif'
    ctx.fillText((ownerName || 'Year Board').toUpperCase(), 48, 54)

    ctx.fillStyle = fg
    ctx.font = '700 32px Montserrat, sans-serif'
    const heading =
      scope === 'week' && week
        ? `Week ${week.weekNumber} · ${week.dateRangeLabel}, ${year}`
        : scope === 'month'
          ? `${MONTH_NAMES[monthIndex]} ${year}`
          : `${year} Year Board`
    ctx.fillText(heading, 48, 94)

    // Category legend on top right
    let lx = W - 48
    ctx.font = '500 13px Manrope, sans-serif'
    for (let i = CATEGORIES.length - 1; i >= 0; i--) {
      const c = CATEGORIES[i]
      const tw = ctx.measureText(c.label).width
      lx -= tw
      ctx.fillStyle = muted
      ctx.fillText(c.label, lx, 88)
      lx -= 14
      ctx.fillStyle = catHex[c.id]
      ctx.beginPath()
      ctx.arc(lx, 84, 5, 0, Math.PI * 2)
      ctx.fill()
      lx -= 20
    }

    if (scope === 'week' && week) {
      const meta = weekMeta[week.weekKey]
      if (meta?.focus) {
        ctx.fillStyle = muted
        ctx.font = '500 14px Manrope, sans-serif'
        ctx.fillText('WEEK FOCUS', 48, 136)
        ctx.fillStyle = fg
        ctx.font = '600 22px Montserrat, sans-serif'
        ctx.fillText(meta.focus, 48, 166)
      }

      const startY = meta?.focus ? 200 : 140
      const colW = (W - 96 - 6 * 14) / 7
      week.days.forEach((dayKey, i) => {
        const x = 48 + i * (colW + 14)
        ctx.fillStyle = surface
        ctx.strokeStyle = border
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(x, startY, colW, 380, 12)
        ctx.fill()
        ctx.stroke()

        const dayNum = dayKey.slice(-2).replace(/^0/, '')
        ctx.fillStyle = muted
        ctx.font = '600 12px Manrope, sans-serif'
        ctx.fillText(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][i], x + 14, startY + 26)
        ctx.fillStyle = fg
        ctx.font = '700 22px Montserrat, sans-serif'
        ctx.fillText(dayNum, x + 14, startY + 54)

        const dayPlans = visiblePlans.filter((p) => p.startDate <= dayKey && p.endDate >= dayKey)
        let py = startY + 78
        for (const p of dayPlans.slice(0, 5)) {
          ctx.fillStyle = catHex[p.category]
          if (p.status === 'missed') {
            ctx.strokeStyle = catHex[p.category]
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.roundRect(x + 10, py, colW - 20, 40, 8)
            ctx.stroke()
          } else {
            ctx.beginPath()
            ctx.roundRect(x + 10, py, colW - 20, 40, 8)
            ctx.fill()
          }
          ctx.fillStyle = p.status === 'missed' ? fg : '#0c0a09'
          ctx.font = '600 12px Manrope, sans-serif'
          ctx.fillText(p.title.slice(0, 16), x + 18, py + 25)
          py += 48
        }
      })
    } else if (scope === 'month') {
      const daysCount = getDaysInMonth(year, monthIndex)
      const firstDow = (new Date(year, monthIndex, 1).getDay() + 6) % 7 // Mon=0
      const cellW = (W - 96 - 6 * 10) / 7
      const cellH = 78
      const startY = 148

      ;['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].forEach((d, i) => {
        ctx.fillStyle = muted
        ctx.font = '600 12px Manrope, sans-serif'
        ctx.fillText(d, 48 + i * (cellW + 10) + 6, 134)
      })

      for (let d = 1; d <= daysCount; d++) {
        const slot = firstDow + (d - 1)
        const col = slot % 7
        const row = Math.floor(slot / 7)
        const x = 48 + col * (cellW + 10)
        const y = startY + row * (cellH + 10)
        const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

        ctx.fillStyle = surface
        ctx.strokeStyle = border
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(x, y, cellW, cellH, 10)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = fg
        ctx.font = '700 14px Montserrat, sans-serif'
        ctx.fillText(String(d), x + 10, y + 22)

        const dayPlans = visiblePlans.filter((p) => p.startDate <= dateKey && p.endDate >= dateKey)
        let py = y + 32
        for (const p of dayPlans.slice(0, 2)) {
          ctx.fillStyle = catHex[p.category]
          ctx.beginPath()
          ctx.roundRect(x + 8, py, cellW - 16, 18, 4)
          ctx.fill()
          ctx.fillStyle = '#0c0a09'
          ctx.font = '600 10px Manrope, sans-serif'
          ctx.fillText(p.title.slice(0, 18), x + 13, py + 12)
          py += 21
        }
      }
    } else {
      // Whole year mini-wall (12 rows x 31 days)
      const startY = 132
      const cellW = 30
      const cellH = 30
      const gap = 4

      for (let m = 0; m < 12; m++) {
        const y = startY + m * (cellH + 7)
        ctx.fillStyle = muted
        ctx.font = '700 11px Montserrat, sans-serif'
        ctx.fillText(MONTH_SHORT[m], 48, y + 19)

        const daysInM = getDaysInMonth(year, m)
        for (let d = 1; d <= daysInM; d++) {
          const x = 96 + (d - 1) * (cellW + gap)
          const dateKey = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const p = visiblePlans.find((pl) => pl.startDate <= dateKey && pl.endDate >= dateKey)

          ctx.beginPath()
          ctx.roundRect(x, y, cellW, cellH, 5)
          if (p) {
            if (p.status === 'missed') {
              ctx.fillStyle = cellBg
              ctx.fill()
              ctx.strokeStyle = catHex[p.category]
              ctx.lineWidth = 1.5
              ctx.stroke()
            } else {
              ctx.fillStyle = catHex[p.category]
              ctx.fill()
            }
          } else {
            ctx.fillStyle = cellBg
            ctx.fill()
          }
          ctx.fillStyle = p && p.status !== 'missed' ? '#0c0a09' : muted
          ctx.font = '500 10px Geist Mono, monospace'
          ctx.textAlign = 'center'
          ctx.fillText(String(d), x + cellW / 2, y + 19)
          ctx.textAlign = 'left'
        }
      }

      if (includeGoals) {
        const yearGoals = quarterGoals.filter((g) => g.year === year)
        ctx.fillStyle = muted
        ctx.font = '600 12px Manrope, sans-serif'
        const doneCount = yearGoals.filter((g) => g.done).length
        ctx.fillText(
          `Quarter goals: ${doneCount}/${yearGoals.length} completed · ${visiblePlans.length} plans across ${weeks.length} weeks`,
          48,
          H - 36,
        )
      }
    }

    // Watermark
    ctx.fillStyle = muted
    ctx.font = '500 12px Manrope, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('Year Board', W - 48, H - 36)
    ctx.textAlign = 'left'
  }, [open, scope, year, monthIndex, week, weeks, visiblePlans, weekMeta, quarterGoals, ownerName, theme, includeGoals])

  if (!open) return null

  const handleDownload = () => {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download =
      scope === 'week' && week
        ? `year-board-${year}-w${week.weekNumber}.png`
        : scope === 'month'
          ? `year-board-${year}-${MONTH_SHORT[monthIndex].toLowerCase()}.png`
          : `year-board-${year}.png`
    a.click()
  }

  const handleCopySummary = async () => {
    const lines: string[] = []
    if (scope === 'week' && week) {
      lines.push(`${ownerName || 'Year Board'} — Week ${week.weekNumber} (${week.dateRangeLabel}, ${year})`)
      const meta = weekMeta[week.weekKey]
      if (meta?.focus) lines.push(`Focus: ${meta.focus}`)
      const wp = visiblePlans.filter((p) => p.startDate <= week.endKey && p.endDate >= week.startKey)
      wp.forEach((p) => lines.push(`- ${p.title} (${formatShortRange(p.startDate, p.endDate)})`))
    } else if (scope === 'month') {
      lines.push(`${ownerName || 'Year Board'} — ${MONTH_NAMES[monthIndex]} ${year}`)
      const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
      visiblePlans
        .filter((p) => p.startDate.startsWith(prefix) || p.endDate.startsWith(prefix))
        .forEach((p) => lines.push(`- ${p.title} (${formatShortRange(p.startDate, p.endDate)})`))
    } else {
      lines.push(`${ownerName || 'Year Board'} — ${year}`)
      visiblePlans
        .filter((p) => p.startDate.startsWith(String(year)))
        .forEach((p) => lines.push(`- ${p.title} (${formatShortRange(p.startDate, p.endDate)})`))
    }
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-label="Share Year Board"
        className="w-full max-w-3xl rounded-2xl border border-[var(--card-edge-hover)] bg-[var(--yb-sheet)] p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-montserrat text-base font-bold text-[var(--foreground)]">
              {scope === 'week' && week
                ? `Share Week ${week.weekNumber}`
                : scope === 'month'
                  ? `Share ${MONTH_NAMES[monthIndex]} ${year}`
                  : `Share all of ${year}`}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Hidden categories are automatically excluded from your share image.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 cursor-pointer place-items-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent-surface)] hover:text-[var(--foreground)]"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Preview canvas */}
        <div className="overflow-hidden rounded-xl border border-[var(--card-edge)] bg-black/20">
          <canvas ref={canvasRef} className="block h-auto w-full" />
        </div>

        {/* Options + Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={ownerName}
              onChange={(e) => onOwnerNameChange(e.target.value)}
              placeholder="Your name or title"
              className="h-9 w-44 rounded-lg border border-[var(--card-edge-hover)] bg-[var(--background)] px-3 text-xs text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
            />
            {scope === 'year' && (
              <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <input
                  type="checkbox"
                  checked={includeGoals}
                  onChange={(e) => setIncludeGoals(e.target.checked)}
                  className="accent-[var(--foreground)]"
                />
                Show goals summary
              </label>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--card-edge-hover)] px-3.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent-surface)]"
            >
              {copied ? <Check className="size-3.5 text-[var(--yb-ok)]" /> : <Copy className="size-3.5" />}
              {copied ? 'Copied!' : 'Copy summary'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--foreground)] px-4 text-xs font-semibold text-[var(--background)] hover:opacity-90"
            >
              <Download className="size-3.5" />
              Download PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

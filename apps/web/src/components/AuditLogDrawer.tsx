import { useEffect, useState } from 'react'
import { History, Loader2, RefreshCw, X } from 'lucide-react'
import type { AuditLogEntry } from '@year-board/shared'
import { useAuditLogsQuery } from '../lib/queries'

interface AuditLogDrawerProps {
  open: boolean
  onClose: () => void
}

const ENTITY_FILTERS = ['all', 'habit', 'plan', 'goal', 'week', 'board'] as const
type EntityFilter = (typeof ENTITY_FILTERS)[number]

const ENTITY_BADGE: Record<AuditLogEntry['entityType'], { label: string; color: string }> = {
  habit: { label: 'Habit', color: 'var(--yb-green)' },
  plan: { label: 'Plan', color: 'var(--yb-blue)' },
  goal: { label: 'Goal', color: 'var(--yb-purple)' },
  week: { label: 'Week', color: 'var(--yb-amber)' },
  board: { label: 'Board', color: 'var(--yb-teal)' },
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AuditLogDrawer({ open, onClose }: AuditLogDrawerProps) {
  const [filter, setFilter] = useState<EntityFilter>('all')
  const query = useAuditLogsQuery(open)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const allLogs = query.data?.logs ?? []
  const logs = filter === 'all' ? allLogs : allLogs.filter((l) => l.entityType === filter)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
      />

      <aside
        role="dialog"
        aria-label="Activity audit log"
        className="relative z-10 flex h-full w-full max-w-[400px] flex-col border-l border-[var(--card-edge-hover)] bg-[var(--yb-sheet)] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--card-edge)] px-5 py-4">
          <div className="flex items-center gap-2">
            <History className="size-4 text-[#ea580c]" />
            <div>
              <h2 className="font-montserrat text-base font-bold text-[var(--foreground)]">
                Activity Log
              </h2>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Recent changes saved to your account
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Refresh audit logs"
              onClick={() => void query.refetch()}
              className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[var(--card-edge)] text-[var(--muted-foreground)] hover:border-[var(--card-edge-hover)] hover:text-[var(--foreground)]"
            >
              <RefreshCw className={`size-3.5 ${query.isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              aria-label="Close activity log"
              onClick={onClose}
              className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[var(--card-edge)] text-[var(--muted-foreground)] hover:border-[var(--card-edge-hover)] hover:text-[var(--foreground)]"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Entity filter pills */}
        <div className="flex flex-wrap gap-1.5 border-b border-[var(--card-edge)] px-5 py-2.5">
          {ENTITY_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`h-7 cursor-pointer rounded-full border px-2.5 text-[11px] font-medium capitalize transition-colors ${
                filter === f
                  ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                  : 'border-[var(--card-edge)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Logs list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {query.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-[var(--muted-foreground)]">
              <Loader2 className="size-4 animate-spin" />
              Loading activity...
            </div>
          ) : query.isError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              Could not load audit logs right now.
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--muted-foreground)]">
              No activity recorded yet.
            </div>
          ) : (
            <ol className="flex flex-col gap-2.5">
              {logs.map((entry) => {
                const badge = ENTITY_BADGE[entry.entityType] ?? ENTITY_BADGE.board
                return (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-[var(--card-edge)] bg-[var(--background)]/60 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-[var(--muted-foreground)]">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: badge.color }}
                        />
                        {badge.label} · <code className="font-mono">{entry.action}</code>
                      </span>
                      <span className="font-mono-num text-[10.5px] text-[var(--muted-foreground)]">
                        {formatTimestamp(entry.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-[var(--foreground)]">
                      {entry.summary}
                    </p>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </aside>
    </div>
  )
}

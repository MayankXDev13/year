import { ArrowLeft, CalendarRange } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function NotFoundPage() {
  const location = useLocation()

  return (
    <div className="yb-backdrop flex min-h-screen items-center justify-center bg-[var(--background)] px-4 text-[var(--foreground)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--card-edge-hover)] bg-[var(--yb-sheet)] p-7 text-center shadow-2xl">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[var(--accent-surface)] text-[var(--muted-foreground)]">
          <CalendarRange className="size-6" />
        </div>
        <div className="font-mono-num text-xs font-semibold tracking-widest text-[#ea580c]">
          404 · NOT FOUND
        </div>
        <h1 className="font-montserrat mt-1.5 text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          We couldn’t find{' '}
          <code className="rounded bg-[var(--accent-surface)] px-1.5 py-0.5 text-xs text-[var(--foreground)]">
            {location.pathname}
          </code>{' '}
          on this Year Board.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2.5">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] hover:opacity-90"
          >
            <ArrowLeft className="size-4" />
            Back to Year Board
          </Link>
          <Link
            to="/login"
            className="inline-flex h-10 items-center rounded-lg border border-[var(--card-edge-hover)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent-surface)]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

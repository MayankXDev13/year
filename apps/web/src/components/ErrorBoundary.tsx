import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, Home, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred.',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="yb-backdrop flex min-h-screen items-center justify-center bg-[var(--background)] px-4 text-[var(--foreground)]">
        <div className="w-full max-w-md rounded-2xl border border-[var(--card-edge-hover)] bg-[var(--yb-sheet)] p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-red-500/15 text-red-400">
            <AlertTriangle className="size-6" />
          </div>
          <h1 className="font-montserrat text-xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{this.state.message}</p>

          <div className="mt-6 flex items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] hover:opacity-90"
            >
              <RotateCcw className="size-4" />
              Reload page
            </button>
            <a
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--card-edge-hover)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent-surface)]"
            >
              <Home className="size-4" />
              Year Board
            </a>
          </div>
        </div>
      </div>
    )
  }
}

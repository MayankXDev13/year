import { useState } from 'react'
import { ArrowLeft, CalendarRange, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { signInWithProvider } from '../lib/auth-client'

export function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<'github' | 'google' | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleOAuth = async (provider: 'github' | 'google') => {
    setErrorMsg(null)
    setLoadingProvider(provider)
    try {
      await signInWithProvider(provider)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to start sign in.')
      setLoadingProvider(null)
    }
  }

  return (
    <div className="yb-backdrop flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 text-[var(--foreground)]">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--card-edge-hover)] bg-[var(--yb-sheet)] p-6 shadow-2xl">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-xl bg-[#ea580c]/20 text-[#ea580c] ring-1 ring-[#ea580c]/30">
            <CalendarRange className="size-5" />
          </div>
          <div>
            <h1 className="font-montserrat text-lg font-bold">Sign in to Year Board</h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              Sync your plans, habits &amp; quarter goals to the cloud
            </p>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400"
          >
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            disabled={loadingProvider !== null}
            onClick={() => handleOAuth('github')}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingProvider === 'github' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.92.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a10.96 10.96 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
              </svg>
            )}
            Continue with GitHub
          </button>

          <button
            type="button"
            disabled={loadingProvider !== null}
            onClick={() => handleOAuth('google')}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-[var(--card-edge-hover)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent-surface)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingProvider === 'google' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
                />
              </svg>
            )}
            Continue with Google
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-[var(--muted-foreground)]">
          Passwordless sign-in via GitHub or Google OAuth only.
        </p>

        <div className="mt-5 border-t border-[var(--card-edge)] pt-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="size-3.5" />
            Continue with Sample Year
          </Link>
        </div>
      </div>
    </div>
  )
}

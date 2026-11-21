import { AlertCircle, ArrowLeft, LogIn } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

const AUTH_ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  access_denied: {
    title: 'Sign-in cancelled',
    description:
      'You cancelled the GitHub or Google sign-in prompt, or denied the requested permissions.',
  },
  state_mismatch: {
    title: 'Session expired during sign-in',
    description:
      'The OAuth state token did not match or expired. Please start signing in again.',
  },
  invalid_callback_request: {
    title: 'Invalid authentication callback',
    description: 'The sign-in callback was missing required parameters. Please try again.',
  },
  oauth_account_already_linked: {
    title: 'Account already linked',
    description: 'This email is already connected to a different OAuth provider.',
  },
  unable_to_create_user: {
    title: 'Could not create account',
    description:
      'We could not create your user account right now. Please try again in a moment.',
  },
  AUTH_HANDLER_ERROR: {
    title: 'Authentication service error',
    description:
      'The authentication server encountered an error while processing your request.',
  },
  OAUTH_SIGNIN_FAILED: {
    title: 'OAuth sign-in failed',
    description: 'Unable to connect to the OAuth provider. Please verify configuration or retry.',
  },
}

export function AuthErrorPage() {
  const [params] = useSearchParams()
  const rawCode = params.get('error') ?? 'UNKNOWN_AUTH_ERROR'
  const normalizedCode = rawCode.toLowerCase()
  const customMessage = params.get('message') ?? params.get('error_description')
  const provider = params.get('provider')

  const matched =
    AUTH_ERROR_MESSAGES[rawCode] ??
    AUTH_ERROR_MESSAGES[normalizedCode] ?? {
      title: 'Authentication failed',
      description:
        customMessage || 'Something went wrong while signing in with GitHub or Google.',
    }

  return (
    <div className="yb-backdrop flex min-h-[calc(100vh-57px)] items-center justify-center bg-[var(--background)] px-4 text-[var(--foreground)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--card-edge-hover)] bg-[var(--yb-sheet)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-400">
            <AlertCircle className="size-5" />
          </div>
          <div>
            <h1 className="font-montserrat text-lg font-bold">{matched.title}</h1>
            <p className="font-mono-num text-xs text-[var(--muted-foreground)]">
              Error code: {rawCode}
              {provider ? ` · ${provider}` : ''}
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
          {matched.description}
        </p>

        {customMessage && customMessage !== matched.description && (
          <div className="mt-3 rounded-lg border border-[var(--card-edge)] bg-[var(--background)] px-3 py-2 font-mono text-xs text-[var(--muted-foreground)]">
            {customMessage}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <Link
            to="/login"
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] hover:opacity-90"
          >
            <LogIn className="size-4" />
            Try signing in again
          </Link>
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[var(--card-edge-hover)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent-surface)]"
          >
            <ArrowLeft className="size-4" />
            Year Board
          </Link>
        </div>
      </div>
    </div>
  )
}

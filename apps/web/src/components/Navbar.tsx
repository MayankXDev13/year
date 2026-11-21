import { useEffect, useState } from 'react'
import { History, LogIn, LogOut, Moon, Sun } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useSession, useSignOut } from '../lib/auth-client'
import { AuditLogDrawer } from './AuditLogDrawer'

const THEME_STORAGE_KEY = 'year-board-theme'

function getInitialTheme(): 'dark' | 'light' {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // ignore
  }
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function Navbar() {
  const location = useLocation()
  const { data: sessionData } = useSession()
  const signOut = useSignOut()
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme)
  const [auditOpen, setAuditOpen] = useState(false)

  const user = sessionData?.user ?? null
  const isLoginPage = location.pathname === '/login'

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  return (
    <nav className="sticky top-0 z-30 border-b border-[var(--card-edge)] bg-[var(--background)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 text-[var(--foreground)] transition-opacity hover:opacity-90"
        >
          <img src="/logo.svg" alt="Year Board logo" className="size-8 rounded-lg" />
          <span className="font-montserrat text-base font-bold tracking-tight">Year Board</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user && (
            <button
              type="button"
              aria-label="Activity log"
              title="Activity log"
              onClick={() => setAuditOpen(true)}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--card-edge)] bg-[var(--surface)] px-2.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:border-[var(--card-edge-hover)] hover:text-[var(--foreground)]"
            >
              <History className="size-3.5" />
              <span className="hidden sm:inline">Activity</span>
            </button>
          )}

          <button
            type="button"
            aria-label="Toggle theme"
            title="Toggle theme"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="grid size-9 cursor-pointer place-items-center rounded-lg border border-[var(--card-edge)] bg-[var(--surface)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--card-edge-hover)] hover:text-[var(--foreground)]"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--card-edge)] bg-[var(--surface)] py-1 pr-1.5 pl-2">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="size-6 rounded-full object-cover"
                />
              ) : (
                <span className="grid size-6 place-items-center rounded-full bg-[#ea580c]/25 text-[11px] font-bold text-[var(--foreground)]">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="hidden max-w-[110px] truncate text-xs font-medium text-[var(--foreground)] sm:inline">
                {user.name.split(' ')[0]}
              </span>
              <button
                type="button"
                title="Sign out"
                aria-label="Sign out"
                onClick={() => void signOut()}
                className="grid size-7 cursor-pointer place-items-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--accent-surface)] hover:text-[var(--foreground)]"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          ) : (
            !isLoginPage && (
              <Link
                to="/login"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--foreground)] px-3.5 text-xs font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
              >
                <LogIn className="size-3.5" />
                <span>Sign in</span>
              </Link>
            )
          )}
        </div>
      </div>
      {user && <AuditLogDrawer open={auditOpen} onClose={() => setAuditOpen(false)} />}
    </nav>
  )
}

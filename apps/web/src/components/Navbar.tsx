import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogIn, LogOut, Moon, Sun } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useSession, useSignOut } from '../lib/auth-client'

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
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!profileOpen) return
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [profileOpen])

  return (
    <nav className="sticky top-0 z-30 border-b border-[var(--card-edge)] bg-[var(--background)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 text-[var(--foreground)] transition-opacity hover:opacity-90"
        >
          <img
            src="/logo-dark.svg"
            alt="Year Board logo"
            className="hidden size-8 rounded-lg dark:block"
          />
          <img
            src="/logo-light.svg"
            alt="Year Board logo"
            className="block size-8 rounded-lg dark:hidden"
          />
          <span className="font-montserrat text-base font-bold tracking-tight">Year Board</span>
        </Link>

        {/* Right actions: Option A — 1-click Theme toggle + Clean Profile Pill Dropdown */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="grid size-9 cursor-pointer place-items-center rounded-full border border-[var(--card-edge)] bg-[var(--surface)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--card-edge-hover)] hover:text-[var(--foreground)]"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                aria-expanded={profileOpen}
                aria-label="Account menu"
                onClick={() => setProfileOpen((o) => !o)}
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-[var(--card-edge)] bg-[var(--surface)] py-1 pr-2.5 pl-1.5 transition-colors hover:border-[var(--card-edge-hover)]"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="size-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid size-6 place-items-center rounded-full bg-[#ea580c] text-[11px] font-bold text-white">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="hidden max-w-[110px] truncate text-xs font-semibold text-[var(--foreground)] sm:inline">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown
                  className={`size-3.5 text-[var(--muted-foreground)] transition-transform ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-[var(--card-edge-hover)] bg-[var(--yb-sheet)] p-1.5 shadow-2xl"
                >
                  <div className="border-b border-[var(--card-edge)] px-2.5 py-2">
                    <div className="truncate text-xs font-semibold text-[var(--foreground)]">
                      {user.name}
                    </div>
                    <div className="truncate text-[11px] text-[var(--muted-foreground)]">
                      {user.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false)
                      void signOut()
                    }}
                    className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <LogOut className="size-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            !isLoginPage && (
              <Link
                to="/login"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--foreground)] px-4 text-xs font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
              >
                <LogIn className="size-3.5" />
                <span>Sign in</span>
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  )
}

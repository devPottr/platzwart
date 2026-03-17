import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useShellStore } from '../../stores/shellStore'
import { hasMinRole } from '../../types'

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function LogOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  )
}

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
}

function SidebarIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      {open ? (
        <polyline points="15 10 13 12 15 14" />
      ) : (
        <polyline points="13 10 15 12 13 14" />
      )}
    </svg>
  )
}

interface ActivityBarProps {
  mobile?: boolean
}

export function ActivityBar({ mobile }: ActivityBarProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const location = useLocation()
  const theme = useShellStore((s) => s.theme)
  const toggleTheme = useShellStore((s) => s.toggleTheme)
  const leftSidebarOpen = useShellStore((s) => s.leftSidebarOpen)
  const toggleLeftSidebar = useShellStore((s) => s.toggleLeftSidebar)

  const goToToday = useShellStore((s) => s.goToToday)
  const [moreOpen, setMoreOpen] = useState(false)

  const navItems: NavItem[] = [
    { to: '/', icon: <CalendarIcon />, label: 'Kalender' },
    ...(hasMinRole(user, 'platzwart') ? [{ to: '/teams', icon: <UsersIcon />, label: 'Teams' }] : []),
    ...(hasMinRole(user, 'admin') ? [{ to: '/admin', icon: <SettingsIcon />, label: 'Verwaltung' }] : []),
  ]

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  function isActive(to: string) {
    if (to === '/') return location.pathname === '/'
    return location.pathname.startsWith(to)
  }

  // Mobile bottom nav
  if (mobile) {
    return (
      <>
        <div className="flex-shrink-0 h-14 bg-bg-activity border-t border-border-subtle flex items-center justify-around px-2 z-50">
          {/* Hamburger — opens left sidebar */}
          <button
            onClick={toggleLeftSidebar}
            className="flex flex-col items-center justify-center w-12 h-12 text-text-muted"
          >
            <MenuIcon />
            <span className="text-[9px] mt-0.5">Menu</span>
          </button>

          {/* Nav items */}
          {navItems.map((item) => {
            const active = isActive(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={(e) => {
                  if (active && item.to === '/') {
                    e.preventDefault()
                    goToToday()
                  }
                }}
                className={`flex flex-col items-center justify-center w-12 h-12 ${
                  active ? 'text-brand' : 'text-text-muted'
                }`}
              >
                {item.icon}
                <span className="text-[9px] mt-0.5">{item.label}</span>
              </Link>
            )
          })}

          {/* More menu */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex flex-col items-center justify-center w-12 h-12 text-text-muted"
          >
            <MoreIcon />
            <span className="text-[9px] mt-0.5">Mehr</span>
          </button>
        </div>

        {/* More popup */}
        {moreOpen && (
          <div className="fixed inset-0 z-[60]" onClick={() => setMoreOpen(false)}>
            <div
              className="absolute bottom-16 right-2 bg-bg-elevated border border-border-subtle rounded-lg shadow-xl p-2 min-w-[160px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { toggleTheme(); setMoreOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:bg-bg-card rounded-md"
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-text-tertiary">
                <div
                  className="w-5 h-5 rounded-full bg-brand flex items-center justify-center text-[9px] font-bold text-text-on-brand"
                >
                  {initials}
                </div>
                {user?.displayName}
              </div>
              <button
                onClick={() => { logout(); setMoreOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-danger hover:bg-bg-card rounded-md"
              >
                <LogOutIcon />
                Abmelden
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  // Desktop vertical bar
  return (
    <div className="w-[44px] h-full bg-bg-activity flex flex-col items-center pt-2 pb-9 border-r border-border-subtle">
      {/* Logo */}
      <Link to="/" className="w-8 h-8 flex items-center justify-center text-brand font-bold text-lg mb-4" title="Platzwart">
        P
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const active = isActive(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                active
                  ? 'text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand rounded-r" />
              )}
              {item.icon}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Sidebar toggle + Theme + User + Logout */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={toggleLeftSidebar}
          className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors rounded-lg hover:bg-bg-elevated"
          title={leftSidebarOpen ? 'Sidebar einklappen' : 'Sidebar ausklappen'}
        >
          <SidebarIcon open={leftSidebarOpen} />
        </button>
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors rounded-lg hover:bg-bg-elevated"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <div
          className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-[11px] font-bold text-text-on-brand"
          title={user?.displayName ?? ''}
        >
          {initials}
        </div>
        <button
          onClick={logout}
          className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
          title="Abmelden"
        >
          <LogOutIcon />
        </button>
      </div>
    </div>
  )
}

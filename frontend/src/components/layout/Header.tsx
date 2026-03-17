import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { hasMinRole } from '../../types'

export function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const location = useLocation()

  const links = [
    { to: '/', label: 'Dashboard' },
    ...(hasMinRole(user, 'platzwart') ? [{ to: '/teams', label: 'Teams' }] : []),
    ...(hasMinRole(user, 'admin') ? [{ to: '/admin', label: 'Verwaltung' }] : []),
  ]

  return (
    <header className="bg-bg-nav border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold tracking-tight text-text-primary">Platzwart</Link>
          <nav className="hidden md:flex gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-bg-elevated text-text-primary'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-bg-elevated'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-tertiary">{user?.displayName}</span>
          <button
            onClick={logout}
            className="text-sm text-text-tertiary hover:text-text-primary transition-colors"
          >
            Abmelden
          </button>
        </div>
      </div>
    </header>
  )
}

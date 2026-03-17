import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Button } from '../components/common/Button'

export function Login() {
  const { user, error, login, register, clearError } = useAuthStore()
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (isRegister) {
        await register(email, password, displayName)
      } else {
        await login(email, password)
      }
      navigate('/')
    } catch {
      // error is set in store
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="bg-bg-card border border-border-subtle rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand">Platzwart</h1>
          <p className="text-text-tertiary mt-2">Sportplatz-Buchungssystem</p>
        </div>

        {error && <div className="bg-[#e5484d1a] text-danger text-sm p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
              required
              minLength={8}
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Laden...' : isRegister ? 'Registrieren' : 'Anmelden'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); clearError() }}
            className="text-sm text-brand hover:underline"
          >
            {isRegister ? 'Bereits registriert? Anmelden' : 'Noch kein Konto? Registrieren'}
          </button>
        </div>
      </div>
    </div>
  )
}

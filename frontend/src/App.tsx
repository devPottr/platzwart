import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { PlannerPage } from './pages/PlannerPage'
import { TeamManagement } from './pages/TeamManagement'
import { AdminPanel } from './pages/AdminPanel'
import { hasMinRole } from './types'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  if (loading) return <div className="flex items-center justify-center h-screen bg-bg-base text-text-primary">Laden...</div>
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/plaetze" element={<Navigate to="/" />} />
                  <Route path="/planer" element={
                    hasMinRole(user, 'trainer') ? <PlannerPage /> : <Navigate to="/" />
                  } />
                  <Route path="/teams" element={
                    hasMinRole(user, 'platzwart') ? <TeamManagement /> : <Navigate to="/" />
                  } />
                  <Route path="/admin" element={
                    hasMinRole(user, 'admin') ? <AdminPanel /> : <Navigate to="/" />
                  } />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

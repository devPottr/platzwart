import { useEffect, useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { ActivityBar } from './ActivityBar'
import { StatusBar } from './StatusBar'
import { LeftSidebar } from './LeftSidebar'
import { RightSidebar } from './RightSidebar'
import { useShellStore } from '../../stores/shellStore'
import { useAuthStore } from '../../stores/authStore'
import { useFieldStore } from '../../stores/fieldStore'
import { getBookings } from '../../api/bookings'
import { BookingDataContext } from '../../stores/bookingDataContext'
import type { Booking } from '../../types'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const user = useAuthStore((s) => s.user)
  const { fields, fetchFields } = useFieldStore()
  const weekStart = useShellStore((s) => s.weekStart)
  const toggleLeftSidebar = useShellStore((s) => s.toggleLeftSidebar)

  const [allBookings, setAllBookings] = useState<Map<number, Booking[]>>(new Map())

  useEffect(() => {
    fetchFields()
  }, [fetchFields])

  const fetchAllBookings = useCallback(() => {
    if (fields.length === 0) return
    Promise.all(
      fields.map((f) =>
        getBookings(f.id, weekStart).then((bookings) => [f.id, bookings] as const)
      )
    ).then((results) => {
      const map = new Map<number, Booking[]>()
      for (const [id, bookings] of results) {
        map.set(id, bookings)
      }
      setAllBookings(map)
    })
  }, [fields, weekStart])

  useEffect(() => {
    fetchAllBookings()
  }, [fetchAllBookings])

  // Theme sync
  const theme = useShellStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  // Keyboard shortcut: Ctrl+B toggles left sidebar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'b') {
        e.preventDefault()
        toggleLeftSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleLeftSidebar])

  return (
    <BookingDataContext.Provider value={{ allBookings, fetchAllBookings }}>
      <div
        className="h-screen overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: '44px auto 1fr 300px',
          gridTemplateRows: 'minmax(0, 1fr) 28px',
        }}
      >
        {/* Activity Bar - spans both rows, col 1 */}
        <div style={{ gridRow: '1 / 3', gridColumn: '1' }}>
          <ActivityBar />
        </div>

        {/* Left Sidebar - row 1, col 2 */}
        <div className="overflow-hidden min-h-0" style={{ gridRow: '1', gridColumn: '2' }}>
          <LeftSidebar
            allBookings={allBookings}
            fields={fields}
            filterMyTeam={false}
            currentUserId={user?.id ?? null}
          />
        </div>

        {/* Main Content - row 1, col 3 */}
        <main className="overflow-hidden min-h-0 bg-bg-card" style={{ gridRow: '1', gridColumn: '3' }}>
          {children}
        </main>

        {/* Right Sidebar - row 1, col 4 */}
        <div className="overflow-hidden min-h-0" style={{ gridRow: '1', gridColumn: '4' }}>
          <RightSidebar
            fields={fields}
            allBookings={allBookings}
            onBookingCreated={fetchAllBookings}
            onBookingDeleted={fetchAllBookings}
          />
        </div>

        {/* Status Bar - row 2, all columns */}
        <StatusBar />
      </div>
    </BookingDataContext.Provider>
  )
}

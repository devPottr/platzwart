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
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { Booking } from '../../types'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const user = useAuthStore((s) => s.user)
  const { fields, fetchFields } = useFieldStore()
  const weekStart = useShellStore((s) => s.weekStart)
  const toggleLeftSidebar = useShellStore((s) => s.toggleLeftSidebar)
  const leftSidebarOpen = useShellStore((s) => s.leftSidebarOpen)
  const rightSidebarOpen = useShellStore((s) => s.rightSidebarOpen)
  const rightPanelMode = useShellStore((s) => s.rightPanelMode)
  const closeMobileOverlays = useShellStore((s) => s.closeMobileOverlays)

  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')

  const [allBookings, setAllBookings] = useState<Map<number, Booking[]>>(new Map())

  useEffect(() => {
    fetchFields()
  }, [fetchFields])

  // Close sidebars when not on desktop (overlays should start closed)
  useEffect(() => {
    if (isMobile || isTablet) {
      closeMobileOverlays()
    }
  }, [isMobile, isTablet]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const showRightPanel = rightPanelMode !== 'none' || rightSidebarOpen

  // Mobile layout
  if (isMobile) {
    return (
      <BookingDataContext.Provider value={{ allBookings, fetchAllBookings }}>
        <div className="h-screen flex flex-col overflow-hidden">
          {/* Main content */}
          <main className="flex-1 overflow-hidden min-h-0 bg-bg-card">
            {children}
          </main>

          {/* Bottom nav */}
          <ActivityBar mobile />

          {/* Left sidebar drawer overlay */}
          {leftSidebarOpen && (
            <div className="fixed inset-0 z-40 flex">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={closeMobileOverlays}
              />
              <div className="relative w-[280px] max-w-[85vw] h-full animate-slide-in-left">
                <LeftSidebar
                  allBookings={allBookings}
                  fields={fields}
                  filterMyTeam={false}
                  currentUserId={user?.id ?? null}
                  mobile
                />
              </div>
            </div>
          )}

          {/* Right sidebar bottom-sheet overlay */}
          {showRightPanel && (
            <div className="fixed inset-0 z-40 flex flex-col justify-end">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={closeMobileOverlays}
              />
              <div className="relative max-h-[85vh] animate-slide-in-bottom">
                <RightSidebar
                  fields={fields}
                  allBookings={allBookings}
                  onBookingCreated={fetchAllBookings}
                  onBookingDeleted={fetchAllBookings}
                  mobile
                />
              </div>
            </div>
          )}
        </div>
      </BookingDataContext.Provider>
    )
  }

  // Tablet layout
  if (isTablet) {
    return (
      <BookingDataContext.Provider value={{ allBookings, fetchAllBookings }}>
        <div className="h-screen flex overflow-hidden">
          {/* Activity bar — narrow vertical */}
          <div className="flex-shrink-0">
            <ActivityBar />
          </div>

          {/* Main content takes full width */}
          <main className="flex-1 overflow-hidden min-h-0 bg-bg-card">
            {children}
          </main>

          {/* Left sidebar overlay */}
          {leftSidebarOpen && (
            <div className="fixed inset-0 z-40 flex">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={closeMobileOverlays}
              />
              <div className="relative w-[280px] h-full ml-[44px] animate-slide-in-left">
                <LeftSidebar
                  allBookings={allBookings}
                  fields={fields}
                  filterMyTeam={false}
                  currentUserId={user?.id ?? null}
                  mobile
                />
              </div>
            </div>
          )}

          {/* Right sidebar overlay */}
          {showRightPanel && (
            <div className="fixed inset-0 z-40 flex justify-end">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={closeMobileOverlays}
              />
              <div className="relative w-[300px] h-full animate-slide-in-right">
                <RightSidebar
                  fields={fields}
                  allBookings={allBookings}
                  onBookingCreated={fetchAllBookings}
                  onBookingDeleted={fetchAllBookings}
                  mobile
                />
              </div>
            </div>
          )}
        </div>
      </BookingDataContext.Provider>
    )
  }

  // Desktop layout — original grid
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

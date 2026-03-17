import { useShellStore } from '../../stores/shellStore'
import { SidebarCalendar } from './SidebarCalendar'
import { SidebarAgenda } from './SidebarAgenda'
import type { Field, Booking } from '../../types'

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

interface LeftSidebarProps {
  allBookings: Map<number, Booking[]>
  fields: Field[]
  filterMyTeam: boolean
  currentUserId: number | null
  mobile?: boolean
}

export function LeftSidebar({ allBookings, fields, filterMyTeam, currentUserId, mobile }: LeftSidebarProps) {
  const open = useShellStore((s) => s.leftSidebarOpen)
  const toggle = useShellStore((s) => s.toggleLeftSidebar)
  const closeMobileOverlays = useShellStore((s) => s.closeMobileOverlays)

  // Mobile: always render fully (controlled by overlay in AppShell)
  if (mobile) {
    return (
      <div className="h-full bg-bg-nav flex flex-col">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-3 h-[46px] flex-shrink-0 border-b border-border-subtle">
          <span className="text-sm font-medium text-text-primary">Menu</span>
          <button
            onClick={closeMobileOverlays}
            className="w-8 h-8 flex items-center justify-center rounded text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col">
          <SidebarCalendar />
          <SidebarAgenda
            allBookings={allBookings}
            fields={fields}
            filterMyTeam={filterMyTeam}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    )
  }

  // Desktop: collapsible sidebar
  return (
    <div
      className="bg-bg-nav border-r border-border-subtle overflow-hidden transition-[width] duration-200 ease-in-out flex flex-col min-h-0 h-full"
      style={{ width: open ? 260 : 0 }}
    >
      <div className="w-[260px] flex flex-col h-full">
        {/* Header — fixed height matching toolbar row */}
        <div className="flex items-center justify-end px-2 h-[46px] flex-shrink-0 border-b border-border-subtle">
          <button
            onClick={toggle}
            className="w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated transition-colors"
            title={open ? 'Sidebar einklappen' : 'Sidebar ausklappen'}
          >
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col">
          <SidebarCalendar />
          <SidebarAgenda
            allBookings={allBookings}
            fields={fields}
            filterMyTeam={filterMyTeam}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
  )
}

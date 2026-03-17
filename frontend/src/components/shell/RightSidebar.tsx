import { useShellStore } from '../../stores/shellStore'
import { BookingDetail } from './BookingDetail'
import { BookingPanel } from '../booking/BookingPanel'
import type { Field, Booking } from '../../types'

const PANEL_TITLES: Record<string, string> = {
  'booking-detail': 'Buchungsdetail',
  'booking-create': 'Neue Buchung',
  'field-detail': 'Platz-Detail',
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

interface RightSidebarProps {
  fields: Field[]
  allBookings: Map<number, Booking[]>
  onBookingCreated: () => void
  onBookingDeleted: () => void
  mobile?: boolean
}

export function RightSidebar({ fields, allBookings, onBookingCreated, onBookingDeleted, mobile }: RightSidebarProps) {
  const mode = useShellStore((s) => s.rightPanelMode)
  const bookingFieldId = useShellStore((s) => s.bookingFieldId)
  const setRightPanel = useShellStore((s) => s.setRightPanel)
  const closeRightPanel = useShellStore((s) => s.closeRightPanel)

  const bookingField = bookingFieldId != null ? fields.find((f) => f.id === bookingFieldId) : undefined

  // Default: show booking-create
  const activeMode = mode === 'none' ? 'booking-create' : mode

  function handleBackToCreate() {
    setRightPanel('booking-create')
  }

  const header = (
    <div className="flex items-center justify-between px-4 h-[46px] flex-shrink-0 border-b border-border-subtle">
      <span className="text-sm font-medium text-text-primary tracking-tight">
        {PANEL_TITLES[activeMode] ?? ''}
      </span>
      <div className="flex items-center gap-2">
        {activeMode === 'booking-detail' && (
          <button
            onClick={handleBackToCreate}
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            title="Zurueck zu Neue Buchung"
          >
            Zurueck
          </button>
        )}
        {mobile && (
          <button
            onClick={closeRightPanel}
            className="w-8 h-8 flex items-center justify-center rounded text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated transition-colors"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  )

  const content = (
    <div className="flex-1 overflow-y-auto">
      {activeMode === 'booking-detail' && (
        <BookingDetail onBookingDeleted={() => {
          onBookingDeleted()
          handleBackToCreate()
        }} />
      )}
      {activeMode === 'booking-create' && (
        <div className="p-4">
          <BookingPanel
            field={bookingField}
            fields={fields}
            bookings={bookingField ? (allBookings.get(bookingField.id) ?? []) : []}
            allBookings={allBookings}
            onClose={closeRightPanel}
            onBookingCreated={() => {
              onBookingCreated()
            }}
            compact
          />
        </div>
      )}
    </div>
  )

  // Mobile: rendered inside bottom-sheet or side overlay in AppShell
  if (mobile) {
    return (
      <div className="bg-bg-nav border-t border-border-subtle rounded-t-xl flex flex-col shadow-elevated max-h-[85vh]">
        {/* Drag handle for bottom sheet feel */}
        <div className="flex justify-center py-2 md:hidden">
          <div className="w-10 h-1 rounded-full bg-border-subtle" />
        </div>
        {header}
        {content}
      </div>
    )
  }

  // Desktop
  return (
    <div className="w-[300px] bg-bg-nav border-l border-border-subtle flex flex-col shadow-elevated min-h-0 h-full">
      {header}
      {content}
    </div>
  )
}

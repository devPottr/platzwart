import { useShellStore } from '../../stores/shellStore'
import { BookingDetail } from './BookingDetail'
import { BookingPanel } from '../booking/BookingPanel'
import type { Field, Booking } from '../../types'

const PANEL_TITLES: Record<string, string> = {
  'booking-detail': 'Buchungsdetail',
  'booking-create': 'Neue Buchung',
  'field-detail': 'Platz-Detail',
}

interface RightSidebarProps {
  fields: Field[]
  allBookings: Map<number, Booking[]>
  onBookingCreated: () => void
  onBookingDeleted: () => void
}

export function RightSidebar({ fields, allBookings, onBookingCreated, onBookingDeleted }: RightSidebarProps) {
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

  return (
    <div className="w-[300px] bg-bg-nav border-l border-border-subtle flex flex-col shadow-elevated min-h-0 h-full">
      {/* Header — fixed height matching toolbar row */}
      <div className="flex items-center justify-between px-4 h-[46px] flex-shrink-0 border-b border-border-subtle">
        <span className="text-sm font-medium text-text-primary tracking-tight">
          {PANEL_TITLES[activeMode] ?? ''}
        </span>
        {activeMode === 'booking-detail' && (
          <button
            onClick={handleBackToCreate}
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            title="Zurueck zu Neue Buchung"
          >
            Zurueck
          </button>
        )}
      </div>

      {/* Content */}
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
    </div>
  )
}

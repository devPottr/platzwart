import type { Booking } from '../../types'

interface BookingListProps {
  bookings: Booking[]
  onDelete?: (id: number) => void
}

export function BookingList({ bookings, onDelete }: BookingListProps) {
  if (bookings.length === 0) {
    return <p className="text-sm text-text-tertiary">Keine Buchungen vorhanden.</p>
  }

  return (
    <div className="space-y-2">
      {bookings.map((b) => (
        <div key={b.id} className="flex items-center justify-between bg-bg-card border border-border-subtle rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: b.teamColor ?? '#6b7280' }}
            />
            <div>
              <div className="text-sm font-medium text-text-primary">{b.title}</div>
              <div className="text-xs text-text-tertiary">
                {new Date(b.startTime).toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {new Date(b.endTime).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                {b.teamName && ` | ${b.teamName}`}
              </div>
            </div>
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(b.id)}
              className="text-danger hover:text-danger-hover text-sm"
            >
              Loeschen
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { getBooking, deleteBooking, deleteSeries } from '../../api/bookings'
import { useShellStore } from '../../stores/shellStore'
import { Button } from '../common/Button'
import type { Booking } from '../../types'

function formatTime(iso: string): string {
  return iso.slice(11, 16)
}

function formatDate(iso: string): string {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

const TYPE_LABELS: Record<string, string> = {
  training: 'Training',
  match: 'Spiel',
  tournament: 'Turnier',
  maintenance: 'Wartung',
  locked: 'Gesperrt',
}

interface BookingDetailProps {
  onBookingDeleted: () => void
}

export function BookingDetail({ onBookingDeleted }: BookingDetailProps) {
  const selectedBookingId = useShellStore((s) => s.selectedBookingId)
  const closeRightPanel = useShellStore((s) => s.closeRightPanel)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (selectedBookingId == null) return
    setLoading(true)
    getBooking(selectedBookingId)
      .then(setBooking)
      .catch(() => setBooking(null))
      .finally(() => setLoading(false))
  }, [selectedBookingId])

  if (loading) {
    return <div className="p-4 text-sm text-text-tertiary">Laden...</div>
  }

  if (!booking) {
    return <div className="p-4 text-sm text-text-tertiary">Buchung nicht gefunden</div>
  }

  const teamColor =
    booking.bookingType === 'maintenance'
      ? '#6b7280'
      : booking.bookingType === 'locked'
        ? '#ef4444'
        : (booking.teamColor ?? '#6b7280')

  const handleDelete = async () => {
    if (!confirm('Buchung wirklich loeschen?')) return
    setDeleting(true)
    try {
      await deleteBooking(booking.id)
      onBookingDeleted()
      closeRightPanel()
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteSeries = async () => {
    if (!booking.recurrenceId) return
    if (!confirm('Gesamte Serie loeschen?')) return
    setDeleting(true)
    try {
      await deleteSeries(booking.recurrenceId)
      onBookingDeleted()
      closeRightPanel()
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Team color bar + name */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-8 rounded-full" style={{ backgroundColor: teamColor }} />
        <div>
          <div className="text-sm font-semibold text-text-primary">
            {booking.teamName ?? booking.title}
          </div>
          <div className="text-xs text-text-tertiary">{booking.title}</div>
        </div>
      </div>

      {/* Info rows */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-tertiary">Typ</span>
          <span className="text-text-primary font-medium">
            {TYPE_LABELS[booking.bookingType] ?? booking.bookingType}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Datum</span>
          <span className="text-text-primary">{formatDate(booking.startTime)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Zeit</span>
          <span className="text-text-primary">
            {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Gebucht von</span>
          <span className="text-text-primary">{booking.bookedByName}</span>
        </div>
        {booking.sections.length > 0 && (
          <div>
            <span className="text-text-tertiary text-sm">Zonen</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {booking.sections.map((s) => (
                <span
                  key={s.id}
                  className="text-xs px-1.5 py-0.5 rounded bg-bg-elevated text-text-secondary border border-border-subtle"
                >
                  {s.label ?? `${s.colIndex + 1}/${s.rowIndex + 1}`}
                </span>
              ))}
            </div>
          </div>
        )}
        {booking.notes && (
          <div>
            <span className="text-text-tertiary text-sm">Notizen</span>
            <p className="text-text-secondary text-sm mt-0.5">{booking.notes}</p>
          </div>
        )}
        {booking.recurrenceId && (
          <div className="text-xs text-text-muted italic">
            Teil einer Serie
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Loeschen...' : 'Buchung loeschen'}
        </Button>
        {booking.recurrenceId && (
          <Button variant="secondary" size="sm" onClick={handleDeleteSeries} disabled={deleting}>
            Serie loeschen
          </Button>
        )}
      </div>
    </div>
  )
}

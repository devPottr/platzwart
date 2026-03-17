import { useState, useEffect } from 'react'
import { Dialog } from '../common/Dialog'
import { Button } from '../common/Button'
import { createBooking } from '../../api/bookings'
import { getTeams } from '../../api/teams'
import { useBookingStore } from '../../stores/bookingStore'
import { useAuthStore } from '../../stores/authStore'
import { hasMinRole, type Team } from '../../types'
import { RecurrenceForm } from './RecurrenceForm'

interface BookingDialogProps {
  open: boolean
  onClose: () => void
  fieldId: number
  sectionIds: number[]
  startTime: string
  endTime: string
}

export function BookingDialog({ open, onClose, fieldId, sectionIds, startTime, endTime }: BookingDialogProps) {
  const [title, setTitle] = useState('')
  const [bookingType, setBookingType] = useState('training')
  const [teamId, setTeamId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [rRule, setRRule] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fetchBookings = useBookingStore((s) => s.fetchBookings)
  const weekStart = useBookingStore((s) => s.weekStart)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (open) {
      getTeams().then(setTeams).catch(() => {})
      setTitle('')
      setBookingType('training')
      setTeamId(null)
      setNotes('')
      setRRule('')
      setError('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Titel ist erforderlich')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createBooking({
        title: title.trim(),
        bookingType,
        teamId,
        startTime,
        endTime,
        sectionIds,
        notes: notes || undefined,
        rRule: rRule || undefined,
      })
      await fetchBookings(fieldId, weekStart)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Buchung fehlgeschlagen')
    } finally {
      setSubmitting(false)
    }
  }

  const bookingTypes = [
    { value: 'training', label: 'Training' },
    { value: 'match', label: 'Spiel' },
    { value: 'tournament', label: 'Turnier' },
    ...(hasMinRole(user, 'platzwart')
      ? [
          { value: 'maintenance', label: 'Wartung' },
          { value: 'locked', label: 'Gesperrt' },
        ]
      : []),
  ]

  return (
    <Dialog open={open} onClose={onClose} title="Neue Buchung">
      <div className="space-y-4">
        {error && <div className="text-danger text-sm bg-[#e5484d1a] p-2 rounded">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Titel</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="z.B. Training A-Jugend"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Art</label>
          <select
            value={bookingType}
            onChange={(e) => setBookingType(e.target.value)}
            className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary"
          >
            {bookingTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Team</label>
          <select
            value={teamId ?? ''}
            onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : null)}
            className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary"
          >
            <option value="">-- Kein Team --</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block font-medium text-text-secondary mb-1">Start</label>
            <input type="datetime-local" value={startTime.slice(0, 16)} readOnly className="w-full border border-border-control rounded-lg px-3 py-2 bg-bg-elevated text-text-secondary" />
          </div>
          <div>
            <label className="block font-medium text-text-secondary mb-1">Ende</label>
            <input type="datetime-local" value={endTime.slice(0, 16)} readOnly className="w-full border border-border-control rounded-lg px-3 py-2 bg-bg-elevated text-text-secondary" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Notizen</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <RecurrenceForm value={rRule} onChange={setRRule} />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Speichern...' : 'Buchen'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

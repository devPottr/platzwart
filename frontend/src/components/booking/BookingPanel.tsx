import { useState, useEffect, useRef } from 'react'
import { createBooking } from '../../api/bookings'
import { getTeams } from '../../api/teams'
import { useAuthStore } from '../../stores/authStore'
import { useShellStore } from '../../stores/shellStore'
import { toLocalISO } from '../../utils/date'
import { hasMinRole, type Field, type Booking, type Team } from '../../types'
import { FieldGrid } from '../field/FieldGrid'
import { RecurrenceForm } from './RecurrenceForm'
import { Button } from '../common/Button'

interface BookingPanelProps {
  field?: Field
  fields?: Field[]
  bookings: Booking[]
  allBookings?: Map<number, Booking[]>
  onClose: () => void
  onBookingCreated: () => void
  compact?: boolean
}

export function BookingPanel({ field: initialField, fields, bookings: initialBookings, allBookings, onClose, onBookingCreated, compact = false }: BookingPanelProps) {
  const user = useAuthStore((s) => s.user)
  const bookingPrefill = useShellStore((s) => s.bookingPrefill)
  const panelRef = useRef<HTMLDivElement>(null)

  const today = toLocalISO(new Date())
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(initialField?.id ?? null)
  const [selectedDate, setSelectedDate] = useState(bookingPrefill?.date ?? today)
  const [startTime, setStartTime] = useState(bookingPrefill?.startTime ?? '09:00')
  const [endTime, setEndTime] = useState(bookingPrefill?.endTime ?? '10:30')
  const [selectedSections, setSelectedSections] = useState<number[]>([])
  const [title, setTitle] = useState('')
  const [bookingType, setBookingType] = useState('training')
  const [teamId, setTeamId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [rRule, setRRule] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const activeField = initialField ?? fields?.find((f) => f.id === selectedFieldId) ?? null
  const activeBookings = activeField
    ? (allBookings?.get(activeField.id) ?? initialBookings)
    : initialBookings

  useEffect(() => {
    getTeams().then(setTeams).catch(() => {})
  }, [])

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Update when prefill changes
  useEffect(() => {
    if (bookingPrefill) {
      setSelectedDate(bookingPrefill.date)
      setStartTime(bookingPrefill.startTime)
      setEndTime(bookingPrefill.endTime)
    }
  }, [bookingPrefill])

  function handleToggleSection(sectionId: number) {
    setSelectedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    )
  }

  const selectedTime =
    selectedDate && startTime && endTime
      ? { start: `${selectedDate}T${startTime}:00`, end: `${selectedDate}T${endTime}:00` }
      : null

  const isValid = title.trim() && selectedSections.length > 0 && selectedDate && startTime && endTime && startTime < endTime && activeField

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Titel ist erforderlich')
      return
    }
    if (!activeField) {
      setError('Bitte einen Platz auswaehlen')
      return
    }
    if (selectedSections.length === 0) {
      setError('Bitte mindestens eine Zone auswaehlen')
      return
    }
    if (startTime >= endTime) {
      setError('Endzeit muss nach Startzeit liegen')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await createBooking({
        title: title.trim(),
        bookingType,
        teamId,
        startTime: `${selectedDate}T${startTime}:00`,
        endTime: `${selectedDate}T${endTime}:00`,
        sectionIds: selectedSections,
        notes: notes || undefined,
        rRule: rRule || undefined,
      })
      onBookingCreated()
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
    <div ref={panelRef} className={compact ? '' : 'bg-bg-card border border-border-subtle rounded-xl p-6'}>
      {!compact && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-text-primary tracking-tight">
              {activeField ? `Platz ${activeField.name} buchen` : 'Neue Buchung'}
            </h2>
            <p className="text-sm text-text-tertiary mt-0.5">Zonen direkt im Feld markieren statt nur ueber eine Liste</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors text-xl leading-none"
            aria-label="Schliessen"
          >
            &times;
          </button>
        </div>
      )}

      <div className={compact ? 'space-y-3' : 'grid grid-cols-1 lg:grid-cols-2 gap-8'}>
        {/* Left column — Zone selection */}
        <div>
          {/* Field selector (when no field pre-selected) */}
          {!initialField && fields && fields.length > 0 && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">Platz</label>
              <select
                value={selectedFieldId ?? ''}
                onChange={(e) => {
                  setSelectedFieldId(e.target.value ? Number(e.target.value) : null)
                  setSelectedSections([])
                }}
                className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary"
              >
                <option value="">-- Platz waehlen --</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          {activeField ? (
            <>
              <FieldGrid
                field={activeField}
                bookings={activeBookings}
                selectedTime={selectedTime}
                selectedSections={selectedSections}
                onToggleSection={handleToggleSection}
                compact={compact}
              />
              {/* Legend */}
              <div className="flex gap-4 mt-3 text-xs text-text-tertiary">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-brand/30 border border-brand" />
                  <span>Ausgewaehlt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-bg-field border border-border-field" />
                  <span>Frei</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-danger/20 border border-danger/50" />
                  <span>Nicht verfuegbar</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-text-tertiary bg-bg-elevated rounded-lg border border-border-subtle">
              Platz auswaehlen um Zonen zu sehen
            </div>
          )}
        </div>

        {/* Right column — Booking form */}
        <div className="space-y-4">
          {error && <div className="text-danger text-sm bg-[#e5484d1a] p-2 rounded">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              placeholder="z.B. Training A-Jugend"
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
            <label className="block text-sm font-medium text-text-secondary mb-1">Mannschaft</label>
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

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Trainer</label>
            <input
              type="text"
              value={user?.displayName ?? ''}
              readOnly
              className="w-full border border-border-control rounded-lg px-3 py-2 text-sm bg-bg-elevated text-text-secondary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Datum</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Platz</label>
              <input
                type="text"
                value={activeField?.name ?? 'Nicht gewaehlt'}
                readOnly
                className="w-full border border-border-control rounded-lg px-3 py-2 text-sm bg-bg-elevated text-text-secondary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Von</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step="900"
                className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Bis</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                step="900"
                className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              />
            </div>
          </div>

          {/* Selected zones */}
          {selectedSections.length > 0 && activeField && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Ausgewaehlte Zonen</label>
              <div className="flex flex-wrap gap-1.5">
                {selectedSections.map((sId) => {
                  const section = activeField.sections.find((s) => s.id === sId)
                  return (
                    <span
                      key={sId}
                      className="text-xs px-2 py-0.5 rounded-full bg-brand/15 text-brand border border-brand/30"
                    >
                      {section?.label ?? `Zone ${sId}`}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <RecurrenceForm value={rRule} onChange={setRRule} />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Hinweis</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              placeholder="Optionale Anmerkungen..."
            />
          </div>

          {/* Validation banner */}
          {isValid && (
            <div className="text-sm text-brand bg-brand/10 border border-brand/20 rounded-lg px-3 py-2">
              Buchung moeglich
            </div>
          )}

          {!compact && (
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
              <Button onClick={handleSubmit} disabled={submitting || !isValid}>
                {submitting ? 'Speichern...' : 'Buchung speichern'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {compact && (
        <div className="sticky bottom-0 bg-bg-nav border-t border-border-subtle pt-3 mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={submitting || !isValid}>
            {submitting ? 'Speichern...' : 'Buchung speichern'}
          </Button>
        </div>
      )}
    </div>
  )
}

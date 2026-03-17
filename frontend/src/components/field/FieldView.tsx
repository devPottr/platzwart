import { useEffect, useState } from 'react'
import { useFieldStore } from '../../stores/fieldStore'
import { useBookingStore } from '../../stores/bookingStore'
import { getMonday, addDays } from '../../utils/date'
import { FieldGrid } from './FieldGrid'
import { FieldLegend } from './FieldLegend'
import { WeekView } from '../booking/WeekView'
import { BookingDialog } from '../booking/BookingDialog'

export function FieldView() {
  const { fields, selectedFieldId, fetchFields, selectField } = useFieldStore()
  const { bookings, weekStart, fetchBookings, setWeekStart } = useBookingStore()
  const [selectedTime, setSelectedTime] = useState<{ start: string; end: string } | null>(null)
  const [selectedSections, setSelectedSections] = useState<number[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const selectedField = fields.find((f) => f.id === selectedFieldId)

  useEffect(() => {
    fetchFields()
  }, [fetchFields])

  useEffect(() => {
    if (selectedFieldId) {
      fetchBookings(selectedFieldId, weekStart)
    }
  }, [selectedFieldId, weekStart, fetchBookings])

  const handleToggleSection = (sectionId: number) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    )
  }

  const handleSlotClick = (day: string, hour: number) => {
    const start = `${day}T${String(hour).padStart(2, '0')}:00:00`
    const end = `${day}T${String(hour + 1).padStart(2, '0')}:00:00`
    setSelectedTime({ start, end })
    setSelectedSections([])
  }

  const handleBook = () => {
    if (selectedTime && selectedSections.length > 0) {
      setDialogOpen(true)
    }
  }

  const changeWeek = (delta: number) => {
    setWeekStart(addDays(weekStart, 7 * delta))
  }

  const goToday = () => {
    setWeekStart(getMonday(new Date()))
  }

  const weekNumber = (() => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
    const yearStart = new Date(d.getFullYear(), 0, 4)
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7)
  })()

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={selectedFieldId ?? ''}
          onChange={(e) => selectField(Number(e.target.value))}
          className="bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm font-medium text-text-primary"
        >
          {fields.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button onClick={() => changeWeek(-1)} className="px-3 py-2 border border-border-control rounded-lg text-text-secondary hover:bg-bg-elevated">&lt;</button>
          <span className="font-medium text-sm text-text-primary">KW {weekNumber}</span>
          <button onClick={() => changeWeek(1)} className="px-3 py-2 border border-border-control rounded-lg text-text-secondary hover:bg-bg-elevated">&gt;</button>
        </div>
        <button onClick={goToday} className="px-3 py-2 border border-border-control rounded-lg text-sm text-text-secondary hover:bg-bg-elevated">Heute</button>
        {selectedTime && selectedSections.length > 0 && (
          <button onClick={handleBook} className="px-4 py-2 bg-brand text-text-on-brand rounded-lg text-sm font-semibold hover:bg-brand-hover">
            Buchen ({selectedSections.length} Sektionen)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Week calendar */}
        <div className="lg:col-span-2">
          <WeekView
            bookings={bookings}
            weekStart={weekStart}
            onSlotClick={handleSlotClick}
            selectedTime={selectedTime}
          />
        </div>

        {/* Field grid + legend */}
        <div className="space-y-4">
          {selectedField && (
            <>
              <h3 className="font-bold text-lg text-text-primary">{selectedField.name}</h3>
              {selectedTime ? (
                <div className="text-sm text-text-tertiary mb-2">
                  {new Date(selectedTime.start).toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(selectedTime.end).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary">Klicke auf einen Zeitslot im Kalender</p>
              )}
              <FieldGrid
                field={selectedField}
                bookings={bookings}
                selectedTime={selectedTime}
                selectedSections={selectedSections}
                onToggleSection={handleToggleSection}
              />
              <FieldLegend bookings={bookings} />
            </>
          )}
        </div>
      </div>

      {selectedField && selectedTime && (
        <BookingDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false)
            setSelectedSections([])
            setSelectedTime(null)
          }}
          fieldId={selectedField.id}
          sectionIds={selectedSections}
          startTime={selectedTime.start}
          endTime={selectedTime.end}
        />
      )}
    </div>
  )
}

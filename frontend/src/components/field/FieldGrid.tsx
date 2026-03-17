import type { Field, Booking } from '../../types'
import { FieldSection } from './FieldSection'

interface FieldGridProps {
  field: Field
  bookings: Booking[]
  selectedTime: { start: string; end: string } | null
  selectedSections: number[]
  onToggleSection: (sectionId: number) => void
  compact?: boolean
}

export function FieldGrid({ field, bookings, selectedTime, selectedSections, onToggleSection, compact = false }: FieldGridProps) {
  const bookedSections = new Map<number, Booking>()
  if (selectedTime) {
    const selStart = new Date(selectedTime.start).getTime()
    const selEnd = new Date(selectedTime.end).getTime()
    for (const booking of bookings) {
      const bStart = new Date(booking.startTime).getTime()
      const bEnd = new Date(booking.endTime).getTime()
      if (bStart < selEnd && bEnd > selStart) {
        for (const sec of booking.sections) {
          bookedSections.set(sec.id, booking)
        }
      }
    }
  }

  return (
    <div
      className={`grid bg-bg-field rounded-xl border-2 border-border-field ${compact ? 'gap-1 p-2' : 'gap-2 p-4'}`}
      style={{
        gridTemplateColumns: `repeat(${field.gridCols}, 1fr)`,
        gridTemplateRows: `repeat(${field.gridRows}, 1fr)`,
      }}
    >
      {field.sections
        .sort((a, b) => a.rowIndex * 100 + a.colIndex - (b.rowIndex * 100 + b.colIndex))
        .map((section) => {
          const booking = bookedSections.get(section.id)
          const isSelected = selectedSections.includes(section.id)
          const isBooked = !!booking
          return (
            <FieldSection
              key={section.id}
              section={section}
              booking={booking ?? null}
              isSelected={isSelected}
              isBooked={isBooked}
              compact={compact}
              onClick={() => !isBooked && onToggleSection(section.id)}
            />
          )
        })}
    </div>
  )
}

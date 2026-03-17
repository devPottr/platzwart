import { addDays } from '../../utils/date'
import type { Booking } from '../../types'

interface WeekViewProps {
  bookings: Booking[]
  weekStart: string
  onSlotClick: (day: string, hour: number) => void
  selectedTime: { start: string; end: string } | null
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6) // 06:00 - 21:00
const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function WeekView({ bookings, weekStart, onSlotClick, selectedTime }: WeekViewProps) {
  const days = DAYS.map((label, i) => {
    const date = addDays(weekStart, i)
    return { label, date, dateObj: new Date(date + 'T00:00:00') }
  })

  const getBookingsForSlot = (day: string, hour: number) => {
    const slotStart = new Date(`${day}T${String(hour).padStart(2, '0')}:00:00`).getTime()
    const slotEnd = slotStart + 3600000
    return bookings.filter((b) => {
      const bStart = new Date(b.startTime).getTime()
      const bEnd = new Date(b.endTime).getTime()
      return bStart < slotEnd && bEnd > slotStart
    })
  }

  const isSelected = (day: string, hour: number) => {
    if (!selectedTime) return false
    const slotStart = new Date(`${day}T${String(hour).padStart(2, '0')}:00:00`).getTime()
    const selStart = new Date(selectedTime.start).getTime()
    return slotStart === selStart
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-border-subtle rounded-t-lg overflow-hidden">
          <div className="bg-bg-elevated p-2 text-xs font-medium text-text-muted" />
          {days.map((d) => (
            <div key={d.date} className="bg-bg-elevated p-2 text-center">
              <div className="text-xs font-medium text-text-tertiary">{d.label}</div>
              <div className="text-sm font-bold text-text-primary">{d.dateObj.getDate()}.{d.dateObj.getMonth() + 1}.</div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-border-subtle rounded-b-lg overflow-hidden">
          {HOURS.map((hour) => (
            <>
              <div key={`h-${hour}`} className="bg-bg-elevated p-1 text-xs text-text-muted text-right pr-2 flex items-start justify-end">
                {String(hour).padStart(2, '0')}:00
              </div>
              {days.map((d) => {
                const slotBookings = getBookingsForSlot(d.date, hour)
                const selected = isSelected(d.date, hour)
                return (
                  <div
                    key={`${d.date}-${hour}`}
                    className={`bg-bg-card min-h-[40px] p-0.5 cursor-pointer hover:bg-brand-muted transition-colors ${
                      selected ? 'ring-2 ring-brand ring-inset bg-brand-muted' : ''
                    }`}
                    onClick={() => onSlotClick(d.date, hour)}
                  >
                    {slotBookings.map((b) => (
                      <div
                        key={b.id}
                        className="rounded px-1 py-0.5 text-xs text-white truncate mb-0.5"
                        style={{ backgroundColor: b.teamColor ?? '#6b7280' }}
                        title={`${b.title} (${b.teamName ?? ''})`}
                      >
                        {b.teamName ?? b.title}
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}

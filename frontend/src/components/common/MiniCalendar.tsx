import { useMemo } from 'react'

interface MiniCalendarProps {
  selectedDate: string
  onSelectDate: (date: string) => void
  bookingDates: Set<string>
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTH_NAMES = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function MiniCalendar({ selectedDate, onSelectDate, bookingDates }: MiniCalendarProps) {
  const sel = new Date(selectedDate + 'T00:00:00')
  const year = sel.getFullYear()
  const month = sel.getMonth()
  const today = toISO(new Date())

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    // Monday = 0, Sunday = 6
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6

    const days: { date: string; day: number; inMonth: boolean }[] = []

    // Days from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({ date: toISO(d), day: d.getDate(), inMonth: false })
    }

    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push({ date: toISO(d), day: i, inMonth: true })
    }

    // Fill remaining to complete 6 rows
    while (days.length < 42) {
      const d = new Date(year, month + 1, days.length - startOffset - daysInMonth + 1)
      days.push({ date: toISO(d), day: d.getDate(), inMonth: false })
    }

    return days
  }, [year, month])

  function changeMonth(delta: number) {
    const d = new Date(year, month + delta, 1)
    onSelectDate(toISO(d))
  }

  return (
    <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => changeMonth(-1)}
          className="text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-bg-elevated transition-colors"
        >
          &#8249;
        </button>
        <span className="text-text-primary font-semibold text-sm">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-bg-elevated transition-colors"
        >
          &#8250;
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center text-[11px] text-text-muted font-medium py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map(({ date, day, inMonth }) => {
          const isToday = date === today
          const isSelected = date === selectedDate
          const hasBooking = bookingDates.has(date)

          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={`
                relative flex flex-col items-center justify-center py-1.5 text-xs rounded-md transition-colors
                ${!inMonth ? 'text-text-muted' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'}
                ${isToday && !isSelected ? 'ring-1 ring-brand' : ''}
                ${isSelected ? 'bg-brand text-text-on-brand font-semibold' : ''}
              `}
            >
              {day}
              {hasBooking && (
                <span
                  className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                    isSelected ? 'bg-text-on-brand' : 'bg-brand'
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

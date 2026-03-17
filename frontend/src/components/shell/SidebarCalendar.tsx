import { useState, useMemo, useEffect } from 'react'
import { useShellStore } from '../../stores/shellStore'
import { getMonthDays, getWeekStartForDate, isWeekend, addDays, toLocalISO } from '../../utils/date'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function SidebarCalendar() {
  const weekStart = useShellStore((s) => s.weekStart)
  const setWeekStart = useShellStore((s) => s.setWeekStart)
  const today = toLocalISO(new Date())

  const [displayMonth, setDisplayMonth] = useState(() => {
    const d = new Date(weekStart + 'T00:00:00')
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  useEffect(() => {
    const d = new Date(weekStart + 'T00:00:00')
    setDisplayMonth({ year: d.getFullYear(), month: d.getMonth() })
  }, [weekStart])

  const calendarDays = useMemo(
    () => getMonthDays(displayMonth.year, displayMonth.month),
    [displayMonth.year, displayMonth.month]
  )

  const displayMonthName = useMemo(() => {
    const d = new Date(displayMonth.year, displayMonth.month, 1)
    return d.toLocaleString('de-DE', { month: 'long' })
  }, [displayMonth.year, displayMonth.month])

  const weekDateSet = useMemo(() => {
    const dates = new Set<string>()
    for (let i = 0; i < 7; i++) dates.add(addDays(weekStart, i))
    return dates
  }, [weekStart])

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-text-primary capitalize">
          {displayMonthName} {displayMonth.year}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setDisplayMonth((prev) => {
                const d = new Date(prev.year, prev.month - 1, 1)
                return { year: d.getFullYear(), month: d.getMonth() }
              })
            }
            className="w-6 h-6 flex items-center justify-center rounded text-text-secondary hover:bg-bg-elevated transition-colors text-sm"
            aria-label="Vorheriger Monat"
          >
            &#8249;
          </button>
          <button
            onClick={() =>
              setDisplayMonth((prev) => {
                const d = new Date(prev.year, prev.month + 1, 1)
                return { year: d.getFullYear(), month: d.getMonth() }
              })
            }
            className="w-6 h-6 flex items-center justify-center rounded text-text-secondary hover:bg-bg-elevated transition-colors text-sm"
            aria-label="Naechster Monat"
          >
            &#8250;
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-[10px] font-medium text-text-tertiary text-center py-0.5">
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map(({ date, inMonth }) => {
          const isToday = date === today
          const inWeek = weekDateSet.has(date)
          const isWe = isWeekend(date)

          return (
            <button
              key={date}
              onClick={() => setWeekStart(getWeekStartForDate(date))}
              className={`text-[11px] h-7 w-full flex items-center justify-center transition-colors ${
                isToday
                  ? 'bg-brand text-white rounded-full font-bold'
                  : inWeek
                    ? 'bg-brand/10 hover:bg-brand/20'
                    : 'hover:bg-bg-elevated'
              } ${
                !isToday && !inMonth
                  ? 'text-text-muted'
                  : !isToday && isWe
                    ? 'text-text-tertiary'
                    : !isToday
                      ? 'text-text-primary'
                      : ''
              }`}
            >
              {new Date(date + 'T00:00:00').getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

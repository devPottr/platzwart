import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useShellStore } from '../../stores/shellStore'
import { addDays, formatFullDateDE, toLocalISO, getMonthDays, getWeekStartForDate } from '../../utils/date'
import { useTimelineData, getHourFraction } from '../../hooks/useTimelineData'
import type { Field, Booking } from '../../types'

interface MobileCalendarViewProps {
  fields: Field[]
  allBookings: Map<number, Booking[]>
  onBookingClick: (bookingId: number, fieldId: number) => void
  currentUserId: number | null
}

const WEEKDAY_HEADERS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const HOUR_HEIGHT = 60

const MONTHS_DE = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

function formatTime(iso: string): string {
  return iso.slice(11, 16)
}

function shortFieldName(name: string): string {
  const parts = name.split(' ')
  return parts.length > 1 ? parts[parts.length - 1] : name
}

function BookingTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'match':
      return <span className="text-[10px] flex-shrink-0">&#127942;</span>
    case 'tournament':
      return <span className="text-[10px] flex-shrink-0">&#11088;</span>
    case 'maintenance':
      return <span className="text-[10px] flex-shrink-0">&#128295;</span>
    case 'locked':
      return <span className="text-[10px] flex-shrink-0">&#128274;</span>
    default:
      return null
  }
}

export function MobileCalendarView({
  fields,
  allBookings,
  onBookingClick,
}: MobileCalendarViewProps) {
  const selectedDate = useShellStore((s) => s.selectedDate)
  const setSelectedDate = useShellStore((s) => s.setSelectedDate)
  const setRightPanel = useShellStore((s) => s.setRightPanel)

  const today = toLocalISO(new Date())
  const [monthExpanded, setMonthExpanded] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const viewDate = useMemo(() => new Date(selectedDate + 'T00:00:00'), [selectedDate])
  const viewYear = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth()

  // Week strip: 7 days around selected date
  const weekStart = useMemo(() => getWeekStartForDate(selectedDate), [selectedDate])
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  // Month grid data
  const monthDays = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth])

  // Booking colors per date for dots
  const bookingColorsByDate = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const [, bookings] of allBookings) {
      for (const b of bookings) {
        const date = b.startTime.slice(0, 10)
        const color = b.bookingType === 'maintenance'
          ? '#6b7280'
          : b.bookingType === 'locked'
            ? '#ef4444'
            : (b.teamColor ?? '#6b7280')
        const existing = map.get(date)
        if (existing) {
          if (!existing.includes(color)) existing.push(color)
        } else {
          map.set(date, [color])
        }
      }
    }
    return map
  }, [allBookings])

  // Timeline data for selected day
  const { lanedBookingsByDate } = useTimelineData(
    fields, allBookings, null, [selectedDate], search
  )

  // Fixed 0-24h range
  const startHour = 0
  const endHour = 24
  const hourLabels = useMemo(() => {
    const labels: number[] = []
    for (let h = startHour; h <= endHour; h++) labels.push(h)
    return labels
  }, [])

  const dayBookings = lanedBookingsByDate.get(selectedDate) ?? []
  const totalGridHeight = (endHour - startHour) * HOUR_HEIGHT

  // Now line
  const nowHour = now.getHours() + now.getMinutes() / 60
  const nowTop = (nowHour - startHour) * HOUR_HEIGHT
  const showNowLine = selectedDate === today

  // Auto-scroll to current time on mount and date change
  const scrollRef = useRef<HTMLDivElement>(null)
  const didInitialScroll = useRef(false)
  useEffect(() => {
    didInitialScroll.current = false
  }, [selectedDate])
  useEffect(() => {
    if (didInitialScroll.current) return
    const el = scrollRef.current
    if (!el) return
    // Wait for content to render
    const timer = setTimeout(() => {
      const currentH = new Date().getHours() + new Date().getMinutes() / 60
      const targetHour = selectedDate === today ? Math.max(0, currentH - 1) : 8
      el.scrollTop = targetHour * HOUR_HEIGHT
      didInitialScroll.current = true
    }, 50)
    return () => clearTimeout(timer)
  })

  function handlePrevMonth() {
    const d = new Date(viewYear, viewMonth - 1, 1)
    setSelectedDate(toLocalISO(d))
  }

  function handleNextMonth() {
    const d = new Date(viewYear, viewMonth + 1, 1)
    setSelectedDate(toLocalISO(d))
  }

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const offsetY = e.clientY - rect.top
      const clickedHour = startHour + offsetY / HOUR_HEIGHT
      const snapped = Math.round(clickedHour * 4) / 4
      const hours = Math.floor(snapped)
      const mins = Math.round((snapped - hours) * 60)
      const startTimeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
      const endSnapped = snapped + 1.5
      const endH = Math.floor(endSnapped)
      const endM = Math.round((endSnapped - endH) * 60)
      const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
      setRightPanel('booking-create', {
        prefill: { date: selectedDate, startTime: startTimeStr, endTime: endTimeStr },
      })
    },
    [startHour, selectedDate, setRightPanel]
  )

  return (
    <div className="flex flex-col h-full bg-bg-card">
      {/* Header: month name (tappable) + search + add */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle bg-bg-nav">
        <button
          onClick={() => setMonthExpanded(!monthExpanded)}
          className="flex items-center gap-1 text-brand font-semibold text-base"
        >
          <span className="text-sm">&#8249;</span>
          {MONTHS_DE[viewMonth]} {viewYear}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-elevated transition-colors"
            aria-label="Suchen"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button
            onClick={() => setRightPanel('booking-create', {
              prefill: { date: selectedDate, startTime: '09:00', endTime: '10:30' },
            })}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-brand hover:bg-bg-elevated transition-colors"
            aria-label="Neue Buchung"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search bar (collapsible) */}
      {searchOpen && (
        <div className="px-3 py-2 border-b border-border-subtle bg-bg-nav">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Team, Platz oder Trainer suchen..."
            autoFocus
            className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-1.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          />
        </div>
      )}

      {/* Month grid (collapsible) */}
      {monthExpanded && (
        <div className="border-b border-border-subtle bg-bg-nav">
          <div className="flex items-center justify-between px-4 py-1">
            <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center text-text-secondary">&#8249;</button>
            <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center text-text-secondary">&#8250;</button>
          </div>
          <div className="grid grid-cols-7 px-2">
            {WEEKDAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-text-tertiary uppercase tracking-wider py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 px-2 pb-2">
            {monthDays.map(({ date, inMonth }) => {
              const isSelected = date === selectedDate
              const isToday = date === today
              const colors = bookingColorsByDate.get(date)
              return (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); setMonthExpanded(false) }}
                  className={`relative flex flex-col items-center justify-center h-9 rounded-full transition-colors ${
                    isSelected
                      ? 'bg-brand text-text-on-brand'
                      : isToday
                        ? 'bg-brand/15 text-brand font-semibold'
                        : inMonth
                          ? 'text-text-primary'
                          : 'text-text-tertiary/40'
                  }`}
                >
                  <span className="text-xs leading-none">{parseInt(date.slice(8, 10), 10)}</span>
                  {colors && colors.length > 0 && (
                    <span className="absolute bottom-0.5 flex gap-px">
                      {colors.slice(0, 3).map((c, i) => (
                        <span key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: isSelected ? 'white' : c }} />
                      ))}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Week strip (always visible when month is collapsed) */}
      {!monthExpanded && (
        <div className="flex border-b border-border-subtle bg-bg-nav">
          {weekDates.map((date, i) => {
            const isSelected = date === selectedDate
            const isToday = date === today
            const colors = bookingColorsByDate.get(date)
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className="flex-1 flex flex-col items-center py-2 transition-colors"
              >
                <span className={`text-[10px] font-medium uppercase ${
                  isToday ? 'text-brand' : 'text-text-tertiary'
                }`}>
                  {WEEKDAY_HEADERS[i]}
                </span>
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium mt-0.5 ${
                  isSelected
                    ? 'bg-brand text-text-on-brand'
                    : isToday
                      ? 'text-brand'
                      : 'text-text-primary'
                }`}>
                  {parseInt(date.slice(8, 10), 10)}
                </span>
                {colors && colors.length > 0 && (
                  <span className="flex gap-px mt-0.5">
                    {colors.slice(0, 3).map((c, i) => (
                      <span key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: isSelected ? 'var(--color-brand)' : c }} />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Day label */}
      <div className="px-4 py-1.5 text-xs text-text-secondary">
        {formatFullDateDE(selectedDate)}
      </div>

      {/* Day timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {dayBookings.length === 0 && !search ? (
          <div className="text-center text-sm text-text-tertiary py-12">
            Keine Buchungen an diesem Tag.
          </div>
        ) : (
          <div className="relative" style={{ height: totalGridHeight }} onClick={handleTimelineClick}>
            {/* Hour labels + grid lines */}
            {hourLabels.map((h) => (
              <div key={h} className="absolute left-0 right-0" style={{ top: (h - startHour) * HOUR_HEIGHT }}>
                <div className="absolute left-2 -top-[7px] text-[11px] text-text-tertiary w-10">
                  {h}:00
                </div>
                <div className="absolute left-12 right-0 border-t border-border-subtle" />
              </div>
            ))}

            {/* Now line */}
            {showNowLine && (
              <div className="absolute left-10 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
                <div className="absolute -left-[5px] -top-[4px] w-[9px] h-[9px] rounded-full bg-danger" />
                <div className="h-[2px] bg-danger" />
              </div>
            )}

            {/* Booking cards */}
            {dayBookings.map((b) => {
              const bStart = getHourFraction(b.startTime)
              const bEnd = getHourFraction(b.endTime)
              const top = (bStart - startHour) * HOUR_HEIGHT
              const height = Math.max(24, (bEnd - bStart) * HOUR_HEIGHT)
              const leftPct = (b.lane / b.totalLanes) * 100
              const widthPct = (1 / b.totalLanes) * 100
              const teamColor = b.bookingType === 'maintenance' ? '#6b7280'
                : b.bookingType === 'locked' ? '#ef4444'
                : (b.teamColor ?? '#6b7280')
              const fieldName = fields.find((f) => f.id === b.fieldId)?.name ?? ''

              return (
                <div
                  key={b.id}
                  className="absolute rounded-md px-2 py-1 overflow-hidden z-10 cursor-pointer"
                  style={{
                    top,
                    height,
                    left: `calc(48px + (100% - 52px) * ${leftPct / 100})`,
                    width: `calc((100% - 52px) * ${widthPct / 100} - 2px)`,
                    backgroundColor: teamColor + '25',
                    borderLeft: `3px solid ${teamColor}`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onBookingClick(b.id, b.fieldId)
                    setRightPanel('booking-detail', { bookingId: b.id, fieldId: b.fieldId })
                  }}
                >
                  <div className="text-[11px] font-medium text-text-primary truncate leading-tight">
                    {b.teamName ?? b.title}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-text-secondary leading-tight">
                    <span>{formatTime(b.startTime)} – {formatTime(b.endTime)}</span>
                    <BookingTypeIcon type={b.bookingType} />
                  </div>
                  {height >= 44 && (
                    <div className="text-[10px] text-text-tertiary truncate leading-tight">
                      {shortFieldName(fieldName)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

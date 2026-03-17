import { useMemo, useState, useEffect, useCallback } from 'react'
import { useShellStore } from '../../stores/shellStore'
import { addDays, formatShortDate, getKW, isWeekend, getMonday, toLocalISO } from '../../utils/date'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useTimelineData, getHourFraction } from '../../hooks/useTimelineData'
import { MobileCalendarView } from '../calendar/MobileCalendarView'
import type { Field, Booking } from '../../types'
import type { FieldBooking } from '../../hooks/useTimelineData'

interface WeeklyTimelineProps {
  fields: Field[]
  allBookings: Map<number, Booking[]>
  onBookingClick: (bookingId: number, fieldId: number) => void
  currentUserId: number | null
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const HOUR_HEIGHT = 60
const TIME_COL_WIDTH = 50

function formatTime(iso: string): string {
  return iso.slice(11, 16)
}

function formatHour(h: number): string {
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function shortFieldName(name: string): string {
  const parts = name.split(' ')
  return parts.length > 1 ? parts[parts.length - 1] : name
}

function BookingTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'match':
      return <span className="text-[10px] flex-shrink-0" title="Spiel">&#127942;</span>
    case 'tournament':
      return <span className="text-[10px] flex-shrink-0" title="Turnier">&#11088;</span>
    case 'maintenance':
      return <span className="text-[10px] flex-shrink-0" title="Wartung">&#128295;</span>
    case 'locked':
      return <span className="text-[10px] flex-shrink-0" title="Gesperrt">&#128274;</span>
    default:
      return null
  }
}

function getCardStyles(booking: FieldBooking, teamColor: string) {
  const base = {
    borderLeft: `3px solid ${teamColor}`,
  }
  switch (booking.bookingType) {
    case 'match':
      return { ...base, backgroundColor: teamColor + '45' }
    case 'tournament':
      return { ...base, backgroundColor: teamColor + '35', borderBottom: `2px dashed ${teamColor}` }
    case 'maintenance':
      return { ...base, backgroundColor: '#6b728030', borderLeft: '3px solid #6b7280' }
    case 'locked':
      return { ...base, backgroundColor: '#ef444425', borderLeft: '3px solid #ef4444' }
    default:
      return { ...base, backgroundColor: teamColor + '25' }
  }
}

export function WeeklyTimeline({
  fields,
  allBookings,
  onBookingClick,
  currentUserId,
}: WeeklyTimelineProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')

  if (isMobile) {
    return (
      <MobileCalendarView
        fields={fields}
        allBookings={allBookings}
        onBookingClick={onBookingClick}
        currentUserId={currentUserId}
      />
    )
  }

  return (
    <DesktopTimeline
      fields={fields}
      allBookings={allBookings}
      onBookingClick={onBookingClick}
      currentUserId={currentUserId}
    />
  )
}

function DesktopTimeline({
  fields,
  allBookings,
  onBookingClick,
  currentUserId,
}: WeeklyTimelineProps) {
  const weekStart = useShellStore((s) => s.weekStart)
  const setWeekStart = useShellStore((s) => s.setWeekStart)
  const setRightPanel = useShellStore((s) => s.setRightPanel)
  const activeFieldFilter = useShellStore((s) => s.activeFieldFilter)

  const today = toLocalISO(new Date())
  const [search, setSearch] = useState('')
  const [filterMyTeam, setFilterMyTeam] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [hoverSlot, setHoverSlot] = useState<{ date: string; hour: number } | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const { lanedBookingsByDate, startHour, endHour, hourLabels } = useTimelineData(
    fields, allBookings, activeFieldFilter, weekDates, search
  )

  const totalGridHeight = (endHour - startHour) * HOUR_HEIGHT

  function isMyBooking(b: FieldBooking): boolean {
    return currentUserId != null && b.bookedById === currentUserId
  }

  const todayInWeek = weekDates.includes(today)
  const nowHour = now.getHours() + now.getMinutes() / 60
  const nowTop = (nowHour - startHour) * HOUR_HEIGHT
  const showNowLine = todayInWeek && nowHour >= startHour && nowHour <= endHour

  function handlePrev() {
    setWeekStart(addDays(weekStart, -7))
  }

  function handleNext() {
    setWeekStart(addDays(weekStart, 7))
  }

  function handleToday() {
    setWeekStart(getMonday(new Date()))
  }

  const handleDayColumnClick = useCallback(
    (date: string, e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const offsetY = e.clientY - rect.top
      const clickedHour = startHour + offsetY / HOUR_HEIGHT
      const snapped = Math.round(clickedHour * 4) / 4
      const startTimeStr = formatHour(snapped)
      const endTimeStr = formatHour(snapped + 1.5)
      setRightPanel('booking-create', {
        prefill: { date, startTime: startTimeStr, endTime: endTimeStr },
      })
    },
    [startHour, setRightPanel]
  )

  const handleDayColumnMouseMove = useCallback(
    (date: string, e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const offsetY = e.clientY - rect.top
      const clickedHour = startHour + offsetY / HOUR_HEIGHT
      const snapped = Math.round(clickedHour * 4) / 4
      setHoverSlot({ date, hour: snapped })
    },
    [startHour]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 md:py-0 md:h-[46px] flex-shrink-0 border-b border-border-subtle bg-bg-nav">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen..."
          className="bg-bg-input border border-border-control rounded-lg px-3 py-1.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 w-64"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm rounded-lg bg-bg-elevated text-text-secondary hover:bg-border-control transition-colors"
          >
            Heute
          </button>
          <button
            onClick={() => setFilterMyTeam(!filterMyTeam)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterMyTeam
                ? 'bg-brand/15 text-brand border border-brand/30'
                : 'bg-bg-elevated text-text-secondary hover:bg-border-control'
            }`}
          >
            Mein Team
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setRightPanel('booking-create')}
            className="xl:hidden px-3 py-1.5 text-sm rounded-lg bg-brand text-text-on-brand hover:bg-brand-hover transition-colors font-medium"
          >
            + Buchung
          </button>
          <button
            onClick={handlePrev}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-elevated text-text-secondary hover:bg-border-control transition-colors"
            aria-label="Vorherige Woche"
          >
            &#8249;
          </button>
          <span className="text-sm text-text-secondary font-medium min-w-[60px] text-center">
            KW {getKW(weekStart)}
          </span>
          <button
            onClick={handleNext}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-elevated text-text-secondary hover:bg-border-control transition-colors"
            aria-label="Naechste Woche"
          >
            &#8250;
          </button>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0 bg-bg-card">
            {/* Sticky day headers */}
            <div className="flex border-b border-border-subtle sticky top-0 z-30 bg-bg-card">
              <div
                className="flex-shrink-0 px-2 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider"
                style={{ width: TIME_COL_WIDTH }}
              >
                Zeit
              </div>
              {weekDates.map((date, i) => (
                <div
                  key={date}
                  className={`flex-1 min-w-0 px-3 py-3 text-center border-l border-border-subtle ${
                    date === today ? 'bg-brand/5' : isWeekend(date) ? 'bg-brand/[0.04]' : ''
                  }`}
                >
                  <div className={`text-sm font-medium tracking-tight ${date === today ? 'text-brand' : 'text-text-primary'}`}>
                    {WEEKDAYS[i]}
                  </div>
                  <div className={`text-xs ${date === today ? 'text-brand/70' : 'text-text-tertiary'}`}>
                    {formatShortDate(date)}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid body */}
            <div className="flex relative" style={{ height: totalGridHeight }}>
              {/* Time column */}
              <div className="flex-shrink-0 relative" style={{ width: TIME_COL_WIDTH }}>
                {hourLabels.map((h) => (
                  <div
                    key={h}
                    className="absolute right-2 text-[11px] text-text-tertiary"
                    style={{ top: (h - startHour) * HOUR_HEIGHT - 7 }}
                  >
                    {h}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDates.map((date) => {
                const dayBookings = lanedBookingsByDate.get(date) ?? []
                const isTodayCol = date === today
                const isHoveringThisCol = hoverSlot?.date === date

                return (
                  <div
                    key={date}
                    className={`flex-1 min-w-0 relative border-l border-border-subtle cursor-pointer ${
                      isTodayCol ? 'bg-brand/[0.03]' : isWeekend(date) ? 'bg-brand/[0.04]' : ''
                    }`}
                    onClick={(e) => handleDayColumnClick(date, e)}
                    onMouseMove={(e) => handleDayColumnMouseMove(date, e)}
                    onMouseLeave={() => setHoverSlot(null)}
                  >
                    {/* Hour grid lines */}
                    {hourLabels.map((h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-border-subtle"
                        style={{ top: (h - startHour) * HOUR_HEIGHT }}
                      />
                    ))}

                    {/* Hover ghost */}
                    {isHoveringThisCol && hoverSlot && (
                      <div
                        className="absolute left-1 right-1 bg-brand/10 border border-dashed border-brand/30 rounded z-5 pointer-events-none"
                        style={{
                          top: (hoverSlot.hour - startHour) * HOUR_HEIGHT,
                          height: 1.5 * HOUR_HEIGHT,
                        }}
                      />
                    )}

                    {/* Now-line */}
                    {isTodayCol && showNowLine && (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{ top: nowTop }}
                      >
                        <div className="absolute -left-[5px] -top-[4px] w-[9px] h-[9px] rounded-full bg-danger" />
                        <div className="h-[2px] bg-danger" />
                      </div>
                    )}

                    {/* Event cards */}
                    {dayBookings.map((b) => {
                      const bStart = getHourFraction(b.startTime)
                      const bEnd = getHourFraction(b.endTime)
                      const top = (bStart - startHour) * HOUR_HEIGHT
                      const height = Math.max(20, (bEnd - bStart) * HOUR_HEIGHT)
                      const leftPct = (b.lane / b.totalLanes) * 100
                      const widthPct = (1 / b.totalLanes) * 100

                      const teamColor =
                        b.bookingType === 'maintenance'
                          ? '#6b7280'
                          : b.bookingType === 'locked'
                            ? '#ef4444'
                            : (b.teamColor ?? '#6b7280')
                      const dimmed = filterMyTeam && currentUserId && !isMyBooking(b)
                      const partialZones =
                        b.fieldSectionCount > 0 && b.sections.length > 0 && b.sections.length < b.fieldSectionCount
                      const fieldName = fields.find((f) => f.id === b.fieldId)?.name ?? ''
                      const shortField = shortFieldName(fieldName)
                      const showThirdRow = height >= 38

                      return (
                        <div
                          key={b.id}
                          className={`absolute rounded-md px-1.5 py-0.5 cursor-pointer hover:brightness-110 hover:scale-[1.02] hover:z-30 transition-all duration-150 overflow-hidden z-10 ${
                            dimmed ? 'opacity-30' : ''
                          }`}
                          style={{
                            top,
                            height,
                            left: `calc(${leftPct}% + 1px)`,
                            width: `calc(${widthPct}% - 2px)`,
                            ...getCardStyles(b, teamColor),
                          }}
                          title={`${b.teamName ?? 'Sonstige'} — ${formatTime(b.startTime)}–${formatTime(b.endTime)}\n${fieldName}\n${b.bookedByName}${partialZones ? `\n${b.sections.length}/${b.fieldSectionCount} Zonen` : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            onBookingClick(b.id, b.fieldId)
                            setRightPanel('booking-detail', { bookingId: b.id, fieldId: b.fieldId })
                          }}
                        >
                          <div className="text-[10px] text-text-secondary leading-tight">
                            {formatTime(b.startTime)}
                          </div>
                          <div className="flex items-center gap-0.5">
                            <span className="text-[11px] font-medium text-text-primary truncate leading-tight">
                              {b.teamName ?? b.title}
                            </span>
                            {partialZones && (
                              <span className="text-[9px] bg-bg-elevated/80 rounded px-0.5 flex-shrink-0 ml-auto">
                                {b.sections.length}/{b.fieldSectionCount}
                              </span>
                            )}
                          </div>
                          {showThirdRow && (
                            <div className="flex items-center gap-0.5 text-[9px] text-text-tertiary leading-tight">
                              <BookingTypeIcon type={b.bookingType} />
                              <span className="truncate">{shortField}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

          {/* Empty state */}
          {fields.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-text-tertiary">
              Keine Plaetze konfiguriert.
            </div>
          )}

          {/* Legend — inside scroll container */}
          <div className="flex flex-wrap items-center gap-4 px-4 py-2 text-[11px] text-text-tertiary border-t border-border-subtle">
            <span className="font-medium text-text-secondary">Typ:</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm border-l-[3px] border-brand bg-brand/25" />
              Training
            </span>
            <span className="flex items-center gap-1">
              &#127942; Spiel
            </span>
            <span className="flex items-center gap-1">
              &#11088; Turnier
            </span>
            <span className="flex items-center gap-1">
              &#128295; Wartung
            </span>
            <span className="mx-2 text-border-subtle">|</span>
            <span>
              <span className="bg-bg-elevated/80 rounded px-1 text-[10px]">2/4</span> = Teilbelegung
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

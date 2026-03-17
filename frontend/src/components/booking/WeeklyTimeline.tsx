import { useMemo, useState, useEffect, useCallback } from 'react'
import { useShellStore } from '../../stores/shellStore'
import { addDays, formatShortDate, getKW, isWeekend, getMonday, toLocalISO } from '../../utils/date'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { Field, Booking } from '../../types'

interface WeeklyTimelineProps {
  fields: Field[]
  allBookings: Map<number, Booking[]>
  onBookingClick: (bookingId: number, fieldId: number) => void
  currentUserId: number | null
}

interface FieldBooking extends Booking {
  fieldId: number
  fieldSectionCount: number
}

interface LanedBooking extends FieldBooking {
  lane: number
  totalLanes: number
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const HOUR_HEIGHT = 60
const TIME_COL_WIDTH = 50
const DEFAULT_START = 15
const DEFAULT_END = 21

function formatTime(iso: string): string {
  return iso.slice(11, 16)
}

function getHourFraction(iso: string): number {
  const h = parseInt(iso.slice(11, 13), 10)
  const m = parseInt(iso.slice(14, 16), 10)
  return h + m / 60
}

function formatHour(h: number): string {
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function computeTimeRange(bookings: FieldBooking[], weekDates: string[]): [number, number] {
  let min = DEFAULT_START
  let max = DEFAULT_END
  const weekSet = new Set(weekDates)
  for (const b of bookings) {
    const day = b.startTime.slice(0, 10)
    if (!weekSet.has(day)) continue
    const s = getHourFraction(b.startTime)
    const e = getHourFraction(b.endTime)
    if (s < min) min = s
    if (e > max) max = e
  }
  return [Math.floor(min) - 1, Math.ceil(max) + 1]
}

function assignLanes(dayBookings: FieldBooking[]): LanedBooking[] {
  if (dayBookings.length === 0) return []

  const sorted = [...dayBookings].sort((a, b) => a.startTime.localeCompare(b.startTime))

  const laneEnds: number[] = []
  const assignments: { booking: FieldBooking; lane: number }[] = []

  for (const b of sorted) {
    const start = getHourFraction(b.startTime)
    const end = getHourFraction(b.endTime)
    let assignedLane = -1
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i] <= start) {
        assignedLane = i
        break
      }
    }
    if (assignedLane === -1) {
      assignedLane = laneEnds.length
      laneEnds.push(end)
    } else {
      laneEnds[assignedLane] = end
    }
    assignments.push({ booking: b, lane: assignedLane })
  }

  const n = assignments.length
  const groupId = new Array<number>(n)
  for (let i = 0; i < n; i++) groupId[i] = i

  function find(x: number): number {
    while (groupId[x] !== x) {
      groupId[x] = groupId[groupId[x]]
      x = groupId[x]
    }
    return x
  }
  function union(a: number, b: number) {
    const ra = find(a), rb = find(b)
    if (ra !== rb) groupId[ra] = rb
  }

  for (let i = 0; i < n; i++) {
    const endI = getHourFraction(assignments[i].booking.endTime)
    for (let j = i + 1; j < n; j++) {
      const startJ = getHourFraction(assignments[j].booking.startTime)
      if (startJ >= endI) break
      union(i, j)
    }
  }

  const groupMaxLane = new Map<number, number>()
  for (let i = 0; i < n; i++) {
    const g = find(i)
    const current = groupMaxLane.get(g) ?? 0
    groupMaxLane.set(g, Math.max(current, assignments[i].lane + 1))
  }

  return assignments.map((a, i) => ({
    ...a.booking,
    lane: a.lane,
    totalLanes: groupMaxLane.get(find(i)) ?? 1,
  }))
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
  const weekStart = useShellStore((s) => s.weekStart)
  const setWeekStart = useShellStore((s) => s.setWeekStart)
  const setRightPanel = useShellStore((s) => s.setRightPanel)
  const activeFieldFilter = useShellStore((s) => s.activeFieldFilter)

  const isMobile = useMediaQuery('(max-width: 767px)')

  const today = toLocalISO(new Date())
  const [search, setSearch] = useState('')
  const [filterMyTeam, setFilterMyTeam] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [hoverSlot, setHoverSlot] = useState<{ date: string; hour: number } | null>(null)

  // Mobile: selected single day index (0-6)
  const todayDayIndex = useMemo(() => {
    const d = new Date()
    return (d.getDay() + 6) % 7 // Mon=0 .. Sun=6
  }, [])
  const [selectedDay, setSelectedDay] = useState(todayDayIndex)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  // Which dates to show in the timeline
  const visibleDates = isMobile ? [weekDates[selectedDay]] : weekDates

  const allFieldBookings = useMemo(() => {
    const result: FieldBooking[] = []
    for (const [fieldId, bookings] of allBookings) {
      if (activeFieldFilter !== null && fieldId !== activeFieldFilter) continue
      const field = fields.find((f) => f.id === fieldId)
      const sectionCount = field?.sections.length ?? 0
      for (const b of bookings) {
        result.push({ ...b, fieldId, fieldSectionCount: sectionCount })
      }
    }
    return result
  }, [allBookings, fields, activeFieldFilter])

  const matchesSearch = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    return (b: FieldBooking): boolean => {
      const fieldName = fields.find((f) => f.id === b.fieldId)?.name ?? ''
      return (
        (b.teamName?.toLowerCase().includes(q) ?? false) ||
        fieldName.toLowerCase().includes(q) ||
        (b.bookedByName?.toLowerCase().includes(q) ?? false)
      )
    }
  }, [search, fields])

  function isMyBooking(b: FieldBooking): boolean {
    return currentUserId != null && b.bookedById === currentUserId
  }

  const timeRange = useMemo(
    () => computeTimeRange(allFieldBookings, weekDates),
    [allFieldBookings, weekDates]
  )
  const [startHour, endHour] = timeRange
  const totalGridHeight = (endHour - startHour) * HOUR_HEIGHT

  const hourLabels = useMemo(() => {
    const labels: number[] = []
    for (let h = startHour; h <= endHour; h++) labels.push(h)
    return labels
  }, [startHour, endHour])

  const lanedBookingsByDate = useMemo(() => {
    const map = new Map<string, LanedBooking[]>()
    const weekSet = new Set(weekDates)

    const byDate = new Map<string, FieldBooking[]>()
    for (const b of allFieldBookings) {
      const day = b.startTime.slice(0, 10)
      if (!weekSet.has(day)) continue
      if (matchesSearch && !matchesSearch(b)) continue
      const arr = byDate.get(day)
      if (arr) arr.push(b)
      else byDate.set(day, [b])
    }

    for (const [date, bookings] of byDate) {
      map.set(date, assignLanes(bookings))
    }

    return map
  }, [allFieldBookings, weekDates, matchesSearch])

  const todayInWeek = weekDates.includes(today)
  const nowHour = now.getHours() + now.getMinutes() / 60
  const nowTop = (nowHour - startHour) * HOUR_HEIGHT
  const showNowLine = todayInWeek && nowHour >= startHour && nowHour <= endHour

  function handlePrev() {
    if (isMobile) {
      if (selectedDay > 0) {
        setSelectedDay(selectedDay - 1)
      } else {
        setWeekStart(addDays(weekStart, -7))
        setSelectedDay(6)
      }
    } else {
      setWeekStart(addDays(weekStart, -7))
    }
  }

  function handleNext() {
    if (isMobile) {
      if (selectedDay < 6) {
        setSelectedDay(selectedDay + 1)
      } else {
        setWeekStart(addDays(weekStart, 7))
        setSelectedDay(0)
      }
    } else {
      setWeekStart(addDays(weekStart, 7))
    }
  }

  function handleToday() {
    setWeekStart(getMonday(new Date()))
    setSelectedDay(todayDayIndex)
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
      <div className="flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-0 md:h-[46px] flex-shrink-0 border-b border-border-subtle bg-bg-nav">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen..."
          className="bg-bg-input border border-border-control rounded-lg px-3 py-1.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 w-full md:w-64"
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
            aria-label={isMobile ? 'Vorheriger Tag' : 'Vorherige Woche'}
          >
            &#8249;
          </button>
          <span className="text-sm text-text-secondary font-medium min-w-[60px] text-center">
            KW {getKW(weekStart)}
          </span>
          <button
            onClick={handleNext}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-elevated text-text-secondary hover:bg-border-control transition-colors"
            aria-label={isMobile ? 'Naechster Tag' : 'Naechste Woche'}
          >
            &#8250;
          </button>
        </div>
      </div>

      {/* Mobile day tabs */}
      {isMobile && (
        <div className="flex border-b border-border-subtle bg-bg-nav overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {weekDates.map((date, i) => (
            <button
              key={date}
              onClick={() => setSelectedDay(i)}
              className={`flex-1 min-w-[48px] px-2 py-2 text-center transition-colors ${
                i === selectedDay
                  ? 'border-b-2 border-brand text-brand'
                  : date === today
                    ? 'text-brand/70'
                    : 'text-text-tertiary'
              }`}
            >
              <div className="text-xs font-medium">{WEEKDAYS[i]}</div>
              <div className="text-[10px]">{formatShortDate(date).slice(0, 5)}</div>
            </button>
          ))}
        </div>
      )}

      {/* Timeline Grid */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0 bg-bg-card">
            {/* Sticky day headers — desktop only */}
            {!isMobile && (
              <div className="flex border-b border-border-subtle sticky top-0 z-30 bg-bg-card">
                <div
                  className="flex-shrink-0 px-2 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider"
                  style={{ width: TIME_COL_WIDTH }}
                >
                  Zeit
                </div>
                {visibleDates.map((date, i) => {
                  const dayIndex = isMobile ? selectedDay : i
                  return (
                    <div
                      key={date}
                      className={`flex-1 min-w-0 px-3 py-3 text-center border-l border-border-subtle ${
                        date === today ? 'bg-brand/5' : isWeekend(date) ? 'bg-brand/[0.04]' : ''
                      }`}
                    >
                      <div className={`text-sm font-medium tracking-tight ${date === today ? 'text-brand' : 'text-text-primary'}`}>
                        {WEEKDAYS[dayIndex]}
                      </div>
                      <div className={`text-xs ${date === today ? 'text-brand/70' : 'text-text-tertiary'}`}>
                        {formatShortDate(date)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

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
              {visibleDates.map((date) => {
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

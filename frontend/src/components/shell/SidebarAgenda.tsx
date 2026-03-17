import type { Field, Booking } from '../../types'
import { useShellStore } from '../../stores/shellStore'
import { getDayLabel, formatShortDate, addDays, toLocalISO } from '../../utils/date'
import { useMemo } from 'react'

interface SidebarAgendaProps {
  allBookings: Map<number, Booking[]>
  fields: Field[]
  filterMyTeam: boolean
  currentUserId: number | null
}

function formatTime(iso: string): string {
  return iso.slice(11, 16)
}

function shortFieldName(name: string): string {
  const parts = name.split(' ')
  return parts.length > 1 ? parts[parts.length - 1] : name
}

const TYPE_ICONS: Record<string, string> = {
  match: '\uD83C\uDFC6',
  tournament: '\u2B50',
  maintenance: '\uD83D\uDD27',
  locked: '\uD83D\uDD12',
}

export function SidebarAgenda({ allBookings, fields, filterMyTeam, currentUserId }: SidebarAgendaProps) {
  const weekStart = useShellStore((s) => s.weekStart)
  const setRightPanel = useShellStore((s) => s.setRightPanel)
  const today = toLocalISO(new Date())

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, (Booking & { fieldId: number })[]>()
    const weekSet = new Set(weekDates)

    for (const [fieldId, bookings] of allBookings) {
      for (const b of bookings) {
        const day = b.startTime.slice(0, 10)
        if (!weekSet.has(day)) continue
        const arr = map.get(day)
        const entry = { ...b, fieldId }
        if (arr) arr.push(entry)
        else map.set(day, [entry])
      }
    }

    for (const [, arr] of map) {
      arr.sort((a, b) => a.startTime.localeCompare(b.startTime))
    }

    return map
  }, [allBookings, weekDates])

  return (
    <div className="flex-1 space-y-1">
      {weekDates.map((date) => {
        const dayBookings = bookingsByDate.get(date) ?? []
        const isToday = date === today
        const label = getDayLabel(date, today)

        return (
          <div key={date}>
            {/* Day header */}
            <div className={`flex items-center gap-2 py-1.5 ${isToday ? '' : ''}`}>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                isToday ? 'text-brand' : 'text-text-secondary'
              }`}>
                {label}
              </span>
              <span className="text-[11px] text-text-tertiary">{formatShortDate(date)}</span>
              {dayBookings.length > 0 && (
                <span className="text-[10px] text-text-muted ml-auto">{dayBookings.length}</span>
              )}
            </div>

            {/* Bookings */}
            {dayBookings.length === 0 ? (
              <div className="text-[11px] text-text-muted py-1 pl-2 border-l-2 border-border-subtle ml-1">
                Keine Buchungen
              </div>
            ) : (
              <div className="space-y-1">
                {dayBookings.map((b) => {
                  const teamColor =
                    b.bookingType === 'maintenance'
                      ? '#6b7280'
                      : b.bookingType === 'locked'
                        ? '#ef4444'
                        : (b.teamColor ?? '#6b7280')
                  const dimmed = filterMyTeam && currentUserId != null && b.bookedById !== currentUserId
                  const fieldName = fields.find((f) => f.id === b.fieldId)?.name ?? ''
                  const shortField = shortFieldName(fieldName)
                  const typeIcon = TYPE_ICONS[b.bookingType]

                  return (
                    <div
                      key={b.id}
                      className={`flex items-center gap-2.5 py-1.5 px-2 rounded-md cursor-pointer
                        hover:bg-bg-elevated transition-colors ml-1 border-l-2 ${
                        dimmed ? 'opacity-30' : ''
                      }`}
                      style={{ borderLeftColor: teamColor }}
                      onClick={() => setRightPanel('booking-detail', { bookingId: b.id, fieldId: b.fieldId })}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-medium text-text-primary truncate">
                          {b.teamName ?? b.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                          <span>{formatTime(b.startTime)} – {formatTime(b.endTime)}</span>
                          <span className="text-text-muted">·</span>
                          <span className="truncate">{shortField}</span>
                        </div>
                      </div>
                      {typeIcon && (
                        <span className="text-[11px] flex-shrink-0" title={b.bookingType}>{typeIcon}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

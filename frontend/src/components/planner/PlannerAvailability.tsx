import { useMemo } from 'react'
import type { Field, Booking } from '../../types'
import type { DraftBooking } from '../../stores/plannerStore'
import { computeDraftConflicts, type ConflictInfo } from '../../utils/conflicts'
import { getHourFraction } from '../../hooks/useTimelineData'

interface PlannerAvailabilityProps {
  fields: Field[]
  allBookings: Map<number, Booking[]>
  drafts: DraftBooking[]
  activeDate: string
  onSlotClick: (fieldId: number, date: string, startTime: string, endTime: string) => void
}

export function useDraftConflicts(
  drafts: DraftBooking[],
  allBookings: Map<number, Booking[]>,
): Map<string, ConflictInfo> {
  return useMemo(() => computeDraftConflicts(drafts, allBookings), [drafts, allBookings])
}

export function PlannerAvailability({
  fields,
  allBookings,
  drafts,
  activeDate,
  onSlotClick,
}: PlannerAvailabilityProps) {
  const conflicts = useDraftConflicts(drafts, allBookings)

  const { startHour, endHour } = useMemo(() => {
    let min = 14
    let max = 21
    for (const [, bookings] of allBookings) {
      for (const b of bookings) {
        if (b.startTime.slice(0, 10) !== activeDate) continue
        const s = getHourFraction(b.startTime)
        const e = getHourFraction(b.endTime)
        if (s < min) min = s
        if (e > max) max = e
      }
    }
    for (const draft of drafts) {
      for (const occ of draft.occurrences) {
        if (occ.start.slice(0, 10) !== activeDate) continue
        const s = getHourFraction(occ.start)
        const e = getHourFraction(occ.end)
        if (s < min) min = s
        if (e > max) max = e
      }
    }
    return { startHour: Math.floor(min), endHour: Math.ceil(max) }
  }, [allBookings, drafts, activeDate])

  const hours = useMemo(() => {
    const h: number[] = []
    for (let i = startHour; i <= endHour; i++) h.push(i)
    return h
  }, [startHour, endHour])

  const totalSpan = endHour - startHour

  const dayBookingCount = useMemo(() => {
    let count = 0
    for (const [, bookings] of allBookings) {
      count += bookings.filter((b) => b.startTime.slice(0, 10) === activeDate).length
    }
    return count
  }, [allBookings, activeDate])

  return (
    <div className="h-full flex flex-col bg-bg-base">
      {/* Hour ruler */}
      <div className="flex-shrink-0 flex bg-bg-card border-b border-border-subtle">
        <div className="flex-shrink-0 w-[180px]" />
        <div className="flex-1 relative pr-4" style={{ height: '36px' }}>
          {hours.map((h) => {
            const left = ((h - startHour) / totalSpan) * 100
            if (left > 97) return null
            return (
              <div
                key={h}
                className="absolute top-0 bottom-0 flex flex-col items-center"
                style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
              >
                <span className="text-xs tabular-nums mt-2 font-semibold text-text-secondary">
                  {h}
                  <span className="text-text-tertiary font-normal text-[10px]">:00</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Field rows */}
      <div className="flex-1 overflow-y-auto">
        {fields.map((field, fieldIdx) => {
          const fieldBookings = (allBookings.get(field.id) ?? []).filter(
            (b) => b.startTime.slice(0, 10) === activeDate,
          )
          const fieldDrafts = drafts.filter(
            (dr) =>
              dr.fieldId === field.id &&
              dr.status !== 'success' &&
              dr.occurrences.some((o) => o.start.slice(0, 10) === activeDate),
          )
          const isEven = fieldIdx % 2 === 0

          return (
            <div
              key={field.id}
              className={`flex border-b border-border-subtle transition-colors ${
                isEven ? 'bg-bg-card' : 'bg-bg-base'
              }`}
              style={{ minHeight: '80px' }}
            >
              {/* Field label */}
              <div className="flex-shrink-0 w-[180px] flex flex-col justify-center px-5 border-r border-border-subtle">
                <span className="text-sm font-semibold text-text-primary">
                  {field.name}
                </span>
                <span className="text-[11px] text-text-tertiary mt-0.5">
                  {fieldBookings.length} Buchung{fieldBookings.length !== 1 ? 'en' : ''}
                </span>
              </div>

              {/* Timeline */}
              <div
                className="flex-1 relative cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const frac = x / rect.width
                  const hour = startHour + frac * totalSpan
                  const snapped = Math.floor(hour * 4) / 4
                  const startH = Math.floor(snapped)
                  const startM = Math.round((snapped - startH) * 60)
                  const endSnapped = snapped + 1.5
                  const endH = Math.floor(endSnapped)
                  const endM = Math.round((endSnapped - endH) * 60)
                  onSlotClick(
                    field.id,
                    activeDate,
                    `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
                    `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
                  )
                }}
              >
                {/* Hour grid lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0"
                    style={{ left: `${((h - startHour) / totalSpan) * 100}%` }}
                  >
                    <div className="w-px h-full bg-border-subtle/60" />
                  </div>
                ))}

                {/* Half-hour lines */}
                {hours.slice(0, -1).map((h) => (
                  <div
                    key={`half-${h}`}
                    className="absolute top-0 bottom-0"
                    style={{ left: `${((h + 0.5 - startHour) / totalSpan) * 100}%` }}
                  >
                    <div className="w-px h-full bg-border-subtle/25" />
                  </div>
                ))}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-brand/0 group-hover:bg-brand/[0.03] transition-colors pointer-events-none" />

                {/* Existing bookings */}
                {fieldBookings.map((b) => (
                  <BookingBlock
                    key={b.id}
                    booking={b}
                    startHour={startHour}
                    totalSpan={totalSpan}
                  />
                ))}

                {/* Draft overlays */}
                {fieldDrafts.map((dr) => {
                  const occ = dr.occurrences.find((o) => o.start.slice(0, 10) === activeDate)
                  if (!occ) return null
                  const conflict = conflicts.get(dr.draftId)
                  return (
                    <DraftBlock
                      key={`${dr.draftId}-${activeDate}`}
                      draft={dr}
                      occurrence={occ}
                      hasConflict={conflict?.hasConflict ?? false}
                      startHour={startHour}
                      totalSpan={totalSpan}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Summary footer */}
        <div className="flex items-center justify-between px-5 py-3 text-xs text-text-tertiary border-b border-border-subtle">
          <span>{fields.length} Plaetze</span>
          <span>{dayBookingCount} Buchungen an diesem Tag</span>
        </div>

        {fields.length === 0 && (
          <div className="flex items-center justify-center h-48 text-sm text-text-tertiary">
            Keine Plaetze vorhanden
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Booking Block ── */
function BookingBlock({
  booking,
  startHour,
  totalSpan,
}: {
  booking: Booking
  startHour: number
  totalSpan: number
}) {
  const bStart = getHourFraction(booking.startTime)
  const bEnd = getHourFraction(booking.endTime)
  const left = ((bStart - startHour) / totalSpan) * 100
  const width = ((bEnd - bStart) / totalSpan) * 100
  const color = booking.teamColor ?? '#6b7280'

  return (
    <div
      className="absolute top-2 bottom-2 rounded-lg overflow-hidden pointer-events-none"
      style={{
        left: `${left}%`,
        width: `${width}%`,
        backgroundColor: color,
        boxShadow: `0 2px 8px ${color}40, 0 1px 2px ${color}20`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
      <div className="relative h-full flex flex-col justify-center px-3 min-w-0">
        <div className="text-sm font-bold text-white leading-tight truncate drop-shadow-sm">
          {booking.teamName ?? booking.title}
        </div>
        <div className="text-[11px] text-white/75 leading-tight mt-0.5 tabular-nums">
          {booking.startTime.slice(11, 16)} – {booking.endTime.slice(11, 16)}
        </div>
      </div>
    </div>
  )
}

/* ── Draft Block ── */
function DraftBlock({
  draft,
  occurrence,
  hasConflict,
  startHour,
  totalSpan,
}: {
  draft: DraftBooking
  occurrence: { start: string; end: string }
  hasConflict: boolean
  startHour: number
  totalSpan: number
}) {
  const bStart = getHourFraction(occurrence.start)
  const bEnd = getHourFraction(occurrence.end)
  const left = ((bStart - startHour) / totalSpan) * 100
  const width = ((bEnd - bStart) / totalSpan) * 100

  return (
    <div
      className={`absolute top-2 bottom-2 rounded-lg overflow-hidden pointer-events-none border-2 border-dashed backdrop-blur-sm ${
        hasConflict
          ? 'border-danger/70 bg-danger/10'
          : 'border-brand/60 bg-brand/10'
      }`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
      }}
    >
      <div className="h-full flex flex-col justify-center px-3 min-w-0">
        <div className={`text-sm font-bold leading-tight truncate ${hasConflict ? 'text-danger' : 'text-brand'}`}>
          {hasConflict && '\u26a0 '}
          {draft.teamName ?? draft.title}
        </div>
        <div className={`text-[11px] leading-tight mt-0.5 tabular-nums ${hasConflict ? 'text-danger/60' : 'text-brand/60'}`}>
          {occurrence.start.slice(11, 16)} – {occurrence.end.slice(11, 16)} · Entwurf
        </div>
      </div>
    </div>
  )
}

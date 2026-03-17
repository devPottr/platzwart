import { useMemo } from 'react'
import type { Field, Booking } from '../../types'
import type { DraftBooking } from '../../stores/plannerStore'

interface MobileDayOverviewProps {
  fields: Field[]
  allBookings: Map<number, Booking[]>
  drafts: DraftBooking[]
  activeDate: string
  onSlotClick: (fieldId: number, startTime: string, endTime: string) => void
  onFabClick: () => void
}

interface TimeSlot {
  type: 'booking' | 'draft' | 'free'
  startTime: string
  endTime: string
  booking?: Booking
  draft?: DraftBooking
}

const DAY_START = 8
const DAY_END = 22
const MIN_GAP_MINUTES = 30

function findFreeSlots(bookings: Booking[], drafts: DraftBooking[], activeDate: string): TimeSlot[] {
  // Collect all occupied intervals for this field/day
  const occupied: Array<{ start: number; end: number; booking?: Booking; draft?: DraftBooking }> = []

  for (const b of bookings) {
    if (b.startTime.slice(0, 10) !== activeDate) continue
    const startMin = parseTimeToMinutes(b.startTime.slice(11, 16))
    const endMin = parseTimeToMinutes(b.endTime.slice(11, 16))
    occupied.push({ start: startMin, end: endMin, booking: b })
  }

  for (const d of drafts) {
    if (d.status === 'success') continue
    for (const occ of d.occurrences) {
      if (occ.start.slice(0, 10) !== activeDate) continue
      const startMin = parseTimeToMinutes(occ.start.slice(11, 16))
      const endMin = parseTimeToMinutes(occ.end.slice(11, 16))
      occupied.push({ start: startMin, end: endMin, draft: d })
    }
  }

  occupied.sort((a, b) => a.start - b.start)

  const slots: TimeSlot[] = []
  let cursor = DAY_START * 60

  for (const item of occupied) {
    // Free gap before this booking?
    if (item.start - cursor >= MIN_GAP_MINUTES) {
      slots.push({
        type: 'free',
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(item.start),
      })
    }

    // The booking/draft itself
    if (item.booking) {
      slots.push({
        type: 'booking',
        startTime: item.booking.startTime.slice(11, 16),
        endTime: item.booking.endTime.slice(11, 16),
        booking: item.booking,
      })
    } else if (item.draft) {
      const occ = item.draft.occurrences.find((o) => o.start.slice(0, 10) === activeDate)
      if (occ) {
        slots.push({
          type: 'draft',
          startTime: occ.start.slice(11, 16),
          endTime: occ.end.slice(11, 16),
          draft: item.draft,
        })
      }
    }

    cursor = Math.max(cursor, item.end)
  }

  // Trailing free slot
  const dayEnd = DAY_END * 60
  if (dayEnd - cursor >= MIN_GAP_MINUTES) {
    slots.push({
      type: 'free',
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(dayEnd),
    })
  }

  return slots
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function MobileDayOverview({
  fields,
  allBookings,
  drafts,
  activeDate,
  onSlotClick,
  onFabClick,
}: MobileDayOverviewProps) {
  const fieldSlots = useMemo(() => {
    return fields.map((field) => {
      const fieldBookings = allBookings.get(field.id) ?? []
      const fieldDrafts = drafts.filter((d) => d.fieldId === field.id)
      const slots = findFreeSlots(fieldBookings, fieldDrafts, activeDate)
      return { field, slots }
    })
  }, [fields, allBookings, drafts, activeDate])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {fieldSlots.map(({ field, slots }) => (
          <div key={field.id} className="rounded-xl border border-border-subtle bg-bg-card overflow-hidden">
            <div className="px-3 py-2 bg-bg-elevated border-b border-border-subtle">
              <span className="text-sm font-semibold text-text-primary">{field.name}</span>
            </div>

            {slots.length === 0 ? (
              <div className="px-3 py-4 text-sm text-text-tertiary text-center">
                Keine Buchungen an diesem Tag
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {slots.map((slot, idx) => {
                  if (slot.type === 'booking' && slot.booking) {
                    const b = slot.booking
                    return (
                      <div key={`b-${b.id}`} className="flex items-center gap-3 px-3 py-2.5">
                        <div
                          className="w-1 self-stretch rounded-full flex-shrink-0"
                          style={{ backgroundColor: b.teamColor ?? '#6b7280' }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-text-primary truncate block">
                            {b.teamName ?? b.title}
                          </span>
                          <span className="text-xs text-text-tertiary tabular-nums">
                            {slot.startTime}–{slot.endTime}
                          </span>
                        </div>
                      </div>
                    )
                  }

                  if (slot.type === 'draft' && slot.draft) {
                    const d = slot.draft
                    return (
                      <div key={`d-${d.draftId}-${idx}`} className="flex items-center gap-3 px-3 py-2.5 border-l-2 border-dashed border-brand/50">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-brand truncate block">
                            {d.teamName ?? d.title}
                          </span>
                          <span className="text-xs text-brand/60 tabular-nums">
                            {slot.startTime}–{slot.endTime} · Entwurf
                          </span>
                        </div>
                      </div>
                    )
                  }

                  // Free slot
                  return (
                    <button
                      key={`f-${idx}`}
                      onClick={() => onSlotClick(field.id, slot.startTime, slot.endTime)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-bg-elevated transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-text-tertiary tabular-nums">
                          {slot.startTime}–{slot.endTime}
                        </span>
                        <span className="text-xs text-text-tertiary ml-2">frei</span>
                      </div>
                      <span className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-brand flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        {fields.length === 0 && (
          <div className="flex items-center justify-center h-48 text-sm text-text-tertiary">
            Keine Plaetze vorhanden
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={onFabClick}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-brand text-text-on-brand shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}

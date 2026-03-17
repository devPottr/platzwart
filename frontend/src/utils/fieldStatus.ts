import type { Booking } from '../types'

export type FieldStatus = 'frei' | 'belegt' | 'reserviert' | 'wartung' | 'konflikt'

export const STATUS_STYLES: Record<FieldStatus, string> = {
  frei: 'bg-brand/15 text-brand border-brand/30',
  belegt: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  reserviert: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  wartung: 'bg-text-muted/15 text-text-secondary border-border-control',
  konflikt: 'bg-danger/15 text-danger border-danger/30',
}

export const STATUS_LABELS: Record<FieldStatus, string> = {
  frei: 'frei',
  belegt: 'belegt',
  reserviert: 'reserviert',
  wartung: 'wartung',
  konflikt: 'konflikt',
}

export function getFieldStatus(bookings: Booking[]): FieldStatus {
  if (bookings.length === 0) return 'frei'
  const hasLocked = bookings.some((b) => b.bookingType === 'locked' || b.bookingType === 'maintenance')
  if (hasLocked) return 'wartung'
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const a = bookings[i]
      const b = bookings[j]
      if (a.startTime < b.endTime && b.startTime < a.endTime) {
        const aSections = new Set(a.sections.map((s) => `${s.colIndex}-${s.rowIndex}`))
        const hasOverlap = b.sections.some((s) => aSections.has(`${s.colIndex}-${s.rowIndex}`))
        if (hasOverlap) return 'konflikt'
      }
    }
  }
  if (bookings.length > 1) return 'belegt'
  return 'belegt'
}

import type { Booking } from '../types'
import type { DraftBooking } from '../stores/plannerStore'

export function timeOverlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && aEnd > bStart
}

export function sectionsOverlap(a: number[], b: number[]): boolean {
  const setA = new Set(a)
  return b.some((id) => setA.has(id))
}

export interface ConflictInfo {
  draftId: string
  hasConflict: boolean
}

export function computeDraftConflicts(
  drafts: DraftBooking[],
  allBookings: Map<number, Booking[]>,
): Map<string, ConflictInfo> {
  const result = new Map<string, ConflictInfo>()
  for (const draft of drafts) {
    if (draft.status === 'success') continue
    let hasConflict = false
    for (const occ of draft.occurrences) {
      const occFieldId = occ.fieldId ?? draft.fieldId
      const occSections = occ.sectionIds ?? draft.sectionIds
      const fieldBookings = allBookings.get(occFieldId) ?? []
      for (const booking of fieldBookings) {
        if (
          timeOverlaps(occ.start, occ.end, booking.startTime, booking.endTime) &&
          sectionsOverlap(occSections, booking.sections.map((s) => s.id))
        ) {
          hasConflict = true
          break
        }
      }
      if (hasConflict) break
      for (const other of drafts) {
        if (other.draftId === draft.draftId || other.status === 'success') continue
        for (const otherOcc of other.occurrences) {
          const otherFieldId = otherOcc.fieldId ?? other.fieldId
          if (otherFieldId !== occFieldId) continue
          const otherSections = otherOcc.sectionIds ?? other.sectionIds
          if (!sectionsOverlap(occSections, otherSections)) continue
          if (timeOverlaps(occ.start, occ.end, otherOcc.start, otherOcc.end)) {
            hasConflict = true
            break
          }
        }
        if (hasConflict) break
      }
      if (hasConflict) break
    }
    result.set(draft.draftId, { draftId: draft.draftId, hasConflict })
  }
  return result
}

/** Check a single occurrence against allBookings for a specific field — returns first match */
export function checkOccurrenceConflict(
  occ: { start: string; end: string },
  fieldId: number,
  sectionIds: number[],
  allBookings: Map<number, Booking[]>,
): Booking | null {
  const fieldBookings = allBookings.get(fieldId) ?? []
  for (const booking of fieldBookings) {
    if (
      timeOverlaps(occ.start, occ.end, booking.startTime, booking.endTime) &&
      sectionsOverlap(sectionIds, booking.sections.map((s) => s.id))
    ) {
      return booking
    }
  }
  return null
}

export interface OccurrenceConflictDetail {
  booking: Booking
  overlappingSectionIds: number[]
}

/** Check a single occurrence and return ALL conflicting bookings with their overlapping sections */
export function checkOccurrenceConflicts(
  occ: { start: string; end: string },
  fieldId: number,
  sectionIds: number[],
  allBookings: Map<number, Booking[]>,
): OccurrenceConflictDetail[] {
  const fieldBookings = allBookings.get(fieldId) ?? []
  const sectionSet = new Set(sectionIds)
  const results: OccurrenceConflictDetail[] = []
  for (const booking of fieldBookings) {
    if (!timeOverlaps(occ.start, occ.end, booking.startTime, booking.endTime)) continue
    const overlapping = booking.sections.filter((s) => sectionSet.has(s.id)).map((s) => s.id)
    if (overlapping.length > 0) {
      results.push({ booking, overlappingSectionIds: overlapping })
    }
  }
  return results
}

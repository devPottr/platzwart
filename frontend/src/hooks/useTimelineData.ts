import { useMemo } from 'react'
import type { Field, Booking } from '../types'

export interface FieldBooking extends Booking {
  fieldId: number
  fieldSectionCount: number
}

interface LanedBooking extends FieldBooking {
  lane: number
  totalLanes: number
}

const DEFAULT_START = 15
const DEFAULT_END = 21

export function getHourFraction(iso: string): number {
  const h = parseInt(iso.slice(11, 13), 10)
  const m = parseInt(iso.slice(14, 16), 10)
  return h + m / 60
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

export function useTimelineData(
  fields: Field[],
  allBookings: Map<number, Booking[]>,
  activeFieldFilter: number | null,
  weekDates: string[],
  search: string
) {
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

  const timeRange = useMemo(
    () => computeTimeRange(allFieldBookings, weekDates),
    [allFieldBookings, weekDates]
  )
  const [startHour, endHour] = timeRange

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

  return { lanedBookingsByDate, startHour, endHour, hourLabels }
}

import { useMemo } from 'react'
import type { Field, Booking } from '../../types'
import { getHourFraction } from '../../hooks/useTimelineData'

interface MiniTimelineProps {
  fields: Field[]
  allBookings: Map<number, Booking[]>
  date: string
  highlightFieldId?: number
  highlightStart?: string
  highlightEnd?: string
}

export function MiniTimeline({
  fields,
  allBookings,
  date,
  highlightFieldId,
  highlightStart,
  highlightEnd,
}: MiniTimelineProps) {
  const { startHour, endHour } = useMemo(() => {
    let min = 14
    let max = 21
    for (const [, bookings] of allBookings) {
      for (const b of bookings) {
        if (b.startTime.slice(0, 10) !== date) continue
        const s = getHourFraction(b.startTime)
        const e = getHourFraction(b.endTime)
        if (s < min) min = s
        if (e > max) max = e
      }
    }
    if (highlightStart && highlightEnd) {
      const hs = getHourFraction(`${date}T${highlightStart}:00`)
      const he = getHourFraction(`${date}T${highlightEnd}:00`)
      if (hs < min) min = hs
      if (he > max) max = he
    }
    return { startHour: Math.floor(min), endHour: Math.ceil(max) }
  }, [allBookings, date, highlightStart, highlightEnd])

  const hours = useMemo(() => {
    const h: number[] = []
    for (let i = startHour; i <= endHour; i++) h.push(i)
    return h
  }, [startHour, endHour])

  const totalSpan = endHour - startHour
  if (totalSpan <= 0) return null

  return (
    <div className="space-y-0.5">
      {/* Hour ruler */}
      <div className="relative h-5 ml-[72px] mr-2">
        {hours.map((h) => {
          const left = ((h - startHour) / totalSpan) * 100
          if (left > 97) return null
          return (
            <span
              key={h}
              className="absolute text-[10px] tabular-nums text-text-tertiary"
              style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
            >
              {h}:00
            </span>
          )
        })}
      </div>

      {/* Field rows */}
      {fields.map((field) => {
        const dayBookings = (allBookings.get(field.id) ?? []).filter(
          (b) => b.startTime.slice(0, 10) === date,
        )
        const isHighlighted = field.id === highlightFieldId

        return (
          <div key={field.id} className="flex items-center h-7">
            <span
              className={`text-[11px] w-[72px] flex-shrink-0 truncate px-1 ${
                isHighlighted ? 'font-bold text-text-primary' : 'text-text-tertiary'
              }`}
            >
              {field.name}
            </span>
            <div
              className={`flex-1 relative h-5 rounded ${
                isHighlighted ? 'bg-bg-elevated ring-1 ring-brand/30' : 'bg-bg-elevated'
              }`}
            >
              {/* Hour grid lines */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute top-0 bottom-0 w-px bg-border-subtle/40"
                  style={{ left: `${((h - startHour) / totalSpan) * 100}%` }}
                />
              ))}

              {/* Existing bookings */}
              {dayBookings.map((b) => {
                const bStart = getHourFraction(b.startTime)
                const bEnd = getHourFraction(b.endTime)
                const left = ((bStart - startHour) / totalSpan) * 100
                const width = ((bEnd - bStart) / totalSpan) * 100
                const color = b.teamColor ?? '#6b7280'
                return (
                  <div
                    key={b.id}
                    className="absolute top-0.5 bottom-0.5 rounded-sm overflow-hidden"
                    style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color }}
                    title={`${b.teamName ?? b.title} ${b.startTime.slice(11, 16)}-${b.endTime.slice(11, 16)}`}
                  >
                    <div className="text-[9px] text-white font-medium px-1 truncate leading-4">
                      {b.teamName ?? b.title}
                    </div>
                  </div>
                )
              })}

              {/* Highlight: proposed time slot */}
              {isHighlighted && highlightStart && highlightEnd && (() => {
                const hs = getHourFraction(`${date}T${highlightStart}:00`)
                const he = getHourFraction(`${date}T${highlightEnd}:00`)
                const left = ((hs - startHour) / totalSpan) * 100
                const width = ((he - hs) / totalSpan) * 100
                return (
                  <div
                    className="absolute top-0 bottom-0 rounded-sm border-2 border-dashed border-brand/60 bg-brand/10"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                )
              })()}
            </div>
          </div>
        )
      })}
    </div>
  )
}

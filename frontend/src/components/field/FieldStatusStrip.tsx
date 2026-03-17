import { toLocalISO } from '../../utils/date'
import type { Field, Booking } from '../../types'
import { useShellStore } from '../../stores/shellStore'
import { getFieldStatus, STATUS_STYLES, STATUS_LABELS } from '../../utils/fieldStatus'

interface FieldStatusStripProps {
  fields: Field[]
  allBookings: Map<number, Booking[]>
}

export function FieldStatusStrip({ fields, allBookings }: FieldStatusStripProps) {
  const activeFieldFilter = useShellStore((s) => s.activeFieldFilter)
  const setActiveFieldFilter = useShellStore((s) => s.setActiveFieldFilter)

  const today = toLocalISO(new Date())

  return (
    <div className="flex gap-2 px-4 py-2 border-b border-border-subtle bg-bg-nav overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {fields.map((field) => {
        const bookings = (allBookings.get(field.id) ?? []).filter((b) => b.startTime.startsWith(today))
        const status = getFieldStatus(bookings)
        const isActive = activeFieldFilter === field.id

        // Collect team colors for dots
        const teamColors = [...new Set(bookings.filter((b) => b.teamColor).map((b) => b.teamColor!))]

        return (
          <button
            key={field.id}
            onClick={() => setActiveFieldFilter(isActive ? null : field.id)}
            className={`flex-shrink-0 flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-150 hover:-translate-y-0.5 ${
              isActive
                ? 'ring-2 ring-brand bg-brand/5 border-brand/30'
                : 'border-border-subtle hover:ring-1 hover:ring-brand/30 bg-bg-card'
            } shadow-card`}
            title={`${field.name} — ${STATUS_LABELS[status]}`}
          >
            {/* Mini field SVG */}
            <svg viewBox="0 0 48 32" className="w-12 h-8 flex-shrink-0 rounded" aria-hidden>
              <rect width="48" height="32" rx="3" className="fill-bg-field" />
              {/* Grid lines */}
              {Array.from({ length: field.gridCols - 1 }, (_, i) => (
                <line
                  key={`v${i}`}
                  x1={((i + 1) * 48) / field.gridCols}
                  y1="0"
                  x2={((i + 1) * 48) / field.gridCols}
                  y2="32"
                  stroke="currentColor"
                  className="text-border-field"
                  strokeWidth="0.5"
                  opacity="0.5"
                />
              ))}
              {Array.from({ length: field.gridRows - 1 }, (_, i) => (
                <line
                  key={`h${i}`}
                  x1="0"
                  y1={((i + 1) * 32) / field.gridRows}
                  x2="48"
                  y2={((i + 1) * 32) / field.gridRows}
                  stroke="currentColor"
                  className="text-border-field"
                  strokeWidth="0.5"
                  opacity="0.5"
                />
              ))}
              {/* Booked zones */}
              {bookings.flatMap((b) =>
                b.sections.map((s) => {
                  const zoneW = 48 / field.gridCols
                  const zoneH = 32 / field.gridRows
                  return (
                    <rect
                      key={`${b.id}-${s.colIndex}-${s.rowIndex}`}
                      x={s.colIndex * zoneW + 1}
                      y={s.rowIndex * zoneH + 1}
                      width={zoneW - 2}
                      height={zoneH - 2}
                      fill={b.teamColor ?? '#6b7280'}
                      opacity="0.6"
                      rx="1"
                    />
                  )
                })
              )}
            </svg>

            <div className="flex flex-col items-start min-w-0">
              <span className="text-xs font-medium text-text-primary truncate">{field.name}</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-medium px-1.5 py-0 rounded-full border ${STATUS_STYLES[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
                {teamColors.length > 0 && (
                  <div className="flex -space-x-0.5">
                    {teamColors.slice(0, 3).map((c, i) => (
                      <span
                        key={i}
                        className="w-2.5 h-2.5 rounded-full border border-bg-card"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

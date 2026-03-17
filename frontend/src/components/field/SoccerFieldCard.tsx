import type { Field, Booking } from '../../types'
import { getFieldStatus, STATUS_STYLES, STATUS_LABELS } from '../../utils/fieldStatus'

interface SoccerFieldCardProps {
  field: Field
  bookings: Booking[]
  onClick: () => void
}

export function SoccerFieldCard({ field, bookings, onClick }: SoccerFieldCardProps) {
  const cellWidth = 1050 / field.gridCols
  const cellHeight = 680 / field.gridRows
  const status = getFieldStatus(bookings)

  // Map booked sections: key "col-row" -> booking info
  const bookedCells = new Map<string, { color: string; teamName: string }>()
  for (const b of bookings) {
    for (const s of b.sections) {
      bookedCells.set(`${s.colIndex}-${s.rowIndex}`, {
        color: b.teamColor ?? '#6b7280',
        teamName: b.teamName ?? b.title,
      })
    }
  }

  // Derive info for the summary section
  const uniqueTeams = [...new Set(bookings.filter((b) => b.teamName).map((b) => b.teamName!))]
  const belegung =
    bookings.length === 0
      ? '\u2014'
      : bookings.length === 1
        ? bookings[0].bookedByName
        : `${bookings.length} Belegungen`

  const zeitfenster =
    bookings.length === 0
      ? 'verfuegbar'
      : bookings.length === 1
        ? `${fmt(bookings[0].startTime)}\u2013${fmt(bookings[0].endTime)}`
        : `${fmt(bookings[0].startTime)}\u2013${fmt(bookings[bookings.length - 1].endTime)}`

  return (
    <div
      className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-brand transition-all flex flex-col shadow-card"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-2">
        <div>
          <h3 className="text-text-primary font-semibold text-base tracking-tight">{field.name}</h3>
        </div>
        <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* SVG Field */}
      <div className="px-4 pb-2">
        <svg viewBox="0 0 1050 680" className="w-full rounded-lg overflow-hidden">
          {/* Background - bright green */}
          <rect width="1050" height="680" fill="#3baa5b" rx="12" />

          {/* Field markings - white dashed */}
          <g stroke="white" strokeWidth="2.5" opacity="0.7" fill="none" strokeDasharray="12 6">
            {/* Outer boundary */}
            <rect x="40" y="30" width="970" height="620" rx="4" />
            {/* Center line */}
            <line x1="525" y1="30" x2="525" y2="650" />
            {/* Center circle */}
            <circle cx="525" cy="340" r="91.5" />
            {/* Center dot */}
            <circle cx="525" cy="340" r="5" fill="white" stroke="none" opacity="0.7" />

            {/* Left penalty area */}
            <rect x="40" y="138" width="165" height="404" />
            {/* Left goal area */}
            <rect x="40" y="228" width="55" height="224" />
            {/* Left penalty arc */}
            <path d="M 205 253 A 91.5 91.5 0 0 1 205 427" />

            {/* Right penalty area */}
            <rect x="845" y="138" width="165" height="404" />
            {/* Right goal area */}
            <rect x="955" y="228" width="55" height="224" />
            {/* Right penalty arc */}
            <path d="M 845 253 A 91.5 91.5 0 0 0 845 427" />

            {/* Corner arcs */}
            <path d="M 50 30 A 10 10 0 0 0 40 40" />
            <path d="M 1010 30 A 10 10 0 0 1 1010 40" />
            <path d="M 40 640 A 10 10 0 0 0 50 650" />
            <path d="M 1010 640 A 10 10 0 0 1 1000 650" />
          </g>

          {/* Grid zone dividers - dashed white */}
          <g stroke="white" strokeWidth="1.5" opacity="0.35" strokeDasharray="8 5">
            {Array.from({ length: field.gridCols - 1 }, (_, i) => (
              <line
                key={`v${i}`}
                x1={(i + 1) * cellWidth}
                y1="30"
                x2={(i + 1) * cellWidth}
                y2="650"
              />
            ))}
            {Array.from({ length: field.gridRows - 1 }, (_, i) => (
              <line
                key={`h${i}`}
                x1="40"
                y1={(i + 1) * cellHeight}
                x2="1010"
                y2={(i + 1) * cellHeight}
              />
            ))}
          </g>

          {/* Zone labels + booked overlays */}
          {field.sections.map((section) => {
            const x = section.colIndex * cellWidth
            const y = section.rowIndex * cellHeight
            const booked = bookedCells.get(`${section.colIndex}-${section.rowIndex}`)
            const label = section.label ?? `Zone ${section.colIndex * field.gridRows + section.rowIndex + 1}`

            return (
              <g key={section.id}>
                {booked && (
                  <rect
                    x={x + 4}
                    y={y + 4}
                    width={cellWidth - 8}
                    height={cellHeight - 8}
                    fill={booked.color}
                    opacity="0.35"
                    rx="8"
                  />
                )}
                {/* Zone label */}
                <text
                  x={x + cellWidth / 2}
                  y={y + cellHeight / 2 - (booked ? 14 : 0)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="28"
                  fontWeight="600"
                  opacity="0.85"
                >
                  {label}
                </text>
                {/* Team badge on booked zone */}
                {booked && (
                  <g>
                    <rect
                      x={x + cellWidth / 2 - 50}
                      y={y + cellHeight / 2 + 10}
                      width="100"
                      height="26"
                      rx="13"
                      fill={booked.color}
                      opacity="0.85"
                    />
                    <text
                      x={x + cellWidth / 2}
                      y={y + cellHeight / 2 + 23}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize="16"
                      fontWeight="600"
                    >
                      {booked.teamName.length > 10 ? booked.teamName.slice(0, 9) + '\u2026' : booked.teamName}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Info section */}
      <div className="px-5 pb-2 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-text-tertiary">Belegung</span>
          <span className="text-text-primary font-medium">{belegung}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary">Zeitfenster</span>
          <span className="text-text-primary font-medium">{zeitfenster}</span>
        </div>
        <div>
          <span className="text-text-tertiary text-sm">Mannschaften</span>
          {uniqueTeams.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {uniqueTeams.map((name) => (
                <span
                  key={name}
                  className="text-xs px-2 py-0.5 rounded border border-border-control text-text-secondary bg-bg-elevated"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted mt-0.5 italic">keine aktive Belegung</p>
          )}
        </div>
      </div>

      {/* Button */}
      <div className="px-4 pb-4 pt-2 mt-auto">
        <button className="w-full py-2.5 rounded-lg bg-bg-elevated text-text-primary text-sm font-medium hover:bg-brand hover:text-text-on-brand transition-colors">
          Platz buchen
        </button>
      </div>
    </div>
  )
}

function fmt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

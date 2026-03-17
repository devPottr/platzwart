import type { FieldSection as FieldSectionType, Booking } from '../../types'

interface FieldSectionProps {
  section: FieldSectionType
  booking: Booking | null
  isSelected: boolean
  isBooked: boolean
  compact?: boolean
  onClick: () => void
}

export function FieldSection({ section, booking, isSelected, isBooked, compact = false, onClick }: FieldSectionProps) {
  const baseClasses = `rounded-lg flex flex-col items-center justify-center font-medium transition-all cursor-pointer border-2 ${compact ? 'p-1.5 min-h-[44px] text-xs' : 'p-3 min-h-[80px] text-sm'}`

  let colorClasses: string
  if (isBooked && booking) {
    colorClasses = 'border-transparent text-white cursor-not-allowed'
  } else if (isSelected) {
    colorClasses = 'border-brand bg-brand-muted text-brand'
  } else {
    colorClasses = 'border-dashed border-border-field bg-bg-field-zone hover:bg-border-field text-text-tertiary'
  }

  return (
    <div
      className={`${baseClasses} ${colorClasses}`}
      style={isBooked && booking?.teamColor ? { backgroundColor: booking.teamColor } : undefined}
      onClick={onClick}
    >
      {isBooked && booking ? (
        <>
          <span className="font-bold text-xs">{booking.teamName ?? booking.title}</span>
          <span className="text-xs opacity-80">{booking.title}</span>
        </>
      ) : (
        <>
          <span className="text-xs">{section.label ?? `${section.colIndex + 1}/${section.rowIndex + 1}`}</span>
          {isSelected && !compact && <span className="text-xs text-brand mt-1">Gewaehlt</span>}
        </>
      )}
    </div>
  )
}

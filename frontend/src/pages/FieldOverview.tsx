import { toLocalISO } from '../utils/date'
import { useFieldStore } from '../stores/fieldStore'
import { useShellStore } from '../stores/shellStore'
import { useBookingData } from '../stores/bookingDataContext'
import { SoccerFieldCard } from '../components/field/SoccerFieldCard'
import { useCallback } from 'react'
import type { Booking } from '../types'

export function FieldOverview() {
  const fields = useFieldStore((s) => s.fields)
  const setRightPanel = useShellStore((s) => s.setRightPanel)
  const { allBookings } = useBookingData()

  const today = toLocalISO(new Date())

  const getFieldBookings = useCallback(
    (fieldId: number): Booking[] => {
      const bookings = allBookings.get(fieldId) ?? []
      return bookings.filter((b) => b.startTime.startsWith(today))
    },
    [allBookings, today]
  )

  function handleFieldClick(fieldId: number) {
    setRightPanel('booking-create', { fieldId })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Plaetze</h1>
        <p className="text-sm text-text-tertiary mt-1">Klicke auf einen Platz, um eine Buchung vorzunehmen</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {fields.map((field) => (
          <SoccerFieldCard
            key={field.id}
            field={field}
            bookings={getFieldBookings(field.id)}
            onClick={() => handleFieldClick(field.id)}
          />
        ))}
      </div>
    </div>
  )
}

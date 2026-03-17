import { useAuthStore } from '../stores/authStore'
import { useFieldStore } from '../stores/fieldStore'
import { useBookingData } from '../stores/bookingDataContext'
import { WeeklyTimeline } from '../components/booking/WeeklyTimeline'

export function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const fields = useFieldStore((s) => s.fields)
  const { allBookings } = useBookingData()

  function handleBookingClick(_bookingId: number, _fieldId: number) {
    // Right panel opened by WeeklyTimeline via shellStore
  }

  return (
    <WeeklyTimeline
      fields={fields}
      allBookings={allBookings}
      onBookingClick={handleBookingClick}
      currentUserId={user?.id ?? null}
    />
  )
}

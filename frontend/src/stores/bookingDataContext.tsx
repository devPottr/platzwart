import { createContext, useContext } from 'react'
import type { Booking } from '../types'

interface BookingDataContextType {
  allBookings: Map<number, Booking[]>
  fetchAllBookings: () => void
}

export const BookingDataContext = createContext<BookingDataContextType>({
  allBookings: new Map(),
  fetchAllBookings: () => {},
})

export function useBookingData() {
  return useContext(BookingDataContext)
}

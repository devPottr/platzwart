import { create } from 'zustand'
import type { Booking } from '../types'
import * as bookingsApi from '../api/bookings'
import { getMonday } from '../utils/date'

interface BookingState {
  bookings: Booking[]
  weekStart: string
  loading: boolean
  fetchBookings: (fieldId: number, weekStart: string) => Promise<void>
  setWeekStart: (date: string) => void
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  weekStart: getMonday(new Date()),
  loading: false,

  fetchBookings: async (fieldId, weekStart) => {
    set({ loading: true })
    try {
      const bookings = await bookingsApi.getBookings(fieldId, weekStart)
      set({ bookings, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  setWeekStart: (date) => set({ weekStart: date }),
}))

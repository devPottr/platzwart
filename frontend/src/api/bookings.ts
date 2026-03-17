import type { Booking } from '../types'
import { apiFetch } from './auth'

export interface CreateBookingRequest {
  title: string
  bookingType: string
  teamId: number | null
  startTime: string
  endTime: string
  sectionIds: number[]
  notes?: string
  rRule?: string
}

export async function getBookings(fieldId: number, weekStart: string): Promise<Booking[]> {
  return apiFetch(`/api/bookings?fieldId=${fieldId}&weekStart=${weekStart}`)
}

export async function getBooking(id: number): Promise<Booking> {
  return apiFetch(`/api/bookings/${id}`)
}

export async function createBooking(request: CreateBookingRequest): Promise<Booking> {
  return apiFetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function updateBooking(id: number, request: CreateBookingRequest): Promise<Booking> {
  return apiFetch(`/api/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
}

export async function deleteBooking(id: number): Promise<void> {
  await apiFetch(`/api/bookings/${id}`, { method: 'DELETE' })
}

export async function deleteSeries(recurrenceId: number): Promise<{ deleted: number }> {
  return apiFetch(`/api/bookings/series/${recurrenceId}`, { method: 'DELETE' })
}

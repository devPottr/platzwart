import { create } from 'zustand'
import { getMonday } from '../utils/date'

interface BookingPrefill {
  date: string
  startTime: string
  endTime: string
}

interface ShellState {
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  rightPanelMode: 'none' | 'booking-detail' | 'booking-create' | 'field-detail'
  selectedBookingId: number | null
  bookingFieldId: number | null
  bookingPrefill: BookingPrefill | null
  setRightPanel: (
    mode: ShellState['rightPanelMode'],
    payload?: { bookingId?: number; fieldId?: number; prefill?: BookingPrefill }
  ) => void
  closeRightPanel: () => void
  weekStart: string
  setWeekStart: (date: string) => void
  theme: 'dark' | 'light'
  toggleTheme: () => void
  fieldStripVisible: boolean
  toggleFieldStrip: () => void
  activeFieldFilter: number | null
  setActiveFieldFilter: (id: number | null) => void
}

const savedTheme = (typeof window !== 'undefined' ? localStorage.getItem('platzwart-theme') : null) as 'dark' | 'light' | null

export const useShellStore = create<ShellState>((set) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: false,
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  rightPanelMode: 'none',
  selectedBookingId: null,
  bookingFieldId: null,
  bookingPrefill: null,
  setRightPanel: (mode, payload) =>
    set({
      rightPanelMode: mode,
      rightSidebarOpen: mode !== 'none',
      selectedBookingId: payload?.bookingId ?? null,
      bookingFieldId: payload?.fieldId ?? null,
      bookingPrefill: payload?.prefill ?? null,
    }),
  closeRightPanel: () =>
    set({
      rightPanelMode: 'none',
      rightSidebarOpen: false,
      selectedBookingId: null,
      bookingFieldId: null,
      bookingPrefill: null,
    }),
  weekStart: getMonday(new Date()),
  setWeekStart: (date) => set({ weekStart: date }),
  theme: savedTheme ?? 'dark',
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('platzwart-theme', next)
      document.documentElement.classList.toggle('light', next === 'light')
      return { theme: next }
    }),
  fieldStripVisible: true,
  toggleFieldStrip: () => set((s) => ({ fieldStripVisible: !s.fieldStripVisible })),
  activeFieldFilter: null,
  setActiveFieldFilter: (id) => set({ activeFieldFilter: id }),
}))

import { create } from 'zustand'
import { createBooking } from '../api/bookings'
import { ApiError } from '../api/auth'
import { expandOccurrences } from '../utils/rrule'
import { getMonday } from '../utils/date'

export interface DraftOccurrence {
  start: string
  end: string
  fieldId?: number
  fieldName?: string
  sectionIds?: number[]
}

export interface DraftBooking {
  draftId: string
  title: string
  bookingType: string
  teamId: number | null
  teamName: string | null
  teamColor: string | null
  fieldId: number
  fieldName: string
  startTime: string
  endTime: string
  sectionIds: number[]
  notes: string
  rRule: string
  status: 'pending' | 'submitting' | 'success' | 'error'
  errorMessage?: string
  conflictingSectionIds?: number[]
  occurrences: DraftOccurrence[]
}

export interface PlannerPrefill {
  fieldId: number
  date: string
  startTime: string
  endTime: string
}

export type WizardPath = 'quick' | 'season'

export interface WizardData {
  teamId: number | null
  teamName: string | null
  teamColor: string | null
  bookingType: string
  title: string
  notes: string
  // Quick booking
  date: string
  startTime: string
  endTime: string
  fieldId: number | null
  fieldName: string
  selectedSections: number[]
  // Season
  rRule: string
  _savedOccurrences?: DraftOccurrence[]
}

interface PlannerState {
  selectedTeamId: number | null
  viewWeekStart: string
  drafts: DraftBooking[]
  prefill: PlannerPrefill | null
  isSubmitting: boolean

  // Wizard state
  wizardOpen: boolean
  wizardPath: WizardPath
  wizardStep: number
  wizardData: WizardData
  editingDraftId: string | null

  setSelectedTeamId: (id: number | null) => void
  setViewWeekStart: (date: string) => void
  setPrefill: (p: PlannerPrefill | null) => void
  addDraft: (draft: Omit<DraftBooking, 'draftId' | 'status' | 'occurrences'>, precomputedOccurrences?: DraftOccurrence[]) => void
  removeDraft: (draftId: string) => void
  submitAll: (fetchAllBookings: () => void, skipConflicts?: boolean) => Promise<void>
  clearCompleted: () => void

  // Wizard actions
  openWizard: (prefill?: PlannerPrefill) => void
  closeWizard: () => void
  setWizardPath: (path: WizardPath) => void
  setWizardStep: (step: number) => void
  updateWizardData: (partial: Partial<WizardData>) => void
  editDraft: (draftId: string) => void
  retryDraft: (draftId: string) => void
}

const defaultWizardData: WizardData = {
  teamId: null,
  teamName: null,
  teamColor: null,
  bookingType: 'training',
  title: '',
  notes: '',
  date: '',
  startTime: '17:00',
  endTime: '18:30',
  fieldId: null,
  fieldName: '',
  selectedSections: [],
  rRule: '',
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  selectedTeamId: null,
  viewWeekStart: getMonday(new Date()),
  drafts: [],
  prefill: null,
  isSubmitting: false,

  // Wizard defaults
  wizardOpen: false,
  wizardPath: 'quick',
  wizardStep: 0,
  wizardData: { ...defaultWizardData },
  editingDraftId: null,

  setSelectedTeamId: (id) => set({ selectedTeamId: id }),

  setViewWeekStart: (date) => set({ viewWeekStart: date }),

  setPrefill: (p) => set({ prefill: p }),

  addDraft: (draft, precomputedOccurrences) => {
    const { editingDraftId } = get()
    const occurrences = precomputedOccurrences ?? expandOccurrences(draft.startTime, draft.endTime, draft.rRule)

    if (editingDraftId) {
      // Replace existing draft
      set((s) => ({
        drafts: s.drafts.map((d) =>
          d.draftId === editingDraftId
            ? { ...draft, draftId: editingDraftId, status: 'pending' as const, occurrences }
            : d
        ),
        prefill: null,
        editingDraftId: null,
      }))
    } else {
      // Add new draft
      const newDraft: DraftBooking = {
        ...draft,
        draftId: crypto.randomUUID(),
        status: 'pending',
        occurrences,
      }
      set((s) => ({ drafts: [...s.drafts, newDraft], prefill: null }))
    }
  },

  removeDraft: (draftId) =>
    set((s) => ({ drafts: s.drafts.filter((d) => d.draftId !== draftId) })),

  submitAll: async (fetchAllBookings, skipConflicts = false) => {
    const { drafts } = get()
    let pending = drafts.filter((d) => d.status === 'pending')
    if (pending.length === 0) return

    // If skipConflicts, skip drafts that previously failed with 409
    if (skipConflicts) {
      pending = pending.filter((d) => !d.conflictingSectionIds?.length)
    }

    if (pending.length === 0) return

    set({ isSubmitting: true })

    for (const draft of pending) {
      set((s) => ({
        drafts: s.drafts.map((d) =>
          d.draftId === draft.draftId ? { ...d, status: 'submitting' as const } : d
        ),
      }))

      let allSuccess = true
      let firstError: string | undefined
      let firstConflictingSectionIds: number[] | undefined

      for (const occ of draft.occurrences) {
        try {
          await createBooking({
            title: draft.title,
            bookingType: draft.bookingType,
            teamId: draft.teamId,
            startTime: occ.start,
            endTime: occ.end,
            sectionIds: occ.sectionIds ?? draft.sectionIds,
            notes: draft.notes || undefined,
          })
        } catch (e) {
          allSuccess = false
          if (!firstError) {
            const isConflict = e instanceof ApiError && e.status === 409
            firstConflictingSectionIds = isConflict && e.body?.conflictingSectionIds
              ? (e.body.conflictingSectionIds as number[])
              : undefined
            firstError = isConflict
              ? 'Zeitkonflikt mit bestehender Buchung'
              : e instanceof Error ? e.message : 'Fehler'
          }
        }
      }

      if (allSuccess) {
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.draftId === draft.draftId ? { ...d, status: 'success' as const, conflictingSectionIds: undefined } : d
          ),
        }))
      } else {
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.draftId === draft.draftId
              ? { ...d, status: 'error' as const, errorMessage: firstError, conflictingSectionIds: firstConflictingSectionIds }
              : d
          ),
        }))
      }
    }

    set({ isSubmitting: false })
    fetchAllBookings()
  },

  clearCompleted: () =>
    set((s) => ({ drafts: s.drafts.filter((d) => d.status !== 'success') })),

  // Wizard actions
  openWizard: (prefill) => {
    const data = { ...defaultWizardData }
    if (prefill) {
      data.fieldId = prefill.fieldId
      data.date = prefill.date
      data.startTime = prefill.startTime
      data.endTime = prefill.endTime
    }
    set({
      wizardOpen: true,
      wizardStep: prefill ? 1 : 0,
      wizardData: data,
      prefill: null,
      editingDraftId: null,
    })
  },

  closeWizard: () =>
    set({
      wizardOpen: false,
      wizardStep: 0,
      wizardData: { ...defaultWizardData },
      editingDraftId: null,
    }),

  setWizardPath: (path) => set({ wizardPath: path, wizardStep: 0 }),

  setWizardStep: (step) => set({ wizardStep: step }),

  updateWizardData: (partial) =>
    set((s) => ({ wizardData: { ...s.wizardData, ...partial } })),

  editDraft: (draftId) => {
    const draft = get().drafts.find((d) => d.draftId === draftId)
    if (!draft) return

    const date = draft.startTime.slice(0, 10)
    const startTime = draft.startTime.slice(11, 16)
    const endTime = draft.endTime.slice(11, 16)
    const hasSeason = !!draft.rRule

    set({
      wizardOpen: true,
      wizardPath: hasSeason ? 'season' : 'quick',
      wizardStep: hasSeason ? 3 : 0,
      editingDraftId: draftId,
      wizardData: {
        teamId: draft.teamId,
        teamName: draft.teamName,
        teamColor: draft.teamColor,
        bookingType: draft.bookingType,
        title: draft.title,
        notes: draft.notes,
        date,
        startTime,
        endTime,
        fieldId: draft.fieldId,
        fieldName: draft.fieldName,
        selectedSections: [...draft.sectionIds],
        rRule: draft.rRule,
        _savedOccurrences: hasSeason ? [...draft.occurrences] : undefined,
      },
    })
  },

  retryDraft: (draftId) =>
    set((s) => ({
      drafts: s.drafts.map((d) =>
        d.draftId === draftId
          ? { ...d, status: 'pending' as const, errorMessage: undefined, conflictingSectionIds: undefined }
          : d
      ),
    })),
}))

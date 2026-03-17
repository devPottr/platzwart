import { create } from 'zustand'
import type { Field } from '../types'
import * as fieldsApi from '../api/fields'

interface FieldState {
  fields: Field[]
  selectedFieldId: number | null
  loading: boolean
  fetchFields: () => Promise<void>
  selectField: (id: number) => void
}

export const useFieldStore = create<FieldState>((set, get) => ({
  fields: [],
  selectedFieldId: null,
  loading: false,

  fetchFields: async () => {
    set({ loading: true })
    try {
      const fields = await fieldsApi.getFields()
      const currentId = get().selectedFieldId
      set({
        fields,
        loading: false,
        selectedFieldId: currentId ?? fields[0]?.id ?? null,
      })
    } catch {
      set({ loading: false })
    }
  },

  selectField: (id) => set({ selectedFieldId: id }),
}))

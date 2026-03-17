import type { Field } from '../types'
import { apiFetch } from './auth'

export async function getFields(): Promise<Field[]> {
  return apiFetch('/api/fields')
}

export async function getField(id: number): Promise<Field> {
  return apiFetch(`/api/fields/${id}`)
}

export async function createField(name: string, gridCols: number, gridRows: number): Promise<Field> {
  return apiFetch('/api/fields', {
    method: 'POST',
    body: JSON.stringify({ name, gridCols, gridRows }),
  })
}

export async function updateFieldGrid(id: number, gridCols: number, gridRows: number): Promise<Field> {
  return apiFetch(`/api/fields/${id}/grid`, {
    method: 'PUT',
    body: JSON.stringify({ gridCols, gridRows }),
  })
}

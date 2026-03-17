import { useEffect, useState } from 'react'
import { apiFetch } from '../api/auth'
import { createField, updateFieldGrid, getFields } from '../api/fields'
import { Button } from '../components/common/Button'
import { Dialog } from '../components/common/Dialog'
import type { User, Field } from '../types'

export function AdminPanel() {
  const [users, setUsers] = useState<(User & { isActive: boolean })[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [editField, setEditField] = useState<Field | null>(null)
  const [fieldName, setFieldName] = useState('')
  const [gridCols, setGridCols] = useState(2)
  const [gridRows, setGridRows] = useState(2)

  const loadUsers = () => {
    apiFetch<(User & { isActive: boolean })[]>('/api/users').then(setUsers).catch(() => {})
  }
  const loadFields = () => { getFields().then(setFields).catch(() => {}) }

  useEffect(() => { loadUsers(); loadFields() }, [])

  const changeRole = async (userId: number, role: string) => {
    await apiFetch(`/api/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    })
    loadUsers()
  }

  const toggleActive = async (userId: number, isActive: boolean) => {
    await apiFetch(`/api/users/${userId}/active`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: !isActive }),
    })
    loadUsers()
  }

  const openFieldDialog = (field?: Field) => {
    if (field) {
      setEditField(field)
      setFieldName(field.name)
      setGridCols(field.gridCols)
      setGridRows(field.gridRows)
    } else {
      setEditField(null)
      setFieldName('')
      setGridCols(2)
      setGridRows(2)
    }
    setFieldDialogOpen(true)
  }

  const saveField = async () => {
    if (editField) {
      await updateFieldGrid(editField.id, gridCols, gridRows)
    } else {
      await createField(fieldName, gridCols, gridRows)
    }
    setFieldDialogOpen(false)
    loadFields()
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-6">Verwaltung</h1>
      </div>

      {/* Users */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-4">Benutzer</h2>
        <div className="bg-bg-card border border-border-subtle rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-bg-elevated">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Name</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">E-Mail</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Rolle</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-text-primary">{u.displayName}</td>
                  <td className="px-4 py-3 text-text-tertiary">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="bg-bg-input border border-border-control rounded px-2 py-1 text-sm text-text-primary"
                    >
                      <option value="member">Mitglied</option>
                      <option value="trainer">Trainer</option>
                      <option value="platzwart">Platzwart</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.isActive ? 'bg-[#3ecf8e26] text-brand' : 'bg-[#e5484d1a] text-danger'}`}>
                      {u.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleActive(u.id, u.isActive)} className="text-sm text-text-tertiary hover:text-text-primary">
                      {u.isActive ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Fields */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">Plaetze</h2>
          <Button onClick={() => openFieldDialog()}>Neuer Platz</Button>
        </div>
        <div className="space-y-2">
          {fields.map((f) => (
            <div key={f.id} className="flex items-center justify-between bg-bg-card border border-border-subtle rounded-lg p-4">
              <div>
                <div className="font-medium text-text-primary">{f.name}</div>
                <div className="text-xs text-text-tertiary">Grid: {f.gridCols} x {f.gridRows} ({f.sections.length} Sektionen)</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => openFieldDialog(f)}>Grid anpassen</Button>
            </div>
          ))}
        </div>
      </section>

      <Dialog open={fieldDialogOpen} onClose={() => setFieldDialogOpen(false)} title={editField ? 'Grid anpassen' : 'Neuer Platz'}>
        <div className="space-y-4">
          {!editField && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
              <input type="text" value={fieldName} onChange={(e) => setFieldName(e.target.value)} className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary" placeholder="z.B. Platz 1" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Spalten</label>
              <input type="number" min={1} max={10} value={gridCols} onChange={(e) => setGridCols(Number(e.target.value))} className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Zeilen</label>
              <input type="number" min={1} max={10} value={gridRows} onChange={(e) => setGridRows(Number(e.target.value))} className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary" />
            </div>
          </div>
          <div className="bg-bg-field rounded-lg p-3">
            <div className="text-sm text-text-tertiary mb-2">Vorschau ({gridCols} x {gridRows})</div>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
              {Array.from({ length: gridCols * gridRows }, (_, i) => (
                <div key={i} className="bg-bg-field-zone border border-dashed border-border-field rounded h-8" />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setFieldDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={saveField}>Speichern</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { getTeams, createTeam, updateTeam, deleteTeam } from '../api/teams'
import { Button } from '../components/common/Button'
import { Dialog } from '../components/common/Dialog'
import type { Team } from '../types'

// 12 gut unterscheidbare Farben — abgestimmt auf dunkle und helle Hintergruende
const TEAM_PALETTE = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#E11D48', // Rose
  '#84CC16', // Lime
]

function getNextPaletteColor(existingTeams: Team[]): string {
  const usedColors = new Set(existingTeams.map((t) => t.color.toUpperCase()))
  for (const c of TEAM_PALETTE) {
    if (!usedColors.has(c.toUpperCase())) return c
  }
  // All used — cycle back
  return TEAM_PALETTE[existingTeams.length % TEAM_PALETTE.length]
}

export function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTeam, setEditTeam] = useState<Team | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(TEAM_PALETTE[0])
  const [error, setError] = useState('')

  const load = () => { getTeams().then(setTeams).catch(() => {}) }
  useEffect(load, [])

  const openNew = () => {
    setEditTeam(null)
    setName('')
    setColor(getNextPaletteColor(teams))
    setError('')
    setDialogOpen(true)
  }

  const openEdit = (team: Team) => {
    setEditTeam(team)
    setName(team.name)
    setColor(team.color)
    setError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Name ist erforderlich'); return }
    try {
      if (editTeam) {
        await updateTeam(editTeam.id, name.trim(), color)
      } else {
        await createTeam(name.trim(), color)
      }
      setDialogOpen(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Team wirklich loeschen?')) return
    await deleteTeam(id)
    load()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Teams verwalten</h1>
        <Button onClick={openNew}>Neues Team</Button>
      </div>

      <div className="space-y-2">
        {teams.map((team) => (
          <div key={team.id} className="flex items-center justify-between bg-bg-card border border-border-subtle rounded-lg p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border border-border-subtle" style={{ backgroundColor: team.color }} />
              <div>
                <div className="font-medium text-text-primary">{team.name}</div>
                <div className="text-xs text-text-tertiary">{team.members.length} Mitglieder</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => openEdit(team)}>Bearbeiten</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(team.id)}>Loeschen</Button>
            </div>
          </div>
        ))}
        {teams.length === 0 && <p className="text-text-tertiary">Noch keine Teams angelegt.</p>}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editTeam ? 'Team bearbeiten' : 'Neues Team'}>
        <div className="space-y-4">
          {error && <div className="text-danger text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              placeholder="z.B. A-Jugend"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Farbe</label>
            {/* Palette swatches */}
            <div className="flex flex-wrap gap-2 mb-3">
              {TEAM_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color.toUpperCase() === c.toUpperCase()
                      ? 'ring-2 ring-offset-2 ring-offset-bg-card ring-text-primary scale-110'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            {/* Custom color fallback */}
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="bg-bg-input border border-border-control rounded-lg px-3 py-1.5 text-sm text-text-primary font-mono w-28"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave}>Speichern</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

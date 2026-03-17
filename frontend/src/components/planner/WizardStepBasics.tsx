import { useEffect, useState } from 'react'
import { getTeams } from '../../api/teams'
import { useAuthStore } from '../../stores/authStore'
import { usePlannerStore } from '../../stores/plannerStore'
import { hasMinRole, type Team } from '../../types'
import { Button } from '../common/Button'

const BOOKING_TYPE_LABELS: Record<string, string> = {
  training: 'Training',
  match: 'Spiel',
  tournament: 'Turnier',
  maintenance: 'Wartung',
  locked: 'Gesperrt',
}

export function WizardStepBasics() {
  const user = useAuthStore((s) => s.user)
  const wizardPath = usePlannerStore((s) => s.wizardPath)
  const setWizardPath = usePlannerStore((s) => s.setWizardPath)
  const wizardData = usePlannerStore((s) => s.wizardData)
  const updateWizardData = usePlannerStore((s) => s.updateWizardData)
  const setWizardStep = usePlannerStore((s) => s.setWizardStep)

  const [teams, setTeams] = useState<Team[]>([])

  useEffect(() => {
    getTeams().then(setTeams).catch(() => {})
  }, [])

  const bookingTypes = [
    { value: 'training', label: 'Training' },
    { value: 'match', label: 'Spiel' },
    { value: 'tournament', label: 'Turnier' },
    ...(hasMinRole(user, 'platzwart')
      ? [
          { value: 'maintenance', label: 'Wartung' },
          { value: 'locked', label: 'Gesperrt' },
        ]
      : []),
  ]

  function handleTeamChange(teamId: number | null) {
    const team = teams.find((t) => t.id === teamId)
    updateWizardData({
      teamId,
      teamName: team?.name ?? null,
      teamColor: team?.color ?? null,
    })
    // Auto-title
    if (team && wizardData.bookingType) {
      const typeLabel = BOOKING_TYPE_LABELS[wizardData.bookingType] ?? wizardData.bookingType
      updateWizardData({ title: `${typeLabel} ${team.name}` })
    }
  }

  function handleTypeChange(type: string) {
    updateWizardData({ bookingType: type })
    // Auto-title
    const team = teams.find((t) => t.id === wizardData.teamId)
    if (team) {
      const typeLabel = BOOKING_TYPE_LABELS[type] ?? type
      updateWizardData({ title: `${typeLabel} ${team.name}` })
    }
  }

  const isValid = wizardData.title.trim().length > 0

  const inputClass =
    'w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'

  return (
    <div className="space-y-5 pt-4">
      {/* Path selector */}
      <div>
        <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Buchungsart</label>
        <div className="flex rounded-lg border border-border-control overflow-hidden">
          <button
            type="button"
            onClick={() => setWizardPath('quick')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              wizardPath === 'quick'
                ? 'bg-brand text-text-on-brand'
                : 'bg-bg-input text-text-secondary hover:bg-bg-elevated'
            }`}
          >
            Einzelbuchung
          </button>
          <button
            type="button"
            onClick={() => setWizardPath('season')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors border-l border-border-control ${
              wizardPath === 'season'
                ? 'bg-brand text-text-on-brand'
                : 'bg-bg-input text-text-secondary hover:bg-bg-elevated'
            }`}
          >
            Saisonplanung
          </button>
        </div>
      </div>

      {/* Team */}
      <div>
        <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Team</label>
        <div className="flex items-center gap-2">
          {wizardData.teamColor && (
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: wizardData.teamColor }} />
          )}
          <select
            value={wizardData.teamId ?? ''}
            onChange={(e) => handleTeamChange(e.target.value ? Number(e.target.value) : null)}
            className={inputClass}
          >
            <option value="">Team waehlen...</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Booking type */}
      <div>
        <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Typ</label>
        <div className="flex flex-wrap gap-2">
          {bookingTypes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTypeChange(t.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                wizardData.bookingType === t.value
                  ? 'bg-brand text-text-on-brand'
                  : 'bg-bg-input border border-border-control text-text-secondary hover:bg-bg-elevated'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Titel</label>
        <input
          type="text"
          value={wizardData.title}
          onChange={(e) => updateWizardData({ title: e.target.value })}
          className={inputClass}
          placeholder="z.B. Training A-Jugend"
        />
      </div>

      {/* Footer */}
      <div className="pt-2">
        <Button onClick={() => setWizardStep(1)} disabled={!isValid} className="w-full">
          Weiter
        </Button>
      </div>
    </div>
  )
}

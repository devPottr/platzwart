import { useEffect } from 'react'
import { usePlannerStore } from '../../stores/plannerStore'
import { toLocalISO } from '../../utils/date'
import { RecurrenceForm } from '../booking/RecurrenceForm'
import { Button } from '../common/Button'

export function WizardStepSchedule() {
  const wizardData = usePlannerStore((s) => s.wizardData)
  const updateWizardData = usePlannerStore((s) => s.updateWizardData)
  const setWizardStep = usePlannerStore((s) => s.setWizardStep)

  const today = toLocalISO(new Date())

  // Default date to today if empty
  useEffect(() => {
    if (!wizardData.date) {
      updateWizardData({ date: today })
    }
    // Default rRule if empty
    if (!wizardData.rRule) {
      updateWizardData({ rRule: 'FREQ=WEEKLY;COUNT=12' })
    }
  }, [])

  const isValid =
    wizardData.date &&
    wizardData.startTime &&
    wizardData.endTime &&
    wizardData.startTime < wizardData.endTime &&
    wizardData.rRule

  const inputClass =
    'w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'

  return (
    <div className="space-y-5 pt-4">
      {/* Start date */}
      <div>
        <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Startdatum</label>
        <input
          type="date"
          value={wizardData.date}
          onChange={(e) => updateWizardData({ date: e.target.value })}
          className={inputClass}
        />
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Von</label>
          <input
            type="time"
            value={wizardData.startTime}
            onChange={(e) => updateWizardData({ startTime: e.target.value })}
            step="900"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Bis</label>
          <input
            type="time"
            value={wizardData.endTime}
            onChange={(e) => updateWizardData({ endTime: e.target.value })}
            step="900"
            className={inputClass}
          />
        </div>
      </div>

      {/* Recurrence */}
      <RecurrenceForm value={wizardData.rRule} onChange={(v) => updateWizardData({ rRule: v })} />

      {/* Footer */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={() => setWizardStep(0)} className="flex-1">
          Zurueck
        </Button>
        <Button onClick={() => setWizardStep(2)} disabled={!isValid} className="flex-1">
          Weiter
        </Button>
      </div>
    </div>
  )
}

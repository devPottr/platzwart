import { useEffect } from 'react'
import { usePlannerStore } from '../../stores/plannerStore'
import { useFieldStore } from '../../stores/fieldStore'
import { useBookingData } from '../../stores/bookingDataContext'
import { toLocalISO } from '../../utils/date'
import { FieldGrid } from '../field/FieldGrid'
import { Button } from '../common/Button'

export function WizardStepDateTime() {
  const wizardData = usePlannerStore((s) => s.wizardData)
  const updateWizardData = usePlannerStore((s) => s.updateWizardData)
  const setWizardStep = usePlannerStore((s) => s.setWizardStep)
  const { fields } = useFieldStore()
  const { allBookings } = useBookingData()

  const today = toLocalISO(new Date())

  // Default date to today if empty
  useEffect(() => {
    if (!wizardData.date) {
      updateWizardData({ date: today })
    }
  }, [])

  const activeField = fields.find((f) => f.id === wizardData.fieldId) ?? null
  const activeBookings = activeField ? (allBookings.get(activeField.id) ?? []) : []

  const selectedTime =
    wizardData.date && wizardData.startTime && wizardData.endTime
      ? { start: `${wizardData.date}T${wizardData.startTime}:00`, end: `${wizardData.date}T${wizardData.endTime}:00` }
      : null

  function handleFieldChange(fieldId: number | null) {
    const field = fields.find((f) => f.id === fieldId)
    updateWizardData({
      fieldId,
      fieldName: field?.name ?? '',
      selectedSections: [],
    })
  }

  function handleToggleSection(sectionId: number) {
    const current = wizardData.selectedSections
    const next = current.includes(sectionId)
      ? current.filter((id) => id !== sectionId)
      : [...current, sectionId]
    updateWizardData({ selectedSections: next })
  }

  const isValid =
    wizardData.date &&
    wizardData.startTime &&
    wizardData.endTime &&
    wizardData.startTime < wizardData.endTime &&
    wizardData.fieldId !== null &&
    wizardData.selectedSections.length > 0

  const inputClass =
    'w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'

  return (
    <div className="space-y-5 pt-4">
      {/* Date */}
      <div>
        <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Datum</label>
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

      {/* Field */}
      <div>
        <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Platz</label>
        <select
          value={wizardData.fieldId ?? ''}
          onChange={(e) => handleFieldChange(e.target.value ? Number(e.target.value) : null)}
          className={inputClass}
        >
          <option value="">Platz waehlen...</option>
          {fields.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* Zone selection */}
      {activeField && (
        <div>
          <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Zonen</label>
          <FieldGrid
            field={activeField}
            bookings={activeBookings}
            selectedTime={selectedTime}
            selectedSections={wizardData.selectedSections}
            onToggleSection={handleToggleSection}
            compact
          />
        </div>
      )}

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

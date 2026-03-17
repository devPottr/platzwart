import { usePlannerStore } from '../../stores/plannerStore'
import { useFieldStore } from '../../stores/fieldStore'
import { FieldGrid } from '../field/FieldGrid'
import { Button } from '../common/Button'

export function WizardStepFieldZone() {
  const wizardData = usePlannerStore((s) => s.wizardData)
  const updateWizardData = usePlannerStore((s) => s.updateWizardData)
  const setWizardStep = usePlannerStore((s) => s.setWizardStep)
  const { fields } = useFieldStore()

  const activeField = fields.find((f) => f.id === wizardData.fieldId) ?? null

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

  const isValid = wizardData.fieldId !== null && wizardData.selectedSections.length > 0

  const inputClass =
    'w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'

  return (
    <div className="space-y-5 pt-4">
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

      {/* Zone selection — no booking overlay for season planning,
           conflicts are shown per-occurrence in the review step */}
      {activeField && (
        <div>
          <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Zonen</label>
          <FieldGrid
            field={activeField}
            bookings={[]}
            selectedTime={null}
            selectedSections={wizardData.selectedSections}
            onToggleSection={handleToggleSection}
            compact
          />
          <p className="text-xs text-text-tertiary mt-2">
            Waehle die Zonen fuer alle Termine. Konflikte werden im naechsten Schritt angezeigt.
          </p>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
          Hinweis (optional)
        </label>
        <input
          type="text"
          value={wizardData.notes}
          onChange={(e) => updateWizardData({ notes: e.target.value })}
          className={inputClass}
          placeholder="z.B. Bitte Licht anschalten"
        />
      </div>

      {/* Footer */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={() => setWizardStep(1)} className="flex-1">
          Zurueck
        </Button>
        <Button onClick={() => setWizardStep(3)} disabled={!isValid} className="flex-1">
          Weiter
        </Button>
      </div>
    </div>
  )
}

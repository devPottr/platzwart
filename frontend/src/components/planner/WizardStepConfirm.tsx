import { useMemo } from 'react'
import { usePlannerStore } from '../../stores/plannerStore'
import { useFieldStore } from '../../stores/fieldStore'
import { useBookingData } from '../../stores/bookingDataContext'
import { checkOccurrenceConflict } from '../../utils/conflicts'
import { formatShortDate } from '../../utils/date'
import { Button } from '../common/Button'

const DAY_NAMES_SHORT: Record<number, string> = {
  0: 'So', 1: 'Mo', 2: 'Di', 3: 'Mi', 4: 'Do', 5: 'Fr', 6: 'Sa',
}

export function WizardStepConfirm() {
  const wizardData = usePlannerStore((s) => s.wizardData)
  const setWizardStep = usePlannerStore((s) => s.setWizardStep)
  const addDraft = usePlannerStore((s) => s.addDraft)
  const closeWizard = usePlannerStore((s) => s.closeWizard)
  const editingDraftId = usePlannerStore((s) => s.editingDraftId)
  const { fields } = useFieldStore()
  const { allBookings } = useBookingData()

  const field = fields.find((f) => f.id === wizardData.fieldId)
  const sectionLabels = field?.sections
    .filter((s) => wizardData.selectedSections.includes(s.id))
    .map((s) => s.label ?? `${s.colIndex + 1}/${s.rowIndex + 1}`)
    .join(', ')

  const occurrence = useMemo(() => {
    if (!wizardData.date || !wizardData.startTime || !wizardData.endTime) return null
    return {
      start: `${wizardData.date}T${wizardData.startTime}:00`,
      end: `${wizardData.date}T${wizardData.endTime}:00`,
    }
  }, [wizardData.date, wizardData.startTime, wizardData.endTime])

  const conflict = useMemo(() => {
    if (!occurrence || wizardData.fieldId === null) return null
    return checkOccurrenceConflict(occurrence, wizardData.fieldId, wizardData.selectedSections, allBookings)
  }, [occurrence, wizardData.fieldId, wizardData.selectedSections, allBookings])

  const dateObj = wizardData.date ? new Date(wizardData.date + 'T00:00:00') : null
  const dayName = dateObj ? DAY_NAMES_SHORT[dateObj.getDay()] : ''

  function handleAddDraft() {
    if (wizardData.fieldId === null) return
    addDraft({
      title: wizardData.title.trim(),
      bookingType: wizardData.bookingType,
      teamId: wizardData.teamId,
      teamName: wizardData.teamName,
      teamColor: wizardData.teamColor,
      fieldId: wizardData.fieldId,
      fieldName: wizardData.fieldName,
      startTime: `${wizardData.date}T${wizardData.startTime}:00`,
      endTime: `${wizardData.date}T${wizardData.endTime}:00`,
      sectionIds: wizardData.selectedSections,
      notes: wizardData.notes,
      rRule: '',
    })
    closeWizard()
  }

  function handleDirectBook() {
    handleAddDraft()
  }

  return (
    <div className="space-y-5 pt-4">
      <h3 className="text-lg font-bold text-text-primary">Zusammenfassung</h3>

      <div className="rounded-xl border border-border-subtle bg-bg-card overflow-hidden">
        {/* Color accent */}
        {wizardData.teamColor && (
          <div className="h-1" style={{ backgroundColor: wizardData.teamColor }} />
        )}

        <div className="p-4 space-y-3">
          <div>
            <span className="text-sm text-text-tertiary">Titel</span>
            <p className="text-base font-semibold text-text-primary">{wizardData.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-sm text-text-tertiary">Wann</span>
              <p className="text-sm font-medium text-text-primary">
                {dayName} {formatShortDate(wizardData.date)} {wizardData.startTime}–{wizardData.endTime}
              </p>
            </div>
            <div>
              <span className="text-sm text-text-tertiary">Platz</span>
              <p className="text-sm font-medium text-text-primary">{wizardData.fieldName}</p>
            </div>
          </div>

          {sectionLabels && (
            <div>
              <span className="text-sm text-text-tertiary">Zonen</span>
              <p className="text-sm font-medium text-text-primary">{sectionLabels}</p>
            </div>
          )}

          {wizardData.teamName && (
            <div>
              <span className="text-sm text-text-tertiary">Team</span>
              <p className="text-sm font-medium text-text-primary">{wizardData.teamName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Conflict warning */}
      {conflict ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-3">
          <p className="text-sm font-medium text-danger">
            Konflikt: {conflict.teamName ?? conflict.title} belegt Zonen zur selben Zeit
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-brand/30 bg-brand/5 p-3">
          <p className="text-sm font-medium text-brand">Keine Konflikte</p>
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
          onChange={(e) => usePlannerStore.getState().updateWizardData({ notes: e.target.value })}
          className="w-full bg-bg-input border border-border-control rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          placeholder="z.B. Bitte Licht anschalten"
        />
      </div>

      {/* Footer */}
      <div className="space-y-2 pt-2">
        <Button onClick={handleAddDraft} className="w-full">
          {editingDraftId ? 'Entwurf aktualisieren' : 'Zum Plan hinzufuegen'}
        </Button>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setWizardStep(1)} className="flex-1">
            Zurueck
          </Button>
          {!editingDraftId && (
            <Button variant="secondary" onClick={handleDirectBook} className="flex-1">
              Direkt buchen
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

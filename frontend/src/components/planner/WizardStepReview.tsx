import { useMemo, useState } from 'react'
import { usePlannerStore, type DraftOccurrence } from '../../stores/plannerStore'
import { useFieldStore } from '../../stores/fieldStore'
import { useBookingData } from '../../stores/bookingDataContext'
import { expandOccurrences } from '../../utils/rrule'
import { checkOccurrenceConflicts, type OccurrenceConflictDetail } from '../../utils/conflicts'
import { formatShortDate } from '../../utils/date'
import { Button } from '../common/Button'
import { OccurrenceEditor, type OccurrenceOverride } from './OccurrenceEditor'

const DAY_NAMES_SHORT: Record<number, string> = {
  0: 'So', 1: 'Mo', 2: 'Di', 3: 'Mi', 4: 'Do', 5: 'Fr', 6: 'Sa',
}

function reconstructOverrides(
  expanded: Array<{ start: string; end: string }>,
  saved: DraftOccurrence[],
  wizardData: { fieldId: number | null; selectedSections: number[] },
): Map<number, OccurrenceOverride> {
  const overrides = new Map<number, OccurrenceOverride>()
  const savedByDate = new Map<string, DraftOccurrence>()
  for (const s of saved) {
    savedByDate.set(s.start.slice(0, 10), s)
  }

  for (let i = 0; i < expanded.length; i++) {
    const date = expanded[i].start.slice(0, 10)
    const match = savedByDate.get(date)
    if (!match) {
      // This expanded occurrence was removed
      overrides.set(i, { action: 'removed' })
      continue
    }
    // Check if any values differ from the template
    const hasTimeDiff = match.start !== expanded[i].start || match.end !== expanded[i].end
    const hasFieldDiff = match.fieldId != null && match.fieldId !== wizardData.fieldId
    const hasSectionDiff = match.sectionIds != null &&
      JSON.stringify([...match.sectionIds].sort()) !== JSON.stringify([...wizardData.selectedSections].sort())

    if (hasTimeDiff || hasFieldDiff || hasSectionDiff) {
      overrides.set(i, {
        action: 'modified',
        ...(hasTimeDiff && { startTime: match.start, endTime: match.end }),
        ...(match.fieldId != null && { fieldId: match.fieldId }),
        ...(match.fieldName != null && { fieldName: match.fieldName }),
        ...(match.sectionIds != null && { sectionIds: match.sectionIds }),
      })
    }
    savedByDate.delete(date)
  }
  return overrides
}

export function WizardStepReview() {
  const wizardData = usePlannerStore((s) => s.wizardData)
  const setWizardStep = usePlannerStore((s) => s.setWizardStep)
  const addDraft = usePlannerStore((s) => s.addDraft)
  const closeWizard = usePlannerStore((s) => s.closeWizard)
  const editingDraftId = usePlannerStore((s) => s.editingDraftId)
  const { fields } = useFieldStore()
  const { allBookings } = useBookingData()

  const field = fields.find((f) => f.id === wizardData.fieldId)

  // Override state — reconstruct from saved occurrences when re-editing a season draft
  const [overrides, setOverrides] = useState<Map<number, OccurrenceOverride>>(() => {
    if (!wizardData._savedOccurrences || !wizardData.date || !wizardData.rRule) return new Map()
    const startIso = `${wizardData.date}T${wizardData.startTime}:00`
    const endIso = `${wizardData.date}T${wizardData.endTime}:00`
    const expanded = expandOccurrences(startIso, endIso, wizardData.rRule)
    return reconstructOverrides(expanded, wizardData._savedOccurrences, wizardData)
  })
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Build a map of sectionId → label for display
  const sectionLabelMap = useMemo(() => {
    if (!field) return new Map<number, string>()
    const map = new Map<number, string>()
    for (const s of field.sections) {
      map.set(s.id, s.label ?? `${s.colIndex + 1}/${s.rowIndex + 1}`)
    }
    return map
  }, [field])

  // Also build label map for all fields (for overrides targeting different fields)
  const allSectionLabelMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const f of fields) {
      for (const s of f.sections) {
        map.set(s.id, s.label ?? `${s.colIndex + 1}/${s.rowIndex + 1}`)
      }
    }
    return map
  }, [fields])

  const occurrences = useMemo(() => {
    if (!wizardData.date || !wizardData.startTime || !wizardData.endTime || !wizardData.rRule) return []
    const startTime = `${wizardData.date}T${wizardData.startTime}:00`
    const endTime = `${wizardData.date}T${wizardData.endTime}:00`
    return expandOccurrences(startTime, endTime, wizardData.rRule)
  }, [wizardData.date, wizardData.startTime, wizardData.endTime, wizardData.rRule])

  // Apply overrides to compute effective occurrence values + conflicts
  const occurrencesWithConflicts = useMemo(() => {
    if (wizardData.fieldId === null) return []
    return occurrences.map((occ, idx) => {
      const override = overrides.get(idx)
      if (override?.action === 'removed') {
        return { ...occ, conflicts: [] as OccurrenceConflictDetail[], override }
      }
      const effectiveStart = override?.startTime ?? occ.start
      const effectiveEnd = override?.endTime ?? occ.end
      const effectiveFieldId = override?.fieldId ?? wizardData.fieldId!
      const effectiveSections = override?.sectionIds ?? wizardData.selectedSections
      const conflicts = checkOccurrenceConflicts(
        { start: effectiveStart, end: effectiveEnd },
        effectiveFieldId,
        effectiveSections,
        allBookings,
      )
      return { ...occ, conflicts, override }
    })
  }, [occurrences, wizardData.fieldId, wizardData.selectedSections, allBookings, overrides])

  // Counts
  const activeOccurrences = occurrencesWithConflicts.filter((o) => o.override?.action !== 'removed')
  const okCount = activeOccurrences.filter((o) => o.conflicts.length === 0).length
  const conflictCount = activeOccurrences.filter((o) => o.conflicts.length > 0).length
  const removedCount = occurrencesWithConflicts.filter((o) => o.override?.action === 'removed').length
  const modifiedCount = occurrencesWithConflicts.filter((o) => o.override?.action === 'modified').length

  const selectedSectionLabels = wizardData.selectedSections
    .map((id) => sectionLabelMap.get(id) ?? '?')
    .join(', ')

  function handleToggleExpanded(idx: number) {
    if (editingIndex === idx) return // don't collapse while editing
    setExpandedIndex(expandedIndex === idx ? null : idx)
  }

  function handleRemove(idx: number) {
    setOverrides((prev) => {
      const next = new Map(prev)
      next.set(idx, { action: 'removed' })
      return next
    })
    setExpandedIndex(null)
  }

  function handleRestore(idx: number) {
    setOverrides((prev) => {
      const next = new Map(prev)
      next.delete(idx)
      return next
    })
  }

  function handleStartEdit(idx: number) {
    setEditingIndex(idx)
    setExpandedIndex(idx)
  }

  function handleSaveEdit(idx: number, override: OccurrenceOverride) {
    setOverrides((prev) => {
      const next = new Map(prev)
      next.set(idx, override)
      return next
    })
    setEditingIndex(null)
    setExpandedIndex(null)
  }

  function handleCancelEdit() {
    setEditingIndex(null)
  }

  function handleAddDrafts() {
    if (wizardData.fieldId === null) return

    // Build enriched occurrences with per-occurrence overrides
    const enrichedOccurrences: DraftOccurrence[] = []
    for (let idx = 0; idx < occurrences.length; idx++) {
      const override = overrides.get(idx)
      if (override?.action === 'removed') continue

      const occ = occurrences[idx]
      enrichedOccurrences.push({
        start: override?.startTime ?? occ.start,
        end: override?.endTime ?? occ.end,
        ...(override?.fieldId != null && { fieldId: override.fieldId }),
        ...(override?.fieldName != null && { fieldName: override.fieldName }),
        ...(override?.sectionIds != null && { sectionIds: override.sectionIds }),
      })
    }

    if (enrichedOccurrences.length === 0) return

    // Create ONE draft with all occurrences
    addDraft({
      title: wizardData.title.trim(),
      bookingType: wizardData.bookingType,
      teamId: wizardData.teamId,
      teamName: wizardData.teamName,
      teamColor: wizardData.teamColor,
      fieldId: wizardData.fieldId,
      fieldName: wizardData.fieldName,
      startTime: enrichedOccurrences[0].start,
      endTime: enrichedOccurrences[0].end,
      sectionIds: wizardData.selectedSections,
      notes: wizardData.notes,
      rRule: wizardData.rRule, // keep for editDraft detection
    }, enrichedOccurrences)
    closeWizard()
  }

  function formatConflictDetail(c: OccurrenceConflictDetail): string {
    const who = c.booking.teamName ?? c.booking.title
    const zones = c.overlappingSectionIds.map((id) => allSectionLabelMap.get(id) ?? '?').join(', ')
    return `${who} belegt ${zones}`
  }

  const addCount = activeOccurrences.length

  // Build footer label
  let footerDetail = ''
  const parts: string[] = []
  if (modifiedCount > 0) parts.push(`${modifiedCount} angepasst`)
  if (removedCount > 0) parts.push(`${removedCount} entfernt`)
  if (parts.length > 0) footerDetail = ` (${parts.join(', ')})`

  return (
    <div className="space-y-5 pt-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-bold text-text-primary">{occurrences.length} Termine</h3>
        <span className="text-sm text-text-tertiary">
          {okCount} ok
          {conflictCount > 0 && <span className="text-danger"> / {conflictCount} Konflikte</span>}
          {removedCount > 0 && <span> / {removedCount} entfernt</span>}
        </span>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-border-subtle bg-bg-card p-3">
        <div className="text-sm text-text-secondary space-y-1">
          <p><span className="text-text-tertiary">Titel:</span> {wizardData.title}</p>
          <p><span className="text-text-tertiary">Platz:</span> {wizardData.fieldName}</p>
          <p><span className="text-text-tertiary">Zonen:</span> {selectedSectionLabels}</p>
          <p><span className="text-text-tertiary">Zeit:</span> {wizardData.startTime}–{wizardData.endTime}</p>
          {wizardData.teamName && (
            <p><span className="text-text-tertiary">Team:</span> {wizardData.teamName}</p>
          )}
        </div>
      </div>

      {/* Conflict summary banner */}
      {conflictCount > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
          <p className="text-sm font-medium text-warning">
            {conflictCount} von {activeOccurrences.length} Terminen haben Konflikte.
            Klicke auf einen Termin um ihn anzupassen oder zu entfernen.
          </p>
        </div>
      )}

      {/* Occurrence list */}
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {occurrencesWithConflicts.map((occ, idx) => {
          const override = occ.override
          const isRemoved = override?.action === 'removed'
          const isModified = override?.action === 'modified'
          const isExpanded = expandedIndex === idx
          const isEditing = editingIndex === idx

          // Use effective values for display
          const effectiveStart = override?.startTime ?? occ.start
          const effectiveEnd = override?.endTime ?? occ.end
          const effectiveFieldName = override?.fieldName ?? wizardData.fieldName

          const dateObj = new Date(effectiveStart.slice(0, 10) + 'T00:00:00')
          const dayName = DAY_NAMES_SHORT[dateObj.getDay()]
          const dateStr = formatShortDate(effectiveStart.slice(0, 10))
          const timeStr = `${effectiveStart.slice(11, 16)}–${effectiveEnd.slice(11, 16)}`
          const hasConflict = !isRemoved && occ.conflicts.length > 0

          if (isRemoved) {
            return (
              <div key={idx} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-bg-elevated opacity-50">
                <span className="text-xs w-5 flex-shrink-0 text-text-tertiary line-through">✗</span>
                <span className="text-text-tertiary line-through tabular-nums">
                  {dayName} {dateStr}
                </span>
                <span className="text-text-tertiary line-through tabular-nums">{timeStr}</span>
                <span className="text-text-tertiary ml-auto">entfernt</span>
                <button
                  onClick={() => handleRestore(idx)}
                  className="text-xs text-brand hover:underline flex-shrink-0"
                >
                  Wiederherstellen
                </button>
              </div>
            )
          }

          return (
            <div key={idx}>
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                  hasConflict
                    ? 'bg-danger/5 border border-danger/20 hover:bg-danger/10'
                    : isModified
                    ? 'bg-brand/5 border border-brand/20 hover:bg-brand/10'
                    : 'bg-bg-elevated hover:bg-bg-hover'
                }`}
                onClick={() => handleToggleExpanded(idx)}
              >
                <span className={`text-xs w-5 flex-shrink-0 ${
                  hasConflict ? 'text-danger font-bold' : isModified ? 'text-brand' : 'text-brand'
                }`}>
                  {hasConflict ? '!!' : isModified ? '✎' : '✓'}
                </span>
                <span className="text-text-secondary font-medium tabular-nums">
                  {dayName} {dateStr}
                </span>
                <span className="text-text-tertiary tabular-nums">{timeStr}</span>
                <span className="text-text-tertiary ml-auto">{effectiveFieldName}</span>
              </div>

              {/* Conflict details */}
              {hasConflict && !isExpanded && (
                <div className="ml-8 mt-0.5 mb-1.5 space-y-0.5">
                  {occ.conflicts.map((c, ci) => (
                    <p key={ci} className="text-xs text-danger/80 pl-1">
                      {formatConflictDetail(c)}
                    </p>
                  ))}
                </div>
              )}

              {/* Action menu (expanded but not editing) */}
              {isExpanded && !isEditing && (
                <div className="ml-8 mt-1 mb-1.5 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStartEdit(idx) }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(idx) }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                  >
                    Entfernen
                  </button>
                  {/* Show conflict details in expanded state too */}
                  {hasConflict && (
                    <div className="flex items-center ml-2">
                      {occ.conflicts.map((c, ci) => (
                        <span key={ci} className="text-xs text-danger/80">
                          {formatConflictDetail(c)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Inline editor */}
              {isEditing && wizardData.fieldId !== null && (
                <OccurrenceEditor
                  occurrence={{ start: occ.start, end: occ.end }}
                  defaultFieldId={override?.fieldId ?? wizardData.fieldId}
                  defaultFieldName={override?.fieldName ?? wizardData.fieldName}
                  defaultSectionIds={override?.sectionIds ?? wizardData.selectedSections}
                  fields={fields}
                  allBookings={allBookings}
                  onSave={(ov) => handleSaveEdit(idx, ov)}
                  onCancel={handleCancelEdit}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="space-y-2 pt-2">
        <Button onClick={handleAddDrafts} className="w-full" disabled={addCount === 0}>
          {editingDraftId
            ? `Entwurf aktualisieren (${addCount} Termine${footerDetail})`
            : `${addCount} Termine hinzufuegen${footerDetail}`
          }
        </Button>
        <Button variant="secondary" onClick={() => setWizardStep(2)} className="w-full">
          Zurueck
        </Button>
      </div>
    </div>
  )
}

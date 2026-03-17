import { useState, useMemo } from 'react'
import type { Field, Booking } from '../../types'
import { checkOccurrenceConflicts } from '../../utils/conflicts'
import { FieldGrid } from '../field/FieldGrid'
import { MiniTimeline } from './MiniTimeline'
import { Button } from '../common/Button'

export interface OccurrenceOverride {
  action: 'modified' | 'removed'
  startTime?: string
  endTime?: string
  fieldId?: number
  fieldName?: string
  sectionIds?: number[]
}

interface OccurrenceEditorProps {
  occurrence: { start: string; end: string }
  defaultFieldId: number
  defaultFieldName: string
  defaultSectionIds: number[]
  fields: Field[]
  allBookings: Map<number, Booking[]>
  onSave: (override: OccurrenceOverride) => void
  onCancel: () => void
}

export function OccurrenceEditor({
  occurrence,
  defaultFieldId,
  defaultFieldName,
  defaultSectionIds,
  fields,
  allBookings,
  onSave,
  onCancel,
}: OccurrenceEditorProps) {
  const date = occurrence.start.slice(0, 10)

  const [startTime, setStartTime] = useState(occurrence.start.slice(11, 16))
  const [endTime, setEndTime] = useState(occurrence.end.slice(11, 16))
  const [fieldId, setFieldId] = useState(defaultFieldId)
  const [sectionIds, setSectionIds] = useState<number[]>([...defaultSectionIds])

  const field = fields.find((f) => f.id === fieldId)
  const fieldName = field?.name ?? defaultFieldName

  const fieldBookings = useMemo(
    () => allBookings.get(fieldId) ?? [],
    [allBookings, fieldId],
  )

  const selectedTime = useMemo(
    () => ({ start: `${date}T${startTime}:00`, end: `${date}T${endTime}:00` }),
    [date, startTime, endTime],
  )

  const conflicts = useMemo(
    () =>
      checkOccurrenceConflicts(
        { start: selectedTime.start, end: selectedTime.end },
        fieldId,
        sectionIds,
        allBookings,
      ),
    [selectedTime, fieldId, sectionIds, allBookings],
  )

  function handleFieldChange(newFieldId: number) {
    setFieldId(newFieldId)
    setSectionIds([])
  }

  function handleToggleSection(sectionId: number) {
    setSectionIds((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    )
  }

  function handleSave() {
    onSave({
      action: 'modified',
      startTime: `${date}T${startTime}:00`,
      endTime: `${date}T${endTime}:00`,
      fieldId,
      fieldName,
      sectionIds,
    })
  }

  const hasChanges =
    startTime !== occurrence.start.slice(11, 16) ||
    endTime !== occurrence.end.slice(11, 16) ||
    fieldId !== defaultFieldId ||
    JSON.stringify([...sectionIds].sort()) !== JSON.stringify([...defaultSectionIds].sort())

  const isValid = sectionIds.length > 0 && startTime < endTime

  return (
    <div className="ml-8 mr-2 my-2 rounded-xl border border-border-subtle bg-bg-card p-4 space-y-4">
      {/* Mini timeline */}
      <div>
        <p className="text-xs font-medium text-text-tertiary mb-2">
          Tagesansicht — {formatDateLabel(date)}
        </p>
        <MiniTimeline
          fields={fields}
          allBookings={allBookings}
          date={date}
          highlightFieldId={fieldId}
          highlightStart={startTime}
          highlightEnd={endTime}
        />
      </div>

      {/* Time pickers */}
      <div className="flex gap-4 items-center">
        <label className="text-sm text-text-secondary">
          Von:
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="ml-2 px-2 py-1 rounded-lg border border-border-subtle bg-bg-base text-sm tabular-nums text-text-primary"
          />
        </label>
        <label className="text-sm text-text-secondary">
          Bis:
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="ml-2 px-2 py-1 rounded-lg border border-border-subtle bg-bg-base text-sm tabular-nums text-text-primary"
          />
        </label>
      </div>

      {/* Field selector */}
      <div>
        <label className="text-sm text-text-secondary">
          Platz:
          <select
            value={fieldId}
            onChange={(e) => handleFieldChange(Number(e.target.value))}
            className="ml-2 px-2 py-1 rounded-lg border border-border-subtle bg-bg-base text-sm text-text-primary"
          >
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Zone selection */}
      {field && (
        <div>
          <p className="text-xs text-text-tertiary mb-2">Zonen waehlen:</p>
          <FieldGrid
            field={field}
            bookings={fieldBookings}
            selectedTime={selectedTime}
            selectedSections={sectionIds}
            onToggleSection={handleToggleSection}
            compact
          />
        </div>
      )}

      {/* Conflict indicator */}
      {conflicts.length > 0 && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-2">
          <p className="text-xs font-medium text-danger">
            {conflicts.length} Konflikt{conflicts.length > 1 ? 'e' : ''}:
          </p>
          {conflicts.map((c, i) => (
            <p key={i} className="text-xs text-danger/80 mt-0.5">
              {c.booking.teamName ?? c.booking.title} belegt{' '}
              {c.overlappingSectionIds.length} Zone{c.overlappingSectionIds.length > 1 ? 'n' : ''}
            </p>
          ))}
        </div>
      )}

      {conflicts.length === 0 && hasChanges && isValid && (
        <div className="rounded-lg border border-brand/30 bg-brand/5 p-2">
          <p className="text-xs font-medium text-brand">Kein Konflikt</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button onClick={handleSave} disabled={!isValid} className="flex-1">
          Uebernehmen
        </Button>
      </div>
    </div>
  )
}

const DAY_NAMES: Record<number, string> = {
  0: 'Sonntag', 1: 'Montag', 2: 'Dienstag', 3: 'Mittwoch',
  4: 'Donnerstag', 5: 'Freitag', 6: 'Samstag',
}

const MONTHS: string[] = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`
}

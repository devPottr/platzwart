import { useState } from 'react'
import { usePlannerStore } from '../../stores/plannerStore'
import { useDraftConflicts } from './PlannerAvailability'
import { useBookingData } from '../../stores/bookingDataContext'
import { useFieldStore } from '../../stores/fieldStore'
import { Button } from '../common/Button'
import { Dialog } from '../common/Dialog'

const DAY_SHORT: Record<number, string> = {
  0: 'So', 1: 'Mo', 2: 'Di', 3: 'Mi', 4: 'Do', 5: 'Fr', 6: 'Sa',
}

function formatDraftTime(iso: string): string {
  const d = new Date(iso)
  const day = DAY_SHORT[d.getDay()] ?? '?'
  return `${day} ${iso.slice(11, 16)}`
}

/** Compact vertical list for mobile bottom-sheet */
export function DraftQueue() {
  const drafts = usePlannerStore((s) => s.drafts)
  const removeDraft = usePlannerStore((s) => s.removeDraft)
  const editDraft = usePlannerStore((s) => s.editDraft)
  const retryDraft = usePlannerStore((s) => s.retryDraft)
  const submitAll = usePlannerStore((s) => s.submitAll)
  const clearCompleted = usePlannerStore((s) => s.clearCompleted)
  const isSubmitting = usePlannerStore((s) => s.isSubmitting)
  const { fields } = useFieldStore()
  const { allBookings, fetchAllBookings } = useBookingData()
  const conflicts = useDraftConflicts(drafts, allBookings)

  const [confirmOpen, setConfirmOpen] = useState(false)

  const pendingCount = drafts.filter((d) => d.status === 'pending').length
  const successCount = drafts.filter((d) => d.status === 'success').length
  const errorCount = drafts.filter((d) => d.status === 'error').length
  const hasConflicts = Array.from(conflicts.values()).some((c) => c.hasConflict)

  if (drafts.length === 0) return null

  function getSectionLabels(fieldId: number, sectionIds: number[]): string {
    const field = fields.find((f) => f.id === fieldId)
    if (!field) return ''
    return sectionIds
      .map((id) => {
        const s = field.sections.find((sec) => sec.id === id)
        return s?.label ?? `${(s?.colIndex ?? 0) + 1}/${(s?.rowIndex ?? 0) + 1}`
      })
      .join(', ')
  }

  return (
    <div className="space-y-3">
      {successCount > 0 && (
        <button
          onClick={clearCompleted}
          className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
        >
          Erledigte entfernen
        </button>
      )}

      <div className="space-y-2">
        {drafts.map((draft) => {
          const conflict = conflicts.get(draft.draftId)
          const isConflict = conflict?.hasConflict ?? false
          const color = draft.teamColor ?? '#6b7280'
          const isError = draft.status === 'error'
          const hasConflictSections = draft.conflictingSectionIds && draft.conflictingSectionIds.length > 0

          return (
            <div
              key={draft.draftId}
              className={`rounded-lg border overflow-hidden transition-all ${
                draft.status === 'success'
                  ? 'bg-[#2ea04310] border-[#2ea04330]'
                  : isError
                    ? 'bg-danger/5 border-danger/20'
                    : draft.status === 'submitting'
                      ? 'bg-bg-elevated border-border-subtle animate-pulse'
                      : isConflict
                        ? 'bg-danger/5 border-danger/20'
                        : 'bg-bg-elevated border-border-subtle'
              }`}
            >
              <div
                className="h-0.5"
                style={{
                  backgroundColor:
                    draft.status === 'success' ? '#2ea043'
                      : isError || isConflict ? '#e5484d'
                        : color,
                }}
              />
              <div className="flex items-center gap-2.5 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">{draft.title}</div>
                  <div className="text-xs text-text-tertiary mt-0.5 tabular-nums">
                    {draft.occurrences.length > 1 ? `${draft.occurrences.length} Termine · ` : ''}
                    {formatDraftTime(draft.startTime)} · {draft.fieldName}
                  </div>
                  {/* Server conflict: show which sections */}
                  {isError && hasConflictSections && (
                    <div className="text-xs text-danger mt-1">
                      Zonen belegt: {getSectionLabels(draft.fieldId, draft.conflictingSectionIds!)}
                    </div>
                  )}
                  {isError && !hasConflictSections && draft.errorMessage && (
                    <div className="text-xs text-danger mt-1">{draft.errorMessage}</div>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  {draft.status === 'success' && (
                    <span className="text-xs font-medium text-[#2ea043]">Gebucht</span>
                  )}
                  {isConflict && draft.status === 'pending' && (
                    <span className="text-[10px] font-semibold text-danger bg-danger/10 rounded px-1.5 py-0.5">Konflikt</span>
                  )}
                  {/* Edit button */}
                  {(draft.status === 'pending' || draft.status === 'error') && (
                    <button
                      onClick={() => editDraft(draft.draftId)}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-text-tertiary hover:text-brand hover:bg-brand/10 transition-colors"
                      title="Bearbeiten"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  {/* Retry button for errors */}
                  {isError && (
                    <button
                      onClick={() => retryDraft(draft.draftId)}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-text-tertiary hover:text-brand hover:bg-brand/10 transition-colors"
                      title="Erneut versuchen"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                    </button>
                  )}
                  {/* Remove button */}
                  {(draft.status === 'pending' || draft.status === 'error') && (
                    <button
                      onClick={() => removeDraft(draft.draftId)}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-text-tertiary hover:text-danger hover:bg-danger/10 transition-colors"
                      title="Entfernen"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {pendingCount > 0 && (
        <div className="pt-1 space-y-2">
          {hasConflicts && (
            <p className="text-xs text-danger">
              Einige Entwuerfe haben Konflikte und werden ggf. abgelehnt.
            </p>
          )}
          <Button onClick={() => setConfirmOpen(true)} disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Buche...' : `Alle buchen (${pendingCount})`}
          </Button>
        </div>
      )}

      {/* Retry all failed */}
      {errorCount > 0 && !isSubmitting && (
        <button
          onClick={() => {
            for (const d of drafts) {
              if (d.status === 'error') retryDraft(d.draftId)
            }
          }}
          className="text-xs text-text-tertiary hover:text-brand transition-colors"
        >
          Alle fehlgeschlagenen zuruecksetzen
        </button>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Buchungen absenden?">
        <p className="text-sm text-text-secondary mb-4">
          {pendingCount} Buchung{pendingCount > 1 ? 'en' : ''} werden nacheinander gesendet.
          {hasConflicts && <span className="text-danger"> Einige haben Konflikte!</span>}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Abbrechen</Button>
          <Button onClick={() => { setConfirmOpen(false); submitAll(fetchAllBookings) }}>Absenden</Button>
        </div>
      </Dialog>
    </div>
  )
}

/** Always-visible horizontal tray for desktop */
export function DraftTray() {
  const drafts = usePlannerStore((s) => s.drafts)
  const removeDraft = usePlannerStore((s) => s.removeDraft)
  const editDraft = usePlannerStore((s) => s.editDraft)
  const retryDraft = usePlannerStore((s) => s.retryDraft)
  const submitAll = usePlannerStore((s) => s.submitAll)
  const clearCompleted = usePlannerStore((s) => s.clearCompleted)
  const isSubmitting = usePlannerStore((s) => s.isSubmitting)
  const { fields } = useFieldStore()
  const { allBookings, fetchAllBookings } = useBookingData()
  const conflicts = useDraftConflicts(drafts, allBookings)

  const [confirmOpen, setConfirmOpen] = useState(false)

  const pendingCount = drafts.filter((d) => d.status === 'pending').length
  const successCount = drafts.filter((d) => d.status === 'success').length
  const errorCount = drafts.filter((d) => d.status === 'error').length
  const hasConflicts = Array.from(conflicts.values()).some((c) => c.hasConflict)

  if (drafts.length === 0) return null

  function getSectionLabels(fieldId: number, sectionIds: number[]): string {
    const field = fields.find((f) => f.id === fieldId)
    if (!field) return sectionIds.join(', ')
    return sectionIds
      .map((id) => {
        const s = field.sections.find((sec) => sec.id === id)
        return s?.label ?? '?'
      })
      .join(', ')
  }

  return (
    <div className={`flex-shrink-0 border-t-2 ${
      errorCount > 0
        ? 'border-danger/80 bg-danger/[0.05]'
        : hasConflicts
          ? 'border-warning/60 bg-warning/[0.03]'
          : 'border-brand/60 bg-brand/[0.03]'
    }`}>
      <div className="flex items-center gap-4 px-5 py-3">
        {/* Label + badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${
            errorCount > 0 ? 'bg-danger animate-pulse'
              : hasConflicts ? 'bg-warning animate-pulse'
                : 'bg-brand'
          }`} />
          <span className="text-sm font-semibold text-text-primary">Entwuerfe</span>
          {pendingCount > 0 && (
            <span className="text-[10px] font-bold text-brand bg-brand/15 rounded-full px-1.5 py-0.5 tabular-nums">
              {pendingCount}
            </span>
          )}
          {errorCount > 0 && (
            <span className="text-[10px] font-bold text-danger bg-danger/15 rounded-full px-1.5 py-0.5 tabular-nums">
              {errorCount} Fehler
            </span>
          )}
          {hasConflicts && errorCount === 0 && (
            <span className="text-[10px] font-semibold text-warning bg-warning/10 rounded px-1.5 py-0.5">
              Konflikte
            </span>
          )}
        </div>

        {/* Horizontal draft cards */}
        <div className="flex-1 flex gap-2 overflow-x-auto py-0.5 min-w-0">
          {drafts.map((draft) => {
            const conflict = conflicts.get(draft.draftId)
            const isConflict = conflict?.hasConflict ?? false
            const color = draft.teamColor ?? '#6b7280'
            const isSuccess = draft.status === 'success'
            const isError = draft.status === 'error'
            const isSubmittingDraft = draft.status === 'submitting'
            const hasConflictSections = draft.conflictingSectionIds && draft.conflictingSectionIds.length > 0

            return (
              <div
                key={draft.draftId}
                className={`group flex-shrink-0 flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg border text-sm transition-all ${
                  isSuccess
                    ? 'bg-[#2ea04310] border-[#2ea04330]'
                    : isError
                      ? 'bg-danger/5 border-danger/30'
                      : isSubmittingDraft
                        ? 'bg-bg-elevated border-border-subtle animate-pulse'
                        : isConflict
                          ? 'bg-warning/5 border-warning/30'
                          : 'bg-bg-card border-border-subtle'
                }`}
              >
                {/* Team color dot */}
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      isSuccess ? '#2ea043'
                        : isError ? '#e5484d'
                          : isConflict ? '#db8b00'
                            : color,
                  }}
                />

                {/* Title + meta */}
                <div className="min-w-0 max-w-[200px]">
                  <div className="text-xs font-medium text-text-primary truncate">{draft.title}</div>
                  <div className="text-[10px] text-text-tertiary tabular-nums truncate">
                    {draft.occurrences.length > 1 ? `${draft.occurrences.length} Termine · ` : ''}
                    {formatDraftTime(draft.startTime)} · {draft.fieldName}
                  </div>
                  {/* Error detail inline */}
                  {isError && hasConflictSections && (
                    <div className="text-[10px] text-danger truncate">
                      Belegt: {getSectionLabels(draft.fieldId, draft.conflictingSectionIds!)}
                    </div>
                  )}
                  {isError && !hasConflictSections && draft.errorMessage && (
                    <div className="text-[10px] text-danger truncate">{draft.errorMessage}</div>
                  )}
                </div>

                {/* Status badge */}
                {isSuccess && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ea043" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}

                {/* Action buttons — visible on hover or always for errors */}
                <div className={`flex items-center gap-0.5 flex-shrink-0 ${
                  isError ? '' : 'opacity-0 group-hover:opacity-100'
                } transition-opacity`}>
                  {/* Edit */}
                  {(draft.status === 'pending' || draft.status === 'error') && (
                    <button
                      onClick={() => editDraft(draft.draftId)}
                      className="w-5 h-5 flex items-center justify-center rounded text-text-tertiary hover:text-brand hover:bg-brand/10 transition-colors"
                      title="Bearbeiten"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  {/* Retry */}
                  {isError && (
                    <button
                      onClick={() => retryDraft(draft.draftId)}
                      className="w-5 h-5 flex items-center justify-center rounded text-text-tertiary hover:text-brand hover:bg-brand/10 transition-colors"
                      title="Erneut versuchen"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                    </button>
                  )}
                  {/* Remove */}
                  {(draft.status === 'pending' || draft.status === 'error') && (
                    <button
                      onClick={() => removeDraft(draft.draftId)}
                      className="w-5 h-5 flex items-center justify-center rounded text-text-tertiary hover:text-danger hover:bg-danger/10 transition-colors"
                      title="Entfernen"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {successCount > 0 && (
            <button
              onClick={clearCompleted}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors whitespace-nowrap"
            >
              Erledigte entfernen
            </button>
          )}
          {errorCount > 0 && !isSubmitting && (
            <button
              onClick={() => {
                for (const d of drafts) {
                  if (d.status === 'error') retryDraft(d.draftId)
                }
              }}
              className="text-xs text-text-tertiary hover:text-brand transition-colors whitespace-nowrap"
            >
              Alle zuruecksetzen
            </button>
          )}
          {pendingCount > 0 && (
            <Button
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Buche...' : `Alle buchen (${pendingCount})`}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Buchungen absenden?">
        <p className="text-sm text-text-secondary mb-4">
          {pendingCount} Buchung{pendingCount > 1 ? 'en' : ''} werden nacheinander gesendet.
          {hasConflicts && (
            <span className="text-warning"> Einige haben moegliche Konflikte.</span>
          )}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Abbrechen</Button>
          <Button onClick={() => { setConfirmOpen(false); submitAll(fetchAllBookings) }}>
            Alle absenden
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

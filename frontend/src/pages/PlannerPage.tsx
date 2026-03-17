import { useMemo, useState } from 'react'
import { usePlannerStore } from '../stores/plannerStore'
import { useFieldStore } from '../stores/fieldStore'
import { useBookingData } from '../stores/bookingDataContext'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { getKW, addDays, formatShortDate, toLocalISO } from '../utils/date'
import { PlannerAvailability } from '../components/planner/PlannerAvailability'
import { PlannerWizard } from '../components/planner/PlannerWizard'
import { MobileDayOverview } from '../components/planner/MobileDayOverview'
import { DraftQueue, DraftTray } from '../components/planner/DraftQueue'

const DAY_LABELS_FULL = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const DAY_LABELS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function PlannerPage() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const { fields } = useFieldStore()
  const { allBookings } = useBookingData()

  const viewWeekStart = usePlannerStore((s) => s.viewWeekStart)
  const setViewWeekStart = usePlannerStore((s) => s.setViewWeekStart)
  const drafts = usePlannerStore((s) => s.drafts)
  const wizardOpen = usePlannerStore((s) => s.wizardOpen)
  const openWizard = usePlannerStore((s) => s.openWizard)

  const [activeDay, setActiveDay] = useState(0)
  const [draftFooterOpen, setDraftFooterOpen] = useState(false)

  const kw = useMemo(() => getKW(viewWeekStart), [viewWeekStart])
  const activeDate = useMemo(() => addDays(viewWeekStart, activeDay), [viewWeekStart, activeDay])
  const today = toLocalISO(new Date())

  const pendingCount = drafts.filter((d) => d.status === 'pending').length

  const navigateWeek = (delta: number) => {
    setViewWeekStart(addDays(viewWeekStart, delta * 7))
  }

  const handleSlotClick = (fieldId: number, date: string, startTime: string, endTime: string) => {
    openWizard({ fieldId, date, startTime, endTime })
  }

  const handleMobileSlotClick = (fieldId: number, startTime: string, endTime: string) => {
    openWizard({ fieldId, date: activeDate, startTime, endTime })
  }

  // --- Mobile layout ---
  if (isMobile) {
    return (
      <div className="h-full flex flex-col">
        {/* Compact toolbar: week + day chips */}
        <div className="flex-shrink-0 px-3 py-2 border-b border-border-subtle bg-bg-card">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigateWeek(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-elevated text-text-tertiary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-sm font-bold text-text-primary tabular-nums">KW {kw}</span>
            <button
              onClick={() => navigateWeek(1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-elevated text-text-tertiary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Day chips - horizontally scrollable */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {DAY_LABELS_SHORT.map((label, idx) => {
              const date = addDays(viewWeekStart, idx)
              const isActive = activeDay === idx
              const isToday = date === today
              return (
                <button
                  key={idx}
                  onClick={() => setActiveDay(idx)}
                  className={`flex-shrink-0 flex flex-col items-center px-2.5 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-brand text-text-on-brand'
                      : isToday
                        ? 'bg-brand/10 text-brand'
                        : 'text-text-secondary hover:bg-bg-elevated'
                  }`}
                >
                  <span className="text-xs font-semibold leading-none">{label}</span>
                  <span className={`text-[10px] leading-none mt-0.5 ${isActive ? 'text-text-on-brand/70' : 'text-text-tertiary'}`}>
                    {formatShortDate(date)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Day overview */}
        <div className="flex-1 overflow-hidden">
          <MobileDayOverview
            fields={fields}
            allBookings={allBookings}
            drafts={drafts}
            activeDate={activeDate}
            onSlotClick={handleMobileSlotClick}
            onFabClick={() => openWizard()}
          />
        </div>

        {/* Bottom bar: drafts toggle */}
        {pendingCount > 0 && !wizardOpen && (
          <div className="flex-shrink-0 border-t border-border-subtle bg-bg-card px-4 py-2">
            <button
              onClick={() => setDraftFooterOpen(!draftFooterOpen)}
              className="w-full flex items-center justify-between"
            >
              <span className="text-sm font-medium text-text-primary">
                Entwuerfe
                <span className="ml-2 text-xs font-bold text-brand bg-brand/15 rounded-full px-1.5 py-0.5 tabular-nums">
                  {pendingCount}
                </span>
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`text-text-tertiary transition-transform ${draftFooterOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {draftFooterOpen && (
              <div className="mt-2 max-h-[50vh] overflow-y-auto">
                <DraftQueue />
              </div>
            )}
          </div>
        )}

        {/* Wizard renders as fullscreen overlay via portal */}
        <PlannerWizard />
      </div>
    )
  }

  // --- Desktop / Tablet layout ---
  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-bg-card">
        {/* Week navigation */}
        <button
          onClick={() => navigateWeek(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-elevated text-text-tertiary hover:text-text-primary transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="min-w-[72px] text-center">
          <span className="text-lg font-bold text-text-primary tabular-nums">KW {kw}</span>
        </div>
        <button
          onClick={() => navigateWeek(1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-elevated text-text-tertiary hover:text-text-primary transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div className="w-px h-5 bg-border-subtle mx-2" />

        {/* Day tabs */}
        <div className="flex gap-1">
          {DAY_LABELS_SHORT.map((label, idx) => {
            const date = addDays(viewWeekStart, idx)
            const isActive = activeDay === idx
            const isToday = date === today
            const hasDrafts = drafts.some(
              (d) =>
                d.status !== 'success' &&
                d.occurrences.some((o) => o.start.slice(0, 10) === date),
            )

            let bookingCount = 0
            for (const [, bookings] of allBookings) {
              bookingCount += bookings.filter((b) => b.startTime.slice(0, 10) === date).length
            }

            return (
              <button
                key={idx}
                onClick={() => setActiveDay(idx)}
                className={`relative flex flex-col items-center px-3 py-1 rounded-lg transition-all ${
                  isActive
                    ? 'bg-brand text-text-on-brand shadow-[0_2px_8px_rgba(var(--brand-rgb,46,160,67),0.3)]'
                    : isToday
                      ? 'bg-brand/10 text-brand hover:bg-brand/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                }`}
              >
                <span className="text-xs font-semibold leading-none">{label}</span>
                <span className={`text-[10px] leading-none mt-0.5 ${isActive ? 'text-text-on-brand/70' : 'text-text-tertiary'}`}>
                  {formatShortDate(date)}
                </span>
                {hasDrafts && !isActive && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand ring-2 ring-bg-card" />
                )}
                {bookingCount > 0 && !isActive && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-px">
                    {Array.from({ length: Math.min(bookingCount, 3) }).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-text-tertiary" />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Active day label + new button */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-text-tertiary">
            {DAY_LABELS_FULL[activeDay]}, {formatShortDate(activeDate)}
            {activeDate === today && (
              <span className="ml-2 text-xs text-brand font-medium">Heute</span>
            )}
          </span>
          <button
            onClick={() => openWizard()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-text-on-brand text-sm font-medium hover:bg-brand-hover transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Neu
          </button>
        </div>
      </div>

      {/* Main content: grid + wizard panel */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <PlannerAvailability
              fields={fields}
              allBookings={allBookings}
              drafts={drafts}
              activeDate={activeDate}
              onSlotClick={handleSlotClick}
            />
          </div>

          {/* Draft tray (desktop) — always visible when drafts exist */}
          <DraftTray />
        </div>

        {/* Wizard panel (desktop: inline, tablet: slide-over via PlannerWizard) */}
        {wizardOpen && isDesktop && (
          <div className="flex-shrink-0 w-[380px]">
            <PlannerWizard />
          </div>
        )}
      </div>

      {/* Tablet wizard (slide-over, rendered by PlannerWizard itself) */}
      {!isDesktop && <PlannerWizard />}
    </div>
  )
}

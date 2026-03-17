import { useEffect, useRef } from 'react'
import { usePlannerStore } from '../../stores/plannerStore'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { WizardStepIndicator } from './WizardStepIndicator'
import { WizardStepBasics } from './WizardStepBasics'
import { WizardStepDateTime } from './WizardStepDateTime'
import { WizardStepSchedule } from './WizardStepSchedule'
import { WizardStepFieldZone } from './WizardStepFieldZone'
import { WizardStepConfirm } from './WizardStepConfirm'
import { WizardStepReview } from './WizardStepReview'

const QUICK_LABELS = ['Was', 'Wann & Wo', 'Pruefen']
const SEASON_LABELS = ['Was', 'Wann', 'Wo', 'Uebersicht']

export function PlannerWizard() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1279px)')

  const wizardOpen = usePlannerStore((s) => s.wizardOpen)
  const wizardPath = usePlannerStore((s) => s.wizardPath)
  const wizardStep = usePlannerStore((s) => s.wizardStep)
  const closeWizard = usePlannerStore((s) => s.closeWizard)
  const editingDraftId = usePlannerStore((s) => s.editingDraftId)

  const totalSteps = wizardPath === 'quick' ? 3 : 4
  const labels = wizardPath === 'quick' ? QUICK_LABELS : SEASON_LABELS

  const contentRef = useRef<HTMLDivElement>(null)

  // Scroll to top on step change
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
  }, [wizardStep])

  if (!wizardOpen) return null

  const stepContent = renderStep(wizardPath, wizardStep)

  // Mobile: fullscreen overlay
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-base flex flex-col animate-slide-in-bottom">
        <WizardHeader
          labels={labels}
          totalSteps={totalSteps}
          currentStep={wizardStep}
          onClose={closeWizard}
          isEditing={!!editingDraftId}
        />
        <div ref={contentRef} className="flex-1 overflow-y-auto px-4 pb-4">
          {stepContent}
        </div>
      </div>
    )
  }

  // Tablet: slide-over with backdrop
  if (isTablet) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/50" onClick={closeWizard} />
        <div className="fixed top-0 right-0 bottom-0 z-50 w-[400px] bg-bg-nav border-l border-border-subtle flex flex-col animate-slide-in-right shadow-xl">
          <WizardHeader
            labels={labels}
            totalSteps={totalSteps}
            currentStep={wizardStep}
            onClose={closeWizard}
            isEditing={!!editingDraftId}
          />
          <div ref={contentRef} className="flex-1 overflow-y-auto px-4 pb-4">
            {stepContent}
          </div>
        </div>
      </>
    )
  }

  // Desktop: inline panel (rendered by parent as flex child)
  return (
    <div className="h-full flex flex-col bg-bg-nav border-l border-border-subtle">
      <WizardHeader
        labels={labels}
        totalSteps={totalSteps}
        currentStep={wizardStep}
        onClose={closeWizard}
        isEditing={!!editingDraftId}
      />
      <div ref={contentRef} className="flex-1 overflow-y-auto px-4 pb-4">
        {stepContent}
      </div>
    </div>
  )
}

function WizardHeader({
  labels,
  totalSteps,
  currentStep,
  onClose,
  isEditing,
}: {
  labels: string[]
  totalSteps: number
  currentStep: number
  onClose: () => void
  isEditing: boolean
}) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border-subtle">
      <div className="flex items-center gap-3">
        {isEditing && (
          <span className="text-[10px] font-semibold text-warning bg-warning/10 rounded px-1.5 py-0.5 uppercase tracking-wider">
            Bearbeiten
          </span>
        )}
        <WizardStepIndicator totalSteps={totalSteps} currentStep={currentStep} labels={labels} />
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

function renderStep(path: 'quick' | 'season', step: number) {
  if (path === 'quick') {
    switch (step) {
      case 0: return <WizardStepBasics />
      case 1: return <WizardStepDateTime />
      case 2: return <WizardStepConfirm />
    }
  } else {
    switch (step) {
      case 0: return <WizardStepBasics />
      case 1: return <WizardStepSchedule />
      case 2: return <WizardStepFieldZone />
      case 3: return <WizardStepReview />
    }
  }
  return null
}

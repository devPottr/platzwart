interface WizardStepIndicatorProps {
  totalSteps: number
  currentStep: number
  labels?: string[]
}

export function WizardStepIndicator({ totalSteps, currentStep, labels }: WizardStepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const isActive = i === currentStep
        const isDone = i < currentStep
        return (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`w-6 h-px ${isDone ? 'bg-brand' : 'bg-border-subtle'}`} />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-brand text-text-on-brand'
                    : isDone
                      ? 'bg-brand/20 text-brand'
                      : 'bg-bg-elevated text-text-tertiary'
                }`}
              >
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {labels?.[i] && (
                <span className={`text-xs font-medium hidden sm:inline ${
                  isActive ? 'text-text-primary' : isDone ? 'text-brand' : 'text-text-tertiary'
                }`}>
                  {labels[i]}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

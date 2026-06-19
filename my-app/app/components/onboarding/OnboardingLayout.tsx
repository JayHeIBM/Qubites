interface OnboardingLayoutProps {
  step: number       // 1-based current step
  totalSteps: number
  children: React.ReactNode
}

/**
 * OnboardingLayout
 * Provides the full-screen centred shell used across all onboarding steps.
 * Renders a labelled progress bar at the top of the card.
 */
export default function OnboardingLayout({
  step,
  totalSteps,
  children,
}: OnboardingLayoutProps) {
  const pct = Math.round((step / totalSteps) * 100)

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-orange-600 to-orange-800">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs sm:max-w-sm md:max-w-md flex flex-col overflow-hidden">
        {/* Progress bar */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide">
              Step {step} of {totalSteps}
            </span>
            <span className="text-xs text-gray-400">{pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: step === totalSteps ? '#2da44e' : '#ea580c',
              }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 pb-6 flex flex-col gap-5 flex-1">
          {children}
        </div>
      </div>
    </main>
  )
}

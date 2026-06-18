import QubitesBrand from '../QubitesBrand'

interface WelcomeStepProps {
  onNext: () => void
}

/**
 * WelcomeStep — Step 1 of 5
 * Introduces the app and prompts the user to begin onboarding.
 */
export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <>
      {/* Brand mark */}
      <div className="flex justify-center pt-2">
        <QubitesBrand />
      </div>

      {/* Pitch copy */}
      <p className="text-sm text-gray-500 text-center leading-relaxed -mt-2">
        Help reduce food waste on campus by sharing and claiming meals posted
        by your colleagues.
      </p>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-semibold py-3 rounded-xl text-sm shadow-md"
      >
        Get Started
      </button>
    </>
  )
}

interface DoneStepProps {
  onFinish: () => void
  saving?: boolean
}

/**
 * DoneStep — Step 5 of 5
 * Confirms that onboarding is complete.
 */
export default function DoneStep({ onFinish, saving = false }: DoneStepProps) {
  return (
    <>
      {/* Success icon */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 13l4 4L19 7"
              stroke="#2da44e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800">You&apos;re all set!</h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed">
          Your allergens, restrictions, and preferences have been saved. You
          can update them anytime from your profile.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onFinish}
        disabled={saving}
        className="w-full bg-green-600 hover:bg-green-700 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed transition-all text-white font-semibold py-3 rounded-xl text-sm shadow-md"
      >
        {saving ? 'Saving…' : 'Go to Home'}
      </button>
    </>
  )
}

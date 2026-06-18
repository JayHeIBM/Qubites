'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { allergyColumns, dietaryRestrictionColumns, cuisineColumns } from '@/lib/preferences'

import OnboardingLayout from '../components/onboarding/OnboardingLayout'
import WelcomeStep from '../components/onboarding/WelcomeStep'
import ChecklistStep from '../components/onboarding/ChecklistStep'
import DoneStep from '../components/onboarding/DoneStep'

const TOTAL_STEPS = 5

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Selections for each checklist step
  const [allergens, setAllergens] = useState<Set<string>>(new Set())
  const [restrictions, setRestrictions] = useState<Set<string>>(new Set())
  const [preferences, setPreferences] = useState<Set<string>>(new Set())

  function next() {
    setStep((s) => s + 1)
  }

  function finish() {
    // TODO: persist selections to user profile when auth is implemented
    router.push('/home') // routes to app/(main)/home
  }

  return (
    <OnboardingLayout step={step} totalSteps={TOTAL_STEPS}>
      {step === 1 && <WelcomeStep onNext={next} />}

      {step === 2 && (
        <ChecklistStep
          title="Allergens"
          subtitle="Select all allergens that apply to you. You will be excluded from raffles for foods containing these — and gain +1 pity each time."
          items={allergyColumns}
          selected={allergens}
          onChange={setAllergens}
          accentBg="bg-orange-500"
          onNext={next}
        />
      )}

      {step === 3 && (
        <ChecklistStep
          title="Dietary Restrictions"
          subtitle="Select your dietary or cultural restrictions. You will be excluded from raffles for foods that don't comply — and gain +1 pity each time."
          items={dietaryRestrictionColumns}
          selected={restrictions}
          onChange={setRestrictions}
          accentBg="bg-purple-500"
          onNext={next}
        />
      )}

      {step === 4 && (
        <ChecklistStep
          title="Preferences"
          subtitle="Choose the types of food you enjoy. You'll receive +1 bonus raffle ticket for any listing that matches a preference."
          items={cuisineColumns}
          selected={preferences}
          onChange={setPreferences}
          accentBg="bg-green-500"
          onNext={next}
        />
      )}

      {step === 5 && <DoneStep onFinish={finish} />}
    </OnboardingLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { allergyColumns, dietaryRestrictionColumns, cuisineColumns } from '@/lib/preferences'
import { MOCK_MY_LISTINGS } from '@/app/components/food/fixtures'

import Step1BasicDetails from '@/app/components/add/Step1BasicDetails'
import Step2TagVerification from '@/app/components/add/Step2TagVerification'

import {
  EMPTY_FORM,
  simulateAiSuggestions,
  buildCopiedTagConfirmation,
  type NewListingForm,
  type TagConfirmation,
  type TagState,
} from '@/app/components/add/formState'

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressHeader({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">
          Step {step} of 2
        </span>
        <span className="text-xs text-gray-400">{step === 1 ? 'Basic details' : 'Review tags'}</span>
      </div>
      <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: step === 1 ? '50%' : '100%' }}
        />
      </div>
    </div>
  )
}

// ── Initial tag state ─────────────────────────────────────────────────────────

function emptyTagConfirmation(): TagConfirmation {
  const none = (keys: readonly string[]) =>
    Object.fromEntries(keys.map(k => [k, 'none' as TagState]))
  return {
    allergens:    none(allergyColumns),
    restrictions: none(dietaryRestrictionColumns),
    preferences:  none(cuisineColumns),
  }
}

// ── Inner component (needs useSearchParams) ───────────────────────────────────

function NewListingInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const copyFromId = searchParams.get('copyFrom')

  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<NewListingForm>(EMPTY_FORM)
  const [tags, setTags] = useState<TagConfirmation>(emptyTagConfirmation)
  const [isCopied, setIsCopied] = useState(false)

  // Pre-fill form + tags if a copyFrom id is present
  useEffect(() => {
    if (!copyFromId) return
    const source = MOCK_MY_LISTINGS.find(l => l.id === copyFromId)
    if (!source) return

    setForm({
      type: source.type,
      title: source.title,
      portions: String(source.portionsTotal),
      availableUntil: '',      // expiry is intentionally not copied — must be set fresh
      location: source.location,
      description: source.description ?? '',
      imageFile: null,
      imagePreviewUrl: null,   // image not copied — user must re-upload
    })

    setTags(buildCopiedTagConfirmation(
      source.tags,
      allergyColumns,
      dietaryRestrictionColumns,
      cuisineColumns,
    ))
    setIsCopied(true)
  }, [copyFromId])

  function patchForm(patch: Partial<NewListingForm>) {
    setForm(prev => ({ ...prev, ...patch }))
  }

  function handleAdvanceToStep2() {
    // If not a copy, run AI suggestion simulation
    if (!isCopied) {
      const aiTags = simulateAiSuggestions(
        form.title,
        form.description,
        allergyColumns,
        dietaryRestrictionColumns,
        cuisineColumns,
      )
      setTags(aiTags)
    }
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleTag(groupKey: keyof TagConfirmation, tagKey: string) {
    setTags(prev => {
      const current = prev[groupKey][tagKey] ?? 'none'
      // Cycle: none → confirmed → none   |   ai → confirmed → none
      const next: TagState = current === 'confirmed' ? 'none' : 'confirmed'
      return {
        ...prev,
        [groupKey]: { ...prev[groupKey], [tagKey]: next },
      }
    })
  }

  function handleSubmit() {
    // TODO: POST to backend with form data + confirmed tags when API is ready
    console.log('Submitting listing:', { form, tags })
    router.push('/add')
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-8">

      {/* Back nav */}
      <button
        type="button"
        onClick={() => step === 2 ? setStep(1) : router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {step === 2 ? 'Back to details' : 'My listings'}
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {isCopied ? 'Copy listing' : 'New listing'}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {step === 1 ? 'Fill in the basic details' : 'Confirm the AI-suggested tags'}
        </p>
      </div>

      <ProgressHeader step={step} />

      {step === 1 && (
        <Step1BasicDetails
          form={form}
          onChange={patchForm}
          onNext={handleAdvanceToStep2}
        />
      )}

      {step === 2 && (
        <Step2TagVerification
          tags={tags}
          allergyKeys={allergyColumns}
          restrictionKeys={dietaryRestrictionColumns}
          preferenceKeys={cuisineColumns}
          onToggle={toggleTag}
          onBack={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          onSubmit={handleSubmit}
          isCopied={isCopied}
        />
      )}
    </div>
  )
}

// ── Page — Suspense boundary required for useSearchParams ─────────────────────

export default function NewListingPage() {
  return (
    <Suspense>
      <NewListingInner />
    </Suspense>
  )
}

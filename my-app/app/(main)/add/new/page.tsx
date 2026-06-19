'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'

import { allergyColumns, dietaryRestrictionColumns, cuisineColumns } from '@/lib/preferences'

import Step1BasicDetails from '@/app/components/add/Step1BasicDetails'
import Step2TagVerification from '@/app/components/add/Step2TagVerification'

import {
  makeEmptyForm,
  defaultExpiry,
  fetchAiSuggestions,
  buildCopiedTagConfirmation,
  emptyTagConfirmation,
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

// ── Loading skeleton for tag step ─────────────────────────────────────────────

function TagLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-14 rounded-xl bg-blue-50 border border-blue-100" />
      {['Allergens', 'Dietary Restrictions', 'Preferences / Cuisine'].map(title => (
        <div key={title} className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="h-4 w-16 rounded bg-blue-100" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 rounded-full bg-blue-100" style={{ width: `${52 + i * 14}px` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── API row shape from /api/chef/meals ────────────────────────────────────────

interface ChefMealRow {
  id: string
  name: string
  quantity: number
  description: string | null
  expiresAt: string | null
  foodItem: {
    cuisines: string[]
    dietaryTags: string[]
    allergens: string[]
  } | null
}

// ── Inner component (uses useSearchParams) ────────────────────────────────────

function NewListingInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const copyFromId   = searchParams.get('copyFrom')

  const [step, setStep]           = useState<1 | 2>(1)
  const [form, setForm]           = useState<NewListingForm>(makeEmptyForm)
  const [tags, setTags]           = useState<TagConfirmation>(() =>
    emptyTagConfirmation(allergyColumns, dietaryRestrictionColumns, cuisineColumns)
  )
  const [isCopied, setIsCopied]         = useState(false)
  const [tagsLoading, setTagsLoading]   = useState(false)
  const [tagsError, setTagsError]       = useState<string | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)

  // ── Load current user's chefId ──────────────────────────────────────────────
  const [chefId, setChefId] = useState<string | null>(null)

  useEffect(() => {
    async function loadChefId() {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        const slackId = authUser.user_metadata?.slack_id as string | undefined
        if (!slackId) return

        const res = await fetch('/api/users')
        const users = (await res.json()) as Array<{ id: string; slackId: string }>
        const me = users.find((u) => u.slackId === slackId)
        if (me) setChefId(me.id)
      } catch {
        // silently ignore — submit will surface the error
      }
    }
    loadChefId()
  }, [])

  // ── Copy pre-fill — fetch real food item from backend ──────────────────────
  useEffect(() => {
    if (!copyFromId) return

    async function fetchCopySource() {
      try {
        // copyFromId is the food_availability id; fetch via chef meals to get tags
        const res = await fetch(`/api/chef/meals`)
        const data = (await res.json()) as { meals: ChefMealRow[] }
        const source = data.meals?.find((m: ChefMealRow) => m.id === copyFromId)
        if (!source) return

        setForm({
          type: 'leftover',
          title: source.name,
          portions: String(source.quantity),
          availableUntil: defaultExpiry(),
          location: '',
          description: source.description ?? '',
          imageFile: null,
          imagePreviewUrl: null,
        })

        // Build copied tag confirmation from foodItem tags
        if (source.foodItem) {
          const copiedTags = [
            ...source.foodItem.allergens.map((a) => ({
              label: a.replace(/_/g, ' '),
              kind: 'allergen' as const,
            })),
            ...source.foodItem.dietaryTags.map((r) => ({
              label: r.replace(/_/g, ' '),
              kind: 'restriction' as const,
            })),
            ...source.foodItem.cuisines.map((c) => ({
              label: c.replace(/_/g, ' '),
              kind: 'preference' as const,
            })),
          ]
          setTags(
            buildCopiedTagConfirmation(copiedTags, allergyColumns, dietaryRestrictionColumns, cuisineColumns)
          )
        }

        setIsCopied(true)
      } catch (err) {
        console.error('[new listing] Failed to fetch copy source:', err)
      }
    }

    fetchCopySource()
  }, [copyFromId])

  // ── Patch helper ────────────────────────────────────────────────────────────
  function patchForm(patch: Partial<NewListingForm>) {
    setForm(prev => ({ ...prev, ...patch }))
  }

  // ── Advance to Step 2 — call Ollama (unless it's a copy) ───────────────────
  async function handleAdvanceToStep2() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setStep(2)
    setTagsError(null)

    if (isCopied) return

    setTagsLoading(true)
    try {
      const aiTags = await fetchAiSuggestions(
        form.title,
        form.description,
        allergyColumns,
        dietaryRestrictionColumns,
        cuisineColumns,
      )
      setTags(aiTags)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setTagsError(`Could not reach the AI model — ${msg}. You can still tag manually.`)
      setTags(emptyTagConfirmation(allergyColumns, dietaryRestrictionColumns, cuisineColumns))
    } finally {
      setTagsLoading(false)
    }
  }

  // ── Tag toggle ──────────────────────────────────────────────────────────────
  function toggleTag(groupKey: keyof TagConfirmation, tagKey: string) {
    setTags(prev => {
      const current = prev[groupKey][tagKey] ?? 'none'
      const next: TagState = current === 'confirmed' ? 'none' : 'confirmed'
      return {
        ...prev,
        [groupKey]: { ...prev[groupKey], [tagKey]: next },
      }
    })
  }

  // ── Submit — POST to /api/chef/meals ────────────────────────────────────────
  async function handleSubmit() {
    setSubmitError(null)

    if (!chefId) {
      setSubmitError('You must be signed in to create a listing.')
      return
    }

    const confirmedAllergens    = allergyColumns.filter((k) => tags.allergens[k] === 'confirmed')
    const confirmedRestrictions = dietaryRestrictionColumns.filter((k) => tags.restrictions[k] === 'confirmed')
    const confirmedCuisines     = cuisineColumns.filter((k) => tags.preferences[k] === 'confirmed')

    const portions = parseInt(form.portions, 10)
    if (!Number.isInteger(portions) || portions <= 0) {
      setSubmitError('Portions must be a positive number.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/chef/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chefId,
          name: form.title,
          description: form.description || null,
          quantity: portions,
          cuisines: confirmedCuisines,
          dietaryTags: confirmedRestrictions,
          allergens: confirmedAllergens,
          expiresAt: form.availableUntil
            ? new Date(form.availableUntil).toISOString()
            : null,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        setSubmitError(body.error ?? 'Failed to create listing.')
        return
      }

      router.push('/add')
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-8">

      {/* Back nav */}
      <button
        type="button"
        onClick={() => step === 2 ? (setStep(1), window.scrollTo({ top: 0, behavior: 'smooth' })) : router.back()}
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
        <>
          {/* Error banners */}
          {tagsError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-800">
              <span className="flex-shrink-0 font-bold">⚠</span>
              <span>{tagsError}</span>
            </div>
          )}
          {submitError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
              <span className="flex-shrink-0 font-bold">✕</span>
              <span>{submitError}</span>
            </div>
          )}

          {tagsLoading ? (
            <TagLoadingSkeleton />
          ) : (
            <Step2TagVerification
              tags={tags}
              allergyKeys={allergyColumns}
              restrictionKeys={dietaryRestrictionColumns}
              preferenceKeys={cuisineColumns}
              onToggle={toggleTag}
              onBack={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              onSubmit={handleSubmit}
              isCopied={isCopied}
              submitting={submitting}
            />
          )}
        </>
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

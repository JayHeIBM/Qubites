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

function ProgressHeader({ step }: { step: 1 | 2 | 3 }) {
  const labels = ['Basic details', 'Review tags', 'Run assignments']
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">
          Step {step} of 3
        </span>
        <span className="text-xs text-gray-400">{labels[step - 1]}</span>
      </div>
      <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${(step / 3) * 100}%` }}
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

// ── Step 3 — Run assignments ──────────────────────────────────────────────────

interface AssignmentResult {
  userId: string
  userName: string | null
  slackId: string
  foodName: string
  slackSent: boolean
  slackError: string | null
}

interface Step3Props {
  mealName: string
  availabilityId: string
  onDone: () => void
}

function Step3RunAssignments({ mealName, availabilityId, onDone }: Step3Props) {
  const [running, setRunning] = useState(false)
  const [ran, setRan] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<AssignmentResult[]>([])

  async function handleRun() {
    setRunning(true)
    setApiError(null)
    setAssignments([])
    try {
      const res = await fetch('/api/assignments/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availabilityId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.error ?? 'Unknown error.')
        return
      }
      setAssignments(data.assignments ?? [])
      setRan(true)
    } catch {
      setApiError('Network error. Please try again.')
    } finally {
      setRunning(false)
    }
  }

  const slackOk = assignments.filter(a => a.slackSent).length
  const slackFail = assignments.filter(a => !a.slackSent).length

  return (
    <div className="flex flex-col gap-5">

      {/* Meal created confirmation */}
      <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3.5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-green-600 mt-0.5" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-green-800">"{mealName}" is live!</p>
          <p className="text-xs text-green-700 mt-0.5">The meal has been created and is marked as available.</p>
        </div>
      </div>

      {/* Explanation — hidden once ran */}
      {!ran && (
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-1">Notify matched employees</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Run the raffle to match eligible employees to this meal based on their dietary
            preferences and allergies. Each matched employee will receive a personal Slack DM
            with a claim link.
          </p>
        </div>
      )}

      {/* API error */}
      {apiError && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span className="font-bold flex-shrink-0">✕</span>
          <span>{apiError}</span>
        </div>
      )}

      {/* Results log */}
      {ran && (
        <div className="flex flex-col gap-3">
          {/* Summary */}
          <div className={`rounded-xl border px-4 py-3 text-sm ${
            assignments.length === 0
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : slackFail === 0
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-orange-50 border-orange-200 text-orange-800'
          }`}>
            {assignments.length === 0
              ? 'No eligible employees matched this meal\'s dietary filters.'
              : `${assignments.length} employee${assignments.length !== 1 ? 's' : ''} matched — ${slackOk} Slack DM${slackOk !== 1 ? 's' : ''} sent${slackFail > 0 ? `, ${slackFail} failed` : ''}.`
            }
          </div>

          {/* Per-user rows */}
          {assignments.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              {assignments.map((a, i) => (
                <div
                  key={a.userId}
                  className={`flex items-center gap-3 px-4 py-3 text-sm ${i > 0 ? 'border-t border-gray-100' : ''}`}
                >
                  {/* Status icon */}
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    a.slackSent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {a.slackSent ? '✓' : '✕'}
                  </span>

                  {/* Name + Slack ID */}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-900">{a.userName ?? 'Unknown'}</span>
                    <span className="text-gray-400 ml-2 text-xs font-mono">{a.slackId}</span>
                  </div>

                  {/* Slack status */}
                  <span className={`flex-shrink-0 text-xs font-medium ${
                    a.slackSent ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {a.slackSent ? 'DM sent' : a.slackError ?? 'DM failed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Run button — hidden once ran successfully with assignments */}
      {!(ran && assignments.length > 0 && slackFail === 0) && (
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 active:scale-95 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-sm"
        >
          {running ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" />
              </svg>
              Running raffle…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 3l14 9-14 9V3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" />
              </svg>
              {ran ? 'Run again' : 'Run raffle & notify employees'}
            </>
          )}
        </button>
      )}

      {/* Done / Skip */}
      <button
        type="button"
        onClick={onDone}
        className="w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
      >
        {ran ? 'Done' : 'Skip for now'}
      </button>
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

  const [step, setStep]           = useState<1 | 2 | 3>(1)
  const [form, setForm]           = useState<NewListingForm>(makeEmptyForm)
  const [tags, setTags]           = useState<TagConfirmation>(() =>
    emptyTagConfirmation(allergyColumns, dietaryRestrictionColumns, cuisineColumns)
  )
  const [isCopied, setIsCopied]         = useState(false)
  const [tagsLoading, setTagsLoading]   = useState(false)
  const [tagsError, setTagsError]       = useState<string | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)

  // Set after meal is created — used by step 3
  const [createdMealName, setCreatedMealName]           = useState('')
  const [createdAvailabilityId, setCreatedAvailabilityId] = useState('')

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

        const res = await fetch(`/api/users?slackId=${encodeURIComponent(slackId)}`)
        if (!res.ok) return
        const me = (await res.json()) as { id: string; slackId: string }
        setChefId(me.id)
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
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        const slackId = authUser?.user_metadata?.slack_id as string | undefined
        const chefIdRes = slackId
          ? await fetch(`/api/users?slackId=${encodeURIComponent(slackId)}`)
          : null
        const chefUser = chefIdRes?.ok
          ? (await chefIdRes.json()) as { id: string }
          : null

        const url = chefUser
          ? `/api/chef/meals?chefId=${encodeURIComponent(chefUser.id)}`
          : `/api/chef/meals`
        const res = await fetch(url)
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

  function patchForm(patch: Partial<NewListingForm>) {
    setForm(prev => ({ ...prev, ...patch }))
  }

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

  // ── Submit — POST to /api/chef/meals, then advance to step 3 ────────────────
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
      // ── Upload image to Supabase Storage if one was selected ──────────────
      let imageUrl: string | null = null
      if (form.imageFile) {
        const supabase = createClient()
        const ext = form.imageFile.name.split('.').pop() ?? 'jpg'
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('food-images')
          .upload(path, form.imageFile, { contentType: form.imageFile.type, upsert: false })
        if (uploadError) {
          setSubmitError(`Image upload failed: ${uploadError.message}`)
          setSubmitting(false)
          return
        }
        const { data: urlData } = supabase.storage.from('food-images').getPublicUrl(path)
        imageUrl = urlData.publicUrl
        // Store the URL back into form so Step1 can display it
        patchForm({ imagePreviewUrl: imageUrl })
      }

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
          imageUrl,
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

      const created = await res.json()
      // `created.id` is the food_availability row id
      setCreatedMealName(form.title)
      setCreatedAvailabilityId(created.id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setStep(3)
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-8">

      {/* Back nav — hidden on step 3 */}
      {step !== 3 && (
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
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {step === 3 ? 'Meal created' : isCopied ? 'Copy listing' : 'New listing'}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {step === 1 ? 'Fill in the basic details'
            : step === 2 ? 'Confirm the AI-suggested tags'
            : 'Notify matched employees'}
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

      {step === 3 && (
        <Step3RunAssignments
          mealName={createdMealName}
          availabilityId={createdAvailabilityId}
          onDone={() => router.push('/add')}
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

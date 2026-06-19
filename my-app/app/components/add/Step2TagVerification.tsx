'use client'

import { useState } from 'react'
import type { TagConfirmation, TagState } from './formState'

// ── Helpers ───────────────────────────────────────────────────────────────────

function toLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Tag button ────────────────────────────────────────────────────────────────

interface TagButtonProps {
  tagKey: string
  state: TagState
  /** Visually muted — used for non-suggested tags */
  muted?: boolean
  onToggle: () => void
}

function TagButton({ tagKey, state, muted = false, onToggle }: TagButtonProps) {
  const label = toLabel(tagKey)

  let cls: string
  if (state === 'confirmed') {
    cls = 'bg-green-50 border-green-500 text-green-700 font-semibold'
  } else if (state === 'ai') {
    cls = 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
  } else if (muted) {
    cls = 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-white'
  } else {
    cls = 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
  }

  const icon =
    state === 'confirmed' ? (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path d="M2 5l2 2.5L8 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : state === 'ai' ? (
      // Unfilled checkbox icon — "suggested, tap to confirm"
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ) : null

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all active:scale-95 ${cls}`}
    >
      {icon}
      {label}
    </button>
  )
}

// ── Tag group ─────────────────────────────────────────────────────────────────

interface TagGroupProps {
  title: string
  groupKey: keyof TagConfirmation
  keys: readonly string[]
  state: Record<string, TagState>
  onToggle: (groupKey: keyof TagConfirmation, tagKey: string) => void
}

function TagGroup({ title, groupKey, keys, state, onToggle }: TagGroupProps) {
  const [showOthers, setShowOthers] = useState(false)

  const suggested = keys.filter(k => state[k] === 'ai' || state[k] === 'confirmed')
  const others    = keys.filter(k => state[k] === 'none')

  // If a previously-'none' tag gets confirmed, it moves into suggested visually
  // But we keep `others` as all non-(ai|confirmed) for the collapsed section
  const confirmedCount = keys.filter(k => state[k] === 'confirmed').length
  const aiCount        = keys.filter(k => state[k] === 'ai').length
  const hasAnySuggested = suggested.length > 0

  return (
    <div className="flex flex-col gap-2.5">

      {/* Group header */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-600">{title}</span>
        {aiCount > 0 && (
          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">
            {aiCount} suggested
          </span>
        )}
        {confirmedCount > 0 && (
          <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-semibold">
            {confirmedCount} confirmed
          </span>
        )}
      </div>

      {/* AI-suggested + confirmed tags */}
      {hasAnySuggested ? (
        <div className="flex flex-wrap gap-1.5">
          {suggested.map(k => (
            <TagButton
              key={k}
              tagKey={k}
              state={state[k]}
              onToggle={() => onToggle(groupKey, k)}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">No tags suggested for this category.</p>
      )}

      {/* Collapsible "other tags" section */}
      {others.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowOthers(v => !v)}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors mb-1.5"
          >
            <svg
              width="10" height="10" viewBox="0 0 24 24" fill="none"
              className={`transition-transform ${showOthers ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {showOthers ? 'Hide' : 'Show'} other tags ({others.length})
          </button>

          {showOthers && (
            <div className="flex flex-wrap gap-1.5">
              {others.map(k => (
                <TagButton
                  key={k}
                  tagKey={k}
                  state={state[k]}
                  muted
                  onToggle={() => onToggle(groupKey, k)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Step 2 component ──────────────────────────────────────────────────────────

interface Step2Props {
  tags: TagConfirmation
  allergyKeys:      readonly string[]
  restrictionKeys:  readonly string[]
  preferenceKeys:   readonly string[]
  onToggle: (groupKey: keyof TagConfirmation, tagKey: string) => void
  onBack: () => void
  onSubmit: () => void
  /** True when form was pre-filled from a copied listing */
  isCopied: boolean
  /** True while the listing is being submitted to the backend */
  submitting?: boolean
}

export default function Step2TagVerification({
  tags,
  allergyKeys,
  restrictionKeys,
  preferenceKeys,
  onToggle,
  onBack,
  onSubmit,
  isCopied,
  submitting = false,
}: Step2Props) {
  return (
    <div className="flex flex-col gap-6">

      {/* ── Instruction banner ── */}
      <div className={`rounded-xl px-4 py-3 text-sm border leading-relaxed ${
        isCopied
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-blue-50 border-blue-200 text-blue-800'
      }`}>
        {isCopied ? (
          <>
            <strong>Copied from a previous listing.</strong> Previously confirmed tags are pre-checked
            in green. Edit as needed — expand any category to add or remove tags.
          </>
        ) : (
          <>
            <strong>AI reviewed your title and description.</strong> Suggested tags appear first in
            blue — tap to confirm (turns green). Expand any category to add unlisted tags.
            Unconfirmed suggestions are discarded on submit.
          </>
        )}
      </div>

      {/* ── Tag groups ── */}
      <div className="flex flex-col gap-6 divide-y divide-gray-100">
        <TagGroup
          title="Allergens"
          groupKey="allergens"
          keys={allergyKeys}
          state={tags.allergens}
          onToggle={onToggle}
        />
        <div className="pt-4">
          <TagGroup
            title="Dietary Restrictions"
            groupKey="restrictions"
            keys={restrictionKeys}
            state={tags.restrictions}
            onToggle={onToggle}
          />
        </div>
        <div className="pt-4">
          <TagGroup
            title="Preferences / Cuisine"
            groupKey="preferences"
            keys={preferenceKeys}
            state={tags.preferences}
            onToggle={onToggle}
          />
        </div>
      </div>

      {/* ── Safety note ── */}
      <p className="text-xs text-gray-400 border-t border-gray-100 pt-4 leading-relaxed">
        You are responsible for the accuracy of allergen and restriction tags.
        Only confirm tags you are certain about.
      </p>

      {/* ── Actions ── */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-blue-300 text-white shadow-sm transition-all"
        >
          {submitting ? 'Submitting…' : 'Submit Listing'}
        </button>
      </div>
    </div>
  )
}

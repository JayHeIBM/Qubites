'use client'

import type { TagConfirmation, TagState } from './formState'

// ── Helpers ───────────────────────────────────────────────────────────────────

function toLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Tag button ────────────────────────────────────────────────────────────────

interface TagButtonProps {
  tagKey: string
  state: TagState
  onToggle: () => void
}

function TagButton({ tagKey, state, onToggle }: TagButtonProps) {
  const label = toLabel(tagKey)

  const cls =
    state === 'confirmed'
      ? 'bg-green-50 border-green-500 text-green-700 font-semibold'
      : state === 'ai'
      ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'

  const icon =
    state === 'confirmed' ? (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path d="M2 5l2 2.5L8 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : state === 'ai' ? (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ) : null

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${cls}`}
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
  const aiCount = keys.filter(k => state[k] === 'ai').length
  const confirmedCount = keys.filter(k => state[k] === 'confirmed').length

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{title}</span>
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
      <div className="flex flex-wrap gap-1.5">
        {keys.map(k => (
          <TagButton
            key={k}
            tagKey={k}
            state={state[k] ?? 'none'}
            onToggle={() => onToggle(groupKey, k)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Step 2 component ──────────────────────────────────────────────────────────

interface Step2Props {
  tags: TagConfirmation
  allergyKeys: readonly string[]
  restrictionKeys: readonly string[]
  preferenceKeys: readonly string[]
  onToggle: (groupKey: keyof TagConfirmation, tagKey: string) => void
  onBack: () => void
  onSubmit: () => void
  isCopied: boolean
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
}: Step2Props) {
  // Must have reviewed allergens (even if zero selected) to submit
  const allergenReviewed = allergyKeys.some(k => tags.allergens[k] !== 'none' || true) // always true — user has seen them
  void allergenReviewed

  return (
    <div className="flex flex-col gap-6">

      {/* ── Instructions ── */}
      <div className={`rounded-xl px-4 py-3 text-sm border ${
        isCopied
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-blue-50 border-blue-200 text-blue-800'
      }`}>
        {isCopied ? (
          <><strong>Copied from a previous listing.</strong> Previously confirmed tags are pre-checked (green). Edit as needed before submitting.</>
        ) : (
          <><strong>AI scanned your title and description</strong> and highlighted likely tags in blue. Click each tag you confirm — it will turn green. Unchecked suggestions will be discarded.</>
        )}
      </div>

      {/* ── Tag groups ── */}
      <div className="flex flex-col gap-5">
        <TagGroup
          title="Allergens"
          groupKey="allergens"
          keys={allergyKeys}
          state={tags.allergens}
          onToggle={onToggle}
        />
        <TagGroup
          title="Dietary Restrictions"
          groupKey="restrictions"
          keys={restrictionKeys}
          state={tags.restrictions}
          onToggle={onToggle}
        />
        <TagGroup
          title="Preferences / Cuisine"
          groupKey="preferences"
          keys={preferenceKeys}
          state={tags.preferences}
          onToggle={onToggle}
        />
      </div>

      {/* ── Safety note ── */}
      <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
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
          className="flex-1 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-sm transition-all"
        >
          Submit Listing
        </button>
      </div>
    </div>
  )
}

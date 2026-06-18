import type { ListingType } from '@/app/components/food/types'

// ── Form state ────────────────────────────────────────────────────────────────

export interface NewListingForm {
  type: ListingType
  title: string
  portions: string          // kept as string for <input> binding, validated on submit
  availableUntil: string    // datetime-local string
  location: string
  description: string
  imageFile: File | null
  imagePreviewUrl: string | null
}

/** Returns a datetime-local string 2 hours from now, rounded to the next 15-min boundary. */
export function defaultExpiry(): string {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000)
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0)
  return d.toISOString().slice(0, 16)
}

export function makeEmptyForm(): NewListingForm {
  return {
    type: 'leftover',
    title: '',
    portions: '',
    availableUntil: defaultExpiry(),
    location: '',
    description: '',
    imageFile: null,
    imagePreviewUrl: null,
  }
}

/** @deprecated use makeEmptyForm() — kept for any remaining import references */
export const EMPTY_FORM: NewListingForm = {
  type: 'leftover',
  title: '',
  portions: '',
  availableUntil: '',
  location: '',
  description: '',
  imageFile: null,
  imagePreviewUrl: null,
}

// ── Tag confirmation state ────────────────────────────────────────────────────

/**
 * For each tag key (e.g. "gluten", "italian"):
 *   'ai'        — Ollama suggested, not yet confirmed by user
 *   'confirmed' — user explicitly checked it (green)
 *   'none'      — unselected
 */
export type TagState = 'ai' | 'confirmed' | 'none'

export interface TagConfirmation {
  allergens:    Record<string, TagState>
  restrictions: Record<string, TagState>
  preferences:  Record<string, TagState>
}

// ── Ollama tag fetch ──────────────────────────────────────────────────────────

interface FoodTagsApiResponse {
  allergens:    string[]
  restrictions: string[]
  cuisines:     string[]
  error?:       string
}

/**
 * Calls the `/api/food-tags` route (which calls Ollama) and converts the
 * response into a TagConfirmation with 'ai' on suggested keys.
 */
export async function fetchAiSuggestions(
  foodName: string,
  description: string,
  allergyKeys:      readonly string[],
  restrictionKeys:  readonly string[],
  preferenceKeys:   readonly string[],
): Promise<TagConfirmation> {
  const res = await fetch('/api/food-tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ foodName, description }),
  })

  if (!res.ok) {
    throw new Error(`Tag API error ${res.status}`)
  }

  const data = (await res.json()) as FoodTagsApiResponse

  if (data.error) {
    throw new Error(data.error)
  }

  // Ollama returns lowercase keys matching the .txt files / preferences.ts arrays.
  // Mark each key 'ai' if it appears in the response, 'none' otherwise.
  const toState = (keys: readonly string[], suggested: string[]): Record<string, TagState> =>
    Object.fromEntries(
      keys.map(k => [k, suggested.includes(k) ? 'ai' : 'none'] as [string, TagState])
    )

  return {
    allergens:    toState(allergyKeys,     data.allergens    ?? []),
    restrictions: toState(restrictionKeys, data.restrictions ?? []),
    preferences:  toState(preferenceKeys,  data.cuisines     ?? []),
  }
}

// ── Copy pre-fill ─────────────────────────────────────────────────────────────

/**
 * Builds a TagConfirmation pre-filled from a copied listing's tags.
 * All previously confirmed tags come in as 'confirmed' (green), rest 'none'.
 */
export function buildCopiedTagConfirmation(
  copiedTags: { label: string; kind: 'allergen' | 'restriction' | 'preference' }[],
  allergyKeys:      readonly string[],
  restrictionKeys:  readonly string[],
  preferenceKeys:   readonly string[],
): TagConfirmation {
  const toState = (keys: readonly string[], kind: 'allergen' | 'restriction' | 'preference') =>
    Object.fromEntries(
      keys.map(key => {
        const label = key.replace(/_/g, ' ').toLowerCase()
        const match = copiedTags.find(
          t => t.kind === kind && t.label.toLowerCase() === label
        )
        return [key, match ? 'confirmed' : 'none'] as [string, TagState]
      })
    )

  return {
    allergens:    toState(allergyKeys,     'allergen'),
    restrictions: toState(restrictionKeys, 'restriction'),
    preferences:  toState(preferenceKeys,  'preference'),
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function emptyTagConfirmation(
  allergyKeys:     readonly string[],
  restrictionKeys: readonly string[],
  preferenceKeys:  readonly string[],
): TagConfirmation {
  const none = (keys: readonly string[]) =>
    Object.fromEntries(keys.map(k => [k, 'none' as TagState]))
  return {
    allergens:    none(allergyKeys),
    restrictions: none(restrictionKeys),
    preferences:  none(preferenceKeys),
  }
}

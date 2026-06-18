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
 *   'ai'        — AI suggested, not yet confirmed by user
 *   'confirmed' — user explicitly checked it (green)
 *   'none'      — unselected (grey)
 */
export type TagState = 'ai' | 'confirmed' | 'none'

export interface TagConfirmation {
  allergens:    Record<string, TagState>
  restrictions: Record<string, TagState>
  preferences:  Record<string, TagState>
}

// ── AI suggestion simulator ───────────────────────────────────────────────────

/**
 * Very simple keyword-based AI simulation.
 * In production this would be replaced by a real model call to the backend.
 * Returns a TagConfirmation with 'ai' on plausible tags and 'none' elsewhere.
 */

const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  dairy:     ['cheese', 'cream', 'milk', 'butter', 'yogurt', 'ricotta', 'brie', 'feta'],
  milk:      ['milk', 'latte', 'cappuccino', 'dairy'],
  egg:       ['egg', 'omelette', 'frittata', 'quiche', 'mayo', 'mayonnaise'],
  peanut:    ['peanut', 'satay'],
  tree_nut:  ['nut', 'almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia'],
  soy:       ['soy', 'tofu', 'miso', 'edamame', 'tempeh'],
  wheat:     ['bread', 'pasta', 'flour', 'bagel', 'sandwich', 'wrap', 'pizza', 'noodle', 'sourdough'],
  gluten:    ['bread', 'pasta', 'flour', 'bagel', 'sandwich', 'wrap', 'pizza', 'noodle', 'sourdough', 'wheat', 'brownie', 'cake', 'cookie'],
  sesame:    ['sesame', 'tahini', 'hummus'],
  fish:      ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine', 'tilapia'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish', 'scallop', 'clam', 'oyster'],
  mustard:   ['mustard', 'hot dog'],
  coconut:   ['coconut'],
}

const RESTRICTION_KEYWORDS: Record<string, string[]> = {
  vegetarian: ['vegetarian', 'veggie', 'meatless', 'cheese', 'egg', 'pasta', 'pizza', 'salad', 'caprese', 'feta', 'fruit'],
  vegan:      ['vegan', 'plant-based', 'dairy-free', 'brownie vegan'],
  pescatarian:['fish', 'salmon', 'tuna', 'seafood', 'pescatarian'],
  halal:      ['halal'],
  kosher:     ['kosher'],
  no_beef:    ['chicken', 'turkey', 'pork', 'lamb', 'veggie', 'vegetarian', 'vegan'],
  no_pork:    ['chicken', 'turkey', 'beef', 'halal', 'kosher'],
}

const PREFERENCE_KEYWORDS: Record<string, string[]> = {
  american:      ['burger', 'hot dog', 'bbq', 'mac and cheese', 'brownie', 'cookie'],
  mexican:       ['taco', 'burrito', 'quesadilla', 'salsa', 'guacamole', 'enchilada'],
  italian:       ['pasta', 'lasagna', 'pizza', 'risotto', 'tiramisu', 'focaccia', 'carbonara', 'bolognese', 'pesto', 'bruschetta'],
  french:        ['baguette', 'croissant', 'macaron', 'quiche', 'brie', 'ratatouille', 'soufflé', 'crepe'],
  greek:         ['greek', 'gyro', 'tzatziki', 'feta', 'spanakopita', 'souvlaki'],
  mediterranean: ['hummus', 'falafel', 'tabbouleh', 'olive', 'pita', 'mediterranean', 'greek salad'],
  indian:        ['curry', 'biryani', 'naan', 'tikka', 'masala', 'dal', 'samosa', 'chutney', 'basmati'],
  chinese:       ['fried rice', 'dim sum', 'dumpling', 'wonton', 'noodle', 'kung pao', 'chow mein'],
  japanese:      ['sushi', 'ramen', 'tempura', 'miso', 'teriyaki', 'sashimi', 'onigiri', 'bento'],
  korean:        ['bibimbap', 'kimchi', 'korean', 'bulgogi', 'japchae', 'tteok'],
  thai:          ['pad thai', 'thai', 'green curry', 'tom yum', 'satay'],
  vietnamese:    ['pho', 'banh mi', 'spring roll', 'vietnamese'],
  brazilian:     ['churrasco', 'feijoada', 'brigadeiro', 'coxinha'],
  peruvian:      ['ceviche', 'peruvian', 'lomo saltado'],
}

function matchKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

function suggestGroup(
  text: string,
  keywordMap: Record<string, string[]>,
  allKeys: readonly string[],
): Record<string, TagState> {
  return Object.fromEntries(
    allKeys.map(key => [
      key,
      matchKeywords(text, keywordMap[key] ?? []) ? 'ai' : 'none',
    ])
  )
}

export function simulateAiSuggestions(
  title: string,
  description: string,
  allergyKeys: readonly string[],
  restrictionKeys: readonly string[],
  preferenceKeys: readonly string[],
): TagConfirmation {
  const text = `${title} ${description}`
  return {
    allergens:    suggestGroup(text, ALLERGEN_KEYWORDS,    allergyKeys),
    restrictions: suggestGroup(text, RESTRICTION_KEYWORDS, restrictionKeys),
    preferences:  suggestGroup(text, PREFERENCE_KEYWORDS,  preferenceKeys),
  }
}

/**
 * Builds a TagConfirmation pre-filled from a copied listing's tags.
 * All previously confirmed tags come in as 'confirmed' (green).
 */
export function buildCopiedTagConfirmation(
  copiedTags: { label: string; kind: 'allergen' | 'restriction' | 'preference' }[],
  allergyKeys: readonly string[],
  restrictionKeys: readonly string[],
  preferenceKeys: readonly string[],
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
    allergens:    toState(allergyKeys,      'allergen'),
    restrictions: toState(restrictionKeys,  'restriction'),
    preferences:  toState(preferenceKeys,   'preference'),
  }
}

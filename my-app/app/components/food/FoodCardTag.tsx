import type { FoodTag, ListingType } from './types'

/** Orange pill — allergen */
const ALLERGEN = 'bg-orange-50 text-orange-700 border border-orange-300'
/** Purple pill — dietary restriction */
const RESTRICTION = 'bg-purple-50 text-purple-700 border border-purple-200'
/** Green pill — cuisine / preference */
const PREFERENCE = 'bg-green-50 text-green-700 border border-green-200'

const KIND_STYLE: Record<FoodTag['kind'], string> = {
  allergen: ALLERGEN,
  restriction: RESTRICTION,
  preference: PREFERENCE,
}

/** Type badge shown inline in the meta line */
export const TYPE_BADGE: Record<ListingType, { label: string; cls: string }> = {
  leftover: {
    label: 'Leftover',
    cls: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  free_food: {
    label: 'Free Food',
    cls: 'bg-green-50 text-green-700 border border-green-200 font-bold',
  },
  other: {
    label: 'Other',
    cls: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
}

export function FoodCardTag({ tag }: { tag: FoodTag }) {
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${KIND_STYLE[tag.kind]}`}>
      {tag.label}
    </span>
  )
}

export function TypeBadge({ type }: { type: ListingType }) {
  const { label, cls } = TYPE_BADGE[type]
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

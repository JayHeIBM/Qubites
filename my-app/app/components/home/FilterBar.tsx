'use client'

export type FilterKey = 'allergens' | 'restrictions' | 'preferences' | 'claimable'

export interface ActiveFilters {
  allergens: boolean
  restrictions: boolean
  preferences: boolean
  claimable: boolean
}

interface FilterBarProps {
  active: ActiveFilters
  onToggle: (key: FilterKey) => void
  /** Total visible listings after filtering — shown in the "All" pill */
  visibleCount: number
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'allergens',    label: 'Hide my allergens' },
  { key: 'restrictions', label: 'My restrictions' },
  { key: 'preferences',  label: 'My preferences' },
  { key: 'claimable',    label: 'Claimable' },
]

/**
 * FilterBar
 * Horizontal scrollable pill row.
 * The "All" pill deactivates all filters; individual pills toggle additively.
 */
export default function FilterBar({ active, onToggle, visibleCount }: FilterBarProps) {
  const anyActive = active.allergens || active.restrictions || active.preferences || active.claimable

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {/* All pill */}
      <button
        onClick={() => {
          if (active.allergens)    onToggle('allergens')
          if (active.restrictions) onToggle('restrictions')
          if (active.preferences)  onToggle('preferences')
          if (active.claimable)    onToggle('claimable')
        }}
        className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
          !anyActive
            ? 'bg-orange-600 text-white border-orange-600'
            : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400 hover:text-orange-600'
        }`}
      >
        All
        <span className={`text-[10px] font-bold ${!anyActive ? 'text-orange-100' : 'text-gray-400'}`}>
          {visibleCount}
        </span>
      </button>

      {FILTERS.map(({ key, label }) => {
        const on = active[key]
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              on
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400 hover:text-orange-600'
            }`}
          >
            {on && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {label}
          </button>
        )
      })}
    </div>
  )
}

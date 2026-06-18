'use client'

import { useState, useMemo } from 'react'
import FoodCard from '@/app/components/food/FoodCard'
import { MOCK_LISTINGS, MOCK_USER } from '@/app/components/food/fixtures'
import FilterBar from '@/app/components/home/FilterBar'
import type { ActiveFilters, FilterKey } from '@/app/components/home/FilterBar'
import type { FoodListing } from '@/app/components/food/types'

// ── Filtering logic ───────────────────────────────────────────────────────────

/**
 * Returns true if the listing should be shown given the current filter state.
 *
 * Design-doc rules:
 *   - Fully claimed listings are always hidden.
 *   - Expired listings are always hidden.
 *   - "Hide my allergens"  → exclude listings that contain any of the user's allergens.
 *   - "My restrictions"    → exclude listings that violate the user's restrictions
 *                            (i.e. the listing has a restriction tag the user has set).
 *   - "My preferences"     → show ONLY listings that match at least one user preference.
 *   - Filters are additive: all active filters must pass simultaneously.
 */
function applyFilters(
  listing: FoodListing,
  filters: ActiveFilters,
  user: typeof MOCK_USER,
): boolean {
  // Always hide fully claimed
  if (listing.portionsClaimed >= listing.portionsTotal) return false

  // Always hide expired
  if (new Date(listing.expiresAt).getTime() <= Date.now()) return false

  const allergenLabels    = listing.tags.filter(t => t.kind === 'allergen').map(t => t.label)
  const restrictionLabels = listing.tags.filter(t => t.kind === 'restriction').map(t => t.label)
  const preferenceLabels  = listing.tags.filter(t => t.kind === 'preference').map(t => t.label)

  if (filters.allergens) {
    const clash = allergenLabels.some(l => user.allergens.includes(l))
    if (clash) return false
  }

  if (filters.restrictions) {
    const clash = restrictionLabels.some(l => user.restrictions.includes(l))
    if (clash) return false
  }

  if (filters.preferences) {
    const match = preferenceLabels.some(l => user.preferences.includes(l))
    if (!match) return false
  }

  if (filters.claimable) {
    if (!listing.userCanClaim) return false
  }

  return true
}

/**
 * Sort order per design doc:
 *   1. Free Food always at the top (open to all)
 *   2. Then by expiry ascending (soonest expiring first)
 */
function sortListings(listings: FoodListing[]): FoodListing[] {
  return [...listings].sort((a, b) => {
    if (a.type === 'free_food' && b.type !== 'free_food') return -1
    if (b.type === 'free_food' && a.type !== 'free_food') return 1
    return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  // TODO: replace MOCK_LISTINGS with backend fetch once auth + API are wired up
  const allListings = MOCK_LISTINGS
  const user = MOCK_USER

  const [filters, setFilters] = useState<ActiveFilters>({
    allergens:    false,
    restrictions: false,
    preferences:  false,
    claimable:    false,
  })

  function toggleFilter(key: FilterKey) {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const visibleListings = useMemo(
    () => sortListings(allListings.filter(l => applyFilters(l, filters, user))),
    [allListings, filters, user],
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:py-7 flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Available now</h1>
          <span className="text-sm text-gray-400">
            {visibleListings.length} listing{visibleListings.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Filter bar */}
        <FilterBar
          active={filters}
          onToggle={toggleFilter}
          visibleCount={visibleListings.length}
        />
      </div>

      {/* ── Feed ── */}
      {visibleListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🍽️</div>
          <p className="text-base font-semibold text-gray-700">No listings match your filters</p>
          <p className="text-sm text-gray-400 mt-1">
            Try removing a filter or check back soon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {visibleListings.map((listing) => (
            <FoodCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}

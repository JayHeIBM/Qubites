'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import FoodCard from '@/app/components/food/FoodCard'
import FilterBar from '@/app/components/home/FilterBar'
import type { ActiveFilters, FilterKey } from '@/app/components/home/FilterBar'
import type { FoodListing } from '@/app/components/food/types'

// ── API → FoodListing adapter ─────────────────────────────────────────────────

interface AvailabilityRow {
  id: string
  chefId: string
  quantity: number
  status: string
  description: string | null
  claimedCount: number
  createdAt: string
  expiresAt: string | null
  foodItem: {
    id: string
    name: string
    cuisines: string[]
    dietaryTags: string[]
    allergens: string[]
  }
}

interface UserProfile {
  id: string
  slackId: string
  name: string | null
  cuisines: string[]
  dietaryRestrictions: string[]
  allergies: string[]
}

interface AssignmentRow {
  food_availability_id: string
  user_id: string
  status: string
}

interface CurrentUser {
  id: string
  allergens: string[]
  restrictions: string[]
  preferences: string[]
}

/**
 * Maps an availability row to the FoodListing shape used by FoodCard.
 * assignedUserIds = the set of availability IDs assigned to the current user.
 */
function availabilityToListing(
  row: AvailabilityRow,
  currentUserId: string | null,
  assignedAvailIds: Set<string>
): FoodListing {
  const tags: FoodListing['tags'] = [
    ...row.foodItem.allergens.map((a) => ({ label: a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), kind: 'allergen' as const })),
    ...row.foodItem.dietaryTags.map((r) => ({ label: r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), kind: 'restriction' as const })),
    ...row.foodItem.cuisines.map((c) => ({ label: c.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), kind: 'preference' as const })),
  ]

  return {
    id: row.id,
    title: row.foodItem.name,
    type: 'leftover',
    location: 'See Slack message',
    postedAt: row.createdAt,
    expiresAt: row.expiresAt ?? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    description: row.description ?? undefined,
    tags,
    portionsTotal: row.quantity,
    portionsClaimed: row.claimedCount,
    userCanClaim: currentUserId != null && assignedAvailIds.has(row.id),
  }
}

// ── Filtering logic ───────────────────────────────────────────────────────────

function applyFilters(
  listing: FoodListing,
  filters: ActiveFilters,
  user: { allergens: string[]; restrictions: string[]; preferences: string[] }
): boolean {
  // Only hide when expired — the availability.status filter below handles fully-claimed
  if (new Date(listing.expiresAt).getTime() <= Date.now()) return false

  const allergenLabels = listing.tags.filter(t => t.kind === 'allergen').map(t => t.label.toLowerCase())
  const restrictionLabels = listing.tags.filter(t => t.kind === 'restriction').map(t => t.label.toLowerCase())
  const preferenceLabels = listing.tags.filter(t => t.kind === 'preference').map(t => t.label.toLowerCase())

  if (filters.allergens) {
    const userAllergenLabels = user.allergens.map(a => a.replace(/_/g, ' ').toLowerCase())
    if (allergenLabels.some(l => userAllergenLabels.includes(l))) return false
  }

  if (filters.restrictions) {
    const userRestrictionLabels = user.restrictions.map(r => r.replace(/_/g, ' ').toLowerCase())
    if (restrictionLabels.some(l => userRestrictionLabels.includes(l))) return false
  }

  if (filters.preferences) {
    const userPreferenceLabels = user.preferences.map(p => p.replace(/_/g, ' ').toLowerCase())
    if (!preferenceLabels.some(l => userPreferenceLabels.includes(l))) return false
  }

  if (filters.claimable) {
    if (!listing.userCanClaim) return false
  }

  return true
}

function sortListings(listings: FoodListing[]): FoodListing[] {
  return [...listings].sort((a, b) => {
    if (a.type === 'free_food' && b.type !== 'free_food') return -1
    if (b.type === 'free_food' && a.type !== 'free_food') return 1
    return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const [allListings, setAllListings] = useState<FoodListing[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ id: '', allergens: [], restrictions: [], preferences: [] })
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState<ActiveFilters>({
    allergens: false,
    restrictions: false,
    preferences: false,
    claimable: false,
  })

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.replace('/login')
          return
        }

        const slackId = authUser.user_metadata?.slack_id as string | undefined

        // Fetch availability and user profile in parallel
        const [availRes, userRes] = await Promise.all([
          fetch('/api/food-availability'),
          slackId ? fetch(`/api/users?slackId=${encodeURIComponent(slackId)}`) : Promise.resolve(null),
        ])

        const availability: AvailabilityRow[] = await availRes.json()
        const me: UserProfile | null = userRes && userRes.ok ? await userRes.json() : null

        // Fetch assignments for current user (to determine userCanClaim)
        let assignedAvailIds = new Set<string>()
        if (me) {
          const { data: myAssignments } = await supabase
            .from('food_assignments')
            .select('food_availability_id, status')
            .eq('user_id', me.id)
            .eq('status', 'pending')

          if (myAssignments) {
            assignedAvailIds = new Set(
              (myAssignments as AssignmentRow[]).map((a) => a.food_availability_id)
            )
          }
        }

        // Only show 'available' rows
        const availableRows = Array.isArray(availability)
          ? availability.filter((row) => row.status === 'available')
          : []

        const listings = availableRows.map((row) =>
          availabilityToListing(row, me?.id ?? null, assignedAvailIds)
        )

        if (me) {
          setCurrentUser({
            id: me.id,
            allergens: me.allergies,
            restrictions: me.dietaryRestrictions,
            preferences: me.cuisines,
          })
        }

        setAllListings(listings)
      } catch (err) {
        console.error('[home] Failed to load listings:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  function toggleFilter(key: FilterKey) {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleClaim = useCallback(async (availabilityId: string) => {
    if (!currentUser.id) return
    try {
      const res = await fetch(
        `/api/assignments/my-claim?availabilityId=${encodeURIComponent(availabilityId)}&userId=${encodeURIComponent(currentUser.id)}`
      )
      if (!res.ok) return
      const { token } = (await res.json()) as { token: string }
      router.push(`/confirm?token=${encodeURIComponent(token)}`)
    } catch {
      // ignore — button remains clickable for retry
    }
  }, [currentUser.id, router])

  const visibleListings = useMemo(
    () => sortListings(allListings.filter(l => applyFilters(l, filters, currentUser))),
    [allListings, filters, currentUser]
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-5 sm:py-7">
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-500 shadow-sm">
          Loading available meals…
        </div>
      </div>
    )
  }

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
            <FoodCard key={listing.id} listing={listing} onClaim={handleClaim} />
          ))}
        </div>
      )}
    </div>
  )
}

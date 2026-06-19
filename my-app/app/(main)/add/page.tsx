'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import FoodCard from '@/app/components/food/FoodCard'
import SearchBar from '@/app/components/add/SearchBar'
import type { FoodListing } from '@/app/components/food/types'

// ── API → FoodListing adapter ─────────────────────────────────────────────────

interface ChefMealRow {
  id: string
  name: string
  quantity: number
  status: string
  description: string | null
  createdAt: string
  expiresAt: string | null
  assignmentsCount: number
  foodItem: {
    id: string
    name: string
    cuisines: string[]
    dietaryTags: string[]
    allergens: string[]
  } | null
}

function chefMealToListing(row: ChefMealRow): FoodListing {
  const tags: FoodListing['tags'] = row.foodItem
    ? [
        ...row.foodItem.allergens.map((a) => ({
          label: a.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          kind: 'allergen' as const,
        })),
        ...row.foodItem.dietaryTags.map((r) => ({
          label: r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          kind: 'restriction' as const,
        })),
        ...row.foodItem.cuisines.map((c) => ({
          label: c.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          kind: 'preference' as const,
        })),
      ]
    : []

  return {
    id: row.id,
    title: row.name,
    type: 'leftover',
    location: '',
    postedAt: row.createdAt,
    expiresAt: row.expiresAt ?? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    description: row.description ?? undefined,
    tags,
    portionsTotal: row.quantity,
    portionsClaimed: row.assignmentsCount,
    userCanClaim: false,
    showCopy: true,
  }
}

// ── Search logic ──────────────────────────────────────────────────────────────

function matchesSearch(listing: FoodListing, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  return (
    listing.title.toLowerCase().includes(q) ||
    (listing.description?.toLowerCase().includes(q) ?? false)
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AddPage() {
  const router = useRouter()
  const [myId, setMyId] = useState<string | null>(null)
  const [myListings, setMyListings] = useState<FoodListing[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')


  // ── Load user + listings ──────────────────────────────────────────────────

  const loadListings = useCallback(async (userId: string) => {
    const mealsRes = await fetch(`/api/chef/meals?chefId=${encodeURIComponent(userId)}`)
    const data = (await mealsRes.json()) as { meals: ChefMealRow[] }
    setMyListings((data.meals ?? []).map(chefMealToListing))
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          router.replace('/login')
          return
        }

        const slackId = authUser.user_metadata?.slack_id as string | undefined
        if (!slackId) { setLoading(false); return }

        const usersRes = await fetch(`/api/users?slackId=${encodeURIComponent(slackId)}`)
        if (!usersRes.ok) { setLoading(false); return }
        const me = (await usersRes.json()) as { id: string; slackId: string }

        setMyId(me.id)
        await loadListings(me.id)
      } catch (err) {
        console.error('[add] Failed to load listings:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router, loadListings])

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = useMemo(
    () => myListings.filter((l) => matchesSearch(l, query)),
    [myListings, query]
  )

  function handleCopy(id: string) {
    router.push(`/add/new?copyFrom=${id}`)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-5 sm:py-7">
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-500 shadow-sm">
          Loading your listings…
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:py-7 flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My listings</h1>
            <p className="text-sm text-gray-400 mt-0.5">Your upload history</p>
          </div>

          <button
            onClick={() => router.push('/add/new')}
            className="flex-shrink-0 flex items-center gap-2 bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">New listing</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by name…"
        />
      </div>

      {query.trim() && (
        <p className="text-sm text-gray-400 -mt-2">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </p>
      )}

      {myListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📤</div>
          <p className="text-base font-semibold text-gray-700">No listings yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">
            Share your first meal with the office!
          </p>
          <button
            onClick={() => router.push('/add/new')}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Create your first listing
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-base font-semibold text-gray-700">No results</p>
          <p className="text-sm text-gray-400 mt-1">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filtered.map((listing) => (
            <FoodCard
              key={listing.id}
              listing={listing}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}
    </div>
  )
}

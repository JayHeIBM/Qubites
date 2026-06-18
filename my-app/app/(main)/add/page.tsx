'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import FoodCard from '@/app/components/food/FoodCard'
import { MOCK_MY_LISTINGS } from '@/app/components/food/fixtures'
import SearchBar from '@/app/components/add/SearchBar'
import type { FoodListing } from '@/app/components/food/types'

// ── Search logic ──────────────────────────────────────────────────────────────

/** Case-insensitive match against title and description. */
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

  // TODO: replace with backend fetch (current user's uploaded listings)
  const myListings = MOCK_MY_LISTINGS

  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () => myListings.filter(l => matchesSearch(l, query)),
    [myListings, query],
  )

  function handleCopy(id: string) {
    // TODO: pre-populate the new-listing form with the copied listing's data
    router.push(`/add/new?copyFrom=${id}`)
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

          {/* New listing CTA */}
          <button
            onClick={() => router.push('/add/new')}
            className="flex-shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">New listing</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Search bar */}
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by name or description…"
        />
      </div>

      {/* ── Results count ── */}
      {query.trim() && (
        <p className="text-sm text-gray-400 -mt-2">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* ── Grid ── */}
      {myListings.length === 0 ? (
        /* No uploads yet */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📤</div>
          <p className="text-base font-semibold text-gray-700">No listings yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">
            Share your first meal with the office!
          </p>
          <button
            onClick={() => router.push('/add/new')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Create your first listing
          </button>
        </div>
      ) : filtered.length === 0 ? (
        /* Search returned nothing */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-base font-semibold text-gray-700">No results</p>
          <p className="text-sm text-gray-400 mt-1">
            Try a different search term.
          </p>
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

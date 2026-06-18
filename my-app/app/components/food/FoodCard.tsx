'use client'

import { useEffect, useState } from 'react'
import type { FoodListing } from './types'
import { FoodCardTag, TypeBadge } from './FoodCardTag'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a "X min ago" / "X h ago" relative string. */
function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  return `${Math.floor(diff / 3600)}h ago`
}

/** Formats remaining seconds as "Xh Ym left" or "Xm left". */
function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Expired'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m left`
  if (m > 0) return `${m}m ${s}s left`
  return `${s}s left`
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Animated countdown — turns orange when < 30 min remain. */
function Countdown({ expiresAt }: { expiresAt: string }) {
  const [ms, setMs] = useState(() => new Date(expiresAt).getTime() - Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setMs(new Date(expiresAt).getTime() - Date.now())
    }, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const urgent = ms > 0 && ms < 30 * 60 * 1000
  const expired = ms <= 0

  return (
    <span
      className={`text-xs font-semibold tabular-nums ${
        expired ? 'text-gray-400' : urgent ? 'text-orange-500' : 'text-gray-500'
      }`}
    >
      {formatCountdown(ms)}
    </span>
  )
}

/** Claim-progress bar + portion label. */
function ProgressBar({
  total,
  claimed,
}: {
  total: number
  claimed: number
}) {
  const pct = total > 0 ? Math.min((claimed / total) * 100, 100) : 0
  const full = claimed >= total

  return (
    <div className="flex-1 min-w-0">
      <p className={`text-xs mb-1 ${full ? 'text-gray-400' : 'text-gray-500'}`}>
        {claimed} of {total} claimed
      </p>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            full ? 'bg-gray-300' : 'bg-blue-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface FoodCardProps {
  listing: FoodListing
  /** Called when the user presses Claim */
  onClaim?: (id: string) => void
  /** Called when the user presses Copy (Add tab) */
  onCopy?: (id: string) => void
}

/**
 * FoodCard
 * Displays a single food listing. Matches the design doc spec:
 *   - Photo (placeholder gradient if no imageUrl)
 *   - Title · type badge · location · posted time · countdown
 *   - Description (optional, 2-line clamp)
 *   - Allergen / restriction / preference tag pills
 *   - Claim-progress bar
 *   - Claim button (only when userCanClaim) OR Copy button (showCopy mode)
 */
export default function FoodCard({ listing, onClaim, onCopy }: FoodCardProps) {
  const {
    id,
    title,
    type,
    location,
    postedAt,
    expiresAt,
    description,
    imageUrl,
    portionsTotal,
    portionsClaimed,
    tags,
    userCanClaim,
    showCopy,
  } = listing

  const fulllyClaimed = portionsClaimed >= portionsTotal

  return (
    <article className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden w-full">

      {/* ── Photo ── */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-40 sm:h-48 object-cover"
        />
      ) : (
        <div className="w-full h-36 sm:h-44 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-5xl select-none">
          🍽️
        </div>
      )}

      {/* ── Body ── */}
      <div className="p-4 sm:p-5 flex flex-col gap-3">

        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
            {title}
          </h2>
          <Countdown expiresAt={expiresAt} />
        </div>

        {/* Meta row: type badge · location · posted */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <TypeBadge type={type} />
          <span>·</span>
          <span>{location}</span>
          <span>·</span>
          <span>Posted {relativeTime(postedAt)}</span>
          <span>·</span>
          <span>{portionsTotal - portionsClaimed} / {portionsTotal} portions left</span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <FoodCardTag key={`${tag.kind}-${tag.label}`} tag={tag} />
            ))}
          </div>
        )}

        {/* Footer: progress bar + action button */}
        <div className="flex items-center gap-3 pt-1">
          <ProgressBar total={portionsTotal} claimed={portionsClaimed} />

          {showCopy ? (
            <button
              onClick={() => onCopy?.(id)}
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-95 transition-all"
            >
              Copy
            </button>
          ) : fulllyClaimed ? (
            <button
              disabled
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              Claimed
            </button>
          ) : userCanClaim ? (
            <button
              onClick={() => onClaim?.(id)}
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 active:scale-95 text-white transition-all shadow-sm"
            >
              Claim
            </button>
          ) : (
            // Not yet selected in raffle — button is visible but disabled
            <button
              disabled
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              Claim
            </button>
          )}
        </div>

      </div>
    </article>
  )
}

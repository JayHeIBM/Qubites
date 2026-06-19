'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'

interface AssignmentDetail {
  id: string
  status: string
  food_item_id: string
  foodName: string
  imageUrl: string | null
  description: string | null
  cuisines: string[]
  dietaryTags: string[]
  allergens: string[]
}

function toLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function TagPill({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${color}`}>
      {label}
    </span>
  )
}

function ConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [detail, setDetail] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      router.replace('/home')
      return
    }

    // Verify token client-side to get assignmentId, then fetch assignment detail
    async function loadData() {
      try {
        // Verify via API (server holds the secret)
        const verifyRes = await fetch(`/api/meal-links/verify?token=${encodeURIComponent(token!)}`)
        if (!verifyRes.ok) {
          setError('This link is invalid or has expired.')
          setLoading(false)
          return
        }

        const payload = (await verifyRes.json()) as { mealWindowId: string; userId: string }
        const assignmentId = payload.mealWindowId

        // Load assignment + food item details
        const res = await fetch(`/api/claims?assignmentId=${encodeURIComponent(assignmentId)}`)
        if (!res.ok) {
          setError('Could not load meal details.')
          setLoading(false)
          return
        }

        const data = (await res.json()) as AssignmentDetail
        setDetail(data)

        if (data.status === 'claimed') {
          setClaimed(true)
        }
      } catch {
        setError('Something went wrong loading your meal.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [token, router])

  async function handleClaim() {
    if (!detail || !token) return
    setClaiming(true)
    setError('')
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: detail.id, token }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Something went wrong.')
        setClaiming(false)
        return
      }
      setClaimed(true)
    } catch {
      setError('Network error. Please try again.')
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-orange-400 text-lg">Loading…</div>
      </div>
    )
  }

  if (error && !detail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-red-100">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link expired or invalid</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Link href="/home" className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-3 rounded-2xl transition-all active:scale-95">
            Go home
          </Link>
        </div>
      </div>
    )
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-orange-100">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-orange-900 mb-2">You&apos;re all set!</h1>
          <p className="text-gray-500 mb-2">
            Enjoy your <span className="font-semibold text-orange-700">{detail?.foodName}</span>!
          </p>
          <p className="text-sm text-orange-400 mb-8">Head over to the pickup spot when it&apos;s ready.</p>
          <Link href="/home" className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-3 rounded-2xl transition-all active:scale-95">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full border border-orange-100">
        <Link href="/home" className="text-orange-400 hover:text-orange-600 text-sm mb-6 inline-block transition-colors">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-orange-900 mb-1">Confirm your claim</h1>
        <p className="text-sm text-gray-400 mb-6">You have been matched with this meal.</p>

        {/* Meal image */}
        <div className="w-full h-44 rounded-2xl overflow-hidden mb-5">
          {detail?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={detail.imageUrl} alt={detail.foodName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-4xl select-none">
              🍽️
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold text-orange-900 mb-1">{detail?.foodName}</h2>
        {detail?.description && (
          <p className="text-gray-500 text-sm mb-4">{detail.description}</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {detail?.allergens.map((a) => (
            <TagPill key={a} label={toLabel(a)} color="bg-orange-50 border-orange-200 text-orange-700" />
          ))}
          {detail?.dietaryTags.map((r) => (
            <TagPill key={r} label={toLabel(r)} color="bg-purple-50 border-purple-200 text-purple-700" />
          ))}
          {detail?.cuisines.map((c) => (
            <TagPill key={c} label={toLabel(c)} color="bg-green-50 border-green-200 text-green-700" />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4">{error}</p>
        )}

        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95 shadow-md"
        >
          {claiming ? 'Claiming…' : 'Confirm Claim ✓'}
        </button>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-orange-400 text-lg">Loading…</div>
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  )
}

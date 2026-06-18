'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import DietaryTag from '../components/DietaryTag'
import Link from 'next/link'

interface Meal {
  id: string
  name: string
  description: string
  quantity: number
  dietary_tags: string[]
  image_url?: string | null
}

function ConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mealId = searchParams.get('mealId')

  const [meal, setMeal] = useState<Meal | null>(null)
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!mealId) {
      router.replace('/')
      return
    }

    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      setUserId(user.id)
      setUserName(
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        'You'
      )

      const { data: mealData, error: mealErr } = await supabase
        .from('meal_windows')
        .select('id, name, description, quantity, dietary_tags, image_url')
        .eq('id', mealId)
        .maybeSingle()

      if (mealErr || !mealData) { router.replace('/'); return }
      setMeal(mealData)
      setLoading(false)
    }

    loadData()
  }, [mealId, router])

  async function handleClaim() {
    if (!meal || !userId) return
    setClaiming(true)
    setError('')
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal_window_id: meal.id }),
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-blue-400 text-lg">Loading…</div>
      </div>
    )
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-blue-100">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-blue-900 mb-2">You&apos;re all set!</h1>
          <p className="text-gray-500 mb-2">
            Enjoy your <span className="font-semibold text-blue-700">{meal?.name}</span>!
          </p>
          <p className="text-sm text-blue-400 mb-8">Head over to the pickup spot when it&apos;s ready.</p>
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-2xl transition-all active:scale-95"
          >
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full border border-blue-100">
        <Link href="/" className="text-blue-400 hover:text-blue-600 text-sm mb-6 inline-block transition-colors">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-blue-900 mb-1">Confirm your claim</h1>
        <p className="text-gray-400 text-sm mb-6">Claiming as <span className="font-semibold text-blue-600">{userName}</span></p>

        {meal?.image_url ? (
          <img src={meal.image_url} alt={meal.name} className="w-full h-40 object-cover rounded-2xl mb-5" />
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-4xl mb-5">
            🍲
          </div>
        )}

        <h2 className="text-xl font-bold text-blue-900 mb-1">{meal?.name}</h2>
        <p className="text-gray-500 text-sm mb-4">{meal?.description}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {(meal?.dietary_tags ?? []).map((tag) => (
            <DietaryTag key={tag} tag={tag} />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4">{error}</p>
        )}

        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95 shadow-md"
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-blue-400 text-lg">Loading…</div>
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  )
}

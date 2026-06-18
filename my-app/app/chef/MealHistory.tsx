'use client'

import { useEffect, useState } from 'react'
import DietaryTag from '../components/DietaryTag'

interface MealRow {
  id: string
  name: string
  available_from: string
  quantity: number
  dietary_tags: string[]
  claims_count: number
}

export default function MealHistory() {
  const [meals, setMeals] = useState<MealRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/chef/meals')
      .then((r) => r.json())
      .then((data) => { setMeals(data.meals ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-sm text-blue-300">Loading history…</p>
  }

  if (meals.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📋</div>
        <p className="text-gray-400 text-sm">No meals added yet. Add your first one above!</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-blue-100 text-left text-blue-400 text-xs uppercase tracking-wide">
            <th className="pb-3 pr-4 font-semibold">Meal</th>
            <th className="pb-3 pr-4 font-semibold">Date</th>
            <th className="pb-3 pr-4 font-semibold">Qty</th>
            <th className="pb-3 pr-4 font-semibold">Claims</th>
            <th className="pb-3 font-semibold">Tags</th>
          </tr>
        </thead>
        <tbody>
          {meals.map((meal) => (
            <tr key={meal.id} className="border-b border-blue-50 hover:bg-blue-50 transition-colors">
              <td className="py-3 pr-4 font-semibold text-blue-900">{meal.name}</td>
              <td className="py-3 pr-4 text-gray-500">
                {new Date(meal.available_from).toLocaleDateString([], {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </td>
              <td className="py-3 pr-4 text-gray-600">{meal.quantity}</td>
              <td className="py-3 pr-4">
                <span className="bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full text-xs">
                  {meal.claims_count}
                </span>
              </td>
              <td className="py-3">
                <div className="flex flex-wrap gap-1">
                  {(meal.dietary_tags ?? []).slice(0, 3).map((tag) => (
                    <DietaryTag key={tag} tag={tag} />
                  ))}
                  {meal.dietary_tags?.length > 3 && (
                    <span className="text-xs text-gray-400">+{meal.dietary_tags.length - 3}</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

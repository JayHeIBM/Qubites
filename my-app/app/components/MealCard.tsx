import Link from 'next/link'
import DietaryTag from './DietaryTag'

interface Meal {
  id: string
  name: string
  description: string
  quantity: number
  dietary_tags: string[]
  image_url?: string | null
  available_from: string
  available_until: string
}

interface MealCardProps {
  meal: Meal
}

export default function MealCard({ meal }: MealCardProps) {
  const until = new Date(meal.available_until).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-blue-100">
      {meal.image_url && (
        <img
          src={meal.image_url}
          alt={meal.name}
          className="w-full h-56 object-cover"
        />
      )}
      {!meal.image_url && (
        <div className="w-full h-40 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-6xl">
          🍲
        </div>
      )}
      <div className="p-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">{meal.name}</h1>
        <p className="text-gray-600 text-base mb-5">{meal.description}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {(meal.dietary_tags ?? []).map((tag) => (
            <DietaryTag key={tag} tag={tag} />
          ))}
        </div>

        <div className="flex items-center justify-between mb-8">
          <span className="text-sm text-blue-400 font-medium">
            🕐 Available until {until}
          </span>
          <span className="text-sm bg-blue-50 text-blue-700 font-semibold px-3 py-1 rounded-full border border-blue-200">
            {meal.quantity} serving{meal.quantity !== 1 ? 's' : ''} left
          </span>
        </div>

        <Link
          href={`/confirm?mealId=${meal.id}`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl text-lg shadow-md hover:shadow-lg"
        >
          Claim this meal →
        </Link>
      </div>
    </div>
  )
}

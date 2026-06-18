import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import MealCard from './components/MealCard'
import Navbar from './components/Navbar'

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options: Parameters<typeof cookieStore.set>[2]
          }>
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const now = new Date().toISOString()
  const { data: meal } = await supabase
    .from('meal_windows')
    .select('*')
    .eq('is_active', true)
    .lte('available_from', now)
    .gte('available_until', now)
    .order('available_from', { ascending: false })
    .limit(1)
    .maybeSingle()

  const userDisplayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    'User'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Navbar userName={userDisplayName} />
      <main className="mx-auto max-w-2xl px-4 py-12">
        {meal ? (
          <MealCard meal={meal} />
        ) : (
          <div className="py-24 text-center">
            <div className="mb-4 text-6xl">🍽️</div>
            <h2 className="mb-2 text-2xl font-bold text-blue-900">
              No meal available right now
            </h2>
            <p className="text-blue-500">
              Check back soon — something delicious is on its way!
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

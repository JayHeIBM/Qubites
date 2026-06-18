import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Navbar from './components/Navbar'
import MealCard from './components/MealCard'

<<<<<<< HEAD
import { FormEvent, useState } from "react";

type FoodTagsResponse = {
  allergens?: string[];
  restrictions?: string[];
  cuisines?: string[];
  error?: string;
  ollamaOutput?: string;
};

export default function Home() {
  const [foodName, setFoodName] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<FoodTagsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/food-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          foodName,
          description: description || undefined,
        }),
      });

      const data = (await response.json()) as FoodTagsResponse;
      setResult(data);
    } catch {
      setResult({ error: "Failed to call the Ollama API." });
    } finally {
      setIsLoading(false);
=======
export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
>>>>>>> 5623810 (Slicka)
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
<<<<<<< HEAD
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Ollama local model test
          </p>
          <h1 className="text-3xl font-semibold">Food tag classifier</h1>
          <p className="text-sm text-zinc-600">
            Enter a food name and optional description to classify allergens,
            restrictions, and cuisines.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="foodName">
              Food name
            </label>
            <input
              id="foodName"
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-500"
              value={foodName}
              onChange={(event) => setFoodName(event.target.value)}
              placeholder="Chicken tikka masala"
              required
            />
=======
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Navbar userName={userDisplayName} />
      <main className="max-w-2xl mx-auto px-4 py-12">
        {meal ? (
          <MealCard meal={meal} />
        ) : (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-2xl font-bold text-blue-900 mb-2">No meal available right now</h2>
            <p className="text-blue-500">Check back soon — something delicious is on its way!</p>
>>>>>>> 5623810 (Slicka)
          </div>
        )}
      </main>
    </div>
  )
}

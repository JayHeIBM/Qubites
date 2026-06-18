'use client'

import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const supabase = createClient()

  async function handleSlackSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'slack',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <h1 className="text-4xl font-bold text-blue-700 tracking-tight">
          Qubites 🍽️
        </h1>
        <p className="text-gray-500 text-base text-center">
          Fresh food, just for you.
        </p>
        <button
          onClick={handleSlackSignIn}
          className="mt-2 w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 text-base"
        >
          Sign in with Slack
        </button>
      </div>
    </main>
  )
}

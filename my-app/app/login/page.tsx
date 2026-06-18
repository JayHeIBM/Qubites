'use client'

import { createClient } from '@/lib/supabase-browser'
import QubitesBrand from '../components/QubitesBrand'
import SlackSignInButton from '../components/SlackSignInButton'

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
      <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center gap-8 w-full max-w-sm">
        <QubitesBrand />
        <SlackSignInButton onClick={handleSlackSignIn} />
      </div>
    </main>
  )
}

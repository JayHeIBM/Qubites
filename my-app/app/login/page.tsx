'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QubitesBrand from '../components/QubitesBrand'
import SlackSignInButton from '../components/SlackSignInButton'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function handleSlackSignIn() {
    setLoading(true)
    // TODO: replace with real Slack OAuth once auth is implemented
    router.push('/onboarding')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col items-center gap-8 w-full max-w-xs sm:max-w-sm">
        <QubitesBrand />
        <SlackSignInButton onClick={handleSlackSignIn} loading={loading} />
      </div>
    </main>
  )
}
